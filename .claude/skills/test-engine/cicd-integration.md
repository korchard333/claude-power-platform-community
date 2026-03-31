# CI/CD Integration

## Azure DevOps Pipeline

Complete ADO pipeline YAML for running Test Engine tests:

```yaml
trigger:
  - main

pool:
  vmImage: 'windows-latest'

variables:
  - group: PowerPlatformTestVariables
  # Required variables in the variable group:
  # ClientId — Service Principal App ID
  # ClientSecret — Service Principal Secret (mark as secret)
  # TenantId — Microsoft Entra Tenant ID
  # EnvironmentUrl — Power Platform Environment URL
  # EnvironmentId — Power Platform Environment ID

steps:
  # Download test plan from secure files
  - task: DownloadSecureFile@1
    name: testPlan
    displayName: 'Download Test Plan File'
    inputs:
      secureFile: 'testplan.te.yaml'

  # Install Power Platform CLI
  - task: PowerShell@2
    displayName: 'Install PAC CLI'
    inputs:
      targetType: 'inline'
      script: |
        $pacUrl = "https://aka.ms/PowerAppsCLI"
        $pacZip = "$env:TEMP\pac.zip"
        $pacDest = "$env:TEMP\pac"
        if (-not (Test-Path $pacDest)) {
            New-Item -ItemType Directory -Path $pacDest -Force | Out-Null
        }
        Invoke-WebRequest -Uri $pacUrl -OutFile $pacZip
        Expand-Archive -Path $pacZip -DestinationPath $pacDest -Force
        $env:PATH = "$pacDest;$env:PATH"
        echo "##vso[task.prependpath]$pacDest"
        pac help

  # Install Azure CLI and authenticate
  - task: PowerShell@2
    displayName: 'Azure CLI Auth'
    inputs:
      targetType: 'inline'
      script: |
        $azUrl = "https://aka.ms/installazurecliwindows"
        $azMsi = "$env:TEMP\AzureCLI.msi"
        Invoke-WebRequest -Uri $azUrl -OutFile $azMsi
        Start-Process msiexec.exe -Args "/i $azMsi /quiet /norestart" -Wait
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        az login --service-principal `
          -u "$(ClientId)" `
          -p "$(ClientSecret)" `
          --tenant "$(TenantId)" `
          --allow-no-subscriptions

  # Authenticate PAC CLI
  - task: PowerShell@2
    displayName: 'PAC CLI Auth'
    inputs:
      targetType: 'inline'
      script: |
        pac auth create --name TestEngineAuth `
          --url "$(EnvironmentUrl)" `
          --applicationId "$(ClientId)" `
          --clientSecret "$(ClientSecret)" `
          --tenant "$(TenantId)"
        pac auth select --name TestEngineAuth

  # Run Test Engine tests
  - task: PowerShell@2
    displayName: 'Run Test Engine'
    inputs:
      targetType: 'inline'
      script: |
        $outputDir = "$(Build.ArtifactStagingDirectory)\TestResults"
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        pac test run `
          --test-plan-file "$(testPlan.secureFilePath)" `
          --environment-id "$(EnvironmentId)" `
          --tenant "$(TenantId)" `
          --output-directory $outputDir
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Tests failed with exit code $LASTEXITCODE"
            exit $LASTEXITCODE
        }

  # Publish .trx test results
  - task: PublishTestResults@2
    displayName: 'Publish Test Results'
    inputs:
      testResultsFormat: 'VSTest'
      testResultsFiles: '$(Build.ArtifactStagingDirectory)\TestResults\*.trx'
      mergeTestResults: true
      testRunTitle: 'Power Apps Test Engine Results'
    condition: always()

  # Publish screenshots and videos as artifacts
  - task: PublishBuildArtifacts@1
    displayName: 'Publish Test Artifacts'
    inputs:
      PathtoPublish: '$(Build.ArtifactStagingDirectory)\TestResults'
      ArtifactName: 'TestArtifacts'
    condition: always()
```

## GitHub Actions Workflow

Equivalent workflow for GitHub runners:

```yaml
name: Test Engine Execution

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: windows-latest

    env:
      TENANT_ID: ${{ secrets.TENANT_ID }}
      CLIENT_ID: ${{ secrets.CLIENT_ID }}
      CLIENT_SECRET: ${{ secrets.CLIENT_SECRET }}
      ENVIRONMENT_URL: ${{ secrets.ENVIRONMENT_URL }}
      ENVIRONMENT_ID: ${{ secrets.ENVIRONMENT_ID }}

    steps:
      - uses: actions/checkout@v4

      - name: Install PAC CLI
        run: |
          $pacUrl = "https://aka.ms/PowerAppsCLI"
          $pacZip = "$env:TEMP\pac.zip"
          $pacDest = "$env:TEMP\pac"
          if (-not (Test-Path $pacDest)) {
              New-Item -ItemType Directory -Path $pacDest -Force | Out-Null
          }
          Invoke-WebRequest -Uri $pacUrl -OutFile $pacZip
          Expand-Archive -Path $pacZip -DestinationPath $pacDest -Force
          echo "$pacDest" >> $env:GITHUB_PATH
          pac help

      - name: Install Azure CLI
        run: |
          $ProgressPreference = 'SilentlyContinue'
          Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile AzureCLI.msi
          Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'
          Remove-Item AzureCLI.msi

      - name: Azure CLI Auth
        run: |
          az login --service-principal `
            -u "$env:CLIENT_ID" `
            -p "$env:CLIENT_SECRET" `
            --tenant "$env:TENANT_ID" `
            --allow-no-subscriptions

      - name: PAC CLI Auth
        run: |
          pac auth create --name TestEngineAuth `
            --url "$env:ENVIRONMENT_URL" `
            --applicationId "$env:CLIENT_ID" `
            --clientSecret "$env:CLIENT_SECRET" `
            --tenant "$env:TENANT_ID"
          pac auth select --name TestEngineAuth

      - name: Run Tests
        run: |
          $outputDir = "./TestResults"
          New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
          pac test run `
            --test-plan-file "./tests/testplan.te.yaml" `
            --environment-id "$env:ENVIRONMENT_ID" `
            --tenant "$env:TENANT_ID" `
            --output-directory $outputDir
          if ($LASTEXITCODE -ne 0) {
              Write-Error "Tests failed"
              exit $LASTEXITCODE
          }

      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: ./TestResults

      - name: Publish Test Results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: ./TestResults/**/*.trx
```

## Pipeline Reference Components

| Component | ADO Task | GitHub Equivalent | Purpose |
|---|---|---|---|
| .NET Setup | `UseDotNet@2` | `actions/setup-dotnet@v4` | Install .NET SDK (if building from source) |
| Secret Management | Variable groups | Repository secrets | Store tenant ID, client ID, client secret |
| Config Files | Secure files + `DownloadSecureFile@1` | Repository files or secrets | Store test plan YAML |
| Test Execution | `PowerShell@2` | Inline `run` step | Execute `pac test run` |
| Results Publishing | `PublishTestResults@2` | `EnricoMi/publish-unit-test-result-action` | Publish .trx to pipeline UI |
| Artifact Storage | `PublishBuildArtifacts@1` | `actions/upload-artifact@v4` | Store screenshots and videos |

## When to Run Tests in the Pipeline

| Pipeline Stage | Test Type | Trigger |
|---|---|---|
| **After solution import to test/UAT** | Smoke tests | Solution deployment completes |
| **On PR to main branch** | Regression tests | Pull request created/updated |
| **Before production deployment** | Full suite | Pre-deployment gate |
| **Post-production deployment** | Smoke verification | After production import |

### Gated Deployment Pattern

Use test results as a quality gate before promoting to production:

```yaml
# ADO multi-stage pipeline (simplified)
stages:
  - stage: DeployToTest
    jobs:
      - job: Import
        steps:
          - script: pac solution import --path solution.zip

  - stage: RunTests
    dependsOn: DeployToTest
    jobs:
      - job: TestEngine
        steps:
          - script: pac test run --provider canvas --test-plan-file tests/regression.te.yaml
          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'VSTest'
              testResultsFiles: '**/*.trx'

  - stage: DeployToProd
    dependsOn: RunTests
    condition: succeeded()   # Only deploy if tests pass
    jobs:
      - job: Import
        steps:
          - script: pac solution import --path solution.zip
```

## ADO MCP → Test Results Workflow

For teams using Azure DevOps MCP Server (Sean Astrakhan's pattern), automate the test-to-work-item feedback loop:

```
After tests run in pipeline:
1. Parse .trx file for pass/fail summary
2. ADO MCP → Post summary to work item discussion:
   "Test Engine Results: 12/14 passed, 2 failed. See artifacts for details."
3. If all pass → ADO MCP → Update work item state to 'Done'
4. If any fail → ADO MCP → Update work item state to 'Blocked'
   + Attach failure screenshots to work item
```

### Posting Results to ADO Work Item (PowerShell)

```powershell
# Parse .trx results and post to ADO (simplified)
$trxFile = Get-ChildItem -Path "TestResults" -Filter "*.trx" | Select-Object -First 1
[xml]$trx = Get-Content $trxFile.FullName

$total = $trx.TestRun.ResultSummary.Counters.total
$passed = $trx.TestRun.ResultSummary.Counters.passed
$failed = $trx.TestRun.ResultSummary.Counters.failed
$outcome = $trx.TestRun.ResultSummary.outcome

$summary = "Test Engine: $passed/$total passed ($outcome)"

# Post to ADO work item via REST API
$uri = "https://dev.azure.com/{org}/{project}/_apis/wit/workitems/{id}/comments?api-version=7.1-preview.4"
$body = @{ text = $summary } | ConvertTo-Json
Invoke-RestMethod -Uri $uri -Method Post -Body $body `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $env:SYSTEM_ACCESSTOKEN" }
```

## Power Platform Pipelines Integration

Test Engine also integrates with Power Platform's built-in deployment pipelines via Custom Host:

1. Create a Power Automate flow triggered by pipeline deployment events
2. The flow calls `pac test run` via an Azure DevOps connector or custom action
3. Test results feed back into the pipeline approval process
4. Failed tests block the deployment from advancing to the next stage

See the [ALM integration docs](https://learn.microsoft.com/power-platform/test-engine/alm) for the full pattern.

## Test Plan Organization

### Recommended Folder Structure

```
tests/
├── smoke/
│   ├── canvas-smoke.te.yaml        # Quick canvas app verification
│   └── mda-smoke.te.yaml           # Quick MDA verification
├── regression/
│   ├── expense-crud.te.yaml        # Full CRUD test suite
│   ├── approval-workflow.te.yaml   # End-to-end approval flow
│   └── role-access.te.yaml         # Security role verification
├── mocks/
│   ├── weather-response.json       # Mock connector responses
│   └── graph-me.json
└── playwright/                     # Raw Playwright tests (if used)
    ├── mda-advanced.spec.ts
    └── playwright.config.ts
```

### Naming Convention

- Test plan files: `{feature}-{type}.te.yaml` (e.g., `expense-smoke.te.yaml`)
- Mock files: `{connector}-response.json`
- Screenshots: `{step-description}.png`

## Key References

- [ALM Integration](https://learn.microsoft.com/power-platform/test-engine/alm)
- [Pipeline YAML Examples](https://learn.microsoft.com/power-platform/test-engine/alm#integration-options)
- [PublishTestResults Task](https://learn.microsoft.com/azure/devops/pipelines/tasks/reference/publish-test-results-v2)
- [Custom Pipeline Host](https://learn.microsoft.com/power-platform/alm/custom-host-pipelines)
