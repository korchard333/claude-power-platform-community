# Model-Driven App Testing

## MDA Provider Overview

The Model-Driven Application Provider (`mda`) tests Dataverse model-driven apps — forms, views, business process flows, and dashboards. MDA testing currently requires **Preview functions** for most interactions.

```powershell
pac test run `
  --provider mda `
  --test-plan-file "tests/mda-smoke.te.yaml" `
  --tenant "your-tenant-id" `
  --environment-id "your-env-id" `
  --domain "https://contoso.crm.dynamics.com/main.aspx?appid=<app-guid>&pagetype=entityrecord&etn=account"
```

### Required Parameters

| Parameter | Description |
|---|---|
| `--provider mda` | Use the Model-Driven App provider |
| `--test-plan-file` | Path to `.te.yaml` file |
| `--tenant` | Microsoft Entra tenant ID |
| `--environment-id` | Power Platform environment ID |
| `--domain` | Full URL of the MDA page to test (see URL formats below) |

## URL Formats

The `--domain` parameter varies based on what you're testing:

| Page Type | URL Pattern |
|---|---|
| **Entity record (form)** | `https://{org}.crm.dynamics.com/main.aspx?appid={appid}&pagetype=entityrecord&etn={entity}` |
| **Entity list (view)** | `https://{org}.crm.dynamics.com/main.aspx?appid={appid}&pagetype=entitylist&etn={entity}` |
| **Dashboard** | `https://{org}.crm.dynamics.com/main.aspx?appid={appid}&pagetype=dashboard` |
| **Specific record** | `...&pagetype=entityrecord&etn={entity}&id={record-guid}` |

### Finding Your App ID

1. Open the model-driven app in the browser
2. The `appid` parameter is in the URL query string
3. Or: Solutions → select solution → find the app → copy the App ID from details

## Enable Preview Functions

All MDA testing capabilities currently require the Preview namespace:

```yaml
testSettings:
  extensionModules:
    enable: true
    allowPowerFxNamespaces:
      - Preview
```

## Common Test Patterns

### Verify Field Exists on Form

```yaml
testCases:
  - testCaseName: Account Form Has Required Fields
    testSteps: |
      = // Wait for form to load
        Preview.PlaywrightAction("//div[@data-id='name']", "wait");
        // Verify key fields exist
        Preview.PlaywrightAction("//div[@data-id='name']", "exists");
        Preview.PlaywrightAction("//div[@data-id='telephone1']", "exists");
        Preview.PlaywrightAction("//div[@data-id='emailaddress1']", "exists");
        Screenshot("account_form_fields.png");
```

### Fill Form and Save

```yaml
testCases:
  - testCaseName: Create Account Record
    testSteps: |
      = // Fill in account name
        Preview.PlaywrightActionValue(
          "//input[@data-id='name.fieldControl-text-box-text']",
          "fill",
          "Test Account - UAT"
        );
        // Fill phone number
        Preview.PlaywrightActionValue(
          "//input[@data-id='telephone1.fieldControl-phone-number-text-input']",
          "fill",
          "555-0123"
        );
        // Click Save
        Preview.PlaywrightAction(
          "//button[@data-id='edit-form-save-btn']",
          "click"
        );
        // Wait for save to complete
        Preview.PlaywrightAction(
          "//span[contains(@data-id, 'headerFieldValue')]",
          "wait"
        );
        Screenshot("account_saved.png");
```

### Verify Column in View

```yaml
testCases:
  - testCaseName: Active Accounts View Has Name Column
    testSteps: |
      = // Wait for the grid to load
        Preview.PlaywrightAction(
          "//div[contains(@class, 'ag-header-cell')]",
          "wait"
        );
        // Verify 'Account Name' column header exists
        Preview.PlaywrightAction(
          "//div[contains(@class, 'ag-header-cell')]//span[text()='Account Name']",
          "exists"
        );
        Screenshot("view_columns.png");
```

### Business Process Flow Navigation

```yaml
testCases:
  - testCaseName: BPF Stage Progression
    testSteps: |
      = // Wait for BPF to render
        Preview.PlaywrightAction(
          "//div[contains(@class, 'businessProcessFlowContainer')]",
          "wait"
        );
        // Verify current stage
        Preview.PlaywrightAction(
          "//div[contains(@class, 'processStage-selected')]//div[contains(text(), 'Qualify')]",
          "exists"
        );
        // Click next stage button
        Preview.PlaywrightAction(
          "//button[@data-id='MoveToNextStage']",
          "click"
        );
        // Verify stage advanced
        Preview.PlaywrightAction(
          "//div[contains(@class, 'processStage-selected')]//div[contains(text(), 'Develop')]",
          "wait"
        );
        Screenshot("bpf_advanced.png");
```

### Navigate Between Entity Records

```yaml
testCases:
  - testCaseName: Open Record From View
    testSteps: |
      = // Wait for grid to load
        Preview.PlaywrightAction("//div[@data-id='cell-0-1']", "wait");
        // Click first record in the grid
        Preview.PlaywrightAction("//div[@data-id='cell-0-1']", "click");
        // Wait for form to load
        Preview.PlaywrightAction("//div[@data-id='name']", "wait");
        Screenshot("record_opened.png");
```

### Command Bar Interaction

```yaml
testCases:
  - testCaseName: Deactivate Record
    testSteps: |
      = // Click Deactivate button in command bar
        Preview.PlaywrightAction(
          "//button[@data-id='Mscrm.Form.account.Deactivate']",
          "click"
        );
        // Wait for confirmation dialog
        Preview.PlaywrightAction(
          "//button[@data-id='ok_id']",
          "wait"
        );
        // Confirm deactivation
        Preview.PlaywrightAction(
          "//button[@data-id='ok_id']",
          "click"
        );
        Screenshot("record_deactivated.png");
```

## Dataverse Integration

Enable Dataverse functions for direct backend verification alongside UI tests:

```yaml
testSettings:
  extensionModules:
    enable: true
    allowPowerFxNamespaces:
      - Preview
    parameters:
      enableDataverseFunctions: true
```

**Prerequisites:**
- Run `az login` with a user or service principal that has Dataverse rights
- Set `DATAVERSE_URL` environment variable, or the URL is derived from the `--domain` parameter

## User-Defined Helper Functions

Create reusable functions for common MDA interactions:

```yaml
testSettings:
  powerFxTestTypes:
    - name: ControlName
      value: |
        {ControlName: Text}
  testFunctions:
    - description: Wait until MDA field is visible
      code: |
        WaitForField(fieldId: Text): Void =
          Preview.PlaywrightAction(
            Concatenate("//div[@data-id='", fieldId, "']"),
            "wait"
          );
    - description: Fill a text field by data-id
      code: |
        FillField(fieldId: Text, value: Text): Void =
          Preview.PlaywrightActionValue(
            Concatenate("//input[@data-id='", fieldId, ".fieldControl-text-box-text']"),
            "fill",
            value
          );
    - description: Get options for a control
      code: |
        GetOptions(control: ControlName): Options =
          Preview.GetOptions(control);
```

Then use them in test steps:

```yaml
testCases:
  - testCaseName: Create Account With Helpers
    testSteps: |
      = WaitForField("name");
        FillField("name", "Helper Test Account");
        FillField("telephone1", "555-0199");
        Screenshot("filled_with_helpers.png");
```

## Pro-Code Alternative: Sean Astrakhan's AI-Generated Test Pattern

For teams using MCP servers, AI can generate Playwright tests from ADO work items:

```
Workflow:
1. ADO MCP → Read work item acceptance criteria
2. AI generates Playwright TypeScript test targeting MDA URLs
3. Playwright opens MDA → navigates to entity → verifies fields on form/view
4. Test reports pass/fail
5. ADO MCP → Posts test results to work item discussion
6. ADO MCP → Updates work item state (Done if pass, Blocked if fail)
```

This pattern uses raw Playwright (TypeScript) instead of Test Engine Power Fx. It's best suited for:
- Teams with strong TypeScript/Playwright expertise
- Complex MDA customizations where DOM selectors are unavoidable
- Integration with ADO work item tracking

See [playwright-advanced.md](playwright-advanced.md) for the raw Playwright approach and [cicd-integration.md](cicd-integration.md) for ADO pipeline integration.

## MDA-Specific Gotchas

- **Form load timing**: MDA forms load asynchronously — always `wait` for controls before interacting
- **Subgrids**: Subgrid data loads after the main form — add explicit waits for subgrid containers
- **Lookup fields**: Opening a lookup dropdown renders a flyout panel — use Playwright selectors to interact with it
- **Business rules**: Server-side business rules execute on save, not on field change — test assertions after save, not after field fill
- **Ribbons/Command bar**: Button `data-id` values follow the pattern `Mscrm.Form.{entity}.{CommandName}`
- **Form types**: Main form vs Quick Create form vs Quick View form — ensure your `--domain` URL targets the correct form type

## Key References

- [MDA Testing](https://learn.microsoft.com/power-platform/test-engine/model-driven-application)
- [Preview Functions](https://learn.microsoft.com/power-platform/test-engine/powerfx-functions#preview-functions)
- [Providers](https://learn.microsoft.com/power-platform/test-engine/providers)
