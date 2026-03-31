# Model-Driven Apps — Command Bar

Modern command bar customization uses **Command Designer** (maker portal, no XML required for common scenarios).

## Command Designer (No-Code)

```
Solution → [Entity] → Commands
  → New → Configure button:
    - Label, Icon
    - Action: JavaScript function OR Power Automate flow OR Navigate
    - Visibility rules: form type, field value, record state
    - Enable rules: same options
```

## Power Fx Commands

Power Fx commands are **GA** — use them for no-code/low-code command logic directly in the maker portal.

```
// Navigate to a URL
Navigate("https://contoso.sharepoint.com/sites/orders/" & Self.Selected.Item.contoso_ordernumber)

// Patch a record field
Patch(Orders, Self.Selected.Item, { contoso_status: 'contoso_status (Orders)'.Approved })

// Show notification
Notify("Order approved successfully", NotificationType.Success)

// Conditional visibility (Visible property)
Self.Selected.Item.contoso_status = 'contoso_status (Orders)'.Draft
```

Power Fx commands can reference `Self.Selected.Item` (current record) and `Self.Selected.AllItems` (multi-select in views).

## Modern Commands via JavaScript

```typescript
// Modern commands call a JavaScript function (same as classic ribbon):
namespace Contoso.Commands {
  export function executeApprove(primaryControl: Xrm.FormContext): void {
    const recordId = primaryControl.data.entity.getId();
    // ... execute action
  }
}
```

## RibbonDiffXml (Legacy)

Still required for scenarios the Command Designer cannot handle:
- Complex conditional visibility using multiple entity fields + security role checks
- Buttons that appear only on specific form types (Quick Create, related entity subgrids)
- Buttons in areas Command Designer doesn't support (global commands, Sub Grid ribbons)
- Overriding or hiding system buttons (e.g., disabling the Delete button conditionally)

### Basic XML Structure

```xml
<RibbonDiffXml>
  <CustomActions>
    <CustomAction Id="contoso.order.ApproveButton"
                  Location="Mscrm.Form.contoso_order.MainTab.Actions.Controls._children"
                  Sequence="50">
      <CommandUIDefinition>
        <Button Id="contoso.order.ApproveButton.Button"
                Command="contoso.order.ApproveCommand"
                LabelText="$LocLabels:contoso.order.ApproveLabel"
                Image32by32="$webresource:contoso_/icons/approve32.svg"
                TemplateAlias="o1" />
      </CommandUIDefinition>
    </CustomAction>
  </CustomActions>
  <CommandDefinitions>
    <CommandDefinition Id="contoso.order.ApproveCommand">
      <EnableRules>
        <EnableRule Id="contoso.order.EnableWhenDraft" />
      </EnableRules>
      <DisplayRules>
        <DisplayRule Id="contoso.order.ShowForActiveOnly" />
      </DisplayRules>
      <Actions>
        <JavaScriptFunction FunctionName="Contoso.Commands.executeApprove"
                            Library="$webresource:contoso_/scripts/commands.js">
          <CrmParameter Value="PrimaryControl" />
        </JavaScriptFunction>
      </Actions>
    </CommandDefinition>
  </CommandDefinitions>
</RibbonDiffXml>
```

> See `web-resources` skill for full Xrm Client API reference and web resource deployment patterns.

## Migration: Classic → Modern

| Classic Customization | Migrate to Command Designer? | Notes |
|---|---|---|
| Simple button with JS action | **Yes** | Direct migration — add as modern command |
| Button with visibility rule on field value | **Yes** | Use visibility rules in designer |
| Button with security role check | **Yes** | Use visibility rules (available in modern) |
| Button overriding system command | **No** | Still requires RibbonDiffXml |
| Subgrid-specific button | **No** | Not yet supported in designer |
| Button with complex multi-condition enable rules | **Partial** | Simple cases yes, complex chains need XML |
| Power Fx action (no JS) | **Yes — preferred** | Use Power Fx commands for new buttons |

**Recommendation:** Use Command Designer / Power Fx for all new commands. Only use RibbonDiffXml for legacy scenarios that the designer cannot handle.

## Modern Commands via Web API (appaction Entity)

Modern command bar buttons can be created programmatically using the `appactions` entity — no RibbonDiffXml required.

```http
POST /api/data/v9.2/appactions
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "contoso_assetform_checkout",
  "buttonlabeltext": "Check Out",
  "onclickeventtype": 2,
  "context": 1,
  "contextvalue": "contoso_asset",
  "location": 0,
  "type": 0,
  "fonticon": "$clientsvg:Add",
  "visibilitytype": 0
}
```

### Key Properties
| Property | Value | Description |
|---|---|---|
| `onclickeventtype` | `2` | JavaScript function |
| `context` | `1` | Entity context |
| `location` | `0` | Form toolbar |
| `type` | `0` | Standard button |
| `visibilitytype` | `0` | Always visible |

### Lookup Binding Requires SchemaName Casing (PascalCase)

When setting the JavaScript web resource via `@odata.bind`, use **PascalCase SchemaName**, not lowercase logical name:
- `"OnClickEventJavaScriptWebResourceId@odata.bind": "/webresourceset(guid)"` — correct
- `"onclickeventjavascriptwebresourceid@odata.bind"` — returns 400 (undeclared property)

**Pattern:** Create the appaction record first, then PATCH to add lookup bindings separately:
```http
PATCH /api/data/v9.2/appactions({id})
Content-Type: application/json

{
  "OnClickEventJavaScriptWebResourceId@odata.bind": "/webresourceset({webresource-guid})",
  "AppModuleId@odata.bind": "/appmodules({appmodule-guid})"
}
```

### JavaScript Parameters for PrimaryControl

Pass `[{"type":4,"value":null}]` for PrimaryControl (formContext equivalent):
```http
PATCH /api/data/v9.2/appactions({id})
{ "onclickeventjavascriptparameters": "[{\"type\":4,\"value\":null}]" }
```
Type 4 = PrimaryControl. Discover valid type codes by querying existing system appaction records.

### CRITICAL: Modern Commanding — primaryControl is a GUID String, NOT formContext

In modern commanding (`appaction` with type:4 PrimaryControl parameter), the `primaryControl` argument passed to your JavaScript function is a **38-character GUID string** (with braces), NOT a formContext object. This is different from classic ribbon commanding.

```javascript
// WRONG — will throw TypeError: formContext.getAttribute is not a function
function onCheckOut(primaryControl) {
    var status = primaryControl.getAttribute("contoso_status").getValue();
}

// CORRECT — primaryControl is a record GUID string in modern commanding
function onCheckOut(primaryControl) {
    var recordId = primaryControl.replace(/[{}]/g, "");
    Xrm.WebApi.retrieveRecord("contoso_asset", recordId, "?$select=contoso_assetname,contoso_status")
        .then(function(record) {
            // Use record.contoso_status etc.
            return Xrm.WebApi.updateRecord("contoso_asset", recordId, { "contoso_status": 3 });
        })
        .then(function() {
            // Refresh: modern commanding doesn't auto-refresh the form
            Xrm.Navigation.openForm({ entityName: "contoso_asset", entityId: recordId });
        });
}
```

> Note: Classic ribbon commands (RibbonDiffXml with `<CrmParameter Value="PrimaryControl" />`) DO receive formContext. Only `appaction`-based modern commands receive the GUID string.

### ⚠️ Option Set Values Use Publisher Prefix Directly

The publisher's **Option Value Prefix** (set during publisher creation, e.g., `88000`) is the literal start of the option value — NOT a base that gets `000` appended.

```
Publisher Option Value Prefix: 88000

Option values:
  88000 = first option   ← NOT 88000000
  88001 = second option  ← NOT 88000001
  88002 = third option   ← NOT 88000002
```

**Common mistake:** JavaScript comparisons like `record.contoso_status !== 88000000` always fail because the actual value is `88000`. The prefix is a 5-digit integer (range 10000–99999), and options increment from there: `{prefix}0`, `{prefix}1`, `{prefix}2`, etc.

When checking option set values in command bar JavaScript:
```javascript
// CORRECT — publisher prefix 88000, first option = 88000
if (record.contoso_status === 88000) { /* Available */ }
if (record.contoso_status === 88001) { /* Checked Out */ }

// WRONG — this is NOT how option values work
if (record.contoso_status === 88000000) { /* Never matches */ }
```

### Button Icons

Use `fonticon` property with `$clientsvg:` prefix for system icons:
- `$clientsvg:Add`, `$clientsvg:Edit`, `$clientsvg:Delete`, `$clientsvg:Repair`, `$clientsvg:Undo`
- Discover valid names: `GET /api/data/v9.2/appactions?$filter=fonticon ne null&$select=fonticon,buttonlabeltext&$top=50`
- Invalid icon names are silently accepted but render blank

### Lookup Form Parameter Naming for Pre-Population

When opening a Quick Create form from a command bar button (via `Xrm.Navigation.openForm`), lookup columns require **three parameters** to pre-populate correctly:

| Parameter | Format | Purpose |
|---|---|---|
| `{lookupcolumn}` | GUID (with or without braces) | The lookup value (record ID) |
| `{lookupcolumn}name` | String | Display name shown in the lookup field |
| `{lookupcolumn}type` | Entity logical name | Required for customer/owner lookups; optional for simple lookups |

**The column name must match the actual lookup column logical name exactly.** Discover via:
```http
GET /api/data/v9.2/EntityDefinitions(LogicalName='contoso_task')/Attributes/Microsoft.Dynamics.CRM.LookupAttributeMetadata?$select=LogicalName,SchemaName
```

```javascript
// Pre-populate a Quick Create form with a lookup value
Xrm.Navigation.openForm(
    { entityName: "contoso_maintenancelog", useQuickCreateForm: true },
    {
        contoso_assetid: recordId,           // Lookup GUID
        contoso_assetidname: record.contoso_assetname,  // Display name
        // contoso_assetidtype: "contoso_asset"  // Only needed for customer/owner lookups
    }
);
```

**Common mistake:** Using truncated or incorrect column names (e.g., `contoso_asset` instead of `contoso_assetid`). The parameter names must match the **logical name of the lookup column** exactly. Using the wrong name silently fails — the lookup field appears empty on the Quick Create form.

> **MS Learn reference:** [Set column values using parameters passed to a form](https://learn.microsoft.com/power-apps/developer/model-driven-apps/set-field-values-using-parameters-passed-form)

### appactionrule Restricted to First-Party Solutions

`POST /api/data/v9.2/appactionrules` with a custom solution returns:
`0x80040265: App Action rules should define only under Microsoft First party Solutions`

**Custom solutions CANNOT create enable/display rules via Web API.** The only option is `visibilitytype: 0` (always visible) with JavaScript validation at click time. Do not set `visibilitytype: 2` with zero rules — this may hide buttons permanently.

### Forms Must Be Re-Bound After Rebuild

Forms are NOT automatically included when entities are added to an app module. After any `AddAppComponents` rebuild, explicitly re-bind all Main + Quick Create forms for each entity. If forms stop appearing in the app, re-bind them.

## Icon Registration

### SVG Web Resources (Recommended)
```
Upload as web resource:
  Name: contoso_/icons/approve32.svg
  Type: SVG (recommended) or PNG
  Size: 32×32 (form/view toolbar), 16×16 (context menu)

Reference in Command Designer: Select "Use web resource" → pick the SVG
Reference in RibbonDiffXml: Image32by32="$webresource:contoso_/icons/approve32.svg"
```

### Fluent UI Icon References
Modern commands in the Command Designer support built-in Fluent UI icons — search by name in the icon picker. Use these when a standard system icon fits the action (e.g., "Checkmark", "Delete", "Send").
