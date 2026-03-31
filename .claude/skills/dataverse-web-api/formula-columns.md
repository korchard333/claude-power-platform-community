# Formula Columns via Web API

> **AI Accuracy Note:** Formula column definitions use Power Fx syntax. LLMs are less trained on Power Fx than SQL or JavaScript. Verify formula column expressions manually or test via the maker portal before relying on AI-generated formulas. Common mistakes: incorrect DateDiff syntax, missing ThisRecord prefix, wrong type coercion.

## Overview

Formula columns use Power Fx expressions evaluated server-side on read. They replace legacy calculated columns and are always current — no async recalculation delay. Create them via Web API by setting `FormulaDefinition` and `SourceType: 3` on the appropriate attribute metadata type.

## Creating Formula Columns

### String Formula Column

```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
  "SchemaName": "contoso_ProjectLabel",
  "DisplayName": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [{ "Label": "Project Label", "LanguageCode": 1033 }]
  },
  "FormulaDefinition": "contoso_name & \" - \" & Text(contoso_priority)",
  "SourceType": 3,
  "MaxLength": 4000,
  "RequiredLevel": { "Value": "None" }
}
```

### Whole Number Formula Column

```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
  "SchemaName": "contoso_DaysRemaining",
  "DisplayName": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [{ "Label": "Days Remaining", "LanguageCode": 1033 }]
  },
  "FormulaDefinition": "DateDiff(UTCNow(), contoso_duedate, TimeUnit.Days)",
  "SourceType": 3,
  "MinValue": -2147483648,
  "MaxValue": 2147483647,
  "RequiredLevel": { "Value": "None" }
}
```

### Decimal Formula Column

```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_orderline')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
  "SchemaName": "contoso_LineTotal",
  "DisplayName": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [{ "Label": "Line Total", "LanguageCode": 1033 }]
  },
  "FormulaDefinition": "contoso_quantity * contoso_unitprice",
  "SourceType": 3,
  "Precision": 2,
  "MinValue": -100000000000,
  "MaxValue": 100000000000,
  "RequiredLevel": { "Value": "None" }
}
```

### DateTime Formula Column

```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
  "SchemaName": "contoso_ReviewDate",
  "DisplayName": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [{ "Label": "Review Date", "LanguageCode": 1033 }]
  },
  "FormulaDefinition": "DateAdd(contoso_startdate, 30, TimeUnit.Days)",
  "SourceType": 3,
  "Format": "DateOnly",
  "RequiredLevel": { "Value": "None" }
}
```

### Boolean Formula Column

```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
  "SchemaName": "contoso_IsOverdue",
  "DisplayName": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [{ "Label": "Is Overdue", "LanguageCode": 1033 }]
  },
  "FormulaDefinition": "contoso_duedate < UTCNow() && contoso_statuscode <> 100000002",
  "SourceType": 3,
  "RequiredLevel": { "Value": "None" },
  "OptionSet": {
    "@odata.type": "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata",
    "TrueOption": { "Value": 1, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Yes", "LanguageCode": 1033 }] } },
    "FalseOption": { "Value": 0, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "No", "LanguageCode": 1033 }] } }
  }
}
```

## Return Type to Metadata Type Mapping

| Formula Returns | @odata.type | Key Properties |
|---|---|---|
| String | `StringAttributeMetadata` | `MaxLength` (up to 4000) |
| Whole Number | `IntegerAttributeMetadata` | `MinValue`, `MaxValue` |
| Decimal | `DecimalAttributeMetadata` | `Precision` (0-10) |
| Float | `FloatAttributeMetadata` | `Precision` (0-5) |
| Date/Time | `DateTimeAttributeMetadata` | `Format` (DateOnly/DateAndTime) |
| Yes/No | `BooleanAttributeMetadata` | `OptionSet` with True/False labels |

**All formula columns require:** `"SourceType": 3` and `"FormulaDefinition": "<Power Fx expression>"`

## Supported Power Fx Functions

Formula columns support a subset of Power Fx. Key categories:

| Category | Functions |
|---|---|
| Math | `Abs`, `Round`, `RoundDown`, `RoundUp`, `Trunc`, `Sqrt`, `Power`, `Exp`, `Ln`, `Sum`, `Average` |
| Text | `Concatenate`, `Left`, `Right`, `Mid`, `Len`, `Lower`, `Upper`, `Proper`, `Trim`, `Substitute`, `Replace`, `StartsWith`, `EndsWith`, `Text` |
| Date | `DateAdd`, `DateDiff`, `Day`, `Month`, `Year`, `Hour`, `Minute`, `Second`, `UTCNow`, `UTCToday`, `Weekday`, `WeekNum` |
| Logic | `If`, `Switch`, `And`, `Or`, `Not`, `IsBlank`, `Blank`, `Error`, `IfError` |
| Type conversion | `Value`, `Text`, `Decimal`, `Float` |

**Not supported in formula columns:**
- `Now()` has user-local behavior; use `UTCNow()` for time-zone-independent behavior
- `Collect`, `Patch`, `Remove` and other data modification functions
- `LookUp`, `Filter` and other table-scope functions (single-table scope only)

## Common Formula Patterns

### Concatenated display label
```
contoso_firstname & " " & contoso_lastname
```

### Conditional status text
```
If(contoso_duedate < UTCNow(), "Overdue", If(contoso_duedate < DateAdd(UTCNow(), 7, TimeUnit.Days), "Due Soon", "On Track"))
```

### Age calculation
```
DateDiff(contoso_birthdate, UTCToday(), TimeUnit.Years)
```

### Percentage calculation
```
If(contoso_target = 0, 0, Round(contoso_actual / contoso_target * 100, 1))
```

### Business day indicator
```
Weekday(UTCToday()) >= 2 && Weekday(UTCToday()) <= 6
```

## Querying Formula Column Values

Formula columns are read via standard GET requests — the server evaluates the formula at read time:

```http
GET /api/data/v9.2/contoso_projects?$select=contoso_name,contoso_ProjectLabel,contoso_IsOverdue,contoso_DaysRemaining
```

The response returns computed values inline with other columns. No special handling needed.

## Updating a Formula Definition

To change the formula after creation:

```http
PUT /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes(LogicalName='contoso_projectlabel')
Content-Type: application/json

{
  "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
  "FormulaDefinition": "contoso_name & \" [\" & Text(contoso_status) & \"]\"",
  "SourceType": 3
}
```

**Note:** You can update the formula expression but you CANNOT change the return type (e.g., string to integer). The return type is a permanent decision.

## Limitations and Constraints

| Constraint | Detail |
|---|---|
| Max formula length | 1,000 characters |
| Max depth (formula referencing formula) | 10 levels |
| Cross-table references | Not supported — single-table scope only |
| Lookup output type | Not supported as formula return |
| Rollup reference | Cannot reference rollup columns in formulas |
| Currency output | Not supported as formula return type |
| FetchXML filter/sort | Formula columns cannot be used in FetchXML `filter` or `order` clauses |
| Offline mode | Values not displayed in mobile offline |
| Triggers | Cannot trigger workflows or plugins on formula column changes |
| Duplicate detection | Not triggered on formula columns |
| Null handling | Null numeric values treated as 0 (differs from calculated columns where null propagates) |
| Searchable | Configurable — formula columns can be searchable |

## Formula Columns vs Calculated Columns vs Rollup Columns

| Feature | Formula | Calculated (Legacy) | Rollup |
|---|---|---|---|
| Language | Power Fx | Workflow expressions | Aggregate functions |
| Evaluation | Real-time on read | Real-time on read | Async (every 12h or manual) |
| Cross-table | No | Yes (via related) | Yes (1:N aggregation) |
| Filterable | No | Yes | Yes |
| Sortable | Limited | Yes | Yes |
| Null handling | Null = 0 | Null propagates | Depends on aggregate |
| Recommendation | **Use for new development** | Legacy — migrate to formula | Use when aggregation needed |

## Anti-Patterns

- **Using flows to compute values into placeholder columns** — formula columns evaluate server-side and are always current. No flow maintenance needed.
- **Exceeding 1,000 char formula limit** — break complex logic into multiple formula columns that reference each other (max 10 depth).
- **Assuming formula columns work in FetchXML filters** — they don't. If you need to filter by a computed value, use a calculated column or plugin-maintained column instead.
- **Mixing `Now()` and `UTCNow()`** — formula columns evaluate without locale context. Always use `UTCNow()` or `UTCToday()`.
- **Creating formula columns that reference calculated columns** — this is not recommended and can cause unexpected behavior. Use formula columns throughout.
- **Changing return type after creation** — the attribute metadata type is permanent. Plan the return type before creating.
