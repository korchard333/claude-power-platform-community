# Security — Business Units & Teams

## Business Units

### Hierarchy Design
```
Root Business Unit (org-wide)
├── Corporate
│   ├── HR
│   ├── Finance
│   └── IT
├── Sales
│   ├── Sales - APAC
│   ├── Sales - EMEA
│   └── Sales - Americas
└── Operations
    ├── Ops - Manufacturing
    └── Ops - Logistics
```

### Rules
- Every user belongs to exactly ONE business unit
- BU determines the scope of "Business Unit" privilege level
- Changing a user's BU changes their data access scope
- Root BU cannot be deleted or renamed
- Security roles are BU-scoped — a role in BU-A is separate from same-named role in BU-B

### Create Business Unit
```http
POST /api/data/v9.2/businessunits
Content-Type: application/json

{
  "name": "Sales - APAC",
  "parentbusinessunitid@odata.bind": "/businessunits(parent-bu-guid)"
}
```

---

## Teams

### Team Types
| Type | Use Case | Membership |
|---|---|---|
| Owner Team | Owns records, has security roles | Manual assignment |
| Access Team | Share specific records on-demand | Auto-added when user shares |
| Microsoft Entra ID Group Team | Sync membership from Entra ID groups | Automatic via group sync |

### Owner Teams
```http
# Create owner team
POST /api/data/v9.2/teams
Content-Type: application/json

{
  "name": "Project Alpha Team",
  "teamtype": 0,
  "businessunitid@odata.bind": "/businessunits(bu-guid)",
  "description": "Team for Project Alpha"
}

# Add member
POST /api/data/v9.2/teams(team-guid)/teammembership_association/$ref
Content-Type: application/json

{
  "@odata.id": "https://org.api.crm.dynamics.com/api/data/v9.2/systemusers(user-guid)"
}

# Assign security role to team
POST /api/data/v9.2/teams(team-guid)/teamroles_association/$ref
Content-Type: application/json

{
  "@odata.id": "https://org.api.crm.dynamics.com/api/data/v9.2/roles(role-guid)"
}
```

### Access Teams (Auto-Created)
```
1. Enable access teams on the table (EntityDefinitions → AutoCreateAccessTeams = true)
2. Create Access Team Template:
   POST /api/data/v9.2/teamtemplates
   {
     "teamtemplatename": "Project Reviewers",
     "objecttypecode": 10001,   // Entity type code for contoso_project
     "defaultaccessrightsmask": 1  // Read access
   }
3. Add user to record's access team:
   POST /api/data/v9.2/AddMembersTeam
   {
     "TeamId": "auto-generated-access-team-guid",
     "MemberIds": ["user-guid"]
   }
```

### Microsoft Entra ID Group Teams
```http
# Create Entra ID Group Team
POST /api/data/v9.2/teams
Content-Type: application/json

{
  "name": "Sales Team (Entra ID Synced)",
  "teamtype": 2,
  "azureactivedirectoryobjectid": "entra-id-group-object-id",
  "membershiptype": 0,
  "businessunitid@odata.bind": "/businessunits(bu-guid)"
}
```
Membership syncs automatically from Entra ID group.
