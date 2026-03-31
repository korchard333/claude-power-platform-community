# Authentication & Scripting

## Azure CLI Token (Interactive Development)

The recommended authentication method for development:

```bash
# Login (one-time)
az login
```

> ⚠️ **Dataverse-only tenants (no Azure subscription):** Add `--allow-no-subscriptions` to `az login`, otherwise the command exits with error code 1 and doesn't persist the session:
> ```bash
> az login --tenant "{tenant-id}" --allow-no-subscriptions
> ```
> Also always include `--tenant "{tenant-id}"` on `az account get-access-token` calls to avoid token requests going to the wrong tenant.

```bash
# Get token for Dataverse
TOKEN=$(az account get-access-token \
  --resource "https://[org].crm6.dynamics.com/" \
  --tenant "[tenant-id]" \
  --query accessToken -o tsv)

# Use in API calls
curl -s -X GET "https://[org].api.crm6.dynamics.com/api/data/v9.2/WhoAmI" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Accept: application/json"
```

**Region mapping for `--resource`:**
| Region | URL Pattern |
|---|---|
| North America | `https://[org].crm.dynamics.com/` |
| South America | `https://[org].crm2.dynamics.com/` |
| Canada | `https://[org].crm3.dynamics.com/` |
| UK | `https://[org].crm4.dynamics.com/` |
| Asia Pacific | `https://[org].crm5.dynamics.com/` |
| Australia | `https://[org].crm6.dynamics.com/` |
| Japan | `https://[org].crm11.dynamics.com/` |

**Note:** The `--resource` URL must NOT include `/api/data/...` — it is the org root URL only.

## Token Refresh

Azure CLI tokens expire after ~60-75 minutes. For long-running scripts:

```bash
# Bash — refresh function
get_token() {
  az account get-access-token \
    --resource "https://[org].crm6.dynamics.com/" \
    --tenant "[tenant-id]" \
    --query accessToken -o tsv
}

# Refresh before each major operation
TOKEN=$(get_token)
```

```powershell
# PowerShell — refresh function
function Get-DataverseToken {
    az account get-access-token `
        --resource "https://[org].crm6.dynamics.com/" `
        --tenant "[tenant-id]" `
        --query accessToken -o tsv
}

$token = Get-DataverseToken
```

## Service Principal OAuth2 (CI/CD & Automation)

For pipelines and unattended scripts:

```bash
TOKEN=$(curl -s -X POST "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "scope=https://${ORG}.crm.dynamics.com/.default" \
  | jq -r '.access_token')
```

```powershell
$body = @{
    grant_type    = "client_credentials"
    client_id     = $env:CLIENT_ID
    client_secret = $env:CLIENT_SECRET
    scope         = "https://$($env:ORG).crm.dynamics.com/.default"
}
$response = Invoke-RestMethod -Uri "https://login.microsoftonline.com/$($env:TENANT_ID)/oauth2/v2.0/token" -Method POST -Body $body
$token = $response.access_token
```

**Prerequisites for service principal:**
1. Azure App Registration with Dataverse API permissions
2. Application user created in Power Platform Admin Center
3. Security role assigned to the application user
4. Client secret or certificate configured

## Windows: Always Use PowerShell

On Windows, bash (Git Bash, WSL) can mangle OData query parameters because `$filter`, `$select`, `$expand` are interpreted as shell variables.

**Bad (bash on Windows):**
```bash
# $filter gets interpreted as empty variable
curl "https://org.crm.dynamics.com/api/data/v9.2/accounts?$filter=name eq 'Contoso'"
```

**Good (PowerShell):**
```powershell
$baseUrl = "https://[org].api.crm.dynamics.com/api/data/v9.2"

Invoke-RestMethod -Uri "$baseUrl/accounts?`$filter=name eq 'Contoso'" `
    -Headers @{
        "Authorization" = "Bearer $token"
        "OData-Version" = "4.0"
        "Accept"        = "application/json"
    }
```

**Note:** In PowerShell, escape `$` with backtick (`` `$filter ``) or use single quotes for the query string.

## macOS / zsh Notes

- **Single-quote URLs** containing `$` characters: `'...?$filter=...'` — zsh also expands `$` in double quotes
- **Heredocs:** Use quoted delimiter `cat << 'EOF'` to prevent variable expansion
- For complex builds, **Python is recommended on ALL platforms**, not just Windows (see Recommended Scripting Language below)

## Entity Metadata Updates Require PUT, Not PATCH

`PATCH /api/data/v9.2/EntityDefinitions(LogicalName='...')` returns **HTTP 405 Method Not Allowed** for entity metadata updates. The Dataverse Web API requires `PUT` with the full entity definition for metadata operations.

**Confirmed by Microsoft docs:** "You can't use the PATCH method to update data model entities... you must use the PUT method."

Required headers:
- `If-Match: *` — required for optimistic concurrency
- `MSCRM.MergeLabels: true` — preserves existing language labels not included in your update

```http
PUT /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')
Content-Type: application/json
If-Match: *
MSCRM.MergeLabels: true

{
  "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
  "IsQuickCreateEnabled": true
}
```

**Pattern:** GET the full entity definition first, modify the properties you need, then PUT back.

⚠️ Without `MSCRM.MergeLabels: true`, existing localized labels are LOST (overwritten by the update).

## Recommended Scripting Language

| Scenario | Recommended | Why |
|---|---|---|
| Simple operations (1-3 API calls) | Bash/curl or PowerShell | Quick, minimal setup |
| Full solution builds (tables + columns + views + forms + app) | **Python** with `requests` | Safe JSON/XML handling, proper error handling per step |

**Why Python for complex builds:**
- Bash cannot safely handle multi-line JSON payloads or XML strings across 20+ steps
- Variable interpolation in bash mangles `$filter`, `$select` OData parameters
- `set -euo pipefail` kills the script on expected 412/404 responses — Python handles per-step errors naturally
- **Never use Python f-strings for XML construction.** Curly braces in GUIDs (`{guid}`) conflict with f-string syntax (`{variable}`), producing malformed XML with triple-brace `{{{...}}}` artifacts. Use string concatenation (`'...' + var + '...'`) instead.

**Do NOT use `set -euo pipefail` with long build scripts.** A 412 (duplicate) is expected during re-runs and should be handled, not fatal.

### Minimal Python Build Script Template
```python
import subprocess, json, requests

def get_token(org_url):
    return subprocess.check_output([
        "az", "account", "get-access-token",
        "--resource", org_url,
        "--query", "accessToken", "-o", "tsv"
    ]).decode().strip()

BASE_URL = "https://[org].crm6.dynamics.com/api/data/v9.2"
TOKEN = get_token("https://[org].crm6.dynamics.com/")
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "OData-Version": "4.0",
    "MSCRM.SolutionUniqueName": "YourSolution"
}

def api_get(path):
    r = requests.get(f"{BASE_URL}/{path}", headers=HEADERS)
    r.raise_for_status()
    return r.json()

def api_post(path, data):
    r = requests.post(f"{BASE_URL}/{path}", headers=HEADERS, json=data)
    if r.status_code == 412:
        print(f"  Already exists (412), skipping")
        return None
    r.raise_for_status()
    return r
```

## Script Templates

### Bash Template (macOS/Linux)
```bash
#!/bin/bash
set -eo pipefail  # Note: -u omitted to allow safe 412/404 handling

ORG="yourorg"
REGION="crm6"  # Australia
TENANT_ID="your-tenant-id"
BASE_URL="https://${ORG}.api.${REGION}.dynamics.com/api/data/v9.2"
SOLUTION_NAME="YourSolution"

# Authenticate
TOKEN=$(az account get-access-token \
  --resource "https://${ORG}.${REGION}.dynamics.com/" \
  --tenant "${TENANT_ID}" \
  --query accessToken -o tsv)

# Helper function for API calls
api_call() {
  local method=$1
  local endpoint=$2
  local data=${3:-}

  local args=(
    -s -X "$method"
    "${BASE_URL}${endpoint}"
    -H "Authorization: Bearer $TOKEN"
    -H "OData-Version: 4.0"
    -H "Accept: application/json"
    -H "MSCRM.SolutionUniqueName: ${SOLUTION_NAME}"
  )

  if [ -n "$data" ]; then
    args+=(-H "Content-Type: application/json" -d "$data")
  fi

  curl "${args[@]}"
}

# Example: Create a table
api_call POST "/EntityDefinitions" '{
  "SchemaName": "contoso_Project",
  ...
}'
```

### PowerShell Template (Windows)
```powershell
$org = "yourorg"
$region = "crm6"  # Australia
$tenantId = "your-tenant-id"
$baseUrl = "https://$org.api.$region.dynamics.com/api/data/v9.2"
$solutionName = "YourSolution"

# Authenticate
$token = az account get-access-token `
    --resource "https://$org.$region.dynamics.com/" `
    --tenant $tenantId `
    --query accessToken -o tsv

$headers = @{
    "Authorization"           = "Bearer $token"
    "OData-Version"           = "4.0"
    "Accept"                  = "application/json"
    "MSCRM.SolutionUniqueName" = $solutionName
}

# Helper function for API calls
function Invoke-DataverseApi {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body
    )
    $params = @{
        Uri     = "$baseUrl$Endpoint"
        Method  = $Method
        Headers = $headers
    }
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
        $params.ContentType = "application/json"
    }
    Invoke-RestMethod @params
}

# Example: Create a table
Invoke-DataverseApi -Method POST -Endpoint "/EntityDefinitions" -Body @{
    SchemaName = "contoso_Project"
    # ...
}
```

## Idempotent Script Patterns

When running scripts that create schema, use check-before-create patterns to make scripts safely re-runnable.

### Check Before Create: Table Existence

```bash
# Bash: Check if table exists before creating
TABLE_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/EntityDefinitions(LogicalName='contoso_project')" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0")

if [ "$TABLE_EXISTS" = "404" ]; then
  echo "Creating table contoso_project..."
  api_call POST "/EntityDefinitions" '{
    "SchemaName": "contoso_Project",
    "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
    "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Project", "LanguageCode": 1033 }] },
    "DisplayCollectionName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Projects", "LanguageCode": 1033 }] },
    "HasNotes": true,
    "HasActivities": false,
    "OwnershipType": "UserOwned",
    "Attributes": [{
      "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
      "SchemaName": "contoso_Name",
      "IsPrimaryName": true,
      "MaxLength": 200,
      "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Name", "LanguageCode": 1033 }] },
      "RequiredLevel": { "Value": "ApplicationRequired" }
    }]
  }'
else
  echo "Table contoso_project already exists — skipping"
fi
```

```powershell
# PowerShell: Check if table exists before creating
try {
    $null = Invoke-DataverseApi -Method GET -Endpoint "/EntityDefinitions(LogicalName='contoso_project')"
    Write-Host "Table contoso_project already exists - skipping"
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "Creating table contoso_project..."
        Invoke-DataverseApi -Method POST -Endpoint "/EntityDefinitions" -Body @{
            SchemaName = "contoso_Project"
            # ... table definition
        }
    } else { throw }
}
```

### Upsert with Alternate Keys

Use `PATCH` with `If-Match` / `If-None-Match` headers for idempotent record operations:

```http
# Create only if not exists (returns 412 if exists)
PATCH /api/data/v9.2/contoso_projects(contoso_externalid='PRJ-001')
If-None-Match: *
Content-Type: application/json

{
  "contoso_name": "Project Alpha"
}

# Update only if exists (returns 404 if not exists)
PATCH /api/data/v9.2/contoso_projects(contoso_externalid='PRJ-001')
If-Match: *
Content-Type: application/json

{
  "contoso_name": "Project Alpha Updated"
}

# Upsert (create or update — no conditional header)
PATCH /api/data/v9.2/contoso_projects(contoso_externalid='PRJ-001')
Content-Type: application/json

{
  "contoso_name": "Project Alpha"
}
```

### Solution and Publisher Existence Check

```bash
# Check if publisher exists
PUB_CHECK=$(curl -s -X GET \
  "${BASE_URL}/publishers?\$filter=uniquename eq 'contoso'&\$select=publisherid" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Accept: application/json")

PUB_COUNT=$(echo "$PUB_CHECK" | jq '.value | length')

if [ "$PUB_COUNT" = "0" ]; then
  echo "Creating publisher 'contoso'..."
  curl -s -X POST "${BASE_URL}/publishers" \
    -H "Authorization: Bearer $TOKEN" \
    -H "OData-Version: 4.0" \
    -H "Content-Type: application/json" \
    -d '{
      "uniquename": "contoso",
      "friendlyname": "Contoso",
      "customizationprefix": "contoso",
      "customizationoptionvalueprefix": 10000
    }'
else
  echo "Publisher 'contoso' already exists — skipping"
fi

# Check if solution exists
SOL_CHECK=$(curl -s -X GET \
  "${BASE_URL}/solutions?\$filter=uniquename eq 'ContosoProjects'&\$select=solutionid" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Accept: application/json")

SOL_COUNT=$(echo "$SOL_CHECK" | jq '.value | length')

if [ "$SOL_COUNT" = "0" ]; then
  echo "Creating solution 'ContosoProjects'..."
  PUB_ID=$(echo "$PUB_CHECK" | jq -r '.value[0].publisherid')
  curl -s -X POST "${BASE_URL}/solutions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "OData-Version: 4.0" \
    -H "Content-Type: application/json" \
    -H "MSCRM.SolutionUniqueName: ContosoProjects" \
    -d "{
      \"uniquename\": \"ContosoProjects\",
      \"friendlyname\": \"Contoso Projects\",
      \"publisherid@odata.bind\": \"/publishers(${PUB_ID})\",
      \"version\": \"1.0.0.0\"
    }"
else
  echo "Solution 'ContosoProjects' already exists — skipping"
fi
```

### Column Existence Check

```bash
# Check if column exists on a table
COL_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/EntityDefinitions(LogicalName='contoso_project')/Attributes(LogicalName='contoso_budget')" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0")

if [ "$COL_EXISTS" = "404" ]; then
  echo "Creating column contoso_budget..."
  # POST column creation
else
  echo "Column contoso_budget already exists — skipping"
fi
```

### Full Idempotent Script Pattern

Combine all checks into a complete re-runnable build script:

```bash
#!/bin/bash
set -euo pipefail

# Config
ORG="yourorg"; REGION="crm6"; TENANT_ID="your-tenant"
BASE_URL="https://${ORG}.api.${REGION}.dynamics.com/api/data/v9.2"
SOLUTION_NAME="ContosoProjects"

# Auth
TOKEN=$(az account get-access-token \
  --resource "https://${ORG}.${REGION}.dynamics.com/" \
  --tenant "${TENANT_ID}" --query accessToken -o tsv)

HEADERS=(-H "Authorization: Bearer $TOKEN" -H "OData-Version: 4.0" -H "Accept: application/json")

# Helper: check entity exists (returns "true" or "false")
exists() {
  local code=$(curl -s -o /dev/null -w "%{http_code}" "$1" "${HEADERS[@]}")
  [ "$code" = "200" ] && echo "true" || echo "false"
}

# 1. Publisher
if [ "$(exists "${BASE_URL}/publishers(uniquename='contoso')")" = "false" ]; then
  echo "Creating publisher..."
  # POST publisher
fi

# 2. Solution
if [ "$(exists "${BASE_URL}/solutions(uniquename='ContosoProjects')")" = "false" ]; then
  echo "Creating solution..."
  # POST solution
fi

# 3. Tables (check each)
for TABLE in contoso_project contoso_task contoso_milestone; do
  if [ "$(exists "${BASE_URL}/EntityDefinitions(LogicalName='${TABLE}')")" = "false" ]; then
    echo "Creating table ${TABLE}..."
    # POST table with MSCRM.SolutionUniqueName header
  fi
done

# 4. Columns (check each)
# 5. Relationships (check each)

# 6. Views — check before create
VIEW_NAME="Active Projects"
TABLE_NAME="contoso_project"
EXISTING_VIEW=$(curl -s "${BASE_URL}/savedqueries?\$filter=name eq '${VIEW_NAME}' and returnedtypecode eq '${TABLE_NAME}'&\$select=savedqueryid" "${HEADERS[@]}" | jq -r '.value[0].savedqueryid // empty')
if [ -z "$EXISTING_VIEW" ]; then
  echo "Creating view '${VIEW_NAME}'..."
  # POST /api/data/v9.2/savedqueries with MSCRM.SolutionUniqueName header
else
  echo "View '${VIEW_NAME}' already exists: ${EXISTING_VIEW}"
fi

# 7. Forms — check before create
FORM_NAME="Project Main Form"
EXISTING_FORM=$(curl -s "${BASE_URL}/systemforms?\$filter=name eq '${FORM_NAME}' and objecttypecode eq '${TABLE_NAME}'&\$select=formid" "${HEADERS[@]}" | jq -r '.value[0].formid // empty')
if [ -z "$EXISTING_FORM" ]; then
  echo "Creating form '${FORM_NAME}'..."
  # POST /api/data/v9.2/systemforms with MSCRM.SolutionUniqueName header
else
  echo "Form '${FORM_NAME}' already exists: ${EXISTING_FORM}"
fi
```

## Resuming After Partial Failure

Build scripts that create multiple Dataverse components will occasionally fail mid-execution (network timeout, throttling, token expiry). Design for safe resumption:

### Pattern: Check-Before-Create Makes Re-runs Safe
Each step in your script already uses GET-before-POST (see Idempotent Script Patterns above). This means re-running the entire script after a failure safely skips completed steps and picks up where it left off. No manual tracking of "which step failed" is needed.

### Progress Logging
Log each step so you can see what succeeded and what needs to run:
```bash
STEP=1; TOTAL=12
echo "Step $STEP of $TOTAL: Creating table contoso_project... [CREATED]"
# or if already exists:
echo "Step $STEP of $TOTAL: Creating table contoso_project... [SKIPPED - already exists]"
```

### Token Refresh Mid-Script
Long-running scripts may outlast the token's lifetime (typically 60-75 minutes). Check token expiry before each API call:
```bash
# Before each step, check if token expires within 5 minutes
CURRENT_TIME=$(date +%s)
if [ $((TOKEN_EXPIRY - CURRENT_TIME)) -lt 300 ]; then
  echo "Token near expiry, refreshing..."
  TOKEN=$(curl -s -X POST "https://login.microsoftonline.com/$TENANT_ID/oauth2/v2.0/token" \
    -d "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&scope=$ENV_URL/.default&grant_type=client_credentials" \
    | jq -r '.access_token')
  TOKEN_EXPIRY=$((CURRENT_TIME + 3600))
fi
```

### Recovery Checklist
1. Read the script output to identify the last successful step
2. Fix the root cause (network, permissions, throttling)
3. Re-run the entire script -- idempotent checks skip completed steps
4. Verify the final state matches expectations

---

## Authentication Anti-Patterns

- **`pac auth token`** — This command does not exist. Never suggest it.
- **Hardcoded tokens** — Tokens expire. Always fetch dynamically.
- **Personal accounts in CI/CD** — Always use service principals for automation.
- **Client secrets in source control** — Use Azure Key Vault or pipeline secrets.
- **Skipping `--tenant`** — Multi-tenant scenarios will fail without explicit tenant ID.
