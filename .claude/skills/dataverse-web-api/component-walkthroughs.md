# Component Walkthroughs — Dataverse Web API

Step-by-step recipes for creating every Dataverse component type via Web API. Each recipe follows: **Check → Create → Add to Solution → Publish → Gotchas**.

**Prerequisites for all recipes:**
- Authenticated token (see `auth-and-scripting.md`)
- Use `api_get`/`api_post`/`api_patch` helpers from `build-recipe.md` Python template
- Every POST includes `MSCRM.SolutionUniqueName: {SOLUTION}` header unless noted
- Generate real GUIDs with `uuid4()` — never use placeholder zeros

---

## Group 1: Schema (No Publish Needed)

### 1. Publisher

**Prerequisites:** None — this is always the first step.

**Step 1: Check if exists**
```http
GET /api/data/v9.2/publishers?$filter=uniquename eq 'contoso'&$select=publisherid
```

**Step 2: Create** (only if Step 1 returns empty)
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

**Gotchas:**
- Publisher prefix cannot be changed after creation — choose carefully
- `customizationoptionvalueprefix` must be unique across your org

---

### 2. Solution

**Prerequisites:** Publisher must exist (Recipe 1).

**Step 1: Check if exists**
```http
GET /api/data/v9.2/solutions?$filter=uniquename eq 'ContosoProjects'&$select=solutionid
```

**Step 2: Create**
```http
POST /api/data/v9.2/solutions
Content-Type: application/json

{
  "uniquename": "ContosoProjects",
  "friendlyname": "Contoso Projects",
  "version": "1.0.0.0",
  "description": "Project management solution",
  "publisherid@odata.bind": "/publishers({publisher-guid})"
}
```

**Gotchas:**
- No `MSCRM.SolutionUniqueName` header on solution creation itself
- Query the publisher GUID from Step 1 of Recipe 1 for the `@odata.bind`

---

### 3. Table (Entity)

**Prerequisites:** Solution must exist (Recipe 2).

**Step 1: Check if exists**
```http
GET /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')
```
If 404, proceed. If 200, skip.

**Step 2: Create**
```http
POST /api/data/v9.2/EntityDefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
  "SchemaName": "contoso_Project",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Project", "LanguageCode": 1033 }] },
  "DisplayCollectionName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Projects", "LanguageCode": 1033 }] },
  "Description": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Custom project table", "LanguageCode": 1033 }] },
  "OwnershipType": "UserOwned",
  "IsActivity": false,
  "HasNotes": true,
  "HasActivities": true,
  "PrimaryNameAttribute": "contoso_name",
  "Attributes": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
      "AttributeType": "String",
      "SchemaName": "contoso_name",
      "MaxLength": 200,
      "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Project Name", "LanguageCode": 1033 }] },
      "IsPrimaryName": true,
      "RequiredLevel": { "Value": "ApplicationRequired" }
    }
  ]
}
```

**Gotchas:**
- `@odata.type` required on BOTH the root entity AND each attribute in the `Attributes` array
- Exactly ONE attribute must have `IsPrimaryName: true` — must be StringAttributeMetadata
- `OwnershipType` is permanent — cannot change after creation
- Table logical name is permanent — choose carefully
- Auto-added to solution via `MSCRM.SolutionUniqueName` header

---

### 4. Column (String)

**Prerequisites:** Table must exist (Recipe 3).

**Step 1: Check if exists**
```http
GET /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes(LogicalName='contoso_description')
```

**Step 2: Create**
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
  "SchemaName": "contoso_description",
  "MaxLength": 4000,
  "FormatName": { "Value": "TextArea" },
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Description", "LanguageCode": 1033 }] },
  "RequiredLevel": { "Value": "None" }
}
```

**Gotchas:**
- `FormatName` values: `Text` (single line), `TextArea` (multi-line), `Email`, `Url`, `Phone`
- Column data type is permanent — cannot change after creation
- See `metadata.md` column type reference for all `@odata.type` values

---

### 5. Column (Choice/OptionSet)

**Prerequisites:** Table must exist.

**Step 1: Check** — same pattern as Recipe 4 with `LogicalName='contoso_priority'`

**Step 2: Create**
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
  "SchemaName": "contoso_priority",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Priority", "LanguageCode": 1033 }] },
  "RequiredLevel": { "Value": "ApplicationRequired" },
  "OptionSet": {
    "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
    "IsGlobal": false,
    "OptionSetType": "Picklist",
    "Options": [
      { "Value": 100000000, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Low", "LanguageCode": 1033 }] } },
      { "Value": 100000001, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Medium", "LanguageCode": 1033 }] } },
      { "Value": 100000002, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "High", "LanguageCode": 1033 }] } }
    ]
  }
}
```

**Gotchas:**
- Option values start at 100000000 for custom choices (publisher prefix range)
- `@odata.type` needed on both the attribute AND the OptionSetMetadata
- Set `IsGlobal: false` for table-local choices, `true` for reusable global option sets

---

### 6. Column (DateTime)

**Prerequisites:** Table must exist.

**Step 2: Create**
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
  "SchemaName": "contoso_startdate",
  "Format": "DateOnly",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Start Date", "LanguageCode": 1033 }] },
  "RequiredLevel": { "Value": "None" }
}
```

**Gotchas:**
- `Format`: `DateOnly` or `DateAndTime` — cannot change after creation

---

### 7. Column (Integer)

**Step 2: Create**
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
  "SchemaName": "contoso_estimatedhours",
  "MinValue": 0,
  "MaxValue": 100000,
  "Format": "None",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Estimated Hours", "LanguageCode": 1033 }] },
  "RequiredLevel": { "Value": "None" }
}
```

**Gotchas:**
- `Format` options: `None`, `Duration`, `Language`, `Locale`

---

### 8. Column (Decimal/Money)

**Step 2: Create (Money)**
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
  "SchemaName": "contoso_budget",
  "MinValue": 0,
  "MaxValue": 1000000000,
  "Precision": 2,
  "PrecisionSource": 0,
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Budget", "LanguageCode": 1033 }] },
  "RequiredLevel": { "Value": "None" }
}
```

**Gotchas:**
- Money columns auto-create a `_base` companion column (base currency value)
- `PrecisionSource`: 0 = use `Precision` value, 1 = org pricing precision, 2 = currency precision
- For `DecimalAttributeMetadata`: same structure without `PrecisionSource`

---

### 9. Column (Boolean)

**Step 2: Create**
```http
POST /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
  "SchemaName": "contoso_isactive",
  "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Is Active", "LanguageCode": 1033 }] },
  "RequiredLevel": { "Value": "None" },
  "OptionSet": {
    "@odata.type": "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata",
    "TrueOption": { "Value": 1, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Yes", "LanguageCode": 1033 }] } },
    "FalseOption": { "Value": 0, "Label": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "No", "LanguageCode": 1033 }] } }
  }
}
```

---

### 10. Column (Lookup)

Lookup columns are **not created directly** — they are created as a side effect of a 1:N relationship. See Recipe 11.

---

### 11. Relationship (1:N)

**Prerequisites:** Both tables must exist.

**Step 1: Check if exists**
```http
GET /api/data/v9.2/RelationshipDefinitions(SchemaName='contoso_project_tasks')
```

**Step 2: Create**
```http
POST /api/data/v9.2/RelationshipDefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
  "SchemaName": "contoso_project_tasks",
  "ReferencedEntity": "contoso_project",
  "ReferencedAttribute": "contoso_projectid",
  "ReferencingEntity": "contoso_task",
  "Lookup": {
    "SchemaName": "contoso_ProjectId",
    "DisplayName": { "@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [{ "Label": "Project", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" }
  },
  "CascadeConfiguration": {
    "Delete": "RemoveLink",
    "Assign": "NoCascade",
    "Share": "NoCascade",
    "Unshare": "NoCascade",
    "Merge": "NoCascade",
    "Reparent": "NoCascade"
  }
}
```

**Gotchas:**
- `ReferencedEntity` = the "one" side (parent), `ReferencingEntity` = the "many" side (child)
- The `Lookup` block creates the lookup column on the child table automatically
- `CascadeConfiguration.Delete`: use `RemoveLink` (nullify lookup) or `Restrict` (prevent parent delete) — avoid `Cascade` (deletes children)

---

### 12. Relationship (N:N)

**Prerequisites:** Both tables must exist.

**Step 2: Create**
```http
POST /api/data/v9.2/RelationshipDefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "@odata.type": "Microsoft.Dynamics.CRM.ManyToManyRelationshipMetadata",
  "SchemaName": "contoso_contact_project",
  "Entity1LogicalName": "contact",
  "Entity2LogicalName": "contoso_project",
  "IntersectEntityName": "contoso_contact_project"
}
```

**Gotchas:**
- Creates an invisible intersection table — `IntersectEntityName` must be globally unique
- Neither entity gets a new column; records are linked via the intersection table

---

## Group 2: Customizations (Publish Required)

All recipes in this group require `PublishXml` after creation (see Step 4 pattern below).

**Publish pattern for all Group 2 recipes:**
```http
POST /api/data/v9.2/PublishXml
Content-Type: application/json

{ "ParameterXml": "<importexportxml><entities><entity>contoso_project</entity></entities></importexportxml>" }
```

### 13. System View

**Prerequisites:** Table must exist with columns you want to display.

**Step 1: Check if exists**
```http
GET /api/data/v9.2/savedqueries?$filter=name eq 'Active Projects' and returnedtypecode eq 'contoso_project'&$select=savedqueryid
```

**Step 2: Create**
```http
POST /api/data/v9.2/savedqueries
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "Active Projects",
  "description": "All active projects",
  "returnedtypecode": "contoso_project",
  "querytype": 0,
  "fetchxml": "<fetch><entity name='contoso_project'><attribute name='contoso_name'/><attribute name='contoso_priority'/><attribute name='contoso_startdate'/><attribute name='statecode'/><filter><condition attribute='statecode' operator='eq' value='0'/></filter><order attribute='contoso_name'/></entity></fetch>",
  "layoutxml": "<grid name='resultset' object='{OTC}' jump='contoso_name' select='1' icon='1' preview='1'><row name='result' id='contoso_projectid'><cell name='contoso_name' width='300'/><cell name='contoso_priority' width='150'/><cell name='contoso_startdate' width='150'/><cell name='statecode' width='100'/></row></grid>",
  "isdefault": true
}
```

**Step 2b: Query ObjectTypeCode** (required for `object` attribute in layoutxml)
```http
GET /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')?$select=ObjectTypeCode
```
Use the returned `ObjectTypeCode` integer as the `object` value in the `<grid>` element.

**Gotchas:**
- Every `<cell name>` in layoutxml MUST have a matching `<attribute name>` in fetchxml — missing = blank column
- `querytype`: 0 = Public view, 4 = Quick Find, 64 = Lookup
- The `object` attribute on `<grid>` MUST be the entity's ObjectTypeCode — omitting it returns `0x80040216: Invalid layout xml`

---

### 14. Quick Find View

**Prerequisites:** Table must exist.

**Step 2: Create**
```http
POST /api/data/v9.2/savedqueries
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "Project Quick Find",
  "returnedtypecode": "contoso_project",
  "querytype": 4,
  "isquickfindquery": true,
  "fetchxml": "<fetch><entity name='contoso_project'><attribute name='contoso_name'/><attribute name='contoso_priority'/><filter type='and'><condition attribute='statecode' operator='eq' value='0'/><filter type='or' isquickfindfields='1'><condition attribute='contoso_name' operator='like' value='{0}'/></filter></filter><order attribute='contoso_name'/></entity></fetch>",
  "layoutxml": "<grid name='resultset' object='{OTC}' jump='contoso_name' select='1' icon='1' preview='1'><row name='result' id='contoso_projectid'><cell name='contoso_name' width='300'/><cell name='contoso_priority' width='150'/></row></grid>"
}
```

**Gotchas:**
- `querytype` is `4` for Quick Find (NOT 64 — that is Lookup view)
- The inner `<filter>` must have `isquickfindfields='1'` — this identifies which columns are searchable
- `{0}` is the search term placeholder
- `isquickfindquery: true` must be set on the record

---

### 15. Main Form

**Prerequisites:** Table + columns must exist.

**Step 1: Check if exists**
```http
GET /api/data/v9.2/systemforms?$filter=objecttypecode eq 'contoso_project' and type eq 2 and name eq 'Project Main Form'&$select=formid
```

**Step 2: Create**
```http
POST /api/data/v9.2/systemforms
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "Project Main Form",
  "description": "Main form for project records",
  "objecttypecode": "contoso_project",
  "type": 2,
  "formxml": "<form><tabs><tab name='general' id='{TAB_GUID}' locklevel='0' showlabel='true' expanded='true'><labels><label description='General' languagecode='1033'/></labels><columns><column width='100%'><sections><section name='general_section' showlabel='true' id='{SECTION_GUID}'><labels><label description='General Information' languagecode='1033'/></labels><rows><row><cell id='{CELL1_GUID}'><labels><label description='Project Name' languagecode='1033'/></labels><control id='contoso_name' classid='{4273EDBD-AC1D-40d3-9FB2-095C621B552D}' datafieldname='contoso_name'/></cell></row><row><cell id='{CELL2_GUID}'><labels><label description='Priority' languagecode='1033'/></labels><control id='contoso_priority' classid='{3EF39988-22BB-4f0b-BBBE-64B5A3748AEE}' datafieldname='contoso_priority'/></cell></row><row><cell id='{CELL3_GUID}'><labels><label description='Start Date' languagecode='1033'/></labels><control id='contoso_startdate' classid='{5B773807-9FB2-42db-97C3-7A91EFF8ADFF}' datafieldname='contoso_startdate'/></cell></row><row><cell id='{CELL4_GUID}'><labels><label description='Budget' languagecode='1033'/></labels><control id='contoso_budget' classid='{C3EFE0C3-0EC6-42be-8349-CBD9079DFD8E}' datafieldname='contoso_budget'/></cell></row></rows></section></sections></column></columns></tab></tabs></form>"
}
```

**Gotchas:**
- **Every `<control>` bound to a column MUST have `datafieldname`** — without it, the field renders as empty space
- Replace `{TAB_GUID}`, `{SECTION_GUID}`, `{CELL1_GUID}` etc. with real `uuid4()` GUIDs — text strings like `id="tab_general"` fail XSD validation; IDs MUST be GUIDs in `{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}` format
- ClassID reference: see `customizations.md` for the full table (text=`4273EDBD`, choice=`3EF39988`, datetime=`5B773807`, number=`C3EFE0C3`, lookup=`C6D124CA`, boolean=`B0C6723A`, memo=`E0DECE4B`)
- `type: 2` = Main form
- Set `isdefault: true` on your custom form, then deactivate the auto-generated "Information" form (`formactivationstate: 0`) — otherwise the Information form displays instead of yours
- After creating forms, you MUST bind them to the app module via `AddAppComponents` (Recipe 25) — adding entities alone does NOT auto-include forms

---

### 16. Main Form with Subgrid

Same as Recipe 15, but add a section with a subgrid control for related records.

**Subgrid section to add inside `<sections>` (after the field section):**
```xml
<section name='tasks_section' showlabel='true' id='{SECTION_GUID2}'>
  <labels><label description='Tasks' languagecode='1033'/></labels>
  <rows><row><cell id='{CELL_GUID}'>
    <labels><label description='Tasks' languagecode='1033'/></labels>
    <control id='contoso_tasks_subgrid' classid='{E7A81278-8635-4d9e-8D4D-59480B391C5B}'>
      <parameters>
        <ViewId>{ACTUAL_VIEW_GUID}</ViewId>
        <TargetEntityType>contoso_task</TargetEntityType>
        <RelationshipName>contoso_project_tasks</RelationshipName>
        <AutoExpand>Fixed</AutoExpand>
        <ViewIds>{ACTUAL_VIEW_GUID}</ViewIds>
        <EnableQuickFind>true</EnableQuickFind>
      </parameters>
    </control>
  </cell></row></rows>
</section>
```

**Gotchas:**
- Subgrid classid: `{E7A81278-8635-4d9e-8D4D-59480B391C5B}` — no `datafieldname` on subgrids
- **Query the real view GUID** — never use `00000000-0000-0000-0000-000000000000`:
  ```http
  GET /api/data/v9.2/savedqueries?$filter=name eq 'Active Tasks' and returnedtypecode eq 'contoso_task'&$select=savedqueryid
  ```
- `RelationshipName` must match an existing 1:N relationship (Recipe 11)

---

### 17. Main Form with Multi-Tab Layout

Same structure as Recipe 15, but with multiple `<tab>` elements inside `<tabs>`:

```xml
<form><tabs>
  <tab name='general' id='{TAB1_GUID}' showlabel='true' expanded='true'>
    <labels><label description='General' languagecode='1033'/></labels>
    <!-- columns/sections/rows with field controls -->
  </tab>
  <tab name='details' id='{TAB2_GUID}' showlabel='true' expanded='true'>
    <labels><label description='Details' languagecode='1033'/></labels>
    <!-- additional field controls -->
  </tab>
  <tab name='related' id='{TAB3_GUID}' showlabel='true' expanded='true'>
    <labels><label description='Related Records' languagecode='1033'/></labels>
    <!-- subgrid controls -->
  </tab>
</tabs></form>
```

**Gotchas:**
- Each tab needs a unique `id` GUID
- Tabs render as horizontal tabs in Unified Interface
- Place subgrids in a dedicated "Related Records" tab for cleaner UX

---

### 18. Quick Create Form

**Prerequisites:** Table + columns must exist.

**Step 2: Create**
```http
POST /api/data/v9.2/systemforms
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "Project Quick Create",
  "objecttypecode": "contoso_project",
  "type": 7,
  "formxml": "<form><tabs><tab name='general' id='{TAB_GUID}' showlabel='false' expanded='true'><labels><label description='General' languagecode='1033'/></labels><columns><column width='100%'><sections><section name='general' showlabel='false' id='{SEC_GUID}'><labels><label description='' languagecode='1033'/></labels><rows><row><cell id='{CELL1}'><labels><label description='Name' languagecode='1033'/></labels><control id='contoso_name' classid='{4273EDBD-AC1D-40d3-9FB2-095C621B552D}' datafieldname='contoso_name'/></cell></row><row><cell id='{CELL2}'><labels><label description='Priority' languagecode='1033'/></labels><control id='contoso_priority' classid='{3EF39988-22BB-4f0b-BBBE-64B5A3748AEE}' datafieldname='contoso_priority'/></cell></row></rows></section></sections></column></columns></tab></tabs></form>"
}
```

**Gotchas:**
- `type: 7` = Quick Create form
- Quick create forms are single-column, simplified layout — include only essential fields
- **Section `columns` attribute MUST be `"1"`** — `columns="2"` returns error `0x80040203: Columns in a section must be set to '1'`
- Still requires `datafieldname` on every field control
- Enable Quick Create on the entity: `PUT /EntityDefinitions(LogicalName='...')` with `{"IsQuickCreateEnabled": true}` + headers `If-Match: *` and `MSCRM.MergeLabels: true`

---

### 19. Chart (Visualization)

**Prerequisites:** Table must exist with at least one groupable column.

**Step 1: Check if exists**
```http
GET /api/data/v9.2/savedqueryvisualizations?$filter=name eq 'Projects by Status' and primaryentitytypecode eq 'contoso_project'&$select=savedqueryvisualizationid
```

**Step 2: Create**
```http
POST /api/data/v9.2/savedqueryvisualizations
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "Projects by Status",
  "description": "Bar chart showing project count by status",
  "primaryentitytypecode": "contoso_project",
  "datadescription": "<datadefinition><fetchcollection><fetch mapping='logical' aggregate='true'><entity name='contoso_project'><attribute groupby='true' alias='groupby_column' name='statecode'/><attribute alias='aggregate_column' name='contoso_projectid' aggregate='count'/></entity></fetch></fetchcollection><categorycollection><category><measurecollection><measure alias='aggregate_column'/></measurecollection></category></categorycollection></datadefinition>",
  "presentationdescription": "<Chart Palette='None' PaletteCustomColors='91,151,213; 237,125,49; 160,116,166; 255,192,0; 68,114,196; 112,173,71; 37,94,145; 158,72,14; 117,55,125; 153,115,0; 38,68,120; 67,104,43'><Series><Series ChartType='Column' IsValueShownAsLabel='True' Color='91, 151, 213' Font='{0}, 9.5px' LabelForeColor='59, 59, 59' CustomProperties='PointWidth=0.75, MaxPixelPointWidth=40'><SmartLabelStyle Enabled='True'/></Series></Series><ChartAreas><ChartArea BorderColor='White' BorderDashStyle='Solid'><AxisY LabelAutoFitMinFontSize='8' TitleForeColor='59, 59, 59' TitleFont='{0}, 10.5px' LineColor='165, 172, 181'><MajorGrid LineColor='239, 242, 246'/><LabelStyle Font='{0}, 10.5px' ForeColor='59, 59, 59'/></AxisY><AxisX LabelAutoFitMinFontSize='8' TitleForeColor='59, 59, 59' TitleFont='{0}, 10.5px' LineColor='165, 172, 181'><MajorGrid Enabled='False'/><MajorTickMark Enabled='False'/><LabelStyle Font='{0}, 10.5px' ForeColor='59, 59, 59'/></AxisX></ChartArea></ChartAreas><Titles><Title DockingOffset='-3' Font='{0}, 13px' ForeColor='59, 59, 59' Alignment='TopLeft'/></Titles></Chart>"
}
```

**Gotchas:**
- **Use the full MS official PresentationDescription format** — minimal XML that passes API validation can still fail at render time
- Use MS standard aliases: `groupby_column` and `aggregate_column` — non-standard aliases may cause render errors
- `Palette='None'` + `PaletteCustomColors` = explicit color control (required for reliable rendering)
- Axis titles MUST be XML **attributes** (`TitleForeColor='59, 59, 59'`), NOT nested elements
- Chart types: `Column`, `Bar`, `Line`, `Pie`, `Area`, `StackedColumn`, `Funnel`
- After creation, bind chart to app module via `AddAppComponents` with `@odata.type: Microsoft.Dynamics.CRM.savedqueryvisualization`

---

### 20. System Dashboard

**Prerequisites:** At least one view and optionally one chart must exist.

**Step 1: Check if exists**
```http
GET /api/data/v9.2/systemforms?$filter=type eq 0 and name eq 'Project Overview Dashboard'&$select=formid
```

**Step 2: Create**
```http
POST /api/data/v9.2/systemforms
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "Project Overview Dashboard",
  "objecttypecode": "none",
  "type": 0,
  "formxml": "<form><tabs><tab showlabel='true' verticallayout='true' id='{TAB_GUID}' name='{TAB_GUID}' locklevel='0' expanded='true'><columns><column width='100%'><sections><section showlabel='false' showbar='false' columns='111' id='{SEC_GUID}' name='{SEC_GUID}'><rows><row><cell colspan='1' rowspan='12' showlabel='false' id='{CELL1_GUID}' auto='false'><control id='Chart1' classid='{E7A81278-8635-4d9e-8D4D-59480B391C5B}'><parameters><TargetEntityType>contoso_project</TargetEntityType><ChartGridMode>Chart</ChartGridMode><EnableQuickFind>true</EnableQuickFind><EnableViewPicker>false</EnableViewPicker><EnableJumpBar>true</EnableJumpBar><RecordsPerPage>12</RecordsPerPage><ViewId>{ACTUAL_VIEW_GUID}</ViewId><IsUserView>false</IsUserView><ViewIds></ViewIds><AutoExpand>Fixed</AutoExpand><VisualizationId>{ACTUAL_CHART_GUID}</VisualizationId><IsUserChart>false</IsUserChart><EnableChartPicker>false</EnableChartPicker><RelationshipName></RelationshipName></parameters></control></cell><cell colspan='1' rowspan='12' showlabel='false' id='{CELL2_GUID}' auto='false'><control id='Grid1' classid='{E7A81278-8635-4d9e-8D4D-59480B391C5B}'><parameters><TargetEntityType>contoso_project</TargetEntityType><ChartGridMode>All</ChartGridMode><EnableQuickFind>false</EnableQuickFind><EnableViewPicker>true</EnableViewPicker><EnableJumpBar>true</EnableJumpBar><RecordsPerPage>8</RecordsPerPage><ViewId>{ACTUAL_VIEW_GUID}</ViewId><IsUserView>false</IsUserView><ViewIds></ViewIds><AutoExpand>Fixed</AutoExpand><VisualizationId>{ACTUAL_CHART_GUID}</VisualizationId><IsUserChart>false</IsUserChart><EnableChartPicker>false</EnableChartPicker><RelationshipName></RelationshipName></parameters></control></cell></row><row/><row/><row/><row/><row/><row/><row/><row/><row/><row/><row/></rows></section></sections></column></columns></tab></tabs></form>"
}
```

**Gotchas:**
- `type: 0` for dashboards (NOT 2)
- `objecttypecode: "none"` — dashboards are not entity-bound
- Do NOT use `IsUserDefined` on `<tab>` elements — causes creation to fail
- **ALL 14 control parameters are required** for chart/grid rendering — missing params like `EnableQuickFind`, `EnableViewPicker`, `EnableJumpBar`, `ViewIds`, `EnableChartPicker`, `RelationshipName` cause blank panels even though the API accepts the FormXML without them
- `rowspan` on `<cell>` MUST match the number of `<row>` elements in the section (include 11 empty `<row/>` after the data row for `rowspan='12'`)
- Each cell needs `colspan`, `rowspan`, and `auto='false'` attributes
- Section `columns` attribute: `'111'` = 3-column layout, `'11'` = 2-column
- `ChartGridMode: Chart` for chart-only, `All` for grid+chart combo
- Query real GUIDs for `ViewId` and `VisualizationId` per panel — each panel needs its own correct pair
- Dashboard must be separately bound to app via `AddAppComponents` with `@odata.type: Microsoft.Dynamics.CRM.systemform`

---

### 21. Business Rule

Business rules have complex XAML definitions. **Create them in the maker portal** and export via solution.

The Web API is useful for querying and activating/deactivating existing rules:
```http
GET /api/data/v9.2/workflows?$filter=category eq 2 and primaryentity eq 'contoso_project'&$select=name,statecode
```

See `business-rules-api.md` for details on activation/deactivation via the Workflow entity.

---

## Group 3: App Module & Navigation

### 22. Web Resource (SVG Icon)

**Prerequisites:** Solution must exist.

**Step 1: Check if exists**
```http
GET /api/data/v9.2/webresourceset?$filter=name eq 'contoso_/icons/app_icon.svg'&$select=webresourceid
```

**Step 2: Create**
```http
POST /api/data/v9.2/webresourceset
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "contoso_/icons/app_icon.svg",
  "displayname": "App Icon",
  "description": "SVG icon for the model-driven app",
  "webresourcetype": 11,
  "content": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNzhkNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBkPSJNMyAzaDd2N0gzem0xMSAwaDd2N2gtN3pNMyAxNGg3djdIM3ptMTEgMGg3djdoLTd6Ii8+PC9zdmc+"
}
```

**Gotchas:**
- `webresourcetype`: 1=HTML, 2=CSS, 3=JS, 4=XML, 5=PNG, 6=JPG, 7=GIF, 10=ICO, **11=SVG**, 12=RESX
- `content` must be Base64-encoded
- `name` must use publisher prefix and forward slashes for path (e.g., `contoso_/icons/app.svg`)
- In Python: `import base64; content = base64.b64encode(svg_string.encode()).decode()`

---

### 23. App Module (Model-Driven App)

**Prerequisites:** Web resource for icon must exist (Recipe 22).

**Step 1: Check if exists**
```http
GET /api/data/v9.2/appmodules?$filter=uniquename eq 'contoso_ProjectsApp'&$select=appmoduleid
```
If empty, try unpublished:
```http
GET /api/data/v9.2/appmodules/Microsoft.Dynamics.CRM.RetrieveUnpublishedMultiple()?$select=name,uniquename,appmoduleid
```

**Step 2: Create**
```http
POST /api/data/v9.2/appmodules
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects
Prefer: return=representation

{
  "name": "Contoso Projects",
  "uniquename": "ProjectsApp",
  "description": "Project management application",
  "clienttype": 4,
  "webresourceid": "{webresource-guid-from-recipe-22}"
}
```

**Gotchas:**
- `uniquename` auto-prefixes with publisher prefix — pass `ProjectsApp`, NOT `contoso_ProjectsApp`
- `clienttype: 4` = Unified Interface (always use 4)
- Newly created apps are unpublished — invisible to standard GET queries

---

### 24. Add Entities to App

**Prerequisites:** App module (Recipe 23) and tables must exist.

**⚠️ CRITICAL: Entities CANNOT be directly bound via `AddAppComponents`.** There is no `@odata.type` for entity binding. Entities are **implicitly included** when their views and forms are bound to the app module.

**The correct approach:**
1. Create views for the entity (Recipe 13)
2. Create forms for the entity (Recipe 15)
3. Bind those views and forms to the app via `AddAppComponents` (Recipe 25)
4. The entity appears automatically in the app

**Do NOT attempt:**
- `POST /appmodulecomponents` with `componenttype: 1` — unreliable, query returns 0 results
- `AddAppComponents` with `@odata.type: Microsoft.Dynamics.CRM.entity` — returns 204 but no effect
- `AddAppComponents` with `@odata.type: Microsoft.Dynamics.CRM.appmodulecomponent` — key property error

**Gotchas:**
- Binding ALL views + forms + charts + dashboards for an entity is sufficient — the entity shows up
- The `appmodulecomponents` entity set query is unreliable for validation — verify by checking in-app rendering instead

---

### 25. Add Views/Forms/Charts/Dashboards to App

**Prerequisites:** App module + the components to add must exist.

**Step 2: Add via AddAppComponents action**
```http
POST /api/data/v9.2/AddAppComponents
Content-Type: application/json

{
  "AppId": "{appmodule-guid}",
  "Components": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.savedquery",
      "savedqueryid": "{view-guid}"
    },
    {
      "@odata.type": "Microsoft.Dynamics.CRM.systemform",
      "formid": "{form-or-dashboard-guid}"
    },
    {
      "@odata.type": "Microsoft.Dynamics.CRM.savedqueryvisualization",
      "savedqueryvisualizationid": "{chart-guid}"
    }
  ]
}
```

**Gotchas:**
- Each component MUST use entity-specific `@odata.type` — NOT `Microsoft.Dynamics.CRM.appcomponent`
- View = `savedquery` + `savedqueryid`, Form/Dashboard = `systemform` + `formid`, Chart = `savedqueryvisualization` + `savedqueryvisualizationid`
- Query component GUIDs first — never hardcode

---

### 26. Sitemap Configuration

**Prerequisites:** App module must exist (Recipe 23).

**Step 1: Find the auto-generated sitemap**
```http
GET /api/data/v9.2/sitemaps?$filter=_appmoduleid_value eq '{appmodule-guid}'&$select=sitemapid,sitemapxml
```

**Step 2: PATCH with proper navigation XML**
```http
PATCH /api/data/v9.2/sitemaps({sitemap-guid})
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "sitemapxml": "<SiteMap IntroducedVersion='7.0.0.0'><Area Id='MainArea' ResourceId='SitemapDesigner.MainArea' IntroducedVersion='7.0.0.0' DescriptionResourceId=''><Titles><Title LCID='1033' Title='Main'/></Titles><Group Id='MainGroup' ResourceId='SitemapDesigner.MainGroup' IntroducedVersion='7.0.0.0' DescriptionResourceId=''><Titles><Title LCID='1033' Title='Records'/></Titles><SubArea Id='sub_projects' Entity='contoso_project' IntroducedVersion='7.0.0.0' DescriptionResourceId=''><Titles><Title LCID='1033' Title='Projects'/></Titles></SubArea><SubArea Id='sub_tasks' Entity='contoso_task' IntroducedVersion='7.0.0.0' DescriptionResourceId=''><Titles><Title LCID='1033' Title='Tasks'/></Titles></SubArea></Group></Area></SiteMap>"
}
```

**Gotchas:**
- `IntroducedVersion` REQUIRED on `<SiteMap>`, `<Area>`, `<Group>`, `<SubArea>`
- Use `<Titles><Title LCID='1033' Title='...'/></Titles>` for names — NOT a `Title` attribute on the element
- Do NOT use `DashboardType` attribute — fails XSD validation
- No `appmodulesitemaps` endpoint exists — use `sitemaps` filtered by `_appmoduleid_value`
- **Use a SINGLE `<Area>` with multiple `<Group>` elements** — multiple Areas render as bottom tabs, not left-nav groups. One Area with Groups gives the expected left-nav panel in Unified Interface
- Dashboards are accessible via the built-in dashboard selector — do NOT add dashboard SubAreas (breaks sitemap navigation)

---

### 27. Validate App

```http
GET /api/data/v9.2/ValidateApp(AppModuleId={appmodule-guid})
```

**Gotchas:**
- This is a **FUNCTION (GET)**, not an action (POST)
- Response: `{ "AppValidationResponse": { "Success": true, "ValidationResults": [...] } }`
- Fix any validation errors before publishing

---

### 28. Publish App

```http
POST /api/data/v9.2/PublishXml
Content-Type: application/json

{
  "ParameterXml": "<importexportxml><appmodules><appmodule>{appmodule-guid}</appmodule></appmodules></importexportxml>"
}
```

**Gotchas:**
- Publish after every sitemap or component change
- App remains invisible to end users until published

---

## Group 4: Security

### 29. Security Role

**Prerequisites:** Solution must exist. Root Business Unit GUID needed.

**Step 1: Check if exists**
```http
GET /api/data/v9.2/roles?$filter=name eq 'Project Manager'&$select=roleid
```

**Step 1b: Get root Business Unit**
```http
GET /api/data/v9.2/businessunits?$filter=parentbusinessunitid eq null&$select=businessunitid
```

**Step 2: Create**
```http
POST /api/data/v9.2/roles
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "name": "Project Manager",
  "description": "Can manage projects and tasks within their business unit",
  "businessunitid@odata.bind": "/businessunits({root-bu-guid})",
  "isinherited": 1
}
```

**Gotchas:**
- `isinherited: 1` = Direct User + Team privileges (standard default)
- Must bind to root Business Unit via `@odata.bind`

---

### 30. Assign Privileges to Role

**Prerequisites:** Security role (Recipe 29) and tables must exist.

**Step 1: Find privilege IDs**
```http
GET /api/data/v9.2/privileges?$filter=contains(name,'contoso_project')&$select=name,privilegeid
```

**Step 2: Assign privileges**
```http
POST /api/data/v9.2/roles({roleid})/Microsoft.Dynamics.CRM.AddPrivilegesRole
Content-Type: application/json

{
  "Privileges": [
    { "PrivilegeId": "{prvCreatecontoso_project-GUID}", "Depth": 1 },
    { "PrivilegeId": "{prvReadcontoso_project-GUID}", "Depth": 1 },
    { "PrivilegeId": "{prvWritecontoso_project-GUID}", "Depth": 0 },
    { "PrivilegeId": "{prvDeletecontoso_project-GUID}", "Depth": 0 },
    { "PrivilegeId": "{prvAppendcontoso_project-GUID}", "Depth": 0 },
    { "PrivilegeId": "{prvAppendTocontoso_project-GUID}", "Depth": 0 }
  ]
}
```

**Gotchas:**
- Depth is an **integer**: 0=Basic (own), 1=Local (BU), 2=Deep (BU+child), 3=Global (org)
- **Org-owned tables ONLY support depth 3 (Global)** — depth 0/1/2 returns HTTP 400
- Always check `OwnershipType` before assigning: if `OrganizationOwned`, force depth to 3
- Privilege names follow pattern: `prv{Operation}{tablelogicalname}`

---

### 31. Column Security Profile

**Prerequisites:** Table and column to secure must exist.

**Step 1: Create profile**
```http
POST /api/data/v9.2/fieldsecurityprofiles
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{ "name": "Budget Viewers", "description": "Users who can view budget columns" }
```

**Step 2: Create field permission**
```http
POST /api/data/v9.2/fieldpermissions
Content-Type: application/json

{
  "entityname": "contoso_project",
  "attributelogicalname": "contoso_budget",
  "canread": 4,
  "canupdate": 0,
  "cancreate": 0,
  "fieldsecurityprofileid@odata.bind": "/fieldsecurityprofiles({profile-guid})"
}
```

**Step 3: Mark column as secured**
```http
PUT /api/data/v9.2/EntityDefinitions(LogicalName='contoso_project')/Attributes(LogicalName='contoso_budget')
Content-Type: application/json

{
  "@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
  "IsSecured": true
}
```

**Gotchas:**
- Permission values: 0 = Not Allowed, 4 = Allowed
- Field permissions have NO effect until `IsSecured: true` on the column
- Users without a matching profile see `*****` for secured columns

---

### 32. Assign Role to User/Team

**Assign role to user:**
```http
POST /api/data/v9.2/systemusers({userid})/systemuserroles_association/$ref
Content-Type: application/json

{ "@odata.id": "{BASE_URL}/roles({roleid})" }
```

**Assign role to team:**
```http
POST /api/data/v9.2/teams({teamid})/teamroles_association/$ref
Content-Type: application/json

{ "@odata.id": "{BASE_URL}/roles({roleid})" }
```

**Gotchas:**
- Prefer assigning roles to Entra ID group teams, not individual users
- `@odata.id` must be a full URL including the org base URL

---

## Group 5: Advanced

### 33. Environment Variable

**Prerequisites:** Solution must exist.

**Step 1: Create definition**
```http
POST /api/data/v9.2/environmentvariabledefinitions
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "schemaname": "contoso_ApiBaseUrl",
  "displayname": "API Base URL",
  "description": "Base URL for the external API",
  "type": 100000000,
  "defaultvalue": "https://api.example.com/v1",
  "isrequired": true
}
```

**Step 2: Create per-environment value (optional override)**
```http
POST /api/data/v9.2/environmentvariablevalues
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "schemaname": "contoso_ApiBaseUrl_Value",
  "value": "https://api-dev.example.com/v1",
  "EnvironmentVariableDefinitionId@odata.bind": "/environmentvariabledefinitions({definition-guid})"
}
```

**Gotchas:**
- Types: 100000000=String, 100000001=Number, 100000002=Boolean, 100000003=JSON, 100000005=Secret
- Boolean values use string `"yes"` or `"no"`, not JSON booleans
- Remove current values before exporting solution — don't ship dev-specific values
- See `environment-variables-api.md` for Key Vault integration, consumption patterns

---

### 34. Custom API

**Prerequisites:** Solution must exist. Plugin assembly if using server-side logic.

**Step 2: Create with deep insert (API + params + response in one call)**
```http
POST /api/data/v9.2/customapis
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "uniquename": "contoso_GetProjectHealth",
  "name": "Get Project Health",
  "displayname": "Get Project Health",
  "description": "Returns health score for a project",
  "bindingtype": 0,
  "isfunction": true,
  "isprivate": false,
  "allowedcustomprocessingsteptype": 0,
  "CustomAPIRequestParameters": [
    {
      "uniquename": "ProjectId",
      "name": "Project ID",
      "displayname": "Project ID",
      "type": 10,
      "isoptional": false,
      "logicalentityname": null
    }
  ],
  "CustomAPIResponseProperties": [
    {
      "uniquename": "HealthScore",
      "name": "Health Score",
      "displayname": "Health Score",
      "type": 7
    }
  ]
}
```

**Gotchas:**
- Functions (`isfunction: true`) must be called with `GET` and require `()` at end: `GET .../contoso_GetProjectHealth(ProjectId=@p)?@p='guid'`
- `IsOptional` is ONLY valid on request parameters — NOT response properties (causes import error)
- `uniquename`, `bindingtype`, `isfunction` cannot change after creation
- Parameter types: 0=Boolean, 6=String, 7=Integer, 10=Guid — see `custom-apis.md` for full table

---

### 35. Connection Reference

Connection references **cannot be created via the Web API**. They must be created in the maker portal (Power Apps or Power Automate) and exported as part of a solution.

**Handoff:** When your build script reaches connection references, output instructions for the maker to create them manually in the target environment.
