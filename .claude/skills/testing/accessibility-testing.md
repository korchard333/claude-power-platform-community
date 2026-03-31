# Testing — Accessibility Testing, Test Data & Deployment Validation

## Accessibility Testing

### Automated Testing (Code Apps)
```bash
# axe-core integration with Playwright
npm install -D @axe-core/playwright

# In Playwright test:
import AxeBuilder from "@axe-core/playwright";

test("page has no a11y violations", async ({ page }) => {
  await page.goto("/contacts");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### Manual Testing Checklist
```markdown
- [ ] Tab through all interactive elements — logical order, nothing skipped
- [ ] Screen reader test (NVDA/JAWS): all content announced correctly
- [ ] Zoom to 200% — no horizontal scroll, content reflows
- [ ] Test at 320px viewport — no content loss
- [ ] High contrast mode — all content visible
- [ ] Keyboard-only: can complete all workflows without mouse
- [ ] Focus indicators visible on all interactive elements
- [ ] Error messages announced to screen readers (aria-live)
```

### Canvas App Accessibility
```
Power Apps Studio → App Checker → Accessibility
→ Reports missing labels, contrast issues, tab order problems
→ Fix all errors before publishing
```

---

## Test Data Management

### Strategy
```
Dev environment:   Live data (subset, anonymised for PII)
Test environment:  Dedicated test dataset (reset between test runs)
UAT environment:   Copy of production data (anonymised)

Test data lifecycle:
  1. Before test run: Reset data to known state
  2. Run tests
  3. After test run: Clean up created records
  4. Never: Use production data in dev/test environments
```

### Resetting Test Data
```bash
# Use PAC CLI to import reference data
pac data import \
  --data ./test-data/test-contacts.csv \
  --entity contact \
  --map ./test-data/import-map.json
```

---

## Deployment Validation (Smoke Tests)

After every deployment, run these checks:

```markdown
## Post-Deployment Smoke Test: [Solution] v[Version]

### Apps
- [ ] Code App loads without JavaScript errors (check browser console)
- [ ] Canvas App launches and data populates
- [ ] Model-Driven App opens, forms load, views display data

### Flows
- [ ] All solution flows are turned ON (import can deactivate them)
- [ ] Trigger a test flow run → completes successfully
- [ ] Connection references are connected (not in error state)

### Plugins
- [ ] Plugin steps are active
- [ ] Trigger a create/update → plugin executes (check trace logs)
- [ ] No "Plugin Trace Log" errors in last 30 minutes

### Data
- [ ] Environment variables have correct values for this environment
- [ ] Lookup data / reference data is present

### Security
- [ ] Test login as each role → correct access levels
- [ ] Restricted fields show "****" for non-authorised users
```
