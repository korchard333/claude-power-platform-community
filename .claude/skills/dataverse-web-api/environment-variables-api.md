# Environment Variables via Web API

## Overview

Environment variables store configuration values that change between environments (dev/test/prod) — connection strings, feature flags, API URLs, secrets. They consist of a **definition** (schema) and an optional **current value** (override). The definition travels with the solution; the current value is set per-environment.

## Entity Structure

| Table | Logical Name | Purpose |
|---|---|---|
| Environment Variable Definition | `environmentvariabledefinition` | Schema: name, type, default value |
| Environment Variable Value | `environmentvariablevalue` | Override: per-environment current value |

A definition can have a default value. A value record overrides the default for a specific environment. If no value record exists, the default is used.

## Variable Types

| Type | Value | Use Case |
|---|---|---|
| String | `100000000` | API URLs, connection strings, feature names |
| Number | `100000001` | Thresholds, limits, configuration numbers |
| Boolean | `100000002` | Feature flags, enable/disable toggles |
| JSON | `100000003` | Complex configuration objects |
| Data Source | `100000004` | Dataverse/SQL/SharePoint data source references |
| Secret | `100000005` | Secrets stored in Azure Key Vault |

## Creating Environment Variable Definitions

### String Variable

```http
POST /api/data/v9.2/environmentvariabledefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "schemaname": "contoso_ApiBaseUrl",
  "displayname": "API Base URL",
  "description": "Base URL for the external project management API",
  "type": 100000000,
  "defaultvalue": "https://api.example.com/v1",
  "isrequired": true
}
```

### Boolean Variable (Feature Flag)

```http
POST /api/data/v9.2/environmentvariabledefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "schemaname": "contoso_EnableAIFeatures",
  "displayname": "Enable AI Features",
  "description": "Toggle AI-powered features on or off",
  "type": 100000002,
  "defaultvalue": "no",
  "isrequired": false
}
```

**Boolean values:** Use `"yes"` or `"no"` as string values.

### JSON Variable

```http
POST /api/data/v9.2/environmentvariabledefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "schemaname": "contoso_NotificationConfig",
  "displayname": "Notification Configuration",
  "description": "Email and Teams notification settings",
  "type": 100000003,
  "defaultvalue": "{\"emailEnabled\": true, \"teamsEnabled\": false, \"maxRetries\": 3}",
  "isrequired": false
}
```

### Number Variable

```http
POST /api/data/v9.2/environmentvariabledefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "schemaname": "contoso_MaxBatchSize",
  "displayname": "Max Batch Size",
  "description": "Maximum number of records to process in a single batch",
  "type": 100000001,
  "defaultvalue": "1000",
  "isrequired": true
}
```

### Secret Variable (Azure Key Vault)

```http
POST /api/data/v9.2/environmentvariabledefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "schemaname": "contoso_ExternalApiKey",
  "displayname": "External API Key",
  "description": "API key for external service - stored in Key Vault",
  "type": 100000005,
  "secretstore": 0
}
```

**Secret store values:**
| Value | Store |
|---|---|
| `0` | Azure Key Vault |
| `1` | Microsoft Dataverse |

**For Key Vault secrets**, the value references the Key Vault URL:
```
/subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault-name}/secrets/{secret-name}
```

### Data Source Variable

```http
POST /api/data/v9.2/environmentvariabledefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "schemaname": "contoso_SharePointSite",
  "displayname": "SharePoint Project Site",
  "description": "SharePoint site for project document storage",
  "type": 100000004
}
```

## Setting Current Values (Per-Environment Override)

### Create a Value Override

First, find the definition ID:

```http
GET /api/data/v9.2/environmentvariabledefinitions?$filter=schemaname eq 'contoso_ApiBaseUrl'&$select=environmentvariabledefinitionid
```

Then create the value:

```http
POST /api/data/v9.2/environmentvariablevalues
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "schemaname": "contoso_ApiBaseUrl_Value",
  "value": "https://api-prod.example.com/v1",
  "EnvironmentVariableDefinitionId@odata.bind": "/environmentvariabledefinitions({definition-id})"
}
```

### Update an Existing Value

```http
PATCH /api/data/v9.2/environmentvariablevalues({value-id})
Content-Type: application/json

{
  "value": "https://api-staging.example.com/v1"
}
```

### Delete a Value (Revert to Default)

```http
DELETE /api/data/v9.2/environmentvariablevalues({value-id})
```

When deleted, the environment reverts to the default value from the definition.

## Querying Environment Variables

### Get All Definitions with Current Values

```http
GET /api/data/v9.2/environmentvariabledefinitions?$select=schemaname,displayname,type,defaultvalue&$expand=environmentvariabledefinition_environmentvariablevalue($select=value)
```

### Get a Specific Variable's Effective Value

```http
GET /api/data/v9.2/environmentvariabledefinitions?$filter=schemaname eq 'contoso_ApiBaseUrl'&$select=schemaname,defaultvalue&$expand=environmentvariabledefinition_environmentvariablevalue($select=value)
```

**Logic for effective value:**
1. If a value record exists → use its `value`
2. If no value record → use the definition's `defaultvalue`
3. If neither exists → variable is empty

### PowerShell: Get Effective Value

```powershell
function Get-EnvVarValue {
    param([string]$SchemaName)

    $result = Invoke-DataverseApi -Method GET `
        -Endpoint "/environmentvariabledefinitions?`$filter=schemaname eq '$SchemaName'&`$select=defaultvalue&`$expand=environmentvariabledefinition_environmentvariablevalue(`$select=value)"

    $def = $result.value[0]
    $values = $def.environmentvariabledefinition_environmentvariablevalue

    if ($values -and $values.Count -gt 0) {
        return $values[0].value  # Current value override
    }
    return $def.defaultvalue  # Fall back to default
}

# Usage
$apiUrl = Get-EnvVarValue -SchemaName "contoso_ApiBaseUrl"
```

## Batch Setup: Create Multiple Variables

```bash
#!/bin/bash
set -euo pipefail

# Define variables as array
declare -A VARS=(
  ["contoso_ApiBaseUrl"]="String|API Base URL|https://api.example.com/v1"
  ["contoso_EnableAI"]="Boolean|Enable AI|no"
  ["contoso_MaxBatch"]="Number|Max Batch Size|500"
  ["contoso_Config"]="JSON|App Config|{\"retries\":3}"
)

# Type mapping
declare -A TYPE_MAP=(
  ["String"]=100000000
  ["Number"]=100000001
  ["Boolean"]=100000002
  ["JSON"]=100000003
)

for schema in "${!VARS[@]}"; do
  IFS='|' read -r type display default <<< "${VARS[$schema]}"
  type_val=${TYPE_MAP[$type]}

  echo "Creating: $schema ($type)"
  curl -s -X POST "${BASE_URL}/environmentvariabledefinitions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "OData-Version: 4.0" \
    -H "Content-Type: application/json" \
    -H "MSCRM.SolutionUniqueName: ${SOLUTION_NAME}" \
    -d "{
      \"schemaname\": \"${schema}\",
      \"displayname\": \"${display}\",
      \"type\": ${type_val},
      \"defaultvalue\": \"${default}\",
      \"isrequired\": false
    }"
done
```

## Environment Variables in Solutions

### ALM Pattern

1. **Development:** Create definitions with default values. These travel with the solution.
2. **Export:** Solution zip contains the definition + default value. Current values are exported separately.
3. **Import to target:** After importing the managed solution, set current values per-environment.
4. **Key principle:** Never hardcode environment-specific values in the default. Use defaults for dev, override for test/prod.

### Remove a Value Before Export

To ensure your solution doesn't carry a dev-specific value:

```http
# Find the value record
GET /api/data/v9.2/environmentvariablevalues?$filter=EnvironmentVariableDefinitionId/schemaname eq 'contoso_ApiBaseUrl'&$select=environmentvariablevalueid

# Delete it
DELETE /api/data/v9.2/environmentvariablevalues({value-id})
```

## Consuming Environment Variables

### In Power Automate Flows
Environment variables appear as dynamic content under the "Environment Variables" section. Reference by schema name.

### In Canvas Apps
```
Environment.contoso_ApiBaseUrl
```

### In Code Apps (React)
Access via the Dataverse Web API at runtime:
```typescript
const response = await fetch(
  `${baseUrl}/environmentvariabledefinitions?$filter=schemaname eq 'contoso_ApiBaseUrl'&$select=defaultvalue&$expand=environmentvariabledefinition_environmentvariablevalue($select=value)`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const data = await response.json();
const effectiveValue = data.value[0]
  .environmentvariabledefinition_environmentvariablevalue?.[0]?.value
  ?? data.value[0].defaultvalue;
```

### In Plugins (C#)
```csharp
// Query the environment variable value
var query = new QueryExpression("environmentvariablevalue")
{
    ColumnSet = new ColumnSet("value"),
    Criteria = new FilterExpression()
};
query.Criteria.AddCondition(
    "environmentvariabledefinitionid", ConditionOperator.Equal, definitionId);
var result = service.RetrieveMultiple(query);
string value = result.Entities.FirstOrDefault()?["value"]?.ToString()
    ?? defaultValue;
```

## Anti-Patterns

- **Hardcoding configuration in code or flows** — use environment variables for any value that differs between environments (URLs, keys, feature flags, thresholds).
- **Storing secrets as String type** — use Secret type with Azure Key Vault reference. String values are visible to anyone with read access.
- **Exporting current values in solutions** — current values should be set per-environment after import. Remove dev-specific values before export.
- **Not setting `isrequired: true` for critical variables** — required variables prompt for values during solution import, preventing missing configuration.
- **Creating variables without the solution header** — environment variables without `MSCRM.SolutionUniqueName` land in the Default Solution and can't be transported.
- **Using Data Source type when String suffices** — Data Source type is specifically for data source connection references. Use String for URLs, JSON for complex config.
- **Not providing default values** — definitions without defaults and without current values return empty, which may cause runtime failures. Always set a sensible default for non-secret variables.
