# Solution Management, Publishing & App Modules

## Publisher Management

### Create Publisher
```http
POST /api/data/v9.2/publishers
Content-Type: application/json

{
  "uniquename": "contoso",
  "friendlyname": "Contoso",
  "description": "Contoso Ltd publisher",
  "customizationprefix": "contoso",
  "customizationoptionvalueprefix": 10000
}
```

### Find Existing Publisher
```http
GET /api/data/v9.2/publishers
  ?$filter=uniquename eq 'contoso'
  &$select=publisherid,uniquename,friendlyname,customizationprefix
```

**Note:** Always check if the publisher exists before creating. Use the publisher GUID in the solution creation `publisherid@odata.bind` field.

---

## Solution Management

### List Solutions
```http
GET /api/data/v9.2/solutions
  ?$select=uniquename,friendlyname,version,ismanaged
  &$filter=isvisible eq true
  &$orderby=friendlyname asc
```

### Create Solution
```http
POST /api/data/v9.2/solutions
Content-Type: application/json

{
  "uniquename": "ContosoProjects",
  "friendlyname": "Contoso Projects",
  "version": "1.0.0.0",
  "description": "Project management solution",
  "publisherid@odata.bind": "/publishers(guid-of-publisher)"
}
```

### Add Component to Solution
```http
POST /api/data/v9.2/AddSolutionComponent
Content-Type: application/json

{
  "ComponentId": "guid-of-component",
  "ComponentType": 1,
  "SolutionUniqueName": "ContosoProjects",
  "AddRequiredComponents": true,
  "DoNotIncludeSubcomponents": false
}
```

**Component Type Values:**
| Value | Component |
|---|---|
| 1 | Entity (Table) |
| 2 | Attribute (Column) |
| 3 | Relationship |
| 10 | Attribute Picklist Value |
| 26 | View (SavedQuery) |
| 29 | Process (Workflow/Flow) |
| 60 | Form (SystemForm) |
| 61 | Web Resource |
| 63 | Connection Role |
| 65 | Role (Security Role) |
| 66 | Field Security Profile |
| 90 | Plugin Type |
| 91 | Plugin Assembly |
| 92 | SDK Message Processing Step |
| 371 | Connector |
| 372 | Environment Variable Definition |
| 380 | Custom API |

### Export Solution
```http
POST /api/data/v9.2/ExportSolution
Content-Type: application/json

{
  "SolutionName": "ContosoProjects",
  "Managed": true,
  "ExportAutoNumberingSettings": false,
  "ExportCalendarSettings": false,
  "ExportCustomizationSettings": false,
  "ExportEmailTrackingSettings": false,
  "ExportGeneralSettings": false,
  "ExportMarketingSettings": false,
  "ExportOutlookSynchronizationSettings": false,
  "ExportRelationshipRoles": true,
  "ExportIsvConfig": false,
  "ExportSales": false
}
```
Response: `ExportSolutionFile` (Base64-encoded ZIP).

### Import Solution
```http
POST /api/data/v9.2/ImportSolution
Content-Type: application/json

{
  "CustomizationFile": "<base64-encoded-zip>",
  "OverwriteUnmanagedCustomizations": true,
  "PublishWorkflows": true,
  "ImportJobId": "guid-for-tracking",
  "ConvertToManaged": false
}
```

---

## Publishing Customizations

### Publish All
```http
POST /api/data/v9.2/PublishAllXml
Content-Type: application/json

{}
```

> **Note:** An empty JSON body `{}` is required. Omitting the body returns HTTP 411 Length Required.

### Publish Specific Entity
```http
POST /api/data/v9.2/PublishXml
Content-Type: application/json

{
  "ParameterXml": "<importexportxml><entities><entity>contoso_project</entity></entities></importexportxml>"
}
```

---

## App Module Management

### Create Model-Driven App
```http
POST /api/data/v9.2/appmodules
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution
Prefer: return=representation

{
  "name": "Contoso Projects",
  "uniquename": "ProjectsApp",
  "description": "Project management application",
  "clienttype": 4,
  "webresourceid": "guid-of-icon-webresource"
}
```

### ⚠️ App Module Gotchas

1. **`uniquename` auto-prefixes with publisher prefix.** If your publisher prefix is `contoso`, pass `ProjectsApp` — the system creates `contoso_ProjectsApp`. Passing `contoso_ProjectsApp` creates `contoso_contoso_ProjectsApp` (double-prefixed).

2. **`clienttype: 4`** = Unified Interface (modern). Always use 4.

3. **`webresourceid`** must be a GUID of an existing web resource (e.g., SVG icon). Query it:
```http
GET /api/data/v9.2/webresourceset?$filter=name eq 'contoso_/icons/app_icon.svg'&$select=webresourceid
```

4. **Unpublished app modules are invisible** to standard GET queries. Use `RetrieveUnpublishedMultiple`:
```http
GET /api/data/v9.2/appmodules?$select=name,uniquename,appmoduleid
```
If this returns nothing but you know the app exists, use:
```http
GET /api/data/v9.2/appmodules/Microsoft.Dynamics.CRM.RetrieveUnpublishedMultiple()?$select=name,uniquename,appmoduleid
```

### Add Components to App (AddAppComponents)

Use the `AddAppComponents` action to bind entities, forms, views, dashboards to the app:

```http
POST /api/data/v9.2/AddAppComponents
Content-Type: application/json

{
  "AppId": "guid-of-appmodule",
  "Components": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.savedquery",
      "savedqueryid": "guid-of-view"
    },
    {
      "@odata.type": "Microsoft.Dynamics.CRM.systemform",
      "formid": "guid-of-form-or-dashboard"
    }
  ]
}
```

**⚠️ CRITICAL:** Each component MUST use the **entity-specific** `@odata.type` and primary key field — NOT a generic type. Using `Microsoft.Dynamics.CRM.appcomponent` does NOT work.

**Component @odata.type values for AddAppComponents:**
| Component | @odata.type | Primary Key Field |
|---|---|---|
| View | `Microsoft.Dynamics.CRM.savedquery` | `savedqueryid` |
| Form / Dashboard | `Microsoft.Dynamics.CRM.systemform` | `formid` |
| Chart | `Microsoft.Dynamics.CRM.savedqueryvisualization` | `savedqueryvisualizationid` |
| Sitemap | `Microsoft.Dynamics.CRM.sitemap` | `sitemapid` |

### ⚠️ Entities Cannot Be Directly Bound via AddAppComponents

There is NO `@odata.type` for entity binding. Entities are **implicitly included** when their views and forms are bound to the app module. Bind all views, forms, charts, and dashboards — the entity appears automatically.

The `appmodulecomponents` entity set query is unreliable for validation — it often returns 0 results even after successful `AddAppComponents` (HTTP 204). Verify by checking in-app rendering instead.

### Sitemap Configuration

App modules get an auto-generated placeholder sitemap. You must configure it with actual navigation:

**Step 1: Find the sitemap**
```http
GET /api/data/v9.2/sitemaps?$filter=_appmoduleid_value eq '{appmodule-guid}'&$select=sitemapid,sitemapxml
```

> ⚠️ **OData filtering on `_appmoduleid_value` is not supported** — this returns HTTP 400. Query all sitemaps and filter client-side:
> ```http
> GET /api/data/v9.2/sitemaps?$select=sitemapid,sitemapxml,_appmoduleid_value
> ```
> Then filter in code: `[s for s in result['value'] if s.get('_appmoduleid_value') == app_module_id]`

**Step 2: PATCH with proper XML**
```http
PATCH /api/data/v9.2/sitemaps({sitemap-guid})
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "sitemapxml": "<SiteMap IntroducedVersion='7.0.0.0'><Area Id='MainArea' ResourceId='SitemapDesigner.MainArea' IntroducedVersion='7.0.0.0' DescriptionResourceId=''><Titles><Title LCID='1033' Title='Main'/></Titles><Group Id='MainGroup' ResourceId='SitemapDesigner.MainGroup' IntroducedVersion='7.0.0.0' DescriptionResourceId=''><Titles><Title LCID='1033' Title='Records'/></Titles><SubArea Id='sub_projects' Entity='contoso_project' IntroducedVersion='7.0.0.0' DescriptionResourceId=''><Titles><Title LCID='1033' Title='Projects'/></Titles></SubArea><SubArea Id='sub_tasks' Entity='contoso_task' IntroducedVersion='7.0.0.0' DescriptionResourceId=''><Titles><Title LCID='1033' Title='Tasks'/></Titles></SubArea></Group></Area></SiteMap>"
}
```

### ⚠️ Sitemap XML Rules

1. **`IntroducedVersion` is required** on `<SiteMap>`, `<Area>`, `<Group>`, and `<SubArea>` elements
2. **Use `<Titles><Title LCID='1033' Title='...'/></Titles>`** for display names — NOT `Title` attribute directly on the element
3. **Do NOT use `DashboardType` attribute** on `<SubArea>` — it fails XSD validation. Dashboards are accessible via the built-in dashboard selector in the app
4. **No `appmodulesitemaps` endpoint exists** — sitemaps are accessed via `sitemaps` entity set and linked to apps via `_appmoduleid_value`
5. **Use a SINGLE `<Area>` with multiple `<Group>` elements** — multiple Areas render as bottom tabs in Unified Interface, not left-nav groups. One Area with Groups gives the expected left-nav panel layout
6. **Dashboards are accessible via the built-in dashboard selector** — do NOT add dashboard SubAreas (breaks sitemap navigation)

### Validate and Publish App

```http
# Validate (check for configuration errors) — this is a FUNCTION (GET), not an action (POST)
GET /api/data/v9.2/ValidateApp(AppModuleId=guid-of-appmodule)
# Response: { "AppValidationResponse": { "Success": true, "ValidationResults": [...] } }

# Publish the app
POST /api/data/v9.2/PublishXml
Content-Type: application/json

{
  "ParameterXml": "<importexportxml><appmodules><appmodule>{appmodule-guid}</appmodule></appmodules></importexportxml>"
}
```

---

### Solution-Scoped Cleanup

When deleting test components, **always scope to the solution** — never use broad name-contains queries across the org:

```python
# CORRECT: Delete only components in YOUR solution
solution_id = "your-solution-guid"
components = api_get(f"solutioncomponents?$filter=_solutionid_value eq '{solution_id}'&$select=objectid,componenttype")

# WRONG: This can match components from OTHER solutions
api_get("roles?$filter=contains(name,'Project')")  # Dangerous — matches other solutions' roles
```
