# DLP Policies

## Overview

Data Loss Prevention (DLP) policies are the primary mechanism for controlling how connectors interact in Power Platform. They classify connectors into groups and enforce rules about which connectors can be used together in a single app or flow.

---

## Connector Classification Groups

| Group | Meaning | Behavior |
|---|---|---|
| **Business** | Connectors handling org data | Can only be used with other Business connectors in the same app/flow |
| **Non-Business** | Connectors for non-org data | Can only be used with other Non-Business connectors |
| **Blocked** | Prohibited connectors | Cannot be used in any app or flow in the policy scope |

> The names "Business" and "Non-Business" are just labels. What matters is: connectors in different groups cannot coexist in the same app or flow.

### Unblockable Connectors

Some core connectors cannot be classified as Blocked (they can only be Business or Non-Business):

**Microsoft Enterprise Plan standard connectors:**
- Microsoft 365 Outlook, SharePoint, Teams, OneDrive for Business
- Excel Online (Business), OneNote (Business), Planner
- Microsoft 365 Users, Microsoft 365 Groups
- Power BI, Shifts, Yammer, Skype for Business Online

**Core Power Platform connectors:**
- Dataverse, Dataverse (legacy)
- Approvals, Notifications
- Power Apps Notifications (v1 and v2)
- Microsoft Copilot Studio

> **Advanced Connector Policies (preview)** can limit or block even these unblockable connectors in Managed Environments. This is the next-gen approach for strict governance.

---

## Policy Scope

| Scope | Created By | Applies To | Override Rules |
|---|---|---|---|
| **Tenant-level** | Tenant admin | All environments (or selected) | Cannot be overridden by environment policies |
| **Environment-level** | Environment admin | Single environment | Cannot weaken tenant-level policies |

**Most restrictive wins:** If both tenant and environment policies apply, the most restrictive combination of connector groupings is enforced.

### Scope Strategy

```
Tenant-level DLP (baseline for all environments):
  ├── Business: SharePoint, Outlook, Teams, Dataverse
  ├── Non-Business: Twitter, Dropbox, personal connectors
  └── Blocked: HTTP (no auth), SMTP (uncontrolled)

Environment-level DLP (production — stricter):
  ├── Business: SharePoint, Outlook, Teams, Dataverse, SQL Server
  ├── Non-Business: (empty — nothing allowed outside business group)
  └── Blocked: Everything not in Business group
```

---

## Recommended Connector Classification

### Tenant-Level Baseline Policy

```
BUSINESS (core enterprise connectors):
  - Dataverse
  - SharePoint
  - Microsoft 365 Outlook
  - Microsoft Teams
  - OneDrive for Business
  - Microsoft 365 Users
  - Approvals
  - Office 365 Groups

NON-BUSINESS (default for everything else):
  - All other connectors land here by default
  - Set "Default group for new connectors" = Non-Business

BLOCKED (high-risk connectors):
  - HTTP (allows calling any endpoint without auth controls)
  - SMTP (uncontrolled email sending)
  - Any third-party connector not approved by security team
```

### Production Environment Policy (Layered)

```
BUSINESS:
  - All baseline Business connectors +
  - SQL Server (with endpoint filtering)
  - Azure Blob Storage (with endpoint filtering)
  - Custom connectors (approved only)

NON-BUSINESS:
  - (Intentionally empty — all connectors either Business or Blocked)

BLOCKED:
  - Everything not explicitly in Business group
  - All social media connectors
  - All personal productivity connectors
```

---

## Granular Controls

### Connector Action Control

Control individual actions within a connector (e.g., allow "read" but block "delete"):

```
Power Platform Admin Center → Security → Data and privacy → Data policy
  → Edit policy → Select connector → More actions → Configure connectors
  → Connector actions → Allow/Deny specific actions
```

| Use Case | Connector | Allow | Deny |
|---|---|---|---|
| Read-only SharePoint | SharePoint | Get items, Get file | Create item, Delete item |
| Safe Teams usage | Teams | Get channels, Get message | Delete message, Delete channel |
| Controlled Dataverse | Dataverse | List records, Get record | Delete record |

**Default action setting:** Configure whether new actions added to a connector are allowed or denied by default. Set to **Deny** for production policies to enforce explicit allow-listing.

### Connector Endpoint Filtering

Restrict which specific endpoints a connector can reach (available for 6 connectors):

| Connector | Endpoint Filtering Available |
|---|---|
| HTTP | Yes — filter by URL pattern |
| HTTP with Microsoft Entra ID | Yes |
| HTTP Webhook | Yes |
| SQL Server | Yes — filter by server name |
| Azure Blob Storage | Yes — filter by storage account |
| SMTP | Yes — filter by server |

**Example: Allow SQL only to approved servers:**
```
Connector: SQL Server
Endpoint pattern: *.database.windows.net
Action: Allow

Connector: SQL Server
Endpoint pattern: *
Action: Deny (catch-all)
```

---

## Custom Connector Governance

### Environment-Level (by name)
Environment admins classify individual custom connectors by name:
```
Power Platform Admin Center → Data policy → Edit
  → Custom connectors tab → Select connector → Classify
```

### Tenant-Level (by URL pattern)
Tenant admins classify custom connectors by host URL pattern:
```
Power Platform Admin Center → Data policy → Edit
  → Custom connectors tab → Add connector pattern
  → Pattern: *.contoso.com → Group: Business
  → Pattern: * → Group: Blocked (catch-all)
```

**Pattern evaluation order matters** — rules are evaluated top to bottom, first match wins. The wildcard `*` pattern should always be last.

### Custom Connector URL Pattern Examples

| Pattern | Matches | Group |
|---|---|---|
| `api.contoso.com` | Exact match only | Business |
| `*.contoso.com` | Any subdomain of contoso.com | Business |
| `*.azurewebsites.net` | Any Azure Function / Web App | Non-Business |
| `*` | Everything else (catch-all) | Blocked |

---

## DLP for Copilot Studio

DLP policies apply to Copilot Studio agents. Connectors used in agent actions (topics, generative actions) are subject to the same DLP enforcement.

Key considerations:
- Agents using generative actions can dynamically select connectors — DLP still enforces at runtime
- Knowledge sources (SharePoint, Dataverse) are governed by the same connector groups
- MCP tools in Copilot Studio go through connector infrastructure — DLP applies

Configure: `Power Platform Admin Center → Data policy → Edit → Copilot connectors tab`

---

## DLP for Desktop Flows

Power Automate desktop flows have their own DLP dimension:
- Desktop flow **modules** (e.g., Excel, Email, Web) can be classified as Business/Non-Business/Blocked
- Module **actions** can be individually allowed or denied
- Policies prevent mixing modules from different groups within a single desktop flow
- Cloud flow → desktop flow boundary is also enforced (a cloud flow using Business connectors cannot trigger a desktop flow using Non-Business modules)

---

## Policy Design Patterns

### Pattern 1: Baseline + Override
```
1. Tenant-level policy: Moderate baseline (core connectors as Business)
2. Per-environment policies: Stricter for production, more permissive for dev
```

### Pattern 2: Environment Group Rules
```
1. Create environment groups: Production, Development, Personal
2. Apply DLP policies to groups instead of individual environments
3. New environments added to a group automatically inherit the DLP policy
```

### Pattern 3: Graduated Lockdown
```
Personal dev envs:  Block HTTP, block SMTP, allow most standard connectors
Shared sandbox:     Block HTTP + SMTP + social, allow enterprise connectors
Production:         Allow-list only — everything not explicitly allowed is blocked
```

---

## Enforcement Stages

When rolling out DLP to an existing tenant with apps already in use:

| Stage | Duration | Action |
|---|---|---|
| **1. Audit** | 2-4 weeks | Deploy CoE Starter Kit, identify all apps and their connector usage |
| **2. Notify** | 2-4 weeks | Create policy in "report-only" mode, notify makers of violations |
| **3. Enforce (Non-Business)** | 1-2 weeks | Enforce for new apps, grace period for existing |
| **4. Enforce (All)** | Ongoing | Full enforcement, existing non-compliant apps break |

> **Warning:** Enabling DLP retroactively WILL break existing apps that violate the policy. Always audit first.

---

## PowerShell Management

### List Policies
```powershell
# Install module
Install-Module -Name Microsoft.PowerApps.Administration.PowerShell

# Connect
Add-PowerAppsAccount

# List all DLP policies
Get-DlpPolicy
```

### Create a Tenant-Level Policy
```powershell
# Create new policy
$policy = New-DlpPolicy -DisplayName "Contoso Baseline DLP" `
    -EnvironmentType "AllEnvironments"

# Move connectors to Business group
Add-ConnectorToBusinessDataGroup -PolicyName $policy.PolicyName `
    -ConnectorName "shared_sharepointonline"

# Block a connector
Add-ConnectorToBlockedGroup -PolicyName $policy.PolicyName `
    -ConnectorName "shared_smtp"
```

### Bulk Connector Classification
```powershell
# Get all connectors in a policy
$connectors = Get-DlpPolicyConnectorConfigurations -PolicyName $policy.PolicyName

# Move multiple connectors to Business
$businessConnectors = @(
    "shared_sharepointonline",
    "shared_office365",
    "shared_teams",
    "shared_commondataserviceforapps"
)

foreach ($connector in $businessConnectors) {
    Add-ConnectorToBusinessDataGroup -PolicyName $policy.PolicyName `
        -ConnectorName $connector
}
```

---

## Limits and Constraints

| Limit | Value | Notes |
|---|---|---|
| Max DLP policies per tenant | **No documented hard limit** | But keep manageable — complexity grows fast |
| Connector action rules per policy | **Varies per connector** | Each connector has its own action list |
| Custom connector URL patterns per policy | **Up to 100** | Use wildcards to stay under limit |
| Policy application delay | **~5 minutes** | Changes are not instantaneous |
| Blocked connector enforcement | **Immediate for new apps** | Existing apps break at next save/run |

---

## Anti-Patterns

- **No DLP policy at all** — any connector can talk to any connector, data exfiltration is trivial
- **Single uber-restrictive policy** — blocks everything, makers circumvent with shadow IT
- **Ignoring custom connectors** — custom connectors bypass DLP if not explicitly classified
- **HTTP connector unblocked in production** — allows calling any endpoint, bypasses all DLP intent
- **No default group for new connectors** — new connectors auto-classified as Non-Business but could still leak data if combined
- **DLP without audit first** — retroactive enforcement breaks existing production apps
- **Environment-level policies contradicting tenant policy** — confusing, hard to debug
- **Not configuring action-level controls** — all-or-nothing connector access when granular control is available
- **Ignoring desktop flow DLP** — desktop flows can access local resources and bypass cloud DLP
- **No endpoint filtering on SQL/HTTP connectors** — connector access means access to ANY server/endpoint
