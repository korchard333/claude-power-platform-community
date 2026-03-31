---
name: licensing
description: "Power Platform licensing and cost optimization. Use when: license types, per user, per app, pay-as-you-go, premium, Copilot Studio licensing, Power Automate licensing, AI Builder credits, Copilot Credits, Managed Environments licensing, capacity, API request limits, cost optimization, feature-to-license mapping."
---

# Skill: Power Platform Licensing

## When to Use
Trigger when determining license requirements for a solution, mapping features to license tiers, planning capacity, evaluating cost models, or troubleshooting license enforcement errors.

---

## License Types at a Glance

### Power Apps

| License | Price (USD) | Scope | Key Entitlements |
|---|---|---|---|
| **Power Apps Premium** | $20/user/month ($12 at 2000+ users) | Per user | Unlimited custom apps, unlimited Power Pages websites, premium connectors, Dataverse, Managed Environments |
| **Power Apps per app** | $5/user/app/month | Per user per app | One app OR one Power Pages website per license, stackable |
| **Pay-as-you-go** | $10/active user/app/month | Per app via Azure | No upfront commitment, billed to Azure subscription |
| **Developer Plan** | Free | Per user (individual) | Full premium features, single-user developer environment, no sharing |
| **M365 seeded** | Included with M365 | Per user | Standard connectors only, no premium, no Dataverse (except default env) |

### Power Automate

| License | Price (USD) | Scope | Key Entitlements |
|---|---|---|---|
| **Power Automate Premium** | $15/user/month | Per user | Unlimited cloud flows, attended RPA, premium connectors, process mining (50MB data), AI Builder credits (until Nov 2026) |
| **Power Automate Process** | $150/bot/month | Per automation | Unattended RPA, unlimited users for the process, one machine session |
| **Power Automate Hosted Process** | $215/bot/month | Per automation | Process license + hosted machine capacity |
| **Pay-as-you-go** | $0.60/cloud flow run, $3.00/desktop flow run | Per run via Azure | Premium cloud and desktop flows, billed to Azure |
| **M365 seeded** | Included with M365 | Per user | Standard connectors only, no premium, no RPA |

### Copilot Studio

| License | Price (USD) | Scope | Key Entitlements |
|---|---|---|---|
| **Copilot Studio** | Per tenant (check current pricing) | Tenant | 25,000 Copilot Credits/month, standard + premium + custom connectors, Dataverse (5GB DB, 20GB file, 2GB log) |
| **Copilot Credits prepaid pack** | Per pack | Tenant/environment | Additional Copilot Credits capacity |
| **Pay-as-you-go** | Per Copilot Credit via Azure | Per use | No upfront commitment, billed monthly |

> **Sept 2025 change:** Copilot Studio billing currency changed from "messages" to "Copilot Credits." No change in quantity per prepaid pack or pay-as-you-go rate.

### Copilot Credit Consumption Rates

| Action | Credits Consumed |
|---|---|
| Regular (non-generative AI) response | 1 credit |
| Generative AI answer (over your data) | 2 credits |
| AI Builder action (in agent/agent flow context) | Varies by action type |

### Power Pages

| License | Scope | Key Entitlements |
|---|---|---|
| **Per website** | Per site | Authenticated user capacity (bundled) |
| **Authenticated users** | Per user/site/month | Access to authenticated areas |
| **Anonymous users** | Per user/site/month | Access to public pages |
| **Pay-as-you-go** | Via Azure | Per authenticated/anonymous user |

> Power Pages is also accessible via Power Apps Premium (unlimited websites).

---

## Feature-to-License Mapping

### What Requires Premium?

| Feature | License Required | Why |
|---|---|---|
| **Custom connectors** | Premium (Power Apps or Power Automate) | Not included in M365 seeded |
| **Premium connectors** (SQL, HTTP with Entra, etc.) | Premium | Not included in M365 seeded |
| **On-premises data gateway** | Premium | Gateway connections are premium |
| **Dataverse** (beyond default env) | Premium | Dataverse requires premium or Dynamics license |
| **Code Apps** | Premium | Code Apps = custom app = premium |
| **Elastic tables** | Premium + capacity | Additional capacity charges apply |
| **Managed Environments** (runtime) | Premium or Dynamics | Not included in Developer Plan or M365 |
| **AI Builder** | Premium + Copilot Credits or AI Builder credits | Credits consumed per use |
| **Desktop flows (RPA)** | Power Automate Premium (attended) or Process (unattended) | Separate from cloud flow licensing |
| **Process Mining** | Power Automate Premium | 50MB data per user license |

### What's Included in M365?

| Included | NOT Included |
|---|---|
| Standard connectors (SharePoint, Outlook, Teams, Excel, etc.) | Premium connectors |
| Canvas apps using standard connectors | Custom connectors |
| Cloud flows using standard connectors | On-premises data gateway |
| Power Apps in Teams (Dataverse for Teams) | Dataverse (full, outside Teams) |
| Up to 6,000 API requests/day | Additional API capacity |

### Dynamics 365 Seeded Rights

Users with Dynamics 365 Enterprise licenses get seeded Power Apps and Power Automate rights:
- Power Apps usage within the context of the Dynamics 365 application
- Power Automate usage within the context of Dynamics 365
- Premium connector access (within Dynamics context)
- Dataverse access (within the Dynamics 365 environment)
- Managed Environment entitlement

> **Important:** Seeded rights are "within context" — building standalone apps/flows unrelated to the D365 application may require separate licensing.

---

## Capacity

### Dataverse Storage Capacity

| Type | Description | Included Per Tenant |
|---|---|---|
| **Database** | Row data, metadata | Varies by license count |
| **File** | Attachments, images, notes | Varies by license count |
| **Log** | Audit logs, activity logs | Varies by license count |

**Check capacity:** `Power Platform Admin Center → Resources → Capacity`

### API Request Limits

| License | Daily Limit (per user/flow) |
|---|---|
| Power Apps Premium / Power Automate Premium | 40,000 requests/day |
| Power Automate Process | 250,000 requests/day |
| M365 seeded | 6,000 requests/day |
| Dynamics 365 Enterprise | 20,000 requests/day |
| Pay-as-you-go (per app) | 6,000 requests/user/app/day |

> **Protection limits:** Separate from entitlement limits. If a user/flow exceeds protection limits (e.g., 6,000 requests per 5-minute window), requests are throttled with HTTP 429 responses. Use `Retry-After` header.

### API Request Overage

With pay-as-you-go enabled, requests above the daily entitlement are billed to Azure:
```
Overage rate: $0.00004 per request (illustrative — check current pricing)

Example:
  User with 40,000/day entitlement uses 50,000 in a day
  Overage: 10,000 requests × $0.00004 = $0.40
```

---

## AI Builder / Copilot Credits

### Current State (2025-2026 Transition)

| Timeline | What Happens |
|---|---|
| **Now** | AI Builder features in Power Apps/Automate consume AI Builder credits first, then Copilot Credits |
| **Nov 2025** | New customers cannot purchase AI Builder add-ons — must buy Copilot Credits |
| **Nov 2026** | Seeded AI Builder credits (from Premium licenses) removed for ALL customers |
| **Ongoing** | Agents and agent flows always consume Copilot Credits (never AI Builder credits) |

### Credit Sources

| Source | Credits | Notes |
|---|---|---|
| Power Apps Premium (seeded) | 5,000 AI Builder credits/user/month | Removed Nov 2026 |
| Power Automate Premium (seeded) | 5,000 AI Builder credits/user/month | Removed Nov 2026 |
| AI Builder add-on | 1,000,000 credits/add-on/month | Renewal only (existing customers) |
| Copilot Credits prepaid pack | Per pack | New currency for all AI features |
| Pay-as-you-go | Per use via Azure | No upfront commitment |

### Monitoring AI/Copilot Credit Usage
```
Power Platform Admin Center → Resources → Capacity
  → AI Builder credits tab (shows consumption per environment)
  → Copilot Credits tab (shows consumption per environment)
```

---

## Cost Optimization Patterns

### Pattern 1: Start with Pay-as-you-go
```
New app, uncertain adoption → Enable pay-as-you-go
  → Monitor usage for 3 months
  → If consistent usage: switch to per-user licenses (cheaper at scale)
  → If sporadic usage: keep pay-as-you-go (cheaper for low volume)
```

**Break-even analysis:**
```
Pay-as-you-go:  $10/active user/app/month
Per-user:       $20/user/month (unlimited apps)

Break-even: 2 apps per user
  - User uses 1 app → pay-as-you-go cheaper ($10 vs $20)
  - User uses 3 apps → per-user cheaper ($20 vs $30)
```

### Pattern 2: Per-App for Targeted Deployment
```
Specific app used by a large group of occasional users
  → Per-app license ($5/user/app/month)
  → Cheaper than per-user if users only need one app
  → Stackable: user can have multiple per-app licenses
```

### Pattern 3: Process License for Shared Automations
```
Critical business process (e.g., invoice processing)
  → One Process license ($150/month) covers:
    - The main flow
    - All child flows
    - All associated flows in the same solution
    - Unlimited users
  → Much cheaper than licensing every user who benefits
```

### Pattern 4: License Auto-Claim
```
Power Platform Admin Center → Settings → License auto-claim
  → Enable auto-claim for Power Apps
  → When a user opens an app requiring Premium, a license is auto-assigned
  → Prevents over-provisioning (only users who actually use get licenses)
```

### Pattern 5: Monitor Before Buying
```
1. Deploy CoE Starter Kit for inventory visibility
2. Identify which apps use premium features
3. Identify how many users actively use each app
4. Map to optimal license mix (per-user vs per-app vs pay-as-you-go)
5. Purchase based on actual usage, not estimates
```

---

## Common Gotchas

| Gotcha | Impact | Prevention |
|---|---|---|
| **Code Apps = Premium** | Every user of a Code App needs Premium or per-app license | Confirm licensing before building Code Apps for broad audiences |
| **Custom connectors = Premium** | Any app using a custom connector requires Premium | Document connector requirements in spec phase |
| **On-prem gateway = Premium** | Gateway connections require Premium licensing | Plan for Premium if using on-premises data |
| **Elastic tables = Premium + capacity** | Elastic tables need Premium AND consume extra storage capacity | Evaluate storage cost before choosing elastic tables |
| **AI Builder credits disappearing** | Seeded credits removed Nov 2026 — plan for Copilot Credits | Budget for Copilot Credits or pay-as-you-go for AI features |
| **API request limits** | Exceeded limits = throttled (429 errors) | Monitor via Admin Center, buy capacity add-ons if needed |
| **Pay-as-you-go without monitoring** | Unexpected Azure bills | Set Azure cost alerts, review monthly |
| **M365 users hitting premium features** | App fails at runtime with licensing error | Test with M365-only user before deploying |
| **Process license per environment** | Process license covers one environment only | Budget for Process license per environment (dev/test/prod) |
| **Managed Environments without Premium** | Developer Plan doesn't entitle Managed Env at runtime | Ensure production users have Premium or Dynamics licenses |

---

## License Enforcement Errors

| Error | Cause | Resolution |
|---|---|---|
| "This app requires a Power Apps Premium license" | User lacks Premium or per-app license | Assign license or enable pay-as-you-go |
| "EntitlementNotAvailable" (AI Builder) | No AI Builder or Copilot Credits in environment | Allocate credits or enable pay-as-you-go |
| "QuotaExceeded" (API requests) | User/flow exceeded daily API request limit | Wait until next day or purchase capacity add-on |
| HTTP 429 (Too Many Requests) | Protection limit exceeded (6,000 req/5 min) | Implement retry with `Retry-After` header |
| "Flow needs a Premium license" | Flow uses premium connector without license | Assign Premium license to flow owner or Process license to flow |
| "You need a license to use this feature" | Managed Environment feature without entitlement | Assign Premium, Dynamics, or appropriate license |

---

## License Decision Tree

```
Does the app/flow use premium connectors, custom connectors, or Dataverse?
  ├── No → M365 seeded license is sufficient
  └── Yes → How many users?
        ├── < 10 users → Per-app ($5/user/app)
        ├── 10-50 users using 1-2 apps → Per-app ($5/user/app)
        ├── 50+ users or 3+ apps per user → Per-user Premium ($20/user)
        └── Uncertain adoption → Pay-as-you-go ($10/active user/app)

Does the flow run unattended RPA?
  ├── No → Power Automate Premium ($15/user) for the flow owner
  └── Yes → Power Automate Process ($150/bot) per machine session

Does the solution use AI Builder or Copilot Studio?
  ├── Light usage → Seeded credits (until Nov 2026) or pay-as-you-go
  ├── Moderate usage → Copilot Credits prepaid pack
  └── Heavy usage → Copilot Credits prepaid pack + pay-as-you-go overflow
```

---

## Anti-Patterns

- **Building with premium features without confirming licenses** — app works in dev (developer has Premium), fails for end users (who don't)
- **Ignoring API request limits** — designing high-throughput integrations without checking protection limits
- **Using pay-as-you-go without Azure cost alerts** — runaway costs from unexpected usage spikes
- **Over-licensing** — buying per-user Premium for 500 users when only 50 use premium features (use per-app instead)
- **Under-licensing** — not licensing flow owners, causing silent flow failures
- **Assuming M365 includes everything** — M365 only covers standard connectors; premium features require separate licensing
- **Ignoring the AI Builder credit sunset** — planning for AI features without budgeting for Copilot Credits post-Nov 2026
- **Not using license auto-claim** — manually assigning licenses instead of letting the platform assign on first use
- **Testing only with admin accounts** — admins have full licenses; test with representative end-user licenses
- **No cost monitoring** — deploying solutions without tracking license consumption or API usage

---

## Related Skills

- `env-strategy` — Managed Environments licensing requirements
- `governance` — License compliance monitoring via CoE Starter Kit
- `architecture` — License implications of architecture decisions
- `code-apps` — Code Apps require Premium licensing
- `copilot-studio` — Copilot Studio licensing and Copilot Credits
