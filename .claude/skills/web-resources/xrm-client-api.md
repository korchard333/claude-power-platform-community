# Xrm Client API Reference

The Xrm Client API provides JavaScript access to Dataverse data, navigation, dialogs, and user/org context from within Model-Driven App forms and web resources.

---

## Xrm.WebApi (Client-Side Data Operations)

```typescript
// Retrieve single record
const result = await Xrm.WebApi.retrieveRecord(
  "contact",
  contactId,
  "?$select=fullname,emailaddress1&$expand=parentcustomerid($select=name)"
);

// Retrieve multiple records
const results = await Xrm.WebApi.retrieveMultipleRecords(
  "contact",
  "?$select=fullname,emailaddress1&$filter=statecode eq 0&$top=50&$orderby=fullname"
);
for (const record of results.entities) {
  console.log(record.fullname);
}

// Create record
const newId = await Xrm.WebApi.createRecord("contact", {
  firstname: "Jane",
  lastname: "Smith",
  emailaddress1: "jane@contoso.com"
});

// Update record
await Xrm.WebApi.updateRecord("contact", contactId, {
  emailaddress1: "new@email.com"
});

// Delete record
await Xrm.WebApi.deleteRecord("contact", contactId);
```

### Execute Custom Action / Function

```typescript
// Execute bound action
const response = await Xrm.WebApi.online.execute({
  getMetadata: () => ({
    boundParameter: "entity",
    operationName: "contoso_ApproveOrder",
    operationType: 0, // Action = 0, Function = 1
    parameterTypes: {
      entity: { typeName: "mscrm.contoso_order", structuralProperty: 5 },
      ApproverNotes: { typeName: "Edm.String", structuralProperty: 1 }
    }
  }),
  entity: { entityType: "contoso_order", id: orderId },
  ApproverNotes: "Approved"
});

// Execute unbound action
const response = await Xrm.WebApi.online.execute({
  getMetadata: () => ({
    boundParameter: null,
    operationName: "contoso_RunDailyReport",
    operationType: 0,
    parameterTypes: {
      ReportDate: { typeName: "Edm.DateTimeOffset", structuralProperty: 1 }
    }
  }),
  ReportDate: new Date().toISOString()
});

// Read response
if (response.ok) {
  const data = await response.json();
}
```

### FetchXML from Client-Side

```typescript
// Use FetchXML for aggregation queries
const fetchXml = encodeURIComponent(`
  <fetch aggregate="true">
    <entity name="contoso_project">
      <attribute name="contoso_budget" aggregate="sum" alias="totalBudget"/>
      <attribute name="contoso_projectid" aggregate="count" alias="projectCount"/>
      <filter>
        <condition attribute="statecode" operator="eq" value="0"/>
      </filter>
    </entity>
  </fetch>
`);

const result = await Xrm.WebApi.retrieveMultipleRecords(
  "contoso_project",
  `?fetchXml=${fetchXml}`
);
const totalBudget = result.entities[0]?.totalBudget || 0;
const count = result.entities[0]?.projectCount || 0;
```

---

## Xrm.Navigation

```typescript
// Open record form
Xrm.Navigation.openForm({
  entityName: "account",
  entityId: accountId,
  openInNewWindow: false
});

// Open create form with default values
Xrm.Navigation.openForm({
  entityName: "contact",
  createFromEntity: { entityType: "account", id: accountId, name: "Contoso" },
  formId: "GUID-of-specific-form"
});

// Open URL
Xrm.Navigation.openUrl("https://contoso.com/help", { height: 600, width: 800 });

// Confirm dialog
const result = await Xrm.Navigation.openConfirmDialog(
  { text: "Are you sure you want to delete this record?", title: "Confirm Delete" },
  { height: 200, width: 400 }
);
if (result.confirmed) {
  // Proceed with delete
}

// Alert dialog
await Xrm.Navigation.openAlertDialog(
  { text: "Record saved successfully.", title: "Success" },
  { height: 150, width: 300 }
);

// Open web resource in dialog
Xrm.Navigation.openWebResource("contoso_/html/customDialog.html", {
  openInNewWindow: false,
  height: 500,
  width: 700
});
```

---

## Xrm.Utility & Global Context

```typescript
const ctx = Xrm.Utility.getGlobalContext();

// User info
const userId = ctx.userSettings.userId;
const userName = ctx.userSettings.userName;
const userRoles = ctx.userSettings.securityRoles; // Array of role IDs
const languageId = ctx.userSettings.languageId;

// Org info
const orgId = ctx.organizationSettings.uniqueName;
const orgUrl = ctx.getClientUrl(); // https://org.crm.dynamics.com

// Client info
const client = ctx.client.getClient(); // "Web" | "Outlook" | "Mobile"
const formFactor = ctx.client.getFormFactor(); // 0=Unknown, 1=Desktop, 2=Tablet, 3=Phone
```

### Role-Based Logic

```typescript
// Check if user has a specific security role
async function userHasRole(roleName: string): Promise<boolean> {
  const roles = Xrm.Utility.getGlobalContext().userSettings.roles;
  for (let i = 0; i < roles.getLength(); i++) {
    if (roles.get(i).name === roleName) return true;
  }
  return false;
}

// Usage
if (await userHasRole("System Administrator")) {
  formContext.getControl("contoso_internal_notes")?.setVisible(true);
}
```

### Form Factor-Responsive Logic

```typescript
const formFactor = Xrm.Utility.getGlobalContext().client.getFormFactor();
if (formFactor === 3) { // Phone
  // Hide non-essential tabs on mobile
  formContext.ui.tabs.get("tab_details")?.setVisible(false);
  formContext.ui.tabs.get("tab_history")?.setVisible(false);
}
```

---

## Xrm.Device

```typescript
// Capture image (mobile only)
const image = await Xrm.Device.captureImage({ allowEdit: true, quality: 80 });
// image.fileContent = base64 string
// image.fileName = "photo.jpg"
// image.mimeType = "image/jpeg"

// Get current position (mobile)
const position = await Xrm.Device.getCurrentPosition();
// position.coords.latitude, position.coords.longitude

// Pick file
const files = await Xrm.Device.pickFile({ accept: "image/*", allowMultipleFiles: false });
```

---

## Async Patterns and Error Handling

### Try/Catch for All Web API Calls

```typescript
try {
  const result = await Xrm.WebApi.retrieveRecord("contact", contactId, "?$select=fullname");
  // Use result
} catch (error: any) {
  console.error("Web API error:", error.message);
  formContext.ui.setFormNotification(
    `Failed to load data: ${error.message}`,
    "ERROR",
    "api_error"
  );
}
```

### Parallel Data Loading

```typescript
// Load multiple datasets in parallel on form load
export async function onLoad(executionContext: Xrm.Events.EventContext): Promise<void> {
  const formContext = executionContext.getFormContext();
  const recordId = formContext.data.entity.getId().replace(/[{}]/g, "");

  try {
    const [relatedTasks, relatedNotes, userRoles] = await Promise.all([
      Xrm.WebApi.retrieveMultipleRecords("contoso_task",
        `?$filter=_contoso_projectid_value eq ${recordId}&$select=contoso_name,contoso_status&$top=20`),
      Xrm.WebApi.retrieveMultipleRecords("annotation",
        `?$filter=_objectid_value eq ${recordId}&$select=subject,createdon&$top=10&$orderby=createdon desc`),
      Promise.resolve(Xrm.Utility.getGlobalContext().userSettings.roles)
    ]);

    // Use loaded data to configure form
    if (relatedTasks.entities.length === 0) {
      formContext.ui.tabs.get("tab_tasks")?.setVisible(false);
    }
  } catch (error) {
    console.error("Form load error:", error);
  }
}
```

---

## Deprecated API Replacements

| Deprecated API | Replacement |
|---|---|
| `Xrm.Page` | `executionContext.getFormContext()` |
| `formContext.data.entity.save()` | `formContext.data.save()` |
| `getObject()` (on web resource controls) | `getContentWindow()` |
| `globalContext.userSettings.securityRoles` | `globalContext.userSettings.roles` |

---

## Anti-Patterns

- Using `Xrm.Page` anywhere -- always get formContext from execution context or PrimaryControl
- Synchronous XMLHttpRequest calls -- blocks the UI thread
- Not handling errors in async Web API calls -- unhandled promise rejections crash silently
- Using `setTimeout` to wait for data -- use proper async/await patterns
- Querying large datasets without `$top` -- can return thousands of records and freeze the UI
- Not using `$select` on Web API queries -- returns all columns, wastes bandwidth
