# Playwright Advanced

## Preview Functions Within Test Engine

Test Engine provides Preview functions that bridge Power Fx test steps with Playwright's browser automation. These let you drop down to DOM-level interactions when app-level control names aren't sufficient.

### Enabling Preview Functions

Add `Preview` to the allowed namespaces in test settings:

```yaml
testSettings:
  extensionModules:
    enable: true
    allowPowerFxNamespaces:
      - Preview
```

### Preview.PlaywrightAction

Execute an action on an element using CSS or XPath locators:

```
Preview.PlaywrightAction(selector: Text, action: Text)
```

| Action | Description | Example |
|---|---|---|
| `click` | Click an element | `Preview.PlaywrightAction("//button[@id='submit']", "click")` |
| `exists` | Check if element exists | `Preview.PlaywrightAction("//div[@class='error']", "exists")` |
| `wait` | Wait for element to appear | `Preview.PlaywrightAction("//table[@data-loading='false']", "wait")` |

### Preview.PlaywrightActionValue

Execute an action that requires a value parameter:

```
Preview.PlaywrightActionValue(selector: Text, action: Text, value: Text)
```

| Action | Description | Example |
|---|---|---|
| `fill` | Fill a form field | `Preview.PlaywrightActionValue("//input[@name='search']", "fill", "Product name")` |
| `select` | Select dropdown option | `Preview.PlaywrightActionValue("//select", "select", "Option2")` |
| `setAttribute` | Set DOM attribute | `Preview.PlaywrightActionValue("//div", "setAttribute", "data-custom='value'")` |

### Preview.PlaywrightScript

Execute a custom C# script with full Playwright API access:

```
Preview.PlaywrightScript("custom-script.csx")
```

**Important:** `Preview.PlaywrightScript` is only available in the **Debug build** compiled from the [open-source Test Engine repository](https://github.com/microsoft/PowerApps-TestEngine). It is **not available** in the released `pac test run` tool.

### Preview.Pause

Open the Playwright Inspector for interactive debugging:

```
Preview.Pause()
```

Use this during local development to step through tests interactively. Remove before committing to CI/CD.

### Preview.SelectControl

Select a control using the DOM (alternative to standard `Select`):

```
Preview.SelectControl(Button3, 1)    // Select first match of Button3
```

## When to Use Direct Playwright

Prefer Test Engine's app-level abstractions (control names via `Select`, `SetProperty`, `Assert`). Drop to Playwright only when:

| Scenario | Why Playwright Is Needed |
|---|---|
| **Third-party components** embedded in Power Apps | Test Engine doesn't know their control model |
| **Custom PCF controls** with complex DOM | Internal DOM structure not exposed as Power Apps controls |
| **Visual regression testing** | Screenshot comparison at pixel level |
| **Complex multi-step UI** not covered by Test Engine | Modal dialogs, drag-and-drop, hover menus |
| **MDA form interactions** | Currently require Preview functions for most operations |

## Hybrid Example: Power Fx + Playwright

Combine app-level Power Fx selectors with Playwright DOM actions in the same test:

```yaml
testSettings:
  extensionModules:
    enable: true
    allowPowerFxNamespaces:
      - Preview

testSuite:
  testSuiteName: Hybrid Calendar Test
  persona: User1
  appLogicalName: contoso_bookingapp
  testCases:
    - testCaseName: Book Appointment via Custom Calendar
      testSteps: |
        = // Power Fx: interact with standard Canvas controls
          SetProperty(TextInput_ClientName.Text, "Jane Smith");
          Select(Dropdown_Service);
          Select(Dropdown_Service, {Value: "Consultation"});

          // Playwright: interact with embedded third-party calendar PCF
          Preview.PlaywrightAction(
            "//div[@class='custom-calendar']//button[@data-day='15']",
            "click"
          );
          Preview.PlaywrightAction(
            "//div[@class='time-slots']//button[text()='10:00 AM']",
            "click"
          );

          // Power Fx: submit and verify using standard controls
          Select(Button_BookAppointment);
          Preview.PlaywrightAction(
            "//div[@data-status='confirmed']",
            "wait"
          );
          Assert(Label_Confirmation.Text = "Booking Confirmed",
            "Appointment booked successfully");
          Screenshot("booking_confirmed.png");
```

## Custom C# Script Pattern

For the open-source Debug build only, create `.csx` scripts with full Playwright access:

### Script Structure

```csharp
// advanced-validation.csx
#r "Microsoft.Playwright.dll"
#r "Microsoft.Extensions.Logging.dll"

using Microsoft.Playwright;
using Microsoft.Extensions.Logging;

public class PlaywrightScript
{
    public static void Run(IBrowserContext context, ILogger logger)
    {
        Execute(context, logger).Wait();
    }

    public static async Task Execute(IBrowserContext context, ILogger logger)
    {
        var page = context.Pages.First();

        // Example: Wait for a specific network request to complete
        var response = await page.WaitForResponseAsync(
            resp => resp.Url.Contains("/api/data/v9.2/accounts")
                   && resp.Status == 200
        );
        logger.LogInformation("API call completed: {Url}", response.Url);

        // Example: Verify a computed style
        var element = await page.QuerySelectorAsync(".status-badge");
        if (element != null)
        {
            var color = await element.EvaluateAsync<string>(
                "el => getComputedStyle(el).backgroundColor"
            );
            logger.LogInformation("Status badge color: {Color}", color);
        }

        // Example: Take a full-page screenshot
        await page.ScreenshotAsync(new PageScreenshotOptions
        {
            Path = "full-page.png",
            FullPage = true
        });
    }
}
```

### Calling from Test Steps

```yaml
testCases:
  - testCaseName: Advanced Validation
    testSteps: |
      = Select(Button_LoadData);
        Preview.PlaywrightScript("advanced-validation.csx");
        Screenshot("after_validation.png");
```

## Raw Playwright (Pro-Code) Pattern

When Test Engine doesn't support your scenario at all, write raw Playwright tests in TypeScript. This bypasses Test Engine entirely.

### When to Use Raw Playwright Instead of Test Engine

- Test Engine provider doesn't exist for your app type
- You need full programmatic control (network interception, multi-tab, downloads)
- Your team's testing expertise is TypeScript/Playwright, not Power Fx
- You're implementing Sean Astrakhan's AI-generated test pattern

### Basic Playwright Test for MDA Navigation

```typescript
// tests/mda-smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Model-Driven App Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to MDA (auth handled by storageState or login fixture)
    await page.goto(
      'https://contoso.crm.dynamics.com/main.aspx' +
      '?appid=00000000-0000-0000-0000-000000000000' +
      '&pagetype=entitylist&etn=account'
    );
    // Wait for grid to load
    await page.waitForSelector('[data-id="cell-0-1"]', { timeout: 30000 });
  });

  test('Account view loads with data', async ({ page }) => {
    const rows = await page.locator('[class*="ag-row"]').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('Can open account record', async ({ page }) => {
    await page.locator('[data-id="cell-0-1"]').click();
    await page.waitForSelector('[data-id="name"]', { timeout: 15000 });
    const nameField = page.locator('[data-id="name"]');
    await expect(nameField).toBeVisible();
  });

  test('Required fields are present on form', async ({ page }) => {
    await page.locator('[data-id="cell-0-1"]').click();
    await page.waitForSelector('[data-id="name"]');

    const requiredFields = ['name', 'telephone1', 'emailaddress1'];
    for (const field of requiredFields) {
      const fieldElement = page.locator(`[data-id="${field}"]`);
      await expect(fieldElement).toBeVisible();
    }
  });
});
```

### Running Raw Playwright Tests

```bash
# Install Playwright
npm init -y
npm install -D @playwright/test
npx playwright install chromium

# Run tests
npx playwright test tests/mda-smoke.spec.ts --reporter=list

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

### Auth Handling for Raw Playwright

Since raw Playwright doesn't have Test Engine's built-in auth, handle it manually:

```typescript
// auth.setup.ts — run once to capture auth state
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('https://contoso.crm.dynamics.com');
  // Manual login steps (or use service principal token)
  await page.fill('input[name="loginfmt"]', process.env.TEST_USER_EMAIL!);
  await page.click('input[type="submit"]');
  await page.fill('input[name="passwd"]', process.env.TEST_USER_PASSWORD!);
  await page.click('input[type="submit"]');
  // Save auth state for reuse
  await page.context().storageState({ path: '.auth/state.json' });
});
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'mda-tests',
      dependencies: ['setup'],
      use: { storageState: '.auth/state.json' },
    },
  ],
});
```

## Sean Astrakhan's AI-Generated Test Pattern

The full MCP-driven loop uses AI to generate Playwright tests from requirements:

```
1. ADO MCP → Read work item acceptance criteria
2. AI interprets criteria → generates Playwright TypeScript test file
3. npx playwright test → executes against MDA/Canvas
4. Test report generated (.html or .trx)
5. ADO MCP → Posts results summary to work item discussion
6. ADO MCP → Updates work item state:
   - All pass → mark Done
   - Any fail → mark Blocked + attach failure details
```

**Key insight (from Sean Astrakhan):** The AI doesn't just execute — it helps you *think* about what to test. The MCP-driven discovery phase explores the schema, understands the data model, and generates tests that cover business logic, not just UI clicks.

See [cicd-integration.md](cicd-integration.md) for pipeline YAML that runs these tests automatically.

## Best Practices

1. **Prefer app-level over DOM-level** — use `Select(Button1)` over `Preview.PlaywrightAction("//button", "click")` when both work
2. **Combine approaches in the same test** — use Power Fx for standard controls, Playwright for custom/embedded components
3. **Use `Preview.Pause()` for debugging** — opens Playwright Inspector to step through DOM interactions
4. **Review AI-generated tests** — AI produces good starting points but Power Fx nuances need human verification
5. **Keep Playwright selectors stable** — prefer `data-id` attributes over CSS classes (classes change on platform updates)

## Key References

- [Playwright Integration](https://learn.microsoft.com/power-platform/test-engine/playwright)
- [Preview Functions](https://learn.microsoft.com/power-platform/test-engine/powerfx-functions#preview-functions)
- [Extensibility](https://learn.microsoft.com/power-platform/test-engine/extensibility)
- [Test Engine GitHub](https://github.com/microsoft/PowerApps-TestEngine)
