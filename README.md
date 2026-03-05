# Foundry Agent App Service

A production-ready chat frontend for Azure AI Foundry Prompt Agents, deployed to Azure App Service.

## Quick Start (Local Development)

**Prerequisites:** Node.js 20+, Azure CLI logged in (`az login`)

```bash
npm install
```

Create a `.env.local` file:

```
AZURE_AI_PROJECT_ENDPOINT=https://<resource>.services.ai.azure.com/api/projects/<project>
AZURE_AI_AGENT_NAME=<your-agent-name>
OPENAI_API_VERSION=2025-05-01-preview
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Azure

**Prerequisites:** Azure CLI, Azure Developer CLI (`azd`)

```bash
# Option 1: Deploy with azd
azd env set AZURE_AI_PROJECT_ENDPOINT "https://..."
azd env set AZURE_AI_AGENT_NAME "your-agent-name"
azd env set AZURE_LOCATION "eastus"
azd env set AZURE_APP_NAME "my-agent-chat"
azd up

# Option 2: Deploy Day 1 app
./deploy-day1.sh \
  --resource-group my-rg \
  --app-name my-agent-chat \
  --foundry-endpoint "https://..." \
  --agent-name "your-agent-name"
```

## Project Structure

```
├── src/
│   ├── app/api/chat/       # Backend API route (Foundry proxy)
│   ├── components/chat/    # Chat UI components
│   ├── components/admin/   # Admin eject banner
│   ├── lib/                # Foundry client (DefaultAzureCredential)
│   └── custom/             # Your custom tools and styles go here
├── infra/                  # Bicep templates (App Service, Identity, RBAC)
├── .devcontainer/          # Dev Container for zero-install setup
├── copilot-instructions.md # AI coding agent rules
└── azure.yaml              # azd service mapping
```

## Customization

- **Add custom tools:** `src/custom/tools/`
- **Override branding:** `src/custom/styles/`
- **AI-assisted coding:** Open in VS Code — `copilot-instructions.md` guides your AI coding agent on the architecture.
