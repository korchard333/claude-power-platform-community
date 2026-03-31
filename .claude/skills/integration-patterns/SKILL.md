---
name: integration-patterns
description: "Power Platform integration patterns with Azure services. Use when: Service Bus, Azure Functions, webhook, event-driven, hybrid, on-premises gateway, VNet, integration pattern, Event Grid, Azure Relay, private endpoints, custom connectors to Azure."
---

# Skill: Integration Patterns

## When to Use
Trigger when designing integrations between Power Platform and Azure services — Service Bus messaging, Azure Functions for compute, Dataverse webhooks, Event Grid, on-premises gateway, VNet connectivity, or hybrid architectures.

---

## Integration Pattern Overview

| Pattern | Direction | Coupling | Best For |
|---|---|---|---|
| **Service Bus** | Dataverse → Azure (async) | Loose | Reliable messaging, event distribution |
| **Azure Functions** | Bidirectional | Medium | Custom compute, API intermediary |
| **Webhooks** | Dataverse → External (sync/async) | Loose | Real-time push notifications |
| **Event Grid** | Azure → Power Platform | Loose | Azure event-driven triggers |
| **On-premises gateway** | Power Platform → On-prem | Tight | Legacy system access |
| **VNet integration** | Power Platform ↔ Azure VNet | Tight | Network-level security |
| **Custom connectors** | Power Platform → Any API | Medium | REST API integration |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Service Bus](service-bus.md)** — Azure Service Bus integration, topic/queue patterns, Dataverse plugin to Service Bus, reliable messaging, dead-letter handling, session-aware processing
- **[Azure Functions](azure-functions.md)** — when to use Functions vs plugins vs flows, HTTP-triggered for Custom Connectors, Dataverse bindings, managed identity auth, cold start mitigation
- **[Webhooks & Events](webhooks-events.md)** — Dataverse webhooks (real-time push), webhook registration via API, payload schema, retry behavior, Event Grid integration
- **[Hybrid Connectivity](hybrid-connectivity.md)** — on-premises data gateway, Azure VNet integration, private endpoints for Dataverse, Azure Relay, security considerations

---

## Decision Table: Which Integration Pattern?

| Requirement | Pattern | Why |
|---|---|---|
| Reliable async messaging | **Service Bus** | Guaranteed delivery, dead-letter, retry |
| Real-time event notification | **Webhook** | Immediate push on data change |
| Custom compute (validation, transformation) | **Azure Function** | Serverless, scalable, any language |
| Legacy on-prem database access | **On-prem gateway** | Bridge to SQL, Oracle, SAP |
| Network-isolated Azure resources | **VNet integration** | Private endpoint access |
| Fan-out to multiple subscribers | **Service Bus topics** or **Event Grid** | One event, many consumers |
| Simple REST API call | **Custom connector** | Low-code, reusable |
| High-volume batch processing | **Azure Function** + **Service Bus** | Decouple producer from consumer |

---

## Anti-Patterns

- Synchronous HTTP calls in Dataverse plugins to external APIs (2-minute timeout, blocks user)
- On-premises gateway for everything (single point of failure, bottleneck)
- No dead-letter handling on Service Bus (lost messages go unnoticed)
- Webhook without retry-aware endpoint (missed events)
- Azure Functions with long cold starts on critical paths (user-facing latency)
- Tight coupling between Dataverse and external systems (breaks when external system changes)
- No monitoring on integration points (failures go undetected)
- VNet integration without private endpoints (traffic still goes over public internet)

---

## Related Skills

- `plugins` — Dataverse plugins that trigger integrations
- `power-automate` — Flow-based integrations with connectors
- `azure-openai` — Azure Functions as AI intermediary
- `custom-connectors` — Custom connector creation for APIs
- `security` — Authentication for external integrations
