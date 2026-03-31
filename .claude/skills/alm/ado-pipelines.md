# Azure DevOps Pipelines for Power Platform

Azure DevOps Pipelines provide enterprise-grade CI/CD for Power Platform solutions. The pipeline YAML syntax differs from GitHub Actions, but the underlying PAC CLI commands are identical.

> **Recommendation:** Use PAC CLI tasks (PowerShell/script tasks running `pac` commands) over the older Power Platform Build Tools extension. PAC CLI tasks are more current, cover the same capabilities, and align with the CLI you use locally.

---

## Prerequisites

### Service Principal Setup

Every pipeline needs a service principal (SPN) for non-interactive authentication. Never use personal accounts in pipelines.

```
1. Azure Portal --> App Registrations --> New Registration
   - Name: "PowerPlatform-Pipeline-SPN"
   - Supported account types: Single tenant
   - No redirect URI needed

2. Create a client secret
   - Certificates & Secrets --> New Client Secret
   - Set expiry to 12 months (rotate before expiry)
   - Copy the secret value immediately -- it won't be shown again

3. Record these values:
   - Application (client) ID
   - Directory (tenant) ID
   - Client secret value

4. Power Platform Admin Center --> Environments --> [target env] --> Settings
   --> Users + Permissions --> Application Users --> New App User
   - Select the app registration
   - Assign Business Unit
   - Assign Security Role: "System Administrator" (for pipeline operations)
     or a custom role with solution import + publish privileges

5. Repeat step 4 for EVERY target environment (Dev, Test, UAT, Prod)
```

### Azure DevOps Service Connection

```
1. ADO Project --> Project Settings --> Service Connections --> New
2. Select "Power Platform" (requires Power Platform Build Tools extension)
   OR use "Generic" and authenticate via PAC CLI in the pipeline
3. Enter: Server URL, Tenant ID, Application ID, Client Secret
4. Name the connection (e.g., "PowerPlatform-Dev", "PowerPlatform-Prod")
5. Grant access to all pipelines (or restrict per-pipeline)
```

**Alternative (recommended): Use PAC CLI auth directly in the pipeline** -- avoids dependency on the Build Tools extension for service connections. Store credentials in ADO variable groups.

---

## Variable Groups

Create one variable group per target environment. Store secrets securely.

```
ADO Project --> Pipelines --> Library --> Variable Groups

Variable Group: "PowerPlatform-Dev"
  - PP_ENVIRONMENT_URL = https://myorg-dev.crm.dynamics.com
  - PP_CLIENT_ID = <app-registration-client-id>
  - PP_TENANT_ID = <tenant-id>
  - PP_CLIENT_SECRET = <secret> (mark as secret)
  - PP_SOLUTION_NAME = MySolution

Variable Group: "PowerPlatform-Test"
  - PP_ENVIRONMENT_URL = https://myorg-test.crm.dynamics.com
  - (same pattern)

Variable Group: "PowerPlatform-Prod"
  - PP_ENVIRONMENT_URL = https://myorg-prod.crm.dynamics.com
  - (same pattern)
```

> For enhanced security, link secrets to Azure Key Vault instead of storing them directly in variable groups.

---

## Multi-Stage Pipeline Template

The standard pattern: export from Dev, run Solution Checker, import managed to each target environment with approval gates.

```yaml
trigger:
  branches:
    include:
      - release/*
  paths:
    include:
      - solutions/MySolution/**

pool:
  vmImage: 'windows-latest'

variables:
  - group: PowerPlatform-Dev

stages:
  # -------------------------------------------------------
  # Stage 1: Export from Dev + Solution Checker
  # -------------------------------------------------------
  - stage: Build
    displayName: 'Export & Validate'
    jobs:
      - job: ExportAndCheck
        displayName: 'Export solution and run checker'
        steps:
          - task: PowerPlatformToolInstaller@2
            displayName: 'Install Power Platform CLI'
            inputs:
              AddToolsToPath: true

          - script: |
              pac auth create \
                --environment $(PP_ENVIRONMENT_URL) \
                --tenant $(PP_TENANT_ID) \
                --applicationId $(PP_CLIENT_ID) \
                --clientSecret $(PP_CLIENT_SECRET)
            displayName: 'Authenticate to Dev'

          - script: |
              pac solution export \
                --name $(PP_SOLUTION_NAME) \
                --path $(Build.ArtifactStagingDirectory)/$(PP_SOLUTION_NAME).zip \
                --managed
            displayName: 'Export managed solution'

          - script: |
              pac solution check \
                --path $(Build.ArtifactStagingDirectory)/$(PP_SOLUTION_NAME).zip \
                --outputDirectory $(Build.ArtifactStagingDirectory)/checker-results
            displayName: 'Run Solution Checker'

          - task: PublishBuildArtifacts@1
            displayName: 'Publish solution artifact'
            inputs:
              PathtoPublish: '$(Build.ArtifactStagingDirectory)'
              ArtifactName: 'solution'
              publishLocation: 'Container'

  # -------------------------------------------------------
  # Stage 2: Import to Test
  # -------------------------------------------------------
  - stage: DeployTest
    displayName: 'Deploy to Test'
    dependsOn: Build
    variables:
      - group: PowerPlatform-Test
    jobs:
      - deployment: ImportToTest
        displayName: 'Import managed solution to Test'
        environment: 'PowerPlatform-Test'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: PowerPlatformToolInstaller@2
                  displayName: 'Install Power Platform CLI'
                  inputs:
                    AddToolsToPath: true

                - script: |
                    pac auth create \
                      --environment $(PP_ENVIRONMENT_URL) \
                      --tenant $(PP_TENANT_ID) \
                      --applicationId $(PP_CLIENT_ID) \
                      --clientSecret $(PP_CLIENT_SECRET)
                  displayName: 'Authenticate to Test'

                - script: |
                    pac solution import \
                      --path $(Pipeline.Workspace)/solution/$(PP_SOLUTION_NAME).zip \
                      --force-overwrite \
                      --publish-changes \
                      --activate-plugins
                  displayName: 'Import managed solution'

  # -------------------------------------------------------
  # Stage 3: Import to UAT (with approval gate)
  # -------------------------------------------------------
  - stage: DeployUAT
    displayName: 'Deploy to UAT'
    dependsOn: DeployTest
    variables:
      - group: PowerPlatform-UAT
    jobs:
      - deployment: ImportToUAT
        displayName: 'Import managed solution to UAT'
        environment: 'PowerPlatform-UAT'   # Configure approval gate on this environment
        strategy:
          runOnce:
            deploy:
              steps:
                - task: PowerPlatformToolInstaller@2
                  displayName: 'Install Power Platform CLI'
                  inputs:
                    AddToolsToPath: true

                - script: |
                    pac auth create \
                      --environment $(PP_ENVIRONMENT_URL) \
                      --tenant $(PP_TENANT_ID) \
                      --applicationId $(PP_CLIENT_ID) \
                      --clientSecret $(PP_CLIENT_SECRET)
                  displayName: 'Authenticate to UAT'

                - script: |
                    pac solution import \
                      --path $(Pipeline.Workspace)/solution/$(PP_SOLUTION_NAME).zip \
                      --force-overwrite \
                      --publish-changes \
                      --activate-plugins
                  displayName: 'Import managed solution'

  # -------------------------------------------------------
  # Stage 4: Import to Production (with approval gate)
  # -------------------------------------------------------
  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: DeployUAT
    variables:
      - group: PowerPlatform-Prod
    jobs:
      - deployment: ImportToProd
        displayName: 'Import managed solution to Prod'
        environment: 'PowerPlatform-Prod'   # MUST have approval gate
        strategy:
          runOnce:
            deploy:
              steps:
                - task: PowerPlatformToolInstaller@2
                  displayName: 'Install Power Platform CLI'
                  inputs:
                    AddToolsToPath: true

                - script: |
                    pac auth create \
                      --environment $(PP_ENVIRONMENT_URL) \
                      --tenant $(PP_TENANT_ID) \
                      --applicationId $(PP_CLIENT_ID) \
                      --clientSecret $(PP_CLIENT_SECRET)
                  displayName: 'Authenticate to Prod'

                - script: |
                    pac solution import \
                      --path $(Pipeline.Workspace)/solution/$(PP_SOLUTION_NAME).zip \
                      --force-overwrite \
                      --publish-changes \
                      --activate-plugins
                  displayName: 'Import managed solution'
```

### Approval Gates

Configure approval gates on ADO Environments (not pipeline YAML):

```
ADO Project --> Environments --> PowerPlatform-Prod --> Approvals and checks
  --> Add check --> Approvals
  --> Add approvers (e.g., Release Manager, Product Owner)
  --> Timeout: 72 hours
  --> Require all approvers (or minimum count)
```

UAT and Prod environments should always have approval gates. Test environment gates are optional but recommended for enterprise teams.

---

## Deployment Settings for Environment Variables and Connection References

When importing to a target environment, environment variables and connection references need environment-specific values.

```bash
# Generate a deployment settings file from your managed solution
pac solution create-settings \
  --solution-zip ./MySolution_managed.zip \
  --settings-file ./config/deployment-settings-test.json
```

Edit the generated JSON to set target-specific values. Store one settings file per environment in source control:

```
/config/
  deployment-settings-test.json
  deployment-settings-uat.json
  deployment-settings-prod.json
```

Add the settings file to the import command:

```yaml
- script: |
    pac solution import \
      --path $(Pipeline.Workspace)/solution/$(PP_SOLUTION_NAME).zip \
      --settings-file $(Build.SourcesDirectory)/config/deployment-settings-$(Environment).json \
      --force-overwrite \
      --publish-changes \
      --activate-plugins
  displayName: 'Import with deployment settings'
```

---

## Power Platform Build Tools Extension vs PAC CLI Tasks

| Factor | Build Tools Extension | PAC CLI Tasks (script steps) |
|---|---|---|
| Installation | Marketplace extension install required | PAC CLI installed via PowerPlatformToolInstaller task |
| Task syntax | Dedicated YAML tasks (`PowerPlatformExportSolution@2`, etc.) | `pac` commands in `script` or `PowerShell@2` steps |
| Currency | Updated less frequently | Updated with every PAC CLI release |
| Flexibility | Fixed task parameters | Full PAC CLI parameter access |
| Debugging | Limited error output | `--log-to-console` for full diagnostics |
| Recommendation | Legacy -- still works, but prefer PAC CLI | **Recommended** -- same capabilities, more current |

> Both approaches work. For new pipelines, use PAC CLI tasks. For existing pipelines using Build Tools, there is no urgency to migrate -- they remain supported.

---

## PR Validation Pipeline

Run Solution Checker on every pull request to catch issues before merge:

```yaml
trigger: none

pr:
  branches:
    include:
      - release/*
      - main
  paths:
    include:
      - solutions/MySolution/**

pool:
  vmImage: 'windows-latest'

variables:
  - group: PowerPlatform-Dev

steps:
  - task: PowerPlatformToolInstaller@2
    displayName: 'Install Power Platform CLI'
    inputs:
      AddToolsToPath: true

  - script: |
      pac auth create \
        --environment $(PP_ENVIRONMENT_URL) \
        --tenant $(PP_TENANT_ID) \
        --applicationId $(PP_CLIENT_ID) \
        --clientSecret $(PP_CLIENT_SECRET)
    displayName: 'Authenticate to Dev'

  - script: |
      pac solution export \
        --name $(PP_SOLUTION_NAME) \
        --path $(Build.ArtifactStagingDirectory)/$(PP_SOLUTION_NAME).zip \
        --managed
    displayName: 'Export solution'

  - script: |
      pac solution check \
        --path $(Build.ArtifactStagingDirectory)/$(PP_SOLUTION_NAME).zip \
        --outputDirectory $(Build.ArtifactStagingDirectory)/checker-results
    displayName: 'Run Solution Checker'

  - task: PublishTestResults@2
    displayName: 'Publish checker results'
    inputs:
      testResultsFormat: 'NUnit'
      testResultsFiles: '$(Build.ArtifactStagingDirectory)/checker-results/**/*.xml'
    condition: always()
```

Set this pipeline as a **build validation policy** on your target branches:

```
ADO Project --> Repos --> Branches --> [branch] --> Branch Policies
  --> Build Validation --> Add build policy
  --> Select the PR validation pipeline
  --> Trigger: Automatic
  --> Policy requirement: Required
```

---

## Anti-Patterns

- **Importing unmanaged solutions to non-Dev environments** -- Always import managed. Unmanaged solutions in Test/Prod create ungovernable customizations that cannot be cleanly removed.
- **Storing secrets in pipeline YAML** -- Use ADO variable groups (marked as secret) or Azure Key Vault linked variable groups. Never commit secrets to source control.
- **Skipping Solution Checker** -- Solution Checker catches performance issues, deprecated API usage, and accessibility violations before they reach production. Always run it.
- **Using personal accounts in service connections** -- Personal accounts have MFA, password rotation, and account lifecycle issues. Use service principals with client secrets or certificates.
- **No approval gate on Production** -- Every production deployment must require explicit human approval. Automate everything else, gate the final step.
- **Single pipeline for all environments without stages** -- Use multi-stage pipelines with environment-specific variable groups. A single flat pipeline cannot enforce approval gates or environment isolation.
- **Hardcoding environment URLs in YAML** -- Use variable groups. Hardcoded URLs break when environments are reprovisioned or renamed.

---

## Impact of Deploy from Git (Wave 1 2026)

> **Preview (Wave 1 2026):** Deploy from Git may simplify or replace the import stages in these pipeline templates.

Deploy from Git (see `git-integration.md`) allows the platform to pack and import solutions directly from a Git repository. When this reaches GA:
- The `pac solution pack` and `pac solution import` stages may become unnecessary for simple deployments
- Pipelines will still be needed for: Solution Checker, automated testing, approval gates, multi-solution orchestration, and environment variable configuration
- Consider a hybrid approach: deploy-from-Git for simple solutions, full CI/CD pipeline for complex orchestrated deployments

**Recommendation:** Continue using full CI/CD pipelines today. Evaluate deploy-from-Git for non-critical solutions as the preview matures.
