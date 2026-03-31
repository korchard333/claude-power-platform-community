# Custom Connectors — Authentication

## API Key
```json
{
  "securityDefinitions": {
    "api_key": {
      "type": "apiKey",
      "in": "header",
      "name": "X-API-Key"
    }
  },
  "security": [{ "api_key": [] }]
}
```

---

## OAuth 2.0 (Authorization Code)
```json
{
  "securityDefinitions": {
    "oauth2": {
      "type": "oauth2",
      "flow": "accessCode",
      "authorizationUrl": "https://auth.contoso.com/authorize",
      "tokenUrl": "https://auth.contoso.com/token",
      "scopes": {
        "read": "Read access",
        "write": "Write access"
      }
    }
  }
}
```

---

## OAuth 2.0 with Azure AD / Entra ID
```json
{
  "securityDefinitions": {
    "aad_oauth": {
      "type": "oauth2",
      "flow": "accessCode",
      "authorizationUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      "tokenUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      "scopes": {
        "https://api.contoso.com/.default": "API access"
      }
    }
  }
}
```

---

## Authentication in apiProperties.json
```json
{
  "properties": {
    "connectionParameters": {
      "token": {
        "type": "oauthSetting",
        "oAuthSettings": {
          "identityProvider": "aad",
          "clientId": "app-registration-client-id",
          "scopes": ["https://api.contoso.com/.default"],
          "redirectMode": "Global",
          "redirectUrl": "https://global.consent.azure-apim.net/redirect",
          "properties": {
            "IsFirstParty": "False",
            "AzureActiveDirectoryResourceId": "https://api.contoso.com"
          },
          "customParameters": {
            "tenantId": {
              "value": "common"
            }
          }
        }
      }
    }
  }
}
```
