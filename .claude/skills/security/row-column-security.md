# Security — Row & Column Security

## Column Security (Field-Level Security)

### When to Use
- Salary, compensation data
- Personal identification numbers (SSN, tax IDs)
- Sensitive PII (health data, financial data)
- Internal notes not meant for all users
- API keys, tokens stored in Dataverse

### Setup Steps

#### 1. Enable Column Security on the Column
```http
PATCH /api/data/v9.2/EntityDefinitions(LogicalName='contact')/Attributes(LogicalName='contoso_salary')
Content-Type: application/json

{
  "IsSecured": true
}
```

#### 2. Create Field Security Profile
```http
POST /api/data/v9.2/fieldsecurityprofiles
Content-Type: application/json

{
  "name": "Salary Viewers",
  "description": "Users who can view salary information"
}
```

#### 3. Add Field Permissions to Profile
```http
POST /api/data/v9.2/fieldpermissions
Content-Type: application/json

{
  "entityname": "contact",
  "attributelogicalname": "contoso_salary",
  "canread": 4,
  "canupdate": 4,
  "cancreate": 4,
  "fieldsecurityprofileid@odata.bind": "/fieldsecurityprofiles(profile-guid)"
}
```
Values: `0` = Not Allowed, `4` = Allowed.

#### 4. Assign Profile to Users/Teams
```http
# Assign to user
POST /api/data/v9.2/fieldsecurityprofiles(profile-guid)/systemuserprofiles_association/$ref
Content-Type: application/json

{
  "@odata.id": "https://org.api.crm.dynamics.com/api/data/v9.2/systemusers(user-guid)"
}

# Assign to team
POST /api/data/v9.2/fieldsecurityprofiles(profile-guid)/teamprofiles_association/$ref
Content-Type: application/json

{
  "@odata.id": "https://org.api.crm.dynamics.com/api/data/v9.2/teams(team-guid)"
}
```

---

## Record Sharing

### Share Record with User
```http
POST /api/data/v9.2/GrantAccess
Content-Type: application/json

{
  "Target": {
    "contactid": "record-guid",
    "@odata.type": "Microsoft.Dynamics.CRM.contact"
  },
  "PrincipalAccess": {
    "Principal": {
      "systemuserid": "user-guid",
      "@odata.type": "Microsoft.Dynamics.CRM.systemuser"
    },
    "AccessMask": "ReadAccess,WriteAccess"
  }
}
```

### AccessMask Values
| Value | Privilege |
|---|---|
| `ReadAccess` | Read |
| `WriteAccess` | Write |
| `AppendAccess` | Append |
| `AppendToAccess` | Append To |
| `CreateAccess` | Create |
| `DeleteAccess` | Delete |
| `ShareAccess` | Share |
| `AssignAccess` | Assign |

### Revoke Shared Access
```http
POST /api/data/v9.2/RevokeAccess
Content-Type: application/json

{
  "Target": {
    "contactid": "record-guid",
    "@odata.type": "Microsoft.Dynamics.CRM.contact"
  },
  "Revokee": {
    "systemuserid": "user-guid",
    "@odata.type": "Microsoft.Dynamics.CRM.systemuser"
  }
}
```

### Check User's Access to Record
```http
POST /api/data/v9.2/RetrievePrincipalAccess
Content-Type: application/json

{
  "Target": {
    "contactid": "record-guid",
    "@odata.type": "Microsoft.Dynamics.CRM.contact"
  },
  "Principal": {
    "systemuserid": "user-guid",
    "@odata.type": "Microsoft.Dynamics.CRM.systemuser"
  }
}
```

---

## Hierarchy Security

### Manager Hierarchy
```
CEO
├── VP Sales
│   ├── Sales Manager APAC
│   │   ├── Sales Rep 1 ← can only see own records
│   │   └── Sales Rep 2 ← can only see own records
│   │   Manager sees Rep 1 + Rep 2 records
│   └── Sales Manager EMEA
│       └── ...
VP Sales sees ALL below
```

Enable via: Settings → Security → Hierarchy Security → Enable Manager Hierarchy.

### Position Hierarchy
Custom hierarchy independent of org chart. Useful when access doesn't follow management lines.
