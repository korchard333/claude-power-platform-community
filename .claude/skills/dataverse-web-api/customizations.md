# Customizations via Web API (Views, Forms, Business Rules, Custom API)

## Views (SavedQuery)

### ⚠️ Idempotent Check Required — Views Duplicate Silently

`savedqueries` has **no unique constraint on name**. Every `POST` creates a new record. Always query by name + `returnedtypecode` before creating:

```python
existing = api_get(f"savedqueries?$filter=name eq '{view_name}' and returnedtypecode eq '{table_name}'&$select=savedqueryid")
if existing["value"]:
    view_id = existing["value"][0]["savedqueryid"]
    # Optionally PATCH to update
else:
    # Safe to POST
```

The same applies to `systemforms` — always check by name + `objecttypecode` before creating forms.

### Create System View
```http
POST /api/data/v9.2/savedqueries
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "Active Projects",
  "description": "All active projects",
  "returnedtypecode": "contoso_project",
  "querytype": 0,
  "fetchxml": "<fetch><entity name='contoso_project'><attribute name='contoso_name'/><attribute name='contoso_priority'/><attribute name='createdon'/><attribute name='statecode'/><filter><condition attribute='statecode' operator='eq' value='0'/></filter><order attribute='contoso_name'/></entity></fetch>",
  "layoutxml": "<grid name='resultset' object='{OTC}' jump='contoso_name' select='1' icon='1' preview='1'><row name='result' id='contoso_projectid'><cell name='contoso_name' width='300'/><cell name='contoso_priority' width='150'/><cell name='createdon' width='150'/><cell name='statecode' width='100'/></row></grid>",
  "isdefault": true
}
```

### Worked Example: View with 4 Columns (fetchxml + layoutxml alignment)

The `fetchxml` and `layoutxml` must include the **same attributes**. A column in `layoutxml` that is missing from `fetchxml` renders as a blank column in the view.

**Correct -- all 4 attributes in both fetchxml and layoutxml:**
```http
POST /api/data/v9.2/savedqueries
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "My Open Tasks",
  "description": "Open tasks with assignee, due date, and priority",
  "returnedtypecode": "contoso_task",
  "querytype": 0,
  "fetchxml": "<fetch><entity name='contoso_task'><attribute name='contoso_name'/><attribute name='contoso_assignedto'/><attribute name='contoso_duedate'/><attribute name='contoso_priority'/><filter><condition attribute='statecode' operator='eq' value='0'/></filter><order attribute='contoso_duedate'/></entity></fetch>",
  "layoutxml": "<grid name='resultset' object='{OTC}' jump='contoso_name' select='1' icon='1' preview='1'><row name='result' id='contoso_taskid'><cell name='contoso_name' width='250'/><cell name='contoso_assignedto' width='200'/><cell name='contoso_duedate' width='150'/><cell name='contoso_priority' width='100'/></row></grid>",
  "isdefault": false
}
```

> **Common Mistake:** If `contoso_priority` appears in `layoutxml` but is missing from `fetchxml`, the Priority column displays in the view header but every row shows a blank cell. The data is never fetched so it cannot be rendered. Always ensure every `<cell name='...'/>` in layoutxml has a matching `<attribute name='...'/>` in fetchxml.

### ⚠️ layoutxml `object` Attribute Required

The `<grid>` element MUST have an `object` attribute set to the entity's **ObjectTypeCode** (OTC). Omitting it returns `0x80040216: Invalid layout xml found. The required attribute 'object' is missing.`

```http
# Query the OTC first
GET /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')?$select=ObjectTypeCode
```

Use the returned integer as the `object` value: `<grid name='resultset' object='{OTC}' ...>`

⚠️ Note: The layoutxml XML schema is not publicly documented by Microsoft, but the Dataverse platform enforces this attribute at runtime. Verified via platform error `0x80040216`.

---

## Forms (SystemForm)

### Create Main Form
```http
POST /api/data/v9.2/systemforms
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "Project Main Form",
  "description": "Main form for project records",
  "objecttypecode": "contoso_project",
  "type": 2,
  "formxml": "<form><tabs><tab name='general' id='{TAB_GUID}' locklevel='0' showlabel='true' expanded='true'><labels><label description='General' languagecode='1033'/></labels><columns><column width='100%'><sections><section name='general_section' showlabel='true' id='{SECTION_GUID}'><labels><label description='General Information' languagecode='1033'/></labels><rows><row><cell id='{CELL_GUID}'><labels><label description='Project Name' languagecode='1033'/></labels><control id='contoso_name' classid='{4273EDBD-AC1D-40d3-9FB2-095C621B552D}' datafieldname='contoso_name'/></cell></row><row><cell id='{CELL_GUID2}'><labels><label description='Priority' languagecode='1033'/></labels><control id='contoso_priority' classid='{3EF39988-22BB-4f0b-BBBE-64B5A3748AEE}' datafieldname='contoso_priority'/></cell></row></rows></section></sections></column></columns></tab></tabs></form>"
}
```

### Create Main Form with Subgrid

When a form needs to display related records (e.g., Tasks on a Project), include a subgrid control:

```http
POST /api/data/v9.2/systemforms
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "Project Main Form",
  "objecttypecode": "contoso_project",
  "type": 2,
  "formxml": "<form><tabs><tab name='general' id='{TAB_GUID}' locklevel='0' showlabel='true' expanded='true'><labels><label description='General' languagecode='1033'/></labels><columns><column width='100%'><sections><section name='general_section' showlabel='true' id='{SECTION_GUID}'><labels><label description='General Information' languagecode='1033'/></labels><rows><row><cell id='{CELL_GUID}'><labels><label description='Project Name' languagecode='1033'/></labels><control id='contoso_name' classid='{4273EDBD-AC1D-40d3-9FB2-095C621B552D}' datafieldname='contoso_name'/></cell></row></rows></section><section name='tasks_section' showlabel='true' id='{SECTION_GUID2}'><labels><label description='Tasks' languagecode='1033'/></labels><rows><row><cell id='{CELL_GUID2}'><labels><label description='Tasks' languagecode='1033'/></labels><control id='contoso_tasks_subgrid' classid='{E7A81278-8635-4d9e-8D4D-59480B391C5B}'><parameters><ViewId>{ACTUAL_VIEW_GUID}</ViewId><TargetEntityType>contoso_task</TargetEntityType><RelationshipName>contoso_project_tasks</RelationshipName><AutoExpand>Fixed</AutoExpand><ViewIds>{ACTUAL_VIEW_GUID}</ViewIds><EnableQuickFind>true</EnableQuickFind></parameters></control></cell></row></rows></section></sections></column></columns></tab></tabs></form>"
}
```

**Subgrid classid:** `{E7A81278-8635-4d9e-8D4D-59480B391C5B}` is the standard subgrid control.

### ⚠️ CRITICAL: `datafieldname` Required on Field Controls

Every `<control>` element bound to a table column **MUST** include the `datafieldname` attribute. Without it, the control renders as an empty placeholder — forms appear with blank sections and no fields.

```xml
<!-- CORRECT: datafieldname binds the control to the column -->
<control id='contoso_name' classid='{4273EDBD-AC1D-40d3-9FB2-095C621B552D}' datafieldname='contoso_name'/>

<!-- WRONG: Missing datafieldname — renders as empty space -->
<control id='contoso_name' classid='{4273EDBD-AC1D-40d3-9FB2-095C621B552D}'/>
```

**Common field control classids:**
| ClassId | Control Type | Use For |
|---|---|---|
| `{4273EDBD-AC1D-40d3-9FB2-095C621B552D}` | Text (SingleLine.Text) | String columns |
| `{E0DECE4B-6FC8-4a8f-A065-082708572369}` | Text (Memo/MultiLine) | Multi-line text columns |
| `{3EF39988-22BB-4f0b-BBBE-64B5A3748AEE}` | OptionSet (Dropdown) | Choice columns |
| `{5B773807-9FB2-42db-97C3-7A91EFF8ADFF}` | DateTime | Date/DateTime columns |
| `{C6D124CA-7EDA-4a60-AEA9-7FB8D318B68F}` | Lookup | Lookup columns |
| `{B0C6723A-8503-4FD7-BB28-C8A06AC933C2}` | Boolean (Two Option) | Yes/No columns |
| `{C3EFE0C3-0EC6-42be-8349-CBD9079DFD8E}` | Number (WholeNumber) | Integer columns |
| `{E7A81278-8635-4d9e-8D4D-59480B391C5B}` | Subgrid | Related records (no datafieldname) |
| `{F9A8A302-114E-466A-B582-6771B2AE0D92}` | Unbound/Custom | Custom controls, iframes |

**Note:** Subgrid and unbound controls do NOT use `datafieldname` — they use `<parameters>` instead.

### ⚠️ Form XML ID Attributes Must Be GUIDs

All `id` attributes on `<tab>`, `<section>`, and `<cell>` elements MUST be valid GUIDs in `{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}` format. Text strings like `id="tab_general"` or `id="section_main"` fail XSD validation with `The 'id' attribute is invalid`. Use `uuid.uuid4()` (or `uuid.uuid5()` for deterministic builds).

### ⚠️ Quick Create Form: Section Columns Must Be "1"

Quick Create forms (`type: 7`) require `columns="1"` on all `<section>` elements. Using `columns="2"` returns error `0x80040203: Columns in a section must be set to '1'. Found '2'.`

To enable Quick Create on an entity:
```http
PUT /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')
Content-Type: application/json
If-Match: *
MSCRM.MergeLabels: true

{ "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata", "IsQuickCreateEnabled": true }
```

### ⚠️ Form Default and App Module Binding

Custom forms display in the app ONLY if:
1. Set as default: `"isdefault": true` on the custom form
2. Deactivate the auto-generated "Information" form: PATCH with `"formactivationstate": 0`
3. Explicitly bind to the app module via `AddAppComponents` (see solution-management.md)

> **Anti-pattern:** Never use `00000000-0000-0000-0000-000000000000` as `ViewId`. Query the actual view GUID first:
> ```http
> GET /api/data/v9.2/savedqueries?$filter=name eq 'Active Tasks' and returnedtypecode eq 'contoso_task'&$select=savedqueryid
> ```
> Use the returned `savedqueryid` as both `ViewId` and in `ViewIds`.

---

## Charts (SavedQueryVisualization)

### Create a Chart

```http
POST /api/data/v9.2/savedqueryvisualizations
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "Projects by Status",
  "description": "Bar chart showing project count by status",
  "primaryentitytypecode": "contoso_project",
  "datadescription": "<datadefinition><fetchcollection><fetch mapping='logical' aggregate='true'><entity name='contoso_project'><attribute name='contoso_projectid' aggregate='count' alias='count'/><attribute name='statecode' groupby='true' alias='status'/></entity></fetch></fetchcollection><categorycollection><category><measurecollection><measure alias='count'/></measurecollection></category></categorycollection></datadefinition>",
  "presentationdescription": "<Chart><Series><Series ChartType='Column' IsValueShownAsLabel='true'/></Series><ChartAreas><ChartArea><AxisY Title='Count' TitleForeColor='59, 59, 59'/><AxisX Title='Status' TitleForeColor='59, 59, 59'/></ChartArea></ChartAreas></Chart>"
}
```

### ⚠️ Chart XML Schema Rules

**Axis titles MUST be attributes, NOT nested elements:**
```xml
<!-- CORRECT: Title as attribute -->
<AxisY Title="Count" TitleForeColor="59, 59, 59"/>

<!-- WRONG: Title as nested element — Dataverse rejects this -->
<AxisY><Title>Count</Title></AxisY>
```

**Chart types** (use in `ChartType` attribute): `Column`, `Bar`, `Line`, `Pie`, `Area`, `StackedColumn`, `StackedBar`, `StackedArea`, `Funnel`

### ⚠️ Charts Require Full PresentationDescription XML

Minimal PresentationDescription XML that passes API validation can still fail at render time. Use the **full MS official format** with all styling attributes:

```xml
<Chart Palette="None" PaletteCustomColors="91,151,213; 237,125,49; 160,116,166; 255,192,0; 68,114,196; 112,173,71">
  <Series>
    <Series ChartType="Column" IsValueShownAsLabel="True" Color="91, 151, 213"
      Font="{0}, 9.5px" LabelForeColor="59, 59, 59"
      CustomProperties="PointWidth=0.75, MaxPixelPointWidth=40">
      <SmartLabelStyle Enabled="True"/>
    </Series>
  </Series>
  <ChartAreas>
    <ChartArea BorderColor="White" BorderDashStyle="Solid">
      <AxisY LabelAutoFitMinFontSize="8" TitleForeColor="59, 59, 59"
        TitleFont="{0}, 10.5px" LineColor="165, 172, 181">
        <MajorGrid LineColor="239, 242, 246"/>
        <LabelStyle Font="{0}, 10.5px" ForeColor="59, 59, 59"/>
      </AxisY>
      <AxisX LabelAutoFitMinFontSize="8" TitleForeColor="59, 59, 59"
        TitleFont="{0}, 10.5px" LineColor="165, 172, 181">
        <MajorGrid Enabled="False"/>
        <MajorTickMark Enabled="False"/>
        <LabelStyle Font="{0}, 10.5px" ForeColor="59, 59, 59"/>
      </AxisX>
    </ChartArea>
  </ChartAreas>
  <Titles>
    <Title DockingOffset="-3" Font="{0}, 13px" ForeColor="59, 59, 59" Alignment="TopLeft"/>
  </Titles>
</Chart>
```

**DataDescription aliases:** Use MS standard `groupby_column` and `aggregate_column` — non-standard aliases may cause render errors.

**After creating charts:** Bind to app module via `AddAppComponents` with `@odata.type: Microsoft.Dynamics.CRM.savedqueryvisualization`.

---

## Dashboards (SystemForm type=0)

### Create a System Dashboard

```http
POST /api/data/v9.2/systemforms
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "Project Overview Dashboard",
  "objecttypecode": "none",
  "type": 0,
  "formxml": "<form><tabs><tab name='tab1' id='{TAB_GUID}' showlabel='false' expanded='true'><labels><label description='Overview' languagecode='1033'/></labels><columns><column width='50%'><sections><section name='sec1' id='{SEC_GUID}' showlabel='false'><labels><label description='' languagecode='1033'/></labels><rows><row><cell id='{CELL_GUID}' showlabel='false'><labels><label description='Active Projects' languagecode='1033'/></labels><control id='view_active' classid='{E7A81278-8635-4d9e-8D4D-59480B391C5B}'><parameters><ViewId>{ACTUAL_VIEW_GUID}</ViewId><IsUserView>false</IsUserView><TargetEntityType>contoso_project</TargetEntityType><AutoExpand>Fixed</AutoExpand><RecordsPerPage>10</RecordsPerPage></parameters></control></cell></row></rows></section></sections></column><column width='50%'><sections><section name='sec2' id='{SEC_GUID2}' showlabel='false'><labels><label description='' languagecode='1033'/></labels><rows><row><cell id='{CELL_GUID2}' showlabel='false'><labels><label description='Projects by Status' languagecode='1033'/></labels><control id='chart_status' classid='{E7A81278-8635-4d9e-8D4D-59480B391C5B}'><parameters><ViewId>{ACTUAL_VIEW_GUID}</ViewId><IsUserView>false</IsUserView><IsUserChart>false</IsUserChart><TargetEntityType>contoso_project</TargetEntityType><ChartGridMode>Chart</ChartGridMode><VisualizationId>{ACTUAL_CHART_GUID}</VisualizationId></parameters></control></cell></row></rows></section></sections></column></columns></tab></tabs></form>"
}
```

### ⚠️ Dashboard FormXML Rules

1. **`type: 0`** — Dashboards use form type 0 (not type 2 which is main form)
2. **`objecttypecode: "none"`** — Dashboards are not entity-bound
3. **Do NOT use `IsUserDefined='0'`** on `<tab>` elements — this attribute is invalid for system dashboards and causes creation to fail
4. **Control classid:** Use `{E7A81278-8635-4d9e-8D4D-59480B391C5B}` (standard subgrid/chart control) for both list views and charts
5. **ChartGridMode:** Set to `Chart` for chart-only, `All` for grid+chart combo
6. **Always use real GUIDs** for `ViewId` and `VisualizationId` — query them first
7. **ALL 14 control parameters are required** — minimal FormXML that passes PATCH validation still fails at render time. Required params per control:
   - `TargetEntityType`, `ChartGridMode`, `EnableQuickFind`, `EnableViewPicker`, `EnableJumpBar`, `RecordsPerPage`, `ViewId`, `IsUserView`, `ViewIds`, `AutoExpand`, `VisualizationId`, `IsUserChart`, `EnableChartPicker`, `RelationshipName`
8. **Cell attributes:** Every `<cell>` needs `colspan`, `rowspan`, and `auto='false'`
9. **Row count must match rowspan:** If `rowspan='12'`, include 11 empty `<row/>` elements after the data row
10. **Section `columns` attribute:** `'111'` = 3-column, `'11'` = 2-column
11. **Dashboard must be separately bound** to app module via `AddAppComponents` with `@odata.type: Microsoft.Dynamics.CRM.systemform`
12. **Use single `<Area>` in sitemap** for left-nav groups — multiple Areas render as bottom tabs

Query GUIDs:

```http
# Get view GUID
GET /api/data/v9.2/savedqueries?$filter=name eq 'Active Projects' and returnedtypecode eq 'contoso_project'&$select=savedqueryid

# Get chart GUID
GET /api/data/v9.2/savedqueryvisualizations?$filter=name eq 'Projects by Status'&$select=savedqueryvisualizationid
```

---

## Business Rules

### Create via Web API
```http
POST /api/data/v9.2/workflows
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "Set Default Priority",
  "type": 1,
  "category": 2,
  "primaryentity": "contoso_project",
  "scope": 1,
  "statecode": 1,
  "statuscode": 2,
  "xaml": "<Activity x:Class=\"SetDefaultPriority\" ...><!-- XAML definition --></Activity>"
}
```
**Note:** Business rules are complex XAML. Prefer creating them in the maker portal and exporting via solution. Use the Web API for activation/deactivation and querying existing rules.

---

## Custom API

### Define Custom API
```http
POST /api/data/v9.2/customapis
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "uniquename": "contoso_CalculateProjectHealth",
  "name": "Calculate Project Health",
  "displayname": "Calculate Project Health",
  "description": "Calculates and returns the health score for a project",
  "bindingtype": 1,
  "boundentitylogicalname": "contoso_project",
  "isfunction": false,
  "isprivate": false,
  "allowedcustomprocessingsteptype": 0,
  "plugintypeid@odata.bind": "/plugintypes(guid-of-plugin-type)"
}
```

### Define Request Parameters
```http
POST /api/data/v9.2/customapirequestparameters
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "uniquename": "IncludeHistory",
  "name": "Include History",
  "displayname": "Include History",
  "type": 0,
  "isoptional": true,
  "logicalentityname": null,
  "CustomAPIId@odata.bind": "/customapis(guid)"
}
```

### Define Response Properties
```http
POST /api/data/v9.2/customapiresponseproperties
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "uniquename": "HealthScore",
  "name": "Health Score",
  "displayname": "Health Score",
  "type": 3,
  "CustomAPIId@odata.bind": "/customapis(guid)"
}
```

### Call Custom API
```http
# Bound action (on specific record)
POST /api/data/v9.2/contoso_projects(guid)/Microsoft.Dynamics.CRM.contoso_CalculateProjectHealth
Content-Type: application/json

{
  "IncludeHistory": true
}

# Unbound action
POST /api/data/v9.2/contoso_MyGlobalAction
Content-Type: application/json

{
  "InputParam1": "value"
}
```

### Custom API Type Values
| Type Value | Data Type |
|---|---|
| 0 | Boolean |
| 1 | DateTime |
| 2 | Decimal |
| 3 | Integer (Int32) |
| 4 | Money |
| 5 | Picklist |
| 6 | String |
| 7 | StringArray |
| 8 | EntityReference |
| 9 | Float |
| 10 | Guid |
| 11 | Entity |
| 12 | EntityCollection |
