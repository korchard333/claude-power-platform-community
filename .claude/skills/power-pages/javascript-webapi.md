# Power Pages — Custom JavaScript & Portal Web API

## Entity Form Scripts

```javascript
// Runs when entity form loads
$(document).ready(function() {
  // Hide a field conditionally
  if ($("#contoso_tier").val() === "100000001") {
    $("#contoso_discountpercentage").closest(".field").show();
  } else {
    $("#contoso_discountpercentage").closest(".field").hide();
  }

  // Validation before submit
  if (typeof (entityFormClientValidate) !== "undefined") {
    var originalValidate = entityFormClientValidate;
    entityFormClientValidate = function() {
      if (!originalValidate()) return false;

      var email = $("#emailaddress1").val();
      if (email && !email.includes("@")) {
        alert("Please enter a valid email address.");
        return false;
      }
      return true;
    };
  }
});
```

## Portal Web API (Client-Side AJAX)

Power Pages exposes a Portal Web API for client-side data operations. Must be enabled per table in Site Settings.

```javascript
// Read records
$.ajax({
  url: "/_api/contoso_cases?$select=contoso_name,statuscode&$top=10",
  type: "GET",
  headers: {
    "__RequestVerificationToken": $('[name=__RequestVerificationToken]').val()
  },
  success: function(data) {
    data.value.forEach(function(record) {
      console.log(record.contoso_name);
    });
  }
});

// Create record
$.ajax({
  url: "/_api/contoso_cases",
  type: "POST",
  contentType: "application/json",
  headers: {
    "__RequestVerificationToken": $('[name=__RequestVerificationToken]').val()
  },
  data: JSON.stringify({
    contoso_name: "New support request",
    contoso_description: "Description here"
  }),
  success: function(data) {
    console.log("Created:", data.contoso_caseid);
  }
});
```

## Enable Portal Web API

```
Site Setting: Webapi/contoso_case/enabled = true
Site Setting: Webapi/contoso_case/fields = contoso_name,contoso_description,statuscode
Table Permission: Must exist for the table (Web API respects table permissions)
```

---

## Client APIs (Wave 1 2026)

> **GA (Wave 1 2026):** Stable, supported JavaScript APIs for controlling Power Pages UI components — replacing fragile jQuery DOM manipulation.

The `$pages` client API provides a JavaScript interface for controlling forms, lists, user auth, and data operations. Access via a global variable after page load.

### API Surface

| API | What It Replaces | Key Methods |
|---|---|---|
| **Form API** | jQuery DOM selectors for form fields | `getFormById`, `getFormByName`, field get/set, visibility, validation |
| **List API** | jQuery selectors for entity lists | `getListById`, `refresh`, `getSelectedRows`, visibility |
| **User API** | Custom auth JavaScript | `getCurrent`, `signIn`, `signOut` |
| **Web API** | `$.ajax` with `__RequestVerificationToken` | OData-compliant CRUD — `createRecord`, `retrieveRecord`, `retrieveMultipleRecords` |

### Form API Examples

```javascript
// Get a form and read/write field values
const form = $pages.currentPage.forms.getFormById('form_#1');
const email = form.controls.get('emailaddress1').getValue();
form.controls.get('emailaddress1').setValue('user@contoso.com');

// Show/hide fields dynamically
form.controls.get('contoso_discountpercentage').setVisible(true);

// Set field as required
form.controls.get('contoso_name').setRequired(true);

// React to field changes
form.controls.get('contoso_tier').addOnChange(function(value) {
  form.controls.get('contoso_discountpercentage').setVisible(value === 100000001);
});
```

### List API Examples

```javascript
// Refresh a list after external data changes
const list = $pages.currentPage.lists.getListById('list_#1');
list.refresh();

// Get selected rows for batch operations
const selected = list.getSelectedRows();
```

### User API Examples

```javascript
// Get current authenticated user
const user = $pages.user.getCurrent();
console.log(user.name, user.roles);
```

### Migration from jQuery Patterns

| Old jQuery Pattern | New Client API | Benefit |
|---|---|---|
| `$("#field").closest(".field").hide()` | `form.controls.get('field').setVisible(false)` | Survives DOM structure changes |
| `$("#field").val()` | `form.controls.get('field').getValue()` | Type-safe, documented |
| `$('[name=__RequestVerificationToken]').val()` | `$pages.webApi.createRecord(...)` | Built-in CSRF handling |
| `$.ajax({ url: '/_api/...' })` | `$pages.webApi.retrieveMultipleRecords(...)` | Consistent error handling |
| Custom `$(document).ready` scripts | `$pages.onReady(callback)` | Reliable lifecycle hook |

### Anti-Pattern

- **Continuing jQuery DOM manipulation when Client APIs are available** — Client APIs are stable across portal updates. jQuery selectors break when Microsoft changes the rendered HTML structure. Migrate to Client APIs for all new development.
