---
name: observability
description: "Power Platform observability, telemetry, and monitoring. Use when: Application Insights, App Insights, monitoring, telemetry, observability, alerting, diagnostics, Monitor tool, tracing, plugin traces, form load times, flow telemetry, Automation Center, dashboards, KQL."
---

# Skill: Observability & Monitoring

## When to Use
Trigger when configuring Application Insights for Power Platform, setting up telemetry for model-driven apps, canvas apps, Code Apps, or flows, creating alert rules, building monitoring dashboards, or diagnosing performance issues using telemetry data.

---

## Observability Stack

| Layer | Tool | Data |
|---|---|---|
| **Platform telemetry** | Application Insights (via Managed Environments export) | Dataverse API calls, plugin execution, SDK operations, exceptions |
| **Model-driven apps** | Application Insights + browser telemetry | Form load times, JS errors, custom events |
| **Canvas apps** | Application Insights + Monitor tool | Screen transitions, data call durations, delegation warnings |
| **Code Apps** | Application Insights SDK (`@microsoft/applicationinsights-web`) | React errors, custom events, performance marks |
| **Power Automate** | Automation Center + Application Insights (Managed Env) | Flow run telemetry, action-level timing, failures |
| **Copilot Studio** | Agent analytics + Application Insights | Session metrics, topic resolution, escalation rates |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Application Insights Setup](app-insights-setup.md)** — connection string configuration, Managed Environments requirement, per-component enablement, environment-level export, instrumentation key vs connection string
- **[Model-Driven App Telemetry](mda-telemetry.md)** — form load times, JavaScript errors, plugin traces (ITracingService + ILogger), custom events, performance markers
- **[Canvas App Telemetry](canvas-telemetry.md)** — screen transitions, data call durations, delegation warnings, Monitor tool real-time diagnostics, canvas app insights
- **[Flow Telemetry](flow-telemetry.md)** — Power Automate flow run telemetry, Automation Center dashboard, run history analytics, action-level telemetry
- **[Code App Telemetry](code-app-telemetry.md)** — React error boundaries to App Insights, `@microsoft/applicationinsights-web` setup, custom events, performance marks, platform logger integration
- **[Alerting & Dashboards](alerting-dashboards.md)** — alert rules, action groups, KQL queries for common scenarios, Azure Dashboard templates

---

## Telemetry Decision Table

| Question | Answer |
|---|---|
| Where does platform telemetry go? | Application Insights (requires Managed Environment + export config) |
| Where does custom app telemetry go? | Same or separate Application Insights instance (your choice) |
| Should I use one App Insights per environment? | **Yes** — one-to-one mapping for accurate reporting |
| Do I need Managed Environments? | **Yes** for platform telemetry export, flow telemetry, and some advanced features |
| Can I use instrumentation key? | **No** — use connection string (instrumentation key ingestion deprecated March 2025) |

---

## Anti-Patterns

- No observability at all (flying blind in production)
- Using instrumentation key instead of connection string (deprecated)
- Sharing one Application Insights instance across multiple environments (mixed data, unusable reports)
- Not enabling Managed Environments (platform telemetry export requires it)
- Monitoring only after incidents (set up proactive alerts from day 1)
- No custom events in apps (platform telemetry is too generic for business insight)
- Alert fatigue (too many noisy alerts that get ignored)
- No dashboard for stakeholders (telemetry exists but nobody looks at it)
- Telemetry in dev but not in production (monitor where it matters)

---

## Related Skills

- `env-strategy` — Managed Environments enablement for telemetry export
- `governance` — CoE Starter Kit for inventory and adoption monitoring
- `plugins` — ITracingService and ILogger for plugin telemetry
- `code-apps` — Code App telemetry setup with App Insights SDK
- `power-automate` — Flow analytics and run history
