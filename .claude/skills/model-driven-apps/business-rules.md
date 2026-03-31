# Model-Driven Apps — Business Rules

Business rules run client-side (form) and optionally server-side (entity scope), without custom JavaScript.

## Scope Options

| Scope | Runs On | Use |
|---|---|---|
| Entity | Server + all forms | Validation, default values — enforced everywhere |
| All Forms | All forms | Show/hide, field requirements — form-only |
| Specific Form | Single form | Form-specific logic |

## Supported Actions

```
- Show/hide field or section or tab
- Enable/disable field
- Set field requirement: Required, Recommended, Not Required
- Set field value
- Set business required error message
- Lock/unlock field
- Recommendation (advisory, not enforced)
```

## Business Rule Example (JSON-ish pseudocode)

```
Condition: contoso_priority equals "High"
AND: statecode equals "Active"

Actions:
  - Set requirement level: contoso_duedate = Required
  - Show field: contoso_escalationreason
  - Set value: contoso_sla = "24h"
```

## When NOT to Use Business Rules

- Complex multi-field calculations (use Calculated Column or Plugin)
- Logic involving related entities (use Plugin)
- Lookups from other tables (use JavaScript + Xrm API)
- Async operations (use Plugin post-operation async or Power Automate)
