---
name: code-apps
description: "Power Apps Code Apps Development (React + TypeScript + Vite). Use when: building Code Apps, three-layer architecture, PAC CLI workflow, Zustand state management, TanStack Query, shadcn/ui components, router basename, provider stack, form patterns, Dataverse integration from React."
---

# Skill: Power Apps Code Apps Development

## When to Use
Trigger when building, debugging, or reviewing Code Apps — React + TypeScript + Vite applications running inside Power Apps.

---

## Tech Stack Reference

| Layer | Technology | Notes |
|---|---|---|
| Language | TypeScript (strict mode) | Primary language for all code |
| UI Framework | React 18/19 | Functional components only |
| Build Tool | Vite + `@microsoft/power-apps` plugin | Dev server + Power Apps integration |
| Styling | Tailwind CSS + shadcn/ui | Starter template default |
| Styling (alt) | Fluent UI v9 (`@fluentui/react-components`) | Microsoft-branded enterprise apps — see [fluent-ui.md](fluent-ui.md) |
| Client State | Zustand | Cross-component state |
| Server State | TanStack Query v5 | Caching, background refresh, mutations |
| Routing | React Router v6 | With basename normalization |
| Tables | TanStack Table | Sorting, filtering, pagination |
| Charts | Recharts | Data visualization |
| Notifications | Sonner | Toast notifications |
| Testing | Playwright | E2E testing |
| CLI | PAC CLI + `@microsoft/power-apps` npm | Scaffolding, data sources, deployment |

---

## Three-Layer Architecture

```
Layer 1: Presentation (components/) — Props in, callbacks out. ZERO service imports.
Layer 2: Business Logic (hooks/)    — TanStack Query + Zustand. ONLY layer calling services.
Layer 3: Data Access (generated/)   — PAC CLI auto-generated. NEVER manually edit.
```

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Architecture & Critical Patterns](architecture.md)** — Three-layer pattern, project structure, auth model, env var access, router basename, provider stack, lookup handling
- **[CLI Workflow](cli-workflow.md)** — npm CLI (preview, becoming primary), PAC CLI commands, connector discovery (Wave 1 2026), agent.md, scaffold, init, data sources, build, deploy
- **[State Management](state-management.md)** — Zustand stores for client state, TanStack Query for server state, caching patterns
- **[Form Patterns](forms.md)** — Create/edit hook pattern, component pattern, page composition, validation
- **[Power Automate Integration](power-automate-integration.md)** — Triggering flows via Custom API or Dataverse record trigger
- **[Fluent UI V9](fluent-ui.md)** — FluentProvider setup, theme customization (BrandVariants, dark/light mode), design tokens, makeStyles patterns, component patterns (forms, DataGrid, Dialog, layout), responsive design with Fluent
- **[Performance & Localization](performance.md)** — Performance checklist, error handling, language detection, translation dictionary, RTL layout, date/currency formatting

---

## Anti-Patterns

- Importing generated services directly in components (violates three-layer rule)
- Embedding secrets in Code App source (published code is publicly accessible)
- Skipping router basename normalization (breaks navigation in Power Apps host)
- Using `window.fetch` directly instead of generated services (bypasses auth and connectors)
- Hardcoding display text in JSX instead of using translation dictionary
- Using `Intl.NumberFormat` with hardcoded currency codes (user's currency comes from `usersettings`)
- Fetching all columns from Dataverse (always use `$select`)
- Eager `$expand` on large lookup tables (resolve on-demand instead)
- Manual auto-numbering in plugins when Dataverse auto-number columns exist
- Not handling loading, error, and empty states in presentation components
- Using `React.useEffect` for data fetching instead of TanStack Query
- Storing server state in Zustand (use TanStack Query for anything from an API)

---

## Related Skills

- `dataverse-web-api` — Code Apps consume Dataverse via generated services built on Web API
- `dataverse` — Schema design that Code App queries target
- `testing` — Code App testing with Vitest/Jest + Playwright
- `power-automate` — Integration patterns for triggering flows from Code Apps
- `accessibility-ux` — WCAG 2.2 AA compliance for Code App components
