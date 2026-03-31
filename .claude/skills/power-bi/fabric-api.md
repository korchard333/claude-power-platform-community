# Power BI — Fabric REST API

## Authentication
```bash
TOKEN=$(curl -s -X POST "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "scope=https://analysis.windows.net/powerbi/api/.default" \
  | jq -r '.access_token')
```

## Workspace Management
```http
# List workspaces
GET https://api.powerbi.com/v1.0/myorg/groups
Authorization: Bearer {token}

# Create workspace
POST https://api.powerbi.com/v1.0/myorg/groups
Content-Type: application/json

{ "name": "Contoso Sales Reports" }

# Add user to workspace
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/users
Content-Type: application/json

{
  "emailAddress": "user@contoso.com",
  "groupUserAccessRight": "Member"
}
```

## Dataset / Semantic Model Operations
```http
# List datasets in workspace
GET https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets

# Refresh dataset
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets/{datasetId}/refreshes
Content-Type: application/json

{ "notifyOption": "MailOnFailure" }

# Get refresh history
GET https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets/{datasetId}/refreshes?$top=10

# Execute DAX query
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets/{datasetId}/executeQueries
Content-Type: application/json

{
  "queries": [
    {
      "query": "EVALUATE TOPN(10, SUMMARIZECOLUMNS(Product[Category], \"Sales\", [Total Sales]), [Sales], DESC)"
    }
  ],
  "serializerSettings": { "includeNulls": true }
}

# Take over dataset (change owner)
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets/{datasetId}/Default.TakeOver

# Update parameters
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/datasets/{datasetId}/Default.UpdateParameters
Content-Type: application/json

{
  "updateDetails": [
    { "name": "ServerName", "newValue": "prod-server.database.windows.net" },
    { "name": "DatabaseName", "newValue": "SalesDB_Prod" }
  ]
}
```

## Report Operations
```http
# List reports in workspace
GET https://api.powerbi.com/v1.0/myorg/groups/{groupId}/reports

# Clone report
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/reports/{reportId}/Clone
Content-Type: application/json

{
  "name": "Sales Report - Copy",
  "targetWorkspaceId": "{targetGroupId}"
}

# Export report to file (PDF, PNG, PPTX)
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/reports/{reportId}/ExportTo
Content-Type: application/json

{
  "format": "PDF",
  "powerBIReportConfiguration": {
    "pages": [{ "pageName": "SalesOverview" }],
    "defaultBookmark": { "name": "CurrentMonth" }
  }
}

# Rebind report to different dataset
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/reports/{reportId}/Rebind
Content-Type: application/json

{ "datasetId": "{newDatasetId}" }
```

## Deployment Pipeline
```http
# List pipelines
GET https://api.powerbi.com/v1.0/myorg/pipelines

# Deploy to next stage
POST https://api.powerbi.com/v1.0/myorg/pipelines/{pipelineId}/deployAll
Content-Type: application/json

{
  "sourceStageOrder": 0,
  "options": {
    "allowCreateArtifact": true,
    "allowOverwriteArtifact": true,
    "allowOverwriteTargetArtifactLabel": true,
    "allowPurgeData": false,
    "allowTakeOver": true
  },
  "note": "Deploying v2.1 - added regional breakdown"
}
```
