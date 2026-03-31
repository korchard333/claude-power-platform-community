---
name: testing
description: "Power Platform Testing Strategy. Use when: writing unit tests, E2E tests, Vitest/Jest setup, Playwright, Canvas App testing, plugin testing with FakeXrmEasy, Solution Checker, accessibility testing with axe-core, CI/CD test integration."
---

# Skill: Power Platform Testing Strategy

## When to Use
Trigger when designing test plans, automating tests, debugging production issues, or validating deployments for any Power Platform solution — Code Apps, Canvas Apps, Model-Driven Apps, Flows, Plugins, or Portals.

---

## Testing Pyramid for Power Platform

```
                    └──-------------------+
                    |   E2E / UI Tests    |  <-- Slowest, most brittle
                    |  (Playwright, ERP)  |
                    └──-------------------+
                    |  Integration Tests  |  <-- Validate cross-component
                    |   (Solution Check)  |
                    └──-------------------+
                    |    Unit Tests       |  <-- Fastest, most reliable
                    | (xUnit, Jest, PTS)  |
                    └──-------------------+
```

---

## Testing by Component Type

| Component | Unit Test Tool | Integration Test | E2E Test |
|---|---|---|---|
| Code App (React) | Vitest/Jest + RTL | Playwright | Playwright |
| Canvas App | — | Power Apps Test Studio | Power Apps Test Studio |
| Model-Driven App | — | — | EasyRepro / Playwright |
| Plugin (C#) | xUnit + FakeXrmEasy | Plugin Trace Log | — |
| Power Automate Flow | — | Flow Checker + manual | Flow run history |
| PCF Control | Jest | PCF test harness | Playwright |
| Custom Connector | Postman / REST tests | Connector test tab | Flow integration test |
| Desktop Flow (RPA) | Subflow test suite (Wave 1 2026) | Flow run history | Screenshot capture on failure |
| Power Pages | — | — | Playwright / Selenium |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Code App Testing](code-apps-testing.md)** — Vitest/Jest + React Testing Library, component tests, hook tests, E2E with Playwright
- **[Canvas App Testing](canvas-testing.md)** — Power Apps Test Studio, Flow testing, Monitor tool, EasyRepro for Model-Driven Apps
- **[Plugin Testing](plugin-testing.md)** — xUnit + FakeXrmEasy setup, mocking IOrganizationService, testing plugin execution
- **[Accessibility Testing](accessibility-testing.md)** — axe-core + Playwright, manual checklist, Canvas App accessibility checker
- **[CI/CD Integration](cicd-integration.md)** — Solution Checker (static analysis), GitHub Actions, test data management, deployment validation smoke tests

---

## Anti-Patterns

- No automated tests at any level (relies entirely on manual QA)
- E2E tests without unit tests (inverted pyramid — slow, brittle, expensive)
- Testing against production data (data leaks, accidental modifications)
- Skipping Solution Checker before deployment (catches issues early)
- Plugin tests without FakeXrmEasy (testing against live org is slow and flaky)
- Canvas App tests that depend on specific data records (fail when data changes)
- No post-deployment smoke test (issues discovered by end users)
- Suppressing Solution Checker findings without justification
- Test accounts with System Administrator role (hides permission bugs)
- Not testing as each security role (misses access control issues)

---

## Related Skills

- `code-apps` — React component and hook testing patterns
- `plugins` — C# plugin testing with FakeXrmEasy
- `security` — Security role testing requirements
- `alm` — CI/CD pipeline test integration
- `accessibility-ux` — WCAG compliance testing
