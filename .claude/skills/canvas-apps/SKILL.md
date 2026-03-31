---
name: canvas-apps
description: "Canvas Apps Development with Power Fx. Use when: building Canvas Apps, Power Fx formulas, delegation patterns, component libraries, responsive Canvas layout, offline capabilities, modern controls, named formulas, Canvas App ALM."
---

# Skill: Canvas Apps Development

## When to Use
Trigger when building, reviewing, or debugging Canvas Apps — low-code Power Apps built with Power Fx formulas, connectors, and drag-and-drop controls for mobile, tablet, and web scenarios.

---

## AI Accuracy Warning
LLMs produce less accurate Power Fx than mainstream languages (JavaScript, C#, Python) due to smaller training datasets. Always verify AI-generated Power Fx formulas — especially complex ones involving delegation, ThisItem/ThisRecord, concurrent collections, or nested If/Switch logic. Use Power Apps Test Engine to validate formulas before promoting to production.

---

## When to Use Canvas Apps vs Alternatives

| Scenario | Best Choice | Why |
|---|---|---|
| Standard Dataverse CRUD + business process | Model-Driven App | Built-in forms, views, business rules |
| Custom pixel-perfect UI + pro-dev team | Code App | Full React/TypeScript control |
| Mobile-first field app | **Canvas App** | Power Apps mobile, offline, camera, GPS |
| SharePoint list frontend | **Canvas App** | SharePoint form customization |
| Multi-data-source mashup | **Canvas App** | 1000+ connectors |
| Quick internal tool / form | **Canvas App** | Fastest time-to-value |
| Citizen developer / maker | **Canvas App** | Low-code, no TypeScript needed |
| Complex interactive dashboards | Code App | Better performance, charting libraries |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- [Power Fx Fundamentals](power-fx.md) — data types, core functions (CRUD, navigation, variables), named formulas, UDFs
- [Delegation](delegation.md) — delegable vs non-delegable functions, limits, warning patterns, workarounds
- [Components & Modern Controls](components.md) — component library, property types, Fluent 2 modern controls, theming
- [Screen Patterns & Responsive Design](screens-responsive.md) — master-detail, loading pattern, container layout, phone vs tablet
- [Offline Capabilities](offline.md) — LoadData/SaveData, connectivity check, offline queue + sync pattern
- [Connectors, Data Sources & Integration](connectors-integration.md) — connector types, Dataverse/SharePoint patterns, Power Automate integration, environment variables
- [Canvas ALM](canvas-alm.md) — solution-aware development, source control (pac canvas unpack/pack), co-authoring
- [Performance & Error Handling](performance.md) — Concurrent loading, optimization do's/don'ts, form validation, IfError
- [Power Fx Function Reference](power-fx-functions.md) — Complete function reference by category: Text, Math, Date/Time, Logical, Table, Collection, Behavior, JSON, Environment
- [Power Fx Operators Reference](power-fx-operators.md) — Arithmetic, comparison, logical, membership (`in`/`exactin`), scope (`ThisItem`/`Self`/`Parent`/`As`/`@`), chaining, type operators, precedence
- [Controls Reference](controls-reference.md) — Top 15 Canvas controls (Gallery, EditForm, TextInput, ComboBox, Button, etc.) with key properties, events, patterns, modern vs classic differences

---

## Naming Conventions

| Object | Convention | Example |
|---|---|---|
| Screens | `[Feature]Screen` | `ContactBrowseScreen`, `ContactDetailScreen` |
| Galleries | `gal[Name]` | `galContacts`, `galOrders` |
| Buttons | `btn[Action]` | `btnSave`, `btnDelete`, `btnRefresh` |
| Text Inputs | `txt[Field]` | `txtFirstName`, `txtSearchQuery` |
| Dropdowns | `drp[Field]` | `drpStatus`, `drpPriority` |
| Labels | `lbl[Purpose]` | `lblTitle`, `lblErrorMessage` |
| Icons | `ico[Purpose]` | `icoSearch`, `icoClose` |
| Forms | `frm[Entity]` | `frmContact`, `frmOrder` |
| Containers | `con[Purpose]` | `conHeader`, `conSidebar` |
| Global variables | `gbl[Name]` | `gblUserName`, `gblIsAdmin` |
| Context variables | `loc[Name]` | `locIsEditing`, `locErrorMsg` |
| Collections | `col[Name]` | `colContacts`, `colPendingChanges` |
| Flows | `flow[Action]` | `flowProcessOrder`, `flowSendNotification` |
| Components | `cmp[Name]` | `cmpStatusBadge`, `cmpSearchBar` |
| Component libraries | `lib[Name]` | `libSharedControls` |

---

## Accessibility in Canvas Apps

- Set `AccessibleLabel` on every control
- Set `TabIndex` for logical tab order (0 for interactive, -1 to skip)
- Use `Live` property for dynamic content updates (screen reader announcements)
- Provide sufficient color contrast (4.5:1 for text)
- Ensure all functionality accessible via keyboard
- Use the Accessibility Checker in Power Apps Studio: App checker → Accessibility

---

## Anti-Patterns

- Building Canvas Apps outside of solutions ("My Apps")
- Direct connections instead of connection references
- Hardcoded GUIDs or environment URLs
- Loading entire tables without `Filter` or `$top`
- Ignoring delegation warnings (blue underline in formula bar)
- Using `Set` for table data instead of `ClearCollect`
- Nesting `ForAll` with `Patch` for bulk operations
- Using `OnStart` for heavy data loading without `Concurrent`
- Naming controls with default names (Button1, Label4, Gallery3)
- Not implementing error handling on form submissions
- Using `Navigate` without `Back()` support (no way to return)
- Embedding sensitive values in formulas (visible in .msapp file)
- Using the **Dynamics 365 connector** (deprecated) — use the native **Microsoft Dataverse** connector instead
- Using the **Dataverse (legacy)** connector — use the current **Microsoft Dataverse** connector

---

## Related Skills

- `dataverse` — Table design and data modeling for Canvas App data sources
- `power-automate` — Cloud flows triggered from Canvas Apps
- `testing` — Canvas App testing strategies
- `accessibility-ux` — WCAG compliance in Canvas Apps
