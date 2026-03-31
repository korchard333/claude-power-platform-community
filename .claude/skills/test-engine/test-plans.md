# Test Plans (YAML Format)

## YAML Test Plan Schema

Test plans define what to test, how to authenticate, and what settings to use. Every `.te.yaml` file has three top-level sections:

```yaml
# testplan.te.yaml
testSuite:
  testSuiteName: Expense App Smoke Tests
  persona: User1
  appLogicalName: contoso_expenseapp          # Solution-based (recommended)
  # appId: "00000000-0000-0000-0000-000000000000"  # Standalone alternative
  testCases:
    - testCaseName: Submit New Expense
      testSteps: |
        = Screenshot("01_app_loaded.png");
          SetProperty(TextInput_Title.Text, "Team Lunch");
          SetProperty(TextInput_Amount.Text, "42.50");
          Select(Dropdown_Category);
          Select(Dropdown_Category, {Value: "Meals"});
          Select(Button_Submit);
          Assert(Label_Status.Text = "Submitted", "Expense should be submitted");
          Screenshot("02_submitted.png");

testSettings:
  headless: false                             # true for CI/CD, false for dev
  recordVideo: true
  timeout: 60000                              # ms — default 30000
  browserConfigurations:
    - browser: Chromium
  locale: en-US

environmentVariables:
  users:
    - personaName: User1
      emailKey: user1Email
```

## Schema Reference

### testSuite

| Property | Required | Description |
|---|---|---|
| `testSuiteName` | Yes | Name shown in .trx results |
| `persona` | Yes | Must match a `personaName` in `environmentVariables.users` |
| `appLogicalName` | Yes* | Logical name from solution (preferred — portable across environments) |
| `appId` | Yes* | App GUID — only for standalone canvas apps not in a solution |
| `testCases` | Yes | Array of test cases (run sequentially, state persists across cases) |
| `testSuiteDescription` | No | Description for reporting |
| `networkRequestMocks` | No | Mock external connector responses |
| `onTestCaseStart` | No | Power Fx to run before each case |
| `onTestCaseComplete` | No | Power Fx to run after each case |
| `onTestSuiteComplete` | No | Power Fx to run after suite completes |

*Provide either `appLogicalName` or `appId`, not both.

### Finding appLogicalName

1. Open the solution containing your app in Power Apps
2. Use the **Name** column (not Display Name) — includes the publisher prefix (e.g., `contoso_expenseapp`)

### Finding appId

1. Open Power Apps → Apps list
2. Click the app → Details → copy the **App ID** GUID

### testCases

| Property | Required | Description |
|---|---|---|
| `testCaseName` | Yes | Name used in pass/fail reporting |
| `testSteps` | Yes | Power Fx expressions (multiline YAML with `\| =` prefix) |
| `testCaseDescription` | No | Additional context |

## Power Fx Test Steps

Test steps use Power Fx functions separated by semicolons. The value starts with a pipe `|` for multiline YAML, then `=` for Power Fx:

```yaml
testSteps: |
  = // Comments start with double slash
    Select(Button1);                              // Click a button
    SetProperty(TextInput1.Text, "Hello");        // Set input value
    Assert(Label1.Text = "Hello", "Label updated");  // Verify
    Wait(Label1, "Text", "Done");                 // Wait for value
    Screenshot("step_complete.png");              // Capture screenshot
```

### Core Functions

| Function | Purpose | Example |
|---|---|---|
| `Select(control)` | Click/tap a control | `Select(SubmitButton)` |
| `Select(gallery, record)` | Select gallery item | `Select(Gallery1, Index(Gallery1.AllItems, 3))` |
| `SetProperty(prop, value)` | Set control property | `SetProperty(TextInput1.Text, "John")` |
| `Assert(condition, message)` | Verify condition is true | `Assert(Label1.Visible = true, "Label visible")` |
| `Wait(control, prop, value)` | Wait until property equals value | `Wait(Label1, "Text", "Complete")` |
| `Screenshot(filename)` | Capture PNG/JPEG screenshot | `Screenshot("after_submit.png")` |

### Lifecycle Hooks

Use `onTestCaseStart` and `onTestCaseComplete` for setup/teardown:

```yaml
testSuite:
  testSuiteName: CRUD Tests
  persona: User1
  appLogicalName: contoso_app
  onTestCaseStart: |
    = // Reset form before each test
      Select(Button_NewRecord);
  onTestCaseComplete: |
    = // Capture state after each test
      Screenshot(Concatenate("after_", Text(Now(), "yyyyMMdd_HHmmss"), ".png"));
  testCases:
    - testCaseName: Create Record
      testSteps: |
        = SetProperty(TextInput_Name.Text, "Test Record");
          Select(Button_Save);
          Assert(Label_Status.Text = "Saved", "Record saved");
```

## Network Request Mocking

Mock external connector responses to isolate tests from third-party APIs:

```yaml
testSuite:
  testSuiteName: Weather App Tests
  persona: User1
  appLogicalName: contoso_weatherapp
  networkRequestMocks:
    - requestURL: "https://api.weather.example.com/current*"
      method: GET
      responseDataFile: "mocks/weather-response.json"
  testCases:
    - testCaseName: Display Weather
      testSteps: |
        = Select(Button_GetWeather);
          Assert(Label_Temp.Text = "72°F", "Mock weather displayed");
```

The `responseDataFile` is a plain text file containing the full response body. Glob patterns are supported in `requestURL`.

## Connector Simulation (Preview)

For more granular connector mocking, use `Preview.SimulateConnector`:

```yaml
testSettings:
  extensionModules:
    enable: true
    allowPowerFxNamespaces:
      - Preview

testSuite:
  testSuiteName: Connector Simulation
  persona: User1
  appLogicalName: contoso_app
  testCases:
    - testCaseName: Mock MSN Weather
      testSteps: |
        = Preview.SimulateConnector({
            name: "msnweather",
            then: {responses: {
              daily: {
                day: {
                  summary: "Mocked sunny weather"
                }
              }
            }}
          });
          Select(Button_Refresh);
          Assert(Label_Weather.Text = "Mocked sunny weather", "Connector mocked");
```

## testSettings

| Property | Default | Description |
|---|---|---|
| `headless` | `true` | `false` shows browser during execution — use for local dev |
| `recordVideo` | `false` | `true` captures video of test run — always use in CI/CD |
| `timeout` | `30000` | Milliseconds before a step times out |
| `locale` | System default | Culture for Power Fx parsing (e.g., `en-US`, `de-DE`) |
| `browserConfigurations` | Required | At least one browser: `Chromium`, `Firefox`, or `Webkit` |
| `extensionModules` | — | Enable Preview namespace and Dataverse functions |
| `filePath` | — | Path to separate settings YAML (overrides inline settings) |

### Extension Modules

Enable Preview functions (Playwright, connector simulation) and Dataverse integration:

```yaml
testSettings:
  extensionModules:
    enable: true
    allowPowerFxNamespaces:
      - Preview
    parameters:
      enableDataverseFunctions: true   # Requires az login
```

### Browser Configuration

```yaml
testSettings:
  browserConfigurations:
    - browser: Chromium
    - browser: Chromium
      device: "iPhone 13"              # Playwright device emulation
    - browser: Firefox
      screenWidth: 1920
      screenHeight: 1080
```

### User-Defined Types and Functions

Create reusable test helpers:

```yaml
testSettings:
  powerFxTestTypes:
    - name: ControlName
      value: |
        {ControlName: Text}
  testFunctions:
    - description: Wait until DOM element is visible
      code: |
        WaitUntilVisible(control: Text): Void =
          Preview.PlaywrightAction(
            Concatenate("//div[@data-id='", control, "']"),
            "wait"
          );
```

## Credentials Setup

**Never store credentials in YAML.** Use environment variables:

```yaml
environmentVariables:
  users:
    - personaName: User1
      emailKey: user1Email              # References $env:user1Email
    - personaName: Manager1
      emailKey: managerEmail
```

Set credentials in PowerShell before running tests:

```powershell
# Local development
$env:user1Email = "testuser@contoso.onmicrosoft.com"
$env:managerEmail = "manager@contoso.onmicrosoft.com"
```

### Authentication (PAC CLI 1.43+)

PAC CLI 1.43+ uses browser-based authentication compatible with MFA:

- **Storagestate** (default): Browser-based login, session cached locally. Windows-only for local scenarios.
- **Dataverse**: Service principal auth for local and pipeline execution. Requires additional setup.

Set `headless: false` for the initial sign-in to see the browser auth prompt. Subsequent runs reuse the cached session.

```powershell
# For pipelines — use service principal via Dataverse auth
pac test run `
  --provider canvas `
  --test-plan-file "tests/testplan.te.yaml" `
  --tenant "$TenantId" `
  --environment-id "$EnvironmentId" `
  --user-auth Dataverse
```

## Downloading from Test Studio

Existing Test Studio tests can be exported to YAML for Test Engine:

1. Open **Test Studio** in Power Apps
2. Click **Download suite** to export the test plan
3. Alternatively, click **Download** under each individual test suite
4. Update the config file and user configurations for your target environment
5. Run with `pac test run` — no changes to the test steps needed

## Worked Example: Complete Test Plan

```yaml
# expense-smoke.te.yaml — Full Canvas App test plan
testSuite:
  testSuiteName: Expense App Smoke Tests
  persona: User1
  appLogicalName: contoso_expenseapp
  onTestCaseStart: |
    = Screenshot(Concatenate("start_", Text(Now(), "HHmmss"), ".png"));
  testCases:
    - testCaseName: App Loads Successfully
      testSteps: |
        = Assert(App.ActiveScreen.Name = "HomeScreen", "App opens on home screen");
          Assert(CountRows(Gallery_Expenses.AllItems) >= 0, "Gallery loads");

    - testCaseName: Create New Expense
      testSteps: |
        = Select(Button_NewExpense);
          Assert(App.ActiveScreen.Name = "FormScreen", "Navigate to form");
          SetProperty(TextInput_Title.Text, "UAT Lunch");
          SetProperty(TextInput_Amount.Text, "35.00");
          Select(Dropdown_Category);
          Select(Dropdown_Category, {Value: "Meals"});
          Select(Button_Submit);
          Wait(Label_Status, "Text", "Submitted");
          Assert(Label_Status.Text = "Submitted", "Expense submitted");
          Screenshot("expense_created.png");

    - testCaseName: Verify Record in Gallery
      testSteps: |
        = Select(Icon_Back);
          Assert(App.ActiveScreen.Name = "HomeScreen", "Back to home");
          Assert(
            CountRows(Filter(Gallery_Expenses.AllItems, Title = "UAT Lunch")) > 0,
            "New expense visible in gallery"
          );

testSettings:
  headless: false
  recordVideo: true
  timeout: 60000
  browserConfigurations:
    - browser: Chromium

environmentVariables:
  users:
    - personaName: User1
      emailKey: user1Email
```

## Key References

- [YAML Schema](https://learn.microsoft.com/power-platform/test-engine/yaml)
- [Power Fx Functions](https://learn.microsoft.com/power-platform/test-engine/powerfx-functions)
- [Connector Simulation](https://learn.microsoft.com/power-platform/test-engine/simulation)
- [GitHub Samples](https://github.com/microsoft/PowerApps-TestEngine/tree/main/samples)
