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
#     [--entra-client-id <client-id>] \
#     [--location <azure-region>]

set -euo pipefail

# Defaults
SKU=""
ENTRA_CLIENT_ID=""
LOCATION="eastus2"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    --app-name) APP_NAME="$2"; shift 2 ;;
    --foundry-endpoint) FOUNDRY_ENDPOINT="$2"; shift 2 ;;
    --agent-name) AGENT_NAME="$2"; shift 2 ;;
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

# --- Intent-based SKU selection ---
if [[ -z "$SKU" ]]; then
  echo ""
  echo "Who will use this agent?"
  echo ""
  echo "  1) Just me / testing        (Dev environment)"
  echo "  2) My team / internal use   (Recommended for most teams)"
  echo "  3) Production / customers   (Auto-scaling, high availability)"
  echo ""
  read -rp "Select [1-3]: " AUDIENCE_CHOICE

  case "${AUDIENCE_CHOICE}" in
    1)
      SKU="B1"
      echo ""
      echo "→ Setting up a dev environment (Basic B1)"
      echo "  Authentication: None (publicly accessible)"
      ;;
    2)
      SKU="P0v3"
      echo ""
      echo "→ Setting up for your team (Premium P0v3)"
      if [[ -z "$ENTRA_CLIENT_ID" ]]; then
        echo "  Authentication: Microsoft Entra ID (auto-configured)"
        echo ""
        echo "  Creating Entra App Registration for secure login..."
        ENTRA_CLIENT_ID=$(az ad app create \
          --display-name "${APP_NAME}-auth" \
          --web-redirect-uris "https://${APP_NAME}.azurewebsites.net/.auth/login/aad/callback" \
          --query appId -o tsv)
        echo "  ✓ App Registration created (Client ID: ${ENTRA_CLIENT_ID})"
        echo "  Only users in your organization will be able to access the app."
      fi
      ;;
    3)
      SKU="P1v3"
      echo ""
      echo "→ Setting up for production (Premium P1v3 with auto-scaling)"
      if [[ -z "$ENTRA_CLIENT_ID" ]]; then
        echo "  Authentication: Microsoft Entra ID (auto-configured)"
        echo ""
        echo "  Creating Entra App Registration for secure login..."
        ENTRA_CLIENT_ID=$(az ad app create \
          --display-name "${APP_NAME}-auth" \
          --web-redirect-uris "https://${APP_NAME}.azurewebsites.net/.auth/login/aad/callback" \
          --query appId -o tsv)
        echo "  ✓ App Registration created (Client ID: ${ENTRA_CLIENT_ID})"
        echo "  Only users in your organization will be able to access the app."
      fi
      ;;
    *)
      echo "Invalid choice. Defaulting to dev environment (B1)."
      SKU="B1"
      ;;
  esac
fi

echo ""
echo "=== Deploying Agent Chat UI ==="
echo "  Resource Group:    $RESOURCE_GROUP"
echo "  App Name:          $APP_NAME"
echo "  Location:          $LOCATION"
echo "  Plan:              $SKU"
echo "  Agent:             $AGENT_NAME"
echo "  Foundry:           $FOUNDRY_ENDPOINT"
if [[ -n "$ENTRA_CLIENT_ID" ]]; then
  echo "  Authentication:    Microsoft Entra ID"
else
  echo "  Authentication:    None (public)"
fi
echo ""

# Create resource group if it doesn't exist
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none 2>/dev/null || true

# Step 1: Deploy the infrastructure (App Service, Identity, RBAC, Easy Auth)
echo "Provisioning Azure resources..."
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
  --output none

# Step 2: Build the Next.js app with the eject banner enabled
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Building the application..."
(cd "$SCRIPT_DIR" && npm install --silent && NEXT_PUBLIC_SHOW_EJECT_BANNER=true npm run build)

# Step 3: Package the standalone output for zip deploy
echo "Packaging for deployment..."
DEPLOY_DIR=$(mktemp -d)
cp -r "$SCRIPT_DIR/.next/standalone/." "$DEPLOY_DIR/"
cp -r "$SCRIPT_DIR/.next/static" "$DEPLOY_DIR/.next/static"
cp -r "$SCRIPT_DIR/public" "$DEPLOY_DIR/public" 2>/dev/null || true
(cd "$DEPLOY_DIR" && zip -rq deploy.zip .)

# Step 4: Zip deploy to App Service
echo "Deploying to App Service..."
az webapp deploy \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --src-path "$DEPLOY_DIR/deploy.zip" \
  --type zip \
  --output none

# Cleanup
rm -rf "$DEPLOY_DIR"

echo ""
echo "=== Deployment Complete ==="
echo "Your Agent Chat UI is live at: https://${APP_NAME}.azurewebsites.net"
echo ""
if [[ -z "$ENTRA_CLIENT_ID" ]]; then
  echo "Note: Easy Auth was not configured. To add Entra ID authentication,"
  echo "re-run with --entra-client-id <your-app-registration-client-id>."
fi
