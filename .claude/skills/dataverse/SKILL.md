---
name: dataverse
description: "Dataverse Schema and Data Modeling. Use when: designing tables, columns, relationships, alternate keys, security roles, cascade behaviors, elastic tables, virtual tables, Dataverse search, query patterns (OData/FetchXML), naming conventions."
---

# Skill: Dataverse Schema & Data Modeling

## When to Use
Trigger when designing tables, columns, relationships, security roles, views, or querying Dataverse via OData/FetchXML.

---

## Table Type Selection

| Factor | Standard Table | Elastic Table | Virtual Table |
|---|---|---|---|
| Data volume | < 10M rows | 10M+ rows, high write throughput | External data (no copy) |
| Transactions | Full ACID (multi-record) | Per-record only | None |
| Security | Full row/column | Organization-owned only | Organization-owned only |
| BPF support | Yes | No | No |
| Charts/dashboards | Yes | No | No |
| Calculated/rollup | Yes | No | No |
| TTL auto-expiry | No | Yes | N/A |
| Offline support | Yes | No | No |
| Best for | Business data, CRUD apps | IoT, logs, telemetry, high-volume ingestion | Read-only external data (SQL, SharePoint, Fabric) |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Table Design](table-design.md)** — Table design principles, column type guide, auto-number columns, alternate keys
- **[Relationships](relationships.md)** — N:1, 1:N, N:N, manual intersect tables, cascade behaviors
- **[Query Patterns](query-patterns.md)** — OData queries, FetchXML, lookup handling in Code Apps, schema discovery via metadata API
- **[Naming Conventions](naming-conventions.md)** — Publisher prefix, table/column/relationship naming standards
- **[Elastic & Virtual Tables](elastic-virtual-tables.md)** — Elastic tables (Cosmos DB), virtual tables, Dataverse search, long-term retention

---

## Anti-Patterns

- Text columns used as primary identifiers without alternate keys
- Cascade delete without documenting intended behavior
- Org-owned tables where row-level security is needed
- Rollup columns on tables with millions of rows
- Storing JSON blobs in text columns to avoid proper schema
- Duplicate choice definitions across tables (use global option sets)
- N:N relationship used when the intersect needs attributes
- Missing indexes on frequently-filtered lookup columns
- Over-permissive security roles ("just give them System Admin")

---

## Related Skills

- `dataverse-web-api` — CRUD operations and metadata management via API
- `security` — Security roles, column security, row-level access
- `plugins` — Server-side logic operating on Dataverse schema
- `code-apps` — Client-side Dataverse queries from React
- `model-driven-apps` — Forms and views built on Dataverse tables
