# PCF API Reference

> For control lifecycle, manifest patterns, and development workflow, see SKILL.md.

## Context Object

The `context` object is passed to `init` and `updateView`. It provides access to all platform services.

| Property | Type | MDA | Canvas | Portals | Description |
|---|---|---|---|---|---|
| `client` | Client | ✅ | ✅ | ✅ | Browser, client type, form factor |
| `device` | Device | ✅ | ✅ | ❌ | Camera, GPS, barcode, file picker |
| `factory` | Factory | ✅ | ✅ | ❌ | Create popup elements |
| `formatting` | Formatting | ✅ | ✅ | ✅ | Date/number/currency formatting |
| `mode` | Mode | ✅ | ✅ | ✅ | Size, disabled state, visibility |
| `navigation` | Navigation | ✅ | Partial | ❌ | Open forms, dialogs, URLs |
| `parameters` | Parameters | ✅ | ✅ | ✅ | Bound properties from manifest |
| `resources` | Resources | ✅ | ✅ | ✅ | Localized strings from resx |
| `updatedProperties` | string[] | ✅ | ✅ | ✅ | Which properties changed since last updateView |
| `userSettings` | UserSettings | ✅ | ✅ | ✅ | User ID, name, language, security roles |
| `utils` | Utility | ✅ | ✅ | ✅ | hasEntityPrivilege, lookupObjects |
| `webAPI` | WebApi | ✅ | ✅* | ❌ | Dataverse CRUD (* requires feature-usage declaration in Canvas) |
| `events` | Events | ✅ | ✅ | ❌ | Custom events for Power Fx / JS handlers |

---

## context.mode

| Property | Type | Description |
|---|---|---|
| `allocatedHeight` | number | Available height in pixels (-1 if unconstrained) |
| `allocatedWidth` | number | Available width in pixels (-1 if unconstrained) |
| `isControlDisabled` | boolean | True when form/field is read-only |
| `isVisible` | boolean | True when control is visible on form |
| `label` | string | Field label from form designer |
| `trackContainerResize(value)` | method | Call with `true` to receive size updates in updateView |

```typescript
// Skip expensive rendering when hidden
public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
  if (!context.mode.isVisible) {
    return React.createElement("div"); // Empty placeholder
  }
  // ... actual rendering
}
```

### setControlState
```typescript
// Persist state across re-renders (survives form navigation)
context.mode.setControlState({lastSearch: "query", page: 3});
// Retrieved via init(context, notify, state) — the `state` parameter
```

---

## context.webAPI

**Requires** `<uses-feature name="WebAPI" required="true"/>` in manifest for Canvas Apps.

| Method | Returns | Description |
|---|---|---|
| `createRecord(entityType, data)` | `Promise<EntityReference>` | Create a record |
| `deleteRecord(entityType, id)` | `Promise<EntityReference>` | Delete a record |
| `retrieveRecord(entityType, id, options)` | `Promise<Entity>` | Get single record |
| `retrieveMultipleRecords(entityType, options, maxPageSize)` | `Promise<RetrieveMultipleResponse>` | Query records |
| `updateRecord(entityType, id, data)` | `Promise<EntityReference>` | Update a record |

```typescript
// CRUD within a PCF control
const record = await context.webAPI.retrieveRecord(
  "contact", recordId,
  "?$select=fullname,emailaddress1"
);

const newRef = await context.webAPI.createRecord("task", {
  subject: "Follow up",
  "regardingobjectid_contact@odata.bind": `/contacts(${recordId})`
});

await context.webAPI.updateRecord("contact", recordId, {
  emailaddress1: "new@email.com"
});

await context.webAPI.deleteRecord("task", taskId);
```

---

## context.navigation

| Method | MDA | Canvas | Description |
|---|---|---|---|
| `openAlertDialog(options, dialogOptions)` | ✅ | ✅ | Alert popup with OK button |
| `openConfirmDialog(options, dialogOptions)` | ✅ | ✅ | Confirm popup with OK/Cancel |
| `openErrorDialog(options)` | ✅ | ❌ | Error dialog with details |
| `openFile(file, dialogOptions)` | ✅ | ❌ | Open/download a file |
| `openForm(options, formParameters)` | ✅ | ❌ | Open entity form |
| `openUrl(url, options)` | ✅ | ✅ | Open URL in new window |
| `openWebResource(name, options, data)` | ✅ | ❌ | Open a web resource |

```typescript
// Open a related record form
await context.navigation.openForm({
  entityName: "account",
  entityId: accountId,
  openInNewWindow: false
});

// Confirm dialog before delete
const result = await context.navigation.openConfirmDialog(
  {text: "Delete this record?", title: "Confirm"},
  {height: 200, width: 400}
);
if (result.confirmed) {
  await context.webAPI.deleteRecord("task", taskId);
}
```

---

## context.device

| Method | Description | Mobile Only |
|---|---|---|
| `captureAudio()` | Record audio | Yes |
| `captureImage(options)` | Take photo | Yes |
| `captureVideo()` | Record video | Yes |
| `getBarcodeValue()` | Scan barcode | Yes |
| `getCurrentPosition()` | GPS coordinates | Yes |
| `pickFile(options)` | File picker dialog | No |

---

## context.formatting

| Method | Description |
|---|---|
| `formatCurrency(value, precision, currencySymbol)` | Format as currency string |
| `formatDateAsFilterStringInUTC(date)` | Date for OData $filter |
| `formatDateLong(date)` / `formatDateShort(date)` | Localized date strings |
| `formatDateYearMonth(date)` | "March 2026" format |
| `formatDecimal(value, precision)` | Localized decimal |
| `formatInteger(value)` | Localized integer |
| `formatTime(date, behavior)` | Localized time string |
| `getWeekOfYear(date)` | Week number |

---

## DataSet API

For controls bound to a `<data-set>` in the manifest.

### DataSet Properties

| Property | Type | Description |
|---|---|---|
| `columns` | Column[] | Column definitions (name, displayName, dataType, order, visualSizeFactor) |
| `error` | boolean | True if dataset has an error |
| `errorMessage` | string | Error description |
| `filtering` | Filtering | Filter expression management |
| `linking` | Linking | Entity linking info |
| `loading` | boolean | True while data is loading |
| `paging` | Paging | Page navigation |
| `records` | {[id: string]: EntityRecord} | Record map keyed by ID |
| `sortedRecordIds` | string[] | Record IDs in current sort order |
| `sorting` | SortStatus[] | Current sort columns and directions |

### DataSet.paging

| Property/Method | Type | Description |
|---|---|---|
| `hasNextPage` | boolean | More pages available |
| `hasPreviousPage` | boolean | Previous page available |
| `pageSize` | number | Records per page |
| `totalResultCount` | number | Total matching records (-1 if unknown) |
| `loadExactPage(pageNumber)` | void | Jump to specific page |
| `loadNextPage()` | void | Load next page |
| `loadPreviousPage()` | void | Load previous page |
| `reset()` | void | Reset to first page |
| `setPageSize(size)` | void | Change page size |

### DataSet.filtering

```typescript
// Apply a filter
context.parameters.dataSetGrid.filtering.setFilter({
  conditions: [
    {
      attributeName: "statecode",
      conditionOperator: 0, // Equals
      value: "0"
    }
  ],
  filterOperator: 0 // AND
});
context.parameters.dataSetGrid.refresh();
```

**Conditional Operators** (ConditionOperator enum):

| Value | Operator | MDA | Canvas |
|---|---|---|---|
| 0 | Equal | ✅ | ✅ |
| 1 | NotEqual | ✅ | ✅ |
| 2 | GreaterThan | ✅ | ✅ |
| 3 | LessThan | ✅ | ✅ |
| 4 | GreaterEqual | ✅ | ✅ |
| 5 | LessEqual | ✅ | ✅ |
| 6 | Like | ✅ | ❌ |
| 8 | In | ✅ | ❌ |
| 12 | Null | ✅ | ✅ |
| 13 | NotNull | ✅ | ✅ |
| 73 | Contains | ✅ | ❌ |
| 75 | DoesNotContain | ✅ | ❌ |
| 76 | BeginsWith | ✅ | ❌ |

### EntityRecord Methods

| Method | Returns | Description |
|---|---|---|
| `getFormattedValue(columnName)` | string | Display-ready formatted value |
| `getRecordId()` | string | Record GUID |
| `getValue(columnName)` | any | Raw value |
| `getNamedReference()` | EntityReference | Entity reference (type + ID + name) |
| `isDirty()` | boolean | Has uncommitted changes |
| `isValid()` | boolean | Passes validation |
| `save()` | Promise | Save changes to server |

---

## Custom Events

```xml
<!-- Manifest: declare up to 5 custom events -->
<event name="OnItemSelected" display-name-key="OnItemSelected_Display" />
```

```typescript
// Raise event from control code
context.events.OnItemSelected();
```

In Canvas Apps, this connects to a Power Fx handler. In Model-Driven Apps, this triggers a JavaScript event handler.

---

## Platform Availability Summary

| API | MDA | Canvas | Portals |
|---|---|---|---|
| webAPI (CRUD) | ✅ | ✅ (feature flag) | ❌ |
| navigation.openForm | ✅ | ❌ | ❌ |
| navigation.openAlertDialog | ✅ | ✅ | ❌ |
| device (camera, GPS) | ✅ (mobile) | ✅ (mobile) | ❌ |
| dataset | ✅ | ✅ (limited filtering) | ❌ |
| events (custom) | ✅ | ✅ | ❌ |

---

## Anti-Patterns / Gotchas

- Using `Xrm` object directly — not supported in PCF; use `context.webAPI`, `context.navigation`, etc.
- Not checking `context.mode.isControlDisabled` — control stays editable on read-only forms
- Assuming `totalResultCount` is accurate in Canvas — returns `-1` for Dataverse datasets
- Not declaring `WebAPI` in `<feature-usage>` then calling `context.webAPI` — returns undefined in Canvas
- Calling `dataset.refresh()` without `filtering.setFilter()` — refresh is a no-op if nothing changed
- Not checking `dataset.loading` before rendering — causes flicker and stale data display

## Official Reference

- https://learn.microsoft.com/power-apps/developer/component-framework/reference/
- https://learn.microsoft.com/power-apps/developer/component-framework/reference/context
- https://learn.microsoft.com/power-apps/developer/component-framework/reference/dataset
- https://learn.microsoft.com/power-apps/developer/component-framework/code-components-best-practices
