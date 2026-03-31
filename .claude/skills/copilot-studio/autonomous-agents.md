# Copilot Studio — Autonomous Agents

## Overview

Autonomous agents operate without direct user interaction. They are event-driven, executing
tasks in response to triggers such as data changes, schedules, or external events. They
combine Copilot Studio's AI reasoning with Power Automate's execution engine.

---

## Agent Flows

Agent Flows are a Power Automate flow type designed for autonomous agent automation. They are
**deterministic** — the same input always produces the same output. They execute actions
following a rule-based path defined by the author (or generated from natural language at
design time). The AI-driven action selection (generative orchestration) happens at the
**Copilot Studio agent level**, not within the Agent Flow itself.

### Agent Flow vs Classic Flow

| Aspect | Classic Cloud Flow | Agent Flow |
|---|---|---|
| **Trigger model** | User action, event, or scheduled | Event-driven, scheduled, manual, or agent-invoked |
| **Execution model** | Deterministic | Deterministic (same input → same output) |
| **Action selection** | Explicit (author defines each step) | Explicit (authored or AI-generated at design time) |
| **AI capabilities** | Limited (AI Builder actions) | Can include "AI capabilities" action steps (run prompts) |
| **Governance** | Flow run history | Automation Center — purpose-built for agent oversight |
| **Best for** | Predictable, repeatable processes | Agent-invoked automation with governance requirements |
| **Capacity** | Power Automate license | Consumes Copilot Studio capacity per action executed |

**Important distinction:** Generative orchestration (where AI dynamically selects which
tool/action to call) is a Copilot Studio feature. The agent decides which Agent Flow to
invoke. The Agent Flow itself then runs deterministically.

### Creating an Agent Flow

```
1. Open Power Automate → Agent Flows
2. Choose authoring method:
   a. Describe the flow in natural language → AI generates the flow steps
   b. Use the visual designer with drag-and-drop components
3. Define the trigger (Dataverse event, schedule, webhook, or "When an agent calls the flow")
4. Add action steps (connectors, Dataverse operations, AI capabilities)
5. Configure approval gates and guardrails as needed
6. Test with sample trigger events
7. Publish and monitor in Automation Center
```

### Agent Flow Example — Support Case Triage

```
Trigger: When a record is created in Dataverse (contoso_supportcase)
Filter: contoso_priority eq 'High'

Steps:
  1. Read case record details (Dataverse)
  2. Search knowledge base for matching articles (SharePoint)
  3. Run AI prompt: "Draft a response based on case description and KB articles"
  4. Update case record with draft response (Dataverse)
  5. Assign case to team based on category (Dataverse)
  6. Post notification to support channel (Teams)
  7. Respond to agent with case status

Guardrails:
  - Require approval before sending external emails
  - Respond to the agent within the 100-second action limit
  - Do not delete or close cases automatically
```

### Key Constraint: 100-Second Action Limit

When an Agent Flow is invoked by a Copilot Studio agent (via "When an agent calls the flow"
trigger), the flow must respond within **100 seconds**. Design flows to complete within this
limit. For longer processes, use a pattern where the flow starts async work and returns a
tracking ID, with a separate flow to check status.

---

## Generative Orchestration (Copilot Studio Layer)

Generative orchestration is a **Copilot Studio** feature (not an Agent Flow feature) that
allows the agent to dynamically select which tools, connectors, or Agent Flows to invoke
at runtime based on context. This requires enabling **Generative Orchestration** in the
agent's settings.

### How Generative Orchestration Works

1. Agent receives a trigger event or user message with context
2. Copilot Studio's orchestration layer evaluates the agent's instructions and available tools
3. AI selects the most appropriate tool (Agent Flow, connector action, plugin) based on descriptions
4. The selected tool executes deterministically with parameters chosen by the AI
5. AI evaluates the result and decides whether to call another tool or complete

**Key distinction:** The AI reasoning happens at the Copilot Studio orchestration layer.
Agent Flows and other tools execute deterministically once invoked.

### Tool Types Available to the Agent

| Tool Source | Description | Setup |
|---|---|---|
| **Agent Flows** | Power Automate flows with "When an agent calls the flow" trigger | Create in Power Automate, associate with agent |
| **Power Automate connectors** | 1400+ prebuilt connectors | Enable in agent's tool library |
| **Custom connectors** | Organization-specific APIs | Register connector, add to library |
| **Dataverse operations** | CRUD on Dataverse tables | Enable specific tables and operations |
| **AI Builder prompts** | GPT prompts as callable actions | Create prompt, publish as action |

### Orchestration Controls

| Control | Description |
|---|---|
| **Tool allow-list** | Only listed tools can be selected by the AI |
| **Action descriptions** | Clear descriptions help the AI select the right tool — be specific |
| **Fewer than 15 consecutive actions** | Microsoft recommends limiting to <15 actions/topics for reliable execution |
| **Confirmation gates** | Require human approval before specific action types |

---

## Event Triggers

### Trigger Types

| Trigger | Description | Use Case |
|---|---|---|
| **Dataverse record change** | Row created, updated, or deleted | Case created, order status changed |
| **Scheduled** | Time-based (recurring or one-time) | Daily report generation, weekly review |
| **External webhook** | HTTP POST from external system | Third-party system notification |
| **Email received** | Incoming email to monitored mailbox | Auto-triage support emails |
| **Teams message** | Message in monitored channel | Team alerts, keyword monitoring |
| **Power Automate trigger** | Any Power Automate trigger feeds into Agent Flow | Extend any existing trigger pattern |

### Trigger Configuration

```
Dataverse trigger example:
  Table: Case (incident)
  Event: Record created
  Filter: priority = 1 (high)
  Scope: Organization (all records)

Schedule trigger example:
  Frequency: Daily
  Time: 08:00 UTC
  Time zone: UTC
  Days: Monday through Friday
```

### Trigger Best Practices

- Filter triggers at the source to reduce unnecessary agent invocations
- Use the narrowest scope possible (e.g., specific table, specific priority)
- Avoid triggers on high-volume tables without filters (cost and performance impact)
- Test trigger conditions with representative data before enabling in production

---

## Automation Center

The Automation Center is the governance dashboard for managing autonomous agents across
the organization.

### Capabilities

| Feature | Description |
|---|---|
| **Agent inventory** | View all autonomous agents across environments |
| **Execution history** | Full audit trail of every agent run |
| **Performance metrics** | Success rate, execution time, action count per run |
| **Error dashboard** | Failed runs with root cause details |
| **Approval queue** | Pending human-in-the-loop approvals |
| **Cost tracking** | AI consumption and connector usage per agent |
| **Policy enforcement** | DLP and governance policies applied to agents |

### Access Roles

| Role | Permissions |
|---|---|
| **Agent owner** | Full control over owned agents |
| **Automation admin** | View and manage all agents in tenant |
| **Business approver** | Approve/reject actions in approval queue |
| **Viewer** | Read-only access to dashboards and history |

---

## Guardrails

### Human-in-the-Loop Patterns

| Pattern | Description | When to Use |
|---|---|---|
| **Pre-action approval** | Agent pauses before executing, sends approval request | Destructive or irreversible actions |
| **Post-action review** | Agent executes, flags result for human review | Non-critical actions that need quality check |
| **Escalation on uncertainty** | Agent escalates when confidence is below threshold | Ambiguous situations, edge cases |
| **Batch approval** | Agent queues multiple actions, human approves batch | High-volume but low-risk actions |

### Approval Gate Configuration

```
Action: Send external email
Gate type: Pre-action approval
Approver: Case manager (dynamic, based on case assignment)
Timeout: 4 hours
On timeout: Skip action, log as skipped
On reject: Log rejection, continue to next action

Action: Update customer record
Gate type: Post-action review
Reviewer: Data steward
Review window: 24 hours
On no review: Auto-approve (action already executed)
```

### Action Limits

| Limit | Purpose | Recommended Value |
|---|---|---|
| **Max actions per run** | Prevent runaway execution | 10-20 actions |
| **Max retries** | Prevent infinite retry loops | 3 retries per action |
| **Max execution time** | Prevent stuck agents | 30 minutes |
| **Max daily runs** | Cost and resource control | Based on expected volume |
| **Max concurrent runs** | Prevent resource contention | 5 concurrent |

---

## Monitoring and Alerting

### Key Metrics to Monitor

| Metric | Threshold for Alert | Action |
|---|---|---|
| **Failure rate** | > 10% of runs failing | Investigate error patterns |
| **Avg execution time** | > 2x baseline | Check for performance degradation |
| **Actions per run** | Approaching max limit | Review if agent is overcomplicating tasks |
| **Approval timeout rate** | > 20% of approvals timing out | Review approver availability |
| **Cost per run** | > budget threshold | Optimize action selection, reduce unnecessary calls |

### Alerting Setup

```
Application Insights integration:
  1. Enable diagnostic logging on the agent
  2. Configure custom metrics for agent execution
  3. Set alert rules on failure rate, latency, cost
  4. Route alerts to Teams channel or email

Automation Center:
  1. Navigate to Alerts in Automation Center
  2. Create alert rule (metric, threshold, action group)
  3. Assign notification recipients
```

---

## Computer Use (Wave 1 2026)

> **Preview (Wave 1 2026):** Agents can automate web and desktop applications using computer use capabilities — visual understanding + mouse/keyboard control.

| Factor | Computer Use (Copilot Studio) | Desktop Flows (Power Automate) |
|---|---|---|
| **Authoring** | Describe task in natural language | Record or build step-by-step |
| **Resilience to UI changes** | Higher — visual understanding adapts | Lower — selector-based |
| **Maturity** | Preview — do not use in production | GA — production-ready |
| **Best for** | Exploratory automation, frequently changing UIs | Stable, repeatable processes |

**Important:** Computer use is preview. Do not use for production workloads. Prefer desktop flows for anything requiring SLA guarantees.

---

## Anti-Patterns

- Autonomous agents without any human-in-the-loop gates (risk of unintended destructive actions)
- No execution budget or action limit (runaway agent consuming resources)
- Triggers on high-volume tables without filtering (thousands of unnecessary invocations)
- No monitoring or alerting after deployment (silent failures go undetected)
- Using autonomous agents for simple, deterministic workflows (overkill — use a classic flow)
- No approval gate on actions that modify external systems
- Agent with access to all connectors instead of a curated action library
- No timeout configuration (agent can run indefinitely)
- Deploying to production without testing with representative trigger events
- No cost tracking or budget alerts (unexpected consumption charges)
