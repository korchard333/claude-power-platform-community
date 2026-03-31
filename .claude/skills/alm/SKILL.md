---
name: alm
description: "Application Lifecycle Management for Power Platform. Use when: setting up CI/CD pipelines, GitHub Actions, solution deployment, environment variables, connection references, managed solutions, Power Platform Pipelines, pac solution sync, deployment settings."
---

# Skill: Application Lifecycle Management (ALM)

## When to Use
Trigger when designing deployment pipelines, managing solutions, promoting across environments, or setting up CI/CD for Power Platform.

---

## ALM Golden Rules

1. **Never import unmanaged solutions to Test or Production**
2. **Every environment needs a dedicated service principal** — no human accounts in pipelines
3. **Environment variables must be set per environment** — never hardcoded
4. **Connection references must be pre-created** before solution import
5. **Solution version must increment** on every build (major.minor.build.revision)
6. **Always run Solution Checker** before promoting to Test/Prod

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Developer Inner Loop](developer-inner-loop.md)** — Three development loops (Web API direct, pac code push, pac solution sync), when to use each, day-to-day workflows
- **[Git Integration](git-integration.md)** — Native Git integration in maker portal, deploy from Git (2026 wave 1), branch strategies for Power Platform, Azure DevOps Boards integration
- **[Azure DevOps Pipelines](ado-pipelines.md)** — ADO pipeline YAML templates, service connections, multi-stage deployment, variable groups

---

## Solution Lifecycle

```
Developer writes code / configures in Dev (unmanaged)
  ↓
Export solution from Dev → Unpack to source control
  ↓
CI pipeline: Pack → Solution Checker → Build managed artifact
  ↓
CD pipeline: Import managed solution to Test → Smoke test
  ↓
CD pipeline: Import managed solution to UAT → User acceptance
  ↓
CD pipeline: Import managed solution to Production → Go live
```

---

## Code Apps ALM

### Development Workflow
```bash
# Local development (no environment needed for initial dev)
npx degit microsoft/PowerAppsCodeApps/templates/starter my-app
cd my-app && npm install
npm run dev                    # http://localhost:5173

# Connect to Power Platform
pac code init --displayname "My App"
pac code add-data-source -a dataverse -t contact

# Deploy to Dev environment
npm run build
pac code push                                     # Preferred solution
pac code push --solutionName "ContosoCodeApp"     # Named solution
```

### Code Apps ALM Strategy
1. **Source control**: Standard Git workflow on the web app source code
2. **Solution packaging**: Use `pac code push` to deploy into a Dataverse solution
3. **Environment promotion**: Once in a solution, use Power Platform Pipelines or CI/CD
4. **No Solution Packager**: Code Apps cannot be decomposed like traditional components — manage via Git on the source, not on the solution XML

### CI/CD for Code Apps (GitHub Actions)
```yaml
name: Code App Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Install PAC CLI
        uses: microsoft/powerplatform-actions/actions-install@v1

      - name: Authenticate
        run: |
          pac auth create \
            --url ${{ secrets.DEV_ENV_URL }} \
            --applicationId ${{ secrets.CLIENT_ID }} \
            --clientSecret ${{ secrets.CLIENT_SECRET }} \
            --tenant ${{ secrets.TENANT_ID }}

      - name: Deploy Code App
        run: pac code push --solutionName ${{ vars.SOLUTION_NAME }}
```

---

## Traditional Solution ALM

### Branch Strategy
```
main              ← Production-ready, protected
  └── release/v1.x  ← Release candidate, deploys to Test → UAT → Prod
        └── feature/PP-123-description  ← Dev work, deploys to Dev env
```

### Solution Export & Unpack
```bash
# Export unmanaged from Dev
pac solution export --name MySolution --path ./out --managed false --overwrite true

# Unpack for source control
pac solution unpack \
  --zipfile ./out/MySolution.zip \
  --folder ./src/MySolution \
  --processCanvasApps true \
  --allowDelete true

# Commit to Git
git add src/MySolution/
git commit -m "chore: export MySolution from dev"
```

### Solution Pack & Import
```bash
# Pack managed solution from source
pac solution pack \
  --zipfile ./out/MySolution_managed.zip \
  --folder ./src/MySolution \
  --type Managed

# Import to target environment
pac solution import \
  --path ./out/MySolution_managed.zip \
  --async true \
  --activate-plugins true \
  --publish-changes true
```

---

## Environment Variables

### Definition (in solution XML)
```xml
<environmentvariabledefinition>
  <schemaname>contoso_ApiBaseUrl</schemaname>
  <displayname>API Base URL</displayname>
  <type>String</type>
  <!-- No defaultvalue in managed solution — set per environment -->
</environmentvariabledefinition>
```

### Setting per Environment
```bash
pac env update-settings \
  --environment $TARGET_ENV_URL \
  --setting contoso_ApiBaseUrl=https://api.contoso.com
```

### Accessing in Canvas App
```powerfx
Set(
    gblApiBaseUrl,
    LookUp(
        'Environment Variable Values',
        'Environment Variable Definition'.'Schema Name' = "contoso_ApiBaseUrl",
        Value
    )
);
```

---

## Connection References

**Purpose:** Abstract connections so solutions can be deployed across environments without breaking.

**Rules:**
- Every flow must use connection references (never direct connections)
- Connection references are pre-created in each target environment
- Use service principal connections in test/prod (not personal accounts)
- Document required connection references in deployment checklist

---

## Deployment Checklist

```markdown
## Deployment: [Solution] v[Version] → [Environment]

### Pre-Deploy
- [ ] Solution Checker: 0 critical, <5 high findings
- [ ] Version incremented from last deployment
- [ ] Environment variables documented for target environment
- [ ] Connection references pre-created in target environment
- [ ] Service principal has System Administrator in target environment
- [ ] Environment backup taken (for rollback)

### Deploy
- [ ] Import managed solution (async mode for large solutions)
- [ ] Monitor import job to completion
- [ ] Publish all customizations

### Post-Deploy
- [ ] Smoke test key user scenarios
- [ ] Verify flows are turned on (import can turn them off)
- [ ] Verify environment variable values are correct
- [ ] Confirm plugin steps are active
- [ ] Tag release: git tag v[version]-[environment]

### Rollback Plan
- [ ] Previous version of managed solution available as artifact
- [ ] Rollback: import previous version (managed upgrade)
- [ ] Verify rollback doesn't cause data loss (schema changes are one-way)
```

---

## GitHub Actions — Full CI/CD Pipeline

```yaml
name: Power Platform CI/CD

on:
  push:
    branches: [release/**]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: microsoft/powerplatform-actions/actions-install@v1

      - name: Pack Managed Solution
        uses: microsoft/powerplatform-actions/pack-solution@v1
        with:
          solution-folder: src/MySolution
          solution-file: out/MySolution_managed.zip
          solution-type: Managed

      - name: Solution Checker
        uses: microsoft/powerplatform-actions/check-solution@v1
        with:
          environment-url: ${{ secrets.DEV_ENV_URL }}
          app-id: ${{ secrets.CLIENT_ID }}
          client-secret: ${{ secrets.CLIENT_SECRET }}
          tenant-id: ${{ secrets.TENANT_ID }}
          path: out/MySolution_managed.zip

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: managed-solution
          path: out/MySolution_managed.zip

  deploy-test:
    needs: build
    runs-on: ubuntu-latest
    environment: test
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: managed-solution

      - uses: microsoft/powerplatform-actions/actions-install@v1

      - name: Import to Test
        uses: microsoft/powerplatform-actions/import-solution@v1
        with:
          environment-url: ${{ secrets.TEST_ENV_URL }}
          app-id: ${{ secrets.CLIENT_ID }}
          client-secret: ${{ secrets.CLIENT_SECRET }}
          tenant-id: ${{ secrets.TENANT_ID }}
          solution-file: MySolution_managed.zip
          force-overwrite: true
          publish-changes: true
          run-asynchronously: true
          activate-plugins: true

  deploy-prod:
    needs: deploy-test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: managed-solution

      - uses: microsoft/powerplatform-actions/actions-install@v1

      - name: Import to Production
        uses: microsoft/powerplatform-actions/import-solution@v1
        with:
          environment-url: ${{ secrets.PROD_ENV_URL }}
          app-id: ${{ secrets.CLIENT_ID }}
          client-secret: ${{ secrets.CLIENT_SECRET }}
          tenant-id: ${{ secrets.TENANT_ID }}
          solution-file: MySolution_managed.zip
          force-overwrite: true
          publish-changes: true
          run-asynchronously: true
          activate-plugins: true
```

---

## Power Platform Pipelines (First-Party ALM)

Power Platform Pipelines is Microsoft's in-product ALM solution — the strategic alternative to GitHub Actions for maker-led deployments.

### When to Use
| Scenario | Tool |
|---|---|
| Maker-led promotion (no DevOps skills required) | **Power Platform Pipelines** |
| Complex CI/CD with quality gates, tests, multi-repo | **GitHub Actions / Azure DevOps Pipelines** |
| Enterprise with existing GitHub practices | **GitHub Actions** |
| Enterprise with existing Azure DevOps practices | **Azure DevOps Pipelines** |
| Mixed teams (some GitHub, some ADO) | **Either** -- use whichever the team already knows; both support PAC CLI |
| Quick environment promotion for single solutions | **Power Platform Pipelines** |

Both GitHub Actions and Azure DevOps Pipelines use PAC CLI commands under the hood. The pipeline YAML syntax differs but the Power Platform operations are identical. See `ado-pipelines.md` for Azure DevOps templates.

### Key Features
- In-product: deploy directly from Power Apps / Power Automate Studio
- Service principal supported — no human accounts in pipelines
- **Service principal configurable per pipeline/stage** — different SPN for test vs prod
- Pre/post-deployment steps for business process validation
- **Delegated deployments** with approval workflows — makers submit, admins approve
- Centrally managed by admins via Power Platform Admin Center
- Automatically handles connection references and environment variables
- Included in Managed Environments (no extra licensing)
- **Cross-geo deployments** supported (when enabled in host)
- **Rollback capability**: redeploy previous solution versions from pipeline history
- **Solution backups** automatically stored for every deployment
- **Extensibility hooks** for custom pre/post-deployment logic
- Default import behavior: **Upgrade without Overwrite customizations**

> **IMPORTANT (Feb 2026):** Pipeline target environments must be **Managed Environments**. Starting February 2026, Managed Environments are auto-enabled on pipeline targets. Environments that are not Managed Environments cannot be used as deployment targets.

### Setup
```
1. Create a "host environment" (dedicated environment for pipeline management)
2. Install "Power Platform Pipelines" app in the host environment
3. Configure pipeline: Dev → Test → Production
4. Grant makers access to run the pipeline
5. Makers deploy from the app: Deploy → Select Solution → Run Pipeline
```

---

## Deployment Settings File

Automate connection reference and environment variable configuration during solution import (CI/CD pipelines).

### Generate the File
```bash
# Generate from an existing solution zip
pac solution create-settings \
  --solution-zip ./out/MySolution_managed.zip \
  --settings-file ./config/deployment-settings.json
```

### File Structure
```json
{
  "EnvironmentVariables": [
    {
      "SchemaName": "contoso_ApiBaseUrl",
      "Value": "https://api.contoso.com"
    },
    {
      "SchemaName": "contoso_FeatureFlag",
      "Value": "true"
    }
  ],
  "ConnectionReferences": [
    {
      "LogicalName": "contoso_SharedOutlook",
      "ConnectionId": "shared-outlook-connection-guid",
      "ConnectorId": "/providers/Microsoft.PowerApps/apis/shared_office365"
    }
  ]
}
```

### Using in GitHub Actions
```yaml
- name: Import to Test
  uses: microsoft/powerplatform-actions/import-solution@v1
  with:
    environment-url: ${{ secrets.TEST_ENV_URL }}
    app-id: ${{ secrets.CLIENT_ID }}
    client-secret: ${{ secrets.CLIENT_SECRET }}
    tenant-id: ${{ secrets.TENANT_ID }}
    solution-file: MySolution_managed.zip
    use-deployment-settings-file: true
    deployment-settings-file: ./config/deployment-settings-test.json
    force-overwrite: true
    publish-changes: true
    run-asynchronously: true
```

**Security note:** Never commit environment variable values with secrets to Git. Use per-environment settings files stored outside source control or populated at runtime via pipeline secrets.

---

## pac solution sync

Syncs the local solution project directory to the current state of the solution in your Dataverse environment. Useful for keeping source control in sync after in-environment changes.

```bash
# Sync local folder to current state of solution in connected environment
pac solution sync

# With options
pac solution sync \
  --async \                    # Export asynchronously
  --localize \                 # Extract/merge .resx string resources
  --packagetype Both           # Unmanaged + Managed
```

**Typical workflow:**
```bash
# Maker makes changes in Dev environment UI
# Developer syncs changes back to source control
pac solution sync
git add src/MySolution/
git commit -m "feat: add priority field to order table"
```

---

## Managed Environments

Managed Environments is a suite of premium governance capabilities included with Power Apps Premium, Power Automate Premium, Dynamics 365, and Copilot Studio licenses.

### Key Capabilities
| Capability | What It Does |
|---|---|
| IP Firewall | Restrict environment access to specific IP ranges |
| IP Cookie Binding | Prevent session token theft across IPs |
| Customer Managed Keys (CMK) | Encrypt data with your own Azure Key Vault keys |
| Lockbox | Require explicit approval for Microsoft engineer data access |
| Weekly Digest | Usage insights emailed to admins weekly |
| Limit Sharing | Control how broadly makers can share apps/flows |
| Solution Checker Enforcement | Block deployments that fail checker |
| Pipeline Integration | Managed Environments **required** for Power Platform Pipelines (auto-enabled Feb 2026) |
| Export to App Insights | Send telemetry to Azure Application Insights |
| Conditional Access per App | Apply Entra ID conditional access to individual apps |
| Virtual Network Support | Connect environment to your Azure VNet |

### Enable Managed Environments
```
Power Platform Admin Center → Environment → Edit → Enable Managed Environments
```

---

## Solution Layering & Conflict Resolution

Dataverse uses a layering system to resolve conflicts when multiple solutions modify the same component (e.g., two solutions both customize the Contact form).

### Layer Hierarchy (top wins)
```
Active customizations (unmanaged — dev environment only)
  ↑ overrides
Managed solution B (imported later)
  ↑ overrides
Managed solution A (imported first)
  ↑ overrides
System defaults (out-of-box)
```

### Common Conflict Scenarios
| Scenario | What Happens | Resolution |
|---|---|---|
| Two solutions modify same form | Top layer wins for merged properties | Solution segmentation — one solution owns each form |
| Solution removes a field another depends on | Import fails with dependency error | Check dependencies before removing components |
| Managed solution update changes column type | Import fails | Schema changes are one-way in managed solutions |
| Multiple teams editing same solution in Dev | Last export wins (overwrites others) | Use `pac solution sync` + Git branching |

### Diagnosing Active Layer Issues
```bash
# Check solution layers for a specific component
pac solution check --path ./out/MySolution_managed.zip

# In the Power Platform admin center:
# Environment → Solutions → Select component → See solution layers
# This shows which solution "owns" each property of a component
```

### Multi-Team Coordination
- **One solution per team** — avoid multiple teams editing the same solution
- **Layered solutions** — shared tables in base solution, team-specific apps in separate solutions
- Use `pac solution sync` before each export to detect environment drift
- Review solution XML diffs in Git before committing

---

## Anti-Patterns

- Importing unmanaged solutions to production
- Developers with System Administrator in test/prod
- Flows using personal connections (must use connection references)
- Skipping Solution Checker before environment promotion
- Missing `--processCanvasApps true` on solution unpack (binary .msapp in source control)
- Environment-specific GUIDs committed to solution XML
- No version increment between deployments
- No rollback plan documented
- Using Power Platform Pipelines AND GitHub Actions for the same solution (pick one)
- Storing secret environment variable values in deployment settings files committed to Git

---

## Related Skills

- `architecture` — Solution structure and environment topology decisions
- `code-apps` — Code Apps build and deploy workflow
- `plugins` — Plugin assembly deployment in managed solutions
