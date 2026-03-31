---
name: plugins
description: "Dataverse C# Plugin development. Use when: writing plugins, IPlugin interface, execution pipeline, entity images, shared variables, unit testing with FakeXrmEasy, plugin registration, ITracingService, sandbox limitations."
---

# Skill: Dataverse C# Plugins

## When to Use
Trigger when building, debugging, or reviewing Dataverse plugins — server-side C# code that executes in response to Dataverse operations (create, update, delete, retrieve, custom API calls).

---

## When to Use Plugins vs Alternatives

| Scenario | Use | Why |
|---|---|---|
| Synchronous validation before save | **Plugin (Pre-Validation/Pre-Operation)** | Real-time, blocks save on failure |
| Auto-numbering on create | **Plugin (Pre-Operation)** | Set value before record commits |
| Complex calculated fields | **Plugin (Post-Operation sync)** | Runs after save, same transaction |
| Cascading updates to child records | **Plugin (Post-Operation async)** | Avoid timeout on large datasets |
| Long-running process (>2 min) | **Power Automate** | Plugins have 2-minute timeout |
| Orchestrate multiple external systems | **Power Automate** | Built-in connectors, retry, monitoring |
| Reusable API callable from apps | **Custom API + Plugin** | Typed inputs/outputs, callable from anywhere |
| Complex business logic from Code App | **Custom API** | Better than raw HTTP from client |

---

## Execution Pipeline Overview

```
Client Request (Create/Update/Delete/Custom API)
  │
  ├── Stage 10: Pre-Validation (BEFORE security checks, NOT in transaction)
  ├── Stage 20: Pre-Operation (AFTER security, BEFORE database write, IN transaction)
  ├── [Database Operation]
  ├── Stage 40: Post-Operation Sync (AFTER write, IN transaction — rollback possible)
  └── Stage 40: Post-Operation Async (AFTER commit, SEPARATE transaction)
```

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Project Setup & Architecture](setup-architecture.md)** — .csproj, NuGet packages, strong-name key, IPlugin template, execution pipeline details
- **[Context & Entity Images](context-images.md)** — IPluginExecutionContext properties, Target entity access, Pre/Post images registration and usage
- **[Common Patterns](common-patterns.md)** — Validation plugin, auto-number, cascading update, Custom API plugin, shared variables, IOrganizationService CRUD
- **[Unit Testing with FakeXrmEasy](testing.md)** — xUnit + FakeXrmEasy setup, mocking IOrganizationService, testing plugin execution
- **[Registration & Debugging](registration-debugging.md)** — PAC CLI & Plugin Registration Tool, step parameters, ITracingService, ILogger, remote debugging
- **[Sandbox Limitations & Performance](sandbox-performance.md)** — Sandbox restrictions, HTTP calls from plugins, 2-min/2-hour timeouts, performance guidelines

---

## Anti-Patterns

- Missing try/catch wrapping (unhandled exceptions crash the pipeline)
- Throwing generic `Exception` instead of `InvalidPluginExecutionException`
- Not using `tracingService` (makes debugging impossible)
- Querying all columns (`new ColumnSet(true)`) instead of specific columns
- Missing depth check (plugins triggering themselves infinitely)
- Using `Thread.Sleep` or `Task.Delay` (wastes sandbox resources)
- Hardcoding GUIDs, URLs, or environment-specific values
- Using personal service context when system context is needed (or vice versa)
- Not registering filtering attributes on Update steps (triggers on every field change)
- Pre-Image requesting all attributes (register only what you need)
- Sync plugins doing external HTTP calls (blocks user, risks timeout)
- Not signing the assembly with a strong name key

---

## Related Skills

- `dataverse` — Schema design that plugins operate on
- `dataverse-web-api` — Client-side API; plugins use Organization Service SDK instead
- `custom-connectors` — Alternative for external system integration
- `testing` — Plugin testing strategy with FakeXrmEasy

