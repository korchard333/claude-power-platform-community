# Error Handling, Patterns & SDK Options

## Common Patterns for Scripts & Automation

### Bulk Create (Sequential with Error Collection)
```bash
#!/bin/bash
ERRORS=()
while IFS=',' read -r name email phone; do
  RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/response.json \
    -X POST "${BASE_URL}/api/data/v9.2/contacts" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"firstname\":\"${name}\",\"emailaddress1\":\"${email}\",\"telephone1\":\"${phone}\"}")

  if [ "$RESPONSE" != "204" ] && [ "$RESPONSE" != "201" ]; then
    ERRORS+=("Failed: ${name} - HTTP ${RESPONSE}")
  fi
done < contacts.csv

if [ ${#ERRORS[@]} -gt 0 ]; then
  printf '%s\n' "${ERRORS[@]}"
fi
```

### Environment Variable Access
```http
# Get environment variable value
GET /api/data/v9.2/environmentvariablevalues
  ?$select=value
  &$filter=EnvironmentVariableDefinitionId/schemaname eq 'contoso_ApiBaseUrl'
  &$expand=EnvironmentVariableDefinitionId($select=schemaname,defaultvalue)
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "0x80040217",
    "message": "A record with matching key values already exists.",
    "@Microsoft.PowerApps.CDS.ErrorDetails.ApiExceptionSourceKey": "Plugin/contoso_project",
    "@Microsoft.PowerApps.CDS.ErrorDetails.ApiStepKey": "guid",
    "@Microsoft.PowerApps.CDS.ErrorDetails.ApiDepthKey": "1",
    "@Microsoft.PowerApps.CDS.HelpLink": "http://go.microsoft.com/fwlink/?LinkID=398563&error=..."
  }
}
```

### Common Error Codes
| Code | Meaning | Resolution |
|---|---|---|
| `0x80040217` | Duplicate record | Check alternate keys, use upsert |
| `0x80040220` | Privilege denied | Check security role |
| `0x80048306` | Plugin exception | Check plugin trace logs |
| `0x80060891` | Dependency exists | Remove dependent components first |
| `0x8004431a` | Rate limit exceeded | Implement retry with exponential backoff |
| `0x80040237` | Record not found | Verify GUID, check statecode |
| `0x80060892` | Missing dependency | Import required solution first |
| `429` | API throttling | Retry-After header, exponential backoff |

### Retry Pattern
```bash
retry_request() {
  local max_retries=5 retry=0
  while [ $retry -lt $max_retries ]; do
    HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/response.json "$@")
    if [ "$HTTP_CODE" = "429" ]; then
      RETRY_AFTER=$(grep -i 'retry-after' /tmp/response_headers.txt | awk '{print $2}')
      sleep "${RETRY_AFTER:-$((2 ** retry))}"
      retry=$((retry + 1))
    elif [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
      return 0
    else
      return 1
    fi
  done
  return 1
}
```

---

## Additional SDK Options

### Python SDK
Microsoft provides a Python SDK for Dataverse Web API access — useful for data scripts, automation, and integration scenarios outside of .NET.

### PowerShell
`Invoke-RestMethod` with Dataverse Web API is a recommended quick-start approach for administrators and scripting scenarios.

### HTTP Testing Tools
Use Insomnia, Bruno, or Postman for interactive API testing and exploration.
