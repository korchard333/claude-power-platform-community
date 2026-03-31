---
name: power-bi
description: "Power BI Development. Use when: building reports, TMDL semantic models, DAX patterns, PBIR report definitions, Fabric REST API, Direct Lake, incremental refresh, Dataverse as data source, Power BI Embedded in Code Apps, CI/CD for Power BI."
---

# Skill: Power BI Development

## When to Use
Trigger when building Power BI semantic models, reports, DAX measures, or managing Power BI via Fabric REST APIs. Covers TMDL/model.bim semantic model definitions, PBIR report definitions, DAX patterns, and deployment automation.

---

## Architecture Overview

### Power BI Project Structure (PBIP Format)
```
MyReport.pbip                    # Project file
├── MyReport.SemanticModel/
│   ├── definition/
│   │   ├── model.tmdl           # TMDL format (modern, human-readable)
│   │   ├── tables/
│   │   │   ├── Sales.tmdl       # Table definitions with columns, measures
│   │   │   ├── Date.tmdl
│   │   │   └── Product.tmdl
│   │   ├── relationships.tmdl   # All relationships
│   │   ├── expressions.tmdl     # M/Power Query expressions
│   │   ├── cultures/
│   │   │   └── en-US.tmdl       # Translations
│   │   └── roles/
│   │       └── RegionRLS.tmdl   # Row-level security
│   ├── definition.pbism         # Semantic model metadata
│   └── .platform
│
├── MyReport.Report/
│   ├── definition/
│   │   ├── report.json          # Report definition
│   │   ├── pages/
│   │   │   ├── page1/
│   │   │   │   ├── page.json    # Page config
│   │   │   │   └── visuals/
│   │   │   │       ├── visual1.json
│   │   │   │       └── visual2.json
│   │   ├── bookmarks/           # Report bookmarks
│   │   └── theme.json           # Report theme
│   ├── definition.pbir          # Report metadata
│   └── .platform
```

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- [TMDL](tmdl.md) — table definitions, columns, measures, partitions, Date table pattern, relationships, row-level security
- [DAX Patterns](dax.md) — time intelligence, ranking, KPIs, field parameters, CALCULATE context patterns
- [PBIR Report Definition](pbir.md) — page.json, visual.json, theme definition
- [Fabric REST API](fabric-api.md) — authentication, workspace management, dataset operations, report operations, deployment pipeline
- [Direct Lake & Incremental Refresh](direct-lake.md) — Direct Lake mode, storage mode selection, incremental refresh setup
- [Dataverse as Data Source](dataverse-source.md) — Power Query M connection, TDS endpoint SQL access
- [Power BI Embedded](embedded.md) — embed token generation, React integration for Code Apps
- [CI/CD](cicd.md) — GitHub Actions pipeline for automated deployment

---

## Best Practices

### Semantic Model
- Always create a dedicated Date table (don't rely on auto date/time)
- Use star schema: fact tables at center, dimension tables around
- Hide foreign key columns from report view
- Set `summarizeBy: none` on non-additive columns (IDs, codes)
- Use folders to organize measures by business domain
- Format strings on all measures (currency, %, number)

### DAX
- Use variables (`VAR ... RETURN`) for readability and performance
- Use `DIVIDE()` instead of `/` (handles division by zero)
- Use `BLANK()` not `0` for missing values
- Avoid `FILTER(table, ...)` when column filter works — use `KEEPFILTERS` or `VALUES`
- Never use `CALCULATE` with row context unless you understand context transition

### Reports
- Maximum 8-10 visuals per page
- Use bookmarks for showing/hiding visual states instead of multiple pages
- Apply consistent theme across all reports
- Use drill-through for detail pages, not separate reports
- Test with Row-Level Security using "View As" in Power BI Service

---

## Anti-Patterns

- Auto date/time enabled (creates hidden tables, bloats model)
- Bidirectional cross-filtering (causes ambiguity, performance issues)
- Too many measures without folders (unnavigable model)
- `CALCULATE(COUNTROWS(...))` when `COUNTROWS` alone works
- Import mode on large Dataverse tables without incremental refresh
- Publishing .pbix files directly instead of using deployment pipelines
- Hardcoding server/database names instead of using parameters
- Missing RLS when multiple business units access the same report
- Calculated columns for values that should be measures
- Not testing refresh after deployment (connection strings, credentials)

> **Note:** Power BI Dashboards and Datasets are **NOT supported** in Power Platform Pipelines. Use Power BI's own deployment pipelines (Fabric REST API) for Power BI content promotion.

---

## Related Skills

- `dataverse` — Dataverse as a Power BI data source
- `code-apps` — Embedding Power BI in Code Apps
