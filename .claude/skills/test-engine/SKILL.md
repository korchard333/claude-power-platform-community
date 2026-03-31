---
name: test-engine
description: "Power Apps Test Engine + Playwright. Use when: E2E testing of Canvas Apps, Model-Driven Apps, or Power Pages; automated UI verification; regression testing in CI/CD pipelines; visual QA of deployed solutions."
---

# Skill: Power Apps Test Engine + Playwright

## When to Use
Trigger when testing Power Platform apps end-to-end, writing automated test plans, setting up test pipelines, or verifying UI after deployment.

## Decision Matrix: Which Testing Approach?

| Approach | When | Language | Selectors | Auth |
|---|---|---|---|---|
| **Test Engine (Power Fx YAML)** | Standard Canvas/MDA testing, low-code teams | Power Fx in YAML | App-level control names | Built-in Entra handling |
| **Raw Playwright (TypeScript)** | Complex UI, custom controls, third-party components, visual QA | TypeScript or C# | CSS/XPath DOM selectors | Manual auth scripting |
| **Test Engine + Playwright hybrid** | Standard tests with occasional DOM access | Power Fx + Preview.PlaywrightAction() | Both | Built-in + direct |
| **Manual testing** | One-off verification, exploratory testing | N/A | N/A | N/A |

**Rule of thumb:** Start with Test Engine Power Fx for standard apps. Drop to raw Playwright only when Test Engine abstractions can't reach what you need (custom controls, third-party embedded UIs, visual regression).

## AI Accuracy Warning
LLMs are less accurate with Power Fx than mainstream languages (JavaScript, C#, Python) due to smaller training datasets. Always verify Power Fx test steps manually before trusting them in CI/CD. This applies to both test authoring and formula column definitions.

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Test Plans (YAML Format)](test-plans.md)** — YAML schema, Power Fx test steps, assertions, credentials, recording video
- **[Canvas App Testing](canvas-testing.md)** — Canvas provider, control name selectors, gallery navigation, delegation testing
- **[Model-Driven App Testing](mda-testing.md)** — MDA provider, form verification, view checks, BPF testing, Dataverse integration
- **[Playwright Advanced](playwright-advanced.md)** — Direct Playwright functions, custom C# scripts, raw TypeScript tests, Sean Astrakhan's AI-generated test pattern
- **[CI/CD Integration](cicd-integration.md)** — ADO pipeline YAML, GitHub Actions, publishing .trx results, regression testing on every deploy
- **[Power Pages Testing](portal-testing.md)** — Portal provider, auth testing, table permission verification, Web API testing

## Providers Overview

Test Engine uses a provider-based architecture. Each provider is optimized for a specific application type:

| Provider | Flag | Application Type | Key Capabilities |
|---|---|---|---|
| `canvas` | `--provider canvas` | Canvas Apps | Control-name selectors, gallery navigation, connector mocking |
| `mda` | `--provider mda` | Model-Driven Apps | Form interaction, view navigation, BPF testing |
| `powerfx` | `--provider powerfx` | Dataverse (no UI) | Direct Power Fx execution, backend logic testing |
| `portal` | `--provider portal` | Power Apps portal | Portal automation operations |

## Quick Start

```powershell
# 1. Install prerequisites
# PAC CLI: https://learn.microsoft.com/power-platform/developer/cli/introduction
# Azure CLI: https://learn.microsoft.com/cli/azure/install-azure-cli

# 2. Authenticate
az login --allow-no-subscriptions
pac auth create --name TestAuth --url "https://contoso.crm.dynamics.com"

# 3. Set test user credentials (env vars — never in YAML)
$env:user1Email = "testuser@contoso.onmicrosoft.com"

# 4. Run a canvas app test
pac test run `
  --provider canvas `
  --test-plan-file "tests/smoke-test.te.yaml" `
  --tenant "your-tenant-id" `
  --environment-id "your-env-id"

# 5. View results
# Output: .trx file + screenshots/videos in output directory
```

## Anti-Patterns
- Using raw Playwright when Test Engine control-name selectors would work (fragile DOM selectors break on platform updates)
- Storing credentials in test plan YAML files (use environment variables)
- Skipping test setup/teardown (test data left behind corrupts other tests)
- Running tests against production data without isolation
- Not recording video on CI/CD runs (impossible to debug failures without visual evidence)
- Trusting AI-generated Power Fx test steps without manual verification
- Using `headless: true` for initial test development (use `headless: false` to see what's happening)

## Key References

- [Test Engine Overview](https://learn.microsoft.com/power-platform/test-engine/overview)
- [YAML Format](https://learn.microsoft.com/power-platform/test-engine/yaml)
- [Playwright Integration](https://learn.microsoft.com/power-platform/test-engine/playwright)
- [ALM Integration](https://learn.microsoft.com/power-platform/test-engine/alm)
- [GitHub Repo](https://github.com/microsoft/PowerApps-TestEngine)
- [Power Fx Functions](https://learn.microsoft.com/power-platform/test-engine/powerfx-functions)
