import { foundryFetch, getAgentName, getAgentVersion } from "@/lib/foundry-client";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { message, conversationId } = await req.json();

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const agentName = getAgentName();
  const agentVersion = getAgentVersion();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Create a conversation with the user message
        const convRes = await foundryFetch("/conversations", {
          items: [{ type: "message", role: "user", content: message }],
        });

        if (!convRes.ok) {
          const errBody = await convRes.text();
          throw new Error(`Conversation create failed (${convRes.status}): ${errBody}`);
        }

        const conversation = await convRes.json();
        const currentConversationId = conversation.id;

        // Send the conversationId so the client can reuse it
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "conversationId", conversationId: currentConversationId })}\n\n`
          )
        );

        // Step 2: Generate a response using the agent
        // The responses endpoint uses path-based versioning: /openai/v1/responses
        const respRes = await foundryFetch("/openai/v1/responses", {
          conversation: currentConversationId,
          agent_reference: {
            name: agentName,
            version: agentVersion,
            type: "agent_reference",
          },
        }, true);

        if (!respRes.ok) {
          const errBody = await respRes.text();
          throw new Error(`Response create failed (${respRes.status}): ${errBody}`);
        }

        const agentResponse = await respRes.json();

        // Extract text content from the response — try multiple known shapes
        let content = "";
        if (typeof agentResponse.output_text === "string") {
          content = agentResponse.output_text;
        } else if (typeof agentResponse.output === "string") {
          content = agentResponse.output;
        } else if (agentResponse.output?.length) {
          // Responses API returns output as array of items
          for (const item of agentResponse.output) {
            if (item.type === "message" && item.content) {
              for (const part of item.content) {
                if (part.type === "output_text" || part.type === "text") {
                  content += part.text || part.value || "";
                }
              }
            }
          }
        } else if (agentResponse.choices?.length) {
          content = agentResponse.choices[0]?.message?.content || "";
        }

        if (!content) {
          content = JSON.stringify(agentResponse);
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "content", content })}\n\n`
          )
        );

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("Chat API error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
