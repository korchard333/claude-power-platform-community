---
name: dashboards
description: "Dataverse System Dashboards and Chart Visualizations. Use when: creating dashboards, dashboard FormXML, chart XML, DataDescription XML, PresentationDescription XML, interactive dashboards, dashboard layout, embedding charts in Model-Driven Apps."
---

# Skill: System Dashboards & Chart Visualizations

## When to Use
Trigger when designing, creating, or managing system dashboards, chart visualizations, or interactive dashboards in Model-Driven Apps.

---

## Dashboard Types

| Type | Created In | Scope | Use Case |
|---|---|---|---|
| System Dashboard | Solution / Web API | Available to all users with access | Standard dashboards for the org |
| Personal Dashboard | App / MDA | Individual user only | User-specific views |
| Interactive Dashboard | Solution | All users | Multi-stream with interactive filtering — verify deprecation status before building new |
| Power BI Embedded | Solution | All users | Advanced analytics |

---

## System Dashboard via Web API

### Create Dashboard
```http
POST /api/data/v9.2/systemforms
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "Project Overview Dashboard",
  "description": "Dashboard showing project metrics and active tasks",
  "objecttypecode": "none",
  "type": 0,
  "formxml": "<see FormXML below>"
}
```

### ⚠️ Dashboard FormXML Rules

1. **`type: 0`** — Dashboards use form type 0 (not type 2 which is main form)
2. **`objecttypecode: "none"`** — Dashboards are not entity-bound
3. **Do NOT use `IsUserDefined`** on `<tab>` elements — this attribute is invalid for system dashboards
4. **ALL 14 control parameters are required** — minimal FormXML that passes PATCH validation still fails at render time
5. **Cell attributes:** Every `<cell>` needs `colspan`, `rowspan`, and `auto='false'`
6. **Row count must match rowspan:** If `rowspan='12'`, include 11 empty `<row/>` elements after the data row
7. **Section `columns` attribute:** `'111'` = 3-column, `'11'` = 2-column
8. **Dashboard must be separately bound** to app module via `AddAppComponents`

### Required Control Parameters (per chart/grid panel)

Every control in a dashboard MUST include ALL of these parameters — omitting any causes blank rendering even though the API accepts the FormXML:

| Parameter | Purpose |
|---|---|
| `TargetEntityType` | Table logical name |
| `ChartGridMode` | `Chart`, `Grid`, or `All` |
| `EnableQuickFind` | Quick search toggle |
| `EnableViewPicker` | View selector toggle |
| `EnableJumpBar` | Alphabetical jump bar |
| `RecordsPerPage` | Records per page (e.g., `10`) |
| `ViewId` | GUID of the view |
| `IsUserView` | `false` for system views |
| `ViewIds` | Same as ViewId (required duplicate) |
| `AutoExpand` | `Fixed` or `Auto` |
| `VisualizationId` | GUID of the chart (for chart panels) |
| `IsUserChart` | `false` for system charts |
| `EnableChartPicker` | Chart selector toggle |
| `RelationshipName` | Empty string for non-related grids |

### Dashboard FormXML Structure
```xml
<form>
  <tabs>
    <tab name="tab0" id="{TAB-GUID}" locklevel="0" showlabel="false">
      <labels>
        <label description="Dashboard" languagecode="1033" />
      </labels>
      <columns>
        <column width="50%">
          <sections>
            <section name="section0" showlabel="false" id="{SECTION-GUID-1}" columns="11">
              <labels>
                <label description="" languagecode="1033" />
              </labels>
              <rows>
                <row>
                  <cell id="{CELL-GUID-1}" showlabel="false" colspan="1" rowspan="12" auto="false">
                    <labels>
                      <label description="Active Projects" languagecode="1033" />
                    </labels>
                    <control id="Chart1" classid="{E7A81278-8635-4D9E-8D4D-59480B391C5B}">
                      <parameters>
                        <TargetEntityType>contoso_project</TargetEntityType>
                        <ChartGridMode>Chart</ChartGridMode>
                        <EnableQuickFind>true</EnableQuickFind>
                        <EnableViewPicker>true</EnableViewPicker>
                        <EnableJumpBar>true</EnableJumpBar>
                        <RecordsPerPage>10</RecordsPerPage>
                        <ViewId>{VIEW-GUID}</ViewId>
                        <IsUserView>false</IsUserView>
                        <ViewIds>{VIEW-GUID}</ViewIds>
                        <AutoExpand>Fixed</AutoExpand>
                        <VisualizationId>{CHART-GUID}</VisualizationId>
                        <IsUserChart>false</IsUserChart>
                        <EnableChartPicker>true</EnableChartPicker>
                        <RelationshipName></RelationshipName>
                      </parameters>
                    </control>
                  </cell>
                </row>
                <row /><row /><row /><row /><row /><row /><row /><row /><row /><row /><row />
              </rows>
            </section>
          </sections>
        </column>
        <column width="50%">
          <sections>
            <section name="section1" showlabel="false" id="{SECTION-GUID-2}" columns="11">
              <labels>
                <label description="" languagecode="1033" />
              </labels>
              <rows>
                <row>
                  <cell id="{CELL-GUID-2}" showlabel="false" colspan="1" rowspan="12" auto="false">
                    <labels>
                      <label description="My Active Tasks" languagecode="1033" />
                    </labels>
                    <control id="List1" classid="{E7A81278-8635-4D9E-8D4D-59480B391C5B}">
                      <parameters>
                        <TargetEntityType>contoso_task</TargetEntityType>
                        <ChartGridMode>Grid</ChartGridMode>
                        <EnableQuickFind>true</EnableQuickFind>
                        <EnableViewPicker>true</EnableViewPicker>
                        <EnableJumpBar>true</EnableJumpBar>
                        <RecordsPerPage>10</RecordsPerPage>
                        <ViewId>{VIEW-GUID-2}</ViewId>
                        <IsUserView>false</IsUserView>
                        <ViewIds>{VIEW-GUID-2}</ViewIds>
                        <AutoExpand>Fixed</AutoExpand>
                        <IsUserChart>false</IsUserChart>
                        <EnableChartPicker>false</EnableChartPicker>
                        <RelationshipName></RelationshipName>
                      </parameters>
                    </control>
                  </cell>
                </row>
                <row /><row /><row /><row /><row /><row /><row /><row /><row /><row /><row />
              </rows>
            </section>
          </sections>
        </column>
      </columns>
    </tab>
  </tabs>
</form>
```

### Dashboard Control Types
| ClassId | Control Type |
|---|---|
| `{E7A81278-8635-4D9E-8D4D-59480B391C5B}` | Chart or View Grid |
| `{3A17F498-FFAE-4c72-A889-7F4E0C88D5A8}` | IFrame (web resource) |
| `{9FDF5F91-88B1-47f4-AD53-C11EFC01A01D}` | Web Resource |

### ChartGridMode Values
| Value | Display |
|---|---|
| `Chart` | Shows chart visualization |
| `Grid` | Shows view grid (list of records) |
| `All` | Shows chart with grid below |

Query GUIDs:

```http
# Get view GUID
GET /api/data/v9.2/savedqueries?$filter=name eq 'Active Projects' and returnedtypecode eq 'contoso_project'&$select=savedqueryid

# Get chart GUID
GET /api/data/v9.2/savedqueryvisualizations?$filter=name eq 'Projects by Status'&$select=savedqueryvisualizationid
```

---

## Chart Visualizations

### Create Chart
```http
POST /api/data/v9.2/savedqueryvisualizations
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "Projects by Status",
  "description": "Pie chart showing project distribution by status",
  "primaryentitytypecode": "contoso_project",
  "datadescription": "<see DataDescription XML>",
  "presentationdescription": "<see PresentationDescription XML>",
  "isdefault": false
}
```

### ⚠️ Charts Require Full PresentationDescription XML

Minimal PresentationDescription XML that passes API validation can still fail at render time. Always use the **full MS official format** with all styling attributes.

### DataDescription XML (What Data to Show)

Use standard aliases `groupby_column` and `aggregate_column` — non-standard aliases may cause render errors.

```xml
<datadefinition>
  <fetchcollection>
    <fetch mapping="logical" aggregate="true">
      <entity name="contoso_project">
        <attribute name="contoso_projectid" aggregate="count" alias="aggregate_column" />
        <attribute name="statuscode" groupby="true" alias="groupby_column" />
        <filter>
          <condition attribute="statecode" operator="eq" value="0" />
        </filter>
      </entity>
    </fetch>
  </fetchcollection>
  <categorycollection>
    <category>
      <measurecollection>
        <measure alias="aggregate_column" />
      </measurecollection>
    </category>
  </categorycollection>
</datadefinition>
```

### PresentationDescription XML — Column Chart (Full Official Format)

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

### PresentationDescription XML — Pie Chart

```xml
<Chart Palette="None" PaletteCustomColors="91,151,213; 237,125,49; 165,165,165; 255,192,0; 68,114,196; 112,173,71; 37,94,145; 158,72,14; 99,99,99; 153,115,0">
  <Series>
    <Series ChartType="Pie" IsValueShownAsLabel="True" Font="{0}, 9.5px" LabelForeColor="59, 59, 59" CustomProperties="PieLabelStyle=Inside, PieDrawingStyle=Default">
      <SmartLabelStyle Enabled="True" />
    </Series>
  </Series>
  <ChartAreas>
    <ChartArea>
      <Area3DStyle Enable3D="false" />
    </ChartArea>
  </ChartAreas>
  <Legends>
    <Legend Alignment="Center" LegendStyle="Table" Docking="Bottom" IsEquallySpacedItems="True" Font="{0}, 11px" ForeColor="59, 59, 59" />
  </Legends>
</Chart>
```

### ⚠️ Chart XML Schema Rules

- **Axis titles MUST be attributes, NOT nested elements:** `<AxisY Title="Count"/>` not `<AxisY><Title>Count</Title></AxisY>`
- **Use standard aliases** in DataDescription: `groupby_column` and `aggregate_column`
- **After creating charts:** Bind to app module via `AddAppComponents` with `@odata.type: Microsoft.Dynamics.CRM.savedqueryvisualization`

### Chart Types
| ChartType Value | Visualization |
|---|---|
| `Column` | Vertical bar chart |
| `Bar` | Horizontal bar chart |
| `Line` | Line chart |
| `Pie` | Pie chart |
| `Funnel` | Funnel chart |
| `Area` | Area chart |
| `StackedColumn` | Stacked bar chart |
| `StackedBar` | Stacked horizontal bar |
| `Doughnut` | Doughnut chart |

---

## Add Dashboard to App Module

```http
POST /api/data/v9.2/AddAppComponents
Content-Type: application/json

{
  "AppId": "app-module-guid",
  "Components": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.systemform",
      "formid": "dashboard-systemform-guid"
    }
  ]
}
```

> ⚠️ Dashboards must be **separately** bound to the app module. Adding entities (via their views/forms) does NOT include dashboards. Each dashboard needs its own `AddAppComponents` call with `@odata.type: Microsoft.Dynamics.CRM.systemform`.

---

## Interactive Dashboards

### Multi-Stream Dashboard
Interactive dashboards support real-time filtering by clicking chart elements. Each stream shows a different view of the same or related entity.

```xml
<!-- Interactive dashboard streams in FormXML -->
<control id="Stream1" classid="{3A17F498-FFAE-4c72-A889-7F4E0C88D5A8}">
  <parameters>
    <StreamName>Active Projects</StreamName>
    <ViewId>{VIEW-GUID}</ViewId>
    <TargetEntityType>contoso_project</TargetEntityType>
    <EnableCharts>true</EnableCharts>
    <EnableFilters>true</EnableFilters>
  </parameters>
</control>
```

---

## Embedding Web Resources in Dashboards

```xml
<control id="WebResource1" classid="{9FDF5F91-88B1-47f4-AD53-C11EFC01A01D}">
  <parameters>
    <Url>contoso_/html/projectDashboard.html</Url>
    <PassParameters>true</PassParameters>
    <Security>false</Security>
    <Scrolling>no</Scrolling>
    <Border>false</Border>
  </parameters>
</control>
```

---

## Best Practices

### Layout
- Maximum 6 components per dashboard (performance)
- Charts on left, lists on right (natural eye flow)
- Use consistent chart types for similar data across dashboards
- Filter-friendly: ensure views support interactive filtering

### Views for Dashboards
- Create dedicated views for dashboard components (named `[Dashboard] - Active Projects`)
- Keep view column count low (4-6 columns) for readability
- Always filter to active records by default
- Use system views (not personal) for shared dashboards

---

## Anti-Patterns

- More than 6 components (causes slow loading)
- Personal views in shared dashboards (break when shared)
- Charts without filters (show misleading totals)
- Not adding dashboards to the app module (users can't find them)
- Complex web resources that make API calls on load (slow, error-prone)
- Hardcoded GUIDs in dashboard FormXML instead of view/chart references
- Using `IsUserDefined` attribute on tab elements (invalid for system dashboards)
- Omitting required control parameters (charts render blank)
- Using non-standard aliases in DataDescription (render failures)
- Minimal chart XML that passes validation but fails at render time

---

## Related Skills

- `model-driven-apps` — Dashboards are consumed in Model-Driven Apps
- `dataverse-web-api/customizations` — View and form creation for dashboard components
- `business-process-flows` — BPFs are a separate skill for process automation
