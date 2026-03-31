# Power BI — CI/CD

## GitHub Actions Pipeline
```yaml
name: Power BI Deploy

on:
  push:
    branches: [main]
    paths: ['reports/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get Access Token
        id: auth
        run: |
          TOKEN=$(curl -s -X POST "https://login.microsoftonline.com/${{ secrets.TENANT_ID }}/oauth2/v2.0/token" \
            -d "grant_type=client_credentials" \
            -d "client_id=${{ secrets.PBI_CLIENT_ID }}" \
            -d "client_secret=${{ secrets.PBI_CLIENT_SECRET }}" \
            -d "scope=https://analysis.windows.net/powerbi/api/.default" \
            | jq -r '.access_token')
          echo "TOKEN=$TOKEN" >> $GITHUB_OUTPUT

      - name: Deploy to Pipeline
        run: |
          curl -X POST "https://api.powerbi.com/v1.0/myorg/pipelines/${{ vars.PIPELINE_ID }}/deployAll" \
            -H "Authorization: Bearer ${{ steps.auth.outputs.TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"sourceStageOrder": 0, "options": {"allowCreateArtifact": true, "allowOverwriteArtifact": true}}'
```
