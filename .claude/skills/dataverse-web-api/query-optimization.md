# Query Optimization & Service Protection Limits

> For error codes and basic retry, see error-handling.md.
> For batch/bulk patterns, see bulk-batch.md.

## Service Protection Limits

Dataverse enforces per-user rate limits to maintain platform health. Exceeding any limit returns `429 Too Many Requests`.

| Limit | Threshold | Window |
|---|---|---|
| Number of requests | 6,000 | 5 minutes (rolling) |
| Combined execution time | 20 minutes | 5 minutes (rolling) |
| Concurrent requests | 52 | Simultaneous |

These are per-user, per-environment. Service principal counts as one "user."

### Retry-After Behavior
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

- Always honor the `Retry-After` header value (seconds)
- Duration **increases** if the client continues to send requests aggressively
- Ramp-up strategy: start slow, let the server dictate throughput

### Monitoring Headers
| Header | Description |
|---|---|
| `x-ms-ratelimit-burst-remaining-xrm-requests` | Remaining requests in current window |
| `x-ms-ratelimit-time-remaining-xrm-requests` | Remaining execution time in current window |

---

## Entitlement Limits vs Service Protection Limits

| | Entitlement Limits | Service Protection Limits |
|---|---|---|
| **Purpose** | Licensing compliance | Platform health |
| **Enforcement** | Soft (overage warnings, then throttling) | Hard (429 errors) |
| **Window** | 24-hour rolling | 5-minute rolling |
| **Scope** | Per tenant, allocated by license | Per user, per environment |
| **Mitigation** | Purchase capacity add-ons | Optimize request patterns |

---

## Query Performance Best Practices

### Always Use $select
```http
# BAD: Returns ALL columns (50+ for most tables)
GET /api/data/v9.2/accounts

# GOOD: Returns only needed columns
GET /api/data/v9.2/accounts?$select=name,revenue,statecode
```
Performance impact: 2-5x faster for tables with many columns or large text fields.

### Always Use $filter
```http
# BAD: Returns all records, filter client-side
GET /api/data/v9.2/contacts?$select=fullname

# GOOD: Filter at the server
GET /api/data/v9.2/contacts?$select=fullname&$filter=statecode eq 0
```

### Bound Results with $top
```http
# Retrieve at most 100 records
GET /api/data/v9.2/contacts?$select=fullname&$top=100
```

### Optimize $expand
```http
# GOOD: Select specific columns in expansion
$expand=primarycontactid($select=fullname,emailaddress1)

# BAD: Expand without $select (returns all columns of related record)
$expand=primarycontactid
```

Max nested `$expand` depth: **2 levels**.
Max expansions per request: **15**.

### Use @odata.nextLink for Paging
```http
# First request
GET /api/data/v9.2/contacts?$select=fullname&$filter=statecode eq 0

# Response includes:
"@odata.nextLink": "https://org.api.crm.dynamics.com/api/data/v9.2/contacts?$select=fullname&$skiptoken=..."
```
**Never construct skip tokens manually.** Always follow the `@odata.nextLink` URL exactly as returned.

### Prefer $count=true Only When Needed
```http
# Adds overhead — only use when you need total count
GET /api/data/v9.2/contacts?$select=fullname&$count=true
```

---

## FetchXML Performance Tips

| Technique | When to Use |
|---|---|
| `no-lock="true"` | Default behavior in modern Dataverse; can include for clarity but no longer impacts performance |
| `latematerialize="true"` | Large tables with many joins — fetches IDs first, then hydrates columns |
| Paging cookies | Datasets > 5,000 rows — dramatically faster than simple page/count paging |
| `distinct="true"` | Only when needed — adds overhead |
| Explicit `<attribute>` | Always — never use `<all-attributes/>` in production |

> For complete FetchXML element reference, see fetchxml-reference.md.

---

## Batch Request Optimization

- Independent requests in `$batch` execute in **parallel** server-side
- Group related updates in **changesets** for transactional guarantees
- Max **1,000 requests** per `$batch`
- For creating/updating many records, use `CreateMultiple`/`UpdateMultiple` instead of batch (see bulk-batch.md) — 5-10x faster

---

## Anti-Patterns / Gotchas

- **Polling with tight loops** — use webhooks, change tracking, or subscription-based patterns instead
- **Retrieving all records then filtering client-side** — always push filters to the server via `$filter` or FetchXML
- **Not handling 429 responses** — unhandled 429s lead to escalating Retry-After durations
- **Using `$skip` for paging** — use `@odata.nextLink` instead; `$skip` is slow and deprecated for large datasets
- **Ignoring Retry-After value** — fixed sleep durations (e.g., `sleep 5`) waste time or resume too early
- **Sorting on non-indexed columns** — degrades performance on tables with 100K+ rows
- **Multiple sequential single-record GETs** — batch independent reads into `$batch` or use `$filter=id in (guid1, guid2, ...)`

## Official Reference

- https://learn.microsoft.com/power-apps/developer/data-platform/api-limits
- https://learn.microsoft.com/power-apps/developer/data-platform/webapi/query/optimize-performance
- https://learn.microsoft.com/power-platform/admin/api-request-limits-allocations
