---
name: governance
description: "Power Platform governance, DLP policies, Center of Excellence, tenant administration. Use when: DLP, data loss prevention, governance, CoE, Center of Excellence, tenant settings, sharing limits, compliance, audit, data residency, connector classification, maker controls, admin API."
---

# Skill: Power Platform Governance

## When to Use
Trigger when designing data loss prevention policies, configuring tenant-level settings, deploying the Center of Excellence Starter Kit, establishing compliance controls, setting up audit logging, or managing maker governance at scale.

---

## Governance Pillars

| Pillar | Description | Key Tools |
|---|---|---|
| **Data Protection** | Control which connectors can be used together | DLP policies, connector classification |
| **Maker Controls** | Govern who can build what, where | Tenant settings, sharing limits, environment routing |
| **Visibility** | Understand what's been built and by whom | CoE Starter Kit, audit logs, analytics |
| **Compliance** | Meet regulatory requirements | Purview, audit logging, data residency, encryption |
| **Cost Management** | Control capacity and licensing spend | Managed Environments, pay-as-you-go monitoring |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[DLP Policies](dlp-policies.md)** — connector classification (Business/Non-Business/Blocked), policy design patterns, enforcement stages, limits, HTTP connector blocking, custom connector governance, action-level controls
- **[CoE Starter Kit](coe-starter-kit.md)** — Core/Governance/Nurture/Audit modules, installation prerequisites, configuration, monitoring dashboards, upgrade patterns, common customizations
- **[Tenant Administration](tenant-admin.md)** — tenant settings, sharing limits, maker controls, connector consent, default environment routing, environment groups, Power Platform admin API and cmdlets
- **[Compliance & Audit](compliance-audit.md)** — audit logging (Dataverse + Microsoft Purview), data residency, GDPR compliance, data export, encryption (CMK), Lockbox, IP firewall, customer-managed keys

---

## Governance Maturity Model

| Level | Description | Key Actions |
|---|---|---|
| **1 — Reactive** | No governance, default environment sprawl | Enable tenant-level DLP, lock down default env |
| **2 — Foundational** | Basic DLP + env strategy | Environment groups, maker routing, basic CoE |
| **3 — Managed** | Managed Environments + CoE monitoring | Full CoE deployment, audit logging, compliance |
| **4 — Optimized** | Automated governance, self-service within guardrails | Advanced DLP, auto-claim licensing, catalog |

---

## Quick Start: Day-1 Governance

If you're starting from zero, do these in order:

1. **Create a tenant-level DLP policy** — classify connectors, block dangerous ones (see `dlp-policies.md`)
2. **Lock down the default environment** — restrict sharing, remove premium connector access
3. **Enable default environment routing** — route makers to personal developer environments
4. **Enable Managed Environments** on all non-dev environments
5. **Deploy CoE Starter Kit Core module** — get visibility into what's been built (see `coe-starter-kit.md`)
6. **Configure audit logging** — enable Dataverse audit + Purview (see `compliance-audit.md`)

---

## Anti-Patterns

- No DLP policies at all (any connector can talk to any connector — data exfiltration risk)
- DLP so restrictive that makers can't build anything useful (governance should enable, not block)
- Ignoring the default environment (it accumulates ungoverned apps)
- No visibility into what makers are building (shadow IT grows silently)
- Governance policies without enforcement tooling (documented but not implemented)
- Manual governance reviews instead of automated policy enforcement
- No compliance controls until an audit happens (too late)
- Tenant settings left at defaults (overly permissive by default)
- CoE Starter Kit deployed but never monitored or updated
- Different governance standards per project with no central policy

---

## Related Skills

- `env-strategy` — Environment topology, Managed Environments, environment groups
- `alm` — Solution Checker enforcement, pipeline governance
- `security` — Security roles, column security, row-level security
- `licensing` — License compliance, Managed Environment entitlements
- `copilot-studio` — Agent governance, DLP for Copilot Studio
