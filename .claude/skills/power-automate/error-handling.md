# Power Automate — Error Handling

## Error Handling Pattern (Scope-Based)

### ⚠️ InitializeVariable Must Be at Root Level

`InitializeVariable` actions CANNOT be inside a Scope. Power Automate requires variables to be initialized at the root action level, BEFORE any scopes:

```json
"actions": {
  "Initialize_Counter": {
    "type": "InitializeVariable",
    "inputs": { "variables": [{ "name": "counter", "type": "integer", "value": 0 }] },
    "description": "Must be at root level — not inside Try scope"
  },
  "Try": {
    "type": "Scope",
    "actions": {
      "Business_Logic_Here": { }
    }
  },
  "Catch": {
    "type": "Scope",
    "runAfter": { "Try": ["Failed", "TimedOut", "Skipped"] },
    "actions": { }
  }
}
```

If you see `InitializeVariable` inside a Scope, move it to the root — flow activation will fail with a variable scope error.

```
Scope: Try
  ├── [Business logic actions]
  └── Set variable: varSuccess = true

Scope: Catch (Configure run after: Failed, Timed out, Skipped)
  ├── Compose: Error details
  │     @{workflow().tags.flowDisplayName}
  │     Run ID: @{workflow().run.name}
  │     Error: @{actions('FailedAction').error.message}
  ├── Send notification (email/Teams/Adaptive Card)
  └── Terminate: Failed (with error details)

Scope: Finally (Configure run after: Succeeded, Failed, Skipped, Timed out)
  └── Cleanup actions (delete temp files, release locks)
```
