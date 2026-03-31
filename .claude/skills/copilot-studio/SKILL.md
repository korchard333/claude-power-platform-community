---
name: copilot-studio
description: "Microsoft Copilot Studio agent building. Use when: creating Copilot agents,
  multi-agent orchestration, autonomous agents, MCP integration, knowledge sources,
  generative actions, Agent API for Power Pages, ALM for agents, testing agents."
---

# Skill: Microsoft Copilot Studio

## When to Use
Trigger when building, configuring, testing, deploying, or reviewing Copilot Studio agents
(formerly Power Virtual Agents) — including standalone agents, Copilot extensions,
autonomous agents, and multi-agent orchestrations.

## Agent Types

| Type | Description | Use Case |
|---|---|---|
| **Copilot agent** | Custom agent with topics + generative AI | Customer support, employee self-service |
| **Copilot extension** | Extends Microsoft 365 Copilot | Enterprise Copilot with custom knowledge |
| **Autonomous agent** | Event-driven, runs without user interaction | Monitoring, proactive notifications |
| **Connected agent** | Agent-to-agent via A2A protocol | Cross-domain orchestration |
| **Embedded agent** | Agent embedded within another agent | Specialized sub-agent for delegation |

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Topics & Conversation Authoring](topics-authoring.md)** — topic types, trigger phrases,
  conversation flow design, variables, conditions, topic management
- **[Knowledge Sources](knowledge-sources.md)** — Dataverse, SharePoint, websites, files,
  Graph, configuration, content moderation, grounding
- **[Multi-Agent Orchestration](multi-agent-orchestration.md)** — embedded agents, connected agents,
  A2A protocol, agent delegation, cross-domain patterns
- **[Autonomous Agents](autonomous-agents.md)** — Agent Flows in Power Automate, generative actions,
  event-driven triggers, Automation Center governance, computer use (Wave 1 2026)
- **[MCP Integration](mcp-integration.md)** — MCP as tool pattern in Copilot Studio, connector
  infrastructure (VNet, DLP, auth), when MCP vs connector actions
- **[Channels & Deployment](channels-deployment.md)** — Teams, website, mobile, Omnichannel,
  Agent API for Power Pages, authentication per channel
- **[ALM, Governance & Testing](alm-governance-testing.md)** — solution packaging, environment
  promotion, adversarial testing, analytics, Copilot tuning

## Anti-Patterns

- No fallback topic configured (agent goes silent on unrecognized input)
- Generative answers enabled without content moderation
- No escalation path to a human agent
- Hardcoded values in topic actions instead of environment variables
- Agents outside of solutions (can't be promoted via ALM)
- No adversarial/prompt injection testing before deployment
- Using authentication-required actions without configuring agent authentication
- Overly broad knowledge sources (agent responds to off-topic queries)
- No analytics monitoring after deployment (can't measure agent effectiveness)
- Using MCP tools for schema creation instead of direct Web API (MCP is for reads/queries)
- Multi-agent orchestration without defined security boundaries between agents
- Autonomous agents without human-in-the-loop gates for destructive actions

## Related Skills
- `power-automate` — Agent Flows, plugin actions via flows
- `azure-openai` — BYOM, AI architecture decisions
- `dataverse` — Structured knowledge sources
- `security` — Agent authentication configuration
- `alm` — Solution packaging for agent promotion
- `power-pages` — Agent API for custom chat experiences
