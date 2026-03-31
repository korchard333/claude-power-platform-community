# Power Automate — Expressions & HTTP Connector

## Expression Patterns

```
// Null-safe property access
coalesce(outputs('Get_item')?['body/Title'], 'Unknown')

// Safe JSON parse with fallback
if(empty(triggerOutputs()?['body/data']),
   json('{}'),
   json(triggerOutputs()?['body/data']))

// Date formatting
formatDateTime(utcNow(), 'yyyy-MM-dd')

// Array filtering
@{length(body('Filter_array'))}

// String interpolation
concat('Order ', triggerOutputs()?['body/contoso_ordernumber'], ' processed')
```

---

## HTTP Connector — Resilient Pattern

```
Action: HTTP
Method: POST
URI: @{variables('APIEndpoint')}    # From environment variable
Headers:
  Authorization: Bearer @{body('Get_Token')?['access_token']}
  Content-Type: application/json
Body: @{variables('RequestPayload')}

Retry Policy:
  Type: Exponential Interval
  Count: 4
  Interval: PT5S
  Min Interval: PT5S
  Max Interval: PT1H

Configure Run After:
  - "has failed" → Error notification branch
  - "has timed out" → Timeout handling branch
```
