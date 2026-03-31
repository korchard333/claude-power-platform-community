# Full-Stack Integration Eval: Contoso Project Tracker

> **Instructions for evaluator:** Open a fresh Claude Code window in this repo. Paste one of the 4 prompts below. The agent should NOT build anything — it should produce a detailed implementation plan and a `workflow-log.md` file. Grade against the expectations in `full-stack-scenario.json`.

---

## Scenario Context (Include with every prompt)

Paste this context block before each test prompt:

```
You are working in a Power Platform skills repository. This repo contains 33 skills across agents, instructions, and skill files that guide Power Platform development. Use the skills in this repo as your knowledge base — read the relevant SKILL.md files and their sub-files to inform your recommendations.

For every architectural decision, cite the specific skill file path that informed it (e.g., "per skills/architecture/SKILL.md, ...").

Save a workflow-log.md file that documents:
1. Every skill file you read (full path)
2. Every architectural decision you made and why
3. Every trade-off you considered
4. Any gaps where no skill file provided guidance

Do NOT build anything. Produce a detailed implementation plan document as your output.
```

---

## Test Case 1: Architecture & Data Model

**Paste after the context block:**

```
I need to build a project tracking system for Contoso. Here are the requirements:

- External clients view their project status, milestones, and documents through a React dashboard
- Internal project managers use an app to manage projects, tasks, and resource assignments
- Server-side business logic: auto-calculate project completion %, validate task date ranges, enforce budget limits
- Notifications when milestones are completed, escalations when tasks are overdue

Design the complete solution architecture and Dataverse data model. Cover:
1. App-type selection for each user group (with justification)
2. Dataverse table schemas with columns, types, and relationships
3. Security model (authentication for external users, roles for internal users)
4. Environment strategy (dev/test/prod)
5. Licensing implications

Cite which skill files you consulted for each decision.
```

**What to evaluate:** Does the agent select Code App for external + MDA for internal? Does it design proper tables with relationships? Does it address auth correctly for both user groups? Does it cite skill files?

---

## Test Case 2: Build Plan

**Paste after the context block:**

```
Based on the Contoso Project Tracker architecture:
- Code App (React + TypeScript) for external client dashboard
- Model-Driven App for internal project management
- C# Plugins for business logic (completion %, date validation, budget enforcement)
- Power Automate flows for milestone notifications and overdue task escalation
- A Copilot Studio agent for project managers to ask about project status

Create a detailed build plan covering:
1. Code App setup and development workflow — which CLI tools, what commands, how to wire data sources
2. Plugin development — patterns, interfaces, testing strategy with specific test frameworks
3. Flow design — triggers, connectors, and why flows (not plugins) for notifications
4. Copilot Studio agent setup — how it accesses Dataverse data, which integration pattern
5. Whether generative pages would add value to the Model-Driven App

For each component, specify tools, commands, patterns, and testing approach. Cite skill files.
```

**What to evaluate:** Does the agent recommend npm CLI for Code App? Does it specify FakeXrmEasy for plugin testing? Does it correctly choose flows over plugins for notifications? Does it reference MCP for the Copilot agent? Does it know generative pages are now globally GA?

---

## Test Case 3: ALM & Governance

**Paste after the context block:**

```
Design the complete ALM pipeline for the Contoso Project Tracker. We use Azure DevOps for repos and pipelines. Cover:

1. Git branching strategy and how solution source is managed
2. CI/CD pipeline stages from dev to prod (include YAML structure or stage descriptions)
3. Automated testing integration — Solution Checker, plugin unit tests, Code App tests
4. Governance setup — CoE Starter Kit modules, DLP policy design
5. Environment variable and connection reference handling across environments

Cite skill files for every recommendation.
```

**What to evaluate:** Does the agent design a proper multi-stage ADO pipeline? Does it reference deploy-from-Git as a Wave 1 future option? Does it recommend CoE Starter Kit with the right modules? Does it map testing tools to component types correctly? Does it mention Agentic CoE?

---

## Test Case 4: Wave 1 Opportunities

**Paste after the context block:**

```
Review the Contoso Project Tracker solution design:
- Code App (React + TypeScript) for external clients
- Model-Driven App for internal staff
- C# Plugins for business logic
- Power Automate flows for notifications
- Copilot Studio agent with Dataverse access
- Azure DevOps CI/CD pipeline

Identify every place where a 2026 Wave 1 feature could improve, simplify, or future-proof this solution. For each opportunity, state:
1. Feature name
2. Current status (Preview or GA) with expected dates
3. Specific benefit to this solution
4. Risk of adopting it now vs waiting for GA
5. The skill file where you found the information

Be thorough — check every skill area, not just the obvious ones.
```

**What to evaluate:** Does the agent find at least 8-10 Wave 1 features? Does it correctly distinguish Preview from GA? Does it give appropriate risk guidance (don't use Preview in production)? Does it cite skill file paths? The key ones to look for:
- CLI connector discovery (code-apps)
- Deploy from Git + YAML format (alm)
- MCP workflow tools + custom MCP servers (copilot-studio)
- Dataverse Management MCP (dataverse-mcp)
- Generative pages global GA (model-driven-apps)
- Agentic CoE (governance)
- Desktop flow version control (power-automate) — if RPA is relevant
- Canvas online mode (canvas-apps) — may not be directly relevant but shows thoroughness

---

## Grading Notes

- **Pass:** Agent reads relevant skill files, makes correct decisions, cites sources, produces workflow-log.md
- **Partial:** Agent makes correct decisions but misses some skill files or doesn't cite sources
- **Fail:** Agent makes wrong architectural choices, ignores repo skills, or hallucinates features not in the skill files

The detailed expectations for automated grading are in `full-stack-scenario.json`.
