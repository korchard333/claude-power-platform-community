# Custom Connectors — Triggers

## Polling Trigger
```json
{
  "/orders/poll": {
    "get": {
      "operationId": "OnNewOrder",
      "summary": "When a new order is created",
      "x-ms-trigger": "batch",
      "x-ms-trigger-hint": "Check for new orders",
      "parameters": [
        {
          "name": "since",
          "in": "query",
          "type": "string",
          "format": "date-time",
          "x-ms-visibility": "internal",
          "x-ms-summary": "Since timestamp"
        }
      ],
      "responses": {
        "200": {
          "description": "New orders found",
          "schema": {
            "type": "array",
            "items": { "$ref": "#/definitions/Order" }
          }
        },
        "202": { "description": "No new orders" }
      }
    }
  }
}
```

**Key:** Return 200 with data when new items exist, 202 (no content) when nothing new. The platform uses the `since` parameter to track state between polls.

---

## Webhook Trigger
```json
{
  "/webhooks/order": {
    "x-ms-notification-content": {
      "description": "Webhook push notification schema",
      "schema": { "$ref": "#/definitions/Order" }
    },
    "post": {
      "operationId": "OnOrderCreated_Webhook",
      "summary": "When an order is created (webhook)",
      "x-ms-trigger": "single",
      "parameters": [
        {
          "name": "body",
          "in": "body",
          "required": true,
          "schema": {
            "type": "object",
            "required": ["callbackUrl"],
            "properties": {
              "callbackUrl": {
                "type": "string",
                "x-ms-notification-url": true,
                "x-ms-visibility": "internal"
              }
            }
          }
        }
      ],
      "responses": {
        "201": { "description": "Webhook registered" }
      }
    }
  }
}
```

The platform calls POST to register the webhook, providing the callback URL. Your API must POST to that URL when events occur.

---

## Webhook Deregistration (Required)
When a flow is disabled or deleted, the platform calls DELETE to deregister the webhook. **You must implement this endpoint** or stale webhooks will accumulate in your backend.

```json
{
  "/webhooks/order/{webhookId}": {
    "delete": {
      "operationId": "DeleteOrderWebhook",
      "summary": "Deregister webhook",
      "x-ms-visibility": "internal",
      "parameters": [
        {
          "name": "webhookId",
          "in": "path",
          "required": true,
          "type": "string",
          "x-ms-url-encoding": "single"
        }
      ],
      "responses": {
        "200": { "description": "Webhook deregistered" }
      }
    }
  }
}
```
The POST registration endpoint should return the webhook ID (or a Location header) so the platform knows what to DELETE later.
