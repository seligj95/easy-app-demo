import { NextResponse } from "next/server";

const TEMPLATE_REPO =
  process.env.EJECT_TEMPLATE_REPO || "https://github.com/seligj95/easy-app-demo";

// Extract "owner/repo" from full URL for gh CLI
const TEMPLATE_SLUG = TEMPLATE_REPO.replace("https://github.com/", "");

export async function GET() {
  // App Service auto-injects these env vars at runtime
  const appName = process.env.WEBSITE_SITE_NAME || "";
  const resourceGroup = process.env.WEBSITE_RESOURCE_GROUP || "";
  const location = process.env.REGION_NAME || "";

  // WEBSITE_OWNER_NAME format: "subscriptionId+rgName-regionwebspace"
  const ownerName = process.env.WEBSITE_OWNER_NAME || "";
  const subscriptionId = ownerName.split("+")[0] || "";

  // These are set via Bicep app settings
  const foundryEndpoint = process.env.AZURE_AI_PROJECT_ENDPOINT || "";
  const agentName = process.env.AZURE_AI_AGENT_NAME || "";
  const skuName = process.env.AZURE_SKU || "B1";
  const entraClientId = process.env.AZURE_ENTRA_CLIENT_ID || "";

  const envFileContent = [
    `AZURE_ENV_NAME=dev`,
    `AZURE_SUBSCRIPTION_ID=${subscriptionId}`,
    `AZURE_APP_NAME=${appName}`,
    `AZURE_RESOURCE_GROUP=${resourceGroup}`,
    `AZURE_LOCATION=${location}`,
    `AZURE_AI_PROJECT_ENDPOINT=${foundryEndpoint}`,
    `AZURE_AI_AGENT_NAME=${agentName}`,
    `AZURE_SKU=${skuName}`,
    `AZURE_ENTRA_CLIENT_ID=${entraClientId}`,
  ].join("\n");

  const forkCommand = [
    `gh repo fork ${TEMPLATE_SLUG} --clone -- my-agent-ui \\`,
    `  && cd my-agent-ui \\`,
    `  && mkdir -p .azure/dev \\`,
    `  && echo '{"version":1,"defaultEnvironment":"dev"}' > .azure/config.json \\`,
    `  && cat > .azure/dev/.env << 'EOF'`,
    envFileContent,
    `EOF`,
  ].join("\n");

  return NextResponse.json({
    forkCommand,
    envFileContent,
    templateRepo: TEMPLATE_REPO,
    templateSlug: TEMPLATE_SLUG,
  });
}
