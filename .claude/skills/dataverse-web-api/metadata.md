# Metadata Operations (Schema Management)

## Create Custom Table
```http
POST /api/data/v9.2/EntityDefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
  "SchemaName": "contoso_Project",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Project", "LanguageCode": 1033 }] },
  "DisplayCollectionName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Projects", "LanguageCode": 1033 }] },
  "Description": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Custom project table", "LanguageCode": 1033 }] },
  "OwnershipType": "UserOwned",
  "IsActivity": false,
  "HasNotes": true,
  "HasActivities": true,
  "PrimaryNameAttribute": "contoso_name",
  "Attributes": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
      "AttributeType": "String",
      "SchemaName": "contoso_name",
      "MaxLength": 200,
      "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Project Name", "LanguageCode": 1033 }] },
      "IsPrimaryName": true,
      "RequiredLevel": { "Value": "ApplicationRequired" }
    }
  ]
}
```

## Add Column to Existing Table
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
  "SchemaName": "contoso_description",
  "MaxLength": 4000,
  "FormatName": { "Value": "TextArea" },
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Description", "LanguageCode": 1033 }] },
  "RequiredLevel": { "Value": "None" }
}
```

## Column Types for Metadata API
| Type | @odata.type | Key Properties |
|---|---|---|
| String | `StringAttributeMetadata` | `MaxLength`, `FormatName` (Text, TextArea, Email, Url, Phone) |
| Integer | `IntegerAttributeMetadata` | `MinValue`, `MaxValue`, `Format` (None, Duration, Language, Locale) |
| Decimal | `DecimalAttributeMetadata` | `MinValue`, `MaxValue`, `Precision` |
| Money | `MoneyAttributeMetadata` | `MinValue`, `MaxValue`, `Precision`, `PrecisionSource` |
| DateTime | `DateTimeAttributeMetadata` | `Format` (DateOnly, DateAndTime) |
| Boolean | `BooleanAttributeMetadata` | `OptionSet.TrueOption`, `OptionSet.FalseOption` |
| Lookup | `LookupAttributeMetadata` | Targets (created via relationship, not directly) |
| Choice | `PicklistAttributeMetadata` | `OptionSet.Options[]` |
| Multi-Choice | `MultiSelectPicklistAttributeMetadata` | `OptionSet.Options[]` |
| File | `FileAttributeMetadata` | `MaxSizeInKB` |
| Image | `ImageAttributeMetadata` | `MaxSizeInKB`, `CanStoreFullImage` |

## Add Choice Column
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
  "SchemaName": "contoso_priority",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Priority", "LanguageCode": 1033 }] },
  "RequiredLevel": { "Value": "ApplicationRequired" },
  "OptionSet": {
    "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
    "IsGlobal": false,
    "OptionSetType": "Picklist",
    "Options": [
      { "Value": 100000000, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Low", "LanguageCode": 1033 }] } },
      { "Value": 100000001, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Medium", "LanguageCode": 1033 }] } },
      { "Value": 100000002, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "High", "LanguageCode": 1033 }] } }
    ]
  }
}
```

## Create Relationship (N:1 Lookup)
```http
POST /api/data/v9.2/RelationshipDefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
  "SchemaName": "contoso_account_project",
  "ReferencedEntity": "account",
  "ReferencedAttribute": "accountid",
  "ReferencingEntity": "contoso_project",
  "Lookup": {
    "SchemaName": "contoso_AccountId",
    "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Account", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" }
  },
  "CascadeConfiguration": {
    "Delete": "RemoveLink",
    "Assign": "NoCascade",
    "Share": "NoCascade",
    "Unshare": "NoCascade",
    "Merge": "NoCascade",
    "Reparent": "NoCascade"
  }
}
```

## Create N:N Relationship
```http
POST /api/data/v9.2/RelationshipDefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.ManyToManyRelationshipMetadata",
  "SchemaName": "contoso_contact_project",
  "Entity1LogicalName": "contact",
  "Entity2LogicalName": "contoso_project",
  "IntersectEntityName": "contoso_contact_project"
}
```

## Update Table Metadata

Entity metadata updates require specific HTTP method and headers:

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

**⚠️ CRITICAL:** Using `PATCH` without `If-Match: *` and `MSCRM.MergeLabels: true` returns HTTP 405. You MUST use `PUT` with both headers. The `MSCRM.MergeLabels: true` header prevents overwriting existing display labels with nulls.

---

## Query Table Metadata
```http
# List all custom tables
GET /api/data/v9.2/EntityDefinitions
  ?$filter=IsCustomEntity eq true
  &$select=LogicalName,DisplayName,SchemaName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute

# Get specific table with its attributes
GET /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')
  ?$expand=Attributes($select=LogicalName,DisplayName,AttributeType,RequiredLevel)
```

---

## Global Option Sets

### Create
```http
POST /api/data/v9.2/GlobalOptionSetDefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
  "Name": "contoso_projectstatus",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Project Status", "LanguageCode": 1033 }] },
  "IsGlobal": true,
  "OptionSetType": "Picklist",
  "Options": [
    { "Value": 100000000, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Not Started", "LanguageCode": 1033 }] } },
    { "Value": 100000001, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "In Progress", "LanguageCode": 1033 }] } },
    { "Value": 100000002, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Completed", "LanguageCode": 1033 }] } }
  ]
}
```
