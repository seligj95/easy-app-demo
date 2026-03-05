targetScope = 'resourceGroup'

@description('Name of the App Service Web App')
param appName string

@description('Location for all resources')
param location string = resourceGroup().location

@description('Azure AI Foundry Project Endpoint URL')
param foundryEndpoint string

@description('Foundry Agent Name')
param agentName string

@description('App Service Plan SKU')
@allowed(['B1', 'P0v3', 'P1v3'])
param skuName string = 'B1'

@description('Docker image for the Day 1 managed UI container')
param containerImage string = 'ghcr.io/seligj95/foundry-agent-ui:latest'

@description('Microsoft Entra ID Client ID for Easy Auth (leave empty to skip Easy Auth)')
param entraClientId string = ''

// --- App Service Plan ---
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: skuName
  }
  properties: {
    reserved: true // Required for Linux
  }
}

// --- Web App ---
resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: appName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
      alwaysOn: skuName != 'B1'
      appSettings: [
        {
          name: 'AZURE_AI_PROJECT_ENDPOINT'
          value: foundryEndpoint
        }
        {
          name: 'AZURE_AI_AGENT_NAME'
          value: agentName
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'WEBSITES_PORT'
          value: '3000'
        }
        {
          name: 'OPENAI_API_VERSION'
          value: '2025-05-01-preview'
        }
      ]
    }
    httpsOnly: true
  }
}

// --- Easy Auth (Entra ID) ---
resource authSettings 'Microsoft.Web/sites/config@2023-12-01' = if (!empty(entraClientId)) {
  parent: webApp
  name: 'authsettingsV2'
  properties: {
    globalValidation: {
      requireAuthentication: true
      unauthenticatedClientAction: 'RedirectToLoginPage'
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          clientId: entraClientId
          openIdIssuer: 'https://sts.windows.net/${subscription().tenantId}/v2.0'
        }
      }
    }
    platform: {
      enabled: true
    }
  }
}

// --- Role Assignment: Azure AI Developer on Foundry Resource Group ---
// The 'Azure AI Developer' role ID is 64702f94-c441-49e6-a78b-ef80e0188fee
@description('Resource group containing the Foundry project (defaults to current resource group)')
param foundryResourceGroup string = resourceGroup().name

var aiDeveloperRoleId = '64702f94-c441-49e6-a78b-ef80e0188fee'

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(webApp.id, aiDeveloperRoleId, resourceGroup().id)
  properties: {
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', aiDeveloperRoleId)
  }
}

// --- Outputs ---
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output webAppName string = webApp.name
output principalId string = webApp.identity.principalId
output foundryResourceGroupNote string = 'If your Foundry project is in a different resource group (${foundryResourceGroup}), you must manually grant the Managed Identity the Azure AI Developer role on that resource group.'
