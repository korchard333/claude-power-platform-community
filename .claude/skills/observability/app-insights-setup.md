# Application Insights Setup

## Overview

Azure Application Insights is the primary telemetry sink for Power Platform. Platform telemetry (Dataverse API calls, plugin executions, SDK operations) is exported via Managed Environment configuration. App-level telemetry (custom events, errors, performance) is sent via SDK instrumentation in Code Apps or automatic collection in Canvas/MDA apps.

---

## Prerequisites

| Requirement | Details |
|---|---|
| Azure subscription | Application Insights resource lives in Azure |
| Application Insights resource | Workspace-based (recommended) — not classic |
| Connection string | From App Insights resource overview (NOT instrumentation key) |
| Managed Environment | Required for platform telemetry export |
| Admin role | Power Platform admin + App Insights contributor |

> **Connection string vs instrumentation key:** Always use the connection string. Instrumentation key ingestion support ended March 2025. Connection strings provide reliability, regional endpoints, and Entra ID authentication.

---

## Create an Application Insights Resource

```bash
# Azure CLI
az monitor app-insights component create \
  --app "pptelemetry-contoso-prod" \
  --location australiaeast \
  --resource-group "rg-powerplatform" \
  --workspace "/subscriptions/{sub-id}/resourceGroups/rg-monitoring/providers/Microsoft.OperationalInsights/workspaces/law-contoso"

# Get connection string
az monitor app-insights component show \
  --app "pptelemetry-contoso-prod" \
  --resource-group "rg-powerplatform" \
  --query connectionString -o tsv
```

```powershell
# PowerShell
New-AzApplicationInsights -ResourceGroupName "rg-powerplatform" `
    -Name "pptelemetry-contoso-prod" `
    -Location "australiaeast" `
    -WorkspaceResourceId "/subscriptions/{sub-id}/resourceGroups/rg-monitoring/providers/Microsoft.OperationalInsights/workspaces/law-contoso"

# Get connection string
(Get-AzApplicationInsights -ResourceGroupName "rg-powerplatform" `
    -Name "pptelemetry-contoso-prod").ConnectionString
```

---

## Resource Topology

### One App Insights Per Environment (Recommended)

```
App Insights: pptelemetry-contoso-dev   ← Dev environment
App Insights: pptelemetry-contoso-test  ← Test environment
App Insights: pptelemetry-contoso-prod  ← Prod environment
          │
          └── All feed into shared Log Analytics Workspace
              (for cross-environment queries)
```

**Why one-to-one?** Application Insights out-of-the-box reports do NOT function correctly when a single instance receives data from multiple environments. Telemetry gets mixed and metrics become meaningless.

### Shared Log Analytics Workspace

Multiple App Insights resources can share a single Log Analytics workspace. This gives you:
- Cross-environment KQL queries
- Unified alerting across environments
- Centralized retention policies
- Single pane of glass in Azure Monitor

---

## Enable Platform Telemetry Export (Managed Environment)

This exports Dataverse-level telemetry: API calls, plugin execution, SDK operations, exceptions.

```
Power Platform Admin Center → Environments → [env]
  → Settings → Product → Features
  → Export data to Application Insights → Enable

  Connection string: InstrumentationKey=...;IngestionEndpoint=...;LiveEndpoint=...
```

### What Gets Exported

| Telemetry Type | Description | Table in App Insights |
|---|---|---|
| **Dataverse API incoming** | All Web API requests (method, entity, duration, status) | `requests` |
| **Plugin execution** | Plugin step execution (duration, success/failure, exception) | `dependencies` |
| **SDK operations** | Internal Dataverse SDK calls | `dependencies` |
| **Exceptions** | Unhandled exceptions from plugins, workflows | `exceptions` |
| **Custom events** | Events logged via ILogger in plugins | `customEvents` |
| **Performance counters** | Platform-level performance metrics | `performanceCounters` |

### SLA for Telemetry Delivery

The SLA for telemetry data streams from Power Platform to Application Insights is **24 hours**. This means data may be delayed up to 24 hours — it is NOT real-time.

---

## Per-Component Configuration

### Canvas Apps
```
Power Apps → App → Settings → General
  → Application Insights connection string: [paste connection string]
```

Canvas App telemetry includes:
- Screen views (screen name, timestamp)
- Custom trace events (via `Trace()` function)
- Unhandled errors

### Model-Driven Apps
Model-driven apps automatically emit telemetry when the environment-level export is configured. No per-app configuration needed.

Additional telemetry:
- Form load events
- JavaScript errors
- Web resource load times

### Code Apps
Code Apps require SDK instrumentation. See [Code App Telemetry](code-app-telemetry.md) for full setup.

### Power Automate Flows
Flow telemetry requires Managed Environments. See [Flow Telemetry](flow-telemetry.md) for details.

### Plugins
Plugin telemetry uses `ITracingService` (logged to plugin trace log) and `ILogger` (logged to Application Insights). See [MDA Telemetry](mda-telemetry.md) for plugin-specific details.

---

## Environment Variables for Connection Strings

Store connection strings as environment variables in solutions — never hardcode per environment.

```
Solution → Environment Variable Definitions → New
  Schema name: contoso_AppInsightsConnectionString
  Type: String
  Display name: Application Insights Connection String
  Default value: (leave blank — set per environment)
```

Per environment:
```
Dev:  InstrumentationKey=dev-key;IngestionEndpoint=...
Test: InstrumentationKey=test-key;IngestionEndpoint=...
Prod: InstrumentationKey=prod-key;IngestionEndpoint=...
```

> **Code Apps caveat:** Environment variables are not yet directly supported in Code Apps. Store the connection string in a Dataverse settings table or use `getContext()` to detect the environment and select the appropriate string from app constants.

---

## Authentication Options

### Local Authentication (Default)
Connection string includes the instrumentation key. Any client with the key can send telemetry.

### Entra ID Authentication (Recommended for Production)
Disable local authentication and require Entra ID tokens:

```
App Insights resource → Properties → Local Authentication → Disable

Grant "Monitoring Metrics Publisher" role to:
  - Service principal (for server-side telemetry)
  - Managed identity (for Azure-hosted components)
```

> **Note:** Browser-based telemetry (Canvas/MDA apps) cannot directly authenticate with Entra ID. Use Azure API Management as a proxy if you need authenticated browser telemetry.

---

## Retention and Cost

| Setting | Default | Configurable |
|---|---|---|
| Data retention | 90 days | Up to 730 days (cost increases) |
| Daily cap | None (unlimited) | Set a daily GB cap to control cost |
| Sampling | None | Enable adaptive sampling to reduce volume |

### Cost Control Tips
- Set a daily cap to prevent runaway costs from noisy telemetry
- Use sampling for high-volume environments (dev/test)
- Keep full fidelity for production
- Archive to Log Analytics workspace for long-term retention
- Review ingestion volume monthly via Azure Cost Management

---

## Verification

After setup, verify telemetry is flowing:

```
Azure Portal → Application Insights → [resource]
  → Live Metrics (real-time view — trigger some activity in Power Platform)
  → Logs → Run query:

requests
| where timestamp > ago(1h)
| summarize count() by resultCode
| order by count_ desc
```

If no data appears after 24 hours:
1. Verify Managed Environment is enabled
2. Verify connection string is correct (no extra spaces, complete string)
3. Verify admin role has both PP admin + App Insights contributor
4. Check App Insights → Diagnostic settings for ingestion errors
5. Verify local authentication is enabled (or Entra ID is properly configured)

---

## Anti-Patterns

- Using instrumentation key instead of connection string (deprecated March 2025)
- Sharing one App Insights instance across multiple PP environments (mixed data, broken reports)
- Not enabling Managed Environments (platform telemetry export requires it)
- Hardcoding connection strings in Code Apps (use Dataverse settings or environment detection)
- No daily cap on App Insights (unexpected Azure bill from noisy telemetry)
- Expecting real-time data (SLA is up to 24 hours for platform telemetry)
- Disabling local auth without setting up Entra ID auth (telemetry stops flowing)
