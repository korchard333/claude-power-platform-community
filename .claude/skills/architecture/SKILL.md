---
name: architecture
description: "Power Platform Solution Architecture. Use when: selecting app type (Code App vs Canvas vs Model-Driven), designing solution structure, environment strategy, integration patterns, security architecture, DLP policies, capacity planning, Architecture Decision Records (ADRs)."
---

# Skill: Power Platform Solution Architecture

## When to Use
Trigger when making design decisions: app type selection, solution structure, integration patterns, environment strategy, security model design.

---

## App Type Selection Matrix

| Factor | Code App | Canvas App | Model-Driven App |
|---|---|---|---|
| UI flexibility | Full React control | Pixel-level low-code | Form/view-driven |
| Data source | Connectors via SDK | Any connector | Dataverse only |
| Developer profile | Pro-dev (React/TS) | Citizen dev / maker | Functional consultant |
| Complex custom UI | Best choice | Possible but painful | Limited |
| Standard CRUD | Overkill | Good | Best choice |
| Offline | No | Limited | No |
| Mobile | No (not supported) | Yes | Yes |
| Licensing | Premium required | Standard or Premium | Premium |
| ALM maturity | Git-based, no Solution Packager | Solution-based, canvas unpack | Solution-based, full ALM |

**Decision rules:**
- Dataverse data + standard CRUD + business process → **Model-Driven App**
- Custom UX + multiple data sources + mobile → **Canvas App**
- Complex interactive UI + pro-dev team + TypeScript expertise → **Code App**
- Rapid AI-generated custom page within MDA → **Generative Page** (GA)
- Combine: Code App for complex UI module, Model-Driven for admin/config

---

## Solution Architecture Patterns

### Single Solution (Prototypes / Small Apps)
```
ContosoApp
├── Code App / Canvas App
├── Flows
├── Tables
├── Security Roles
└── Environment Variables
```
Use when: single team, <5 components, no cross-solution dependencies.

### Layered Solutions (Enterprise)
```
ContosoShared              ← Shared tables, security roles, env variables, global option sets
  ↑ depends on
ContosoCore                ← Core business logic, shared flows, custom APIs
  ↑ depends on
ContosoHR                  ← HR-specific app, flows, and components
ContosoFinance             ← Finance-specific app, flows, and components
```

**Rules:**
- Max 3-4 layers — deeper becomes unmaintainable
- Shared → Core → Domain prevents circular dependencies
- Each solution has its own publisher prefix
- Environment variables and connection references live in the Shared layer

---

## Environment Strategy

| Environment | Purpose | Solution Type | Who Has Access |
|---|---|---|---|
| Dev | Build and configure | Unmanaged | Makers, developers |
| Test/QA | Integration testing | Managed | Testers, QA team |
| UAT | User acceptance testing | Managed | Business users, stakeholders |
| Production | Live operations | Managed | End users |
| Sandbox | Experimentation, training | Managed or Unmanaged | Varies |

**Rules:**
- NEVER import unmanaged solutions to Test, UAT, or Production
- Each environment has its own service principal for CI/CD
- DLP policies applied consistently across all environments
- Environment variables set per environment (never hardcoded)

---

## Integration Decision Tree

```
Need to integrate with external system?
├── Standard connector exists? → Use it (lowest maintenance)
├── REST API available?
│   ├── Simple, low volume → HTTP action in Power Automate
│   ├── Code App needs it → PAC CLI data source (pac code add-data-source)
│   └── Complex, reusable, high volume → Custom Connector + Azure APIM
├── No API (legacy/file-based)?
│   ├── File drop → Power Automate + Azure Blob
│   └── Database direct → Azure SQL connector or Dataflow
└── Real-time bidirectional → Azure Service Bus + Dataverse webhook
```

---

## Security Architecture

```
Authentication:   Entra ID (automatic for Code Apps — handled by Power Apps host)
Authorization:    Dataverse security roles (never app-level checks alone)
Secrets:          Azure Key Vault → Environment Variable (secret type)
Service accounts: Dedicated App Registration per solution (never personal accounts in pipelines)

Security Role Hierarchy:
  System Administrator    ← IT admins only
  System Customizer       ← Makers only, never end users
  [App] Admin             ← Full table access for app admins
  [App] Manager           ← Team-level access for managers
  [App] User              ← Own-record access for standard users
```

---

## Custom API vs Power Automate vs Plugin

| Use Case | Recommendation |
|---|---|
| Reusable action called from Code App / Canvas App | Custom API + Plugin |
| Orchestration of multiple systems | Power Automate |
| Pre/post Dataverse operation logic | Plugin (sync) |
| Long-running async process | Power Automate |
| Real-time validation before save | Plugin (pre-operation) |
| Scheduled batch job | Power Automate (Recurrence trigger) |
| Complex business logic from Code App | Custom API (callable via SDK) |

---

## Capacity & Limits

| Resource | Limit | Mitigation |
|---|---|---|
| Code App bundle size | 30 MB max | Tree-shaking, lazy loading, optimize assets |
| Dataverse API requests | 100,000/day per user | Service principal for bulk ops, batch requests |
| Power Automate runs/day | 40,000 (P1 license) | Batch operations, child flows |
| Canvas app controls | ~500 recommended | Split screens, use components |
| Canvas app data row limit (non-delegable) | 2,000 max | Delegable queries bypass this limit entirely |
| Synchronous flow timeout | 120 seconds | Async pattern with polling |
| Flow action outputs | 100 MB | Temp storage for large payloads |
| Code App connectors | 1,500+ available | Check premium vs standard licensing |
| Standard Dataverse table | Billions of rows (but slower at scale) | Use Elastic Tables for 100M+ write-heavy scenarios |

---

## Managed Environments

Managed Environments is a governance layer available on all paid Power Platform/Dynamics 365 licenses. Enable it per environment in the Power Platform Admin Center.

**Key architectural implications:**
- Required for **Power Platform Pipelines** (first-party ALM)
- Enables **IP Firewall** — restrict environment to corporate IP ranges
- Enables **Customer Managed Keys** — full encryption sovereignty
- Enables **Lockbox** — Microsoft engineer access requires explicit approval
- Enables **Solution Checker enforcement** — block non-compliant deployments
- Enables **Conditional Access per app** — Entra ID CA policies on individual apps

**Recommendation:** Enable Managed Environments on all non-Dev environments (Test, UAT, Production) from day one.

> **IMPORTANT (Feb 2026):** Starting February 2026, pipeline target environments are **auto-enabled as Managed Environments**. Plan for this in your environment strategy.

---

## DLP Policy Design

Data Loss Prevention (DLP) policies classify connectors as Business, Non-Business, or Blocked. Connectors in different groups cannot be used together in the same app or flow.

### Design Principles
- Default posture: **block everything**, allow by exception
- Cannot block Microsoft-owned connectors
- Create **environment-specific** policies for isolated business use cases (e.g., DocuSign only in Contracts env)
- Pair DLP with your environment strategy — separate environments = separate policies

### Connector Classification
```
Business:     Connectors approved for business use (Dataverse, SharePoint, Teams)
Non-Business: Personal/consumer connectors (social media, personal email)
Blocked:      Never allowed in this environment (custom connectors for non-approved APIs)
```

### Enforcement Stages
```
Investigating → Learning → Notify Only → Design-time → Full Enforcement
```
Start with "Notify Only" to identify affected apps/flows before full enforcement.

### Limits
- Max 600 DLP rules per tenant
- Policy max size: 100 KB

---

## Observability & Monitoring

### Application Insights Integration
Connect Power Platform to Azure Application Insights for end-to-end monitoring.

```
Enable in Power Platform Admin Center:
  Environment → Settings → Product → Features → Export data to Application Insights
  → Enter Application Insights Connection String

What gets captured:
  - Canvas App: page loads, screen transitions, errors, custom traces
  - Model-Driven App: form load times, API call durations, JavaScript errors
  - Power Automate: flow run telemetry (requires Managed Environments)
  - Plugins: ILogger output (see plugins skill)
  - Dataverse Web API: request counts, latencies, failures
```

### Monitoring Stack
| Component | Monitoring Tool | What to Watch |
|---|---|---|
| Code App (React) | Browser console + custom error boundary | JS errors, API call failures |
| Canvas App | Monitor tool + App Insights | Screen load times, delegation warnings |
| Model-Driven App | App Insights + Plugin Trace Log | Form load, plugin errors |
| Power Automate | Flow run history + App Insights | Failed runs, throttling, timeouts |
| Plugins | ITracingService + ILogger (App Insights) | Exceptions, performance |
| Custom Connectors | APIM analytics + App Insights | API call volumes, latency, error rates |
| Dataverse | Admin Center analytics | API limits, storage, user activity |

### Monitor Tool (Canvas App + Flow Diagnostics)
```
Power Apps → Monitor → Open Monitor
→ Start session → Use the app → See real-time telemetry:
   - Network calls (URL, duration, status)
   - Screen navigation timing
   - Data operation duration
   - Delegation warnings (live)
   - Error details with call stack
```

### Alerting
```
Azure Application Insights → Alerts → New Alert Rule:
  - Condition: customEvents count > threshold (e.g., errors in last 15 min)
  - Action Group: Email, Teams webhook, Azure Function
  - Severity: Critical for production, Warning for test
```

---

## Governance & Administration

### Center of Excellence (CoE) Starter Kit

The CoE Starter Kit is a free, Microsoft-maintained solution for Power Platform governance.

| Component | Purpose |
|---|---|
| **CoE Core** | Inventory — discovers all apps, flows, connectors, makers across tenant |
| **CoE Governance** | Compliance flows — archive unused apps, notify inactive makers, DLP violation alerts |
| **CoE Nurture** | Adoption — maker onboarding, training tracking, app catalog |
| **CoE Audit Log** | Audit streams — surface Office 365 audit log data into Dataverse |

**Installation pattern:**
```
1. Dedicated environment ("CoE" or "Governance") — Managed Environment enabled
2. Install CoE Core first → run initial inventory sync (can take 24h for large tenants)
3. Configure environment variables: Admin email, Power BI workspace, excluded environments
4. Install Governance + Nurture after Core stabilizes
5. Customize: adjust thresholds, notification templates, exception lists
```

> **Important:** CoE Starter Kit is NOT a managed solution from Microsoft — it ships as unmanaged. Plan for manual upgrades and potential customization drift.

### Sharing & Maker Controls

| Setting | Where to Configure | Recommendation |
|---|---|---|
| Canvas App sharing limit | Power Platform Admin Center → Tenant settings | Limit to security groups (prevent sharing with "Everyone") |
| Environment maker role | Environment → Security → Roles | Restrict who can create apps/flows in production |
| Default environment routing | Tenant settings → New makers | Route new makers to a dedicated "Personal Productivity" environment |
| Solution publisher controls | Admin Center → Environments | Limit who can create new publishers |
| Connector consent | Tenant settings | Require admin approval for new custom connectors |

### Maker Onboarding Workflow
```
New Maker identified (Entra ID group addition)
  └── Automated: Assign to "Maker" security group
  └── Automated: Grant Environment Maker role in Personal Productivity env
  └── Automated: Send welcome email (CoE Nurture template)
        - Training resources link
        - Governance policy summary
        - How to request a dedicated environment
  └── Gated: Request dedicated environment via approval flow
        - Business justification
        - Expected data classification
        - Sponsor approval
  └── Automated: Provision environment from template (if approved)
```

### Environment Request & Provisioning
| Environment Type | When to Create | Who Approves |
|---|---|---|
| Personal Productivity | Default for all makers | Auto-provisioned |
| Project Dev | New project starting development | Team lead |
| Project Test/UAT | Project ready for testing | PM + IT Admin |
| Production | Project approved for release | IT Admin + Change Advisory Board |
| Sandbox | Experimentation, training, demos | Team lead |

### Admin Monitoring Checklist
- [ ] CoE inventory sync running daily without errors
- [ ] DLP violation alerts configured and routed to governance team
- [ ] Unused app cleanup flow active (e.g., archive apps not used in 90 days)
- [ ] Capacity alerts set (Dataverse storage, API calls, AI Builder credits)
- [ ] Environment creation requests reviewed weekly
- [ ] Connector consent requests reviewed within 2 business days

---

## Architecture Decision Record (ADR) Template

```markdown
## ADR-[Number]: [Decision Title]

### Status
[Proposed / Accepted / Deprecated / Superseded]

### Context
[What is the problem? What are the constraints? What requirements drive this decision?]

### Decision Drivers
- [Driver 1: e.g., "Must support 500 concurrent users"]
- [Driver 2: e.g., "Team has React/TypeScript expertise"]
- [Driver 3: e.g., "Must deploy across 3 environments via managed solutions"]

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| [Option A] | [Pros] | [Cons] |
| [Option B] | [Pros] | [Cons] |
| [Option C] | [Pros] | [Cons] |

### Decision
[Which option was chosen and why]

### Consequences
**Positive:**
- [Benefit 1]

**Negative:**
- [Trade-off 1]

**Risks:**
- [Risk 1 + mitigation]

### ALM Implications
[How this decision affects solution structure, environment promotion, and CI/CD]
```

---

## AI Architecture Decision Tree

**Decision Tree**
```
Need AI capabilities in your solution?
├── Conversational AI (chat/voice)?
│   ├── Internal users (employees) → Copilot Studio agent deployed to Teams
│   ├── External users (customers) → Copilot Studio agent via Power Pages Agent API
│   └── Embedded in existing app → Copilot Studio agent embedded in MDA/Canvas
├── Autonomous AI (no user interaction)?
│   ├── Simple rule + AI → Power Automate Agent Flow
│   └── Complex multi-step → Copilot Studio autonomous agent
├── Document/image processing?
│   └── AI Builder (document processing, object detection, text recognition)
├── Custom LLM integration?
│   ├── Need standard models (GPT-4o, etc.) → Copilot Studio (built-in or BYOM)
│   ├── Need fine-tuned/custom model → Azure AI Foundry + Custom Connector
│   └── Need streaming/advanced patterns → Azure OpenAI direct from Code App
├── Multi-agent orchestration?
│   ├── Same domain → Copilot Studio embedded agents
│   └── Cross-domain/cross-tenant → Copilot Studio connected agents (A2A protocol)
└── Simple AI prompts in workflows?
    └── AI Builder GPT prompts in Power Automate
```

**Comparison Matrix**

| Capability | Copilot Studio | AI Builder | Azure AI Foundry | Direct AOAI | Power Automate Agent Flows |
|---|---|---|---|---|---|
| Conversational AI | Best | No | Possible | Possible | No |
| Document processing | No | Best | Possible | No | No |
| Custom models | BYOM (11k+) | Limited | Full control | Full control | Via connectors |
| No-code setup | Yes | Yes | No | No | Mostly yes |
| ALM/solution-aware | Yes | Yes | External | External | Yes |
| Licensing | Per-message | Per-page/call | Azure consumption | Azure consumption | Per-flow |
| Multi-agent | Yes (A2A) | No | Yes (custom) | No | No |
| Governance | Automation Center | Admin Center | Azure RBAC | Azure RBAC | Automation Center |

**When to Use Each**

| Use Case | Recommended | Why |
|---|---|---|
| Employee FAQ bot | Copilot Studio | Built-in knowledge sources, Teams deployment, ALM |
| Invoice processing | AI Builder | Purpose-built document processing, Power Automate integration |
| Custom RAG pipeline | Azure AI Foundry | Full control over embeddings, vector store, retrieval |
| Streaming chat in Code App | Direct AOAI | Need streaming responses, custom UI, low latency |
| Automated email triage | Power Automate Agent Flow | Event-driven, AI selects actions, governance via Automation Center |
| Cross-department agent network | Copilot Studio connected agents | A2A protocol, security boundaries, independent lifecycle |

**Cost Considerations**
- Copilot Studio: per-tenant license + per-message beyond included allocation
- AI Builder: credits included with some licenses, pay-per-use otherwise
- Azure AI Foundry/AOAI: Azure consumption-based (token pricing)
- Evaluate: expected volume, required SLA, data residency requirements

**Anti-Patterns for AI Architecture**
- Using Azure AI Foundry when Copilot Studio covers the requirement (unnecessary complexity)
- Calling Azure OpenAI directly from Canvas Apps (expose API keys client-side)
- AI Builder for scenarios that need conversational context (it is stateless)
- Building custom RAG when Copilot Studio knowledge sources suffice
- No content moderation on any AI-generated output
- AI decisions without audit trail (compliance risk)

---

## Anti-Patterns

- Monolithic single-solution architecture for anything beyond a prototype — leads to merge conflicts, deployment bottlenecks, and upgrade failures. Use solution layering (base + feature solutions) instead.
- Choosing Code Apps for simple CRUD forms — overkill for standard data entry. Use Model-Driven Apps for form-centric CRUD and reserve Code Apps for complex, custom UI.
- No publisher prefix strategy — leads to naming collisions, component ownership confusion, and blocked ALM. Define a short, unique prefix per publisher from day one.
- Security implemented only at the app layer (hiding buttons/tabs) — data is still exposed via API, Power Automate, Advanced Find. Always enforce security at the Dataverse level with security roles.
- No ALM plan at project start — results in manual deployments, environment drift, and "works on my machine" failures. Define solution structure, environment topology, and CI/CD pipeline at design time.
- Designing without data volume estimates — 100 rows and 10 million rows need fundamentally different patterns (pagination, indexing, async processing). Ask about expected volumes early.
- Over-engineering with microservice patterns — Power Platform has built-in orchestration (flows, plugins). Don't wrap simple Dataverse operations in Azure Functions unless there's a clear technical reason.
- Skipping the security model discussion — retrofitting security after go-live is expensive and error-prone. Design business units, roles, and row-level security upfront.

---

## Related Skills

- `security` — Dataverse security model, roles, column-level security
- `alm` — CI/CD pipelines, solution lifecycle, environment promotion
- `code-apps` — Code Apps architecture (React + TypeScript + Vite)
- `canvas-apps` — Canvas App design patterns
- `model-driven-apps` — Model-Driven App design
- `azure-openai` — Azure OpenAI integration patterns
- `copilot-studio` — Copilot Studio agent design and deployment
