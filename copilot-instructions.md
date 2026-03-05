# Foundry Agent App Service — Copilot Instructions

## Architecture

This is a **Next.js App Router** full-stack application deployed to **Azure App Service** as a Linux container. It serves as the frontend for an **Azure AI Foundry Prompt Agent**.

- **Frontend:** React components in `src/components/`. Styled with Tailwind CSS.
- **Backend API:** Next.js API routes in `src/app/api/`. Proxies requests to the Foundry Agent.
- **Authentication:** Azure App Service Easy Auth (Entra ID). The backend reads user identity from `X-MS-CLIENT-PRINCIPAL-NAME` headers.
- **Agent Communication:** Uses raw HTTP calls to the Foundry project endpoint with `DefaultAzureCredential` (via `getBearerTokenProvider`) for authentication. Token audience is `https://ai.azure.com/.default`.
- **Infrastructure:** Bicep templates in `infra/`. Deployed via `azd up`.

## API Pattern

The Foundry Prompt Agent uses two endpoints:

1. **Create Conversation:** `POST {AZURE_AI_PROJECT_ENDPOINT}/conversations?api-version=v1`
   - Body: `{ "items": [{ "type": "message", "role": "user", "content": "..." }] }`
   - Returns: `{ "id": "conv_...", "object": "conversation" }`

2. **Generate Response:** `POST {AZURE_AI_PROJECT_ENDPOINT}/openai/v1/responses`
   - Body: `{ "conversation": "conv_...", "agent_reference": { "name": "...", "version": "...", "type": "agent_reference" } }`
   - Returns: Response with `output` array containing message items with `output_text` content parts.

**Important:** The conversations endpoint uses query-param versioning (`?api-version=v1`), while the responses endpoint uses path-based versioning (`/openai/v1/responses`).

## Key Files

| File | Purpose |
|---|---|
| `src/app/api/chat/route.ts` | API route that creates Foundry conversations and gets agent responses. Streams results via SSE. |
| `src/lib/foundry-client.ts` | HTTP helper using `DefaultAzureCredential` with `getBearerTokenProvider` (audience: `https://ai.azure.com/.default`). |
| `src/components/chat/chat-window.tsx` | Main chat container managing messages, conversations, and streaming state. |
| `src/components/chat/message-bubble.tsx` | Renders individual messages with markdown support. |
| `src/components/chat/input-bar.tsx` | User input textarea with Enter-to-send. |
| `src/components/chat/feedback.tsx` | Thumbs up/down feedback buttons. |
| `src/components/admin/eject-banner.tsx` | Admin banner for the "Eject to Source Code" flow. |
| `infra/main.bicep` | Bicep template defining App Service, Managed Identity, Easy Auth, and RBAC. |
| `azure.yaml` | Azure Developer CLI service mapping. |

## Rules

1. **NEVER use API keys or connection strings.** Always use `DefaultAzureCredential` from `@azure/identity`. In production, this resolves to the App Service's System-Assigned Managed Identity. Locally, it uses `az login`.
2. **All Foundry API calls must go through the backend** (`src/app/api/`). Never call the Foundry Agent directly from the browser.
3. **Token audience must be `https://ai.azure.com/.default`** — not `https://cognitiveservices.azure.com/.default`.
4. **Custom API integrations** should be added in `src/custom/tools/`. Create a new file per tool (e.g., `src/custom/tools/weather.ts`). Wire it into the API route.
5. **Custom branding and style overrides** should be placed in `src/custom/styles/`. Import them in `src/app/globals.css`.
6. **Infrastructure changes** should be made in `infra/main.bicep`. Always deploy with `azd up`.
7. **Environment variables** are defined in `infra/main.bicep` as `appSettings`. Locally, use a `.env.local` file (never commit this file).

## Environment Variables

| Variable | Description |
|---|---|
| `AZURE_AI_PROJECT_ENDPOINT` | Full Foundry project endpoint (e.g., `https://<resource>.services.ai.azure.com/api/projects/<project>`) |
| `AZURE_AI_AGENT_NAME` | Name of the Foundry prompt agent |
| `AZURE_AI_AGENT_VERSION` | Version of the agent (default: `"1"`) |
| `OPENAI_API_VERSION` | Azure OpenAI API version (e.g., `2025-05-01-preview`) |

## Deployment

```bash
# First-time setup
azd init
azd env set AZURE_AI_PROJECT_ENDPOINT "https://your-project.services.ai.azure.com/api/projects/..."
azd env set AZURE_AI_AGENT_NAME "your-agent-name"
azd env set AZURE_LOCATION "eastus"
azd env set AZURE_APP_NAME "my-agent-chat"

# Deploy
azd up
```

## Adding a Custom Tool

To add a custom API tool that the chat interface can invoke:

1. Create a new file: `src/custom/tools/my-tool.ts`
2. Export a handler function.
3. Create a new API route: `src/app/api/tools/my-tool/route.ts`
4. Wire it into the chat workflow from `src/components/chat/chat-window.tsx`.
