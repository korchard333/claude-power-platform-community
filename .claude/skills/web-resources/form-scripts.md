# Form Scripts

JavaScript form scripts handle events on Model-Driven App forms -- OnLoad, OnSave, field OnChange, tab state changes, and more.

---

## Form Event Handler Pattern

```typescript
// src/scripts/contact/contactForm.ts
namespace Contoso.Contact {
  // Form OnLoad
  export function onLoad(executionContext: Xrm.Events.EventContext): void {
    const formContext = executionContext.getFormContext();

    // Set field visibility based on form type
    const formType = formContext.ui.getFormType();
    if (formType === XrmEnum.FormType.Create) {
      setDefaultValues(formContext);
    }

    // Register field change handlers
    const emailAttr = formContext.getAttribute("emailaddress1");
    if (emailAttr) {
      emailAttr.addOnChange(onEmailChange);
    }

    // Register tab state change
    const detailsTab = formContext.ui.tabs.get("tab_details");
    if (detailsTab) {
      detailsTab.addTabStateChange(onDetailsTabExpand);
    }

    // Set field requirement level conditionally
    const accountType = formContext.getAttribute("customertypecode")?.getValue();
    if (accountType === 1) { // Customer
      formContext.getAttribute("telephone1")?.setRequiredLevel("required");
    }
  }

  // Form OnSave
  export function onSave(executionContext: Xrm.Events.SaveEventContext): void {
    const formContext = executionContext.getFormContext();
    const saveMode = executionContext.getEventArgs().getSaveMode();

    // Validate before save
    const email = formContext.getAttribute("emailaddress1")?.getValue();
    if (email && !isValidEmail(email)) {
      executionContext.getEventArgs().preventDefault();
      formContext.ui.setFormNotification(
        "Please enter a valid email address.",
        "ERROR",
        "email_validation"
      );
      return;
    }

    // Clear any previous notifications
    formContext.ui.clearFormNotification("email_validation");
  }

  // Field OnChange handler
  function onEmailChange(executionContext: Xrm.Events.EventContext): void {
    const formContext = executionContext.getFormContext();
    const email = formContext.getAttribute("emailaddress1")?.getValue();

    if (email) {
      // Auto-populate domain
      const domain = email.split("@")[1];
      if (domain) {
        formContext.getAttribute("contoso_emaildomain")?.setValue(domain);
      }
    }
  }

  function setDefaultValues(formContext: Xrm.FormContext): void {
    // Set default country
    formContext.getAttribute("address1_country")?.setValue("Australia");

    // Set default owner to current user
    const userId = Xrm.Utility.getGlobalContext().userSettings.userId;
    formContext.getAttribute("ownerid")?.setValue([{
      id: userId,
      entityType: "systemuser",
      name: Xrm.Utility.getGlobalContext().userSettings.userName
    }]);
  }

  function onDetailsTabExpand(executionContext: Xrm.Events.EventContext): void {
    // Load related data when tab is expanded (lazy loading pattern)
  }

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

---

## Registering Event Handlers

```
Form > Form Properties > Event Handlers

OnLoad:
  Library: contoso_/scripts/contactForm.js
  Function: Contoso.Contact.onLoad
  Pass execution context: CHECK THIS (ALWAYS)

OnSave:
  Library: contoso_/scripts/contactForm.js
  Function: Contoso.Contact.onSave
  Pass execution context: CHECK THIS (ALWAYS)
```

> **Critical:** Always check "Pass execution context as first parameter". Without this, `executionContext` is undefined and the script fails silently.

---

## Attribute (Field) Manipulation

```typescript
// Get/Set value
const name = formContext.getAttribute("fullname")?.getValue();
formContext.getAttribute("emailaddress1")?.setValue("new@email.com");

// Requirement level
formContext.getAttribute("telephone1")?.setRequiredLevel("required");  // "none" | "required" | "recommended"

// Submit mode (control whether field is sent on save)
formContext.getAttribute("contoso_readonly")?.setSubmitMode("never");  // "always" | "never" | "dirty"

// Fire OnChange programmatically
formContext.getAttribute("emailaddress1")?.fireOnChange();

// Lookup value (EntityReference[])
const accountRef = formContext.getAttribute("parentcustomerid")?.getValue();
if (accountRef && accountRef.length > 0) {
  const accountId = accountRef[0].id;
  const accountName = accountRef[0].name;
  const entityType = accountRef[0].entityType;
}

// Set lookup value
formContext.getAttribute("parentcustomerid")?.setValue([{
  id: "{GUID}",
  entityType: "account",
  name: "Contoso Ltd"
}]);

// Option Set (Choice)
const priority = formContext.getAttribute("contoso_priority")?.getValue();  // number
formContext.getAttribute("contoso_priority")?.setValue(100000001);  // Medium

// Get selected option text
const priorityText = formContext.getAttribute("contoso_priority")?.getSelectedOption()?.text;
```

---

## Control (UI Element) Manipulation

```typescript
// Show/hide field
formContext.getControl("emailaddress1")?.setVisible(true);

// Enable/disable field
formContext.getControl("emailaddress1")?.setDisabled(false);

// Set field label
formContext.getControl("emailaddress1")?.setLabel("Primary Email");

// Focus on field
formContext.getControl("emailaddress1")?.setFocus();

// Field notification (validation message below the field)
formContext.getControl("emailaddress1")?.setNotification("Invalid email format", "email_error");
formContext.getControl("emailaddress1")?.clearNotification("email_error");

// Add/remove option set values dynamically
formContext.getControl("contoso_priority")?.removeOption(100000003);
formContext.getControl("contoso_priority")?.addOption({ text: "Critical", value: 100000003 });
```

---

## Tab & Section Visibility

```typescript
// Show/hide tab
formContext.ui.tabs.get("tab_details")?.setVisible(false);

// Expand/collapse tab
formContext.ui.tabs.get("tab_details")?.setDisplayState("expanded");  // "expanded" | "collapsed"

// Show/hide section
formContext.ui.tabs.get("tab_general")?.sections.get("section_address")?.setVisible(true);

// Set tab label
formContext.ui.tabs.get("tab_details")?.setLabel("Additional Details");
```

---

## Form Notifications

```typescript
// Set notification (banner at top of form)
formContext.ui.setFormNotification(
  "This record has been deactivated.",
  "WARNING",  // "ERROR" | "WARNING" | "INFO"
  "deactivated_notice"
);

// Clear specific notification
formContext.ui.clearFormNotification("deactivated_notice");
```

---

## Save Event Handling

### Save Modes
```typescript
export function onSave(executionContext: Xrm.Events.SaveEventContext): void {
  const saveMode = executionContext.getEventArgs().getSaveMode();

  // Save modes:
  // 1 = Save
  // 2 = Save and Close
  // 5 = Deactivate
  // 6 = Reactivate
  // 7 = Send (email)
  // 15 = Disqualify (lead)
  // 16 = Qualify (lead)
  // 59 = Save and New
  // 70 = Auto Save

  // Prevent auto-save if validation fails
  if (saveMode === 70 && !isFormValid(executionContext.getFormContext())) {
    executionContext.getEventArgs().preventDefault();
  }
}
```

### Async OnSave (Promises in Save Handlers)

```typescript
// Enable async save handling by returning a promise
export async function onSave(executionContext: Xrm.Events.SaveEventContext): Promise<void> {
  // Call external service before save
  try {
    const result = await validateWithExternalService(executionContext.getFormContext());
    if (!result.valid) {
      executionContext.getEventArgs().preventDefault();
      executionContext.getFormContext().ui.setFormNotification(
        result.message,
        "ERROR",
        "external_validation"
      );
    }
  } catch (err) {
    // Allow save on validation service failure (fail open)
    console.warn("External validation unavailable, allowing save");
  }
}
```

---

## Anti-Patterns

- Using `Xrm.Page` instead of `executionContext.getFormContext()` -- `Xrm.Page` is deprecated
- Not checking "Pass execution context as first parameter" -- causes silent failures
- Direct DOM manipulation of form elements -- unsupported, breaks on platform updates
- Using jQuery -- removed from Model-Driven Apps since October 2023
- Synchronous XMLHttpRequest -- blocks UI thread, causes performance issues
- Using `setTimeout` for timing logic instead of proper event handlers
- Not null-checking getAttribute/getControl calls -- controls may not exist on all forms

---

## Programmatic Event Handler Registration (FormXML Injection)

To wire JavaScript to form events via the Web API (without using the maker portal):

1. `GET /api/data/v9.2/systemforms({id})?$select=formxml` — retrieve current formxml
2. Inject `<formLibraries>` block with the web resource reference
3. Inject `<events>` block with event handlers
4. `PATCH /api/data/v9.2/systemforms({id})` with updated formxml
5. `POST /api/data/v9.2/PublishAllXml` with `{}`

### FormXML Structure for Event Handlers
```xml
<!-- Add inside <form> element -->
<formLibraries>
  <Library name="contoso_/scripts/contactForm.js"
           libraryUniqueId="{deterministic-guid}"
           languagecode="1033"
           version="1.0.0.0"
           description=""
           name="contoso_/scripts/contactForm.js" />
</formLibraries>
<events>
  <!-- OnLoad event -->
  <event name="onload" application="false" active="false">
    <Handlers>
      <Handler functionName="Contoso.Contact.onLoad"
               libraryName="contoso_/scripts/contactForm.js"
               handlerUniqueId="{handler-guid}"
               enabled="true"
               parameters=""
               passExecutionContext="true" />
    </Handlers>
  </event>
  <!-- OnChange event — requires attribute property -->
  <event name="onchange" attribute="contoso_status" application="false" active="false">
    <Handlers>
      <Handler functionName="Contoso.Contact.onStatusChange"
               libraryName="contoso_/scripts/contactForm.js"
               handlerUniqueId="{handler-guid-2}"
               enabled="true"
               parameters=""
               passExecutionContext="true" />
    </Handlers>
  </event>
</events>
```

### Critical Rules
- `passExecutionContext="true"` is MANDATORY on all handlers — no exceptions
- `onchange` events require `attribute="fieldLogicalName"` on the `<event>` element
- `systemforms` PATCH does **NOT** support `MSCRM.MergeLabels: true` or `If-Match: *` headers — returns HTTP 405. Use plain PATCH with Authorization + Content-Type + Accept headers only.

### Idempotent Injection Pattern
Strip existing `<formLibraries>` and `<events>` blocks before re-injecting — makes the script safe to re-run:
```python
import re
formxml = current_formxml
# Remove existing blocks
formxml = re.sub(r'<formLibraries>.*?</formLibraries>', '', formxml, flags=re.DOTALL)
formxml = re.sub(r'<events>.*?</events>', '', formxml, flags=re.DOTALL)
# Re-inject new blocks before closing </form>
formxml = formxml.replace('</form>', libraries_xml + events_xml + '</form>')
```

### Web Resource Naming Convention
`{prefix}_/scripts/{entity}Form.js` — e.g., `contoso_/scripts/contactForm.js`. Type code 3 (JavaScript). Content is base64-encoded.

### JavaScript Namespace Pattern
```javascript
var Contoso = Contoso || {};
Contoso.Contact = Contoso.Contact || {};
(function () {
    "use strict";
    this.onLoad = function (executionContext) {
        var formContext = executionContext.getFormContext();
        // ...
    };
    this.onStatusChange = function (executionContext) {
        var formContext = executionContext.getFormContext();
        var status = formContext.getAttribute("contoso_status").getValue();
        // ...
    };
}).call(Contoso.Contact);
```
Function references in form XML: `Contoso.Contact.onLoad`, `Contoso.Contact.onStatusChange`, etc.
