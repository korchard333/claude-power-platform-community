---
name: m365-integration
description: "Microsoft 365 integration with Power Platform. Use when: Teams, SharePoint, Graph API, Outlook, Microsoft 365, M365, Copilot connector, Teams tab, Adaptive Cards, SharePoint lists, Graph queries, email templates, calendar integration."
---

# Skill: Microsoft 365 Integration

## When to Use
Trigger when integrating Power Platform with Microsoft 365 services — embedding apps in Teams, connecting to SharePoint, using Microsoft Graph API, building Outlook integrations, or creating Teams bots via Copilot Studio.

---

## Integration Surface

| M365 Service | Power Platform Integration Points |
|---|---|
| **Teams** | Copilot Studio bots, embedded apps (tabs), Adaptive Cards from flows, Teams connector |
| **SharePoint** | Lists as data source, document libraries, SharePoint-embedded forms, knowledge source for agents |
| **Microsoft Graph** | Graph connector, custom connector, delegated/app permissions |
| **Outlook** | Email triggers/actions, calendar integration, shared mailboxes, room booking |
| **OneDrive** | File operations in flows, document storage for apps |
| **Planner** | Task creation/management from flows |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Teams Integration](teams-integration.md)** — Copilot Studio bot deployment, Adaptive Cards from flows, Teams tab embedding (Canvas/Code Apps), Teams connector actions, deep linking, personal app vs channel tab
- **[SharePoint Integration](sharepoint-integration.md)** — SharePoint connector patterns, document library operations, list forms, migration from SP lists to Dataverse, when to use each
- **[Microsoft Graph API](graph-api.md)** — Graph connector, custom connector for Graph, delegated vs app permissions, common queries, pagination, batch requests
- **[Outlook Integration](outlook-integration.md)** — Outlook connector in flows, email templates with dynamic content, calendar integration, shared mailbox patterns, meeting scheduling

---

## Anti-Patterns

- Using SharePoint lists as primary database for apps with > 5000 items (delegation limits, performance)
- Hard-coding SharePoint site URLs in flows (breaks across environments)
- Using personal Graph permissions in production flows (use app permissions)
- Embedding Canvas Apps in Teams without testing the Teams container (layout issues)
- Sending emails from personal accounts in automated flows (use shared mailbox)
- Not handling Graph API pagination (missing data beyond first page)
- Creating Teams channels programmatically without governance (channel sprawl)
- Using Outlook connector for bulk email (throttling, abuse detection)

---

## Related Skills

- `copilot-studio` — Teams bot deployment, agent channels
- `canvas-apps` — Canvas App embedding and SharePoint integration
- `power-automate` — Flow connectors for M365 services
- `custom-connectors` — Custom Graph API connector creation
- `governance` — DLP policies for M365 connectors
