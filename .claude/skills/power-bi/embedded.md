# Power BI — Embedded (for Code Apps / Web)

## Embed Token Generation
```http
POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/reports/{reportId}/GenerateToken
Content-Type: application/json
Authorization: Bearer {token}

{
  "accessLevel": "View",
  "identities": [
    {
      "username": "user@contoso.com",
      "roles": ["RegionManager"],
      "datasets": ["{datasetId}"]
    }
  ]
}
```

## Embed in Code App (React)
```tsx
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';

export function ReportEmbed({ embedToken, embedUrl, reportId }: Props) {
  return (
    <PowerBIEmbed
      embedConfig={{
        type: 'report',
        id: reportId,
        embedUrl: embedUrl,
        accessToken: embedToken,
        tokenType: models.TokenType.Embed,
        settings: {
          panes: {
            filters: { expanded: false, visible: false },
            pageNavigation: { visible: true }
          },
          background: models.BackgroundType.Transparent,
        }
      }}
      cssClassName="powerbi-embed-container"
    />
  );
}
```
