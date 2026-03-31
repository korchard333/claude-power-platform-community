# Security — Web API Management

## Security Role Management via Web API

### Create Security Role
```http
POST /api/data/v9.2/roles
Content-Type: application/json

{
  "name": "Contoso Project User",
  "businessunitid@odata.bind": "/businessunits(root-bu-guid)",
  "description": "Standard user access for Contoso Projects app"
}
```

### Query Existing Roles
```http
GET /api/data/v9.2/roles
  ?$select=name,roleid,ismanaged,iscustomizable
  &$filter=name eq 'Contoso Project User'
```

### Assign Role to User
```http
POST /api/data/v9.2/systemusers(user-guid)/systemuserroles_association/$ref
Content-Type: application/json

{
  "@odata.id": "https://org.api.crm.dynamics.com/api/data/v9.2/roles(role-guid)"
}
```

### Assign Role to Team
```http
POST /api/data/v9.2/teams(team-guid)/teamroles_association/$ref
Content-Type: application/json

{
  "@odata.id": "https://org.api.crm.dynamics.com/api/data/v9.2/roles(role-guid)"
}
```

### Query User's Roles
```http
GET /api/data/v9.2/systemusers(user-guid)
  ?$expand=systemuserroles_association($select=name,roleid)
```

### Set Privileges on Role (via RolePrivileges)
```http
# Add privilege to role
POST /api/data/v9.2/AddPrivilegesRole
Content-Type: application/json

{
  "RoleId": "role-guid",
  "Privileges": [
    {
      "PrivilegeId": "privilege-guid-for-prvReadcontoso_project",
      "Depth": "Global"
    },
    {
      "PrivilegeId": "privilege-guid-for-prvWritecontoso_project",
      "Depth": "Local"
    }
  ]
}
```

Depth values: `"Basic"` (User), `"Local"` (Business Unit), `"Deep"` (Parent:Child), `"Global"` (Organization).

### Query Available Privileges
```http
# Find privilege GUIDs for a specific table
GET /api/data/v9.2/privileges
  ?$select=name,privilegeid,accessright
  &$filter=contains(name,'contoso_project')
```

---

## Security Design Checklist

```markdown
## Security Model Design: [Solution Name]

### Tables & Access Matrix
| Table | App Admin | App Manager | App User | App Reader |
|---|---|---|---|---|
| contoso_project | Org CRUD | BU CRUD | User CRW | Org R |
| contoso_task | Org CRUD | BU CRUD | User CRUD | Org R |
| contoso_resource | Org CRUD | BU R | User R | Org R |
| account (system) | Org R | BU R | User R | Org R |
| contact (system) | Org R | BU R | User R | Org R |

### Column Security
| Table | Column | Who Can Read | Who Can Update |
|---|---|---|---|
| contoso_project | contoso_budget | Finance Team, App Admin | Finance Team |
| contact | contoso_salary | HR Team | HR Team |

### Business Units
- Root BU → Corporate functions
- Regional BUs → Data segregation by region

### Teams
- Owner Team per project (dynamic membership)
- Entra ID Group Team for department-level roles

### Sharing Rules
- Projects shared with cross-functional team members
- Access team template for project reviewers

### Validation
- [ ] Test as each role — verify CRUD boundaries
- [ ] Test cross-BU access — verify isolation
- [ ] Test column security — verify restricted fields masked
- [ ] Test with no roles — verify access denied
- [ ] Verify lookup target tables have Read access
- [ ] Verify AppendTo on lookup target tables
```

---

## Deprecations & Important Changes

| Change | Status | Date | Action |
|---|---|---|---|
| **BYOK (Bring Your Own Key)** | Deprecated | January 2026 | Migrate to Customer-Managed Keys (CMK) via Azure Key Vault |
| **Multitenant apps without SPN** | Blocked | October 2024 | Multitenant apps must have a service principal registered in the tenant |
| **Purview audit field values** | Changing | May 2026 | Before-and-after field values will be excluded from Purview audit events |
