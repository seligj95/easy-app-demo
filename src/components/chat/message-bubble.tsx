"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Feedback } from "./feedback";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || "..."}
            </ReactMarkdown>
          </div>
        )}
        {!isUser && message.content && (
          <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
            <Feedback messageId={message.id} />
          </div>
        )}
      </div>
    </div>
  );
}
