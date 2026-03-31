# Model-Driven Apps — Forms

## Form Types

| Type | Code | Use |
|---|---|---|
| Main | 2 | Primary data entry form |
| Quick Create | 7 | Lightweight create form (from lookup flyout) |
| Quick View | 6 | Read-only summary displayed on another form |
| Card | 11 | Mobile compact view |
| Main - Interactive Experience | 2 (variant) | Interactive dashboard streams |

## Form Best Practices

```
Layout:
  - Use tabs to group related content (General, Details, Related)
  - Use sections within tabs for field groupings
  - Two-column layout for desktop, single-column collapses on mobile

Fields:
  - Required fields near the top
  - Read-only calculated/rollup fields in "Details" tab
  - Use Quick View forms for parent record summary (e.g., Account info on Contact form)

Performance:
  - Limit fields on Main form to what users actually need
  - Use subgrids sparingly — each loads separately
  - Business rules are more performant than JavaScript for simple show/hide/require logic
```

## Quick View Form (on Main Form)

```
1. Create a Quick View form on the parent entity (e.g., Account)
2. Add a Quick View Control to the child entity's Main form (e.g., Contact)
3. Quick View Control → Select relationship → Select Quick View form
Result: Account details displayed inline on Contact form
```

## Role-Based Form Switching

Show different forms to different security roles automatically.

```
Solution → [Entity] → Forms → [Form] → Form Order
  → Assign security roles to specific forms
  → Set form order (1 = highest priority)

Rules:
  - User sees the highest-priority form they have access to
  - If a form has no security roles assigned, it's available to all
  - Use for: simplified forms for end users, full forms for admins
```

## Column Types in Forms

### Lookup Best Practices
```
- Set a Lookup view to narrow what records users see in the flyout
- Use Quick View forms to display related record details inline
- Polymorphic lookups (e.g., Customer = Account or Contact):
    Use IsType/AsType in Canvas apps, standard lookup in MDA
```

### Pre-Populating Lookup Values on Forms

When opening forms programmatically (via `Xrm.Navigation.openForm` or URL parameters), lookup fields require specific parameter naming:

| Lookup Type | Parameters Required |
|---|---|
| Simple lookup | `{column}` (GUID) + `{column}name` (display text) |
| Customer/Owner lookup | `{column}` (GUID) + `{column}name` (display text) + `{column}type` (entity logical name) |
| Partylist/Regarding | Cannot be set via parameters |

```javascript
// Simple lookup pre-population
Xrm.Navigation.openForm(
    { entityName: "contoso_task", useQuickCreateForm: true },
    {
        contoso_projectid: "{A1B2C3D4-...}",      // Lookup column logical name = GUID
        contoso_projectidname: "Project Alpha"      // Same name + "name" suffix = display text
    }
);
```

**The parameter names MUST match the lookup column's logical name exactly.** Using incorrect names silently fails — the field appears empty. Discover logical names via:
```http
GET /api/data/v9.2/EntityDefinitions(LogicalName='contoso_task')/Attributes/Microsoft.Dynamics.CRM.LookupAttributeMetadata?$select=LogicalName
```

### Choice Columns
```
- Global option sets: shared across tables — update in one place
- Local option sets: table-specific — use when values are unique to that table
- Status Reason (statuscode): always drives record lifecycle
    Active → In Review → Approved (drive this via BPF, not manual status update)
```

## Embedded Canvas Apps in MDA Forms

Embed a Canvas App inside a Model-Driven App form section for rich custom UI within the MDA shell.

```
Form → Insert → Canvas App
  - Choose existing Canvas App or create new
  - Pass ModelDrivenFormIntegration.Item as the current record context
  - Canvas App reads: ModelDrivenFormIntegration.Item.fieldname

Limitations:
  - No offline support
  - Embedded Canvas Apps have their own license requirement
  - Cannot drive form save from within the Canvas App
  - Use Xrm.Page notifications from Canvas App's web resource events
```

### Passing Record Context to Embedded Canvas App
```powerfx
// In Canvas App, access the host form record:
ModelDrivenFormIntegration.Item.'Project Name'
ModelDrivenFormIntegration.Item.Status
```

## Performance Optimization — Form Load

```
- Disable unnecessary OnLoad JavaScript handlers
- Avoid synchronous web API calls in OnLoad (blocks form render)
- Use lazy-loaded tabs: set "Expand this tab by default" = false for non-critical tabs
- Register event handlers on specific attributes, not globally
- Use filtering attributes on plugin steps to avoid unnecessary firing
```
