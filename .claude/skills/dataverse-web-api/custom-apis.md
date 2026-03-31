# Custom APIs via Web API

## Overview

Custom APIs define reusable business operations exposed as Dataverse messages. They can be called via Web API like any built-in action or function. Custom APIs replace the legacy Custom Process Actions with a more capable, code-first approach that supports functions (GET, side-effect-free) and actions (POST, may modify data).

## Custom API vs Custom Process Action

| Feature | Custom API | Custom Process Action (Legacy) |
|---|---|---|
| Definition | Table records (customapi, customapirequestparameter, customapiresponseproperty) | Workflow records with XAML |
| Implementation | Plugin (C#) | Workflow activities or plugins |
| Functions (GET) | Yes | No |
| Binding types | Global, Entity, Entity Collection | Global only |
| Private APIs | Yes (hidden from external consumers) | No |
| Custom processing steps | Optional (allow 3rd-party plugins) | Always |
| Recommendation | **Use for new development** | Legacy — migrate when possible |

## Creating a Custom API

### Simple Global Action (No Parameters)

```http
POST /api/data/v9.2/customapis
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "uniquename": "contoso_RecalculateProjectMetrics",
  "name": "contoso_RecalculateProjectMetrics",
  "displayname": "Recalculate Project Metrics",
  "description": "Recalculates all project metrics including budget utilization and timeline status",
  "bindingtype": 0,
  "boundentitylogicalname": null,
  "isfunction": false,
  "isprivate": false,
  "allowedcustomprocessingsteptype": 0,
  "executeprivilegename": null,
  "PluginTypeId@odata.bind": "plugintypes({plugin-type-id})",
  "iscustomizable": { "Value": false }
}
```

### Action with Parameters and Response (Single Request)

Create the API, its request parameters, and response properties in one operation using deep insert:

```http
POST /api/data/v9.2/customapis
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "uniquename": "contoso_AssignProjectTeam",
  "name": "contoso_AssignProjectTeam",
  "displayname": "Assign Project Team",
  "description": "Assigns team members to a project and returns assignment summary",
  "bindingtype": 0,
  "boundentitylogicalname": null,
  "isfunction": false,
  "isprivate": false,
  "allowedcustomprocessingsteptype": 0,
  "PluginTypeId@odata.bind": "plugintypes({plugin-type-id})",
  "iscustomizable": { "Value": false },
  "CustomAPIRequestParameters": [
    {
      "uniquename": "ProjectId",
      "name": "contoso_AssignProjectTeam.ProjectId",
      "displayname": "Project ID",
      "description": "The GUID of the project to assign team to",
      "type": 12,
      "isoptional": false,
      "logicalentityname": null,
      "iscustomizable": { "Value": false }
    },
    {
      "uniquename": "TeamMemberIds",
      "name": "contoso_AssignProjectTeam.TeamMemberIds",
      "displayname": "Team Member IDs",
      "description": "Comma-separated GUIDs of team members",
      "type": 10,
      "isoptional": false,
      "logicalentityname": null,
      "iscustomizable": { "Value": false }
    },
    {
      "uniquename": "Role",
      "name": "contoso_AssignProjectTeam.Role",
      "displayname": "Role",
      "description": "Role to assign (optional, defaults to Member)",
      "type": 10,
      "isoptional": true,
      "logicalentityname": null,
      "iscustomizable": { "Value": false }
    }
  ],
  "CustomAPIResponseProperties": [
    {
      "uniquename": "AssignmentCount",
      "name": "contoso_AssignProjectTeam.AssignmentCount",
      "displayname": "Assignment Count",
      "description": "Number of successful assignments",
      "type": 7,
      "logicalentityname": null,
      "iscustomizable": { "Value": false }
    },
    {
      "uniquename": "Summary",
      "name": "contoso_AssignProjectTeam.Summary",
      "displayname": "Summary",
      "description": "Human-readable summary of assignments",
      "type": 10,
      "logicalentityname": null,
      "iscustomizable": { "Value": false }
    }
  ]
}
```

### Entity-Bound Action

Bound to a specific table — called in the context of a record:

```http
POST /api/data/v9.2/customapis
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "uniquename": "contoso_CompleteProject",
  "name": "contoso_CompleteProject",
  "displayname": "Complete Project",
  "description": "Marks a project as complete and triggers closing activities",
  "bindingtype": 1,
  "boundentitylogicalname": "contoso_project",
  "isfunction": false,
  "isprivate": false,
  "allowedcustomprocessingsteptype": 0,
  "PluginTypeId@odata.bind": "plugintypes({plugin-type-id})",
  "iscustomizable": { "Value": false },
  "CustomAPIRequestParameters": [
    {
      "uniquename": "CompletionNotes",
      "name": "contoso_CompleteProject.CompletionNotes",
      "displayname": "Completion Notes",
      "description": "Notes about the project completion",
      "type": 10,
      "isoptional": true,
      "logicalentityname": null,
      "iscustomizable": { "Value": false }
    }
  ],
  "CustomAPIResponseProperties": [
    {
      "uniquename": "Success",
      "name": "contoso_CompleteProject.Success",
      "displayname": "Success",
      "description": "Whether the completion was successful",
      "type": 0,
      "logicalentityname": null,
      "iscustomizable": { "Value": false }
    }
  ]
}
```

### Function (GET, Side-Effect-Free)

Functions use GET requests and cannot modify data:

```http
POST /api/data/v9.2/customapis
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "uniquename": "contoso_GetProjectHealth",
  "name": "contoso_GetProjectHealth",
  "displayname": "Get Project Health",
  "description": "Returns project health metrics without modifying any data",
  "bindingtype": 1,
  "boundentitylogicalname": "contoso_project",
  "isfunction": true,
  "isprivate": false,
  "allowedcustomprocessingsteptype": 0,
  "PluginTypeId@odata.bind": "plugintypes({plugin-type-id})",
  "iscustomizable": { "Value": false },
  "CustomAPIResponseProperties": [
    {
      "uniquename": "HealthScore",
      "name": "contoso_GetProjectHealth.HealthScore",
      "displayname": "Health Score",
      "description": "0-100 health score",
      "type": 7,
      "logicalentityname": null,
      "iscustomizable": { "Value": false }
    },
    {
      "uniquename": "Status",
      "name": "contoso_GetProjectHealth.Status",
      "displayname": "Status",
      "description": "Health status text",
      "type": 10,
      "logicalentityname": null,
      "iscustomizable": { "Value": false }
    }
  ]
}
```

## Parameter and Response Property Types

| Type Value | Label | Use Case |
|---|---|---|
| `0` | Boolean | True/false flags |
| `1` | DateTime | Date/time values |
| `2` | Decimal | Precise numeric values |
| `3` | Entity | Single Dataverse record |
| `4` | EntityCollection | Collection of records |
| `5` | EntityReference | Reference (GUID + table name) |
| `6` | Float | Floating-point numbers |
| `7` | Integer | Whole numbers |
| `8` | Money | Currency amounts |
| `9` | Picklist | Choice/option set values |
| `10` | String | Text values |
| `11` | StringArray | Array of strings |
| `12` | Guid | Unique identifiers |

**Note:** `IsOptional` is only valid for request parameters, not response properties. Setting it on a response property causes an import error.

## Binding Types

| Value | Type | Call Pattern |
|---|---|---|
| `0` | Global | `POST /api/data/v9.2/contoso_AssignProjectTeam` |
| `1` | Entity | `POST /api/data/v9.2/contoso_projects({id})/Microsoft.Dynamics.CRM.contoso_CompleteProject` |
| `2` | Entity Collection | `POST /api/data/v9.2/contoso_projects/Microsoft.Dynamics.CRM.contoso_BulkOperation` |

## Calling Custom APIs

### Call a Global Action

```http
POST /api/data/v9.2/contoso_AssignProjectTeam
Content-Type: application/json

{
  "ProjectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "TeamMemberIds": "guid1,guid2,guid3",
  "Role": "Lead"
}
```

**Response:**
```json
{
  "@odata.context": "https://org.api.crm.dynamics.com/api/data/v9.2/$metadata#Microsoft.Dynamics.CRM.contoso_AssignProjectTeamResponse",
  "AssignmentCount": 3,
  "Summary": "Successfully assigned 3 team members as Lead"
}
```

### Call an Entity-Bound Action

```http
POST /api/data/v9.2/contoso_projects(a1b2c3d4-e5f6-7890-abcd-ef1234567890)/Microsoft.Dynamics.CRM.contoso_CompleteProject
Content-Type: application/json

{
  "CompletionNotes": "All deliverables accepted by client"
}
```

### Call a Function (GET)

```http
GET /api/data/v9.2/contoso_projects(a1b2c3d4-e5f6-7890-abcd-ef1234567890)/Microsoft.Dynamics.CRM.contoso_GetProjectHealth()
```

**Note the parentheses `()` at the end** — required for functions even with no parameters.

### Call a Function with Parameters

```http
GET /api/data/v9.2/contoso_GetReportData(StartDate=2026-01-01,EndDate=2026-03-31)
```

## AllowedCustomProcessingStepType

| Value | Meaning | Use Case |
|---|---|---|
| `0` | None | Only your plugin runs. Most secure. |
| `1` | Async Only | Third-party plugins can register async steps |
| `2` | Sync and Async | Third-party plugins can register any step type |

**Recommendation:** Use `0` (None) unless you specifically want to allow extensibility.

## Managing Custom APIs

### Query All Custom APIs

```http
GET /api/data/v9.2/customapis?$select=uniquename,displayname,bindingtype,isfunction&$expand=CustomAPIRequestParameters($select=uniquename,type,isoptional),CustomAPIResponseProperties($select=uniquename,type)
```

### Update a Custom API

Some properties can be updated after creation:

```http
PATCH /api/data/v9.2/customapis({customapiid})
Content-Type: application/json

{
  "displayname": "Updated Display Name",
  "description": "Updated description",
  "isprivate": true
}
```

**Cannot change after creation:** `uniquename`, `bindingtype`, `boundentitylogicalname`, `isfunction`

### Delete a Custom API

Deleting a Custom API also deletes its request parameters and response properties:

```http
DELETE /api/data/v9.2/customapis({customapiid})
```

### Add Parameters to Existing API

```http
POST /api/data/v9.2/customapirequestparameters
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "uniquename": "Priority",
  "name": "contoso_AssignProjectTeam.Priority",
  "displayname": "Priority",
  "description": "Assignment priority level",
  "type": 7,
  "isoptional": true,
  "CustomAPIId@odata.bind": "/customapis({customapiid})",
  "iscustomizable": { "Value": false }
}
```

## Plugin Association

Custom APIs require a plugin to execute business logic. The plugin must be registered first:

```
1. Register plugin assembly → get assemblyid
2. Register plugin type → get plugintypeid
3. Create Custom API with PluginTypeId@odata.bind → plugintypes({plugintypeid})
```

**Without a plugin:** You can create a Custom API without a plugin (omit `PluginTypeId@odata.bind`). It will still be callable but returns an empty response. Useful for placeholder APIs during development.

## Custom API in Power Automate

Custom APIs automatically appear as Dataverse actions in Power Automate:
- Global actions appear under "Perform an unbound action"
- Entity-bound actions appear under "Perform a bound action"

This makes Custom APIs the preferred way to expose server-side logic to both code and low-code consumers.

## Anti-Patterns

- **Using Custom Process Actions for new development** — Custom APIs are the modern replacement with more features (functions, binding types, private APIs).
- **Not setting `IsCustomizable: false` in managed solutions** — consumers of your managed solution could modify or delete your API definition, breaking dependent code.
- **Making all parameters required** — use `isoptional: true` for parameters with sensible defaults. This improves the consumer experience.
- **Exposing internal operations as public APIs** — use `isprivate: true` for APIs that are internal implementation details.
- **Creating functions that modify data** — functions (GET) must be side-effect-free. If the operation modifies data, use an action (POST).
- **Forgetting the `()` when calling functions** — `GET .../contoso_GetHealth` returns 404. Must be `GET .../contoso_GetHealth()`.
- **Not including MSCRM.SolutionUniqueName** — Custom APIs created without the solution header land in the Default Solution.
- **Using AllowedCustomProcessingStepType: 2 by default** — this allows anyone to register sync plugins on your message, potentially degrading performance. Use `0` unless extensibility is intentional.
