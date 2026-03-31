---
name: env-strategy
description: "Power Platform environment strategy and topology. Use when: environment types, developer environments, sandbox, production, environment groups, environment routing, naming conventions, environment provisioning, environment topology, Managed Environments, environment lifecycle, multi-geo, environment variables across environments."
---

# Skill: Environment Strategy

## When to Use
Trigger when designing environment topology, choosing environment types, provisioning environments, setting up developer environments, configuring Managed Environments, planning multi-geo deployments, or establishing environment naming conventions.

---

## Environment Types

| Type | Purpose | Dataverse | Capacity Cost | Key Characteristics |
|---|---|---|---|---|
| **Production** | Live workloads | Yes | Counts against tenant | Full backup (up to 28 days), full control, cannot be reset |
| **Sandbox** | Dev/test/UAT | Yes | Counts against tenant | Can be copied, reset, deleted; 7-day backup default |
| **Developer** | Personal dev workspace | Yes | Free (does not count) | 1 per user (up to 3), auto-cleanup after 90 days inactive, no sharing |
| **Default** | Auto-created per tenant | Yes | Counts against tenant | All licensed users get Environment Maker role — NOT for production |
| **Trial** | Short-term evaluation | Yes | Free | 30-day expiry, 1 per user, auto-deleted |
| **Dataverse for Teams** | Team-scoped apps | Yes (Teams) | Included with M365 | Security follows Teams membership, limited to 1M rows / 2GB |

### Decision Table: Which Environment Type?

| Scenario | Use This Type | Why |
|---|---|---|
| Individual maker experimenting | **Developer** | Free, isolated, auto-cleanup |
| Team building a proof of concept | **Sandbox** | Shareable, resettable, low-risk |
| Formal testing / UAT | **Sandbox** (Managed) | Copy from prod, Managed Environment controls |
| Production workload | **Production** (Managed) | Full backup, governance, pipeline target |
| Quick demo for stakeholders | **Trial** | No capacity cost, self-service, 30 days |
| Teams-native app (< 1M rows) | **Dataverse for Teams** | Zero admin overhead, M365-licensed |
| CI/CD build environment | **Sandbox** | Automated reset between builds |

---

## Naming Convention

Use a consistent pattern across all environments:

```
[Org]-[Project]-[Stage]-[Region]
```

**Examples:**
| Environment | Name |
|---|---|
| Contoso HR app — Dev | `Contoso-HR-Dev-AU` |
| Contoso HR app — Test | `Contoso-HR-Test-AU` |
| Contoso HR app — UAT | `Contoso-HR-UAT-AU` |
| Contoso HR app — Production | `Contoso-HR-Prod-AU` |
| Shared services — Dev | `Contoso-Shared-Dev-AU` |
| Developer env (personal) | Auto-named: `{User}'s Environment` |

**Rules:**
- Never use special characters or spaces (Power Platform admin APIs handle them poorly)
- Include the region suffix for multi-geo tenants
- Match the environment name to the solution name where possible
- Document the naming convention in your governance wiki — consistency matters more than the specific format

---

## Standard Environment Topology

### Minimum Viable (Small Team)
```
Default (leave alone — personal productivity only)
  │
Developer environments (auto-provisioned per maker)
  │
[Project]-Dev (sandbox, unmanaged solutions)
  │
[Project]-Prod (production, managed solutions only)
```

### Recommended (Enterprise)
```
Default (locked down — DLP, no premium connectors)
  │
Developer environments (auto-provisioned, DLP-restricted)
  │
[Project]-Dev (sandbox, unmanaged, maker workspace)
  │
[Project]-Test (sandbox, Managed Env, CI/CD target, managed solutions)
  │
[Project]-UAT (sandbox, Managed Env, user acceptance)
  │
[Project]-Prod (production, Managed Env, managed solutions only)
  │
[Shared]-Services (production, shared components, CoE)
```

### Multi-Project Enterprise
```
Shared-Platform-Prod      ← CoE, shared connectors, base solution
  ├── ProjectA-Dev / Test / UAT / Prod
  ├── ProjectB-Dev / Test / UAT / Prod
  └── ProjectC-Dev / Test / UAT / Prod
```

---

## Developer Environments

Developer environments are free, personal, and isolated. They are the recommended starting point for all makers.

### Key Facts
- **Free** — included with Power Apps Developer Plan (self-service sign-up)
- **Up to 3** per user
- **Auto-cleanup** — turned off after 90 days of inactivity, then deleted if owner doesn't respond
- **Cannot share** apps or flows with other users
- **Dataverse included** — full schema creation, no capacity charge
- **No Dynamics 365 apps** — D365 apps cannot be installed
- **Managed Environments NOT included** — Developer Plan does not entitle Managed Environment features at runtime

### When to Use Developer Environments
- Learning and experimentation
- Personal productivity apps (single user)
- Initial prototyping before moving to a shared sandbox
- Testing Web API scripts against a disposable Dataverse instance

### Default Environment Routing
Automatically redirect new makers away from the default environment to personal developer environments:

```
Power Platform Admin Center → Settings → Environment routing
  → Enable "Route new makers to their own personal developer environment"
```

This prevents the default environment from becoming a dumping ground.

---

## Environment Groups

Environment groups allow administrators to manage environments as collections and apply rules consistently.

### Setup
```
Power Platform Admin Center → Environment groups → New group
  → Add environments → Apply rules
```

### Common Group Patterns
| Group | Environments | Rules Applied |
|---|---|---|
| `All-Production` | All prod environments | Managed Env enabled, strict DLP, Solution Checker enforcement |
| `All-Development` | All dev/sandbox environments | Moderate DLP, sharing limits |
| `Personal-Productivity` | Developer environments | Restrictive DLP, no premium connectors |
| `ProjectA-Lifecycle` | ProjectA Dev/Test/UAT/Prod | Project-specific DLP, pipeline stages |

### Environment Group Rules
| Rule Type | Description | Example |
|---|---|---|
| **DLP policy** | Apply data policies to the group | Block HTTP connector in production group |
| **Sharing limits** | Restrict how broadly apps can be shared | Max 20 users in personal-productivity group |
| **Solution Checker** | Enforce quality gates | Block deployment if critical issues found |
| **Managed Environment** | Auto-enable Managed Environment features | Enable for all production environments |
| **Maker welcome content** | Custom guidance for makers | Link to governance wiki |

---

## Managed Environments

Managed Environments is the governance overlay for Power Platform. It adds premium controls on top of any environment type (except Developer at runtime).

### When to Enable

| Environment Stage | Managed Environments? | Rationale |
|---|---|---|
| Production | **Always** | Full governance, telemetry, pipeline target |
| UAT | **Always** | Mirrors production governance |
| Test / CI-CD target | **Always** | Pipeline targets require Managed Environments (Feb 2026) |
| Developer (shared sandbox) | **Recommended** | Sharing limits, solution checker |
| Personal developer env | **Not required** | No entitlement under Developer Plan |
| Default | **Recommended** | Lock down with sharing limits |

> **Feb 2026 mandate:** Power Platform Pipeline target environments must be Managed Environments. Auto-enabled on pipeline targets starting February 2026.

### Key Capabilities
| Capability | What It Does |
|---|---|
| IP Firewall | Restrict access to specific IP ranges |
| IP Cookie Binding | Prevent session hijacking across IPs |
| Customer Managed Keys | Encrypt at rest with your Azure Key Vault keys |
| Lockbox | Require approval for Microsoft engineer data access |
| Weekly Digest | Usage summary emailed to admins |
| Limit Sharing | Cap how many users an app can be shared with |
| Solution Checker Enforcement | Block deployments failing quality checks |
| Export to App Insights | Telemetry to Azure Application Insights |
| Conditional Access per App | Entra ID conditional access on individual apps |
| VNet Support | Connect to your Azure Virtual Network |
| License Auto-Claim | Automatically assign licenses when users access apps |

### Licensing
Managed Environments is included with:
- Power Apps Premium (per-user)
- Power Automate Premium (per-user)
- Dynamics 365 Enterprise licenses
- Copilot Studio licenses
- Power Pages licenses

NOT included with: Developer Plan (at runtime), M365 seeded licenses, trial licenses.

---

## Environment Variable Cascading

Environment variables let you define configuration once in a solution and set different values per environment.

### Pattern
```
Solution contains:
  environmentvariabledefinition: contoso_ApiBaseUrl (type: String)
    └── environmentvariablevalue: (no default — set per environment)

Dev environment:   contoso_ApiBaseUrl = "https://api-dev.contoso.com"
Test environment:  contoso_ApiBaseUrl = "https://api-test.contoso.com"
Prod environment:  contoso_ApiBaseUrl = "https://api.contoso.com"
```

### Best Practices
- **Never set default values** in the solution for environment-specific config — force explicit values per environment
- **Use deployment settings files** to automate value injection during CI/CD (see `alm` skill)
- **Secret type** environment variables reference Azure Key Vault — use for API keys, connection strings
- **JSON type** for complex configuration (feature flags, endpoint maps)

---

## Multi-Geo Considerations

| Concern | Guidance |
|---|---|
| **Data residency** | Environments store data in the geo where they're created — cannot move after creation |
| **Cross-geo pipelines** | Power Platform Pipelines support cross-geo deployment (when enabled on host) |
| **User latency** | Create environments in the geo closest to the majority of users |
| **Compliance** | Some regulations (GDPR, data sovereignty) require data to stay in specific geos |
| **Geo availability** | Not all features are available in all geos — check [availability matrix](https://learn.microsoft.com/power-platform/availability) |

### Geo Naming in Environment Names
```
Contoso-HR-Prod-AU    ← Australia
Contoso-HR-Prod-EU    ← Europe
Contoso-HR-Prod-US    ← United States
```

---

## Environment Lifecycle

```
Create → Configure (DLP, Managed Env, security) → Active
  │
  ├── Copy (sandbox → sandbox, production → sandbox)
  │
  ├── Reset (sandbox only — wipes data, keeps config)
  │
  ├── Backup → Restore (production: up to 28 days)
  │
  └── Delete (permanent — no undo)
```

### Backup & Restore Cadence
| Environment Type | System Backup | Retention | Manual Backup |
|---|---|---|---|
| Production | Continuous (every ~1 hour) | Up to 28 days | Yes |
| Sandbox | Continuous | 7 days | Yes |
| Developer | None | None | No |
| Default | Continuous | 7 days | Yes |

### Pre-Deployment Backup
Always take a manual backup before deploying to production:

```powershell
# PowerShell — backup before deployment
$envId = "00000000-0000-0000-0000-000000000000"
$backupLabel = "Pre-deploy-v2.1.0-$(Get-Date -Format 'yyyy-MM-dd')"

# Using Power Platform admin connector or Admin API
# Power Platform Admin Center → Environments → [env] → Backups → Create
```

---

## Anti-Patterns

- **Everyone builds in the default environment** — leads to ungoverned sprawl, no ALM possible, data comingled
- **No DLP on developer environments** — makers learn bad habits with unblocked connectors, then can't deploy to prod
- **Manual environment creation for each developer** — use developer environments (free, self-service, auto-cleanup) instead
- **No Managed Environments on pipeline targets** — will break after Feb 2026 mandate
- **Skipping the test/UAT stage** — deploying from dev straight to production with no intermediate validation
- **Using production environment for development** — risk of data corruption, no reset capability
- **No naming convention** — impossible to identify environment purpose at scale
- **Ignoring environment variable cascading** — hardcoding URLs/keys per environment instead of using env vars in solutions
- **Creating sandbox environments without cleanup plan** — sandbox sprawl consumes capacity
- **No environment groups** — managing 50+ environments individually instead of as governed collections

---

## Related Skills

- `alm` — CI/CD pipelines, solution promotion across environments
- `governance` — DLP policies, tenant settings applied per environment
- `licensing` — Managed Environment licensing requirements
- `security` — Security roles and access control per environment
