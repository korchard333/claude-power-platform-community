# Power Automate — Triggers

## Trigger Selection

| Scenario | Trigger | Notes |
|---|---|---|
| Dataverse record change | When a row is added/modified/deleted | Use filter attributes to limit triggers |
| Schedule | Recurrence | Set timezone explicitly |
| HTTP webhook | When an HTTP request is received | Secure with API key or IP restriction |
| From Code App / Canvas App | PowerApps trigger | Define input parameters |
| Manual | Manually trigger a flow | For testing or on-demand operations |
| File upload | When a file is created (SharePoint/OneDrive) | Use trigger conditions to filter |

---

## Dataverse Trigger Configuration

### Filtering Columns (Critical for Performance)
```
"When a row is added, modified or deleted" trigger → Settings:
  Filtering columns: contoso_status,contoso_priority

Without filtering columns: flow fires on EVERY field change (including system fields
like modifiedon). With filtering columns: fires ONLY when those specific fields change.
ALWAYS set filtering columns on Update triggers.
```

### Dataverse Trigger Message Types

| Value | Message | Description |
|---|---|---|
| `1` | Added | Record created |
| `2` | Deleted | Record deleted |
| `3` | Modified | Record updated |
| `4` | Added or Modified | Record created or updated |

Use in `subscriptionRequest/message` trigger parameter.

### Trigger Conditions (OData Expressions)
```
Trigger conditions run BEFORE the flow starts — saving flow runs.

Example: Only trigger when status = Active AND priority = High
  @equals(triggerOutputs()?['body/statecode'], 0)
  @equals(triggerOutputs()?['body/contoso_priority'], 100000002)

Example: Only trigger when a specific field has a value
  @not(empty(triggerOutputs()?['body/contoso_approvedon']))

Add via: Trigger → Settings → Trigger Conditions → Add
Each condition is ANDed. If ANY condition is false, the flow does not run.
```
