---
name: spec-driven-dev
description: "Spec-driven development pattern for Power Platform. Use when: planning non-trivial
  projects, writing master specifications, splitting component specs, defining build order,
  requirements documents, design documents, specification templates."
---

# Skill: Spec-Driven Development

## When to Use
Trigger when planning non-trivial Power Platform projects that need structured requirements,
component specifications, dependency ordering, and coordinated multi-agent builds. Also trigger
when the user mentions "spec", "specification", "master spec", "component spec", "requirements
document", or "design document".

---

## Philosophy

**Spec before code.** Every build has three parts:
- **Spec** (what) — the requirement and design document
- **Agent** (who) — Laura plans, Sean designs, Scott builds, Razor reviews
- **Skill** (how) — the technical knowledge loaded for the task

Without a spec, agents build what they assume. With a spec, agents build what was agreed.

---

## Master Spec Structure

The master specification is the single source of truth for a project. Laura generates it during
the planning phase, Sean refines the technical sections.

```markdown
# [Project Name] — Master Specification

## 1. Project Overview
- Business problem being solved
- Target users and their roles
- Success criteria (measurable outcomes)
- Constraints (timeline, budget, licensing, compliance)

## 2. Functional Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-001 | [Requirement description] | Must | Given [context], When [action], Then [outcome] |
| FR-002 | ... | Should | ... |

## 3. Non-Functional Requirements
- Performance targets (page load, query response, concurrent users)
- Accessibility standard (WCAG 2.2 AA minimum)
- Browser/device support matrix
- Data retention and archival policy
- Availability target (uptime SLA)

## 4. Data Model
- Entity Relationship Diagram (Mermaid erDiagram)
- Table descriptions with ownership type and key columns
- Relationship descriptions with cascade behavior
- Option set definitions (with specific values)

## 5. Security Model
- User roles and permission levels
- Row-level security strategy (BU hierarchy, team ownership)
- Column-level security (sensitive fields)
- App-level security (Conditional Access, Managed Environments)

## 6. Integration Points
- External systems and data flow direction
- Authentication method per integration
- Error handling and retry strategy
- Data transformation requirements

## 7. ALM Strategy
- Environment topology (dev/test/UAT/prod)
- Solution segmentation (single vs multi-solution)
- CI/CD pipeline approach
- Deployment approval gates

## 8. Component Inventory
| Component | Type | Agent | Spec File | Dependencies |
|-----------|------|-------|-----------|--------------|
| [Tables + Columns] | Dataverse schema | Scott | spec-tables.md | None |
| [Views + Forms] | Customizations | Scott | spec-views-forms.md | Tables |
| [App Module] | MDA | Scott | spec-app.md | Views, Forms |
| [Flows] | Power Automate | Scott | spec-flows.md | Tables |
| ... | ... | ... | ... | ... |
```

---

## Component Spec Splitting

The master spec is split into buildable component specs. Each component spec is a self-contained
document that Scott can execute without referring back to the master spec.

### Standard Component Specs

| Spec File | Contains | Built By |
|-----------|----------|----------|
| `spec-tables.md` | Tables, columns, relationships, option sets, alternate keys | Scott (Web API) |
| `spec-views-forms.md` | System views, main forms, quick view forms | Scott (Web API) |
| `spec-app.md` | App module, sitemap, navigation | Scott (Web API) |
| `spec-flows.md` | Cloud flows, triggers, actions, error handling | Scott (Power Automate) |
| `spec-plugins.md` | Plugin steps, messages, stages, logic | Scott (C# + registration) |
| `spec-code-app.md` | React components, hooks, routes, state management | Scott (pac code) |
| `spec-pcf.md` | PCF control manifest, properties, rendering | Scott (pac pcf) |
| `spec-security.md` | Security roles, column security profiles, BU structure | Scott (Web API) |
| `spec-web-resources.md` | Form scripts, ribbon customizations, HTML web resources | Scott (Web API) |
| `spec-integration.md` | Custom connectors, Azure Functions, webhooks | Scott |

### Component Spec Template

```markdown
# Component Spec: [Component Name]

## Overview
[What this component does and why it exists]

## Dependencies
- Requires: [list of components that must exist before this one]
- Required by: [list of components that depend on this one]

## Detailed Requirements

### [Requirement Group 1]
[Specific implementation details — exact column names, data types, values]

### [Requirement Group 2]
[...]

## Acceptance Criteria
- [ ] [Specific, testable criterion]
- [ ] [...]

## Notes
[Edge cases, constraints, decisions made during design]
```

---

## Dependency Ordering

### Build Order (Sequential)
Components must be built in dependency order. The standard order is:

```
Phase 1: Foundation (sequential, blocking)
  1. Publisher + Solution
  2. Tables (all tables, no columns beyond primary name)
  3. Columns (all columns for all tables)
  4. Relationships (all relationships — tables must exist first)

Phase 2: UI Components (can be parallelized per table)
  5. Views (reference columns — columns must exist)
  6. Forms (reference columns — columns must exist)
  7. Business rules (reference columns)

Phase 3: App Shell (sequential)
  8. App module
  9. Sitemap
  10. PublishAllXml

Phase 4: Independent Components (fully parallel)
  11. Web resources
  12. PCF controls
  13. Plugin assemblies
  14. Power BI reports
  15. Connection references
  16. Environment variables

Phase 5: Dependent Components (after schema + app exist)
  17. Flows (need tables + connection refs)
  18. Security roles (need tables)
  19. Dashboards
```

### Identifying Parallel Work

Ask these questions for each component:
1. Does it reference a table or column? -> Must wait for schema (Phase 1)
2. Does it reference a form or view? -> Must wait for UI (Phase 2)
3. Does it reference the app module? -> Must wait for app shell (Phase 3)
4. Does it have no schema dependencies? -> Can run in parallel (Phase 4)

---

## Spec-to-Build Handoff

### What Laura Passes to Scott
1. The component spec file (complete, with all details)
2. The solution unique name and publisher prefix
3. The environment URL and auth method
4. Any decisions flagged as "PERMANENT" (table names, column types, ownership)

### What Scott Needs Before Starting
- [ ] Component spec is marked as "APPROVED" by Sean
- [ ] All dependency components are built (check dependency list)
- [ ] Solution exists in the target environment
- [ ] Authentication is working (Azure CLI token or service principal)

### What Scott Delivers
- [ ] All components created via Web API (with MSCRM.SolutionUniqueName header)
- [ ] PublishXml called for any UI customizations
- [ ] Self-review checklist completed
- [ ] Ready for Razor review

---

## Verification

### How Razor Validates Implementation Against Spec

For each component spec, Razor checks:

1. **Completeness** — Every item in the spec exists in the environment
2. **Correctness** — Column types, relationship cascade configs, view filters match spec
3. **Solution membership** — All components are in the correct solution (not Default)
4. **Naming compliance** — All logical names follow naming conventions
5. **Security** — Roles and column security match the security model
6. **Publishability** — All customizations are published and accessible

### Verification queries (Web API)
```http
# Check all components in solution
GET /api/data/v9.2/solutioncomponents
  ?$filter=_solutionid_value eq [solution-guid]
  &$select=componenttype,objectid

# Check table exists with correct columns
GET /api/data/v9.2/EntityDefinitions(LogicalName='prefix_tablename')
  ?$expand=Attributes($select=LogicalName,AttributeType,RequiredLevel)

# Check views exist
GET /api/data/v9.2/savedqueries
  ?$filter=returnedtypecode eq 'prefix_tablename'
  &$select=name,fetchxml,layoutxml
```

---

## Anti-Patterns

- **Building without a spec** — "Just start coding" leads to rework when requirements were ambiguous
- **Monolithic spec** — One giant document that no agent can fully consume. Split into component specs.
- **Spec without acceptance criteria** — If you can't test it, you can't verify it
- **Skipping dependency ordering** — Creating views before columns exist causes silent failures
- **Not marking permanent decisions** — Table names and column types need explicit user confirmation
- **Spec drift** — Spec says one thing, implementation does another. Razor catches this.

---

## Executable Master Spec Template

Copy-paste this template to start a new project specification:

```markdown
# [Project Name] -- Master Specification

## Project Overview
- **Business problem:** [What pain point does this solve?]
- **Target users:** [Role 1 (X users), Role 2 (Y users)]
- **Success criteria:** [Measurable outcome 1], [Measurable outcome 2]
- **Timeline:** [Target go-live date]
- **Licensing:** [Power Apps Premium / per-app / existing entitlements]

## Stakeholders
| Name | Role | Responsibility | Sign-off authority? |
|---|---|---|---|
| [Name] | Product Owner | Requirements, UAT approval | Yes |
| [Name] | IT Admin | Environment, licensing, DLP | Yes |
| [Name] | End User Rep | Acceptance testing | No |

## Functional Requirements
| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-001 | As a [role], I want to [action], so that [outcome] | Must | Given [context], When [action], Then [outcome] |
| FR-002 | ... | Should | ... |
| FR-003 | ... | Could | ... |

## Non-Functional Requirements
- **Performance:** Page load < 3s, query response < 2s, support X concurrent users
- **Accessibility:** WCAG 2.2 AA compliance
- **Browser support:** Edge, Chrome (latest 2 versions)
- **Data retention:** [X years, then archive/delete]
- **Availability:** [99.9% during business hours]

## Data Model Summary
[Mermaid erDiagram or table list with key columns, relationships, ownership type]

## Integration Points
| System | Direction | Method | Auth | Error Handling |
|---|---|---|---|---|
| [System A] | Inbound | Custom Connector / HTTP | OAuth 2.0 | Retry 3x, then queue |
| [System B] | Outbound | Power Automate flow | Service Principal | Dead letter table |

## Security Requirements
- Roles: [Role 1 -- CRUD on own records], [Role 2 -- Read all, Create own]
- Row-level security: [BU hierarchy / Team ownership / None]
- Column security: [SSN, salary columns restricted to Role X]
- Authentication: [Entra ID, conditional access required]

## Build Order (Dependency Graph)
1. Publisher + Solution
2. Tables (schema only, primary name columns)
3. Columns (all columns for all tables)
4. Relationships (lookups, N:N)
5. Option sets (global and local)
6. Views + Forms
7. Security roles + column security profiles
8. Flows (after tables + connection references exist)
9. App module + sitemap
10. PublishAllXml

## Acceptance Criteria Summary
[Each FR maps to a testable Given/When/Then that Ava uses for UAT scripts]
```

---

## Worked Example: Case Management

A simplified spec showing how the template maps to real requirements.

### Project Overview
- **Business problem:** Support team tracks cases in spreadsheets. No visibility, no SLAs, no escalation.
- **Target users:** Support Agents (15), Support Managers (3), Customers (external portal)
- **Success criteria:** 90% of cases resolved within SLA, manager dashboard shows real-time status

### User Stories (3 examples)

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-001 | As a support agent, I want to log a new case with customer details and description | Must | Given I am on the case form, When I fill required fields and save, Then a case record is created with status "New" and auto-numbered case ID |
| FR-002 | As a support manager, I want to see all cases approaching SLA breach | Must | Given cases have an SLA deadline, When I open the "SLA At Risk" view, Then I see cases where deadline is within 4 hours and status is not "Resolved" |
| FR-003 | As a customer, I want to check my case status on a portal | Should | Given I am logged into the portal, When I navigate to "My Cases", Then I see my open cases with status and last update date |

### Data Model (4 tables)

| Table | Ownership | Key Columns | Relationships |
|---|---|---|---|
| contoso_case | User | case_number (autonumber), title, description, status, priority, sla_deadline | Lookup to contact, lookup to contoso_category |
| contoso_category | Organization | name, sla_hours, escalation_team | 1:N to contoso_case |
| contoso_caseactivity | User | activity_type, notes, created_by | Lookup to contoso_case |
| contact | User | (standard) | 1:N to contoso_case |

### Build Order

```
1. Publisher (contoso) + Solution (CaseManagement)
2. Tables: contoso_case, contoso_category, contoso_caseactivity
3. Columns: all columns per table
4. Relationships: case->contact, case->category, caseactivity->case
5. Views: "Active Cases", "My Cases", "SLA At Risk", "Cases by Category"
6. Forms: Case main form (3 tabs), Category quick create
7. Security roles: "Support Agent" (CRUD own cases), "Support Manager" (Read all, manage team)
8. Flows: "Set SLA Deadline on Create", "Escalate SLA Breach", "Notify Customer on Update"
9. App module: "Case Management" with sitemap
10. PublishAllXml
```

### Agent Delegation

| Phase | Agent | Skills Loaded |
|---|---|---|
| Planning | Laura | architecture, spec-driven-dev |
| Architecture | Sean | architecture, dataverse, security, power-pages |
| Build (schema) | Scott | dataverse-web-api |
| Build (UI) | Scott | dataverse-web-api (customizations) |
| Build (flows) | Scott | power-automate |
| Build (portal) | Scott | power-pages |
| Review | Razor | dataverse, power-automate, security, power-pages |
| Infrastructure | Parvez | alm, env-strategy |
| UAT | Ava | testing |

---

## Spec-to-Acceptance-Criteria Mapping

Every functional requirement in the spec maps to a testable Given/When/Then statement that Ava uses to generate UAT scripts.

### Mapping Pattern

```
Spec Requirement (FR-XXX)
  -> Given/When/Then (acceptance criteria)
    -> UAT Script Step (Ava generates)
      -> Pass/Fail (Ava records during UAT)
```

### Example Mappings

| Spec Requirement | Given | When | Then |
|---|---|---|---|
| FR-001: Log new case | Agent is on case form | Agent fills title, description, priority, customer and saves | Case record created with status "New", auto-number assigned, SLA deadline calculated |
| FR-002: SLA at-risk view | 3 cases exist: 1 within SLA, 1 within 4 hours of breach, 1 already breached | Manager opens "SLA At Risk" view | Only the 2 at-risk/breached cases appear; case within SLA is not shown |
| FR-003: Portal case status | Customer has 2 open cases and 1 closed case | Customer logs into portal and opens "My Cases" | 2 open cases shown with status and last update; closed case not shown |

### Ava's UAT Script Format

```markdown
## UAT Script: FR-001 -- Log New Case

**Preconditions:**
- Logged in as user with "Support Agent" role
- At least 1 contact record exists

**Steps:**
1. Navigate to Case Management app
2. Click "+ New Case"
3. Fill: Title = "Test Case 001", Description = "Test description"
4. Set Priority = "High", Customer = [existing contact]
5. Click Save

**Expected Results:**
- [ ] Case record is created
- [ ] Case Number is auto-generated (format: CASE-XXXXX)
- [ ] Status = "New"
- [ ] SLA Deadline is set to [now + category SLA hours]
- [ ] Created By = current user
- [ ] Owner = current user
```

---

## Related Skills

- `dataverse-web-api` -- Primary build tool for executing specs
- `architecture` -- Sean's skill for designing the architecture that specs describe
- `alm` -- ALM strategy section of the master spec
- `security` -- Security model section of the master spec
- `testing` -- Test plans derived from acceptance criteria
