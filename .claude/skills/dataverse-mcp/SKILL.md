---
name: dataverse-mcp
description: "Dataverse MCP (Model Context Protocol) Integration. Use when: querying Dataverse data conversationally, Copilot Studio tool integration, schema discovery in constrained environments, live data validation during development."
---

# Skill: Dataverse MCP (Model Context Protocol) Integration

## When to Use

Use MCP for conversational data operations, schema discovery, and Copilot Studio integration. Use direct Web API for complex builds, batch operations, and solution management.

Trigger this skill when:
- Querying Dataverse data conversationally during development sessions
- Integrating Dataverse as a tool in Copilot Studio agents
- Schema discovery in constrained environments (e.g., Claude Code, VS Code agents)
- Live data validation during development
- Configuring or setting up MCP servers for AI-assisted Dataverse development

---

## Decision Matrix: MCP vs Web API

Before choosing MCP, understand when it is the right tool versus direct Web API calls.

| Capability | MCP Server | Direct Web API | Winner |
|---|---|---|---|
| **Read table schema** | describe_table, list_tables | GET EntityDefinitions | MCP -- conversational, lower effort |
| **Query records** | read_query, Search, Fetch tools | GET entityset?$filter=... | MCP -- natural language driven |
| **Create/update records** | create_record, update_record, delete_record | POST/PATCH/DELETE with full control | Web API -- more control, batch support |
| **Create/modify tables** | Create Table, Update Table, Delete Table | POST EntityDefinitions | Web API -- more control over metadata payloads |
| **Create solution components** | Not supported | Solution API + Web API | Web API -- MCP has no solution tools |
| **Bulk operations** | Not supported | ExecuteMultiple, batch | Web API -- MCP is single-record |
| **Copilot Studio integration** | Native tool pattern (MCP onboarding wizard) | Custom connector required | MCP -- purpose-built for agents |
| **Token efficiency** | Higher per-call overhead | Lower, direct HTTP | Web API -- MCP adds protocol layer |
| **Auth complexity** | Azure App Registration + MCP client enablement | Azure App Registration | Tie |
| **Real-time dev feedback** | Conversational loop | Manual HTTP calls | MCP -- interactive workflow |

**Rule of thumb:** MCP now supports CRUD and basic DDL operations, but Web API gives full control over metadata payloads, batch operations, and solution management. Use MCP for conversational development and Copilot Studio integration. Use Web API (via the `dataverse-web-api` skill) for complex builds, bulk operations, and CI/CD scripts.

---

## Overview

The Dataverse MCP server exposes Dataverse operations as MCP tools, enabling AI assistants to:
- Query table metadata (tables, columns, relationships)
- Create, read, update, and delete records
- Create, update, and delete tables (DDL operations)
- Search across Dataverse data using Dataverse Search
- Execute FetchXML queries via the Fetch tool
- Validate schemas against live environments
- Generate accurate code based on real schema definitions
- Serve as native tools for Copilot Studio agents

---

## MCP Server Options

### Option 1: Microsoft's Official Dataverse MCP Server (GA)

Microsoft's first-party, production-grade MCP server for Dataverse. Generally available and supported by Microsoft.

**Supported tools (GA):** create_record, describe_table, list_tables, read_query, update_record, Create Table, Update Table, Delete Table, Delete Record, Search, Fetch

**Preview tools (via `/api/mcp_preview`):** Additional tools available when preview features are enabled in Power Platform admin center.

**Auth:** Azure App Registration (client credentials flow)

**Cost/Licensing:** Metered since December 15, 2025. The Search tool is billed at the Tenant graph grounding Copilot Credit rate. Other tools (describe_table, read_query, create_record, etc.) are billed at the Text and generative AI tools (basic) per 10 response Copilot Credit rate. License exceptions: Dynamics 365 Premium and M365 Copilot per-user license holders are exempt from metering. Review your tenant's Power Platform billing configuration before enabling in production.

> **Note:** Verify current metering rates at [Copilot Studio billing rates](https://learn.microsoft.com/microsoft-copilot-studio/requirements-messages-management) and [Power Platform licensing overview](https://learn.microsoft.com/power-platform/admin/pricing-billing-skus) before budgeting.

```json
// .claude/settings.json or project-level MCP config
// Configure with your Dataverse environment credentials
{
  "mcpServers": {
    "dataverse": {
      "type": "http",
      "url": "https://<your-org>.crm.dynamics.com/api/mcp",
      "auth": {
        "type": "azure-ad",
        "clientId": "your-app-registration-client-id",
        "clientSecret": "your-client-secret",
        "tenantId": "your-tenant-id"
      }
    }
  }
}
```

Best for: Teams that want a supported, low-maintenance MCP integration with Dataverse and are comfortable with the metered cost model.

### Option 2: Community MCP Server (mwhesse/mcp-dataverse)

Open-source community-maintained MCP server with 50+ schema tools for deep Dataverse exploration.

**Repository:** github.com/mwhesse/mcp-dataverse

**Capabilities:** Extended schema discovery, relationship mapping, metadata introspection beyond what the official server provides.

Best for: Teams that need deeper schema tooling or want to avoid the metered cost of the official server.

---

## Related MCP Servers for Power Platform Development

### Azure DevOps MCP Server

An MCP server that gives AI assistants (GitHub Copilot, Claude Code, Cursor) access to Azure DevOps data. Use alongside the Dataverse MCP server when your ALM is on Azure DevOps.

**Status:** Local server GA. Remote server in public preview (streamable HTTP, no local install needed).

**Source:** github.com/microsoft/azure-devops-mcp

**Capabilities:**
- Retrieve, create, and update work items (including bulk updates and linking)
- Access pull request details and code search
- Query build/pipeline results
- Generate test cases from work item descriptions
- Search across work items, wikis, and code
- List iterations, team capacity, and backlogs

**Local server setup (VS Code / Claude Code):**

VS Code (`.vscode/mcp.json`):
```json
{
  "servers": {
    "azure-devops": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@azure-devops/mcp", "<your-ado-org-name>"]
    }
  }
}
```

Claude Code:
```bash
claude mcp add azure-devops -- npx -y @azure-devops/mcp <your-ado-org-name>
```

**Remote server setup (preview, VS Code only):**
```json
{
  "servers": {
    "ado-remote-mcp": {
      "url": "https://mcp.dev.azure.com/<your-ado-org-name>",
      "type": "http"
    }
  }
}
```

> **Note:** The remote server authenticates via Microsoft Entra ID. As of March 2026, only VS Code and Visual Studio are supported as remote MCP clients. Claude Code/Desktop support is pending Entra dynamic client registration.

**When to use:** When your project tracks work items in ADO Boards, uses ADO Repos, or runs ADO Pipelines. Complements Dataverse MCP (data operations) with project management context.

### PAC CLI MCP Server

The Power Platform CLI includes a built-in MCP server that exposes all PAC CLI commands via natural language.

**Status:** GA
**Prerequisite:** .NET 10.0+

**Start the server:**
```bash
# With PAC CLI installed
pac copilot mcp --run

# Without PAC CLI installed (uses .NET dnx)
dnx Microsoft.PowerApps.CLI.Tool --yes copilot mcp --run
```

**Claude Code registration:**
```bash
claude mcp add-json pac-cli '{"type":"stdio","command":"dnx","args":["Microsoft.PowerApps.CLI.Tool","--yes","copilot","mcp","--run"]}'
```

**VS Code registration (`.vscode/mcp.json`):**
```json
{
  "servers": {
    "pac-mcp": {
      "type": "stdio",
      "command": "dnx",
      "args": ["Microsoft.PowerApps.CLI.Tool", "--yes", "copilot", "mcp", "--run"]
    }
  }
}
```

**Capabilities:** All PAC CLI operations via natural language -- environment management, solution operations, auth management, code app deployment, PCF operations, copilot management.

**When to use:** When you want to invoke PAC CLI commands conversationally instead of memorizing syntax. Useful for environment provisioning, solution import/export, and deployment operations.

---

### Dataverse Management MCP Server (Wave 1 2026)

> **Preview (Wave 1 2026):** A new MCP server focused on Dataverse management — discover, build, customize, and extend environments.

| Capability | Data MCP (existing) | Management MCP (new) |
|---|---|---|
| Query records | Yes | No |
| CRUD operations | Yes | No |
| Create/modify tables | Limited | Yes — primary purpose |
| Solution management | No | Yes |
| Environment discovery | No | Yes |

---

### Option 3: Custom MCP Server (Build Your Own)

Build a custom MCP server that connects to your Dataverse environment for live schema and data queries. This gives you full control over which tools are exposed, security boundaries, and response shaping.

#### Project Setup
```bash
mkdir dataverse-mcp && cd dataverse-mcp
npm init -y
npm install @modelcontextprotocol/sdk @azure/identity @azure/msal-node
npm install -D typescript @types/node
```

#### MCP Server Implementation
```typescript
// src/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ConfidentialClientApplication } from "@azure/msal-node";

const ENV_URL = process.env.DATAVERSE_URL!;
const CLIENT_ID = process.env.DATAVERSE_CLIENT_ID!;
const CLIENT_SECRET = process.env.DATAVERSE_CLIENT_SECRET!;
const TENANT_ID = process.env.DATAVERSE_TENANT_ID!;

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const cca = new ConfidentialClientApplication({
    auth: {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    },
  });

  const result = await cca.acquireTokenByClientCredential({
    scopes: [`${ENV_URL}/.default`],
  });

  accessToken = result!.accessToken;
  // Use actual expiry from MSAL, minus 5 minutes buffer
  tokenExpiry = result!.expiresOn!.getTime() - 5 * 60 * 1000;
  return accessToken;
}

async function dataverseRequest(path: string): Promise<any> {
  const token = await getToken();
  const response = await fetch(`${ENV_URL}/api/data/v9.2/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      Prefer: 'odata.include-annotations="*"',
    },
  });
  if (!response.ok) throw new Error(`Dataverse API error: ${response.status} ${await response.text()}`);
  return response.json();
}

const server = new Server(
  { name: "dataverse-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_tables",
      description: "List all custom tables in the Dataverse environment with their schema names and display names",
      inputSchema: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            description: "Optional: filter to 'custom' (default), 'system', or 'all' tables",
          },
        },
      },
    },
    {
      name: "describe_table",
      description: "Get detailed metadata for a specific table including all columns, types, and relationships",
      inputSchema: {
        type: "object",
        properties: {
          tableName: {
            type: "string",
            description: "Logical name of the table (e.g., 'contact', 'contoso_project')",
          },
        },
        required: ["tableName"],
      },
    },
    {
      name: "query_records",
      description: "Query records from a Dataverse table with OData filter, select, and top",
      inputSchema: {
        type: "object",
        properties: {
          entitySet: {
            type: "string",
            description: "Entity set name (plural, e.g., 'contacts', 'contoso_projects')",
          },
          select: {
            type: "string",
            description: "Comma-separated column names to return",
          },
          filter: {
            type: "string",
            description: "OData filter expression",
          },
          top: {
            type: "number",
            description: "Max records to return (default 10, max 50)",
          },
          orderby: {
            type: "string",
            description: "OData orderby expression",
          },
        },
        required: ["entitySet"],
      },
    },
    {
      name: "list_solutions",
      description: "List all solutions in the environment",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_environment_variables",
      description: "List all environment variable definitions and their current values",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "describe_relationships",
      description: "Get all relationships for a specific table",
      inputSchema: {
        type: "object",
        properties: {
          tableName: {
            type: "string",
            description: "Logical name of the table",
          },
        },
        required: ["tableName"],
      },
    },
    {
      name: "list_security_roles",
      description: "List all security roles in the environment",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_views",
      description: "List all views (saved queries) for a specific table",
      inputSchema: {
        type: "object",
        properties: {
          tableName: {
            type: "string",
            description: "Logical name of the table",
          },
        },
        required: ["tableName"],
      },
    },
    {
      name: "list_custom_apis",
      description: "List all Custom APIs defined in the environment",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_plugins",
      description: "List all registered plugin assemblies and their steps",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_business_process_flows",
      description: "List all active Business Process Flows in the environment",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_tables": {
        const filter = (args?.filter as string) || "custom";
        let oDataFilter = "";
        if (filter === "custom") oDataFilter = "&$filter=IsCustomEntity eq true";
        else if (filter === "system") oDataFilter = "&$filter=IsCustomEntity eq false";

        const result = await dataverseRequest(
          `EntityDefinitions?$select=LogicalName,DisplayName,SchemaName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,IsCustomEntity,OwnershipType${oDataFilter}`
        );

        const tables = result.value.map((t: any) => ({
          logicalName: t.LogicalName,
          displayName: t.DisplayName?.UserLocalizedLabel?.Label || t.LogicalName,
          schemaName: t.SchemaName,
          entitySetName: t.EntitySetName,
          primaryId: t.PrimaryIdAttribute,
          primaryName: t.PrimaryNameAttribute,
          ownershipType: t.OwnershipType,
        }));

        return { content: [{ type: "text", text: JSON.stringify(tables, null, 2) }] };
      }

      case "describe_table": {
        const tableName = args!.tableName as string;
        const result = await dataverseRequest(
          `EntityDefinitions(LogicalName='${tableName}')?$expand=Attributes($select=LogicalName,DisplayName,AttributeType,RequiredLevel,MaxLength,MinValue,MaxValue,Precision,Format,SchemaName,IsPrimaryName,IsCustomAttribute)`
        );

        const columns = result.Attributes
          .filter((a: any) => !a.LogicalName.startsWith("yomi") && !a.LogicalName.endsWith("_base"))
          .map((a: any) => ({
            logicalName: a.LogicalName,
            displayName: a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName,
            type: a.AttributeType,
            required: a.RequiredLevel?.Value || "None",
            isPrimaryName: a.IsPrimaryName,
            isCustom: a.IsCustomAttribute,
            maxLength: a.MaxLength,
            format: a.Format,
          }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              logicalName: result.LogicalName,
              displayName: result.DisplayName?.UserLocalizedLabel?.Label,
              entitySetName: result.EntitySetName,
              primaryId: result.PrimaryIdAttribute,
              primaryName: result.PrimaryNameAttribute,
              ownershipType: result.OwnershipType,
              columns,
            }, null, 2),
          }],
        };
      }

      case "query_records": {
        const entitySet = args!.entitySet as string;
        const select = args?.select as string;
        const filter = args?.filter as string;
        const top = Math.min((args?.top as number) || 10, 50);
        const orderby = args?.orderby as string;

        let query = `${entitySet}?$top=${top}`;
        if (select) query += `&$select=${select}`;
        if (filter) query += `&$filter=${filter}`;
        if (orderby) query += `&$orderby=${orderby}`;

        const result = await dataverseRequest(query);
        return { content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }] };
      }

      case "list_solutions": {
        const result = await dataverseRequest(
          "solutions?$select=uniquename,friendlyname,version,ismanaged,installedon&$filter=isvisible eq true&$orderby=friendlyname"
        );
        return { content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }] };
      }

      case "list_environment_variables": {
        const defs = await dataverseRequest(
          "environmentvariabledefinitions?$select=schemaname,displayname,type,defaultvalue&$expand=environmentvariablevalues($select=value)"
        );
        const vars = defs.value.map((d: any) => ({
          schemaName: d.schemaname,
          displayName: d.displayname,
          type: d.type,
          defaultValue: d.defaultvalue,
          currentValue: d.environmentvariablevalues?.[0]?.value || null,
        }));
        return { content: [{ type: "text", text: JSON.stringify(vars, null, 2) }] };
      }

      case "describe_relationships": {
        const tableName = args!.tableName as string;
        const [oneToMany, manyToOne, manyToMany] = await Promise.all([
          dataverseRequest(`EntityDefinitions(LogicalName='${tableName}')/OneToManyRelationships?$select=SchemaName,ReferencedEntity,ReferencingEntity,ReferencingAttribute`),
          dataverseRequest(`EntityDefinitions(LogicalName='${tableName}')/ManyToOneRelationships?$select=SchemaName,ReferencedEntity,ReferencingEntity,ReferencingAttribute`),
          dataverseRequest(`EntityDefinitions(LogicalName='${tableName}')/ManyToManyRelationships?$select=SchemaName,Entity1LogicalName,Entity2LogicalName,IntersectEntityName`),
        ]);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              oneToMany: oneToMany.value,
              manyToOne: manyToOne.value,
              manyToMany: manyToMany.value,
            }, null, 2),
          }],
        };
      }

      case "list_security_roles": {
        const result = await dataverseRequest(
          "roles?$select=name,roleid,ismanaged,iscustomizable&$filter=parentroleid eq null&$orderby=name"
        );
        return { content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }] };
      }

      case "list_views": {
        const tableName = args!.tableName as string;
        const result = await dataverseRequest(
          `savedqueries?$select=name,querytype,isdefault,fetchxml&$filter=returnedtypecode eq '${tableName}'&$orderby=name`
        );
        return { content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }] };
      }

      case "list_custom_apis": {
        const result = await dataverseRequest(
          "customapis?$select=uniquename,name,bindingtype,boundentitylogicalname,isfunction,isprivate,allowedcustomprocessingsteptype&$orderby=uniquename"
        );
        return { content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }] };
      }

      case "list_plugins": {
        const assemblies = await dataverseRequest(
          "pluginassemblies?$select=name,version,isolationmode,ismanaged&$filter=ishidden/Value eq false&$orderby=name"
        );
        const steps = await dataverseRequest(
          "sdkmessageprocessingsteps?$select=name,stage,mode,rank,filteringattributes,statecode&$filter=ismanaged eq false&$orderby=name&$top=100"
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ assemblies: assemblies.value, steps: steps.value }, null, 2),
          }],
        };
      }

      case "list_business_process_flows": {
        const result = await dataverseRequest(
          "workflows?$select=name,uniquename,primaryentity,statecode,statuscode&$filter=category eq 4 and statecode eq 1&$orderby=name"
        );
        return { content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch(console.error);
```

### Configuration in Claude Code
```json
// .claude/settings.json
{
  "mcpServers": {
    "dataverse": {
      "command": "npx",
      "args": ["tsx", "/path/to/dataverse-mcp/src/server.ts"],
      "env": {
        "DATAVERSE_URL": "https://org.crm.dynamics.com",
        "DATAVERSE_CLIENT_ID": "your-app-registration-client-id",
        "DATAVERSE_CLIENT_SECRET": "your-client-secret",
        "DATAVERSE_TENANT_ID": "your-tenant-id"
      }
    }
  }
}
```

---

## Azure App Registration for MCP

### Required Setup
```
1. Azure Portal -> App Registrations -> New Registration
   Name: "Dataverse MCP - Development"
   Supported account types: Single tenant

2. API Permissions:
   - Dynamics CRM -> user_impersonation (or Application permissions)
   - Add: Dataverse -> Environment.Read, Entity.Read

3. Client Secret:
   - Certificates & secrets -> New client secret
   - Copy value immediately (shown only once)

4. Dataverse Application User:
   - Power Platform Admin Center -> Environment -> Settings -> Application Users
   - Create application user with the App Registration's Client ID
   - Assign appropriate security role (e.g., System Reader for read-only MCP)
```

### Security Best Practices
| Practice | Details |
|---|---|
| Least privilege | MCP app user gets read-only role (System Reader or custom) |
| Separate per environment | Different app registration per dev/test/prod |
| Secret rotation | Rotate client secrets every 90 days |
| No production data | Point MCP server at dev environment only |
| Audit logging | Enable auditing on the Dataverse environment |
| Environment isolation | MCP server connects to dev, not prod |

---

## Copilot Studio Integration

MCP is the native tool pattern for Copilot Studio agents. When building agents that need to query Dataverse data conversationally, MCP provides the standard integration path.

### Use Case: Agent with Live Dataverse Access

Copilot Studio agents can use MCP tools directly, allowing end users to ask natural-language questions about Dataverse data without custom connectors or Power Automate flows.

**Pattern:**
1. Configure the MCP server (Option 1, 2, or 3 above) as a tool in your Copilot Studio agent
2. The agent receives user questions like "How many open projects are there?"
3. The agent calls query_records or list_tables via MCP
4. Results are returned conversationally to the user

**When MCP is preferred over custom connectors for Copilot Studio:**
- Schema discovery and data exploration use cases
- Rapid prototyping of data-aware agents
- Scenarios where the agent needs to inspect table structure dynamically
- Read-heavy workloads where the agent is answering questions, not writing data

---

## Usage Patterns in Claude Code

### Schema Discovery
```
You: "What tables do we have for project management?"
Claude: [calls list_tables tool]
-> Shows contoso_project, contoso_task, contoso_milestone, contoso_resource

You: "Describe the project table"
Claude: [calls describe_table with tableName: "contoso_project"]
-> Shows all columns with types, requirements, relationships
```

### Code Generation from Live Schema
```
You: "Create a useProjects hook for the Code App"
Claude: [calls describe_table to get exact column names and types]
Claude: [generates hook with correct column names, types, and relationship handling]
```

### Validation
```
You: "Is there an alternate key on the order table?"
Claude: [calls describe_table, checks metadata]
-> "Yes, contoso_ordernumber is defined as an alternate key"
```

---

## Anti-Patterns

- Connecting MCP server to production environment (use dev only)
- Over-permissive security role on MCP app user (use read-only)
- Storing secrets in config files checked into Git (use environment variables)
- Querying large datasets through MCP (add $top limits, max 50)
- Not rotating client secrets
- Sharing MCP app registration credentials across team (use individual registrations)
- Using MCP for complex schema builds when direct Web API gives more control (MCP lacks solution header support, batch ops, and fine-grained metadata payloads)
- Treating MCP as the only way to interact with Dataverse (Web API is faster for builds)
- Not understanding the cost model for Microsoft's official MCP server (metered usage outside Copilot Studio entitlements since December 2025)

---

## Related Skills

- `dataverse` -- Table schema design that MCP discovers
- `dataverse-web-api` -- Web API calls that MCP can validate; use Web API for schema creation and component building
- `code-apps` -- Code generation from live Dataverse schema
- `copilot-studio` -- Copilot Studio agent development where MCP serves as the native tool pattern
