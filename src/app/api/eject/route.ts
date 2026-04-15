import { NextResponse } from "next/server";

const TEMPLATE_REPO =
  process.env.EJECT_TEMPLATE_REPO || "https://github.com/seligj95/easy-app-demo";

export async function GET() {
  // App Service auto-injects these env vars at runtime
  const appName = process.env.WEBSITE_SITE_NAME || "";
  const resourceGroup = process.env.WEBSITE_RESOURCE_GROUP || "";
  const location = process.env.REGION_NAME || "";

  // These are set via Bicep app settings
  const foundryEndpoint = process.env.AZURE_AI_PROJECT_ENDPOINT || "";
  const agentName = process.env.AZURE_AI_AGENT_NAME || "";
  const skuName = process.env.AZURE_SKU || "B1";
  const entraClientId = process.env.AZURE_ENTRA_CLIENT_ID || "";

  const envFileContent = [
    `AZURE_APP_NAME=${appName}`,
    `AZURE_RESOURCE_GROUP=${resourceGroup}`,
    `AZURE_LOCATION=${location}`,
    `AZURE_AI_PROJECT_ENDPOINT=${foundryEndpoint}`,
    `AZURE_AI_AGENT_NAME=${agentName}`,
    `AZURE_SKU=${skuName}`,
    `AZURE_ENTRA_CLIENT_ID=${entraClientId}`,
  ].join("\n");

  const cloneCommand = [
    `git clone ${TEMPLATE_REPO} my-agent-ui`,
    `cd my-agent-ui`,
    `mkdir -p .azure/dev`,
    `cat > .azure/dev/.env << 'EOF'`,
    envFileContent,
    `EOF`,
  ].join(" \\\n  && ");

  return NextResponse.json({
    cloneCommand,
    envFileContent,
    templateRepo: TEMPLATE_REPO,
  });
}
