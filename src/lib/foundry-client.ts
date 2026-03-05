import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

const credential = new DefaultAzureCredential();
const tokenProvider = getBearerTokenProvider(credential, "https://ai.azure.com/.default");

export function getProjectEndpoint(): string {
  const endpoint = process.env.AZURE_AI_PROJECT_ENDPOINT;
  if (!endpoint) {
    throw new Error("AZURE_AI_PROJECT_ENDPOINT environment variable is not set.");
  }
  return endpoint;
}

export async function foundryFetch(path: string, body: Record<string, unknown>, usePathVersion = false): Promise<Response> {
  const endpoint = getProjectEndpoint();
  const token = await tokenProvider();
  const url = usePathVersion
    ? `${endpoint}${path}`
    : `${endpoint}${path}?api-version=v1`;

  // Retry once on transient network errors (ECONNRESET)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (attempt === 0) continue;
      throw err;
    }
  }
  throw new Error("Unreachable");
}

export function getAgentName(): string {
  const agentName = process.env.AZURE_AI_AGENT_NAME;
  if (!agentName) {
    throw new Error("AZURE_AI_AGENT_NAME environment variable is not set.");
  }
  return agentName;
}

export function getAgentVersion(): string {
  return process.env.AZURE_AI_AGENT_VERSION || "1";
}
