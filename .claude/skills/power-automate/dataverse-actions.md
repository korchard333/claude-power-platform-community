# Power Automate — Dataverse Actions & Performance

## Dataverse Actions

```
PREFER native Dataverse connector over HTTP:
  "Add a new row"         → Creates record
  "Update a row"          → Updates specific columns only
  "List rows"             → Filter with OData query
  "Perform a bound action" → Calls custom Dataverse actions

AVOID "Send an HTTP request to Dataverse" unless no native action exists

OData Filter Examples:
  statecode eq 0                                           # Active records
  _ownerid_value eq 'GUID'                                 # By owner
  createdon ge 2024-01-01T00:00:00Z                        # Date filter
  statecode eq 0 and contoso_priority eq 2                 # Combined
  contains(contoso_name, 'test')                           # Text search
```

---

## Apply to Each — Performance

```
Default concurrency: 1 (sequential)
Enable concurrency in settings: up to 100 parallel (defaults to 25)

WARNING: Once concurrency control is turned on, it CANNOT be turned off —
you must delete and re-add the trigger to revert to sequential processing.

SAFE for parallel: Independent operations (send email, update unrelated records)
UNSAFE for parallel: Dataverse writes to related records (race conditions)

Waiting runs when concurrency is on: 10 + degree of parallelism

Throttling mitigation:
  - Add Retry Policy on Dataverse actions (exponential, 4 retries)
  - Use batch operations where possible
  - Consider child flows for complex per-item logic
```

---

## Child Flows

```
Parent Flow → Orchestrates, triggers
  └── Child Flow: "Process Single Order"
        Input:  OrderId (string), Action (string)
        Output: Success (boolean), Message (string)

Rules:
  - Child flows must be in the same solution
  - Use "Run a Child Flow" action (not HTTP)
  - Child flows run synchronously — respect 120-second timeout
  - Child flows inherit the parent's connection context
```

---

## Pagination Pattern (Large Datasets)

The "List rows" Dataverse action returns max 5,000 records per page. For larger datasets:

```
Initialize variable: varAllRecords (Array, [])
Initialize variable: varSkipToken (String, "")
Initialize variable: varHasMore (Boolean, true)

Do Until: varHasMore is equal to false
  │
  ├── List rows (Dataverse)
  │     Table: contoso_order
  │     Row count: 5000
  │     Skip token: @{variables('varSkipToken')}
  │     Filter: statecode eq 0
  │
  ├── Append to array: varAllRecords = union(variables('varAllRecords'), outputs('List_rows')?['body/value'])
  │
  └── Condition: @{outputs('List_rows')?['body/@odata.nextLink']} is not null
        Yes: Set varSkipToken = @{last(split(outputs('List_rows')?['body/@odata.nextLink'], '$skiptoken='))}
        No:  Set varHasMore = false
```

**Warning:** Processing 100K+ records in a single flow run will hit action limits and timeout. For very large datasets, use batch processing with child flows or Power Automate Desktop.

---

## Performance Profiles & Runtime Limits

Flow limits depend on the **Performance Profile** assigned to the flow (based on license):

| Limit | Low | Medium | High | Unlimited Extended |
|---|---|---|---|---|
| **Power Platform requests / 24h** | 10,000 | 200,000 | 500,000 | 10,000,000 |
| **Concurrent outbound calls** | 500 | 2,500 | 2,500 | 2,500 |
| **Apply to Each max items** | 5,000 | 100,000 | 100,000 | 100,000 |
| **Concurrency (Apply to Each)** | 1–100 (default 25) | 1–100 (default 25) | 1–100 (default 25) | 1–100 (default 25) |
| **Min recurrence interval** | 60 seconds | 60 seconds | 60 seconds | 60 seconds |

**Flow run duration limit**: 30 days maximum.

**Custom connector limits**: 50 per user, 500 requests/minute per connection.

**Flow suspension**: Flows may be suspended for reasons such as `AllActionsFailingDetected`, `ApiCallOverageDetected`, or quota violations. Monitor via Power Platform Admin Center.
