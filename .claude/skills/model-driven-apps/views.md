# Model-Driven Apps — Views

## View Types

| Type | Who Creates It | Scope |
|---|---|---|
| System View | Solution/Admin | All users (public) |
| Personal View | Individual user | Owner only |
| Quick Find View | System | Defines search columns for the entity |
| Lookup View | System | Shown when users search in a lookup field |
| Associated View | System | Records on a subgrid of a related form |
| Advanced Find | User | Ad-hoc, not saved as system view |

## ⚠️ System-Generated Views Must Be Updated

When a custom table is created, Dataverse auto-generates these views with **only Name + Created On** columns:

| Auto-Generated View | QueryType | Powers |
|---|---|---|
| Active [Plural Name] | 0 | Default entity grid, main navigation |
| Inactive [Plural Name] | 0 | Inactive records filter |
| Quick Find Active [Plural Name] | 8192 | Global search, lookup search bar |
| [Plural Name] Lookup View | 64 | Lookup field dropdowns |
| [Plural Name] Associated View | 16384 | Subgrid displays on related forms |

**These views are what users actually see by default.** Leaving them bare is the #1 UX complaint. After creating custom tables, you MUST update all system-generated views with the full column set relevant to each view type. See `dataverse-web-api/build-recipe.md` for the update pattern.

---

## View Design Best Practices

```
- 5-7 columns max (readable without horizontal scroll)
- Always include: Primary Name, Status, Owner, Modified On
- Sort by a meaningful default (e.g., Modified On descending)
- Dedicated views per use case (e.g., "My Active Projects", "Overdue Tasks")
- Filter to active records by default (statecode eq 0)
- Name views: [Audience] - [Scope] - [Entity] (e.g., "My - Active - Projects")
```

## Quick Find View Configuration

```
The Quick Find View defines:
  - Find Columns: which columns are searched (text columns only)
  - View Columns: which columns display in search results

Best practice:
  - Keep Find Columns ≤ 5 (performance impact)
  - Include the primary name column
  - Avoid wide-text columns in Find Columns
```

## Subgrids & Related Records

### Subgrid Configuration
```
Form → Insert → Subgrid

Settings:
  - Records: "Only Related Records" (common) or "All Record Types"
  - Entity: the related table (e.g., contoso_task)
  - Default View: which view to show
  - Related Table Relationship: which N:1 relationship

Limits:
  - Subgrids load 5 records by default (configurable up to 250)
  - Each subgrid makes a separate API call → use sparingly on busy forms
  - Prefer "Associated View" for simple relationships
```

### Editable Grid (DEPRECATED — Effective March 2026)
```
⚠️ DEPRECATED: Editable Grid control deprecation is now effective (March 2026).
Use the Power Apps grid control instead for all new and existing development.

Legacy configuration (for existing apps only):
Enable inline editing directly in the grid (no separate form required):
  Form/View → Grid → Enable Editable Grid control

Limitation: Not all column types are editable inline (lookups, composite fields)
```

### Power Apps Grid Control (Replacement)
```
The Power Apps grid control is the unified replacement for both Editable Grid
and Read-Only Grid. It supports:
  - Inline editing (replaces Editable Grid)
  - Nested grids
  - Grouping
  - Column filtering
  - Cell-level navigation and editing
  - Better performance on large datasets

Enable via: Form/View → Grid → Select "Power Apps grid control"
This is the recommended grid for all new Model-Driven App development.
```

## View Performance

```
- Index frequently-filtered columns in Dataverse (lookup columns, status, dates)
- Avoid views with complex FetchXML joins on large tables
- Use saved views instead of Advanced Find for repeated queries
- Personal views cannot be managed/published via ALM — encourage system views
```
