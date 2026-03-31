# Copilot Studio — MCP Integration

## Overview

The Model Context Protocol (MCP) is the native tool pattern for Copilot Studio. MCP tools
provide a standardized way for agents to interact with external systems, data sources, and
APIs. In Copilot Studio, MCP tools are surfaced as agent actions through the connector
infrastructure.

---

## MCP as the Tool Pattern

### How MCP Works in Copilot Studio

MCP defines a standard interface for tools that AI agents can discover and invoke:

1. **Tool discovery** — Agent discovers available MCP tools and their schemas at design time
2. **Tool selection** — AI evaluates the user's request and selects the appropriate tool
3. **Tool invocation** — Agent calls the MCP server with structured input
4. **Result handling** — Agent receives structured output and incorporates it into the response

### MCP Tool Definition

```json
{
  "name": "get_customer_orders",
  "description": "Retrieve recent orders for a customer by customer ID",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customerId": {
        "type": "string",
        "description": "The unique customer identifier"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum number of orders to return",
        "default": 10
      }
    },
    "required": ["customerId"]
  }
}
```

### MCP Server Types

| Server Type | Description | Example |
|---|---|---|
| **Remote MCP server** | Hosted externally, accessed via HTTP/SSE | Third-party API wrapper |
| **Dataverse MCP server** | Built-in MCP server for Dataverse data | Query Dataverse tables via MCP |
| **Custom MCP server** | Organization-hosted, custom implementation | Internal microservices |

---

## Connector Infrastructure

MCP tools in Copilot Studio are accessed through the Power Platform connector layer, which
provides enterprise-grade infrastructure.

### How MCP Tools Become Agent Actions

```
MCP Server (external)
      |
      | HTTP/SSE transport
      |
Power Platform Connector (wraps MCP server)
      |
      | Connector action
      |
Copilot Studio Agent (invokes action)
```

### Adding an MCP Tool to an Agent

```
1. Register MCP server as a custom connector (or use built-in MCP connector)
2. Configure authentication on the connector
3. In Copilot Studio, open the agent
4. Navigate to Actions → Add action
5. Select the MCP connector
6. Choose specific tools to expose to the agent
7. Configure tool descriptions (improve AI selection accuracy)
8. Test with representative queries
```

---

## VNet Support for Private MCP Servers

For MCP servers running in private networks, Copilot Studio supports VNet integration
through the on-premises data gateway or VNet data gateway.

### Private MCP Server Architecture

```
Copilot Studio (cloud)
      |
      | Via VNet data gateway
      |
Azure VNet
      |
      | Private endpoint
      |
MCP Server (private)
```

### Configuration

| Component | Setting |
|---|---|
| **VNet data gateway** | Deploy in the same VNet as the MCP server |
| **Private DNS** | Configure DNS resolution for the MCP server endpoint |
| **Network security group** | Allow inbound from VNet data gateway subnet |
| **Connector** | Configure custom connector to use the VNet data gateway |

### When to Use VNet

- MCP server accesses sensitive internal data
- Compliance requirements mandate private network communication
- MCP server is hosted in Azure VNet or on-premises network
- Data must not traverse the public internet

---

## DLP Policy Application

Data Loss Prevention (DLP) policies apply to MCP tools through their connector classification.

### DLP and MCP Tools

| DLP Concept | Application to MCP |
|---|---|
| **Connector classification** | MCP connector classified as Business, Non-Business, or Blocked |
| **Action-level control** | Individual MCP tools can be allowed or blocked |
| **Data group** | MCP connector assigned to a data group alongside other connectors |
| **Cross-group restriction** | MCP tools cannot exchange data with connectors in a different group |

### DLP Configuration for MCP

```
Environment: Production
Policy: Contoso Production DLP

Connector: Contoso MCP Server (custom)
Classification: Business
Allowed actions:
  - get_customer_orders (read)
  - get_product_catalog (read)
Blocked actions:
  - delete_customer (destructive)
  - update_pricing (sensitive)

Data group: Business data
Grouped with: Dataverse, SharePoint, Office 365
```

---

## Authentication

### Authentication Methods for MCP Servers

| Method | Description | Use Case |
|---|---|---|
| **Managed identity** | Azure-managed identity, no credentials to manage | Azure-hosted MCP servers |
| **OAuth 2.0** | Standard OAuth flow with Entra ID or external IdP | Enterprise MCP servers with user context |
| **API key** | Static key passed in header or query parameter | Simple integrations, development/testing |
| **Certificate** | Client certificate authentication | High-security environments |

### Authentication Configuration

```
Custom connector authentication setup:
  1. Open the custom connector definition
  2. Navigate to Security tab
  3. Select authentication type
  4. For OAuth 2.0:
     - Identity provider: Azure Active Directory
     - Client ID: (from app registration)
     - Client secret: (from app registration)
     - Resource URL: https://mcp-server.contoso.com
  5. For API key:
     - Parameter name: x-api-key
     - Parameter location: Header
  6. Test connection
```

### Authentication Best Practices

- Use managed identity for Azure-hosted MCP servers (no credential rotation needed)
- Use OAuth 2.0 when user identity context is required by the MCP server
- Never use API keys in production for sensitive data access
- Rotate API keys on a regular schedule if used
- Store credentials in Azure Key Vault, reference via connector configuration

---

## When to Use MCP vs Alternatives

### Decision Matrix

| Scenario | MCP Tool | Power Automate Plugin Action | Custom API (Dataverse) | Direct Connector |
|---|---|---|---|---|
| **Read external data** | Preferred | Possible | No | Possible |
| **Query with AI selection** | Preferred | Possible | Possible | Limited |
| **Write/update external system** | Possible | Preferred | Preferred | Possible |
| **Complex multi-step workflow** | No | Preferred | No | No |
| **Dataverse CRUD** | Via Dataverse MCP | Possible | Preferred | Preferred |
| **Real-time data retrieval** | Preferred | Slower (flow overhead) | Preferred | Preferred |
| **Schema discovery** | No (use Web API) | No | Yes | No |
| **Batch operations** | No | Preferred | Preferred | Possible |

### Guidelines

- **Use MCP tools** when the agent needs to dynamically discover and invoke read/query
  operations on external data sources
- **Use Power Automate plugin actions** when the operation involves multi-step orchestration,
  approvals, or complex business logic
- **Use Custom API (Dataverse)** when building reusable server-side actions with full
  transaction support
- **Use direct connectors** when a prebuilt connector exists and the operation is straightforward
- **Do not use MCP tools** for schema creation, bulk data operations, or destructive writes
  where transactional integrity is critical

---

## Dataverse MCP Server

The Dataverse MCP server provides a built-in MCP interface for querying Dataverse data
from Copilot Studio agents.

### Capabilities

| Capability | Description |
|---|---|
| **Table discovery** | Agent discovers available Dataverse tables and columns |
| **Record queries** | Query records with filters, sorting, and pagination |
| **View-based queries** | Execute saved views as MCP tools |
| **Relationship traversal** | Follow lookups and related records |
| **Security-scoped** | Results filtered by calling user's security role |

### Configuration

```
1. Enable the Dataverse MCP server in the environment
2. Select tables to expose via MCP
3. Configure column-level visibility (exclude sensitive columns)
4. Set row limits and pagination defaults
5. Add the Dataverse MCP connector to the agent's action library
```

### Use Cases

- Agent queries customer records to answer support questions
- Agent looks up product information from a catalog table
- Agent retrieves case history for context during escalation
- Agent searches knowledge articles stored in Dataverse

---

## MCP Tools in Agent Workflows (Wave 1 2026)

> **Preview (April 2026), GA (October 2026):** MCP tools can now be used as deterministic workflow steps in agent topics, not just as AI-selected chat tools.

| Mode | How Invoked | Deterministic? | Use Case |
|---|---|---|---|
| **Chat tool** (existing) | AI selects based on user intent | No | Open-ended Q&A with external data |
| **Workflow step** (new) | Author places in topic flow | Yes — always executes | Structured processes requiring external data at a specific point |

**When to use workflow steps:** Approval processes, compliance checks, required data enrichment — any MCP call that must always execute, not be optionally selected by AI.

---

## Custom MCP Servers (Wave 1 2026)

> **GA (April 2026):** Create and clone reusable, governed MCP servers from the Copilot Studio interface.

Custom MCP servers connect agents to enterprise systems (DocuSign, Salesforce, GitHub, ServiceNow) with:
- **Create from template** — start from a pre-built connector template
- **Clone and customize** — clone an existing MCP server and modify
- **Governed deployment** — MCP servers respect environment DLP policies
- **Reusable across agents** — one MCP server serves multiple agents

**Governance:** Custom MCP servers are subject to DLP connector classification. Classify them before deploying to production.

---

## Anti-Patterns

- Using MCP tools for schema creation or modification (use Web API or Custom API)
- Using MCP for bulk write operations (no transaction support, use batch API)
- Exposing all MCP tools to the agent without curation (AI may select wrong tool)
- No DLP policy on MCP connectors in production (data leakage risk)
- API key authentication for production MCP servers handling sensitive data
- Not configuring tool descriptions (AI struggles to select the correct tool)
- MCP server without rate limiting (agent can overwhelm the server)
- Skipping VNet for private data access (data traverses public internet)
- Not testing tool selection accuracy (AI may invoke unintended tools)
- Using MCP as a replacement for all connector actions (MCP is best for read/query patterns)
