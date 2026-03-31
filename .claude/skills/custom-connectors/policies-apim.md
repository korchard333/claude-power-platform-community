# Custom Connectors — Policies, APIM & Operations

## Connector Policies (apiProperties.json)

Policies transform requests/responses without modifying the API.

### Set Header Policy
```json
{
  "properties": {
    "policyTemplateInstances": [
      {
        "templateId": "setheader",
        "title": "Set Content-Type",
        "parameters": {
          "x-ms-apimTemplateParameter.name": "Content-Type",
          "x-ms-apimTemplateParameter.value": "application/json",
          "x-ms-apimTemplateParameter.existsAction": "override",
          "x-ms-apimTemplate-policySection": "Request"
        }
      }
    ]
  }
}
```

### URL Rewrite / Route Request Policy
```json
{
  "templateId": "routerequesttoendpoint",
  "title": "Route to environment",
  "parameters": {
    "x-ms-apimTemplateParameter.newPath": "/api/v2/@connectionParameters('environment')",
    "x-ms-apimTemplate-policySection": "Request"
  }
}
```

### Convert Array to Object Policy
Useful when API returns an array but Power Automate expects an object with a `value` array.

---

## CLI Workflow

```bash
# Download existing connector from environment
pac connector download \
  --connector-id connector-guid \
  --outputDirectory ./custom-connectors/contoso-erp

# Create/update connector from local definition
pac connector create \
  --api-definition-file ./apiDefinition.swagger.json \
  --api-properties-file ./apiProperties.json \
  --icon-file ./icon.png \
  --solution-name ContosoIntegration

# Update existing connector
pac connector update \
  --connector-id connector-guid \
  --api-definition-file ./apiDefinition.swagger.json

# List connectors in environment
pac connector list
```

---

## Azure API Management (APIM) Integration

For production custom connectors, front your API with Azure APIM:

### Benefits
```
Rate limiting  → Protect backend from overload
Caching        → Reduce API calls for read-heavy connectors
Monitoring     → Track usage, errors, latency via Application Insights
Versioning     → Multiple API versions behind single connector
Auth gateway   → Centralized OAuth, certificate, subscription key management
IP filtering   → Restrict to Power Platform outbound IPs only
```

### Export APIM API as Custom Connector
```
Azure Portal → API Management → API → Export → Power Platform
This generates the OpenAPI + auth config and creates the connector automatically.
```

---

## DLP Policy Considerations

Custom connectors are classified as **Non-Business** (blockable) by default. This means:
- They cannot be used alongside Business connectors (Dataverse, SharePoint) unless reclassified
- Admin must explicitly move custom connectors to the **Business** group in DLP policy
- Each custom connector must be classified individually (no wildcard)

### Classification
```
Power Platform Admin Center → DLP Policies → [Policy] → Custom Connectors
→ Move connector from Non-Business → Business
```

---

## Solution-Aware Custom Connectors

Custom connectors can be included in solutions for ALM:
```
Solution → Add existing → Custom connector → Select connector
Export/import as part of managed solution
Connection references still required per environment
```

---

## Testing

### Test in Maker Portal
```
Custom connector → Test tab → Create connection → Enter credentials
→ Select action → Fill parameters → Run
```

### Test via Postman/HTTP
```bash
# Test the underlying API directly
curl -X GET "https://api.contoso.com/v2/orders?status=active&\$top=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json"
```

### Validate OpenAPI Definition
```bash
# Use Swagger CLI to validate
npx @apidevtools/swagger-cli validate ./apiDefinition.swagger.json
```

---

## Best Practices

- Always use `x-ms-summary` on every parameter and property (maker-friendly display names)
- Always set `x-ms-visibility: "internal"` for technical parameters users shouldn't see
- Always define response schemas (Power Automate needs them for dynamic content)
- Use `x-ms-dynamic-values` for dropdown parameters (don't force users to type GUIDs)
- Test with both Power Automate and Canvas App (behaviour can differ)
- Version your connector: `host` + `basePath` should include version (e.g., `/v2/`)
- Icon must be exactly 160x160px PNG with brand colour background

---

## Runtime Limits

| Limit | Value |
|---|---|
| Custom connectors per user | 50 |
| Requests per minute per connection | 500 |

> **Note:** The Connector Certification Portal was deprecated in January 2025. Connector certification is migrating to Data Factory.
