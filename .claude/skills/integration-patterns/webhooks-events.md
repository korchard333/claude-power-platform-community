# Webhooks & Events

## Overview

Dataverse webhooks push real-time notifications to external endpoints when data changes. They are lighter-weight than Service Bus integration and suitable for scenarios where reliable HTTP delivery with built-in retry is sufficient. Event Grid provides a complementary Azure-native eventing pattern.

---

## Dataverse Webhooks

### How Webhooks Work

```
1. Register a webhook endpoint in Dataverse
2. Register a step (trigger) on the webhook for specific messages/entities
3. When the event occurs, Dataverse POSTs the execution context to your endpoint
4. Your endpoint processes the data and returns HTTP 200
5. If the endpoint returns an error, Dataverse retries
```

### Register a Webhook via Plugin Registration Tool

```
Plugin Registration Tool → Register → Register New Webhook

  Name: Contact Created Webhook
  Endpoint URL: https://func-contoso.azurewebsites.net/api/contact-created
  Authentication:
    - HttpHeader: x-api-key = [your-key]
    - Or: WebhookKey = [SAS key]
    - Or: HttpQueryString (key in URL)
  Message Format: JSON
```

### Register a Webhook via Web API

```bash
# Create the service endpoint
curl -X POST "${BASE_URL}/serviceendpoints" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "OData-Version: 4.0" \
  -d '{
    "name": "Contact Created Webhook",
    "url": "https://func-contoso.azurewebsites.net/api/contact-created",
    "contract": 8,
    "authtype": 4,
    "authvalue": "x-api-key: your-api-key-here",
    "messageformat": 1
  }'
```

Contract values: `8` = Webhook
Auth type values: `1` = HttpHeader, `2` = HttpQueryString, `4` = WebhookKey
Message format: `1` = JSON, `2` = XML

### Register a Step on the Webhook

```bash
# Register step via API
curl -X POST "${BASE_URL}/sdkmessageprocessingsteps" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contact Create → Webhook",
    "sdkmessageid@odata.bind": "/sdkmessages(9ebda5c3-...)",
    "sdkmessagefilterid@odata.bind": "/sdkmessagefilters(...)",
    "eventhandler_serviceendpoint@odata.bind": "/serviceendpoints(guid)",
    "mode": 1,
    "rank": 1,
    "stage": 40,
    "supporteddeployment": 0
  }'
```

Mode: `0` = Synchronous, `1` = Asynchronous
Stage: `40` = PostOperation

---

## Webhook Payload

```json
{
  "MessageName": "Create",
  "PrimaryEntityName": "contact",
  "PrimaryEntityId": "a1b2c3d4-...",
  "BusinessUnitId": "guid",
  "OrganizationId": "guid",
  "InitiatingUserId": "guid",
  "UserId": "guid",
  "Depth": 1,
  "InputParameters": [
    {
      "key": "Target",
      "value": {
        "LogicalName": "contact",
        "Id": "a1b2c3d4-...",
        "Attributes": [
          { "key": "firstname", "value": "John" },
          { "key": "lastname", "value": "Doe" },
          { "key": "emailaddress1", "value": "john@contoso.com" }
        ]
      }
    }
  ],
  "PostEntityImages": [],
  "PreEntityImages": []
}
```

### Filtering Attributes

To reduce payload size, configure the step to only include specific attributes:

```
Plugin Registration Tool → Step → Filtering Attributes
  → Select: firstname, lastname, emailaddress1
```

This sends only the specified columns in the webhook payload, reducing bandwidth and processing time.

---

## Retry Behavior

Dataverse retries failed webhook deliveries automatically:

| Retry | Delay | Total Wait |
|---|---|---|
| 1st retry | ~1 minute | 1 min |
| 2nd retry | ~2 minutes | 3 min |
| 3rd retry | ~4 minutes | 7 min |

After 3 retries (exponential backoff at 1/2/4 minutes), the delivery is abandoned.

### Handling Retries in Your Endpoint

```typescript
// Azure Function webhook receiver
app.http("contact-created", {
  methods: ["POST"],
  authLevel: "function",
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const context = await request.json();

    try {
      // Process the event
      await processContactCreated(context);

      // Return 200 to acknowledge
      return { status: 200, body: "OK" };
    } catch (error) {
      // Return 500 to trigger retry
      // Dataverse will retry up to 3 times
      return { status: 500, body: "Processing failed" };
    }
  },
});
```

### Idempotency

Webhooks may be delivered multiple times (retries). Make your endpoint idempotent:

```typescript
async function processContactCreated(context: any) {
  const eventId = context.CorrelationId;

  // Check if already processed
  const existing = await db.get("processed_events", eventId);
  if (existing) {
    console.log(`Event ${eventId} already processed, skipping`);
    return;
  }

  // Process
  await doWork(context);

  // Mark as processed
  await db.put("processed_events", { id: eventId, processedAt: new Date() });
}
```

---

## Sync vs Async Webhooks

| Mode | Behavior | Use Case |
|---|---|---|
| **Asynchronous** (recommended) | Queued, does not block user | Most integrations |
| **Synchronous** | Blocks the user operation until webhook responds | Validation that must prevent save |

> **Warning:** Synchronous webhooks add latency to the user's save operation. If your endpoint is slow or unreachable, the user's save fails. Use async unless you need to block the operation.

---

## Pre/Post Entity Images

Configure entity images to include the full record state:

```
Plugin Registration Tool → Step → Images

Pre-image: State of the record BEFORE the operation
  Name: PreImage
  Attributes: firstname, lastname, emailaddress1

Post-image: State of the record AFTER the operation
  Name: PostImage
  Attributes: firstname, lastname, emailaddress1
```

This is essential for Update events — without images, you only get the changed attributes, not the full record.

---

## Event Grid Integration

Azure Event Grid provides a complementary pattern for Azure-to-Power-Platform eventing.

### Dataverse → Event Grid (via Webhook)

```
Dataverse webhook → Azure Function → Event Grid topic
  → Multiple Event Grid subscribers (Functions, Logic Apps, queues)
```

### Event Grid → Power Automate

```
Power Automate trigger: "When a resource event occurs" (Event Grid connector)
  → Event Grid subscription filters by event type
  → Flow processes the event
```

### When Event Grid vs Webhook

| Scenario | Use | Why |
|---|---|---|
| Dataverse → single endpoint | Webhook | Simpler, built-in retry |
| Dataverse → multiple consumers | Webhook → Event Grid | Fan-out, filtering per subscriber |
| Azure event → Power Platform | Event Grid trigger in flow | Native connector |
| Need > 3 retries | Webhook → Service Bus | More retry control |

---

## Security

### Webhook Authentication Options

| Method | Setup | Security Level |
|---|---|---|
| **HttpHeader** | Custom header (e.g., `x-api-key: value`) | Medium |
| **WebhookKey** | SAS-style key in header | Medium |
| **HttpQueryString** | Key in URL query parameter | Low (logged in URLs) |
| **Azure Function key** | Function-level or host-level key | Medium |
| **Managed identity** | Not directly supported for webhooks | N/A |

### Best Practice
- Use HttpHeader authentication with a strong API key
- Rotate keys periodically
- Validate the webhook payload structure in your endpoint
- Rate-limit your endpoint to prevent abuse
- Use HTTPS only (Dataverse requires HTTPS)

---

## Anti-Patterns

- Synchronous webhooks for non-critical integrations (adds latency to user operations)
- No idempotency handling (duplicate events cause duplicate processing)
- Webhook endpoint with no authentication (anyone can POST to it)
- No monitoring on webhook failures (3 retries exhausted, event lost)
- Relying on webhook retry for critical events (only 3 retries — use Service Bus for guaranteed delivery)
- No filtering attributes on step (sending full entity payload when only 2 fields needed)
- No pre/post images on Update events (can't determine what changed)
- Webhook endpoint with > 2 second response time (increases risk of timeout)
