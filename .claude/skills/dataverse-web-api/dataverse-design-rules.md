# Dataverse Design Rules

## Permanent Decisions

These choices CANNOT be changed after creation. Get them right the first time.

| Decision | Permanent? | What Can Change? |
|---|---|---|
| Table logical name | YES | Display name can change, logical name cannot |
| Column logical name | YES | Display name can change, logical name cannot |
| Column data type | YES | Cannot convert string to int, int to decimal, etc. |
| Table ownership type | YES | Cannot change User-owned to Organization-owned or vice versa |
| Publisher prefix | YES (on existing components) | New publisher can have different prefix, but existing components keep theirs |
| Table type (Standard vs Activity vs Virtual vs Elastic) | YES | Cannot convert between table types |
| Relationship type (1:N vs N:N) | YES | Must delete and recreate as different type |

**When in doubt, ask the user before creating.** These decisions cannot be undone — only worked around by creating new components and migrating data.

### What Happens If You Get It Wrong

- **Wrong table name:** Create a new table with the correct name, migrate all data, update all references (views, forms, flows, code), delete the old table.
- **Wrong column type:** Create a new column with the correct type, write a migration script/flow to convert and copy data, update all references, delete the old column.
- **Wrong ownership type:** Create a new table entirely. Organization-owned tables cannot have user-level security; User-owned tables require owner assignment.

## Table Ownership Decision Guide

| Ownership | When to Use | Security Behavior |
|---|---|---|
| **User-owned** | Most custom tables — any data that "belongs" to someone | Full CRUD security matrix (User, BU, Parent BU, Organization), sharing, team ownership |
| **Organization-owned** | Reference/lookup data, configuration tables, shared data with no owner concept | Organization-level only — all users with the role see all records. No row-level security. |

**Default to User-owned** unless you have a specific reason for Organization-owned. User-owned is more flexible — you can always grant Organization-level access via security roles, but you cannot add row-level security to Organization-owned tables.

## Solution Layering

### Managed vs Unmanaged Solutions

| Aspect | Unmanaged | Managed |
|---|---|---|
| **Purpose** | Development environment | Test/UAT/Production environments |
| **Editable** | Yes — components can be modified directly | No — components are locked |
| **Removable** | Components are individually removed | Entire solution can be cleanly uninstalled |
| **Layering** | Base layer or active customization layer | Read-only layer, stacks on top |
| **Risk** | Cannot be cleanly removed as a unit | Clean install/uninstall lifecycle |

**Rule:** NEVER import unmanaged solutions to production. Always export as managed for non-dev environments.

### Active Customization Layer

When a managed component is customized in the target environment, it creates an "active customization" layer on top. This makes upgrades unpredictable.

**Best practice:** Avoid active customizations in production. All changes should flow through the managed solution pipeline.

### Solution Segmentation

| Strategy | When |
|---|---|
| **Single solution** | Small projects (<50 components), single team |
| **Multi-solution (segmented)** | Large projects, multiple teams, independent release cycles |
| **Base + Extension** | Shared platform components + project-specific extensions |

**Segmentation rules:**
- Each solution should have a clear boundary (e.g., one per app module, or one per domain)
- Avoid circular dependencies between solutions
- Shared components (e.g., lookup tables used by multiple apps) go in a base solution
- Solutions are deployed in dependency order (base first)

## Performance Considerations

### Table Design
- **Prefer standard tables** over elastic tables unless you need >100M rows or flexible schema
- **Elastic tables** (Cosmos DB-backed): near-unlimited scale, but no relationships, no security roles, limited query operators
- **Virtual tables** (real-time external data): no data stored in Dataverse, every read is a live call to the external source — use for small, frequently-changing datasets only

### Column Design
- **Use appropriate types:** Don't store numbers as strings. Integer/Decimal columns are indexed and filterable efficiently.
- **Max length matters:** `MaxLength: 100` uses less storage and indexes better than `MaxLength: 4000`
- **Calculated vs Formula columns:** Formula columns (Power Fx) replace legacy calculated columns. They evaluate server-side on read and are always current.
- **Rollup columns:** Aggregate child records (SUM, COUNT, AVG, MIN, MAX). Calculated asynchronously every 12 hours by default (or on-demand via CalculateRollupField API).

### Indexing
- Primary key columns are automatically indexed
- Lookup columns are automatically indexed
- For frequently filtered columns, request custom indexes via support (not available via API)
- Alternate keys create unique indexes — useful for upsert operations and integration scenarios

## Import Gotchas

### Common Failures During Solution Import
| Symptom | Cause | Fix |
|---|---|---|
| "Entity with name X not found" | Missing dependency — a referenced table doesn't exist in target | Ensure base solution is imported first |
| "Attribute with name X not found" | Column was removed in dev but still referenced in a form/view | Clean up references before export |
| "Duplicate component" | Same component exists in another unmanaged solution | Remove from one solution or use `AddSolutionComponent` with `DoNotIncludeSubcomponents: true` |
| Solution import hangs | Large solution with many flows being activated | Split flows into a separate solution, import with `PublishWorkflows: false` |

### Environment Variable Handling
- Environment variable **definitions** travel with the solution
- Environment variable **current values** must be set in each target environment
- Use deployment settings files (`deploymentSettings.json`) to automate value assignment during CI/CD

### Connection Reference Handling
- Connection references travel with the solution as definitions
- Actual connections must exist in the target environment
- Map connections during import or via deployment settings file

## When NOT to Use Web API for Schema

| Scenario | Better Approach |
|---|---|
| Complex business rule XAML | Create in maker portal, export via solution |
| Canvas app modifications | Edit in Power Apps Studio |
| Flow design | Edit in Power Automate designer |
| Complex form customizations with custom controls | Start via API for structure, fine-tune in form designer |
| PCF control development | Use `pac pcf init` + `pac pcf push` |
| Code App development | Use `pac code init` + `pac code push` |
