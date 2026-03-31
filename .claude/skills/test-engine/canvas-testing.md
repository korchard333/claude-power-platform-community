# Canvas App Testing

## Canvas Provider Overview

The Canvas Application Provider (`canvas`) tests Power Apps canvas applications using app-level control names instead of DOM selectors. This makes tests resilient to platform UI changes.

```powershell
pac test run `
  --provider canvas `
  --test-plan-file "tests/canvas-smoke.te.yaml" `
  --tenant "your-tenant-id" `
  --environment-id "your-env-id"
```

### Required Parameters

| Parameter | Description |
|---|---|
| `--provider canvas` | Use the Canvas provider |
| `--test-plan-file` | Path to `.te.yaml` file |
| `--tenant` | Microsoft Entra tenant ID |
| `--environment-id` | Power Platform environment ID |

### Optional Parameters

| Parameter | Description |
|---|---|
| `--output-directory` | Where to save .trx results, screenshots, and videos |
| `--log-level` | `Trace`, `Debug`, `Information`, `Warning`, `Error` |
| `--user-auth` | `Storagestate` (default) or `Dataverse` |

## Control Name Selectors

Test Engine references controls by their **Power Apps Studio names**, not DOM selectors. This is the key advantage over raw Playwright.

### Finding Control Names

1. Open the app in **Power Apps Studio**
2. Select a control on the canvas
3. The control name appears in the **Properties pane** header (e.g., `TextInput1`, `Gallery_Contacts`, `Button_Submit`)
4. Use **Tree view** to see all controls and their hierarchy

### Naming Convention Tip

Rename controls to descriptive names in Power Apps Studio before writing tests. `Button_SubmitExpense` is far more readable and maintainable than `Button3`.

## Common Test Patterns

### Fill Form and Submit

```yaml
testCases:
  - testCaseName: Create Contact
    testSteps: |
      = Select(Button_NewContact);
        SetProperty(TextInput_FirstName.Text, "Jane");
        SetProperty(TextInput_LastName.Text, "Doe");
        SetProperty(TextInput_Email.Text, "jane.doe@example.com");
        Select(Dropdown_Department);
        Select(Dropdown_Department, {Value: "Engineering"});
        Select(Button_Save);
        Wait(Label_Status, "Text", "Saved");
        Assert(Label_Status.Text = "Saved", "Contact saved successfully");
        Screenshot("contact_created.png");
```

### Gallery Navigation

```yaml
testCases:
  - testCaseName: Select Third Item in Gallery
    testSteps: |
      = // Verify gallery has data
        Assert(CountRows(Gallery_Contacts.AllItems) >= 3, "Gallery has 3+ items");
        // Select the third item
        Select(Gallery_Contacts, Index(Gallery_Contacts.AllItems, 3));
        // Verify detail screen shows correct data
        Assert(Label_DetailName.Text = Gallery_Contacts.Selected.FullName,
          "Detail shows selected contact");
        Screenshot("gallery_detail.png");
```

### Toggle and Checkbox Controls

```yaml
testCases:
  - testCaseName: Toggle Settings
    testSteps: |
      = SetProperty(Toggle_Notifications.Value, true);
        Assert(Toggle_Notifications.Value = true, "Notifications enabled");
        SetProperty(Toggle_DarkMode.Value, false);
        Assert(Toggle_DarkMode.Value = false, "Dark mode disabled");
```

### Date Picker

```yaml
testCases:
  - testCaseName: Set Date
    testSteps: |
      = SetProperty(DatePicker_StartDate.SelectedDate, Date(2026, 4, 15));
        Assert(DatePicker_StartDate.SelectedDate = Date(2026, 4, 15),
          "Start date set correctly");
```

### Screen Navigation Verification

```yaml
testCases:
  - testCaseName: Navigate Between Screens
    testSteps: |
      = Assert(App.ActiveScreen.Name = "HomeScreen", "Starts on home");
        Select(Button_GoToSettings);
        Assert(App.ActiveScreen.Name = "SettingsScreen", "Navigated to settings");
        Select(Icon_Back);
        Assert(App.ActiveScreen.Name = "HomeScreen", "Back to home");
```

### Visibility and Conditional UI

```yaml
testCases:
  - testCaseName: Admin-Only Button Visibility
    testSteps: |
      = // As regular user, admin button should be hidden
        Assert(Button_AdminPanel.Visible = false,
          "Admin panel hidden for standard user");
        // Error label should not be visible initially
        Assert(Label_Error.Visible = false, "No errors on load");
```

## Delegation Testing

Canvas apps have delegation limits (default 500 or 2000 rows). Test Engine can verify that delegation-safe queries return correct results on large datasets.

### Testing Delegation-Safe Filters

```yaml
testCases:
  - testCaseName: Search Returns Delegated Results
    testSteps: |
      = // StartsWith is delegable for Dataverse
        SetProperty(TextInput_Search.Text, "Cont");
        // Wait for gallery to refresh
        Wait(Gallery_Accounts, "AllItemsCount", "0");
        // Gallery should show filtered results (delegation handled server-side)
        Assert(CountRows(Gallery_Accounts.AllItems) > 0,
          "Delegated search returns results");
        Assert(
          CountRows(
            Filter(Gallery_Accounts.AllItems,
              Not(StartsWith(Name, "Cont"))
            )
          ) = 0,
          "All results match the search filter"
        );
```

### Testing Non-Delegable Warning Scenarios

If your app uses non-delegable functions, verify that the app handles the row limit correctly:

```yaml
testCases:
  - testCaseName: Large Dataset With Non-Delegable Filter
    testSteps: |
      = // This test verifies the app shows a warning when results may be incomplete
        SetProperty(TextInput_Search.Text, "contains-term");
        // If using non-delegable Contains(), only local rows are filtered
        Assert(Label_DelegationWarning.Visible = true,
          "Warning shown for potentially incomplete results");
```

## Dataverse Integration

Enable Dataverse functions to query Dataverse directly within test steps — useful for verifying that a Canvas app actually wrote data to the backend.

### Setup

```yaml
testSettings:
  extensionModules:
    enable: true
    parameters:
      enableDataverseFunctions: true
```

**Prerequisite:** Run `az login` before executing tests. The Dataverse API URL is derived from the `--domain` parameter or the `DATAVERSE_URL` environment variable.

### Verify Record Created in Dataverse

```yaml
testCases:
  - testCaseName: Submit Creates Dataverse Record
    testSteps: |
      = // Fill and submit form in Canvas app
        SetProperty(TextInput_Name.Text, "Test Account");
        Select(Button_Create);
        Wait(Label_Status, "Text", "Created");
        // Verify record exists in Dataverse (requires enableDataverseFunctions)
        // Note: Dataverse functions are available when extension modules are enabled
        Screenshot("record_created.png");
```

## Connector Mocking

Mock external connectors to isolate Canvas app logic from third-party APIs:

```yaml
testSuite:
  testSuiteName: Isolated Tests
  persona: User1
  appLogicalName: contoso_app
  networkRequestMocks:
    - requestURL: "https://api.external-service.com/v1/data*"
      method: GET
      responseDataFile: "mocks/external-data.json"
    - requestURL: "https://graph.microsoft.com/v1.0/me"
      method: GET
      responseDataFile: "mocks/graph-me.json"
```

For connector-level simulation using Preview functions, see [test-plans.md](test-plans.md#connector-simulation-preview).

## Multi-Persona Testing

Test the same app as different users to verify role-based behavior:

```yaml
environmentVariables:
  users:
    - personaName: StandardUser
      emailKey: standardUserEmail
    - personaName: ManagerUser
      emailKey: managerUserEmail
```

Create separate test suites per persona in the same file or separate files:

```yaml
# standard-user-tests.te.yaml
testSuite:
  testSuiteName: Standard User Tests
  persona: StandardUser
  appLogicalName: contoso_app
  testCases:
    - testCaseName: Cannot Access Admin Panel
      testSteps: |
        = Assert(Button_AdminPanel.Visible = false,
            "Admin panel hidden for standard user");
```

## Tips and Gotchas

- **Control names are case-sensitive** — `Button1` is not `button1`
- **Gallery items**: Use `Select(Gallery, Index(Gallery.AllItems, N))` — not `Select(Gallery.Item[N])`
- **State persists across test cases** in the same suite — earlier test cases affect later ones
- **`SetProperty` doesn't trigger `OnChange`** for all control types — if your app relies on `OnChange`, follow `SetProperty` with a `Select` on another control to trigger the event chain
- **Timeout errors**: Increase `timeout` in `testSettings` for slow environments or complex apps
- **Test isolation**: Use `onTestCaseStart` to reset app state between test cases if needed

## Key References

- [Canvas App Testing](https://learn.microsoft.com/power-platform/test-engine/canvas-application)
- [Power Fx Functions](https://learn.microsoft.com/power-platform/test-engine/powerfx-functions)
- [Canvas Samples on GitHub](https://github.com/microsoft/PowerApps-TestEngine/tree/main/samples)
