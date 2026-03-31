# SharePoint Integration

## Overview

SharePoint is the most commonly used data source after Dataverse. It serves as document storage, list-based data, and knowledge source for Copilot Studio agents. Understanding when to use SharePoint vs Dataverse is critical for solution design.

---

## SharePoint vs Dataverse Decision

| Factor | SharePoint Lists | Dataverse |
|---|---|---|
| **Item limit** | 5,000 threshold (delegation), 30M max | Unlimited (with capacity) |
| **Relational data** | Limited (lookups between lists) | Full relational (1:N, N:N) |
| **Security model** | Item-level via SharePoint permissions | Row-level, column-level, business unit |
| **Offline** | Limited | Canvas App offline mode |
| **Search** | SharePoint search integration | Relevance search |
| **Licensing** | M365 included | Premium required |
| **ALM** | No solution packaging | Full solution lifecycle |
| **Business logic** | Limited (Power Automate rules) | Plugins, business rules, calculated fields |
| **Audit** | SharePoint audit log | Full field-level auditing |

### When to Use SharePoint

- Document management (files, folders, metadata)
- Small datasets (< 2000 items actively queried)
- M365-only licensed users (no Premium budget)
- Collaboration scenarios (co-authoring, versioning)
- Knowledge source for Copilot Studio agents

### When to Migrate to Dataverse

- More than 5,000 items (delegation limits)
- Complex relationships between entities
- Need row-level or column-level security
- Need business rules, plugins, or calculated fields
- Solution needs ALM (source control, CI/CD)
- Multiple apps sharing the same data

---

## SharePoint Connector Patterns

### List Operations in Flows

```
Trigger: When an item is created (SharePoint)
  Site: https://contoso.sharepoint.com/sites/hr
  List: Leave Requests

Actions:
  Get item: Get details of the created item
  Update item: Update status column
  Create item: Create in another list
  Delete item: Remove from list
```

### Common Flow Patterns

| Pattern | Trigger | Actions |
|---|---|---|
| **Approval on new item** | Item created | Get item → Start approval → Update status |
| **Document processing** | File created in library | Get file → AI Builder extract → Update metadata |
| **Cross-list sync** | Item modified | Get item → Create/update in target list |
| **Notification** | Item field changed | Get item → Send email/Teams message |
| **Archival** | Scheduled (monthly) | Get items (older than X) → Copy to archive list → Delete |

### Filtering and Pagination

```
Action: Get items (SharePoint)
  Filter query: Status eq 'Pending' and Department eq 'Engineering'
  Top count: 100 (max 5000)
  Order by: Created desc
```

**ODATA filter syntax for SharePoint:**
```
// Equality
Status eq 'Active'

// And/Or
Status eq 'Active' and Priority eq 'High'

// Date comparison
Created ge '2026-01-01T00:00:00Z'

// Lookup column (display value)
Department/Title eq 'Engineering'
```

---

## Document Library Operations

### Upload File from Flow

```
Action: Create file (SharePoint)
  Site: https://contoso.sharepoint.com/sites/projects
  Folder path: /Shared Documents/Reports
  File name: @{formatDateTime(utcNow(), 'yyyy-MM-dd')}_report.pdf
  File content: @{body('Generate_PDF')}
```

### Get File Content

```
Action: Get file content (SharePoint)
  Site: https://contoso.sharepoint.com/sites/projects
  File identifier: /Shared Documents/Template.docx
```

### File Metadata Operations

```
Action: Update file properties (SharePoint)
  Site: https://contoso.sharepoint.com/sites/projects
  Library: Documents
  Id: @{triggerBody()?['ID']}
  Properties:
    Status: "Reviewed"
    ReviewedBy: @{workflow()?['tags']?['creator']}
```

---

## SharePoint as Canvas App Data Source

### Connect to SharePoint List

```powerfx
// In Canvas App data sources, add SharePoint connection
// Then add the specific site and list

// Gallery showing SharePoint items
Items: Filter(
    'Leave Requests',
    Status.Value = "Pending",
    Department.Value = User().Department
)

// Submit new item
SubmitForm(SharePointForm);
// Or use Patch:
Patch(
    'Leave Requests',
    Defaults('Leave Requests'),
    {
        Title: txtTitle.Text,
        StartDate: dpStart.SelectedDate,
        EndDate: dpEnd.SelectedDate,
        Status: {Value: "Pending"}
    }
)
```

### Delegation with SharePoint

| Function | Delegable? | Notes |
|---|---|---|
| `Filter` with =, <>, <, >, <=, >= | Yes | Basic comparisons only |
| `Filter` with `StartsWith` | Yes | Text column only |
| `Filter` with `in` | Yes | Choice columns |
| `Search` | No | Not delegable — use `Filter` with `StartsWith` |
| `LookUp` | Yes | Single record retrieval |
| `Sort` | Yes | Single column only |
| `CountRows` | No | Client-side only |
| `Sum`, `Average`, `Min`, `Max` | No | Client-side only |

> **5000 item limit:** Non-delegable queries process only the first 500 (default) or 2000 (max) items. For larger lists, use delegable functions or migrate to Dataverse.

---

## Migration from SharePoint to Dataverse

### Step 1: Design Dataverse Schema

Map SharePoint columns to Dataverse columns:

| SharePoint Column Type | Dataverse Column Type |
|---|---|
| Single line of text | Text (String) |
| Multiple lines of text | Multiline text |
| Number | Whole Number or Decimal |
| Currency | Currency |
| Date and Time | Date and Time |
| Choice | Choice (Option Set) |
| Lookup | Lookup |
| Person or Group | Lookup to User table |
| Yes/No | Two Options (Boolean) |
| Hyperlink | URL |
| Managed Metadata | Choice or Lookup (depending on complexity) |

### Step 2: Migrate Data

```
Option A: Dataverse Dataflows (< 100K rows)
  Power Apps → Dataflows → New → Import from SharePoint list
  → Map columns → Schedule or run once

Option B: Power Automate (< 10K rows, with transformations)
  Get items (SharePoint, paginated) → Apply to each → Create record (Dataverse)

Option C: Custom script (> 100K rows)
  Read from SharePoint REST API → Batch write to Dataverse Web API
```

### Step 3: Update Apps and Flows

- Replace SharePoint data sources with Dataverse
- Update formulas (SharePoint `.Value` syntax → Dataverse column syntax)
- Update flows (SharePoint connector → Dataverse connector)
- Validate delegation behavior (Dataverse is more delegable)

---

## Anti-Patterns

- SharePoint lists with > 5000 items as primary Canvas App data source (delegation limits)
- Hardcoded SharePoint site URLs in flows (breaks across environments — use environment variables)
- Not using list views for filtering (query all items, filter client-side)
- Person column mapped to text in migration (lose the user relationship)
- No versioning enabled on document libraries (no audit trail)
- Complex relational data in SharePoint (use Dataverse instead)
- Attachment-heavy SharePoint lists (performance degrades)
- Not testing delegation after migration to Dataverse (formula behavior changes)
