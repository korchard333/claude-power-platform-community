---
name: model-driven-apps
description: "Model-Driven Apps Development. Use when: building Model-Driven Apps, forms, views, business rules, site map, command bar customization, custom pages, embedded Canvas Apps, subgrids, role-based form switching, generative pages."
---

# Skill: Model-Driven Apps

## When to Use
Trigger when building, configuring, reviewing, or troubleshooting Model-Driven Apps — including forms, views, business rules, app modules, site maps, command bar customizations, custom pages, and generative pages.

---

## When to Use Model-Driven Apps vs Alternatives

| Scenario | Best Choice | Why |
|---|---|---|
| Standard Dataverse CRUD + business process | **Model-Driven App** | Built-in forms, views, business rules, BPF |
| Custom pixel-perfect UI | Code App | Full React/TypeScript control |
| Mobile field work, offline, camera | Canvas App | Power Apps mobile, offline support |
| Complex dashboards / analytics | Power BI embedded in MDA | Better charting, slicers |
| High-volume data admin (bulk edit) | **Model-Driven App** | Grid editing, bulk update, advanced find |
| Citizen developer / quick UI | Canvas App | No TypeScript needed |

**Key MDA strengths:** Forms, views, charts, dashboards with zero custom code. Business rules on client and server. Role-based form switching, audit trail, duplicate detection, merge records. Offline mobile via Dynamics 365 mobile app.

---

## App Module (Site Map) Structure

```
App Module
├── Navigation Groups
│   ├── Group: "Operations" → Subareas (entities)
│   └── Group: "Configuration" → Settings, Users
├── Dashboards
└── Security Roles (who can access this app)
```

### Create App Module via Web API
```http
POST /api/data/v9.2/appmodules
Content-Type: application/json

{
  "name": "Contoso Projects",
  "uniquename": "contoso_ProjectsApp",
  "description": "Project management app",
  "clienttype": 4,
  "isdefault": false
}
```

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Forms](forms.md)** — form types, Quick View, role-based switching, lookup/choice columns, embedded Canvas Apps, form performance
- **[Views](views.md)** — view types, Quick Find, subgrids, Power Apps grid control, deprecated Editable Grid, view performance
- **[Sitemap](sitemap.md)** — sitemap XML schema, Area/Group/SubArea structure, single Area layout (left-nav vs bottom tabs), Titles format, IntroducedVersion requirement, dashboard navigation
- **[Business Rules](business-rules.md)** — scope options (Entity/AllForms/SpecificForm), supported actions, when NOT to use
- **[Command Bar](command-bar.md)** — Command Designer (no-code), modern JavaScript commands, Power Fx commands, lookup parameter naming for form pre-population
- **[Custom Pages](custom-pages.md)** — Custom Pages vs embedded Canvas Apps, creating, navigating to, passing parameters
- **[Generative Pages (Genux)](generative-pages.md)** — React 17 + Fluent UI V9 single-file components, DataAPI, RuntimeTypes, PAC CLI workflow, localization, sample templates

---

## Microsoft 365 Copilot in Model-Driven Apps (Preview)

> **Note:** The previous "Copilot chat" feature in MDA is **deprecated** (January 2026) for non-Dynamics 365 environments. Use M365 Copilot instead.

M365 Copilot requires a Microsoft 365 Copilot license. Provides AI-assisted record summarization, data exploration. Works within the MDA shell for D365 and custom MDA apps.

---

## Deprecated & Removed Controls

| Control | Status | Date | Replacement |
|---|---|---|---|
| **Editable Grid** | Deprecated | March 2026 | Power Apps grid control |
| **Hierarchy control** | **Removed** | October 2025 | None (removed entirely) |
| **Classic look** | Deprecated | April 2026 | Modern look (now default) |
| **Rich Text Editor (classic)** | Deprecated | April 2025 | Modern RTE (default) |
| **Copilot chat (non-D365)** | Deprecated | January 2026 | M365 Copilot |
| **Autocomplete control** | Deprecated | — | Standard lookup |
| **Input mask control** | Deprecated | — | Business rules + validation |
| **Multimedia player** | Deprecated | — | Custom PCF / web resource |

---

## Naming Conventions

| Object | Convention | Example |
|---|---|---|
| App module | `[Publisher] [Domain] App` | `Contoso Projects App` |
| Form | `[Entity] [Audience] Form` | `Project Admin Form` |
| View (system) | `[Audience] - [Scope]` | `My - Active Projects` |
| Business rule | `[Trigger]: [Action]` | `High Priority: Require Due Date` |
| Command | `[Verb] [Entity]` | `Approve Order` |
| Dashboard | `[Audience] [Domain] Dashboard` | `Manager Project Dashboard` |

---

## ALM for Model-Driven Apps

```
All MDA configuration lives in solutions:
  - App module (site map), Forms, views, charts, Business rules
  - Command bar customizations, Security role assignments

Export / unpack: pac solution export → pac solution unpack --processCanvasApps true
Forms and views unpack to readable XML — review diffs carefully
Business rules unpack to XAML — treat as opaque, don't edit manually
```

---

## Anti-Patterns

- Using Editable Grid in new development (deprecated March 2026 — use Power Apps grid control)
- Using hierarchy control (removed October 2025)
- Relying on Copilot chat feature in non-D365 environments (deprecated January 2026)
- Building Model-Driven Apps outside of solutions ("My Apps")
- Using JavaScript where a Business Rule suffices (harder to maintain)
- Business rules with scope "Entity" for UI-only logic (wastes server cycles)
- More than 7 tabs on a form (unusable cognitive load)
- Subgrids loading all records without default views (performance)
- Advanced Find views in production dashboards (personal views break sharing)
- Mixing managed and unmanaged customizations in the same environment
- Hardcoded GUIDs in JavaScript form scripts
- Not setting a Quick Find view (renders lookup search unusable or slow)

---

## Related Skills

- `web-resources` — JavaScript form scripts and ribbon customizations
- `canvas-apps` — Embedded Canvas Apps in Model-Driven forms
- `dataverse` — Underlying table, form, and view design
- `security` — Security roles that control form and field visibility
