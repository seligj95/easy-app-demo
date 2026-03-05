#!/bin/bash
# deploy-day1.sh — Simulates the "Publish Chat UI" button from the Foundry Portal.
# This script deploys the Day 1 managed container to Azure App Service.
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - A pre-existing Foundry Project with a deployed Agent
#
# Usage:
#   ./deploy-day1.sh \
#     --resource-group <rg-name> \
#     --app-name <app-name> \
#     --foundry-endpoint <endpoint-url> \
#     --agent-name <agent-name> \
#     [--sku B1|S1|P1v3] \
#     [--entra-client-id <client-id>] \
#     [--location <azure-region>]

set -euo pipefail

# Defaults
SKU="B1"
ENTRA_CLIENT_ID=""
LOCATION="eastus2"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    --app-name) APP_NAME="$2"; shift 2 ;;
    --foundry-endpoint) FOUNDRY_ENDPOINT="$2"; shift 2 ;;
    --agent-name) AGENT_NAME="$2"; shift 2 ;;
    --sku) SKU="$2"; shift 2 ;;
    --entra-client-id) ENTRA_CLIENT_ID="$2"; shift 2 ;;
    --location) LOCATION="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Validate required parameters
if [[ -z "${RESOURCE_GROUP:-}" || -z "${APP_NAME:-}" || -z "${FOUNDRY_ENDPOINT:-}" || -z "${AGENT_NAME:-}" ]]; then
  echo "Error: --resource-group, --app-name, --foundry-endpoint, and --agent-name are required."
  exit 1
fi

echo "=== Deploying Day 1 Agent Chat UI ==="
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Name:       $APP_NAME"
echo "  Location:       $LOCATION"
echo "  SKU:            $SKU"
echo "  Agent:          $AGENT_NAME"
echo "  Foundry:        $FOUNDRY_ENDPOINT"
echo ""

# Create resource group if it doesn't exist
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none 2>/dev/null || true

# Deploy the Bicep template
az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$(dirname "$0")/infra/main.bicep" \
  --parameters \
    appName="$APP_NAME" \
    location="$LOCATION" \
    foundryEndpoint="$FOUNDRY_ENDPOINT" \
    agentName="$AGENT_NAME" \
    skuName="$SKU" \
    entraClientId="$ENTRA_CLIENT_ID" \
  --output json

echo ""
echo "=== Deployment Complete ==="
echo "Your Agent Chat UI is live at: https://${APP_NAME}.azurewebsites.net"
echo ""
if [[ -z "$ENTRA_CLIENT_ID" ]]; then
  echo "Note: Easy Auth was not configured. To add Entra ID authentication,"
  echo "re-run with --entra-client-id <your-app-registration-client-id>."
fi
