# Grid Controls Configuration

## Overview

The **Power Apps grid control** is the modern, unified grid for model-driven apps. It replaces both the legacy Editable Grid and Power Apps Read-Only Grid controls (deprecated March 2026). It supports inline editing, infinite scrolling, nested grids, grouping, aggregation, and custom cell rendering via PCF extensibility APIs.

## Power Apps Grid Control vs Legacy Grids

| Feature | Power Apps Grid Control | Editable Grid (Deprecated) | Read-Only Grid (Deprecated) |
|---|---|---|---|
| Inline editing | Yes (configurable) | Yes | No |
| Infinite scroll | Yes | No (paged) | No (paged) |
| Nested grids | Yes | Limited (phone/tablet) | No |
| Grouping | Yes | Yes | No |
| Aggregation | Yes (sum/min/max/avg) | No | No |
| Custom renderers | Yes (PCF extensibility) | No | No |
| Accessibility | WCAG 2.2 AA | Older standards | Older standards |
| Status | **Active — use this** | Deprecated Mar 2026 | Deprecated Mar 2026 |

## Adding via Form XML

To add the Power Apps grid control to a subgrid on a form via Web API, update the form XML:

```xml
<cell id="{GUID}" showlabel="true" labelid="{LABEL_GUID}">
  <labels>
    <label description="Active Tasks" languagecode="1033" />
  </labels>
  <control id="contoso_tasks_subgrid" classid="{E7A81278-8635-4D9E-8D4D-59480B391C5B}"
           indicationOfSubgrid="true" isunbound="false">
    <parameters>
      <TargetEntityType>contoso_task</TargetEntityType>
      <ViewId>{VIEW-GUID}</ViewId>
      <ViewIds>{VIEW-GUID}</ViewIds>
      <EnableViewPicker>true</EnableViewPicker>
      <RelationshipName>contoso_project_tasks</RelationshipName>
      <PCFControlName>MscrmControls.Grid.PCFGridControl</PCFControlName>
    </parameters>
  </control>
</cell>
```

**Key ClassId values:**
| Control | ClassId |
|---|---|
| Power Apps Grid Control | `{E7A81278-8635-4D9E-8D4D-59480B391C5B}` |
| Legacy Editable Grid | `{0A9BE4BF-0D3F-4EAE-97C9-D65E3CD7BC41}` |
| Legacy Read-Only Grid | `{E7A81278-8635-4D9E-8D4D-59480B391C5B}` |

## Configuring Grid Properties

The Power Apps grid control exposes configurable properties via the form XML `<parameters>` section:

### Enable Editing
```xml
<PCFControlParams>
  <EnableEditing>true</EnableEditing>
</PCFControlParams>
```

### Full Property Reference

| Property | Values | Default | Description |
|---|---|---|---|
| `EnableEditing` | true/false | false | Toggle inline editing |
| `EnableFiltering` | true/false | true | Column header filter dropdowns |
| `EnableSorting` | true/false | true | Column header sort options |
| `EnableGrouping` | true/false | false | Group by column headers |
| `EnableAggregation` | true/false | false | Sum/min/max/avg on numeric columns |
| `AllowColumnReordering` | true/false | false | Drag-and-drop column reorder |
| `EnableMultiSelect` | true/false | true | Multi-row selection |
| `AllowRangeSelection` | true/false | true | Select range and copy to Excel |
| `EnablePagination` | true/false | false | Use pagination instead of infinite scroll |
| `EnableJumpBar` | true/false | false | Alphabetic jump bar |
| `RecordsPerPage` | number | 25 | Rows per page (when pagination enabled) |

## Configuring at Table Level via API

To set the Power Apps grid control as the default for all views of a table:

```http
POST /api/data/v9.2/SaveEntityRequest
Content-Type: application/json

{
  "EntityMetadata": {
    "LogicalName": "contoso_task",
    "Controls": [
      {
        "Key": "PowerAppsGridControl",
        "Value": {
          "ClassId": "E7A81278-8635-4D9E-8D4D-59480B391C5B",
          "FormFactor": 7,
          "Parameters": {
            "EnableEditing": "true",
            "EnableFiltering": "true",
            "EnableGrouping": "true"
          }
        }
      }
    ]
  }
}
```

**Note:** Table-level grid configuration is typically done via the maker portal (Table > Controls tab). The form-level approach (subgrid XML) is more commonly used in Web API builds.

## Nested Grids

Nested grids display related records inline when a user expands a row:

```xml
<PCFControlParams>
  <EnableEditing>true</EnableEditing>
  <NestedGridEntityLogicalName>contoso_subtask</NestedGridEntityLogicalName>
  <NestedGridViewId>{NESTED-VIEW-GUID}</NestedGridViewId>
  <NestedGridRelationshipName>contoso_task_subtasks</NestedGridRelationshipName>
</PCFControlParams>
```

**Requirements:**
- The nested entity must have a relationship to the parent entity
- Multiple rows can be expanded simultaneously
- Nested grids support the same editing capabilities as the parent grid
- Works on web and tablet; phone displays a simplified view

## Custom Cell Rendering (PCF Extensibility)

The Power Apps grid control supports custom cell renderers via PCF code components. This allows custom visuals per column:

```typescript
// Grid customizer control implements PAGridCustomizer interface
export class MyGridCustomizer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  public init(context: ComponentFramework.Context<IInputs>): void {
    // Register cell renderer overrides
    const eventHandler = context.parameters.EventHandler;
    eventHandler.addOnCustomRendererEvent(this.onCustomRenderer.bind(this));
  }

  private onCustomRenderer(event: any): void {
    const columnName = event.columnName;
    const value = event.value;

    if (columnName === "contoso_priority") {
      // Return custom React component for priority badges
      event.renderResult = this.renderPriorityBadge(value);
    }
  }
}
```

**Use cases for custom renderers:**
- Color-coded status badges
- Progress bars in numeric columns
- Custom formatted currency displays
- Clickable action buttons in cells

## Migrating from Legacy Editable Grid

### Step 1: Identify affected forms
Query forms using the legacy control ClassId:

```http
GET /api/data/v9.2/systemforms?$filter=contains(formxml,'0A9BE4BF-0D3F-4EAE-97C9-D65E3CD7BC41')&$select=name,objecttypecode
```

### Step 2: Update form XML
Replace the legacy ClassId with the Power Apps grid control ClassId and add PCF control params:

```http
PATCH /api/data/v9.2/systemforms({formid})
Content-Type: application/json
MSCRM.SolutionUniqueName: ContosoProjects

{
  "formxml": "<updated XML with new ClassId and PCFControlParams>"
}
```

### Step 3: Publish
```http
POST /api/data/v9.2/PublishXml
Content-Type: application/json

{
  "ParameterXml": "<importexportxml><entities><entity>contoso_task</entity></entities></importexportxml>"
}
```

### Migration Considerations

| Legacy Feature | Modern Equivalent | Notes |
|---|---|---|
| Inline editing | `EnableEditing: true` | Same user experience |
| Group by column | `EnableGrouping: true` | Enhanced with collapse/expand |
| Nested subgrid (tablet) | Nested grids (all clients) | Now works on web too |
| Business rule enforcement | Still enforced | Business rules work with modern grid |
| Form scripting events | Grid scripting API | Some event names changed |

## Client Scripting with Power Apps Grid

The grid exposes client API methods for custom scripting:

```javascript
// Get grid control reference
const gridControl = formContext.getControl("contoso_tasks_subgrid");

// Get selected rows
const selectedRows = gridControl.getGrid().getSelectedRows();

// Refresh the grid after external changes
gridControl.refresh();

// Add event handler for selection change
gridControl.addOnSelection(function(context) {
  const selectedIds = context.getFormContext()
    .getControl("contoso_tasks_subgrid")
    .getGrid()
    .getSelectedRows();
  // Handle selection
});
```

## Anti-Patterns

- **Still using legacy Editable Grid for new development** — deprecated March 2026. Use Power Apps grid control for all new work.
- **Enabling all grid features simultaneously** — grouping + pagination is not supported together. Choose one layout mode.
- **Not publishing after grid control changes** — form XML updates require `PublishXml` to take effect.
- **Using pagination when infinite scroll suffices** — infinite scroll provides a better UX for most scenarios. Only use pagination for very large datasets where users need deterministic page navigation.
- **Ignoring nested grid relationships** — nested grids require a valid 1:N relationship. Without it, the expand action silently fails.
- **Custom renderers without accessibility** — PCF cell renderers must include ARIA labels and keyboard navigation to maintain WCAG compliance.
