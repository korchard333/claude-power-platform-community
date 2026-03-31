# Compliance & Audit

## Overview

Power Platform provides multiple layers of audit logging, data protection, and compliance tooling. This file covers Dataverse audit logging, Microsoft Purview integration, data residency controls, GDPR compliance, and encryption options.

---

## Audit Logging

### Dataverse Audit Log

Dataverse has built-in audit logging that captures data changes at the record and field level.

#### Enable Auditing
```
Power Platform Admin Center → Environments → [env] → Settings
  → Auditing → Start Auditing

Or via solution:
  Settings → Administration → System Settings → Auditing tab
    ☑ Start Auditing
    ☑ Audit user access (log every user login)
    ☑ Read auditing (log record reads — high volume, use selectively)
```

#### Configure Per-Table Auditing
```
Dataverse → Tables → [table] → Properties → Advanced options
  ☑ Audit changes to its data

Per-column:
  Table → Columns → [column] → Advanced options
    ☑ Enable auditing
```

#### What Gets Logged

| Event Type | Captured Data | Enabled By Default |
|---|---|---|
| **Create** | New record values | Yes (when table auditing on) |
| **Update** | Old value → new value per field | Yes (when table auditing on) |
| **Delete** | Deleted record values | Yes (when table auditing on) |
| **User access** | Login timestamp, user, client | No (enable separately) |
| **Read** | Record access (who read what) | No (high volume — enable selectively) |
| **Security changes** | Role assignments, privilege changes | Yes |
| **Metadata changes** | Schema changes (columns added/removed) | Yes |

#### Query Audit History

```bash
# Web API — get audit history for a specific record
GET /api/data/v9.2/audits?$filter=_objectid_value eq '{record-guid}'
  &$orderby=createdon desc
  &$top=50
```

```powershell
# PowerShell — retrieve audit log
$baseUrl = "https://[org].api.crm.dynamics.com/api/data/v9.2"
$recordId = "00000000-0000-0000-0000-000000000000"

Invoke-RestMethod -Uri "$baseUrl/audits?`$filter=_objectid_value eq '$recordId'&`$orderby=createdon desc&`$top=50" `
    -Headers @{
        "Authorization" = "Bearer $token"
        "OData-Version" = "4.0"
    }
```

#### Audit Log Retention

| Setting | Default | Configurable |
|---|---|---|
| Retention period | 30 days | Yes — up to "forever" (no deletion) |
| Storage impact | ~1-5% of DB capacity | Monitor via Admin Center capacity page |
| Partitioning | Automatic (by date) | Yes — delete old partitions to free capacity |

```
Power Platform Admin Center → Environments → [env] → Settings
  → Auditing → Audit Log Management
    → Set retention period
    → Delete logs older than [X days]
```

> **Warning:** Deleting audit logs is irreversible. Archive to external storage before deleting if needed for compliance.

---

### Microsoft Purview Integration

Microsoft Purview (formerly Microsoft 365 Compliance Center) captures Power Platform activity at the tenant level — distinct from Dataverse audit logs.

#### What Purview Captures

| Activity | Source | Example |
|---|---|---|
| **App launch** | Power Apps | User launched "Expense Report" app |
| **Flow run** | Power Automate | Flow "Invoice Processing" executed |
| **Environment create/delete** | Admin | Admin created "Project-A-Dev" environment |
| **DLP policy change** | Admin | DLP policy "Baseline" modified |
| **Connector usage** | Power Apps / Power Automate | App used SharePoint connector |
| **Solution import/export** | ALM | Solution "HRApp" imported to production |
| **Permission change** | Admin | App shared with security group |

#### Enable Purview for Power Platform
```
1. Microsoft Purview Compliance Portal → Audit → Audit search
2. Activities are logged automatically — no explicit enablement needed
3. Search for Power Platform activities using the activity filter
4. Filter by: PowerApps, Power Automate, Power Platform Admin
```

#### Purview Audit Log Retention

| License | Default Retention | Max Retention |
|---|---|---|
| E3 | 180 days | 180 days |
| E5 | 365 days | 10 years (with retention policy) |
| E5 Compliance add-on | 365 days | 10 years |

#### Search Power Platform Activities
```
Purview Compliance Portal → Audit → Search
  Activities: Select "Power Platform" category
  Date range: Last 7 days
  Users: (specific user or all)
  → Search
  → Export results to CSV
```

---

### CoE Starter Kit Audit Integration

The CoE Starter Kit provides a pre-built integration between Purview audit logs and Dataverse:

```
1. Set up the Audit Log connector in the CoE environment
2. Requires an Azure App Registration with:
   - Office 365 Management APIs permission
   - ActivityFeed.Read scope
3. Sync flow pulls audit events into CoE Dataverse tables
4. Power BI dashboard visualizes audit data
```

---

## Data Residency

### How Data Residency Works in Power Platform

| Component | Data Location | Control |
|---|---|---|
| **Dataverse database** | Geo where environment was created | Cannot be moved after creation |
| **File attachments** | Same geo as Dataverse database | Follows environment |
| **Audit logs (Dataverse)** | Same geo as environment | Follows environment |
| **Audit logs (Purview)** | Tenant's M365 geo | Follows M365 tenant location |
| **Power Automate flow definitions** | Same geo as environment | Follows environment |
| **Power Apps app definitions** | Same geo as environment | Follows environment |
| **Copilot Studio data** | Depends on agent's environment geo | Follows environment |

### Geo Options

| Geo | Regions Included | Dataverse URL Pattern |
|---|---|---|
| North America | US, Canada (separate) | `*.crm.dynamics.com` |
| Europe | EU member states, UK (separate) | `*.crm4.dynamics.com` (UK), `*.crm16.dynamics.com` (FR) |
| Asia Pacific | AU, JP, IN, SG, KR | `*.crm6.dynamics.com` (AU) |
| South America | Brazil | `*.crm2.dynamics.com` |
| Government | US Gov (GCC, GCC-H, DoD) | `*.crm9.dynamics.com` (GCC) |

### Data Residency Best Practices

- **Create environments in the correct geo from the start** — you cannot move an environment's data after creation
- **Document data residency requirements** before provisioning environments
- **Use multi-geo topology** when users span regions with different data sovereignty requirements
- **Cross-geo Power Platform Pipelines** are supported (when enabled) but data flows through the pipeline host geo temporarily

---

## GDPR Compliance

### Data Subject Rights

Power Platform supports GDPR data subject requests (DSRs):

| Right | How to Fulfill | Tool |
|---|---|---|
| **Right to access** | Export user's data from Dataverse | Dataverse export, Power Platform admin API |
| **Right to erasure** | Delete user's data and account | Remove user from environments, delete records |
| **Right to rectification** | Correct inaccurate data | Update records via app or API |
| **Right to portability** | Export data in machine-readable format | Dataverse data export (CSV, Excel, API) |
| **Right to restriction** | Stop processing user's data | Disable user account, revoke security roles |

### DSR Discovery
```powershell
# Find all resources owned by a user
$userId = "user-object-id"

# Apps owned by user
Get-AdminPowerApp -Owner $userId

# Flows owned by user
Get-AdminFlow -Owner $userId

# Connections owned by user
Get-AdminPowerAppConnection -Owner $userId

# Environments created by user
Get-AdminPowerAppEnvironment -CreatedBy $userId
```

### DSR Execution
```powershell
# Delete user's apps
Get-AdminPowerApp -Owner $userId | Remove-AdminPowerApp

# Delete user's flows
Get-AdminFlow -Owner $userId | Remove-AdminFlow

# Remove user from all environments
# (iterate environments, remove user's security roles)
```

### Data Retention After User Deletion
| Data Type | Retention After User Deletion |
|---|---|
| Dataverse records owned by user | Remain (ownership reassigned or orphaned) |
| Apps created by user | Remain (ownership reassigned) |
| Flows created by user | Remain (can be turned off or reassigned) |
| Audit logs | Retained per audit retention policy |
| Connections | Deleted with user |

---

## Encryption

### Encryption at Rest

| Feature | Description | Requirement |
|---|---|---|
| **Platform-managed keys** | Default encryption for all Dataverse data | Always on, no config needed |
| **Customer-managed keys (CMK)** | Encrypt with your Azure Key Vault key | Managed Environments + Key Vault |
| **Self-managed key rotation** | You control key rotation schedule | CMK enabled |

### Customer-Managed Keys (CMK) Setup
```
Prerequisites:
  1. Managed Environment enabled
  2. Azure Key Vault in same tenant
  3. Key Vault configured with:
     - Soft delete enabled
     - Purge protection enabled
     - RSA key (2048-bit minimum)
  4. Power Platform service principal granted key permissions

Steps:
  1. Power Platform Admin Center → Environments → [env] → Settings
  2. Encryption → Manage keys
  3. Select "Customer-managed key"
  4. Enter Key Vault URL and key name
  5. Validate and apply
```

> **Warning:** If the CMK key becomes inaccessible (deleted, expired, Key Vault locked), the environment becomes inaccessible until the key is restored.

### Encryption in Transit
- All Power Platform traffic uses TLS 1.2+
- Dataverse API calls: HTTPS only
- No unencrypted endpoints available

---

## Lockbox

Microsoft Lockbox requires explicit customer approval before any Microsoft engineer can access your data.

### How It Works
```
1. Microsoft engineer submits access request (for support incident)
2. Lockbox routes approval to your designated approvers
3. Approver reviews scope, duration, and justification
4. Approve or deny within the approval window
5. If approved: time-limited access granted (logged and audited)
6. If denied or expired: no access granted
```

### Setup
```
Prerequisites:
  - Managed Environment enabled
  - Global Admin or Compliance Admin role

Power Platform Admin Center → Environments → [env] → Settings
  → Lockbox → Enable
  → Configure approvers (security group or specific users)
```

---

## IP Firewall

Restrict which IP addresses can access a Dataverse environment.

### Configuration
```
Power Platform Admin Center → Environments → [env] → Settings
  → IP Firewall → Enable

  Allowed IP ranges:
    - 203.0.113.0/24  (corporate office)
    - 198.51.100.0/24 (VPN egress)

  Mode:
    ☐ Audit only (log violations, don't block)
    ☑ Enforce (block access from non-allowed IPs)
```

### IP Cookie Binding
Prevent session token theft by binding sessions to the originating IP:
```
Power Platform Admin Center → Environments → [env] → Settings
  → IP Cookie Binding → Enable

Effect: If a session token is used from a different IP than where it was issued,
the session is invalidated.
```

### Considerations
| Consideration | Guidance |
|---|---|
| Mobile users | Add mobile VPN IP ranges to allow-list |
| Power Automate flows | Flows run in Azure — add Azure datacenter IPs or use service tags |
| Third-party integrations | Add integration service IPs to allow-list |
| Testing | Start in audit mode to identify blocked requests before enforcing |

---

## Compliance Frameworks

| Framework | Power Platform Support | Key Features |
|---|---|---|
| **SOC 1/2** | Covered under Microsoft cloud SOC reports | Audit logging, access controls |
| **ISO 27001** | Microsoft cloud certification | Encryption, access management |
| **GDPR** | DSR support, data residency, audit | See GDPR section above |
| **HIPAA** | BAA available for Dynamics 365 | Managed Environments, CMK, audit |
| **FedRAMP** | GCC/GCC-High/DoD environments | US government compliance |
| **IRAP** | Australia (Protected) | Australian geo, Managed Environments |

### Compliance Checklist for Power Platform

```markdown
## Compliance Readiness Checklist

### Data Protection
- [ ] Customer-managed keys enabled on production environments
- [ ] IP firewall configured for production environments
- [ ] IP cookie binding enabled
- [ ] Lockbox enabled for production environments
- [ ] TLS 1.2+ enforced (default — verify no downgrades)

### Audit & Monitoring
- [ ] Dataverse auditing enabled on all production tables
- [ ] User access auditing enabled
- [ ] Purview audit log retention set to organizational requirement
- [ ] CoE Starter Kit deployed for resource inventory
- [ ] Power BI compliance dashboard configured

### Access Control
- [ ] Conditional access policies applied to Power Apps
- [ ] Managed Environments enabled on all non-dev environments
- [ ] Sharing limits configured
- [ ] Tenant isolation enabled (if required)
- [ ] Service principals used for all automation (no personal accounts)

### Data Residency
- [ ] All environments created in correct geo for compliance requirements
- [ ] Data residency requirements documented per project
- [ ] Cross-geo data flow assessed and approved
```

---

## Anti-Patterns

- **Audit logging disabled** — no trail of who changed what, fails compliance audits
- **Read auditing enabled on all tables** — massive storage consumption, degraded performance
- **Audit logs never reviewed** — logging without monitoring is security theater
- **No Purview integration** — missing tenant-level activity visibility
- **Customer-managed keys without key protection** — if Key Vault key is lost, environment is inaccessible
- **IP firewall without audit mode first** — blocks legitimate users on first enable
- **GDPR DSR process not documented** — must respond within 30 days, no time to figure it out
- **Data residency chosen by convenience, not compliance** — environment created in wrong geo, data cannot be moved
- **Lockbox not enabled in regulated environments** — Microsoft engineers can access data without explicit approval
- **Compliance treated as one-time checklist** — compliance is ongoing, needs regular review and audit
