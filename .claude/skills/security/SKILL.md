---
name: security
description: "Dataverse Security Model. Use when: designing security roles, column-level security, business units, teams (owner/access/AAD group), record sharing, hierarchy security, minimum viable privileges, security role management via Web API."
---

# Skill: Dataverse Security Model

## When to Use
Trigger when designing security roles, field-level security, row-level access, team structures, business unit hierarchies, or any access control design for Dataverse/Power Platform solutions.

---

## Security Model Overview

```
Entra ID (Authentication)
  └── Confirms identity ("who are you?")

Dataverse Security (Authorization)
  ├── Security Roles          → Table-level CRUD + access depth
  ├── Column Security         → Field-level read/update control
  ├── Row-Level Security      → Record ownership + sharing
  ├── Business Units          → Organizational hierarchy
  ├── Teams                   → Group-based access
  └── Hierarchy Security      → Manager/position chain visibility
```

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Roles & Privileges](roles-privileges.md)** — Access levels (User/BU/Parent:Child/Org), privileges (CRUD + Append/AppendTo/Assign/Share), standard role patterns, minimum viable privileges
- **[Row & Column Security](row-column-security.md)** — Column security profiles, field permissions, row-level patterns (ownership, sharing, hierarchy)
- **[Business Units & Teams](business-units-teams.md)** — BU hierarchy design, owner teams, access teams, Azure AD Group Teams, record sharing (GrantAccess/RevokeAccess)
- **[Web API Management](web-api-management.md)** — Security role CRUD via Web API, privilege queries, role assignment to users/teams, field security profile management

---

## Security Design Checklist

```markdown
## Security Model Design: [Solution Name]

### Tables & Access Matrix
| Table | App Admin | App Manager | App User | App Reader |
|---|---|---|---|---|
| contoso_project | Org CRUD | BU CRUD | User CRW | Org R |
| contoso_task | Org CRUD | BU CRUD | User CRUD | Org R |
| contoso_resource | Org CRUD | BU R | User R | Org R |

### Column Security
| Table | Column | Who Can Read | Who Can Update |
|---|---|---|---|
| contoso_project | contoso_budget | Finance Team, App Admin | Finance Team |
| contact | contoso_salary | HR Team | HR Team |

### Validation
- [ ] Test as each role — verify CRUD boundaries
- [ ] Test cross-BU access — verify isolation
- [ ] Test column security — verify restricted fields masked
- [ ] Test with no roles — verify access denied
- [ ] Verify lookup target tables have Read access
- [ ] Verify AppendTo on lookup target tables
```

---

## Power Pages Table Permissions Audit

When auditing table permissions for a Power Pages site, run these 7 check categories:

1. **Missing Permissions** (Critical) — Table used in code but no permission exists (403)
2. **Overly Broad Scope** (Warning) — Global scope with write/delete enabled
3. **Missing Append/AppendTo** (Critical) — Tables with lookups need append on source, appendto on target
4. **Orphaned Permissions** (Info) — Permission exists but table not used in code
5. **Missing Web Role Association** (Warning) — Permission without web role has no effect
6. **Parent Chain Integrity** (Critical) — Parent scope with broken parent reference grants no access
7. **CRUD Excess** (Warning) — More privileges than code uses (principle of least privilege)

---

## Anti-Patterns

- Giving users System Administrator role ("just make it work")
- Single security role for all users (no least-privilege)
- Not testing access as each role type
- Missing AppendTo on lookup target tables (causes confusing save errors)
- Not scoping environment variables/connection references with appropriate read access
- Creating security roles in root BU when they should be BU-scoped
- Over-sharing records (share individually instead of using teams)
- Not using Azure AD Group Teams when Entra ID groups already exist
- Column security without a clear policy (inconsistent protection)
- Cascade delete configured without considering security implications
- Org-owned tables when row-level isolation is needed
- Using hierarchy security without clear organizational structure

---

## Related Skills

- `dataverse` — Table and relationship design that security roles protect
- `dataverse-web-api` — Security role and privilege management via API
- `power-pages` — Table permissions and web roles for portal security
- `testing` — Security role testing strategy
- `plugins` — Plugin execution context and impersonation
