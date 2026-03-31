# Power Pages Testing

## Portal Provider Overview

Test Engine includes a `portal` provider (`--provider portal`). Based on current MS docs, this provider is designed for automating operations in Power Apps portals. Power Pages testing support is still evolving — for scenarios not covered by the portal provider, fall back to raw Playwright.

```powershell
# Portal provider (if your scenario is supported)
pac test run `
  --provider portal `
  --test-plan-file "tests/portal-test.te.yaml" `
  --tenant "your-tenant-id" `
  --environment-id "your-env-id" `
  --domain "https://contoso.powerappsportals.com"
```

### Current Limitations

- The portal provider's capabilities are more limited than the Canvas and MDA providers
- Many Power Pages testing scenarios require Preview functions or raw Playwright
- Power Pages Code Sites (React/Vue/Astro SPAs) are standard web apps — test them with raw Playwright

## Authentication Testing

Power Pages supports multiple auth providers. Test each flow:

### Anonymous vs Authenticated Access

```yaml
testSuite:
  testSuiteName: Anonymous Access Tests
  persona: AnonymousUser
  testCases:
    - testCaseName: Public Page Loads
      testSteps: |
        = Preview.PlaywrightAction("//h1[contains(text(), 'Welcome')]", "wait");
          Screenshot("public_page.png");

    - testCaseName: Protected Page Redirects to Login
      testSteps: |
        = // Navigate to a protected page
          Preview.PlaywrightAction(
            "//a[contains(@href, '/account-dashboard/')]",
            "click"
          );
          // Should redirect to login
          Preview.PlaywrightAction(
            "//form[contains(@action, 'login')]",
            "wait"
          );
          Screenshot("redirected_to_login.png");
```

### Login/Logout Flow

```yaml
testSuite:
  testSuiteName: Auth Flow Tests
  persona: PortalUser1
  testCases:
    - testCaseName: Login With Local Account
      testSteps: |
        = // Fill login form
          Preview.PlaywrightActionValue(
            "//input[@id='Username']",
            "fill",
            "testuser@contoso.com"
          );
          Preview.PlaywrightActionValue(
            "//input[@id='Password']",
            "fill",
            "TestPassword123!"
          );
          Preview.PlaywrightAction("//button[@type='submit']", "click");
          // Verify authenticated state
          Preview.PlaywrightAction(
            "//a[contains(text(), 'Sign Out')]",
            "wait"
          );
          Screenshot("logged_in.png");

    - testCaseName: Logout
      testSteps: |
        = Preview.PlaywrightAction(
            "//a[contains(text(), 'Sign Out')]",
            "click"
          );
          Preview.PlaywrightAction(
            "//form[contains(@action, 'login')]",
            "wait"
          );
          Screenshot("logged_out.png");
```

## Table Permission Testing

Verify that web roles correctly restrict data access:

### Role-Based Record Visibility

```yaml
testSuite:
  testSuiteName: Table Permission Tests - Standard User
  persona: StandardUser
  testCases:
    - testCaseName: Can View Own Records Only
      testSteps: |
        = // Navigate to entity list
          Preview.PlaywrightAction("//a[contains(@href, '/my-cases/')]", "click");
          Preview.PlaywrightAction("//table[contains(@class, 'entity-grid')]", "wait");
          // Verify records are visible
          Preview.PlaywrightAction(
            "//table[contains(@class, 'entity-grid')]//tr[contains(@class, 'entity-grid-row')]",
            "exists"
          );
          Screenshot("own_records_visible.png");

    - testCaseName: Cannot Access Other Users Records
      testSteps: |
        = // Try to access a record owned by another user via direct URL
          Preview.PlaywrightAction(
            "//div[contains(@class, 'access-denied')] | //div[contains(@class, 'error')]",
            "wait"
          );
          Screenshot("access_denied.png");
```

### Admin vs Standard User Comparison

Run separate test suites for each web role and compare what's visible:

```yaml
# admin-permissions.te.yaml
testSuite:
  testSuiteName: Admin Permission Tests
  persona: AdminUser
  testCases:
    - testCaseName: Admin Sees All Records
      testSteps: |
        = Preview.PlaywrightAction("//a[contains(@href, '/all-cases/')]", "click");
          Preview.PlaywrightAction("//table[contains(@class, 'entity-grid')]", "wait");
          // Admin should see more records than standard user
          Screenshot("admin_all_records.png");

    - testCaseName: Admin Can Edit Records
      testSteps: |
        = Preview.PlaywrightAction(
            "//table//tr[contains(@class, 'entity-grid-row')][1]//a",
            "click"
          );
          // Edit button should be visible for admin
          Preview.PlaywrightAction("//button[contains(text(), 'Edit')]", "exists");
          Screenshot("admin_can_edit.png");
```

## Web API Testing

Verify client-side Dataverse Web API calls return correct data:

### Entity List Data Loading

```yaml
testCases:
  - testCaseName: Entity List Loads Data via Web API
    testSteps: |
      = // Navigate to a page with an entity list
        Preview.PlaywrightAction("//a[contains(@href, '/contacts/')]", "click");
        // Wait for data grid to populate
        Preview.PlaywrightAction(
          "//table[contains(@class, 'entity-grid')]//tr[contains(@class, 'entity-grid-row')]",
          "wait"
        );
        // Verify at least one row exists
        Preview.PlaywrightAction(
          "//table[contains(@class, 'entity-grid')]//tr[contains(@class, 'entity-grid-row')]",
          "exists"
        );
        Screenshot("entity_list_loaded.png");
```

### Entity Form Submission

```yaml
testCases:
  - testCaseName: Submit Entity Form
    testSteps: |
      = // Navigate to form page
        Preview.PlaywrightAction("//a[contains(@href, '/submit-request/')]", "click");
        Preview.PlaywrightAction("//form[contains(@class, 'entity-form')]", "wait");
        // Fill form fields
        Preview.PlaywrightActionValue(
          "//input[@id='Title']",
          "fill",
          "Test Request from UAT"
        );
        Preview.PlaywrightActionValue(
          "//textarea[@id='Description']",
          "fill",
          "Automated test submission"
        );
        // Submit
        Preview.PlaywrightAction("//button[@type='submit']", "click");
        // Verify success message
        Preview.PlaywrightAction(
          "//div[contains(@class, 'success')] | //div[contains(text(), 'submitted')]",
          "wait"
        );
        Screenshot("form_submitted.png");
```

## Code Sites (SPA) Testing

Power Pages Code Sites deploy React, Vue, or Astro SPAs. These are standard web apps — test them with raw Playwright or Test Engine Preview functions.

### Raw Playwright for SPA Testing

```typescript
// tests/code-site.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Power Pages Code Site', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://contoso.powerappsportals.com');
    await page.waitForLoadState('networkidle');
  });

  test('SPA renders main content', async ({ page }) => {
    // React/Vue app hydrates after initial load
    await page.waitForSelector('[data-testid="app-root"]');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('Client-side routing works', async ({ page }) => {
    await page.click('a[href="/dashboard"]');
    // SPA route change — no full page reload
    await page.waitForSelector('[data-testid="dashboard"]');
    expect(page.url()).toContain('/dashboard');
  });

  test('Dataverse Web API call succeeds', async ({ page }) => {
    // Intercept Web API request
    const apiResponse = page.waitForResponse(
      resp => resp.url().includes('/_api/contacts') && resp.status() === 200
    );
    await page.click('[data-testid="load-contacts"]');
    const response = await apiResponse;
    expect(response.status()).toBe(200);
  });
});
```

### Test Engine with Preview Functions for SPA

```yaml
testSettings:
  extensionModules:
    enable: true
    allowPowerFxNamespaces:
      - Preview

testSuite:
  testSuiteName: Code Site Tests
  persona: User1
  testCases:
    - testCaseName: SPA Renders
      testSteps: |
        = Preview.PlaywrightAction("[data-testid='app-root']", "wait");
          Screenshot("spa_loaded.png");

    - testCaseName: Navigation Works
      testSteps: |
        = Preview.PlaywrightAction("//a[@href='/dashboard']", "click");
          Preview.PlaywrightAction("[data-testid='dashboard']", "wait");
          Screenshot("dashboard_loaded.png");
```

## Power Pages Testing Strategy

| Scenario | Approach | Provider |
|---|---|---|
| Basic entity list/form testing | Test Engine + Preview functions | `portal` or `canvas` with `--domain` |
| Auth flow testing | Test Engine + Preview functions | `portal` |
| Table permission verification | Separate test suites per web role | `portal` |
| Code Site (SPA) testing | Raw Playwright or Preview functions | N/A (raw Playwright) or `portal` |
| Visual regression | Raw Playwright with screenshot comparison | N/A (raw Playwright) |
| Performance/load testing | Not covered by Test Engine | Use separate tooling (k6, Artillery) |

## Tips and Gotchas

- **Power Pages caching**: Pages may serve cached content — add cache-busting query parameters or clear cache before tests
- **Liquid rendering**: Server-rendered Liquid templates load differently from client-side JS — wait for `DOMContentLoaded` not `networkidle`
- **Multiple domains**: Power Pages can have custom domains — ensure test URLs match the actual domain
- **Bot protection**: Some Power Pages sites enable bot protection (CAPTCHA) — disable for test environments
- **Session management**: Power Pages sessions expire — test long flows with fresh auth state

## Key References

- [Test Engine Providers](https://learn.microsoft.com/power-platform/test-engine/providers)
- [Power Pages Overview](https://learn.microsoft.com/power-pages/introduction)
- [Playwright Docs](https://playwright.dev/docs/intro)
