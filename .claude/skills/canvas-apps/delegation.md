# Canvas Apps — Delegation

## What is Delegation?
Delegation pushes query processing to the data source. Non-delegable operations load ALL records locally (max 500 or 2000) then filter — causing data loss on large tables.

## Delegation Limits
| Data Source | Default Limit | Max Configurable |
|---|---|---|
| Dataverse | 500 | 2,000 (via Settings → General → Data row limit) |
| SharePoint | 500 | 2,000 |
| SQL Server | 500 | 2,000 |

**Important:** The 2,000 limit applies only when a query **cannot be delegated** (i.e., Power Apps pulls records locally then filters). Fully delegable queries (e.g., `Filter` with a delegable predicate) process at the data source with no app-side record cap. Set the limit to 1 during development to surface delegation issues early.

## Delegable Functions (Dataverse)
| Delegable | Not Delegable |
|---|---|
| `Filter` (with delegable predicates) | `Search` |
| `Sort`, `SortByColumns` | `First`, `FirstN` (on unfiltered tables) |
| `LookUp` | `Last`, `LastN` |
| `=`, `<>`, `<`, `>`, `<=`, `>=` | `GroupBy`, `Ungroup` |
| `And`, `Or`, `Not` | `Len`, `Mid`, `Left`, `Right` |
| `StartsWith` | `IsBlank` (in some contexts) |
| `In` (column in table) | `Concat`, `Concatenate` in filters |
| `IsBlank` (simple column check) | `Round`, `Abs`, `Sqrt` in filters |
| | `Choices` |
| | `Collect` (as a data source query) |

## Delegation Limits
```
Maximum lookup levels in a delegated query: 2
Maximum entity joins in a delegated query: 20
These limits apply when using relationships in Filter/LookUp across tables.
```

## Delegation Warning Patterns
```powerfx
// BAD: Non-delegable — loads max 500/2000 records, then filters locally
Filter(Contacts, Len('Last Name') > 5)           // Len() is never delegable
Filter(Contacts, 'Last Name' in colLocalNames)   // 'in' against local collection is not delegable

// GOOD: Delegable to Dataverse — filters at server, no record cap
Filter(Contacts, 'Last Name' = TextInput1.Text)  // Equality IS delegable to Dataverse
Filter(Contacts, StartsWith('Last Name', "Sm"))   // StartsWith IS delegable to Dataverse
Filter(Contacts, 'Status (Status)' = 'Status (Contacts)'.Active)

// NOTE: Delegation depends on the DATA SOURCE. Check the blue underline warnings
// in Power Apps Studio — a dotted blue underline means "non-delegable".

// WORKAROUND for non-delegable: Use a view or collection
// Create a Dataverse view that pre-filters, then bind to that view
// Or: ClearCollect to local collection, then filter locally (if dataset is small)
```

---

## Dataverse Delegation Matrix by Data Type

Delegability of operators varies by column data type:

| Operator | Number | Text | Choice | DateTime | GUID | Lookup |
|---|---|---|---|---|---|---|
| `=` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<>` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<`, `>`, `<=`, `>=` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `StartsWith` | — | ✅ | — | — | — | — |
| `EndsWith` | — | ❌ | — | — | — | — |
| `Contains` | — | ❌ | — | — | — | — |
| `IsBlank` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `In` (column in data source) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |

Notes:
- `CountRows` on Dataverse returns an **approximate count** (periodically calculated, not real-time)
- `Search` function is **never delegable** to Dataverse — use `StartsWith` or Dataverse views instead
- Polymorphic lookups (Customer, Regarding) have limited delegation support

---

## SharePoint Delegation Matrix

| Function | Delegable |
|---|---|
| `Filter` | ✅ (with delegable predicates) |
| `LookUp` | ✅ |
| `Sort` / `SortByColumns` | ✅ |
| `Search` | ✅ (searches all text columns) |
| `First` | ✅ |
| `RemoveIf` / `UpdateIf` | ❌ (simulates — loads 500/2000 locally) |

| Predicate | Text | Number | Date | Choice | Yes/No | Person/Lookup |
|---|---|---|---|---|---|---|
| `=`, `<>` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `<`, `>`, `<=`, `>=` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `StartsWith` | ✅ | — | — | ❌ | — | ❌ |
| `IsBlank` | ❌* | ✅ | ✅ | ✅ | ✅ | ❌ |

*SharePoint quirk: `IsBlank()` is not delegable for text columns. Use `= Blank()` instead — that IS delegable.

---

## SQL Server Delegation Matrix

| Function | Delegable |
|---|---|
| `Filter` | ✅ (with delegable predicates) |
| `LookUp` | ✅ |
| `Sort` / `SortByColumns` | ✅ |
| `Search` | ✅ |
| `In` | ✅ |
| `First` | ✅ |

| Predicate | nvarchar | int/decimal | datetime | bit | uniqueidentifier |
|---|---|---|---|---|---|
| `=`, `<>` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<`, `>`, `<=`, `>=` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `StartsWith` | ✅ | — | — | — | — |
| `EndsWith` | ✅ | — | — | — | — |
| `Len` | ✅ | — | — | — | — |
| `IsBlank` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `Trim` | ✅ | — | — | — | — |

Notes:
- **Stored procedures** are never delegable — results always limited to 500/2000
- **SQL Views** delegate like tables — use views for complex server-side filtering
- **Joins** across tables are not directly delegable — use SQL views for multi-table queries

---

## Aggregate Function Delegation

| Function | Dataverse | SharePoint | SQL Server |
|---|---|---|---|
| `Sum` | ❌ | ❌ | ❌ |
| `Average` | ❌ | ❌ | ❌ |
| `Min` / `Max` | ❌ | ❌ | ❌ |
| `CountRows` | ✅ (approximate) | ❌ | ❌ |
| `CountIf` | ❌ | ❌ | ❌ |

**No aggregate functions delegate** (except Dataverse `CountRows` which returns an approximate). For accurate aggregates on large datasets, use Power Automate flows or Dataverse calculated/rollup columns.

---

## Delegation Workaround Patterns

### 1. Dataverse Views as Pre-Filtered Source
```powerfx
// Instead of non-delegable Filter, create a Dataverse view "Active High-Priority Projects"
// Then bind gallery directly to the view — all filtering happens server-side
Filter(
    'Active High-Priority Projects',  // This IS the pre-filtered view
    StartsWith(Name, txtSearch.Text)   // Additional delegable filter on top
)
```

### 2. Power Automate for Server-Side Processing
```powerfx
// Call a flow that runs FetchXML or complex logic server-side
Set(gblResults,
    FlowName.Run(
        {searchTerm: txtSearch.Text, minRevenue: sldRevenue.Value}
    ).results
)
```

### 3. SQL Stored Procedures via Flow
For complex SQL queries that can't delegate, wrap the stored procedure in a Power Automate flow and call it from the app.

### 4. StartsWith + Index Pattern for Text Search
```powerfx
// Instead of Contains (not delegable to Dataverse):
// BAD: Filter(Contacts, "smith" in 'Last Name')
// GOOD: Filter(Contacts, StartsWith('Last Name', txtSearch.Text))
// For full-text search, use Dataverse Search API via Power Automate
```

### 5. Pre-Load Small Reference Tables
```powerfx
// On App.OnStart or screen OnVisible — load small lookup tables entirely
ClearCollect(colCountries, Countries);  // OK if < 2000 records
// Then filter locally with full function support
Filter(colCountries, Len(Name) > 5)  // Len() works fine on local collections
```

## Official Reference

- https://learn.microsoft.com/power-apps/maker/canvas-apps/delegation-overview
- https://learn.microsoft.com/power-apps/maker/canvas-apps/delegation-list
- https://learn.microsoft.com/power-apps/maker/canvas-apps/connections/connection-common-data-service
- https://learn.microsoft.com/power-apps/maker/canvas-apps/connections/connection-sharepoint-online
- https://learn.microsoft.com/power-apps/maker/canvas-apps/connections/sql-connection-overview
