# Power Automate — Desktop Flows (RPA)

Desktop flows automate repetitive UI tasks on Windows — use when APIs don't exist.

## When to Use Desktop Flows
| Scenario | Use |
|---|---|
| Legacy Windows app (no API) | **Desktop flow** |
| Web scraping (no API) | **Desktop flow** |
| Terminal/mainframe automation | **Desktop flow** |
| File/folder operations at scale | **Desktop flow** |
| Modern API available | **Cloud flow** (always prefer) |
| Dataverse operations | **Cloud flow + native connector** |

## Execution Modes
| Mode | Description | License |
|---|---|---|
| Attended | User present; flow runs in foreground | Power Automate Premium |
| Unattended | Background; no user required | Power Automate Process plan |
| Hosted RPA | Microsoft-hosted Windows VM; no infrastructure | Power Automate hosted RPA add-on |

## Integration with Cloud Flows
```
Cloud Flow trigger (Recurrence / HTTP / Dataverse)
  └── Run a desktop flow
        Desktop flow: "Process Invoice in Legacy ERP"
        Run mode: Unattended (or Attended)
        Input variables: InvoiceNumber, Amount
        Output variables: ERPTransactionId, Status
  └── Update Dataverse record with ERPTransactionId
```

## Machine Groups

Machine groups allow unattended desktop flows to scale across multiple machines.

### Configuration
```
Power Automate → Machines → Machine groups → New machine group
  1. Name the group (e.g., "Invoice Processing Pool")
  2. Add 1+ machines (each must have Power Automate Desktop installed)
  3. Assign the machine group to desktop flow connections
```

### Scale-Out Patterns
| Pattern | Setup | When to Use |
|---|---|---|
| **Load balancing** | Multiple machines in one group | High volume — flows auto-distribute across available machines |
| **Priority queuing** | Separate groups for high/low priority | Different SLAs — critical flows get dedicated machines |
| **Environment isolation** | Separate groups per environment | Dev/Test/Prod isolation — prevent test flows from consuming prod capacity |

### Machine Group Best Practices
- Minimum 2 machines per production group for availability
- All machines in a group must have identical software installed (same app versions)
- Set machine group access permissions — restrict to specific users/groups
- Monitor machine availability in Power Automate Admin Center → capacity
- Use hosted machine groups when you don't want to manage infrastructure

---

## Exception Handling

Desktop flows fail frequently — UI changes, app timeouts, unexpected dialogs. Robust error handling is critical.

### Error Handling Actions
| Action | Use Case |
|---|---|
| **On block error** | Wrap a section of actions — catch errors within the block |
| **Retry** | Set retry count + interval on individual actions |
| **Wait for** | Wait for UI element/window before proceeding (avoids timing issues) |
| **If window exists** | Conditional logic based on whether a dialog appeared |
| **Take screenshot** | Capture screen state on failure for debugging |

### Error Handling Pattern
```
Main Flow:
  ├── Block: Process Invoice
  │     ├── Launch application
  │     ├── Wait for window "ERP - Invoice Entry" (timeout: 30s)
  │     ├── Populate text fields (Invoice #, Amount, Vendor)
  │     ├── Click "Submit"
  │     └── Wait for window "Confirmation" (timeout: 60s)
  │
  ├── On block error:
  │     ├── Take screenshot → save to %TempFolder%\error_%CurrentDateTime%.png
  │     ├── Set ErrorOccurred = True
  │     ├── Set ErrorMessage = %LastError%
  │     └── Close application (if open)
  │
  └── Return outputs: Success, ErrorOccurred, ErrorMessage
```

### Retry Configuration
```
Action: Click UI element "Submit Button"
  On error:
    Retry: 3 times
    Retry interval: 5 seconds
    If still fails: Continue flow execution (handle in block error)
```

### Screenshots on Failure
- Always capture screenshots when desktop flows fail in unattended mode
- Save to a shared folder or upload to SharePoint via the cloud flow
- Include timestamp and flow run ID in the filename for traceability
- Cloud flow can attach screenshot to failure notification email

---

## Common Action Patterns

### UI Automation Selectors
Selectors identify UI elements — they break when apps update.

| Selector Strategy | Reliability | Notes |
|---|---|---|
| **Name attribute** | High | Stable across versions if devs use meaningful names |
| **Automation ID** | Highest | Purpose-built for automation — prefer when available |
| **CSS selector** (web) | Medium | Stable with good class names, fragile with auto-generated |
| **XPath** (web) | Medium | More specific than CSS but verbose and brittle |
| **Image recognition** | Low | Last resort — breaks with resolution/theme changes |
| **Coordinates** | Lowest | Never use — breaks on any UI change |

Best practices for selectors:
- Prefer Automation ID > Name > CSS/XPath > Image
- Use the Desktop Flow Designer recorder to capture initial selectors, then manually simplify
- Remove volatile attributes (position, index) from recorded selectors
- Test selectors at different screen resolutions

### Web Automation
```
Launch browser: Chrome
  └── Navigate to URL: %ApplicationURL%
  └── Wait for web page to contain element (CSS: "#login-form")
  └── Populate text field (CSS: "#username") with %Username%
  └── Populate text field (CSS: "#password") with %Password%
  └── Click element (CSS: "#login-button")
  └── Wait for web page to contain element (CSS: "#dashboard")
  └── Extract data from web page → DataTable
```

### Excel Actions
| Action | Use Case |
|---|---|
| **Launch Excel** | Open workbook for processing |
| **Read from Excel** | Read range/table → DataTable variable |
| **Write to Excel** | Write DataTable or individual cells |
| **Run Excel macro** | Execute VBA macros for complex operations |
| **Close Excel** | Always close — prevents file locks in unattended mode |

Pattern — process Excel rows:
```
Launch Excel: %FilePath%
Read from Excel worksheet → ExcelData
For each row in ExcelData:
  ├── Process row in legacy application (UI automation)
  ├── Write result back to Excel (status column)
  └── If error: log and continue to next row
Save Excel
Close Excel
```

### File System Actions
| Action | Use Case |
|---|---|
| **Get files in folder** | List files matching a pattern (e.g., *.pdf) |
| **Move/Copy/Delete file** | File management after processing |
| **Read text from file** | Parse CSV, TXT, config files |
| **Write text to file** | Generate output/log files |
| **If file exists** | Conditional processing based on file presence |

---

## Version Control (Wave 1 2026)

> **Preview (Wave 1 2026):** Desktop flows now support built-in version control — save drafts, publish stable versions, compare changes, and restore previous versions.

| Capability | Before (No Version Control) | After (Version Control) |
|---|---|---|
| **Change tracking** | Manual `.pad` file exports | Automatic draft/publish versioning in Dataverse |
| **Rollback** | Re-import old `.pad` file | One-click restore from version history pane |
| **Collaboration** | "Who changed what?" is unknown | Version history shows user + timestamp per change |
| **Diff comparison** | Not available | Compare any two versions side-by-side |
| **Release management** | All saves are live | Draft vs Published — only published versions execute |

**Key concepts:**
- **Save draft** — incremental save, does not affect running version
- **Publish** — sets the version as the official executable version
- **Version history pane** — view all drafts and published versions with timestamps
- **Restore** — revert to any previous version (saved as a new draft)

**Best practice:** Save drafts frequently during development. Publish only after testing. Use the version history for rollback instead of recreating flows.

---

## Testing Subflows (Wave 1 2026)

> **GA (Wave 1 2026):** Test individual subflows in isolation using the desktop flow test suite, without executing the entire parent flow.

Subflow testing enables faster debugging by running specific subflows with controlled inputs and validating outputs. Integrate subflow tests into test suites for regression testing across updates.

---

## Best Practices
- Desktop flows should be idempotent — safe to re-run if they fail partway
- Use input/output variables (not hardcoded values) to make flows reusable
- Keep desktop flows focused (one task each) — orchestrate with cloud flows
- Monitor via Power Automate Admin Center → Desktop flow runs
- Use machine groups for unattended scale-out across multiple machines
- Add wait actions before UI interactions — never assume the UI is ready
- Log key steps to output variables — the cloud flow can persist them to Dataverse
- Version control desktop flow definitions by exporting as `.pad` files
- Test with both attended and unattended modes before deploying to production
