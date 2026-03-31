---
name: perf-optimise
description: "Power Platform performance optimization. Use when: performance, slow, optimization, delegation, caching, indexing, query performance, API limits, throttling, virtual scrolling, lazy loading, concurrent, batch operations, form load."
---

# Skill: Performance Optimization

## When to Use
Trigger when diagnosing or optimizing performance for Canvas Apps, Model-Driven Apps, Code Apps, Power Automate flows, Dataverse queries, or plugins. Also trigger when addressing API throttling (429 errors) or capacity limits.

---

## Canvas App Performance

### Delegation

Delegation pushes query logic to the data source. Non-delegable operations process only the first 500-2000 records locally.

| Delegable to Dataverse | NOT Delegable |
|---|---|
| Filter with =, <>, <, >, <=, >= | Distinct |
| Filter with `in` (choice columns) | CountRows (use CountIf for delegable) |
| Sort (single column) | GroupBy |
| Search (Dataverse only) | AddColumns in a Filter |
| StartsWith | Nested Filter |
| LookUp | First applied to non-delegable |

### Key Canvas Optimizations

```powerfx
// BAD: Non-delegable — loads all records, filters locally
Filter(Contacts, Text(Phone, "[$-en-US]#") = "555-0100")

// GOOD: Delegable — server-side filter
Filter(Contacts, Phone = "555-0100")

// BAD: Loading all records then counting
CountRows(Filter(LargeTable, Status = "Active"))

// GOOD: CountIf is delegable to Dataverse
CountIf(LargeTable, Status = "Active")
```

### Concurrent() for Parallel Data Loading

```powerfx
// BAD: Sequential loading
ClearCollect(colAccounts, Accounts);
ClearCollect(colContacts, Contacts);
ClearCollect(colOrders, Orders);
// Total time = T1 + T2 + T3

// GOOD: Parallel loading
Concurrent(
    ClearCollect(colAccounts, Accounts),
    ClearCollect(colContacts, Contacts),
    ClearCollect(colOrders, Orders)
);
// Total time = max(T1, T2, T3)
```

### Named Formulas (Pre-Computation)

```powerfx
// App.Formulas — computed once, cached
ActiveAccounts = Filter(Accounts, statuscode = 1);
UserDepartment = Office365Users.MyProfile().Department;
TodayDate = Today();

// These are evaluated once and cached — no re-computation on screen navigation
```

### Collection Pre-Loading

```powerfx
// App.OnStart — load reference data once
Concurrent(
    ClearCollect(colStatusOptions, Choices('Accounts'.Status)),
    ClearCollect(colCategoryOptions, Choices('Accounts'.Category)),
    ClearCollect(colCountries, Filter(Countries, IsActive = true))
);

// Galleries and dropdowns use local collections (fast) instead of Dataverse calls
```

---

## Dataverse Query Performance

### $select — Only Request Needed Columns

```bash
# BAD: Returns ALL columns (slow, wastes bandwidth)
GET /api/data/v9.2/contacts

# GOOD: Only requested columns returned
GET /api/data/v9.2/contacts?$select=firstname,lastname,emailaddress1
```

### $filter — Server-Side Filtering

```bash
# BAD: Get all, filter client-side
GET /api/data/v9.2/contacts  # Then filter in JS

# GOOD: Server-side filter
GET /api/data/v9.2/contacts?$filter=statecode eq 0 and contains(lastname,'Smith')&$top=50
```

### $top — Limit Result Set

```bash
# Always use $top for paged results
GET /api/data/v9.2/contacts?$top=50&$select=fullname,emailaddress1

# For next page, use @odata.nextLink from response
```

### Indexing

Dataverse automatically indexes primary key and common columns. For custom columns used in filters:

```
Power Platform Admin Center → Environments → [env] → Settings
  → Administration → System Settings → Administration tab
  → Performance: Entity-specific index recommendations

Or request custom indexes via support for high-volume tables
```

### FetchXML Aggregate vs OData

For aggregations, FetchXML is significantly faster than OData:

```xml
<!-- FetchXML aggregate — processed server-side -->
<fetch aggregate="true">
  <entity name="contact">
    <attribute name="contactid" alias="count" aggregate="count" />
    <attribute name="annual_revenue" alias="total_revenue" aggregate="sum" />
    <filter>
      <condition attribute="statecode" operator="eq" value="0" />
    </filter>
  </entity>
</fetch>
```

```bash
# Equivalent OData (less efficient for aggregation)
GET /api/data/v9.2/contacts?$apply=filter(statecode eq 0)/aggregate(contactid with countdistinct as count, annual_revenue with sum as total_revenue)
```

### Alternate Keys for Upsert

```bash
# Instead of: GET to check existence, then POST or PATCH
# Use: PATCH with alternate key (single call, upsert)
PATCH /api/data/v9.2/contacts(emailaddress1='john@contoso.com')
  -H "If-Match: *"
  -d '{"firstname": "John", "lastname": "Doe"}'
```

---

## Plugin Performance

### Sandbox Constraints

| Constraint | Limit |
|---|---|
| Execution timeout | 2 minutes |
| Memory | 256 MB |
| CPU | Shared (no guarantee) |
| External HTTP calls | Allowed in async, risky in sync |

### Optimization Patterns

```csharp
// BAD: Query inside a loop
foreach (var contactId in contactIds)
{
    var contact = service.Retrieve("contact", contactId, new ColumnSet("fullname"));
    // N+1 query problem
}

// GOOD: Single query with IN filter
var query = new QueryExpression("contact")
{
    ColumnSet = new ColumnSet("fullname"),
    Criteria = new FilterExpression
    {
        Conditions = {
            new ConditionExpression("contactid", ConditionOperator.In, contactIds.ToArray())
        }
    }
};
var results = service.RetrieveMultiple(query);
```

```csharp
// BAD: Synchronous HTTP call in sync plugin (blocks user, risks timeout)
var client = new HttpClient();
var response = await client.GetAsync("https://external-api.com/validate");

// GOOD: Use Service Bus or async plugin for external calls
// Or use pre-validated data from Dataverse
```

```csharp
// BAD: Processing all records in bulk operation trigger
// Plugin fires once per record in a CreateMultiple — 1000 records = 1000 plugin executions

// GOOD: Batch-aware plugin using IPluginExecutionContext4
var context4 = (IPluginExecutionContext4)context;
// Check if running in bulk context and optimize accordingly
```

---

## Code App Performance

### Tree-Shaking and Bundle Size

```typescript
// BAD: Import entire library
import _ from "lodash";

// GOOD: Import only what you need
import debounce from "lodash/debounce";
```

### Lazy Routes (Code Splitting)

```typescript
// React Router with lazy loading
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### TanStack Query (Stale/Cache)

```typescript
import { useQuery } from "@tanstack/react-query";

function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    staleTime: 5 * 60 * 1000,     // 5 min — don't refetch if fresh
    gcTime: 30 * 60 * 1000,        // 30 min — keep in cache
    refetchOnWindowFocus: false,    // Don't refetch on tab switch
  });
}
```

### Virtual Scrolling for Large Lists

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
  });

  return (
    <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtual) => (
          <div key={virtual.key} style={{ transform: `translateY(${virtual.start}px)` }}>
            {items[virtual.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Power Automate Performance

### Apply to Each Concurrency

```
Apply to each → Settings → Concurrency Control
  → Turn on: Yes
  → Degree of parallelism: 50 (maximum)
```

| Setting | Behavior |
|---|---|
| Off (default) | Sequential — 1 at a time |
| On, parallelism = 20 | 20 concurrent iterations |
| On, parallelism = 50 | Maximum concurrency |

> **Warning:** High concurrency can cause API throttling (429). Monitor and adjust.

### Pagination

```
Action: List rows (Dataverse)
  → Settings → Pagination → On
  → Threshold: 100,000 (max records to retrieve)

Default without pagination: 5,000 rows max
```

### Child Flows

Break large flows into child flows for:
- Reusability across multiple parent flows
- Cleaner flow design
- Independent error handling
- Parallel execution of independent branches

### Avoid Deep Nesting

```
BAD: Apply to each → Condition → Apply to each → Condition → Apply to each
  (> 8 levels of nesting = flow failure)

GOOD: Use child flows, Select/Filter expressions, or batch operations
```

---

## Model-Driven App Performance

### Form Load Optimization

| Optimization | Impact |
|---|---|
| Fewer tabs and sections | Less HTML to render |
| Lazy subgrids | Load on tab expand, not on form load |
| Fewer columns on form | Less data fetched |
| Minimize OnLoad JavaScript | Defer non-critical logic |
| Quick View forms instead of subgrids | Lighter weight for related data |

### JavaScript Best Practices

```javascript
// BAD: Heavy processing in OnLoad
function onLoad() {
    // Fetches data, updates 20 fields, calls external API
    var result = Xrm.WebApi.retrieveMultipleRecords("contact", "?$top=1000");
    // ...
}

// GOOD: Minimal OnLoad, defer heavy work
function onLoad(context) {
    // Only essential logic
    setFieldVisibility(context);

    // Defer non-critical work
    setTimeout(function() {
        loadSecondaryData(context);
    }, 100);
}
```

---

## API Request Limits

### Protection Limits (Hard Throttle)

| Limit | Value | Scope |
|---|---|---|
| Per user | 6,000 requests / 5-minute window | Per user |
| Per web server | 60,000 / 5 min | Per web server (shared) |
| Concurrent requests | 52 per user | Simultaneous connections |

### When Throttled (HTTP 429)

```bash
# Response includes Retry-After header
HTTP/1.1 429 Too Many Requests
Retry-After: 30

# Always honor Retry-After
sleep $(curl -sI ... | grep Retry-After | awk '{print $2}')
```

### Strategies to Avoid Throttling

| Strategy | Implementation |
|---|---|
| **Batch operations** | Use CreateMultiple/UpdateMultiple instead of individual calls |
| **$select** | Reduce payload size, faster responses |
| **Exponential backoff** | On 429, wait 1s → 2s → 4s → 8s |
| **Connection pooling** | Reuse HTTP connections |
| **Off-peak scheduling** | Run bulk operations during low-usage hours |
| **Service protection limit monitoring** | Track via Admin Center analytics |

---

## Performance Checklist

```markdown
## Performance Review Checklist

### Canvas App
- [ ] All gallery queries are delegable
- [ ] Using Concurrent() for parallel data loading
- [ ] Named Formulas for pre-computation
- [ ] Collections for reference data (not repeated server calls)
- [ ] No non-delegable functions on tables > 500 rows

### Dataverse Queries
- [ ] $select on every query (no select-all)
- [ ] $filter for server-side filtering
- [ ] $top for pagination
- [ ] FetchXML for aggregations
- [ ] Alternate keys for upsert operations

### Code App
- [ ] Tree-shaking (no unused library imports)
- [ ] Lazy routes for code splitting
- [ ] TanStack Query with staleTime configured
- [ ] Virtual scrolling for lists > 100 items
- [ ] Dynamic imports for heavy components

### Power Automate
- [ ] Apply to Each concurrency enabled (where safe)
- [ ] Pagination enabled for large queries
- [ ] Child flows for reusable/nested logic
- [ ] No nesting deeper than 4-5 levels
- [ ] Batch operations instead of loop + individual API calls

### Plugins
- [ ] No N+1 query patterns
- [ ] No sync HTTP calls in sync plugins
- [ ] Using early-bound types (faster than late-bound)
- [ ] ColumnSet specified (never ColumnSet(true))

### API Limits
- [ ] Retry-After handling for 429 responses
- [ ] Batch operations for bulk processing
- [ ] Off-peak scheduling for heavy operations
- [ ] Monitoring API usage in Admin Center
```

---

## Anti-Patterns

- **Querying all columns** (`$select` omitted) — wastes bandwidth, slower response
- **Non-delegable functions on large datasets** — silent data truncation
- **Synchronous HTTP calls in sync plugins** — blocks user, risks timeout
- **Apply to Each without concurrency** — sequential processing of 1000 items
- **No caching in Code Apps** — refetching data on every render
- **Full page loads instead of virtual scrolling** — DOM bloat, slow rendering
- **Plugin executing inside loops** — N+1 query pattern
- **Ignoring 429 errors** — retrying immediately without backoff makes it worse
- **Loading all reference data on app start** — slow startup, use lazy loading
- **No $top on OData queries** — potentially returning millions of rows

---

## Related Skills

- `dataverse-web-api` — Query optimization, batch operations
- `canvas-apps` — Delegation patterns, performance techniques
- `code-apps` — React performance, bundling
- `plugins` — Sandbox constraints, execution optimization
- `power-automate` — Flow concurrency, pagination
- `observability` — Performance monitoring and alerting
