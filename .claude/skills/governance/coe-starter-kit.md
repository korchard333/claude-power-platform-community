# Center of Excellence (CoE) Starter Kit

## Overview

The CoE Starter Kit is a collection of Power Platform solutions (apps, flows, dashboards) that provide visibility, governance, and nurture capabilities for organizations adopting Power Platform at scale. It is a Microsoft-maintained reference implementation — not a supported product, but built on fully supported platform features.

---

## Modules

| Module | Purpose | Audience | Depends On |
|---|---|---|---|
| **Core** | Inventory sync, resource visibility, admin apps | Admins | Creator Kit |
| **Governance** | Compliance processes, audit workflows, developer compliance | Admins + Makers | Core |
| **Nurture** | Maker community, templates, training, onboarding | Everyone | Core |
| **Innovation Backlog** | App idea submission and tracking | Everyone | Core |
| **ALM Accelerator** | CI/CD automation, source control integration | Admins + Devs | Core |

### Core Components

The foundation — must be installed first. Syncs all Power Platform resources into Dataverse tables.

**Key Assets:**
| Asset | Type | Description |
|---|---|---|
| Power Platform Admin View | Model-Driven App | Browse all apps, flows, connectors, makers across tenant |
| DLP Editor | Canvas App | Visual editor for DLP policies |
| Set App Permissions | Canvas App | Bulk manage app sharing and permissions |
| Sync Flows | Cloud Flows | Periodic sync of inventory from admin APIs to Dataverse |
| Power BI Dashboard | Power BI Report | Adoption analytics, maker activity, app usage |

**Dataverse Tables Created:**
- `PowerApps App` — all canvas and model-driven apps
- `Flow` — all cloud flows
- `Connector` — all connectors in use
- `Maker` — all makers across environments
- `Environment` — all environments in tenant
- `PowerApps App Usage` — last launched date, session count

### Governance Components

Compliance workflows that build on the inventory data from Core.

**Key Assets:**
| Asset | Type | Description |
|---|---|---|
| Developer Compliance Center | Canvas App | Makers self-certify apps (business justification, risk level) |
| Compliance Detail Request | Cloud Flow | Auto-emails makers when new apps need compliance review |
| App Quarantine | Cloud Flow | Quarantine non-compliant apps after grace period |
| Inactivity Notifications | Cloud Flow | Notify owners of unused apps before cleanup |
| Archive and Clean Up | Cloud Flow | Archive and remove apps not used in X days |

### Nurture Components

Community building to accelerate healthy adoption.

**Key Assets:**
| Asset | Type | Description |
|---|---|---|
| Maker Assessment | Canvas App | Self-assessment quiz for makers (skill level, learning path) |
| Training in a Day | Canvas App | Manage training events and registration |
| Template Catalog | Canvas App | Approved app/flow templates for reuse |
| Newsletter | Cloud Flow | Automated newsletter highlighting new apps and community wins |

---

## Prerequisites

Before installing the CoE Starter Kit:

| Requirement | Details |
|---|---|
| **Dedicated environment** | Create a production environment specifically for CoE (not the default environment) |
| **Dataverse database** | Environment must have a Dataverse database |
| **Power Apps Premium license** | Service account running sync flows needs Premium |
| **Creator Kit** | Must be installed in the CoE environment before Core components |
| **Microsoft Entra app registration** | For audit log integration (optional but recommended) |
| **Service account** | Dedicated service account (not a personal account) for running flows |
| **Power BI Pro/Premium** | For Power BI dashboard (optional) |

---

## Installation Steps

### Step 1: Create the CoE Environment
```
Power Platform Admin Center → Environments → New
  Name: [Org]-CoE-Prod
  Type: Production
  Dataverse: Yes
  Managed Environments: Yes (recommended)
```

### Step 2: Install Creator Kit
The CoE Starter Kit depends on the Creator Kit for UI components:
```
1. Download Creator Kit from https://aka.ms/creatorkitdownload
2. Import CenterOfExcellenceCreatorKit_managed.zip into CoE environment
```

### Step 3: Create Required Connections
Before importing Core, manually create these connections:
```
Power Automate → CoE environment → Data → Connections → + New connection
  1. HTTP with Microsoft Entra ID (preauthorized)
     - Base Resource URL: https://graph.microsoft.com
     - Microsoft Entra ID Resource URI: https://graph.microsoft.com
  2. Power Apps for Admins
  3. Power Automate for Admins
  4. Power Platform for Admins
  5. Office 365 Outlook (for notification flows)
  6. Microsoft Dataverse
```

### Step 4: Import Core Components
```
1. Download from https://aka.ms/CoeStarterKitDownload
2. Extract the zip file
3. Import CenterOfExcellenceCoreComponents_x_x_x_xx_managed.zip
4. Leave all environment variables BLANK on import
   (GCC/GCC-High: set Graph URL environment variable to your cloud endpoint)
5. Import takes up to 1 hour; upgrades can take 2 hours
```

### Step 5: Run Setup Wizard
```
1. Open the "Setup Wizard" app in the CoE environment
2. Follow guided configuration:
   - Configure inventory sync scope (all environments or selected)
   - Set admin email for notifications
   - Configure compliance process settings
   - Enable/disable optional features
```

### Step 6: Import Additional Modules (Optional)
```
# After Core is verified working:
Import CenterOfExcellenceGovernanceComponents_x_x_x_xx_managed.zip
Import CenterOfExcellenceNurtureComponents_x_x_x_xx_managed.zip
```

---

## Configuration

### Inventory Sync Settings

| Setting | Recommended Value | Notes |
|---|---|---|
| Sync scope | All environments | Start broad, exclude specific envs if needed |
| Sync frequency | Every 24 hours | Default; reduce if you need near-real-time |
| Include deleted resources | Yes | Track cleanup activity |
| Include personal developer envs | Yes | Visibility into maker activity |

### Compliance Process Settings

| Setting | Recommended Value | Notes |
|---|---|---|
| Grace period before quarantine | 14 days | Give makers time to respond |
| Inactivity threshold | 60 days | Apps unused for 60 days flagged |
| Auto-quarantine | Off (initially) | Enable after makers are trained on compliance |
| Business justification required | Yes | All shared apps need justification |

---

## Power BI Dashboard

The CoE Power BI dashboard provides:

| Report Page | Insights |
|---|---|
| **Overview** | Total apps, flows, makers, environments, connectors |
| **App Usage** | Most/least used apps, inactive apps, user adoption |
| **Maker Activity** | Active vs inactive makers, new makers per month |
| **Connector Usage** | Which connectors are most used, premium vs standard split |
| **Environment Health** | Capacity usage, environment count, Managed Env adoption |
| **Compliance** | Compliance status, pending reviews, quarantined apps |

### Setup
```
1. Download the .pbit template from the CoE download package
2. Open in Power BI Desktop
3. Set the data source to your CoE Dataverse environment
4. Publish to Power BI service
5. Set scheduled refresh (daily, after inventory sync completes)
```

---

## Upgrade Patterns

> **Upgrade at least every 3 months.** The CoE Starter Kit evolves with Power Platform — leaving updates too long causes unexpected upgrade issues.

### Upgrade Process
```
1. Download the latest release from https://aka.ms/CoeStarterKitDownload
2. Check release notes for breaking changes or new environment variables
3. Take a manual backup of the CoE environment
4. Import the new Core components zip (upgrade replaces existing managed solution)
5. Run the Setup Wizard again to configure any new settings
6. Import updated Governance/Nurture modules
7. Verify sync flows are running successfully
8. Update Power BI dashboard with new .pbit if provided
```

### Common Upgrade Issues

| Issue | Cause | Resolution |
|---|---|---|
| Import fails with dependency error | Creator Kit outdated | Update Creator Kit first, then retry |
| Flows turned off after upgrade | Known import behavior | Manually turn flows back on |
| Environment variables lost | Upgrade reset values | Re-enter environment variable values |
| Import takes > 2 hours | Large inventory, complex upgrade | Wait; check import history for status |
| "Bad Request" warning after import | Known benign warning | Ignore; proceed with Setup Wizard |

---

## Common Customizations

The CoE Starter Kit is a reference implementation. Customize it for your org, but follow these rules:

### Do: Customize in a Separate Solution
```
1. Create a new unmanaged solution: "Contoso-CoE-Extensions"
2. Use YOUR publisher prefix (not "cat_" which is the CoE prefix)
3. Add customizations to YOUR solution
4. This survives CoE upgrades because your solution is independent
```

### Do: Common Custom Extensions
| Customization | Approach |
|---|---|
| Custom compliance questions | Add columns to CoE compliance table, update Developer Compliance Center |
| Department-specific DLP | Clone DLP Editor, add department filter |
| Custom notifications | New flow in your extension solution triggered by CoE table changes |
| Additional Power BI pages | Add pages to a copy of the .pbit, connect to same CoE tables |
| Integration with ITSM | Flow: when app quarantined → create ServiceNow ticket |

### Don't: Modify CoE Solutions Directly
- Never add components to the managed CoE solutions
- Never edit CoE flows or apps directly (changes lost on upgrade)
- Never change the `cat_` publisher prefix components
- Never use the CoE environment for non-CoE apps/flows

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Sync flows failing | Connection expired or service account password changed | Re-authenticate connections |
| Inventory incomplete | Sync scope excludes some environments | Check Setup Wizard scope settings |
| App count seems low | Sync hasn't completed yet | Wait for full sync cycle (24h) |
| Power BI shows no data | Dataverse connection not configured | Re-set data source in Power BI Desktop |
| Compliance emails not sending | Office 365 connection missing | Create Office 365 Outlook connection |

---

## Agentic Center of Enablement (Wave 1 2026)

> **Preview (April 2026), GA (June 2026):** AI-powered governance agents that automate tenant monitoring, issue detection, and remediation planning.

| Agent | Function | Human-in-the-Loop? |
|---|---|---|
| **Highlights agent** | Daily automated snapshots of key tenant activity (resource creation, capacity, changes) | No — informational only |
| **Insights agent** | Continuous scans to detect and prioritize governance issues (security, compliance, performance, adoption) | No — surfaces issues for review |
| **Action Plan agent** | Converts insights into remediation plans with clear steps | **Yes — requires admin approval before execution** |

**Relationship to existing CoE modules:** Agentic CoE complements the CoE Starter Kit. The Starter Kit provides the inventory, compliance processes, and dashboards. Agentic CoE adds AI-driven proactive monitoring and automated remediation on top.

**Important:** The Action Plan agent must have human approval for any destructive actions (quarantine, deletion, permission changes). Never configure auto-approve for destructive remediations.

---

## Anti-Patterns

- Installing CoE in the default environment (should be a dedicated production environment)
- Using a personal account for sync flows (use a dedicated service account)
- Never upgrading the CoE kit (features break, security patches missed)
- Customizing the managed CoE solution directly (lost on every upgrade)
- Enabling auto-quarantine before training makers on compliance (mass app breakage)
- Deploying Governance components before Core is stable (dependency issues)
- No Power BI dashboard (missing the primary value: visibility)
- Treating CoE as a one-time install (it needs ongoing monitoring and tuning)
- Running CoE sync flows with an unlicensed account (flows fail silently)
