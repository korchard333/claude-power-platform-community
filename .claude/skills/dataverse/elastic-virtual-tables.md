# Dataverse — Elastic Tables, Virtual Tables & Search

## Elastic Tables

Elastic tables are powered by Azure Cosmos DB and scale automatically for high-throughput, high-volume workloads.

### When to Use Elastic Tables
- High write throughput: tens of millions of rows per hour
- Massive data volume: 100M+ records
- IoT telemetry, event logs, audit trails, real-time data ingestion
- Schema changes frequently or data is semi-structured (flexible JSON columns)
- Time-to-live (TTL) auto-expiry needed

### Key Differences from Standard Tables
| Feature | Standard Table | Elastic Table |
|---|---|---|
| Backend | SQL Server | Azure Cosmos DB |
| Scale | Vertical (finite) | Horizontal (automatic) |
| Transactions | Full multi-record | Per-record only (no cross-record transactions) |
| Calculated/rollup columns | ✓ | ✗ |
| Business rules | ✓ | ✗ |
| Business Process Flows | ✓ | ✗ |
| Charts/dashboards | ✓ | ✗ |
| N:N to standard tables | ✓ | ✗ |
| TTL / auto-expiry | ✗ | ✓ |
| Default page size | 5,000 | 500 |

### Elastic Table Patterns
```
Partition key: Use contoso_partitionid to distribute data evenly
  e.g., sensor data → partitionid = deviceId
        log data   → partitionid = tenantId

Bulk operations: Use CreateMultiple, UpdateMultiple, DeleteMultiple APIs
  (much more efficient than individual Create/Update/Delete for elastic tables)

TTL expiry:
  Set TTLInSeconds on individual records or at table level
  Records auto-deleted after the TTL expires
```

---

## Virtual Tables

Virtual tables expose external data (SQL Server, SharePoint, Salesforce, Fabric) inside Dataverse without copying the data. Data is fetched on-demand at runtime.

### When to Use Virtual Tables
- Need read access to external data in Dataverse apps without ETL
- Data already in SQL Server, SharePoint, or Azure Cosmos DB
- Avoid synchronization complexity and data duplication

### Supported Providers (GA)
- SQL Server, PostgreSQL, SharePoint, Azure Cosmos DB

### In Preview
- Microsoft Fabric, Salesforce, Oracle, Snowflake

### Key Limitations
- Organization-owned only (no user-owned records — no row-level security)
- No auditing, search, charts, dashboards, queues, offline caching
- No business process flows or calculated/rollup columns
- All columns always returned (no `$select` pushdown)
- Cannot filter or sort by virtual table lookup columns
- Once created, cannot convert to/from standard table

---

## Dataverse Search (Relevance Search)

Full-text cross-table search with relevance ranking. On by default in new production environments.

### Key Capabilities
- Search across unlimited tables simultaneously (vs Quick Find: max 10 tables)
- Relevance ranking (most relevant first)
- Fuzzy search (up to 2 character misspellings)
- Trailing wildcard: `con*` matches "contoso", "contact"
- Lucene query syntax: proximity, boosting, regex
- Integrated with Copilot experiences

### Configuration
```
Power Platform Admin Center → Environment → Settings → Search → Dataverse Search
Configure per-table: which columns are indexed via Quick Find view columns
```

### Searchable Column Types
- Text, Lookup display names, Option Set labels
- NOT searchable: numeric, date, file, image columns

### Querying Retained (Archived) Data
```xml
<!-- FetchXML: query long-term retained records -->
<fetch datasource="retained">
  <entity name="contoso_order">
    <attribute name="contoso_name"/>
    <attribute name="createdon"/>
    <filter>
      <condition attribute="statecode" operator="eq" value="0"/>
    </filter>
  </entity>
</fetch>
```

---

## Long-Term Retention (Archival)

Automatically transfers old records from the transactional database to a managed data lake (read-only, compressed storage).

### Storage Savings
- Archived data: ~50% less capacity than live data
- History tables (no indexes): ~30% less than live tables

### Key Facts
- Retained data is **read-only** — cannot restore to live tables
- Query retained data via FetchXML with `datasource="retained"` attribute
- Archival jobs run at low priority — can take 7–14 days for large volumes
- Secured via Dataverse security (Entra ID-backed)
- Suitable for compliance scenarios where data must be kept but rarely accessed
