# Flow Creation via Web API

Creating, activating, and monitoring cloud flows programmatically using the Dataverse Web API.

## Create a Cloud Flow

Cloud flows are stored in the `workflows` entity. Required properties for modern flows (automated, instant, scheduled):

```http
POST /api/data/v9.2/workflows
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "When Asset Created - Send Notification",
  "category": 5,
  "type": 1,
  "primaryentity": "none",
  "clientdata": "{...stringified JSON...}"
}
```

**Required properties:**
| Property | Value | Description |
|---|---|---|
| `name` | string | Display name of the flow |
| `category` | `5` | Modern Flow (automated/instant/scheduled) |
| `type` | `1` | Definition (not template or activation) |
| `primaryentity` | `"none"` | Always `"none"` for modern flows |
| `clientdata` | string | JSON-stringified flow definition + connectionReferences |

**Confirmed via MS docs:** The `clientdata` property is a string-encoded JSON containing the flow `definition` (Logic Apps workflow definition language) and `connectionReferences` (mappings to each connector the flow uses).

## clientdata Structure

The `clientdata` value is a **JSON string** (not an object). Build it as a Python dict, then use `json.dumps()`:

> ⚠️ **`schemaVersion` must be at the root of `clientdata`**, NOT inside `definition` or `properties`. Missing it causes `Required property 'schemaVersion' not found` on flow creation.

```python
import json

clientdata = {
    "schemaVersion": "1.0.0.0",   # ← MUST be here, at root, NOT inside definition
    "properties": {
        "connectionReferences": {
            "shared_commondataserviceforapps": {
                "runtimeSource": "embedded",
                "connection": {},
                "api": {"name": "shared_commondataserviceforapps"}
            }
        },
        "definition": {
            "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
            "contentVersion": "1.0.0.0",
            "triggers": {
                "When_a_row_is_added": {
                    "type": "OpenApiConnectionWebhook",
                    "inputs": {
                        "parameters": {
                            "subscriptionRequest/message": 1,
                            "subscriptionRequest/entityname": "contoso_asset",
                            "subscriptionRequest/scope": 4
                        },
                        "host": {
                            "connectionName": "shared_commondataserviceforapps",
                            "operationId": "SubscribeWebhookTrigger",
                            "apiId": "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps"
                        }
                    },
                    "description": "Fires when a new asset record is created in Dataverse"
                }
            },
            "actions": {
                "Get_the_row": {
                    "type": "OpenApiConnection",
                    "inputs": {
                        "parameters": {
                            "entityName": "contoso_assets",
                            "recordId": "@triggerOutputs()?['body/_contoso_assetid_value']"
                        },
                        "host": {
                            "connectionName": "shared_commondataserviceforapps",
                            "operationId": "GetItem",
                            "apiId": "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps"
                        }
                    },
                    "description": "Retrieves the full asset record including all columns"
                }
            }
        }
    }
}

# Stringify for the API call
flow_payload = {
    "name": "When Asset Created - Send Notification",
    "category": 5,
    "type": 1,
    "primaryentity": "none",
    "clientdata": json.dumps(clientdata)
}
```

## ⚠️ Trigger Type: Use `OpenApiConnectionWebhook`

For Dataverse webhook triggers (`SubscribeWebhookTrigger`), the trigger type MUST be `OpenApiConnectionWebhook`.

**WRONG:** `"type": "OpenApiConnectionNotification"` — POST accepts this but PATCH/re-save rejects it with `InvalidOpenApiConnectionOperationType`.

**CORRECT:** `"type": "OpenApiConnectionWebhook"`

POST is more lenient than PATCH for trigger type validation. Always use the correct type from the start to avoid hidden technical debt.

## Connection References: Auto-Resolve vs Explicit

### Embedded Dataverse Connector (Auto-Resolves)

The `shared_commondataserviceforapps` connector auto-resolves connections for the authenticated user. An empty connection object works:

```json
"shared_commondataserviceforapps": {
    "runtimeSource": "embedded",
    "connection": {},
    "api": {"name": "shared_commondataserviceforapps"}
}
```

### OAuth-Based Connectors (Require Explicit Connection Reference)

External connectors like Office 365, SharePoint, etc. require a pre-existing connection reference. Using `"connection": {}` returns `FlowMissingConnection` (error `0x80060467`) on activation.

**Step 1: Discover available connection references**
```http
GET /api/data/v9.2/connectionreferences
  ?$select=connectionreferencelogicalname,connectionreferencedisplayname,connectorid,connectionid
  &$filter=connectorid eq '/providers/Microsoft.PowerApps/apis/shared_office365'
```

**Step 2: Wire into clientdata**
```json
"shared_office365": {
    "runtimeSource": "embedded",
    "connection": {
        "connectionReferenceLogicalName": "ko_sharedoffice365_cbe58"
    },
    "api": {"name": "shared_office365"}
}
```

**Pattern:** First-party embedded connectors (Dataverse) auto-resolve. OAuth-based connectors (Office 365, SharePoint, Teams, SQL) require existing connection references found via the `connectionreferences` entity. Use `connectionreferencelogicalname` (NOT `connectionid`) as the key property.

## Activate a Flow

Flows are created in Draft state (`statecode: 0`). Activate with:

```http
PATCH /api/data/v9.2/workflows({flow-id})
Content-Type: application/json

{ "statecode": 1 }
```

**⚠️ Activation latency:** Flow activation can take **30+ seconds** — significantly longer than other Dataverse PATCH operations. The backend registers the flow with the Power Automate infrastructure. Set `timeout=30` (or higher) on your HTTP request to avoid apparent hangs. The activation does complete successfully (HTTP 204).

## Monitor Flow Runs

Flow run history is stored in the `flowruns` entity (NOT `flowsessions`):

```http
GET /api/data/v9.2/flowruns?$orderby=createdon desc&$top=5&$select=status,createdon
```

**Note:** `flowruns` does not support `_regardingobjectid_value` filter by flow ID. Runs are identified by partition, not flow ID directly. For flow-specific monitoring, filter by the flow's name or use the Power Automate management API.

## ⚠️ PATCH vs POST Validation Strictness

PATCH validation is **stricter** than POST for flow `clientdata`. When PATCHing, the full definition is re-validated against connector API schemas. Errors silently accepted during POST (like wrong trigger types) surface as HTTP 400 during PATCH.

**Rule:** Always build schema-correct definitions from the start. The GET-fix-PATCH pattern works for corrections:
1. `GET /workflows({id})?$select=clientdata` — retrieve current definition
2. Parse, fix, and rebuild the clientdata JSON
3. `PATCH /workflows({id})` with corrected clientdata

## ⚠️ MANDATORY: Action Descriptions

Every flow action and trigger MUST include a `"description"` property explaining what it does and why. This is non-negotiable for maintainability:

```json
"Get_the_row": {
    "type": "OpenApiConnection",
    "description": "Retrieves the full asset record to get the asset name for the notification email",
    "inputs": { ... }
}
```

Without descriptions, flows become unreadable as they grow — especially in Try/Catch scopes, Switch cases, and conditional branches.

## Solution Integration

Flows created with `MSCRM.SolutionUniqueName` header are automatically registered as solution components (`componenttype: 29`). No separate `AddSolutionComponent` call needed.

## Quick Reference

| Property | Value | Notes |
|---|---|---|
| Entity set | `workflows` | Same entity as business rules, classic workflows |
| Category | `5` | Modern cloud flow |
| Type | `1` | Definition |
| Draft state | `statecode: 0` | Created state |
| Active state | `statecode: 1` | Must PATCH to activate |
| Trigger type (Dataverse webhook) | `OpenApiConnectionWebhook` | NOT `OpenApiConnectionNotification` |
| Run history entity | `flowruns` | NOT `flowsessions` |
| Activation timeout | 30+ seconds | Much slower than other PATCH ops |
