# Parallelization Guide for Web API Schema Builds

## Dependency Graph

### Must Be Sequential (each depends on previous)
```
1. Publisher (must exist first)
   └── 2. Solution (references publisher)
       └── 3. Tables (in solution)
           └── 4. Columns (on tables)
               └── 5. Relationships (between tables)
                   └── 6. Views (reference columns)
                       └── 7. Forms (reference columns)
                           └── 8. App Module (references tables)
                               └── 9. Sitemap (references app module + tables)
                                   └── 10. PublishAllXml
```

**Rule:** Never create a component before its dependency exists. The API will return errors if referenced objects don't exist yet.

### Batching Within Sequential Steps

Some sequential steps can be batched internally:
- **Tables:** Multiple independent tables can be created in parallel (no cross-references yet)
- **Columns:** All columns for a single table can be created in a `$batch` request
- **Views + Forms:** Multiple views for the same table can be batched
- **Relationships:** Only after ALL referenced tables exist — then all relationships can be batched

### Can Be Parallelized (independent of each other)

After tables + columns + relationships are created:
- Web resources (independent of schema)
- PCF controls (independent of schema)
- Power BI reports (independent of schema)
- Plugin assemblies (independent of forms/views)
- Connection references (independent of schema)
- Environment variable definitions (independent of schema)

After app module + sitemap exist:
- Flows (reference tables + connection refs)
- Business rules (reference columns)
- Security roles (reference tables)
- Dashboard charts + views

### Visual Dependency Map

```
Phase 1 (Sequential):
  Publisher → Solution → Tables → Columns → Relationships

Phase 2 (Parallel - UI Components):
  ├── Views (per table)
  ├── Forms (per table)
  └── Business rules (per table)

Phase 3 (Sequential):
  App Module → Sitemap

Phase 4 (Parallel - Independent Components):
  ├── Web resources
  ├── PCF controls
  ├── Plugin assemblies
  ├── Power BI reports
  ├── Connection references
  └── Environment variables

Phase 5 (Parallel - Depends on Schema + App):
  ├── Flows
  ├── Security roles
  └── Dashboards

Phase 6 (Sequential):
  PublishAllXml
```

## Parallel Agent Strategy (GHCP)

In GitHub Copilot, open multiple chat windows to build independent components simultaneously:

```
Window 1 (Main - Sequential):
  @scott Create publisher, solution, tables, columns, relationships
  @scott Create views and forms for all tables
  @scott Create app module and sitemap
  @scott PublishAllXml

Window 2 (after tables exist):
  @scott Build web resources for [tables]

Window 3 (after tables exist):
  @scott Build PCF control for [feature]

Window 4 (after tables exist):
  @scott Build plugins for [business logic]
```

**Coordination rules:**
- Window 1 must complete tables + columns + relationships before other windows start
- All windows must use the SAME `MSCRM.SolutionUniqueName` header
- Window 1 runs `PublishAllXml` LAST, after all windows complete
- If a parallel window creates components that need publishing, it should NOT call PublishAllXml itself

## Parallel Agent Strategy (Claude Code)

Use `/fork` to spawn parallel agents:

```
Main agent (sequential):
  1. Create publisher + solution
  2. Create all tables + columns + relationships
  3. Signal: "schema ready"
  4. Create views + forms + app module + sitemap
  5. Wait for forks to complete
  6. PublishAllXml

Fork 1 (after schema ready):
  Build web resources

Fork 2 (after schema ready):
  Build PCF controls

Fork 3 (after schema ready):
  Build Power BI reports

Fork 4 (after schema ready):
  Build and register plugins
```

## Common Parallelization Mistakes

- **Creating relationships before all tables exist** — The referenced table must exist first. If Table A has a lookup to Table B, both must be created before the relationship.
- **Creating views before columns exist** — FetchXML references column logical names. If the column doesn't exist, the view creation fails silently or with a cryptic error.
- **Running PublishAllXml mid-build** — Only publish once at the end. Publishing mid-build is slow and can cause inconsistent states.
- **Parallel agents using different solutions** — All components for a single deployment must go into the same solution.
- **Not waiting for sequential dependencies** — If you get a 404 or "object not found" error, the dependency hasn't been created yet.

## Example: 3-Table Project Management Build

```
Sequential Phase:
  1. POST publishers              → Create "Contoso" publisher
  2. POST solutions               → Create "ContosoProjects" solution
  3. POST EntityDefinitions       → Create contoso_project table
  4. POST EntityDefinitions       → Create contoso_task table
  5. POST EntityDefinitions       → Create contoso_milestone table
  6. POST .../Attributes          → Add columns to project (5 columns)
  7. POST .../Attributes          → Add columns to task (4 columns)
  8. POST .../Attributes          → Add columns to milestone (3 columns)
  9. POST RelationshipDefinitions → contoso_project_task (1:N)
  10. POST RelationshipDefinitions → contoso_project_milestone (1:N)

Parallel Phase (Views + Forms per table):
  ├── POST savedqueries  → Active Projects view
  ├── POST savedqueries  → Active Tasks view
  ├── POST savedqueries  → Milestones view
  ├── POST systemforms   → Project main form
  ├── POST systemforms   → Task main form
  └── POST systemforms   → Milestone main form

Sequential Phase:
  11. POST appmodules            → Create app module
  12. POST appmodulecomponents   → Add all 3 tables to app

Final:
  13. POST PublishAllXml
```
