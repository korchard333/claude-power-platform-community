# Power Pages — Entity Lists, Forms & Web Forms

## Entity Lists (Data Grids)

Entity lists display Dataverse views as interactive grids with pagination, sorting, filtering, and download.

### Configuration

```
Entity List: "My Cases"
  Table: contoso_case
  View: "My Active Cases" (system view)
  Page Size: 10
  Search: Enabled
  Download: Enabled (Excel export)
  Create Button: Enabled → links to Entity Form
  Details Action: View → links to Entity Form (read mode)

Web Page → Insert Entity List component → Select list
```

### Entity List Features

- Column sorting (click headers)
- Full-text search bar
- OData filters via URL parameters
- Pagination
- Excel download
- Map view (if geospatial columns)
- Calendar view (if date columns)

## Entity Forms (Single-Record)

Entity forms display a single Dataverse record for create, edit, or read-only view.

### Configuration

```
Entity Form: "Create Case"
  Table: contoso_case
  Form: "Portal Case Form" (model-driven form)
  Mode: Insert
  Tab: "General" (show only specific tab)
  Redirect on success: "Thank You" page

Entity Form: "View Case"
  Table: contoso_case
  Form: "Portal Case Form"
  Mode: Edit (or ReadOnly)
  Record Source: URL parameter (id from query string)
```

### Form Metadata (Field Overrides)

Override field behaviour without modifying the model-driven form:

```
Field: contoso_priority
  Set as required (even if not required in Dataverse)
  Set default value: "Medium"
  Set as read-only on the portal
  Custom label: "How urgent is this?"
  Custom CSS class: "priority-field"
```

## Web Forms (Multi-Step Wizards)

Web forms chain multiple entity forms into a guided multi-step process.

```
Web Form: "Partner Onboarding"
  Step 1: "Company Details" (Entity Form → Account, Insert)
  Step 2: "Primary Contact" (Entity Form → Contact, Insert)
  Step 3: "Agreement" (Entity Form → contoso_agreement, Insert)
  Step 4: "Confirmation" (Redirect to thank-you page)

Condition: Step 2 → Step 3 only if account.contoso_tier = "Gold"
           Step 2 → Step 4 if account.contoso_tier = "Silver" (skip agreement)
```
