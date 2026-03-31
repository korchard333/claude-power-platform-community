# Tenant Administration

## Overview

Tenant-level settings control the baseline governance posture for all Power Platform environments. These settings determine who can create environments, how broadly apps can be shared, which connectors require consent, and how makers are routed.

---

## Tenant Settings

Access: `Power Platform Admin Center → Settings → Tenant settings`

### Critical Settings

| Setting | Recommended Value | Why |
|---|---|---|
| **Who can create production and sandbox environments** | Only specific admins | Prevent environment sprawl |
| **Who can create trial environments** | Everyone (or restricted) | Low risk, useful for evaluation |
| **Who can create developer environments** | Everyone | Free, isolated, auto-cleanup — encourage self-service |
| **Disable self-service sign-up** | No (leave enabled) | Developer Plan self-service is beneficial for learning |
| **Share with everyone** | Disabled | Prevent apps being shared with entire org accidentally |
| **Publish to catalog** | Admins only | Control what goes into the org catalog |

### Environment Creation Controls

```
Power Platform Admin Center → Settings → Tenant settings → Environment creation

Production and sandbox:
  ☑ Only specific admins → Prevents makers creating unmanaged environments

Developer:
  ☑ Everyone → Free environments, no capacity cost, auto-cleanup

Trial:
  ☑ Everyone → Low risk, 30-day expiry
```

**Decision Table:**

| Who | Can Create Production/Sandbox? | Can Create Developer? | Can Create Trial? |
|---|---|---|---|
| Tenant Admin | Yes | Yes | Yes |
| Environment Admin | Yes (if permitted) | Yes | Yes |
| Maker (licensed) | No (recommended) | Yes | Yes |
| Maker (M365 only) | No | Yes (Developer Plan) | Yes |

---

## Sharing Limits

Control how broadly makers can share apps and flows.

### Global Sharing Limits
```
Power Platform Admin Center → Settings → Tenant settings → Sharing

  Maximum number of users an app can be shared with: [limit]
  ☑ Exclude sharing with security groups (only count individual users)
```

### Per-Environment Sharing Limits (Managed Environments)
```
Power Platform Admin Center → Environments → [env] → Edit
  → Managed Environments → Limit sharing
    ☑ Limit sharing to [20] users (exclude security groups)
    ☑ Limit sharing to [3] security groups
```

### Recommended Limits by Environment Type

| Environment Type | Individual User Limit | Security Group Limit | Rationale |
|---|---|---|---|
| Personal developer | 0 (no sharing) | 0 | Personal workspace only |
| Shared sandbox/dev | 20 | 3 | Team-scoped collaboration |
| Test / UAT | Unlimited | Unlimited | Need full user base for testing |
| Production | Unlimited | Unlimited | But require compliance review first |

---

## Connector Consent

Control whether users are prompted before using specific connectors.

```
Power Platform Admin Center → Settings → Tenant settings → Connectors

  ☑ Require users to consent before using new connectors
  ☑ Block third-party connectors by default (require admin approval)
```

### Connector Consent vs DLP

| Control | Scope | Effect |
|---|---|---|
| **DLP policy** | Which connectors can be used together | Blocks mixing Business + Non-Business in same app/flow |
| **Connector consent** | Whether a connector can be used at all | Blocks individual connector use without admin approval |
| **Advanced Connector Policies** | Granular per-connector controls | Next-gen — replaces consent for Managed Environments |

---

## Default Environment Routing

Automatically redirect new makers away from the default environment.

```
Power Platform Admin Center → Settings → Tenant settings
  → Default environment routing
    ☑ Route new makers to their own personal developer environment
```

### How It Works
1. New maker signs up or first opens Power Apps/Power Automate
2. Instead of landing in the default environment, they're routed to a personal developer environment
3. If they don't have a developer environment, one is auto-created
4. Existing makers who already use the default environment are NOT moved

### Benefits
- Default environment stays clean
- Makers learn in isolated environments
- No accidental sharing of prototype apps in the default environment
- Developer environments are free and auto-cleanup after 90 days of inactivity

---

## Environment Groups and Rules

Manage environments as collections with consistent policies.

### Creating an Environment Group
```
Power Platform Admin Center → Environment groups → + New group
  Name: "Production Environments"
  Description: "All production environments — strict governance"
  → Add environments → Select environments → Save
```

### Applying Rules to Groups

| Rule Type | Description | Configuration |
|---|---|---|
| **Sharing limits** | Max users/groups for app sharing | Set per group |
| **Solution checker** | Enforce quality on deployments | Block deploy on critical findings |
| **Managed Environments** | Auto-enable Managed Env features | Apply to group |
| **Maker welcome** | Custom content shown to makers | Link to wiki/governance policy |
| **DLP policies** | Apply data policies to the group | Select DLP policy for group |

### Example Group Structure
```
Group: All-Production
  Rules: Managed Env ON, Solution Checker enforced, Sharing unlimited
  Environments: Project-A-Prod, Project-B-Prod, Shared-Prod

Group: All-Development
  Rules: Managed Env ON, Solution Checker warn-only, Sharing limited to 20
  Environments: Project-A-Dev, Project-B-Dev

Group: Personal-Productivity
  Rules: Managed Env OFF, Sharing limited to 5, No premium connectors
  Environments: Developer environments (auto-assigned via routing)
```

---

## Power Platform Admin API

Programmatic administration for automation and integration.

### Admin Connectors (Low-Code)

| Connector | Used For | License Required |
|---|---|---|
| **Power Apps for Admins** | Manage apps, permissions | Power Apps Premium |
| **Power Automate for Admins** | Manage flows, connections | Power Automate Premium |
| **Power Platform for Admins** | Manage environments, DLP | Power Apps Premium |

### PowerShell Modules

```powershell
# Install admin modules
Install-Module -Name Microsoft.PowerApps.Administration.PowerShell
Install-Module -Name Microsoft.PowerApps.PowerShell

# Connect
Add-PowerAppsAccount

# List all environments
Get-AdminPowerAppEnvironment

# List all apps in an environment
Get-AdminPowerApp -EnvironmentName "00000000-0000-0000-0000-000000000000"

# List all flows in an environment
Get-AdminFlow -EnvironmentName "00000000-0000-0000-0000-000000000000"

# Remove an app
Remove-AdminPowerApp -AppName "app-guid" -EnvironmentName "env-guid"

# Set app owner
Set-AdminPowerAppOwner -AppName "app-guid" -EnvironmentName "env-guid" `
  -AppOwner "new-owner-guid"
```

### Admin API (REST)

```bash
# Base URL
BASE="https://api.bap.microsoft.com"

# Get token
TOKEN=$(az account get-access-token \
  --resource "https://service.powerapps.com/" \
  --query accessToken -o tsv)

# List environments
curl -s "$BASE/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments?api-version=2023-06-01" \
  -H "Authorization: Bearer $TOKEN"

# Get environment details
curl -s "$BASE/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments/{env-id}?api-version=2023-06-01" \
  -H "Authorization: Bearer $TOKEN"
```

### PAC CLI Admin Commands

```bash
# List environments
pac admin list

# Create environment
pac admin create \
  --name "Contoso-HR-Dev" \
  --type Sandbox \
  --region unitedstates \
  --currency USD \
  --language 1033

# Copy environment
pac admin copy \
  --source-env "source-env-url" \
  --target-env "target-env-url" \
  --type MinimalCopy

# Reset environment
pac admin reset \
  --environment "env-url"

# Enable Managed Environment
pac admin set-managed \
  --environment "env-url" \
  --enable true

# Backup environment
pac admin backup \
  --environment "env-url" \
  --label "Pre-deploy-v2.0"

# Restore environment
pac admin restore \
  --environment "env-url" \
  --backup-id "backup-guid"
```

---

## Maker Controls

### Maker Onboarding
```
When a maker first accesses Power Apps:
  1. Default environment routing → personal developer environment
  2. Maker welcome content displayed (link to governance policy)
  3. Maker Assessment app (from CoE Nurture) for skill evaluation
  4. Training resources shared via automated email
```

### Maker Monitoring
```
CoE Starter Kit provides:
  - New maker notification (flow: alert admins when new maker detected)
  - Maker activity tracking (apps created, flows built, last active)
  - Connector usage per maker (identify makers using premium/custom connectors)
  - App compliance status (certified, pending review, quarantined)
```

### App Lifecycle Governance

| Stage | Governance Action |
|---|---|
| **App created** | Tracked by CoE inventory sync |
| **App shared (> threshold)** | Compliance review requested |
| **App uses premium connector** | License check triggered |
| **App inactive > 60 days** | Owner notified, cleanup candidate |
| **App non-compliant > 14 days** | Quarantined (if enabled) |
| **App retired** | Archived and removed |

---

## Conditional Access Integration

Use Microsoft Entra Conditional Access to add identity-based controls.

### Per-App Conditional Access (Managed Environments)
```
1. Enable Managed Environments on the environment
2. Assign Conditional Access policy to the Power Apps cloud app in Entra ID
3. In Power Platform Admin Center → Environment → Security
   → Enable "Conditional access per app"
4. Assign different CA policies to different apps within the same environment
```

### Common CA Policies for Power Platform

| Policy | Condition | Access Control |
|---|---|---|
| **MFA for all Power Apps** | All users, Power Apps cloud app | Require MFA |
| **Block external access** | All users, outside corporate network | Block access |
| **Device compliance** | All users, Power Apps mobile | Require compliant device |
| **High-risk app access** | Selected app, all users | Require MFA + compliant device |

---

## Tenant Isolation

Control whether your tenant can establish connections to other tenants.

```
Power Platform Admin Center → Settings → Tenant settings → Tenant isolation

  ☑ Enable tenant isolation
  → Add allow-list: Specific tenant IDs that can connect
  → Everything else: Blocked
```

### When to Use
- Regulated industries (prevent data flowing to external tenants)
- After M&A (control cross-tenant access during transition)
- Government clouds (strict boundary requirements)

### Inbound vs Outbound Rules

| Direction | Description | Example |
|---|---|---|
| **Inbound** | External tenants connecting to YOUR environment | Partner tenant accessing your Dataverse |
| **Outbound** | YOUR users connecting to external environments | Your makers using connectors in partner tenant |

---

## Anti-Patterns

- **Tenant settings left at defaults** — overly permissive, anyone can create environments and share broadly
- **Everyone can create production environments** — leads to unmanaged sprawl
- **No sharing limits** — one maker shares an app with the entire organization
- **No default environment routing** — the default environment becomes a dumping ground
- **Admin tasks done manually** — use PowerShell/API for repeatable admin operations
- **No conditional access** — Power Apps accessible from any device, any location
- **Tenant isolation disabled in regulated industry** — data can flow to external tenants
- **No environment groups** — managing 50+ environments individually
- **Personal accounts running admin flows** — use service principals for automation
- **No maker onboarding** — makers learn bad habits without guidance
