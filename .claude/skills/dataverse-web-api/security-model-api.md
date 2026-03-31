# Security Model via Web API

## Overview

Dataverse security model components — security roles, privileges, column security profiles, and field permissions — can all be managed via the Web API. This enables programmatic setup of security models as part of solution builds, CI/CD pipelines, and automated provisioning.

## Security Roles

### Create a Security Role

```http
POST /api/data/v9.2/roles
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "Project Manager",
  "description": "Can manage projects and tasks within their business unit",
  "businessunitid@odata.bind": "/businessunits({ROOT-BU-GUID})",
  "isinherited": 1
}
```

**Response header:** `OData-EntityId: .../roles({new-role-id})`

**`isinherited` values (Member's privilege inheritance):**
| Value | Meaning |
|---|---|
| `0` | Team privileges only |
| `1` | Direct User (Basic) access level and Team privileges (default) |

### Query Security Roles

```http
# All custom security roles (exclude system roles)
GET /api/data/v9.2/roles?$filter=iscustomizable/Value eq true&$select=name,roleid,description

# Find a specific role by name
GET /api/data/v9.2/roles?$filter=name eq 'Project Manager'&$select=roleid,name
```

### Update a Security Role

```http
PATCH /api/data/v9.2/roles({roleid})
Content-Type: application/json

{
  "name": "Senior Project Manager",
  "description": "Updated description"
}
```

### Delete a Security Role

```http
DELETE /api/data/v9.2/roles({roleid})
```

## Privilege Assignment

Privileges control CRUD + Append + Share operations per table. Use the `AddPrivilegesRole` action to assign privileges to a role.

### Step 1: Find the Privilege IDs

```http
# Get privilege IDs for a specific table (e.g., contoso_project)
GET /api/data/v9.2/privileges?$filter=contains(name,'contoso_project')&$select=name,privilegeid
```

Common privilege naming pattern: `prv{Operation}{TableLogicalName}`
- `prvCreatecontoso_project`
- `prvReadcontoso_project`
- `prvWritecontoso_project`
- `prvDeletecontoso_project`
- `prvAppendcontoso_project`
- `prvAppendTocontoso_project`
- `prvSharecontoso_project`
- `prvAssigncontoso_project`

### Step 2: Add Privileges to the Role

```http
POST /api/data/v9.2/roles({roleid})/Microsoft.Dynamics.CRM.AddPrivilegesRole
Content-Type: application/json

{
  "Privileges": [
    {
      "PrivilegeId": "{prvCreatecontoso_project-GUID}",
      "Depth": "Basic"
    },
    {
      "PrivilegeId": "{prvReadcontoso_project-GUID}",
      "Depth": "Local"
    },
    {
      "PrivilegeId": "{prvWritecontoso_project-GUID}",
      "Depth": "Basic"
    },
    {
      "PrivilegeId": "{prvDeletecontoso_project-GUID}",
      "Depth": "Basic"
    },
    {
      "PrivilegeId": "{prvAppendcontoso_project-GUID}",
      "Depth": "Basic"
    },
    {
      "PrivilegeId": "{prvAppendTocontoso_project-GUID}",
      "Depth": "Basic"
    }
  ]
}
```

### Privilege Depth Values

> ⚠️ Privilege depth uses **string enum values**, NOT integers. The Web API returns HTTP 400 if you pass `"Depth": 0` instead of `"Depth": "Basic"`.

| Value | Name | Meaning | Access Level |
|---|---|---|---|
| `"Basic"` | Basic | Own records only | User |
| `"Local"` | Local | Records in same business unit | Business Unit |
| `"Deep"` | Deep | Records in same BU + child BUs | Parent: Child Business Unit |
| `"Global"` | Global | All records in org | Organization |

### ⚠️ Org-Owned Tables: Global Depth Only

Tables with **Organization ownership** (e.g., lookup/reference tables like categories, statuses) only support `Global` depth. Attempting to assign `Basic`, `Local`, or `Deep` depth to privileges on org-owned tables returns **HTTP 400**.

```python
# Check table ownership type before assigning privileges
table_meta = api_get(f"EntityDefinitions(LogicalName='{table_name}')?$select=OwnershipType")
ownership = table_meta["OwnershipType"]  # "UserOwned" or "OrganizationOwned"

if ownership == "OrganizationOwned":
    depth = "Global"  # only valid depth for org-owned tables
else:
    depth = desired_depth  # "Basic"/"Local"/"Deep"/"Global" all valid for user-owned
```

**Rule:** Always check `OwnershipType` before assigning privilege depths. Org-owned tables get `Global` regardless of role intent (Admin vs User).

### Retrieve Current Privileges for a Role

```http
GET /api/data/v9.2/roles({roleid})?$select=roleid&$expand=roleprivileges_association($select=name)
```

### Remove a Privilege from a Role

```http
DELETE /api/data/v9.2/roles({roleid})/roleprivileges_association({privilegeid})/$ref
```

## Scripted Role Setup

### Bash: Create a Complete 3-Role Security Model

```bash
#!/bin/bash
set -euo pipefail

# Prerequisites: TOKEN, BASE_URL, SOLUTION_NAME, ROOT_BU set

create_role() {
  local name=$1
  local desc=$2

  local response=$(curl -s -D - -X POST "${BASE_URL}/roles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "OData-Version: 4.0" \
    -H "Content-Type: application/json" \
    -H "MSCRM.SolutionUniqueName: ${SOLUTION_NAME}" \
    -H "Prefer: return=representation" \
    -d "{
      \"name\": \"${name}\",
      \"description\": \"${desc}\",
      \"businessunitid@odata.bind\": \"/businessunits(${ROOT_BU})\",
      \"isinherited\": 1
    }")

  echo "$response" | grep -oP '"roleid"\s*:\s*"\K[^"]+'
}

# Create 3 roles
ADMIN_ROLE=$(create_role "Project Admin" "Full org-wide access to all project entities")
MANAGER_ROLE=$(create_role "Project Manager" "BU-level access to projects and tasks")
USER_ROLE=$(create_role "Project User" "Own records only")

echo "Created roles: Admin=$ADMIN_ROLE, Manager=$MANAGER_ROLE, User=$USER_ROLE"

# Get privilege IDs for contoso_project
PRIVS=$(curl -s -X GET "${BASE_URL}/privileges?\$filter=contains(name,'contoso_project')&\$select=name,privilegeid" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Accept: application/json")

# Parse and assign (example for Read privilege at different depths)
READ_PRIV=$(echo "$PRIVS" | jq -r '.value[] | select(.name=="prvReadcontoso_project") | .privilegeid')

# Admin: Global read
curl -s -X POST "${BASE_URL}/roles(${ADMIN_ROLE})/Microsoft.Dynamics.CRM.AddPrivilegesRole" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Content-Type: application/json" \
  -d "{\"Privileges\": [{\"PrivilegeId\": \"${READ_PRIV}\", \"Depth\": \"Global\"}]}"

# Manager: Local/BU read
curl -s -X POST "${BASE_URL}/roles(${MANAGER_ROLE})/Microsoft.Dynamics.CRM.AddPrivilegesRole" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Content-Type: application/json" \
  -d "{\"Privileges\": [{\"PrivilegeId\": \"${READ_PRIV}\", \"Depth\": \"Local\"}]}"

# User: Basic/own read
curl -s -X POST "${BASE_URL}/roles(${USER_ROLE})/Microsoft.Dynamics.CRM.AddPrivilegesRole" \
  -H "Authorization: Bearer $TOKEN" \
  -H "OData-Version: 4.0" \
  -H "Content-Type: application/json" \
  -d "{\"Privileges\": [{\"PrivilegeId\": \"${READ_PRIV}\", \"Depth\": \"Basic\"}]}"
```

## Column Security Profiles

Column security restricts access to specific columns regardless of the user's security role. Use when sensitive data (salary, SSN, budget) must be hidden from certain users.

### Create a Column Security Profile

```http
POST /api/data/v9.2/fieldsecurityprofiles
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "Budget Viewers",
  "description": "Users who can view budget-related columns"
}
```

### Create Field Permissions

After creating the profile, define which columns it grants access to:

```http
POST /api/data/v9.2/fieldpermissions
Content-Type: application/json

{
  "fieldpermissionid": "{new-guid}",
  "entityname": "contoso_project",
  "attributelogicalname": "contoso_budget",
  "canread": 4,
  "canupdate": 4,
  "cancreate": 4,
  "fieldsecurityprofileid@odata.bind": "/fieldsecurityprofiles({profile-id})"
}
```

**Permission values:**
| Value | Meaning |
|---|---|
| `0` | Not Allowed |
| `4` | Allowed |

### Enable Column Security on a Column

Before field permissions work, the column must be marked as secured:

```http
PUT /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes(LogicalName='contoso_budget')
Content-Type: application/json

{
  "@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
  "IsSecured": true
}
```

**Note:** Once `IsSecured` is set to `true`, users without a field security profile that grants access will see `*****` instead of the actual value.

### Query Field Permissions for a Profile

```http
GET /api/data/v9.2/fieldsecurityprofiles({profile-id})/fieldpermissions?$select=entityname,attributelogicalname,canread,canupdate,cancreate
```

## Assigning Roles and Profiles to Users

### Assign a Security Role to a User

```http
POST /api/data/v9.2/systemusers({userid})/systemuserroles_association/$ref
Content-Type: application/json

{
  "@odata.id": "{BASE_URL}/roles({roleid})"
}
```

### Assign a Security Role to a Team

```http
POST /api/data/v9.2/teams({teamid})/teamroles_association/$ref
Content-Type: application/json

{
  "@odata.id": "{BASE_URL}/roles({roleid})"
}
```

### Assign a Column Security Profile to a User

```http
POST /api/data/v9.2/fieldsecurityprofiles({profileid})/systemuserprofiles_association/$ref
Content-Type: application/json

{
  "@odata.id": "{BASE_URL}/systemusers({userid})"
}
```

### Assign a Column Security Profile to a Team

```http
POST /api/data/v9.2/fieldsecurityprofiles({profileid})/teamprofiles_association/$ref
Content-Type: application/json

{
  "@odata.id": "{BASE_URL}/teams({teamid})"
}
```

### Remove a Role Assignment

```http
DELETE /api/data/v9.2/systemusers({userid})/systemuserroles_association({roleid})/$ref
```

## Querying the Security Model

### Get all roles assigned to a user

```http
GET /api/data/v9.2/systemusers({userid})?$expand=systemuserroles_association($select=name,roleid)&$select=fullname
```

### Get all users with a specific role

```http
GET /api/data/v9.2/roles({roleid})?$expand=systemuserroles_association($select=fullname,systemuserid)
```

### Get all secured columns for a table

```http
GET /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes?$filter=IsSecured eq true&$select=LogicalName,DisplayName
```

## Security Model Design Pattern

A typical enterprise security model for a project management app:

```
Security Roles:
  ├── Project Admin (Organization-level CRUD on all project tables)
  ├── Project Manager (BU-level CRUD on projects, tasks, milestones)
  └── Project User (User-level CRUD on tasks assigned to them)

Column Security Profiles:
  ├── Budget Viewers (Read access to contoso_budget, contoso_actualcost)
  └── Budget Editors (Read + Update access to budget columns)

Assignment:
  ├── Admin users → Project Admin role + Budget Editors profile
  ├── Managers → Project Manager role + Budget Viewers profile
  └── Team members → Project User role (no budget profile = no access)
```

## Anti-Patterns

- **Assigning Organization-level access to non-admin roles** — use the minimum depth needed. Basic for most users, Local for managers, Global only for admins.
- **Using security roles alone for column-level protection** — security roles control row access (CRUD per table). Use column security profiles for field-level protection.
- **Forgetting to set `IsSecured: true` on columns** — field permissions have no effect until the column is marked as secured.
- **Creating too many fine-grained roles** — aim for 3-5 roles per app area. Combine with column security profiles for field-level control. Too many roles become unmanageable.
- **Not testing as each role** — always verify security boundaries by impersonating users with each role. Use `MSCRM.CallerObjectId` header for testing.
- **Hardcoding privilege GUIDs** — privilege IDs vary between environments. Always query by name first.
- **Assigning roles to individual users instead of teams** — use Entra ID group teams for scalable role assignment. Assign roles to teams, add users to groups.
