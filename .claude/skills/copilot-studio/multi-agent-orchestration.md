# Copilot Studio — Multi-Agent Orchestration

## Overview

Multi-agent orchestration enables multiple Copilot Studio agents to collaborate on complex
tasks. Agents can delegate work to specialized sub-agents, connect across organizational
boundaries, and coordinate responses through defined protocols.

---

## Child Agents

A child agent is a lightweight, specialized subagent that exists within the context of the
main agent. The parent delegates a specific task, the child processes it, and control returns
to the parent's conversation flow.

### How Child Agents Work

1. Parent agent receives a user query it cannot fully handle
2. Parent identifies the appropriate child agent based on topic or intent
3. Parent invokes the child agent, passing context variables
4. Child agent executes its topics and returns a result
5. Parent agent resumes with the returned data

### Configuration

```
Parent Agent Setup:
  1. Open the parent agent in Copilot Studio
  2. In a topic, add a "Transfer to agent" node
  3. Select the child agent from available agents in the environment
  4. Map input variables (context to pass)
  5. Map output variables (results to receive)
  6. Continue parent topic flow after return
```

### Design Guidelines

| Guideline | Rationale |
|---|---|
| Each child agent handles one domain | Clear responsibility boundaries |
| Define explicit input/output contracts | Predictable data exchange |
| Set timeout behavior on the parent | Handle cases where child agent hangs |
| Child agents should be stateless | Parent manages conversation state |
| Keep nesting depth to 2 levels max | Deeper nesting is hard to debug and monitor |

---

## Connected Agents

Connected agents are independently published agents that the main agent can delegate to.
This is a broader category that includes several agent types and protocols.

### Connected Agent Types

| Type | Protocol | Status | Use Case |
|---|---|---|---|
| **Other Copilot Studio agents** | Native (same environment) | GA | Same-environment delegation between published agents |
| **Microsoft Foundry agents** | Native | Preview | Agents built in Azure AI Foundry |
| **Fabric Data agents** | Native | Preview | Data-focused agents from Microsoft Fabric |
| **Microsoft 365 Agents SDK agents** | Activity Protocol | Preview | Agents built with the M365 Agents SDK |
| **A2A protocol agents** | Agent-to-Agent (A2A) | Preview | External agents on any framework, cross-org |

### Production Readiness

| Type | Status | Production-Safe? | Notes |
|---|---|---|---|
| Child agents | GA | Yes | Recommended for same-environment delegation |
| Copilot Studio agents (same env) | GA | Yes | Must be published before connecting |
| Microsoft Foundry agents | Preview | No | Breaking changes possible |
| Fabric Data agents | Preview | No | Breaking changes possible |
| M365 Agents SDK agents | Preview | No | Uses Activity Protocol, not A2A |
| A2A protocol agents | Preview | No | For external/cross-org agents only |

**For production multi-agent solutions, use only child agents and same-environment Copilot Studio agent connections until other types reach GA.** Preview connectors may have breaking changes between updates.

### A2A Protocol (for External Agents)

The A2A protocol is specifically for connecting to agents built outside of Copilot Studio,
potentially across organizational boundaries.

**Key concepts:**

| Concept | Description |
|---|---|
| **Agent Card** | JSON metadata at `/.well-known/agent.json` describing the agent's name, description, and endpoint |
| **Message** | Structured communication using `message/send` method with `contextId` for conversation threading |
| **Notifications** | System and content notifications for async operations |

**Communication flow:**

```
Copilot Studio Agent                    External A2A Agent
  |                                        |
  |--- message/send (contextId, content) ->|
  |                                        |--- Process message
  |<-- Response (content parts) ---------- |
  |                                        |
  |--- message/send (follow-up) --------->|
  |<-- Response -------------------------  |
```

The endpoint format is: `<base-url>/a2a/<agent>/v1/message:stream`

### Connected Agent Setup

**For Copilot Studio agents (same environment):**
1. Publish the target agent in Copilot Studio
2. In the calling agent, add a connected agent reference
3. The calling agent autonomously delegates based on the connected agent's description
4. Alternatively, use an explicit redirect from a topic node

**For A2A protocol agents (external):**
1. Provide the external agent's endpoint URL (Copilot Studio auto-discovers the Agent Card from `/.well-known/agent.json`)
2. Configure authentication (None, API key, or OAuth 2.0)
3. The orchestrator uses the agent's name and description to decide when to delegate
4. Handle responses and error cases in the calling agent's topic flow

**Note:** Connected Copilot Studio agents in the same environment do NOT use A2A. A2A is specifically for external agents built on non-Copilot-Studio frameworks. For agents built with the Microsoft 365 Agents SDK, use the Activity Protocol instead.

---

## Agent Delegation Patterns

### When to Split vs Consolidate

| Split into multiple agents when... | Consolidate into one agent when... |
|---|---|
| Distinct domains with separate knowledge | Single domain with unified knowledge |
| Different teams own different agent areas | One team owns the entire agent |
| Security boundaries require data isolation | All data is accessible to all users |
| Independent release cycles needed | Single release cycle is acceptable |
| Agent complexity exceeds maintainability | Total topic count is manageable (<50) |

### Delegation Decision Framework

```
User request arrives at parent agent
  |
  Can the parent answer directly? → Yes → Respond
  |
  No → Is the domain covered by a child agent?
         → Yes → Delegate to child agent (inline)
         |
         No → Is the domain covered by a connected agent?
                → Yes → Delegate to connected agent (same env or external via A2A)
                |
                No → Fallback / Escalate to human
```

---

## Topology Design

### Hub-and-Spoke

```
              [IT Agent]
                  |
[HR Agent] -- [Central Agent] -- [Finance Agent]
                  |
            [Facilities Agent]
```

- Central agent acts as router/dispatcher
- Spoke agents are embedded or connected
- Best for: enterprise service desk with distinct departments
- Drawback: central agent is a single point of failure

### Mesh

```
[Agent A] <---> [Agent B]
    ^               ^
    |               |
    v               v
[Agent C] <---> [Agent D]
```

- Agents communicate peer-to-peer
- Best for: cross-organization collaboration
- Drawback: complex to monitor and debug

### Hierarchical

```
[Executive Agent]
    |         |
[Regional A] [Regional B]
  |    |       |    |
[L1]  [L2]  [L1]  [L2]
```

- Multi-level delegation chain
- Best for: large organizations with geographic or functional hierarchy
- Drawback: latency increases with depth

---

## Security

### Authentication Chain

When Agent A calls Agent B, authentication must be handled at each boundary:

| Pattern | Description | Use Case |
|---|---|---|
| **Pass-through** | User's token forwarded to downstream agent | Same tenant, user context needed |
| **Service-to-service** | Agent A authenticates as itself to Agent B | Cross-tenant, no user context needed |
| **Token exchange** | User token exchanged for downstream token | Cross-tenant, user context needed |

### Data Isolation

- Each agent should only access data within its security boundary
- Do not pass sensitive data in plain text between agents — use references (IDs)
- Connected agents across tenants must not share authentication tokens
- Log all inter-agent data exchange for audit compliance
- Apply DLP policies to each agent independently

---

## Monitoring

### Tracking Conversation Flow Across Agents

| Metric | Description | Where to Monitor |
|---|---|---|
| **Delegation count** | How often the parent delegates to sub-agents | Parent agent analytics |
| **Delegation success rate** | Percentage of successful delegations | Parent agent analytics |
| **Round-trip latency** | Time from delegation to response | Application Insights (custom telemetry) |
| **Cross-agent errors** | Failures in inter-agent communication | Agent error logs, A2A task status |
| **Conversation continuity** | User experience across agent handoffs | Conversation transcripts |

### Correlation

- Use a shared **conversation ID** across all agents in a delegation chain
- Pass correlation IDs via input variables (embedded) or task metadata (A2A)
- Aggregate logs in Application Insights using the correlation ID for end-to-end tracing

---

## Anti-Patterns

- No clear domain boundary between agents (overlapping responsibilities cause routing confusion)
- Passing unnecessary data to child agents (send only relevant context variables; note that connected Copilot Studio agents pass conversation history by default — opt out if not needed)
- No timeout or error handling on inter-agent calls
- Hub agent with business logic (hub should route only, not process)
- Deep nesting beyond 2 levels (latency and debugging become prohibitive)
- No correlation ID across agent boundaries (impossible to trace issues)
- Connected agents without authentication (security vulnerability)
- Sharing user tokens across tenant boundaries without token exchange
- No fallback when a downstream agent is unavailable
- Deploying multi-agent topology without end-to-end testing of the delegation chain
