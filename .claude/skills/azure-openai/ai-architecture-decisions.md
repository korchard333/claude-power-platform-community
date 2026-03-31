# AI Architecture Decisions

## Overview

Power Platform offers multiple AI integration points — from zero-code AI Builder prompts to full Azure AI Foundry deployments. Choosing the right approach depends on the use case complexity, required control, licensing model, and operational maturity.

---

## Decision Tree

```
What kind of AI task?
│
├── Conversational agent (chat with users)
│   ├── Internal employees only → Copilot Studio agent (standard or BYOM)
│   ├── External customers → Copilot Studio agent + Power Pages / Teams channel
│   └── Multi-agent orchestration needed → Copilot Studio + A2A protocol
│
├── Automated processing (no user interaction)
│   ├── Simple classification/extraction → AI Builder prompt in flow
│   ├── Complex reasoning with tools → Agent Flow (Power Automate)
│   └── High-volume batch processing → Azure Function + AOAI direct
│
├── App-embedded AI (within a UI)
│   ├── Canvas App → AI Builder prompt or flow-backed AI
│   ├── Code App → Azure Function + AOAI (server-side)
│   └── Model-Driven App → Custom API + plugin + AOAI
│
└── Custom AI pipeline
    ├── Fine-tuned model needed → Azure AI Foundry deployment
    ├── RAG with custom data → Azure AI Search + AOAI
    └── Multi-model orchestration → Azure AI Foundry agent or custom code
```

---

## Comparison Matrix

| Approach | Complexity | Control | Licensing | Best For |
|---|---|---|---|---|
| **AI Builder prompts** | Low | Low | Copilot Credits / AI Builder credits | Simple text tasks in flows/apps |
| **Copilot Studio (standard)** | Low-Medium | Medium | Copilot Studio license (Copilot Credits) | Conversational agents with knowledge |
| **Copilot Studio (BYOM)** | Medium | High | Copilot Studio + AOAI deployment | Domain-specific agents |
| **Agent Flows** | Medium | Medium | Power Automate Premium + Copilot Credits | AI-driven automation |
| **Power Automate + HTTP to AOAI** | Medium | High | Power Automate Premium + AOAI | Flow-based AI with full parameter control |
| **Azure Function + AOAI** | High | Highest | Azure subscription + AOAI | Code Apps, streaming, high volume |
| **Azure AI Foundry agent** | High | Highest | Azure subscription + AOAI | Complex multi-tool agents, custom RAG |

---

## When to Use Each Approach

### AI Builder Prompts

**Use when:**
- Simple text generation, classification, or extraction
- Maker (non-developer) is building the solution
- Low volume (< 1000 calls/day)
- No need for custom models or fine-tuning
- Quick time-to-value matters

**Don't use when:**
- Need streaming responses
- Need function calling / structured tools
- Need fine-tuned or custom models
- High volume with tight latency requirements

### Copilot Studio Agent (Standard)

**Use when:**
- Building a conversational AI experience
- Knowledge sources are in SharePoint, Dataverse, or web
- Need multi-channel deployment (Teams, web, Power Pages)
- Want low-code agent authoring
- Need built-in analytics and governance

**Don't use when:**
- No user interaction needed (use Agent Flow instead)
- Need custom model for response generation (use BYOM)
- Need to process > 100K documents (use Azure AI Search + RAG)

### Agent Flows (Power Automate)

**Use when:**
- Event-driven AI automation (Dataverse trigger, email, schedule)
- AI needs to dynamically select which actions to take
- Want AI reasoning with Power Automate connector ecosystem
- Need human-in-the-loop approval gates

**Don't use when:**
- Need real-time chat interface (use Copilot Studio)
- Simple deterministic logic (use classic cloud flow)
- Need sub-second latency (Agent Flows have AI reasoning overhead)

### Azure Function + AOAI Direct

**Use when:**
- Code App needs AI features
- Need streaming responses
- High volume / low latency requirements
- Need managed identity (no API key management)
- Need custom prompt engineering with full parameter control
- Need to integrate with custom RAG pipeline

**Don't use when:**
- Maker-built solution (too complex for low-code)
- Simple classification that AI Builder can handle
- No Azure subscription available

### Azure AI Foundry Agent

**Use when:**
- Complex multi-tool agent with custom tools
- Need file search, code interpreter, or custom RAG
- Enterprise AI application with production SLA requirements
- Need full control over agent behavior and tool selection
- Building a pure Azure solution (no Power Platform dependency)

**Don't use when:**
- Agent needs Power Platform connectors (use Copilot Studio)
- Low-code team without Azure expertise
- Quick prototype or PoC (faster with Copilot Studio)

---

## Licensing Implications

| Approach | Power Platform License | Azure Cost | AI Credits |
|---|---|---|---|
| AI Builder prompts | Power Apps/Automate Premium | None | Copilot Credits or AI Builder credits |
| Copilot Studio | Copilot Studio tenant license | None | Copilot Credits (25K/month base) |
| Agent Flows | Power Automate Premium | None | Copilot Credits |
| HTTP to AOAI (in flow) | Power Automate Premium | AOAI token cost | None (direct Azure billing) |
| Azure Function + AOAI | None (or per-app for Code App) | Function + AOAI cost | None (direct Azure billing) |
| AI Foundry agent | None | Full Azure cost | None (direct Azure billing) |

### Cost Comparison (Illustrative)

```
Scenario: 10,000 AI classification calls per month

AI Builder prompts:
  10,000 calls × Copilot Credit rate = ~X Copilot Credits/month
  (Included in Copilot Studio base, or additional packs)

HTTP to AOAI (GPT-4o-mini):
  10,000 calls × ~300 tokens avg = 3M tokens
  Input: 2M tokens × $0.15/1M = $0.30
  Output: 1M tokens × $0.60/1M = $0.60
  Total: ~$0.90/month (very cheap at this scale)

Azure Function + AOAI:
  Same AOAI cost + Azure Function execution (~$5/month at this scale)
  Total: ~$6/month
```

> **Takeaway:** Direct AOAI is often cheaper at scale than Copilot Credits, but requires more setup and Azure expertise.

---

## Data Residency Considerations

| Approach | Data Location | Control |
|---|---|---|
| AI Builder | Processed in your PP environment's geo | Follows PP data residency |
| Copilot Studio | Agent's environment geo + AI processing geo | Limited control over AI processing location |
| AOAI direct | Your chosen Azure region | Full control — deploy AOAI in required region |
| AI Foundry agent | Your chosen Azure region | Full control |

**For regulated industries:** Direct AOAI deployment in a specific Azure region gives the most control over data residency. AI Builder and Copilot Studio process data in Microsoft-managed infrastructure.

---

## Hybrid Patterns

### Pattern: Copilot Studio + AOAI Fallback

```
Copilot Studio agent (standard model) for general queries
  ├── Knowledge sources handle 80% of questions
  └── For specialized analysis:
      Topic → Call Power Automate flow → HTTP to AOAI (custom prompt)
      → Return structured result to agent → Present to user
```

### Pattern: AI Builder for Triage + AOAI for Deep Analysis

```
Flow trigger: New support ticket
  ↓
AI Builder prompt: Quick classification (fast, cheap)
  ↓
If complex case:
  HTTP to AOAI: Deep analysis with full context (more expensive, more capable)
  ↓
Update ticket with AI analysis
```

### Pattern: Code App with Multi-Model

```
Code App → Azure Function
  ├── Fast model (GPT-4o-mini) for autocomplete suggestions
  ├── Capable model (GPT-4o) for detailed analysis
  └── Specialized model (fine-tuned) for domain extraction
```

---

## Migration Paths

| From | To | When | How |
|---|---|---|---|
| AI Builder prompt | AOAI direct | Need more control, higher volume | Extract prompt, call via HTTP connector |
| Copilot Studio standard | Copilot Studio BYOM | Domain accuracy insufficient | Deploy custom model, configure BYOM |
| Classic flow + AI | Agent Flow | Need dynamic action selection | Recreate as Agent Flow with action library |
| Power Automate + AOAI | Azure Function + AOAI | Need streaming, higher performance | Move AI logic to Function, call from app |
| AI Foundry agent | Copilot Studio agent | Need Power Platform integration | Rebuild with Copilot Studio + connectors |

---

## Anti-Patterns

- Using AOAI for tasks that don't need AI (simple lookups, deterministic logic)
- AI Builder for everything (limited control, limited models)
- Building a custom agent framework when Copilot Studio suffices
- Ignoring AI Builder's simplicity for simple use cases (over-engineering)
- No cost modeling before choosing an approach (unexpected bills)
- Choosing based on technology preference rather than use case fit
- Not planning for model upgrades (GPT versions change, prompts may need tuning)
- Mixing multiple AI approaches without a clear rationale (operational complexity)
- Direct AOAI calls from Canvas Apps (key exposure, no server-side intermediary)
- No fallback strategy when AI is unavailable (user experience degrades to error)
