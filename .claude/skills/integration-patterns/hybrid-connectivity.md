# Hybrid Connectivity

## Overview

Hybrid connectivity bridges Power Platform (cloud) with on-premises systems and Azure VNet-isolated resources. The primary tools are the on-premises data gateway, Azure VNet integration, private endpoints, and Azure Relay.

---

## On-Premises Data Gateway

### What It Does

The gateway acts as a bridge between Power Platform cloud services and on-premises data sources. It runs as a Windows service on a machine in your network.

```
Power Platform (cloud)
  ↔ Azure Relay (encrypted tunnel)
    ↔ On-premises data gateway (Windows service)
      ↔ On-premises data source (SQL Server, Oracle, SAP, file shares)
```

### Supported Data Sources

| Source | Connector |
|---|---|
| SQL Server (on-prem) | SQL Server connector |
| Oracle Database | Oracle Database connector |
| SAP | SAP ERP connector |
| File System | File System connector |
| SharePoint (on-prem) | SharePoint connector |
| IBM DB2 | DB2 connector |
| Informix | Informix connector |
| MySQL | MySQL connector |
| PostgreSQL | PostgreSQL connector |

### Installation

```
1. Download gateway from https://aka.ms/on-premises-data-gateway
2. Install on a Windows machine (Server 2019+ recommended)
   - Machine must be always on, always connected
   - Machine must be domain-joined (for Windows auth)
3. Sign in with a Power Platform admin account
4. Register the gateway with your tenant
5. Configure data source connections in Power Platform Admin Center
```

### Gateway Modes

| Mode | Description | Use Case |
|---|---|---|
| **Standard** | Single gateway, shared across users | Most scenarios |
| **Personal** | Single user, single machine | Development/testing only |

### High Availability Cluster

```
Gateway Cluster:
  Primary gateway → Same data sources
  Secondary gateway → Same data sources (failover)
  Third gateway → Same data sources (load balancing)

Setup:
  1. Install first gateway (becomes primary)
  2. Install additional gateways on different machines
  3. During install, select "Add to existing gateway cluster"
  4. All gateways in cluster must use same recovery key
```

### Gateway Sizing

| Workload | Machine Spec | Notes |
|---|---|---|
| Light (< 100 queries/hour) | 2 cores, 8GB RAM | Development |
| Medium (100-1000 queries/hour) | 4 cores, 16GB RAM | Small production |
| Heavy (> 1000 queries/hour) | 8 cores, 32GB RAM + SSD | Enterprise production |

---

## Azure VNet Integration

VNet integration allows Power Platform environments to connect to resources inside your Azure Virtual Network, providing network-level isolation.

### What VNet Integration Enables

```
Power Platform environment (with VNet integration)
  ↔ Azure VNet
    ↔ Private endpoints (Azure SQL, Storage, Key Vault)
    ↔ VNet-connected services (Azure Functions, App Service)
    ↔ VNet peering → other VNets
    ↔ VPN/ExpressRoute → on-premises
```

### Requirements

| Requirement | Details |
|---|---|
| Managed Environment | Required |
| Subnet delegation | Dedicated subnet for Power Platform |
| Subnet size | /24 recommended (254 IPs) |
| Region match | VNet must be in same region as environment |
| Azure subscription | In same tenant |

### Setup

```
Power Platform Admin Center → Environments → [env]
  → Settings → Product → Networking
  → Enable VNet integration
  → Select Azure subscription → Resource group → VNet → Subnet
  → Save (provisioning takes 15-30 minutes)
```

### Subnet Delegation

```bash
# Delegate subnet to Power Platform
az network vnet subnet update \
  --resource-group "rg-network" \
  --vnet-name "vnet-contoso" \
  --name "snet-powerplatform" \
  --delegations "Microsoft.PowerPlatform/vnetaccesslinks"
```

---

## Private Endpoints for Dataverse

Private endpoints bring Dataverse traffic onto your Azure VNet, eliminating public internet exposure.

### How It Works

```
Client → VNet → Private Endpoint → Dataverse
  (traffic stays on Microsoft backbone, no public internet)
```

### Setup

```bash
# Create private endpoint for Dataverse
az network private-endpoint create \
  --resource-group "rg-network" \
  --name "pe-dataverse-prod" \
  --vnet-name "vnet-contoso" \
  --subnet "snet-endpoints" \
  --private-connection-resource-id "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.PowerPlatform/enterprisePolicies/{policy}" \
  --group-id "dataverse" \
  --connection-name "dataverse-connection"
```

### DNS Configuration

Private endpoints require DNS resolution to the private IP:

```
Original: contoso.crm6.dynamics.com → Public IP
With PE:  contoso.crm6.dynamics.com → Private IP (10.x.x.x)

Configure:
  Azure Private DNS Zone: privatelink.crm6.dynamics.com
  Link to VNet: vnet-contoso
```

---

## Azure Relay

Azure Relay is the underlying technology for the on-premises data gateway. It can also be used directly for custom hybrid connectivity.

### When to Use Azure Relay Directly

| Scenario | Use Gateway | Use Relay Directly |
|---|---|---|
| Standard data source (SQL, Oracle) | Yes | No |
| Custom application behind firewall | No | Yes |
| WebSocket connectivity needed | No | Yes |
| Existing gateway infrastructure | Yes | No |

### Relay Hybrid Connection

```
Power Automate flow → HTTP action
  → Azure Relay Hybrid Connection URL
    → On-premises listener (your custom app)
      → On-premises API / service
```

---

## Decision Table: Which Connectivity Method?

| Scenario | Method | Why |
|---|---|---|
| SQL Server on-prem | **Gateway** | Built-in connector support |
| Azure SQL (private) | **VNet integration** or **Private endpoint** | Network-level security |
| On-prem REST API | **Gateway** (HTTP connector) or **Azure Relay** | Gateway if simple, Relay if WebSocket |
| Azure Key Vault (private) | **VNet integration** | Access via VNet-connected subnet |
| SAP ERP on-prem | **Gateway** | SAP connector through gateway |
| Azure Storage (private) | **Private endpoint** | No public access to storage |
| Legacy mainframe | **Gateway** + custom connector | Bridge via gateway machine |

---

## Security Considerations

### Gateway Security

| Control | Implementation |
|---|---|
| Encryption in transit | All gateway traffic is TLS-encrypted via Azure Relay |
| Authentication | Entra ID for gateway management, data source credentials stored encrypted |
| Network | Gateway machine needs outbound HTTPS only (port 443) — no inbound ports |
| Credentials | Data source credentials stored encrypted on gateway machine |
| Audit | Gateway usage logged in Power Platform audit |

### VNet Security

| Control | Implementation |
|---|---|
| NSG rules | Apply Network Security Groups to Power Platform subnet |
| Service tags | Use `PowerPlatformInfra` service tag for NSG rules |
| No public IP | Private endpoints ensure no public internet exposure |
| DNS | Use Azure Private DNS zones for name resolution |

### Key Best Practices

- **Least privilege:** Gateway service account should have minimum required permissions on data sources
- **Separate subnets:** Use dedicated subnets for Power Platform delegation and private endpoints
- **Monitor gateway health:** Set up alerts for gateway offline/degraded status
- **Rotate credentials:** Regularly rotate data source credentials stored in gateway
- **Audit gateway access:** Review who has gateway admin permissions

---

## Monitoring

### Gateway Health

```
Power Platform Admin Center → Data (preview) → On-premises data gateways
  → [gateway] → Status, version, machine name
  → Monitor: CPU, memory, concurrent queries
```

### Gateway Logs

```
On the gateway machine:
  Event Viewer → Applications and Services Logs → On-premises data gateway service

Or:
  C:\Users\PBIEgwService\AppData\Local\Microsoft\On-premises data gateway\
    → GatewayCore*.log (main logs)
    → GatewayCore*.report (performance reports)
```

---

## Anti-Patterns

- On-premises gateway as the ONLY integration method (single point of failure, bottleneck)
- Gateway on a developer's laptop (must be always-on server)
- No gateway cluster (single gateway = single point of failure)
- VNet integration without NSG rules (no network-level filtering)
- Public Dataverse endpoints when private endpoint is available
- Gateway without monitoring (goes offline, nobody knows)
- Storing data source credentials in plain text (always use encrypted gateway storage)
- Single gateway for dev + test + prod (cross-environment dependency)
- Not sizing the gateway machine (underpowered = slow queries)
- Gateway version not updated (security patches missed, compatibility issues)
