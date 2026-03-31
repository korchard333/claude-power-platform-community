# Testing — Solution Checker & CI/CD Integration

## Solution Checker

Solution Checker is a static analysis tool that validates solutions against Microsoft best practices.

### Running Solution Checker
```bash
# CLI
pac solution check \
  --path ./out/MySolution_managed.zip \
  --geo Australia \                     # Nearest region
  --outputDirectory ./checker-results

# Results in SARIF format (importable into VS Code, GitHub)
```

### Severity Levels
| Level | Action Required |
|---|---|
| **Critical** | Must fix before deployment — blocks production |
| **High** | Should fix — likely to cause issues |
| **Medium** | Consider fixing — best practice violation |
| **Low** | Informational — suggestion |

### Common Findings
```
Web Resources:
  - web-use-strict: Missing "use strict" in JavaScript
  - web-avoid-window-top: Using window.top (security risk)
  - web-use-client-api: Using deprecated Xrm.Page instead of formContext

Plugins:
  - il-avoid-specialized-update: Using Update with all columns instead of targeted
  - il-use-autonumber: Manual auto-numbering when Dataverse auto-number column exists
  - il-specify-column: Querying all columns (ColumnSet(true))

Canvas Apps:
  - app-formula-issues-high: Non-delegable expressions on large data sources
  - app-formula-issues-medium: Performance warnings
```

### Suppressing Rules
```json
// solution-checker-suppress.json (per-solution)
{
  "suppressions": [
    {
      "ruleId": "web-use-strict",
      "justification": "Third-party library, cannot modify"
    }
  ]
}
```

---

## CI/CD Test Integration

### GitHub Actions with Tests
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run test -- --coverage        # Jest unit tests
      - run: npx playwright install --with-deps
      - run: npm run test:e2e                   # Playwright E2E

      - name: Solution Checker
        uses: microsoft/powerplatform-actions/check-solution@v1
        with:
          environment-url: ${{ secrets.DEV_ENV_URL }}
          app-id: ${{ secrets.CLIENT_ID }}
          client-secret: ${{ secrets.CLIENT_SECRET }}
          tenant-id: ${{ secrets.TENANT_ID }}
          path: out/MySolution_managed.zip

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
```
