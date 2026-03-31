# formContext API Reference

> For Xrm.WebApi, Navigation, Utility, and Device APIs, see xrm-client-api.md.
> For practical form script patterns (OnLoad, OnSave, OnChange), see form-scripts.md.

## Getting formContext

```typescript
// From event handler (CORRECT)
export function onLoad(executionContext: Xrm.Events.EventContext): void {
  const formContext = executionContext.getFormContext();
}

// From ribbon/command bar action (CORRECT)
export function onRibbonClick(primaryControl: Xrm.FormContext): void {
  const formContext = primaryControl;
}

// NEVER use Xrm.Page (deprecated since 2018)
```

---

## Form Types

```typescript
const formType = formContext.ui.getFormType();
```

| Value | Type | Use Case |
|---|---|---|
| 0 | Undefined | Form not fully loaded |
| 1 | Create | New record |
| 2 | Update | Existing record |
| 3 | Read Only | Read-only view |
| 4 | Disabled | Inactive record |
| 6 | Bulk Edit | Multi-record edit |

```typescript
// Only set defaults on Create
if (formContext.ui.getFormType() === 1) {
  formContext.getAttribute("contoso_status").setValue(100000000); // Default status
}
```

---

## formContext.data

| Method | Description |
|---|---|
| `addOnLoad(handler)` | Register handler for data load events |
| `removeOnLoad(handler)` | Remove data load handler |
| `getIsDirty()` | True if any attribute has changed |
| `isValid()` | True if all attributes pass validation |
| `refresh(save)` | Refresh form data; `save=true` saves first |
| `save(options)` | Save the record; options: `{saveMode: 1}` (save and close) |

### formContext.data.entity

| Method | Returns | Description |
|---|---|---|
| `addOnSave(handler)` | void | Register save handler |
| `removeonSave(handler)` | void | Remove save handler |
| `getDataXml()` | string | XML of changed fields |
| `getEntityName()` | string | Logical name (e.g., "contact") |
| `getEntityReference()` | EntityReference | {id, entityType, name} |
| `getId()` | string | Record GUID (with braces: `{guid}`) |
| `getIsDirty()` | boolean | Any field changed |
| `getPrimaryAttributeValue()` | string | Primary name field value |
| `isValid()` | boolean | All fields valid |
| `save(saveMode)` | void | `"saveandclose"`, `"saveandnew"` |

---

## Attributes (Columns)

Access via shortcut: `formContext.getAttribute("fieldname")`

### Common Attribute Methods

| Method | Returns | Description |
|---|---|---|
| `getValue()` | varies | Current value (type depends on attribute type) |
| `setValue(value)` | void | Set value programmatically |
| `addOnChange(handler)` | void | Register change handler |
| `removeOnChange(handler)` | void | Remove change handler |
| `getAttributeType()` | string | `"boolean"`, `"datetime"`, `"decimal"`, `"double"`, `"integer"`, `"lookup"`, `"memo"`, `"money"`, `"optionset"`, `"string"` |
| `getFormat()` | string | `"date"`, `"datetime"`, `"email"`, `"phone"`, `"text"`, `"url"`, etc. |
| `getIsDirty()` | boolean | Value changed since load |
| `getName()` | string | Logical name |
| `getRequiredLevel()` | string | `"none"`, `"required"`, `"recommended"` |
| `setRequiredLevel(level)` | void | Change requirement dynamically |
| `getSubmitMode()` | string | `"always"`, `"never"`, `"dirty"` |
| `setSubmitMode(mode)` | void | Control whether field submits on save |
| `setIsValid(valid, message)` | void | Custom validation (prevents save if false) |

### Value Types by Attribute Type

| Attribute Type | getValue() Returns | setValue() Accepts |
|---|---|---|
| `string` / `memo` | `string \| null` | `string \| null` |
| `integer` / `decimal` / `double` / `money` | `number \| null` | `number \| null` |
| `boolean` | `boolean` | `boolean` |
| `datetime` | `Date \| null` | `Date \| null` |
| `optionset` | `number \| null` (option value) | `number \| null` |
| `multiselectoptionset` | `number[]` | `number[]` |
| `lookup` | `LookupValue[] \| null` | `LookupValue[]` |

### Lookup Value Structure
```typescript
// Get lookup value
const lookup = formContext.getAttribute("parentcustomerid").getValue();
if (lookup && lookup.length > 0) {
  const accountId = lookup[0].id;       // GUID (with braces)
  const accountName = lookup[0].name;   // Display name
  const entityType = lookup[0].entityType; // "account"
}

// Set lookup value
formContext.getAttribute("parentcustomerid").setValue([{
  id: "{00000000-0000-0000-0000-000000000001}",
  name: "Contoso Ltd",
  entityType: "account"
}]);
```

### OptionSet (Choice) Methods

| Method | Returns | Description |
|---|---|---|
| `getInitialValue()` | number | Default option value |
| `getOption(value)` | Option | Single option: `{text, value}` |
| `getOptions()` | Option[] | All options |
| `getSelectedOption()` | Option | Currently selected: `{text, value}` |
| `getText()` | string | Display text of selected option |

---

## Controls

Access via shortcut: `formContext.getControl("fieldname")`

### Standard Control Methods

| Method | Returns | Description |
|---|---|---|
| `addNotification(notification)` | void | Show error/recommendation on field |
| `clearNotification(uniqueId)` | void | Remove field notification |
| `getAttribute()` | Attribute | The bound attribute |
| `getControlType()` | string | `"standard"`, `"lookup"`, `"optionset"`, `"subgrid"`, `"webresource"`, `"iframe"`, etc. |
| `getDisabled()` | boolean | Is control disabled |
| `setDisabled(disabled)` | void | Enable/disable control |
| `getLabel()` | string | Field label text |
| `setLabel(label)` | void | Change label dynamically |
| `getVisible()` | boolean | Is control visible |
| `setVisible(visible)` | void | Show/hide control |
| `setFocus()` | void | Move focus to this control |

### Field Notification
```typescript
formContext.getControl("emailaddress1").addNotification({
  messages: ["This email is already in use"],
  notificationLevel: "ERROR",  // or "RECOMMENDATION"
  uniqueId: "email_duplicate"
});

// Clear it later
formContext.getControl("emailaddress1").clearNotification("email_duplicate");
```

### Lookup Control Methods

| Method | Description |
|---|---|
| `addPreSearch(handler)` | Register filter before lookup opens |
| `removePreSearch(handler)` | Remove pre-search handler |
| `addCustomFilter(fetchXml, entityType)` | Add FetchXML filter to lookup results |
| `addCustomView(viewId, entityName, viewDisplayName, fetchXml, layoutXml, isDefault)` | Add a custom lookup view |
| `setDefaultView(viewId)` | Set default view for lookup |
| `getEntityTypes()` | Get allowed entity types |
| `setEntityTypes(types)` | Restrict lookup to specific entities |

```typescript
// Filter lookup to show only active accounts in user's business unit
formContext.getControl("parentcustomerid").addPreSearch(() => {
  const buId = Xrm.Utility.getGlobalContext().userSettings.businessUnitId;
  formContext.getControl("parentcustomerid").addCustomFilter(
    `<filter>
      <condition attribute="statecode" operator="eq" value="0"/>
      <condition attribute="owningbusinessunit" operator="eq" value="${buId}"/>
    </filter>`,
    "account"
  );
});
```

### OptionSet Control Methods

| Method | Description |
|---|---|
| `addOption(option, index)` | Add option: `{text: "Label", value: 100000005}` |
| `clearOptions()` | Remove all options |
| `removeOption(value)` | Remove single option by value |

### Subgrid Control Methods

| Method | Description |
|---|---|
| `getGrid()` | Grid object with `getRows()`, `getTotalRecordCount()` |
| `getViewSelector()` | View selector management |
| `refresh()` | Reload the subgrid data |
| `addOnLoad(handler)` | Handler for when subgrid loads |

---

## Tabs and Sections

### Tabs
```typescript
const tab = formContext.ui.tabs.get("tab_general");
tab.setVisible(true);
tab.setLabel("Overview");
tab.setDisplayState("expanded"); // or "collapsed"
tab.setFocus();

// React to tab collapse/expand
tab.addTabStateChange((context) => {
  console.log("Tab state changed:", tab.getDisplayState());
});
```

### Sections
```typescript
const section = formContext.ui.tabs.get("tab_general").sections.get("sec_address");
section.setVisible(false); // Hide address section
section.setLabel("Mailing Address");
```

---

## Form Notifications

```typescript
// Show form-level notification bar
formContext.ui.setFormNotification(
  "This record is pending approval",  // message
  "INFO",                              // level: "ERROR", "WARNING", "INFO"
  "approval_notice"                    // unique ID
);

// Clear notification
formContext.ui.clearFormNotification("approval_notice");
```

---

## Form Events

| Event | Registration | Context Type | Key Methods |
|---|---|---|---|
| OnLoad | Form properties | EventContext | `getFormContext()` |
| OnSave | Form properties | SaveEventContext | `getSaveMode()`, `preventDefault()` |
| OnChange | Attribute | EventContext | `getFormContext()`, `getEventSource()` |
| PreSearch | Lookup control | EventContext | Used with `addCustomFilter` |
| TabStateChange | Tab | EventContext | `getFormContext()` |
| OnStageChange | BPF | ProcessEventContext | `getDirection()`, `getStage()` |

### Save Modes (SaveEventContext.getSaveMode())

| Value | Description |
|---|---|
| 1 | Save |
| 2 | Save and Close |
| 5 | Deactivate |
| 6 | Reactivate |
| 7 | Send (email) |
| 15 | Disqualify (lead) |
| 16 | Qualify (lead) |
| 47 | Assign |
| 58 | Save as Completed (activity) |
| 59 | Save and New |
| 70 | Auto Save |

```typescript
// Prevent save with validation
export function onSave(executionContext: Xrm.Events.SaveEventContext): void {
  const formContext = executionContext.getFormContext();
  const email = formContext.getAttribute("emailaddress1").getValue();

  if (!email || !email.includes("@")) {
    executionContext.getEventArgs().preventDefault();
    formContext.ui.setFormNotification(
      "Please enter a valid email address",
      "ERROR",
      "email_validation"
    );
  }
}
```

---

## Anti-Patterns / Gotchas

- **Using `Xrm.Page`** — deprecated; always use `executionContext.getFormContext()`
- **`getAttribute()` on columns not on the form** — returns `null`, not an error
- **Not removing event handlers** — `addOnChange` in OnLoad without `removeOnChange` causes duplicate registrations on form refresh
- **`setSubmitMode("always")` on all fields** — forces unnecessary data transmission; use only on fields modified programmatically
- **Not checking formType** — setting defaults on Update (type 2) overwrites existing data
- **`setRequiredLevel("required")` without visual feedback** — user doesn't know why save fails; combine with `setFormNotification`
- **Calling `setValue()` in an OnChange of the same field** — can cause infinite loops

## Official Reference

- https://learn.microsoft.com/power-apps/developer/model-driven-apps/clientapi/reference/
- https://learn.microsoft.com/power-apps/developer/model-driven-apps/clientapi/clientapi-form-context
- https://learn.microsoft.com/power-apps/developer/model-driven-apps/clientapi/reference/formcontext-data
- https://learn.microsoft.com/power-apps/developer/model-driven-apps/clientapi/reference/formcontext-ui
