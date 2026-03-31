# Advanced Column Types

## Rich Text Column
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
  "SchemaName": "contoso_richDescription",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Rich Description", "LanguageCode": 1033 }] },
  "MaxLength": 1048576,
  "Format": "RichText",
  "RequiredLevel": { "Value": "None" }
}
```
**Notes:** Rich text uses `MemoAttributeMetadata` with `Format: "RichText"`. MaxLength can go up to 1,048,576 characters. The control stores HTML content.

## Auto-Number Column
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
  "SchemaName": "contoso_projectNumber",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Project Number", "LanguageCode": 1033 }] },
  "MaxLength": 100,
  "AutoNumberFormat": "PRJ-{SEQNUM:5}-{RANDSTRING:4}",
  "RequiredLevel": { "Value": "None" }
}
```

**Format tokens:**
| Token | Description | Example |
|---|---|---|
| `{SEQNUM:n}` | Sequential number, n digits, zero-padded | `{SEQNUM:5}` → `00042` |
| `{RANDSTRING:n}` | Random alphanumeric string, n characters | `{RANDSTRING:4}` → `A3X9` |
| `{DATETIMEUTC:format}` | UTC datetime | `{DATETIMEUTC:yyyyMMdd}` → `20260323` |

**Common patterns:**
- `PRJ-{SEQNUM:5}` → `PRJ-00001`, `PRJ-00002`
- `TASK-{DATETIMEUTC:yyyyMMdd}-{SEQNUM:4}` → `TASK-20260323-0001`
- `{SEQNUM:6}` → `000001` (simple sequential)

**Important:** Auto-number sequences are per-environment and cannot be reset easily. Test with disposable records in dev.

## Multi-Select Choice Column
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.MultiSelectPicklistAttributeMetadata",
  "SchemaName": "contoso_tags",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Tags", "LanguageCode": 1033 }] },
  "RequiredLevel": { "Value": "None" },
  "OptionSet": {
    "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
    "IsGlobal": false,
    "OptionSetType": "Picklist",
    "Options": [
      { "Value": 100000000, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Urgent", "LanguageCode": 1033 }] } },
      { "Value": 100000001, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Strategic", "LanguageCode": 1033 }] } },
      { "Value": 100000002, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Compliance", "LanguageCode": 1033 }] } }
    ]
  }
}
```

**Querying multi-select:**
```http
# Records where tags contain "Urgent" (100000000)
GET /api/data/v9.2/contoso_projects?$filter=Microsoft.Dynamics.CRM.ContainValues(PropertyName='contoso_tags',PropertyValues=['100000000'])

# Setting values (comma-separated string)
PATCH /api/data/v9.2/contoso_projects(guid)
{ "contoso_tags": "100000000,100000001" }
```

## Formula Column
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
  "SchemaName": "contoso_projectLabel",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Project Label", "LanguageCode": 1033 }] },
  "FormulaDefinition": "contoso_name & \" - \" & Text(contoso_priority)",
  "MaxLength": 4000,
  "SourceType": 3,
  "RequiredLevel": { "Value": "None" }
}
```

**Supported formula return types:**
- String (`StringAttributeMetadata`, `SourceType: 3`)
- Whole Number (`IntegerAttributeMetadata`, `SourceType: 3`)
- Decimal (`DecimalAttributeMetadata`, `SourceType: 3`)
- Date/Time (`DateTimeAttributeMetadata`, `SourceType: 3`)
- Yes/No (`BooleanAttributeMetadata`, `SourceType: 3`)

**Key facts:**
- Formula columns use Power Fx syntax
- Evaluated server-side on read (always current, no async recalculation)
- Cannot be used in FetchXML filters or sorts (computed at read time)
- Cannot reference columns from related tables (single-table scope only)
- Replace legacy calculated columns for new development

## Rollup Columns

> ⚠️ **Rollup columns cannot be created via the Web API.** `SourceType: 2` (rollup) is not supported through metadata endpoints — the rollup workflow definition cannot be POSTed via API.

### Creation Options
- **Maker portal** — Solution → Table → Columns → New → Rollup (UI only)
- **Solution import** — Include pre-built rollup columns in a managed/unmanaged solution

### Reading and Recalculating Existing Rollups
```http
# Trigger recalculation of a rollup column on a specific record
POST /api/data/v9.2/CalculateRollupField(Target=@target,FieldName=@field)
?@target={'@odata.id':'contoso_proposals(guid)'}
&@field='contoso_totalvalue'
```

### When to Use Rollup vs Flow
| Scenario | Use |
|---|---|
| Large datasets, read-heavy, OK with 12h delay | **Rollup** (portal-created) |
| Real-time updates, small-medium datasets | **Power Automate flow** |
| Calculated on parent from child records | **Rollup** (sum/count/min/max) |

> Rollup columns recalculate every 12 hours by default (or on-demand via the API above). For real-time summaries, a Power Automate flow triggered on child record create/update/delete is more responsive.

## Currency Column
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
  "SchemaName": "contoso_budget",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Budget", "LanguageCode": 1033 }] },
  "MinValue": 0,
  "MaxValue": 1000000000,
  "Precision": 2,
  "PrecisionSource": 2,
  "RequiredLevel": { "Value": "None" }
}
```

**PrecisionSource values:**
| Value | Meaning |
|---|---|
| 0 | Use `Precision` property value |
| 1 | Use organization pricing decimal precision |
| 2 | Use currency precision |

**Auto-generated companions:** When you create a Money column, Dataverse automatically creates:
- `contoso_budget_base` — value in base (organization) currency
- `transactioncurrencyid` lookup (on the table, if not already present)

## Customer Column (Polymorphic Lookup)
```http
POST /api/data/v9.2/RelationshipDefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
  "SchemaName": "contoso_customer_project_account",
  "ReferencedEntity": "account",
  "ReferencedAttribute": "accountid",
  "ReferencingEntity": "contoso_project",
  "Lookup": {
    "SchemaName": "contoso_CustomerId",
    "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Customer", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "AttributeType": "Customer"
  },
  "CascadeConfiguration": {
    "Delete": "RemoveLink", "Assign": "NoCascade", "Share": "NoCascade",
    "Unshare": "NoCascade", "Merge": "NoCascade", "Reparent": "NoCascade"
  }
}
```

**Note:** Customer columns are polymorphic lookups that can reference either `account` or `contact`. Creating a Customer column actually creates TWO relationships (one to account, one to contact) behind a single lookup control.

**Creating a custom polymorphic lookup is NOT supported** — only the built-in Customer and Regarding types are polymorphic. For custom scenarios, create separate lookup columns (one per target table).

## File Column
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.FileAttributeMetadata",
  "SchemaName": "contoso_attachment",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Attachment", "LanguageCode": 1033 }] },
  "MaxSizeInKB": 131072,
  "RequiredLevel": { "Value": "None" }
}
```

**Upload file to column:**
```http
PATCH /api/data/v9.2/contoso_projects(guid)/contoso_attachment
Content-Type: application/octet-stream
x-ms-file-name: "project-plan.pdf"

<binary file content>
```

**Download file from column:**
```http
GET /api/data/v9.2/contoso_projects(guid)/contoso_attachment/$value
```

## Image Column
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.ImageAttributeMetadata",
  "SchemaName": "contoso_logo",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Logo", "LanguageCode": 1033 }] },
  "MaxSizeInKB": 10240,
  "CanStoreFullImage": true,
  "IsPrimaryImage": false,
  "RequiredLevel": { "Value": "None" }
}
```

**Notes:**
- `IsPrimaryImage: true` — displayed as the record avatar/icon in views and forms
- `CanStoreFullImage: true` — stores full-size image (otherwise only 144x144 thumbnail)
- Upload/download works the same as file columns

## Column Type Quick Reference

| Use Case | @odata.type | Key Properties |
|---|---|---|
| Short text (single line) | `StringAttributeMetadata` | `MaxLength`, `FormatName` (Text/Email/Url/Phone) |
| Long text (multi-line) | `MemoAttributeMetadata` | `MaxLength`, `Format` (Text/RichText) |
| Whole number | `IntegerAttributeMetadata` | `MinValue`, `MaxValue`, `Format` |
| Decimal number | `DecimalAttributeMetadata` | `MinValue`, `MaxValue`, `Precision` |
| Currency | `MoneyAttributeMetadata` | `MinValue`, `MaxValue`, `Precision`, `PrecisionSource` |
| Date/time | `DateTimeAttributeMetadata` | `Format` (DateOnly/DateAndTime) |
| Yes/no | `BooleanAttributeMetadata` | `OptionSet.TrueOption`, `OptionSet.FalseOption` |
| Single choice | `PicklistAttributeMetadata` | `OptionSet.Options[]` |
| Multi choice | `MultiSelectPicklistAttributeMetadata` | `OptionSet.Options[]` |
| Lookup | Created via `RelationshipDefinitions` | `LookupAttributeMetadata` auto-created |
| File | `FileAttributeMetadata` | `MaxSizeInKB` |
| Image | `ImageAttributeMetadata` | `MaxSizeInKB`, `CanStoreFullImage` |
| Auto-number | `StringAttributeMetadata` | `AutoNumberFormat` |
| Formula | Varies by return type | `FormulaDefinition`, `SourceType: 3` |
