---
name: azure-openai
description: "Azure OpenAI and AI integration with Power Platform. Use when: Azure OpenAI, AOAI, AI Foundry, GPT, LLM, AI integration, BYOM, bring your own model, AI Builder prompts, structured output, AI architecture decisions, Copilot Studio custom models."
---

# Skill: Azure OpenAI Integration

## When to Use
Trigger when integrating Azure OpenAI (or AI Foundry models) with Power Platform — from Power Automate flows, Code Apps, Copilot Studio agents, or when making architecture decisions about which AI approach to use.

---

## Integration Patterns

| Pattern | Description | Best For |
|---|---|---|
| **AI Builder prompts** | Low-code GPT prompts in flows/apps | Simple text generation, classification, extraction |
| **Azure AI Foundry connector** | Power Automate connector to AOAI | Flow-based AI with premium connector |
| **HTTP connector to AOAI** | Direct REST calls to AOAI endpoint | Full control, streaming, advanced parameters |
| **Custom API + Azure Function** | Server-side AI calls exposed via Custom API | Code Apps, secure key management, streaming |
| **Copilot Studio BYOM** | Custom model for agent responses/prompts | Domain-specific agent behavior |
| **Copilot Studio generative actions** | AI selects actions dynamically | Context-dependent automation |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Power Automate + AI](power-automate-ai.md)** — AI Foundry connector in flows, HTTP connector to AOAI endpoints, prompt patterns, retry/fallback, structured output parsing, token limit management
- **[Code Apps + AI](code-apps-ai.md)** — AOAI from Code Apps via Custom API or Azure Function (never client-side keys), streaming responses, chat UI patterns, React hooks for AI calls
- **[Copilot Studio BYOM](copilot-studio-byom.md)** — Bring Your Own Model for prompts and response generation, AI Foundry model configuration, testing, monitoring token usage
- **[AI Architecture Decisions](ai-architecture-decisions.md)** — decision tree: Copilot Studio agent vs Azure AI Foundry agent vs Power Automate Agent Flow vs AI Builder vs direct AOAI, licensing implications, data residency

---

## Key Principles

1. **Never expose API keys client-side** — Code Apps and Canvas Apps must call AOAI via a server-side intermediary (Custom API, Azure Function, or Power Automate flow)
2. **Use managed identity** when possible — Azure Function with managed identity to AOAI is the most secure pattern
3. **AI Builder for simple, Foundry for complex** — AI Builder prompts are faster to build; direct AOAI is more flexible
4. **Monitor token consumption** — set up alerts on Azure OpenAI usage to prevent unexpected costs
5. **Structured output** — use JSON mode or function calling for parseable responses, not free-form text

---

## Anti-Patterns

- Exposing AOAI API keys in client-side code (Canvas/Code Apps)
- Using GPT for deterministic tasks that don't need AI (regex, simple lookups)
- No retry logic on AI calls (AOAI returns 429 under load)
- No token limit management (prompt + response exceeding model context window)
- Free-form text output when structured data is needed (use JSON mode)
- Using AI Builder for everything (limited control, limited models)
- No cost monitoring on AOAI deployment (token costs can spike unexpectedly)
- Calling AOAI from every flow run without caching (expensive for repetitive queries)
- Not testing with representative data (AI behavior varies with real-world input)

---

## Related Skills

- `copilot-studio` — Agent building, generative actions, knowledge sources
- `power-automate` — Flow integration with AI connectors
- `code-apps` — React UI patterns for AI features
- `licensing` — AI Builder credits, Copilot Credits, AOAI consumption costs
- `integration-patterns` — Azure Functions for server-side AI
