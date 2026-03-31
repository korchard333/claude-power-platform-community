---
name: power-automate
description: "Power Automate Cloud Flows. Use when: designing flows, error handling (scope try/catch), triggers, Dataverse actions, Apply to Each performance, child flows, HTTP connector, expressions, approval flows, Teams Adaptive Cards, desktop flows (RPA)."
---

# Skill: Power Automate Cloud Flows

## When to Use
Trigger when designing, building, reviewing, or debugging Power Automate cloud flows.

---

## Flow Design Principles

1. **Idempotent flows**: Re-running the same trigger should produce the same result
2. **Error handling first**: Add try/catch scope before writing the happy path
3. **Minimal permissions**: Use service principal connections for production
4. **No hardcoded IDs**: Use environment variables or dynamic lookups
5. **Name every action**: Descriptive action names are your documentation
6. **Solution-aware**: Every production flow must be inside a solution

---

## When to Use Power Automate vs Alternatives

| Scenario | Recommended | Why |
|---|---|---|
| React to Dataverse record changes | **Power Automate** | Native trigger with filtering columns |
| Complex business logic on save | **Plugin (C#)** | Runs synchronously in transaction pipeline |
| Reusable API callable from multiple apps | **Custom API** | Registered in Dataverse, callable via Web API |
| Scheduled batch processing | **Power Automate** | Recurrence trigger + pagination |
| Real-time validation before save | **Plugin (C#)** | Pre-operation stage, can throw to block save |
| External system integration (async) | **Power Automate** | HTTP connector with retry policies |
| External system integration (sync) | **Custom Connector** | When response needed immediately |
| UI automation (no API available) | **Desktop Flow** | Power Automate Desktop with cloud orchestration |

---

## Solution-Aware Flow Checklist

- [ ] Flow is inside a solution (not "My Flows")
- [ ] All connections use Connection References
- [ ] All hardcoded URLs/IDs use Environment Variables
- [ ] Flow has error handling scope (try/catch)
- [ ] Flow name follows convention: `[Solution] - [Trigger] - [Action]`
- [ ] Run-only permissions configured if shared
- [ ] Trigger conditions set to avoid unnecessary runs
- [ ] Concurrency controls set on Apply to Each loops
- [ ] Action retry policies configured for external calls

---

## ⚠️ Verify Flow Patterns Against MS Learn

Before writing flow definitions programmatically, verify patterns using the MS Learn MCP tools:
1. `microsoft_docs_search("power automate [your pattern]")` — quick overview
2. `microsoft_docs_fetch(url)` — full page detail
3. `microsoft_code_sample_search("power automate [pattern]")` — working examples

Skill files are battle-tested but can contain errors. If MS docs contradict what's in the skill file, **trust MS docs** and flag the discrepancy.

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Error Handling](error-handling.md)** — Scope-based try/catch/finally pattern, error notification, cleanup actions
- **[Triggers](triggers.md)** — Trigger selection, Dataverse filtering columns, trigger conditions (OData expressions)
- **[Dataverse Actions & Performance](dataverse-actions.md)** — Native connector actions, OData filters, Apply to Each concurrency, child flows, pagination pattern, performance profiles
- **[Expressions & HTTP Connector](expressions.md)** — Null-safe access, date formatting, JSON parsing, HTTP resilient pattern with retry policies
- **[Approvals & Teams Adaptive Cards](approvals-adaptive-cards.md)** — Approval flow pattern, Teams card posting, email notification sync, approval types
- **[Desktop Flows (RPA)](desktop-flows.md)** — When to use RPA, execution modes, cloud-to-desktop integration, best practices
- **[Agent Flows](agent-flows.md)** — Agent Flows (AI-native automation), generative actions, Automation Center governance, autonomous agent patterns
- **[Flow Creation via Web API](flow-creation-api.md)** — Programmatic flow creation, activation, and monitoring via Dataverse Web API: clientdata structure, trigger types, connection reference wiring, activation latency, run monitoring via flowruns entity

---

## Anti-Patterns

- Flows outside of solutions ("My Flows") — can't be promoted via ALM
- Dataverse calls inside unbounded Apply to Each (no concurrency limit)
- Personal connections instead of connection references
- Missing error handling (no try/catch scope)
- No retry policy on HTTP actions
- Hardcoded GUIDs, URLs, or environment-specific values
- Using "Send an HTTP request to Dataverse" when a native action exists
- Apply to Each with >1000 items and no pagination strategy
- Approval flows with Teams cards AND email notifications enabled simultaneously (card won't sync)
- Using desktop flows when a cloud connector exists for the same system

---

## Related Skills

- `dataverse` — Schema design for tables that flows operate on
- `code-apps` — Triggering flows from Code Apps via Custom API or Dataverse record triggers
- `custom-connectors` — Building connectors for external APIs used in flows
- `alm` — Solution packaging, connection references, environment variables for flow deployment
- `plugins` — Alternative to flows for synchronous, transactional Dataverse logic
