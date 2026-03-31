# Model-Driven Apps — Custom Pages

Custom Pages are full Canvas App screens that run inside the Model-Driven App navigation — unlike embedded Canvas Apps which sit inside a form section.

## When to Use Custom Pages vs Embedded Canvas

| Scenario | Use |
|---|---|
| Full-screen custom UI (dashboard, wizard, config page) | **Custom Page** |
| Custom control inside an existing form section | **Embedded Canvas App** |
| Need MDA navigation (site map link, command bar action) | **Custom Page** |
| Need to read/write the current form record inline | **Embedded Canvas App** |

## Creating a Custom Page

```
1. Solution → New → Page → Canvas (Custom Page)
2. Build the page in Power Apps Studio (full Canvas App capabilities)
3. Add to app module: App Designer → Navigation → Add Page → Custom
4. Custom Page appears as a navigation item alongside entity forms/views
```

## Navigating to Custom Page from JavaScript

```typescript
// Open Custom Page from a command bar button or ribbon action
Xrm.Navigation.navigateTo(
  {
    pageType: "custom",
    name: "contoso_orderwizard_a1b2c3",  // Unique name of the custom page
    entityName: "contoso_order",           // Optional: pass entity context
    recordId: formContext.data.entity.getId() // Optional: pass record
  },
  { target: 1 }  // 1 = inline (same window), 2 = dialog
);
```

## Passing Parameters to Custom Page

```typescript
// From JavaScript
Xrm.Navigation.navigateTo({
  pageType: "custom",
  name: "contoso_orderwizard_a1b2c3",
  recordId: recordId
}, { target: 2, width: 800, height: 600 }); // Open as dialog

// In Custom Page (Canvas App), read parameters:
// Param("recordId") returns the passed value
```

## Key Facts

- Custom Pages have full Canvas App capabilities (connectors, formulas, modern controls)
- They respect MDA security context (user identity, roles)
- They load inside the MDA shell — consistent navigation experience
- Premium license required (same as Canvas Apps)
- Maximum **25 custom pages per app**
- **Side pane support**: Custom pages can be opened in a side pane for multi-tasking
- **Mobile preview**: Custom pages support mobile preview in the designer
