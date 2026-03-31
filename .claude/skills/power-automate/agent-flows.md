# Power Automate — Agent Flows

Agent Flows are a Power Automate flow type designed for autonomous agent automation. They are **deterministic** — the same input always produces the same output, following a rule-based execution path. They can be orchestrated by Copilot Studio agents, triggered by events, or run on schedules. Agent Flows consume Copilot Studio capacity per action executed.

## What Are Agent Flows

| Aspect | Standard Cloud Flow | Agent Flow |
|---|---|---|
| **Triggered by** | Events, schedules, manual button | Events, schedules, webhooks, or agent invocation ("When an agent calls the flow") |
| **Execution model** | Deterministic | Deterministic (same input → same output) |
| **AI capabilities** | Limited (AI Builder actions) | Can include "AI capabilities" action steps (run prompts, analyze text) |
| **Human interaction** | Optional (approval steps) | Optional; human-in-the-loop added as guardrail |
| **Governance** | Flow run history, admin center | Automation Center — purpose-built for agent oversight |
| **Capacity** | Power Automate license | Copilot Studio capacity per action |

**Key clarification:** The AI-driven dynamic action selection (generative orchestration) happens at the **Copilot Studio agent level**, not within the Agent Flow. The agent decides *which* flow to call; the flow itself executes deterministically.

### When to Use Agent Flows

- A Copilot Studio agent needs to execute multi-step business processes as a tool
- You need Automation Center governance (limits, quotas, approval gates)
- The flow must respond to an agent within the 100-second action limit
- You want agent-specific capacity metering separate from Power Automate

### When NOT to Use Agent Flows

- The process has no agent involvement — use a standard cloud flow
- You need synchronous execution within a Dataverse transaction — use a plugin
- The flow takes longer than 100 seconds when agent-invoked — use async pattern with tracking

---

## AI Capabilities Within Agent Flows

Agent Flows can include **AI capabilities** action steps — such as running prompts, analyzing
text, or summarizing content — but the flow's overall execution remains deterministic. The
AI-driven dynamic tool selection (generative orchestration) happens at the Copilot Studio
agent level, not within the flow.

### AI Capabilities vs Generative Orchestration
```
Copilot Studio Agent (generative orchestration)
  ├── AI decides WHICH tool/flow to call ← This is generative
  └── Agent Flow executes (deterministic)
        ├── Step 1: Read record (Dataverse)
        ├── Step 2: Run AI prompt (AI capabilities) ← AI within a deterministic step
        ├── Step 3: Update record with AI output
        └── Step 4: Respond to agent
```

### Using AI Capabilities in Agent Flows
1. Add an "AI capabilities" action step in the flow designer
2. Select the capability type (run prompt, analyze text, summarize, etc.)
3. Configure inputs from previous flow steps
4. Use the AI output in subsequent deterministic steps

### Supported Connector Types
| Connector Type | Generative Action Support |
|---|---|
| Standard connectors | Supported |
| Premium connectors | Supported (license required) |
| Custom connectors | Supported (must have clear operation descriptions) |
| Dataverse native actions | Supported |
| HTTP connector (raw) | Not recommended — too generic for AI selection |

### When to Use Explicit Actions Instead
- The process is always the same steps in the same order
- Regulatory requirements demand a deterministic, auditable sequence
- The available actions are too similar for AI to reliably distinguish

---

## Event Triggers for Autonomous Agents

Agent flows support triggers that enable fully autonomous operation without human initiation.

| Trigger Type | Use Case | Configuration |
|---|---|---|
| **Dataverse record change** | React to new or updated rows | Set filtering attributes to limit trigger frequency |
| **Scheduled (recurrence)** | Periodic agent tasks (daily report, weekly cleanup) | Set frequency, time zone, start time |
| **External webhook** | External system notifies the agent | Register callback URL; validate incoming payload |
| **Manual (from Copilot Studio)** | Agent invokes flow as a plugin action | Configure input parameters matching agent context |

### Trigger Best Practices for Autonomous Flows
- Always set trigger conditions to prevent unnecessary agent runs
- Use filtering columns on Dataverse triggers — agents should not fire on every field change
- For scheduled triggers, stagger start times to avoid resource contention
- Webhook triggers must validate the caller (shared secret or Azure AD token)

---

## Automation Center

The Automation Center is the governance dashboard for managing autonomous agent flows.

### Core Capabilities
| Capability | Description |
|---|---|
| **Run monitoring** | View all agent flow runs — status, duration, actions taken |
| **Limits and quotas** | Set maximum runs per agent per day, maximum actions per run |
| **Access control** | Approve or revoke an agent's ability to execute specific flows |
| **Reporting** | Aggregate metrics — success rate, average run time, action counts |
| **Alerts** | Configure notifications for failures, quota breaches, anomalous behaviour |

### Setting Limits and Quotas
```
Automation Center → Agents → Select agent
  ├── Max runs per day: 100
  ├── Max actions per run: 25
  ├── Max parallel runs: 5
  └── Allowed connectors: Dataverse, SharePoint, Outlook
```

### Admin Controls
- Restrict which environments can host agent flows
- Require admin approval before new agent flows activate
- Enforce DLP policies on agent flow connectors
- View audit logs for all autonomous agent decisions
- Disable an agent immediately if anomalous behaviour is detected

---

## Guardrails and Human-in-the-Loop

Autonomous agents require guardrails to prevent unintended consequences.

### Approval Gates
```
Agent flow execution
  ├── Read operations (low risk) → Execute immediately
  ├── Create operations (medium risk) → Optional approval gate
  └── Update/Delete operations (high risk) → Require human approval
        ├── Send approval request to designated reviewer
        ├── Wait for approval (with timeout)
        └── If rejected or timed out: halt and notify agent
```

### Action Limits
| Limit Type | Purpose | Recommended Default |
|---|---|---|
| **Max actions per run** | Prevent runaway execution | Fewer than 15 consecutive actions for reliable execution |
| **Max runs per day** | Cap daily resource consumption | Set per business requirement |
| **Max cost per run** | Prevent expensive API call spirals | Set based on connector pricing |
| **Timeout** | Kill long-running autonomous flows | 30 minutes for most scenarios |

### Human Escalation Patterns
- Agent cannot determine the correct action with sufficient confidence — escalate
- Action would affect more records than a configured threshold — escalate
- Agent encounters an error it cannot recover from — escalate with context
- Escalation target: Teams channel, email, or Copilot Studio handoff to human agent

### Audit Trail
- Every action taken by an autonomous agent must be logged
- Log entries include: timestamp, action, target resource, input parameters, outcome
- Retain logs per organizational data retention policy
- Use Dataverse audit tables or a dedicated logging flow

### Content Moderation
- AI-generated outputs (emails, messages, documents) should pass content moderation
- Configure content filters in Copilot Studio before the agent sends outputs
- Block or flag outputs containing sensitive data, PII, or inappropriate content

---

## Integration with Copilot Studio

### Flow as an Agent Tool

Agent Flows use the trigger "When an agent calls the flow" and the action "Respond to the agent":

```
Copilot Studio agent
  └── Invokes Agent Flow: "Process Expense Report"
        ├── Trigger: "When an agent calls the flow"
        │     Input parameters: ExpenseId, EmployeeId, Amount, Category
        ├── Agent flow executes deterministically:
        │     Dataverse lookup → policy check → conditional approval
        └── Action: "Respond to the agent"
              Output: Status, ApprovalOutcome, PolicyViolations
```

**Constraint:** The flow must respond within the **100-second action limit** when invoked by an agent.

### Passing Context Between Agent and Flow
| Direction | Mechanism | Notes |
|---|---|---|
| Agent to flow | Input parameters | Define typed inputs — string, number, boolean, object |
| Flow to agent | Output parameters | Return structured data the agent can reason over |
| Shared state | Dataverse record | Both agent and flow read/write a common record |

### Error Handling in Agent-Triggered Flows
- Agent flows must return a structured error response, not just fail silently
- Include error code, message, and suggested recovery action in output parameters
- The Copilot Studio agent can use the error output to retry, escalate, or inform the user
- Configure the flow's scope-based try/catch to populate error outputs on failure

---

## Anti-Patterns

- **Autonomous agents without human-in-the-loop for destructive operations** — always require approval before delete, bulk update, or financial transactions
- **No action limits on generative actions** — unbounded AI tool use can lead to runaway execution and unexpected costs
- **Missing audit trail** — autonomous agent decisions must be logged for compliance and debugging
- **Agent flows outside of solutions** — cannot be governed via ALM, cannot be promoted across environments
- **Using agent flows when standard cloud flows suffice** — if the process is deterministic and no AI agent is involved, agent flows add unnecessary complexity
- **Skipping content moderation** — AI-generated outputs sent directly to end users without filtering risk inappropriate or inaccurate content
- **Overly broad generative action scope** — giving an agent access to every connector increases risk; restrict to the minimum set needed
