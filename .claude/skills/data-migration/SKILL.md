---
name: data-migration
description: "Data migration to and within Dataverse. Use when: data migration, data import, bulk load, CSV import, legacy CRM migration, data quality, deduplication, staging tables, KingswaySoft, Azure Data Factory, dataflows, Web API bulk, entity mapping."
---

# Skill: Data Migration

## When to Use
Trigger when migrating data into Dataverse from external systems, legacy CRM (D365 on-prem), CSV/Excel files, or other databases. Also trigger for data quality processes, bulk operations, and migration rollback planning.

---

## Migration Approach Decision Table

| Volume | Complexity | Approach | Tools |
|---|---|---|---|
| < 10K rows | Simple (flat) | **Dataverse import wizard** | Built-in CSV/Excel import |
| < 100K rows | Simple to moderate | **Dataverse dataflows** | Power Query Online |
| < 100K rows | Complex (transforms) | **Power Automate** | Flow with Apply to Each |
| 100K-1M rows | Any | **Web API bulk** (CreateMultiple/UpdateMultiple) | Script (bash/PowerShell) |
| 1M-10M rows | Any | **Web API bulk** + parallel scripts | Custom script with batching |
| 10M+ rows | Any | **Azure Data Factory** + elastic tables | ADF pipelines |
| D365 on-prem → online | CRM-specific | **D365 Migration Tool** or Web API | KingswaySoft, Scribe, ADF |

---

## Approach 1: Dataverse Import Wizard (< 10K)

Built-in CSV/Excel import in the Power Apps maker portal.

```
Power Apps → Tables → [table] → Import → Import data
  → Select CSV or Excel file
  → Map columns (auto-mapping + manual correction)
  → Import
```

### Limitations

| Limitation | Impact |
|---|---|
| Max ~10,000 rows per import | Must split larger files |
| No transformation logic | Data must be clean before import |
| No lookup resolution by name | Lookup columns need GUID values or manual mapping |
| No error rollback | Failed rows are skipped, not rolled back |
| No scheduling | Manual one-time operation |

---

## Approach 2: Dataverse Dataflows (< 100K)

Power Query Online for ETL into Dataverse.

```
Power Apps → Dataflows → + New dataflow
  → Source: CSV, Excel, SQL, SharePoint, OData, etc.
  → Transform: Power Query M transformations
  → Destination: Dataverse table
  → Map columns
  → Schedule refresh (or run once)
```

### When to Use Dataflows

- Data needs transformation (rename, type conversion, filtering)
- Source is a supported Power Query connector
- Need scheduled refresh (ongoing sync)
- Volume is under ~100K rows (performance degrades above this)

---

## Approach 3: Web API Bulk Operations (100K-10M)

Use `CreateMultiple` and `UpdateMultiple` for high-throughput Dataverse writes.

### CreateMultiple

```bash
# Batch create records
TOKEN=$(az account get-access-token --resource "https://${ORG}.crm6.dynamics.com/" --query accessToken -o tsv)

curl -s -X POST "https://${ORG}.api.crm6.dynamics.com/api/data/v9.2/contacts/Microsoft.Dynamics.CRM.CreateMultiple" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "OData-Version: 4.0" \
  -d '{
    "Targets": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.contact",
        "firstname": "John",
        "lastname": "Doe",
        "emailaddress1": "john@example.com"
      },
      {
        "@odata.type": "Microsoft.Dynamics.CRM.contact",
        "firstname": "Jane",
        "lastname": "Smith",
        "emailaddress1": "jane@example.com"
      }
    ]
  }'
```

### Batch Size Recommendations

| Operation | Optimal Batch Size | Notes |
|---|---|---|
| CreateMultiple | 100-1000 records | Start with 100, increase if stable |
| UpdateMultiple | 100-1000 records | Same as create |
| UpsertMultiple | 100-500 records | Slightly slower due to existence check |

### Migration Script Pattern

```bash
#!/bin/bash
set -euo pipefail

ORG="contoso"
REGION="crm6"
TENANT_ID="..."
BATCH_SIZE=500
INPUT_FILE="contacts.json"

get_token() {
  az account get-access-token \
    --resource "https://${ORG}.${REGION}.dynamics.com/" \
    --tenant "${TENANT_ID}" \
    --query accessToken -o tsv
}

TOKEN=$(get_token)
BASE_URL="https://${ORG}.api.${REGION}.dynamics.com/api/data/v9.2"

# Read records from JSON file and batch
TOTAL=$(jq length "$INPUT_FILE")
BATCHES=$(( (TOTAL + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "Migrating $TOTAL records in $BATCHES batches of $BATCH_SIZE"

for ((i=0; i<BATCHES; i++)); do
  OFFSET=$((i * BATCH_SIZE))

  # Refresh token every 50 batches (before expiry)
  if (( i % 50 == 0 && i > 0 )); then
    TOKEN=$(get_token)
  fi

  # Extract batch
  BATCH=$(jq --argjson offset "$OFFSET" --argjson size "$BATCH_SIZE" \
    '.[$offset:$offset+$size] | map(. + {"@odata.type": "Microsoft.Dynamics.CRM.contact"})' \
    "$INPUT_FILE")

  # Send batch
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${BASE_URL}/contacts/Microsoft.Dynamics.CRM.CreateMultiple" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -H "OData-Version: 4.0" \
    -d "{\"Targets\": $BATCH}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "204" ]; then
    echo "ERROR batch $((i+1)): HTTP $HTTP_CODE"
    echo "$RESPONSE" | head -n-1 >> migration_errors.log
  else
    echo "Batch $((i+1))/$BATCHES complete ($((OFFSET + BATCH_SIZE)) / $TOTAL)"
  fi
done

echo "Migration complete. Check migration_errors.log for any failures."
```

---

## Approach 4: Azure Data Factory (10M+)

For very large migrations, ADF provides enterprise-grade ETL.

```
ADF Pipeline:
  Source: SQL Server / CSV / API
    → Data flow: Transform, cleanse, map
      → Sink: Dataverse (via Dataverse connector or Web API)
        → Elastic tables for staging (handles high write throughput)
```

### ADF + Elastic Tables Pattern

```
1. Create elastic table in Dataverse (handles high-volume writes)
2. ADF pipeline bulk-loads data into elastic table (staging)
3. Power Automate flow or plugin moves data from staging to production tables
4. Validate counts and data quality
5. Drop staging elastic table
```

---

## Data Quality

### Pre-Migration Quality Checks

| Check | How | Tool |
|---|---|---|
| **Duplicate detection** | Match on email, phone, name combinations | Power Query, SQL |
| **Required fields** | Validate all mandatory columns have values | Script/Power Query |
| **Data types** | Verify types match target schema | Script/Power Query |
| **Reference integrity** | All lookup values exist in target | Pre-load query |
| **Date formats** | Standardize to ISO 8601 | Power Query |
| **Option set values** | Map source values to Dataverse option set integers | Mapping table |
| **Character encoding** | UTF-8 throughout | File conversion |

### Deduplication Rules

```
Dataverse → Settings → Data Management → Duplicate Detection Rules

  Name: "Contact Email Duplicate"
  Base Entity: Contact
  Matching Entity: Contact
  Criteria:
    - emailaddress1 = emailaddress1 (exact match)
    - OR (firstname + lastname exact match)
  Action: Flag as potential duplicate (don't auto-merge)
```

### Staging Table Pattern

```
1. Create staging table (contoso_contactimport)
   - All columns as text (accept any input)
   - Add: import_status (choice: Pending/Processed/Failed)
   - Add: import_error (text, for error messages)
   - Add: import_batch (text, batch identifier)

2. Bulk load raw data into staging table
3. Validate each row (check data types, required fields, lookups)
4. Mark valid rows as "Ready"
5. Transform and insert valid rows into production table
6. Mark as "Processed" or "Failed" with error details
7. Review failed rows, fix, and re-process
```

---

## Common Migration Challenges

### Option Set Value Mapping

Source systems use text labels; Dataverse uses integer values.

```json
// Mapping table
{
  "sourceStatus": {
    "Active": 1,
    "Inactive": 2,
    "On Hold": 3
  }
}
```

### Lookup GUID Mapping

Source systems use names; Dataverse uses GUIDs for lookups.

```bash
# Pre-build a lookup map: account name → GUID
curl -s "${BASE_URL}/accounts?$select=accountid,name" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '[.value[] | {(.name): .accountid}] | add' > account_map.json

# During migration, resolve lookups
ACCOUNT_ID=$(jq -r ".[\"$ACCOUNT_NAME\"]" account_map.json)
```

### Auto-Number Conflicts

If migrating records with existing auto-number values:

```
Option A: Let Dataverse generate new numbers (safest)
Option B: Set auto-number seed above max migrated value
  POST /api/data/v9.2/SetAutoNumberSeed
  { "EntityName": "contact", "AttributeName": "contoso_refnumber", "Value": 100000 }
```

### Timezone Handling

```
Source data: "2026-03-23 14:30:00" (assumed local time — but which timezone?)

Rules:
  1. Always store as UTC in migration scripts
  2. Convert source timezone to UTC before writing
  3. Dataverse stores datetime in UTC, displays in user's timezone
  4. Document the source timezone assumption in migration plan
```

---

## Rollback Strategy

| Scenario | Rollback Method |
|---|---|
| Full initial load | Delete all imported records (batch delete) |
| Incremental update | Restore from pre-migration backup |
| Schema changes (new columns) | Cannot undo in managed solutions — plan carefully |
| Failed batch | Re-run failed batch with corrected data |

### Pre-Migration Backup

```
Power Platform Admin Center → Environments → [env] → Backups
  → Create backup → Label: "Pre-migration-2026-03-23"
```

### Batch Delete (Rollback)

```bash
# Delete all records with a specific import batch ID
# Use BulkDelete API or DeleteMultiple

curl -X POST "${BASE_URL}/contacts/Microsoft.Dynamics.CRM.DeleteMultiple" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Targets": [
      {"@odata.type": "Microsoft.Dynamics.CRM.contact", "contactid": "guid1"},
      {"@odata.type": "Microsoft.Dynamics.CRM.contact", "contactid": "guid2"}
    ]
  }'
```

---

## Migration Checklist

```markdown
## Data Migration Checklist

### Planning
- [ ] Source and target schema documented
- [ ] Column mapping complete (including option sets, lookups)
- [ ] Volume estimated per table
- [ ] Migration approach selected (wizard/dataflow/API/ADF)
- [ ] Rollback strategy documented
- [ ] Environment backup taken

### Data Quality
- [ ] Duplicate detection rules configured
- [ ] Required fields validated in source
- [ ] Option set values mapped
- [ ] Lookup references resolved (GUIDs mapped)
- [ ] Date/timezone handling documented
- [ ] Character encoding verified (UTF-8)

### Execution
- [ ] Staging table created (if using staging pattern)
- [ ] Test migration on dev environment with sample data
- [ ] Full migration on test environment
- [ ] Data validation (row counts, spot checks, aggregates)
- [ ] Performance acceptable (rows/second meets timeline)

### Post-Migration
- [ ] Row counts match source
- [ ] Spot check 5% of records for accuracy
- [ ] Lookup references verified (no orphaned records)
- [ ] Auto-number sequences set correctly
- [ ] Duplicate detection run on production data
- [ ] Audit logging enabled for migrated tables
- [ ] Migration logs archived
```

---

## Cutover Rehearsal Checklist

Rehearse the full migration at least twice before production cutover. Each rehearsal validates timing, scripts, and rollback.

```markdown
### Rehearsal Plan

| # | Activity | Owner | Target Duration | Actual (R1) | Actual (R2) |
|---|---|---|---|---|---|
| 1 | Take environment backup | Parvez | 15 min | | |
| 2 | Disable affected flows and plugins | Scott | 10 min | | |
| 3 | Run pre-migration validation queries | Scott | 20 min | | |
| 4 | Execute migration scripts (all phases) | Scott | [estimate] | | |
| 5 | Run post-migration validation queries | Scott | 30 min | | |
| 6 | Re-enable flows and plugins | Scott | 10 min | | |
| 7 | Smoke test key scenarios | Ava | 30 min | | |
| 8 | Stakeholder sign-off | Laura | 15 min | | |
| **Total** | | | [estimate] | | |

### Rehearsal Exit Criteria
- [ ] All scripts complete without error
- [ ] Post-migration validation queries pass (zero orphaned records, zero duplicates)
- [ ] Actual duration within 120% of target
- [ ] Rollback tested successfully (restore from backup, verify data integrity)
- [ ] Sign-off from data owner and product owner
```

---

## Rollback Procedure Template

Every migration must have a documented rollback plan before execution begins.

```markdown
### Rollback Procedure: [Migration Name]

**Pre-migration snapshot:**
- Environment backup taken at: [timestamp]
- Backup location: [admin center / Azure storage]
- Backup retention: [X days]
- Restore estimated time: [X minutes]

**Rollback triggers (any of these = rollback):**
- [ ] Migration script fails on a critical phase (lookup resolution, primary data load)
- [ ] Post-migration validation shows >1% data quality failures
- [ ] Key business process broken in smoke test
- [ ] Migration exceeds 150% of rehearsed duration (risk of extended downtime)

**Rollback steps:**
1. Stop all running migration scripts immediately
2. Disable any flows or plugins that were re-enabled
3. Initiate environment restore from pre-migration backup
4. Verify restore completed (check record counts, spot-check key records)
5. Re-enable flows and plugins to pre-migration state
6. Notify stakeholders of rollback and root cause
7. Schedule post-mortem to identify fix before next attempt

**Post-rollback validation:**
- [ ] Record counts match pre-migration baseline
- [ ] Key business processes functional (create, update, search)
- [ ] No orphaned records from partial migration
- [ ] Audit log shows restore event
```

---

## Data Quality Validation Queries

Run these queries before and after migration to catch data quality issues.

### Duplicate Detection (FetchXML)

Match on name + email to find potential duplicates:

```xml
<fetch aggregate="true">
  <entity name="contact">
    <attribute name="fullname" alias="name" groupby="true" />
    <attribute name="emailaddress1" alias="email" groupby="true" />
    <attribute name="contactid" alias="count" aggregate="count" />
    <filter>
      <condition attribute="statecode" operator="eq" value="0" />
    </filter>
    <having>
      <condition attribute="count" operator="gt" value="1" />
    </having>
  </entity>
</fetch>
```

### Referential Integrity Check (Orphaned Lookups)

Find records with lookup values that point to non-existent parent records:

```http
# Find cases where the customer lookup points to a deleted contact
GET /api/data/v9.2/contoso_cases
  ?$select=contoso_name,_contoso_customerid_value
  &$filter=_contoso_customerid_value ne null
  &$expand=contoso_CustomerID($select=contactid)
```

Records where the expand returns null but the lookup value is not null indicate orphaned lookups.

### Option Set Value Validation

Verify all migrated option set values are valid:

```http
# Get valid option set values for a column
GET /api/data/v9.2/EntityDefinitions(LogicalName='contoso_case')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata
  ?$filter=LogicalName eq 'contoso_priority'
  &$select=LogicalName
  &$expand=OptionSet($select=Options)

# Then query for records with invalid values
GET /api/data/v9.2/contoso_cases
  ?$select=contoso_name,contoso_priority
  &$filter=contoso_priority ne 100 and contoso_priority ne 200 and contoso_priority ne 300
```

### Date Range Validation

Check for dates outside expected ranges (common issue with timezone or format conversion errors):

```http
# Find records with dates before the business started or in the far future
GET /api/data/v9.2/contoso_cases
  ?$select=contoso_name,createdon,contoso_duedate
  &$filter=createdon lt 2015-01-01T00:00:00Z or contoso_duedate gt 2030-12-31T23:59:59Z
  &$top=50
```

---

## Anti-Patterns

- Importing directly to production without staging (no validation, no rollback)
- No rollback plan (backup not taken before migration)
- Ignoring data quality (garbage in, garbage out)
- Not testing with production-volume data (script works with 100 rows, fails at 1M)
- Option set mapping by label instead of value (labels change, values don't)
- Lookup resolution during migration (slow -- pre-build lookup maps)
- No duplicate detection before import (creates duplicate records)
- Timezone assumption not documented (data silently shifted by hours)
- Auto-number conflicts not handled (collisions between migrated and new records)
- Migration without monitoring (no progress tracking, can't estimate completion)

---

## Related Skills

- `dataverse-web-api` — CreateMultiple, batch operations, upsert patterns
- `dataverse` — Table design, relationships, column types
- `alm` — Solution deployment that includes schema changes
- `perf-optimise` — Optimizing bulk operations
