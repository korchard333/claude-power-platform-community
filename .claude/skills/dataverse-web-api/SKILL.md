---
name: dataverse-web-api
description: "Dataverse Web API reference. Use when: CRUD operations, OData queries, FetchXML, bulk operations, batch requests, metadata operations, Custom APIs, file/image columns, change tracking, solution management via API, schema creation, programmatic builds."
---

# Skill: Dataverse Web API

## When to Use
Trigger when performing CRUD operations, managing metadata (tables, columns, relationships, views, forms), creating Custom APIs, managing solutions, or any direct HTTP interaction with the Dataverse Web API (OData v4.0).

---

## CRITICAL RULES

### 1. Always Use MSCRM.SolutionUniqueName Header
Every component-creating request MUST include:
```http
MSCRM.SolutionUniqueName: YourSolutionName
```
**WHY:** Omitting this header dumps components into the Default Solution — an ALM anti-pattern
that makes the component nearly impossible to manage via solution transport. This is the single
most common mistake when building via Web API.

### 2. @odata.type Is Required on All Column/Attribute Creation
Every column creation payload MUST include the correct `@odata.type`:
```json
{ "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata", ... }
```
**WHY:** Omitting or using the wrong type returns a 400 error. The API cannot infer the column type.

### 3. Every Table Needs a Primary Name Column
Every custom table MUST have exactly one `StringAttributeMetadata` with `IsPrimaryName: true`
included in the table creation payload.
**WHY:** Without it, the table is created but lookups, views, and forms cannot display a name.

### 4. Publish After Customization Changes
After creating/modifying forms, views, sitemaps, or business rules, you MUST call:
```http
POST /api/data/v9.2/PublishXml
```
**WHY:** Customizations are not visible to users until published. Schema changes (tables, columns)
are immediately effective, but UI customizations require publishing.

### 5. FormXml and FetchXml Must Stay in Sync
Every attribute in a view's `layoutxml` MUST also appear in the `fetchxml`.
**WHY:** Missing attributes in fetchxml cause blank columns in the view.

### 6. Authentication: Use Azure CLI
```bash
az account get-access-token \
  --resource "https://[org].crm6.dynamics.com/" \
  --tenant "[tenant-id]" \
  --query accessToken -o tsv
```
Do NOT use `pac auth token` (does not exist as a command).
For CI/CD, use service principal OAuth2 client_credentials flow.

### 7. Windows: Use PowerShell Scripts
On Windows, bash can mangle OData query parameters (`$filter`, `$select`, `$expand`).
Always use `.ps1` scripts on Windows for Web API calls.

### 8. Some Design Decisions Are PERMANENT
These cannot be changed after creation:
- Table logical name (display name can change)
- Column data type (cannot convert string to int)
- Table ownership type (User-owned vs Organization-owned)
- Publisher prefix (on existing components)
Know these before creating. When in doubt, ask the user.

### 9. Never Use Placeholder Columns
If a computation is needed, use formula columns or plugins — not placeholder text columns
that get updated by flows. Formula columns are evaluated server-side and always current.

### 10. Solution Context From Day 1
The FIRST operations in any build must be:
1. Create publisher (if not exists)
2. Create solution
Then every subsequent operation uses `MSCRM.SolutionUniqueName` header.

### 11. Some Components Cannot Be Created via API
These components require manual creation in the maker portal or browser automation:
- **Connections** — connection instances (not connection references) must be created interactively via the maker portal because they require OAuth consent flows
- **Some canvas app configurations** — data source bindings in canvas apps require the maker portal
- **Power BI workspace connections** — require interactive authentication

**Handoff pattern:** When the agent encounters one of these components, it should:
1. Pause the automated build
2. Instruct the user exactly what to create manually (provide names, types, and configuration values)
3. Wait for user confirmation that the manual step is complete
4. Resume the automated build

### 12. Verify API Patterns Against MS Learn Before Writing Code

**Skill files can be wrong.** L012 proved that a skill file stated privilege depth is an integer (0/1/2/3) when the API actually requires string enums ("Basic"/"Local"/"Deep"/"Global"). Every build that used the skill file failed.

Before writing code that uses a Dataverse API pattern, verify it using the MS Learn MCP tools:
1. `microsoft_docs_search("your specific API pattern")` — quick overview
2. `microsoft_docs_fetch(url)` — full page for detail when search is incomplete
3. `microsoft_code_sample_search("your pattern", language="python")` — working examples

If MS docs contradict a skill file, **trust MS docs** and flag the discrepancy.

### 13. Use Idempotent Script Patterns
Every build script should be safe to re-run. Use check-before-create patterns:
- GET to check existence before POST
- Upsert with alternate keys (`PATCH` with `If-Match`/`If-None-Match`)
- Log "Step N of M: [action] -- [created/skipped]" for progress tracking
- **Views and forms duplicate silently** — `savedqueries` and `systemforms` have no unique constraint on name. Always check by name before POST.
See `auth-and-scripting.md` section "Idempotent Script Patterns" for full examples.

---

## API Fundamentals

### Base URL
```
https://{org}.api.crm.dynamics.com/api/data/v9.2/
```
Region variants: `.crm2.` (South America), `.crm3.` (Canada), `.crm4.` (UK), `.crm5.` (Asia Pacific), `.crm6.` (Australia), `.crm11.` (Japan).

### Authentication
```bash
# Service Principal (CI/CD, automation, scripts)
TOKEN=$(curl -s -X POST "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "scope=https://${ORG}.crm.dynamics.com/.default" \
  | jq -r '.access_token')

# All API calls include:
Authorization: Bearer ${TOKEN}
Accept: application/json
OData-MaxVersion: 4.0
OData-Version: 4.0
```

### Common Headers
| Header | Value | When |
|---|---|---|
| `Authorization` | `Bearer {token}` | Always |
| `OData-MaxVersion` | `4.0` | Always |
| `OData-Version` | `4.0` | Always |
| `Accept` | `application/json` | Always |
| `Content-Type` | `application/json` | POST, PATCH, PUT |
| `Prefer` | `return=representation` | When you need the created/updated record returned |
| `Prefer` | `odata.include-annotations="*"` | To get formatted values, lookup names |
| `Prefer` | `odata.maxpagesize=100` | To control page size |
| `If-Match` | `*` | Update only if record exists |
| `If-None-Match` | `*` | Create only if record doesn't exist |
| `MSCRM.SuppressDuplicateDetection` | `false` | Enable duplicate detection on create/update |
| `MSCRM.CallerObjectId` | `{user-guid}` | Impersonate another user |
| `Consistency` | `Strong` | Force strong consistency (eventual by default) |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[CRUD, Queries & Relationships](crud-queries.md)** — Create/Read/Update/Delete, $filter/$expand/$apply, FetchXML, pagination, formatted values, associate/disassociate
- **[Bulk & Batch Operations](bulk-batch.md)** — CreateMultiple/UpdateMultiple/DeleteMultiple, $batch requests, changesets, performance guidelines
- **[Metadata (Schema Management)](metadata.md)** — Create tables/columns/relationships via API, column type reference, global option sets, query metadata
- **[Customizations](customizations.md)** — Views (SavedQuery), Forms (SystemForm), Business Rules, Custom API definitions & invocation
- **[File/Image & Change Tracking](files-change-tracking.md)** — Upload/download file & image columns, delta token sync
- **[Solution Management](solution-management.md)** — Solution CRUD, add components, export/import, publishing customizations, app modules
- **[Error Handling & Patterns](error-handling.md)** — Error codes, retry patterns, scripting patterns, SDK options
- **[Authentication & Scripting](auth-and-scripting.md)** — Azure CLI token method, PowerShell on Windows, token refresh, service principal OAuth2, script templates
- **[Advanced Column Types](advanced-column-types.md)** — Rich text, file/image, auto-number, multi-select, formula, currency, customer (polymorphic lookup) columns
- **[Parallelization Guide](parallelization.md)** — Dependency graph for build order, parallel vs sequential, parallel agent strategies for GHCP and Claude Code
- **[Dataverse Design Rules](dataverse-design-rules.md)** — Permanent decisions, managed vs unmanaged, performance considerations, solution layering
- **[Formula Columns](formula-columns.md)** — Formula column creation via API, FormulaDefinition + SourceType:3, Power Fx syntax, supported return types, limitations
- **[Grid Controls](grid-controls.md)** — Power Apps Grid Control (modern replacement for deprecated Editable Grid), configuration, nested grids, custom cell rendering
- **[Business Rules API](business-rules-api.md)** — Business rules via Workflow entity (Category=2), querying, activating/deactivating, bulk operations, scope types
- **[Security Model API](security-model-api.md)** — Security role creation, privilege assignment (AddPrivilegesRole), column security profiles, field permissions, role assignment to users/teams
- **[Environment Variables API](environment-variables-api.md)** — Environment variable definitions and values, types (String/Number/Boolean/JSON/Secret), Key Vault integration, per-environment overrides
- **[Custom APIs](custom-apis.md)** — Custom API creation with request parameters and response properties, binding types, function vs action, plugin association
- **[Conditional Operations](conditional-operations.md)** — ETags, If-Match/If-None-Match, optimistic concurrency, conditional retrieve (304), limited upsert, read-modify-write pattern
- **[Query Optimization](query-optimization.md)** — Service protection limits (429), Retry-After, entitlement vs service protection limits, query performance best practices, batch optimization
- **[FetchXML Reference](fetchxml-reference.md)** — Complete element reference (fetch/entity/filter/condition/link-entity/order), all condition operators by data type, link types, aggregation, paging cookies
- **[Build Recipe](build-recipe.md)** — End-to-end Model-Driven App build sequence (publisher → tables → columns → relationships → views → forms → charts → dashboard → app module → sitemap → security roles → publish) with Python template and common failure points
- **[Component Walkthroughs](component-walkthroughs.md)** — Step-by-step recipes for creating every Dataverse component type via Web API: tables, columns, relationships, views, forms, charts, dashboards, app modules, sitemaps, security roles

---

## Anti-Patterns

- Missing `$select` on queries (fetches all columns — performance killer)
- Querying inside loops without batching (N+1 problem — use `$batch`)
- Hardcoding org URL instead of using environment variables
- Not handling pagination (`@odata.nextLink`)
- Using `PUT` instead of `PATCH` for updates (PUT replaces the entire record)
- Ignoring `429` responses (will get throttled harder)
- Creating metadata without publishing (`PublishAllXml` / `PublishXml` required)
- Not URL-encoding FetchXML
- Missing `OData-Version: 4.0` header (causes unexpected behavior)
- Using personal access tokens in automation (use service principals)
- Not checking `Prefer: odata.include-annotations` for formatted values on choice/lookup fields
- **Using Web API inside plugins** — plugins must use the Organization Service SDK, not Web API
- Using the deprecated OData v2.0 Organization Data Service endpoint

---

## Related Skills

- `code-apps` — Code Apps consume Dataverse via generated services built on Web API
- `plugins` — Server-side Dataverse operations complement Web API patterns
- `power-automate` — HTTP connector and Dataverse actions use Web API
- `dataverse` — Schema design that Web API queries target
- `alm` — Solution lifecycle that depends on correct MSCRM.SolutionUniqueName usage
- `security` — Security roles and column security profiles created via Web API
- `dataverse-mcp` — Complementary tool for data queries and schema discovery
