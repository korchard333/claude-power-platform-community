# Business Rules via API

## Overview

Business rules in Dataverse are stored as records in the **Process (Workflow)** table with `Category = 2`. They enforce validation, set field values, show/hide columns, and set business requirements — all without code. While the maker portal is preferred for creating complex business rules (visual designer), the API is useful for querying, activating/deactivating, migrating, and managing rules programmatically.

## Workflow Table Schema for Business Rules

Business rules use the `workflow` entity with these key properties:

| Property | Value for Business Rules |
|---|---|
| `category` | `2` (Business Rule) |
| `type` | `1` (Definition) or `2` (Activation) |
| `statecode` | `0` (Draft/Off), `1` (Activated/On) |
| `primaryentity` | Logical name of the table (e.g., `contoso_project`) |
| `scope` | `1` (Entity — all forms), `2` (All Forms), `4` (Specific Form) |
| `xaml` | XAML workflow definition (the rule logic) |
| `clientdata` | JSON definition used by the client-side engine |

## Querying Existing Business Rules

### List all business rules for a table

```http
GET /api/data/v9.2/workflows?$filter=category eq 2 and primaryentity eq 'contoso_project'&$select=name,statecode,scope,description,createdon,modifiedon
Accept: application/json
OData-Version: 4.0
```

### List only active business rules

```http
GET /api/data/v9.2/workflows?$filter=category eq 2 and statecode eq 1 and type eq 1&$select=name,primaryentity,scope
```

### Get a specific business rule with its XAML

```http
GET /api/data/v9.2/workflows({workflowid})?$select=name,xaml,clientdata,statecode,scope
```

### Count business rules per table

```http
GET /api/data/v9.2/workflows?$filter=category eq 2 and type eq 1&$apply=groupby((primaryentity),aggregate($count as rulecount))
```

**Performance note:** Dataverse supports up to 150 business rules per table. Beyond this, performance degrades because business rules generate synchronous plugins (server-side XAML) and JavaScript (client-side).

## Activating and Deactivating Business Rules

### Activate a business rule

```http
PATCH /api/data/v9.2/workflows({workflowid})
Content-Type: application/json

{
  "statecode": 1,
  "statuscode": 2
}
```

### Deactivate a business rule

```http
PATCH /api/data/v9.2/workflows({workflowid})
Content-Type: application/json

{
  "statecode": 0,
  "statuscode": 1
}
```

**Important:** After activating or deactivating a business rule, publish the table:

```http
POST /api/data/v9.2/PublishXml
Content-Type: application/json

{
  "ParameterXml": "<importexportxml><entities><entity>contoso_project</entity></entities></importexportxml>"
}
```

## Creating Business Rules via API

⚠️ **IMPORTANT:** Business rule creation via API requires valid XAML. The `clientdata` property alone is NOT sufficient — the platform uses XAML as the source of truth. The recommended approach is to create rules in the maker portal, then export/examine the XAML for replication patterns. See "Discovery Method" in the XAML Activity Reference section below.

Creating business rules via API requires constructing valid XAML and client data. This is complex because the rule definition is a serialized workflow.

### Simple Validation Rule Example

```http
POST /api/data/v9.2/workflows
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "category": 2,
  "name": "Validate End Date After Start Date",
  "type": 1,
  "primaryentity": "contoso_project",
  "scope": 1,
  "description": "Ensures end date is after start date",
  "statecode": 0,
  "statuscode": 1,
  "xaml": "<Activity x:Class=\"XrmWorkflow00000000000000000000000000000000\" ...>[XAML content]</Activity>",
  "clientdata": "{\"conditions\":[{\"field\":\"contoso_enddate\",\"operator\":\"lt\",\"value\":{\"field\":\"contoso_startdate\"}}],\"actions\":[{\"type\":\"showError\",\"message\":\"End date must be after start date\"}]}"
}
```

### Why Portal Is Usually Better for Creation

| Approach | Pros | Cons |
|---|---|---|
| **Maker Portal** | Visual designer, validates logic, generates XAML/clientdata automatically, no serialization errors | Manual, not scriptable |
| **API (POST)** | Scriptable, repeatable, works in CI/CD | Must construct valid XAML, brittle serialization, no design-time validation |
| **Solution Export/Import** | Best for migration between environments | Requires source environment with the rule |

**Recommendation:** Create business rules in the maker portal, export them in your solution, and manage activation/deactivation via API. Use the API for bulk operations and CI/CD scenarios.

## Bulk Operations on Business Rules

### Deactivate all business rules for a table (pre-migration)

```bash
#!/bin/bash
# Get all active business rules for a table
RULES=$(curl -s -X GET "${BASE_URL}/workflows?\$filter=category eq 2 and statecode eq 1 and primaryentity eq 'contoso_project' and type eq 1&\$select=workflowid,name" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Accept: application/json" | jq -r '.value[].workflowid')

# Deactivate each rule
for RULE_ID in $RULES; do
  echo "Deactivating rule: $RULE_ID"
  curl -s -X PATCH "${BASE_URL}/workflows($RULE_ID)" \
    -H "Authorization: Bearer $TOKEN" \
    -H "OData-Version: 4.0" \
    -H "Content-Type: application/json" \
    -d '{"statecode": 0, "statuscode": 1}'
done

# Publish the table
curl -s -X POST "${BASE_URL}/PublishXml" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Content-Type: application/json" \
  -d '{"ParameterXml": "<importexportxml><entities><entity>contoso_project</entity></entities></importexportxml>"}'
```

### Reactivate all business rules after migration

```bash
#!/bin/bash
RULES=$(curl -s -X GET "${BASE_URL}/workflows?\$filter=category eq 2 and statecode eq 0 and primaryentity eq 'contoso_project' and type eq 1&\$select=workflowid,name" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Accept: application/json" | jq -r '.value[].workflowid')

for RULE_ID in $RULES; do
  echo "Activating rule: $RULE_ID"
  curl -s -X PATCH "${BASE_URL}/workflows($RULE_ID)" \
    -H "Authorization: Bearer $TOKEN" \
    -H "OData-Version: 4.0" \
    -H "Content-Type: application/json" \
    -d '{"statecode": 1, "statuscode": 2}'
done
```

## Business Rule Scope

| Scope Value | Name | Behavior | Supports Form Actions? |
|---|---|---|---|
| `1` | Entity (Global) | Server-side synchronous plugin. Fires on all form/API/import operations. | **NO** — rejects SetVisibility, SetDisplayMode, SetFieldRequiredLevel |
| `2` | All Forms | **REJECTED** — returns "Pbl rules are only supported for Global scope". Do NOT use. | N/A |
| `4` | Specific Form | Client-side JavaScript. Fires on the specified form only. Requires `formid` property. | **YES** — the ONLY scope that supports form-centric actions |

⚠️ **Scope=4 with `formid`** is the only reliable scope for form-centric actions (SetVisibility, SetDisplayMode, SetFieldRequiredLevel). Scope=1 works ONLY for server-side actions like SetAttributeValue and ShowError.

Working rules in production environments consistently use scope=4 with `formid` pointing to the target form. API may accept `formid=None` (null) and the rules still function.

### Query by scope

```http
GET /api/data/v9.2/workflows?$filter=category eq 2 and scope eq 1 and type eq 1&$select=name,primaryentity
```

## Business Rule Actions Reference

Business rules support these action types:

| Action | Description | Scope |
|---|---|---|
| **Set Field Value** | Set a column to a specific value or formula | Entity + Form |
| **Set Business Required** | Make a column required/optional | Form only |
| **Set Visibility** | Show/hide a column on the form | Form only |
| **Set Default Value** | Set a default when condition is met | Entity + Form |
| **Show Error Message** | Display validation error | Entity + Form |
| **Lock/Unlock Field** | Make a column read-only or editable | Form only |
| **Recommendation** | Show a recommended action (MDA only) | Form only |

## Deleting Business Rules

```http
DELETE /api/data/v9.2/workflows({workflowid})
```

**Important:** You can only delete deactivated business rules. Attempting to delete an active rule returns an error. Deactivate first, then delete.

## Relationship to Other Automation

| Need | Best Tool | Why |
|---|---|---|
| Simple field validation | **Business Rule** | No code, server-side enforced |
| Complex cross-table validation | **Plugin (pre-operation)** | Business rules are single-table |
| Conditional field visibility | **Business Rule** | Built-in action, no JavaScript |
| External service call on save | **Power Automate** | Business rules can't call external services |
| Computed values | **Formula Column** | Always current, no rule maintenance |
| Cascading lookups | **Business Rule or JS** | Business rules for simple cases |

## Anti-Patterns

- **More than 150 business rules on a single table** — causes performance degradation. Each server-scoped rule generates a synchronous plugin.
- **Creating complex rules via API instead of portal** — XAML construction is error-prone. Use portal to create, API to manage.
- **Relying on form-scoped rules for data integrity** — form-scoped rules don't fire on API or import operations. Use Entity scope for validation rules.
- **Forgetting to publish after activation changes** — business rule state changes require `PublishXml` to take effect in the UI.
- **Using business rules for computed values** — use formula columns instead. They're evaluated on read and don't add to the plugin pipeline.
- **Not checking rule count before adding new rules** — query existing rules first to ensure you're within the 150-rule limit.

## XAML Activity Reference (mcwc: Activities)

Business rule XAML uses `mcwc:` prefixed activities. These are NOT documented in Microsoft Learn — they were discovered by examining existing production rules.

### Complete Activity Set

| Activity | Description | Scope |
|---|---|---|
| `mcwc:SetAttributeValue` | Set a column to a value | Entity + Form |
| `mcwc:SetDefaultValue` | Set a default value | Entity + Form |
| `mcwc:SetDisplayMode` | Lock/unlock a field (read-only/editable) | Form only (scope=4) |
| `mcwc:SetFieldRequiredLevel` | Set business required/optional | Form only (scope=4) |
| `mcwc:SetMessage` | Show error/info message | Entity + Form |
| `mcwc:SetVisibility` | Show/hide a field on the form | Form only (scope=4) |

### ⚠️ SetFieldRequiredLevel Requires Assign Preamble

`mcwc:SetFieldRequiredLevel` requires two `Assign` preamble statements before the activity:
1. `Assign mxs:Entity` to `CreatedEntities("primaryEntity#Temp")`
2. `Assign s:Guid` to set the entity's `.Id`

Without this preamble, the rule fails at activation with "Error generating UiData".

**Note:** `SetVisibility` and `SetDisplayMode` do NOT require this preamble.

### SetFieldRequiredLevel Properties

| Property | Value |
|---|---|
| `ControlId` | Column logical name |
| `ControlType` | `"standard"` |
| `DisplayName` | Column display name |
| `Entity` | Entity reference |
| `EntityName` | Table logical name |
| `RequiredLevel` | `"Required"` or `"None"` |

### Else Branch Pattern

Business rule "else" is NOT a direct `<Else>` element — it's a second `ConditionBranch` with an always-true `[True]` condition. This requires:
- Its own `EvaluateExpression` that creates a boolean "true" value
- A `Variable` named `True` in the parent scope
- `<x:Null x:Key="Else" />` on the first ConditionBranch (always null — the else logic lives in the next sibling ConditionBranch)

### Discovery Method

To discover XAML patterns for activities not documented here, search existing category=2 workflows in the org:
```python
import re
rules = api_get("workflows?$filter=category eq 2 and statecode eq 1&$select=name,xaml")
for rule in rules['value']:
    activities = re.findall(r'<mcwc:(\w+)', rule.get('xaml', ''))
    if activities:
        print(f"{rule['name']}: {set(activities)}")
```
