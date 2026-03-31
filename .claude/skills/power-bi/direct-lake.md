# Power BI — Direct Lake & Incremental Refresh

## Direct Lake Mode (Microsoft Fabric)

Direct Lake is the default storage mode for new semantic models created on Fabric lakehouses or warehouses. It combines the performance of Import mode with the freshness of DirectQuery.

### How It Works
- Reads delta tables directly from OneLake (no data copy into the semantic model)
- Metadata-only refresh ("framing") — takes seconds, not hours
- VertiPaq engine processes data in-memory for fast queries
- Falls back to DirectQuery automatically if limits are exceeded

### When to Use
| Mode | When to Use |
|---|---|
| **Direct Lake** | Large Fabric lakehouse/warehouse, need near real-time, no data duplication |
| **Import** | Non-Fabric sources, small/medium datasets, maximum query performance |
| **DirectQuery** | Real-time requirements, data too large to import, non-Fabric |
| **Composite** | Mix: some tables Import, some DirectQuery |

### TMDL for Direct Lake
```tmdl
table Sales
    partition Sales = entity
        mode: directLake
        source =
            entityName: Sales
            schemaName: dbo
            expressionSource: DatabaseQuery
```

### Key Advantages over Import
- Zero data duplication — single copy in OneLake
- Near real-time (refresh frequency limited only by lakehouse update speed)
- No 5-hour XMLA endpoint refresh timeout issue
- Live editing in Power BI Desktop applies changes directly to remote model

---

## Incremental Refresh

Configure incremental refresh to only process new/changed data partitions, dramatically reducing refresh time for large tables.

### Setup in TMDL
```tmdl
table Sales
    // Step 1: Define partition with RangeStart/RangeEnd parameters
    partition Sales = m
        mode: import
        source =
            let
                Source = Sql.Database("server.database.windows.net", "SalesDB"),
                dbo_Sales = Source{[Schema="dbo",Item="Sales"]}[Data],
                // CRITICAL: Filter must reference RangeStart and RangeEnd exactly
                FilteredRows = Table.SelectRows(dbo_Sales, each
                    [OrderDate] >= #datetime(Date.Year(RangeStart), Date.Month(RangeStart), Date.Day(RangeStart), 0, 0, 0) and
                    [OrderDate] < #datetime(Date.Year(RangeEnd), Date.Month(RangeEnd), Date.Day(RangeEnd), 0, 0, 0))
            in
                FilteredRows

    // Step 2: Define refresh policy
    refreshPolicy
        rollingWindowGranularity: month
        rollingWindowPeriods: 36         // Keep 36 months of data
        incrementalGranularity: day
        incrementalPeriods: 10           // Refresh last 10 days on each refresh
        pollingExpression: = DateTime.LocalNow()  // Detect new data
```

### Power Query Parameters (Required — must be exact names)
```
RangeStart: DateTime type, default value: e.g., 1/1/2020
RangeEnd:   DateTime type, default value: e.g., 1/1/2030
```

### Best Practices
- Use Import mode with incremental refresh for large historical tables (not DirectQuery)
- Bootstrap initial full load for very large models (billions of rows): use Tabular Editor or SSMS to set individual partition dates
- After publishing to Power BI Service, you cannot download the .pbix back — use PBIP format
- Test the `pollingExpression` — if it never detects new data, incremental refresh won't run
- Use the `Real-time data` (hybrid) option to add a DirectQuery partition for rows after last refresh
