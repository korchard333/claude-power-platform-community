# Dataverse — Table Design

## Table Design Principles

1. **One table per business entity** — don't combine unrelated data
2. **Prefix all custom tables**: `contoso_order`, `contoso_lineitem`
3. **Logical names are permanent** — choose carefully (cannot rename after creation)
4. **Always enable change tracking** on transactional tables
5. **Always define a meaningful primary name column** (not just "Name")
6. **Use Status Reason** (statecode/statuscode) for lifecycle states — don't create separate "Status" columns

---

## Column Type Guide

| Scenario | Column Type | Notes |
|---|---|---|
| Short text (<100 chars) | Single Line Text | Set max length appropriately |
| Long descriptions | Multiline Text | Avoid for codes/IDs |
| Status/Category | Choice (local) or Global Option Set | Never free text for controlled vocabulary |
| Yes/No | Two Options (boolean) | |
| Currency | Currency | Respects org currency settings |
| Numeric identifier | Whole Number or Auto Number | Not text (see Auto Number config below) |
| Calculated value | Calculated Column | For simple same-table logic |
| Aggregation | Rollup Column | Nightly recalculation — avoid on high-volume tables |
| Foreign key | Lookup | Creates N:1 relationship |
| File attachment | File or Image Column | Up to 128 MB per file |
| Date only (no time) | Date Only | Avoid DateTime if time is irrelevant |

### ⚠️ Option Set (Choice) Value Prefix

When creating choice columns, option values use the publisher's **Option Value Prefix** as the literal start of the value. The prefix is a 5-digit integer (range 10000–99999).

```
Publisher Option Value Prefix: 88000

Resulting option values: 88000, 88001, 88002, ...
NOT: 88000000, 88000001, 88000002
```

The system auto-assigns option values starting from the prefix when you create options via the maker portal. When creating via Web API, you can specify values explicitly — use the prefix range to stay consistent:

```json
"Options": [
    {"Value": 88000, "Label": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{"Label": "Active", "LanguageCode": 1033}]}},
    {"Value": 88001, "Label": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{"Label": "Inactive", "LanguageCode": 1033}]}}
]
```

> **Note:** If you let the system assign values (pass `null`), it will use the solution publisher's prefix automatically. This is the recommended approach per MS Learn.

---

## Auto-Number Columns

Auto-number columns generate sequential, unique values automatically on record creation. Use instead of plugin-based auto-numbering whenever possible.

### Configuration
```
Column type: Autonumber
Format string: {SEQNUM:5}         → 00001, 00002, 00003
Format string: ORD-{SEQNUM:6}    → ORD-000001, ORD-000002
Format string: {RANDSTRING:6}    → A3B7X2 (random, not sequential)
Format string: CS-{DATETIMEUTC:yyyyMMdd}-{SEQNUM:4}  → CS-20260322-0001

Seed value: Starting number (default 1000)
```

### Placeholders
| Placeholder | Description | Example |
|---|---|---|
| `{SEQNUM:n}` | Sequential number, n digits | `{SEQNUM:5}` → 00001 |
| `{RANDSTRING:n}` | Random alphanumeric, n chars | `{RANDSTRING:6}` → A3B7X2 |
| `{DATETIMEUTC:format}` | UTC date/time | `{DATETIMEUTC:yyyy}` → 2026 |

### Via Web API
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_order')/Attributes
Content-Type: application/json

{
  "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
  "SchemaName": "contoso_OrderNumber",
  "AutoNumberFormat": "ORD-{SEQNUM:6}",
  "MaxLength": 20,
  "RequiredLevel": { "Value": "None" },
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Order Number", "LanguageCode": 1033 }] }
}
```

### Key Facts
- Thread-safe: no race conditions (unlike plugin-based auto-numbering)
- Cannot be reset or reseeded after creation (by design — prevents duplicates)
- Sequence is global across all environments (not environment-specific)
- Works on both standard and custom tables

---

## Alternate Keys (Critical for ALM & Upsert)

**Every table used for data import/sync MUST have an alternate key.**

```
Table: contoso_order
Alternate Key: contoso_ordernumber (single column)
Use: PATCH /api/data/v9.2/contoso_orders(contoso_ordernumber='ORD-001')

Table: contoso_orderline
Alternate Key: contoso_ordernumber + contoso_linenumber (composite)
Use: PATCH /api/data/v9.2/contoso_orderlines(contoso_ordernumber='ORD-001',contoso_linenumber=1)
```

---

## Business Rules

### ⚠️ Business Rules Cannot Perform Arithmetic

Business rules can: set field values (to constants or other fields), show/hide fields, lock/unlock fields, validate (show error messages), and set required level.

Business rules CANNOT: multiply, divide, add, subtract, or perform any arithmetic operation.

**For calculations, use:**
- **Power Automate flow** — triggered on record create/update, calculates and updates the result field (recommended for most scenarios)
- **Plugin (C#)** — synchronous, fires in the database transaction (for complex multi-table calculations)
- **Formula column** — Power Fx expression, evaluated by the platform (for simple single-row calculations, no relationships)

**Common mistake:** Designing a business rule to calculate `Quantity × Unit Rate`. This will fail. Use a flow instead.

---

## Security Model Design

### Security Role Matrix Template
| Role | Table | Create | Read | Write | Delete | Access Level |
|---|---|---|---|---|---|---|
| App User | contoso_order | Yes | Own | Own | No | User |
| App Manager | contoso_order | Yes | BU | BU | Own | Business Unit |
| App Admin | contoso_order | Yes | Org | Org | Org | Organization |

### Column-Level Security
Use for: salary, SSN, sensitive PII, internal notes
```
1. Enable column security on the column definition
2. Create Column Security Profile
3. Add fields to profile with Read/Update permissions
4. Assign profile to security team or user
```

### Row-Level Security
- **Owner teams**: record ownership determines access
- **Access teams**: share individual records on-demand
- **Azure AD group teams**: sync security from Entra ID groups
