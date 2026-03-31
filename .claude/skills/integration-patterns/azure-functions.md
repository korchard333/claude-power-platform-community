# Azure Functions Integration

## Overview

Azure Functions provide serverless compute for Power Platform integrations. They serve as intermediaries for custom logic, API proxies, AI calls, data transformations, and operations that exceed Dataverse plugin constraints (2-minute timeout, 256MB memory, no external HTTP in sync plugins).

---

## When to Use Functions vs Plugins vs Flows

| Scenario | Use | Why |
|---|---|---|
| Sync validation on record save | **Plugin** | Executes in transaction, sub-second |
| Async notification to external API | **Plugin** (async) or **Flow** | Plugin if simple, flow if complex logic |
| Complex data transformation | **Azure Function** | No timeout constraints, full compute |
| AI/ML model inference | **Azure Function** | Managed identity to AOAI, streaming |
| File processing (PDF, Excel) | **Azure Function** | No memory/library restrictions |
| Scheduled batch processing | **Azure Function** (timer trigger) | Reliable scheduling, long-running |
| User-facing API for Code App | **Azure Function** (HTTP trigger) | Custom endpoint, CORS control |
| Simple connector-based integration | **Power Automate flow** | Low-code, fast to build |
| Fan-out to multiple services | **Azure Function** + **Service Bus** | Scalable, decoupled |

### Decision Criteria

```
Does the logic need to run in the Dataverse transaction?
  ├── Yes → Plugin (sync, pre/post operation)
  └── No → Does it need more than 2 minutes?
        ├── Yes → Azure Function
        └── No → Does it need external HTTP calls?
              ├── Yes (sync context) → Azure Function (plugins can't do sync HTTP safely)
              └── No → Plugin (async) or Flow
```

---

## HTTP-Triggered Functions for Custom Connectors

Expose an Azure Function as a Power Platform custom connector.

### Azure Function

```typescript
// api/validate-address/index.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";

interface AddressRequest {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

app.http("validate-address", {
  methods: ["POST"],
  authLevel: "function",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const address = (await request.json()) as AddressRequest;

    // Call external address validation API
    const result = await validateWithProvider(address);

    return {
      jsonBody: {
        isValid: result.isValid,
        standardized: result.standardizedAddress,
        confidence: result.confidence,
      },
    };
  },
});
```

### Custom Connector Definition

```yaml
# apiDefinition.swagger.json (simplified)
swagger: "2.0"
info:
  title: "Address Validation"
  version: "1.0"
host: "func-contoso-address.azurewebsites.net"
basePath: "/api"
schemes: ["https"]
paths:
  /validate-address:
    post:
      operationId: ValidateAddress
      parameters:
        - in: body
          name: body
          schema:
            type: object
            properties:
              street: { type: string }
              city: { type: string }
              state: { type: string }
              postalCode: { type: string }
              country: { type: string }
      responses:
        200:
          schema:
            type: object
            properties:
              isValid: { type: boolean }
              standardized: { type: string }
              confidence: { type: number }
```

---

## Managed Identity Authentication

Use managed identity instead of API keys for Azure-to-Azure authentication.

### Function → Azure OpenAI

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { AzureOpenAI } from "openai";

const credential = new DefaultAzureCredential();
const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  credential,
  apiVersion: "2024-10-21",
});
```

### Function → Dataverse

```typescript
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();

async function callDataverse(orgUrl: string, endpoint: string) {
  const token = await credential.getToken(`${orgUrl}/.default`);

  return fetch(`${orgUrl}/api/data/v9.2${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token.token}`,
      "OData-Version": "4.0",
      Accept: "application/json",
    },
  });
}
```

### Setup Managed Identity

```bash
# Enable system-assigned managed identity
az functionapp identity assign \
  --resource-group "rg-functions" \
  --name "func-contoso-integration"

# Grant Dataverse access (create Application User in PP Admin Center)
# 1. Note the managed identity's object ID from Azure Portal
# 2. Power Platform Admin Center → Environments → [env] → Settings
#    → Users → Application Users → New → Enter object ID
#    → Assign security role
```

---

## Cold Start Mitigation

Azure Functions on Consumption plan have cold starts (1-10 seconds). Strategies:

| Strategy | How | Cost Impact |
|---|---|---|
| **Premium plan** | Always-warm instances | Higher base cost |
| **Minimum instances** | Set min instance count to 1 | Premium plan feature |
| **Keep-alive ping** | Timer trigger every 5 min | Minimal |
| **Provisioned concurrency** | Pre-warm specific functions | Premium plan feature |

### For User-Facing Functions (Code App intermediary)

```bash
# Use Premium plan with minimum 1 instance
az functionapp plan create \
  --resource-group "rg-functions" \
  --name "plan-contoso-premium" \
  --location australiaeast \
  --sku EP1 \
  --min-instances 1 \
  --max-burst 5
```

### For Background Processing

Consumption plan is fine — cold starts don't matter for async processing.

---

## Dataverse Bindings (Preview)

Azure Functions can bind directly to Dataverse tables (experimental):

```csharp
// Input binding — read Dataverse record
[Function("GetAccount")]
public IActionResult Run(
    [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequest req,
    [DataverseInput(
        EntityName = "account",
        Id = "{Query.id}",
        Connection = "DataverseConnection")]
    Entity account)
{
    return new OkObjectResult(account["name"]);
}
```

> **Note:** Dataverse bindings are in preview. For production, use the Dataverse Web API directly with managed identity auth.

---

## Common Integration Patterns

### Pattern 1: Webhook → Function → External System

```
Dataverse webhook (Contact created)
  → Azure Function (HTTP trigger)
    → Transform data
    → Call external CRM API
    → Return 200 (success) or 500 (retry)
```

### Pattern 2: Function as Custom API Backend

```
Code App → Dataverse Custom API → Plugin → Azure Function
  → Function processes request
  → Returns result to plugin
  → Plugin returns to Custom API
  → Code App receives response
```

### Pattern 3: Timer Function for Batch Sync

```
Timer trigger (every 1 hour)
  → Query Dataverse for records modified since last sync
  → Transform to external format
  → Batch upsert to external system
  → Log sync result
```

### Pattern 4: Service Bus → Function → Dataverse Writeback

```
External system → Service Bus queue
  → Azure Function (Service Bus trigger)
    → Transform external data
    → Write to Dataverse via Web API
    → Complete message
```

---

## Deployment

### GitHub Actions for Azure Functions

```yaml
name: Deploy Azure Function

on:
  push:
    branches: [main]
    paths: ['functions/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install and build
        run: cd functions && npm ci && npm run build

      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: "func-contoso-integration"
          package: "./functions"
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

---

## Anti-Patterns

- Sync HTTP calls from Dataverse plugins to Functions (2-minute plugin timeout risk)
- API keys hardcoded in Function app settings (use Key Vault references)
- Consumption plan for user-facing latency-sensitive functions (cold starts)
- No error handling in Function → Dataverse writeback (silent data loss)
- Functions doing what plugins can do (unnecessary Azure cost and complexity)
- No CORS configuration for Code App-facing functions
- No retry logic in Function → external system calls
- Single monolithic Function app (deploy everything together, can't scale independently)
- No monitoring/Application Insights on the Function app (blind to failures)
