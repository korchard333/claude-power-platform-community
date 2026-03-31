# Custom Connectors — OpenAPI Definition

> **Note:** Power Platform custom connectors require OpenAPI 2.0 (Swagger) format.
> OpenAPI 3.0 is not currently supported for connector definitions.

## Project Structure

```
custom-connectors/
├── contoso-erp/
│   ├── apiDefinition.swagger.json    # OpenAPI 2.0 definition
│   ├── apiProperties.json            # Connector metadata + policies
│   ├── icon.png                      # 160x160 connector icon
│   └── settings.json                 # Test settings
├── contoso-shipping/
│   ├── apiDefinition.swagger.json
│   ├── apiProperties.json
│   └── icon.png
└── README.md
```

---

## OpenAPI Definition (apiDefinition.swagger.json)

### Minimal Structure
```json
{
  "swagger": "2.0",
  "info": {
    "title": "Contoso ERP",
    "description": "Custom connector for Contoso ERP system",
    "version": "1.0.0",
    "contact": {
      "name": "Contoso IT",
      "email": "it@contoso.com"
    }
  },
  "host": "api.contoso.com",
  "basePath": "/v2",
  "schemes": ["https"],
  "consumes": ["application/json"],
  "produces": ["application/json"],
  "paths": {},
  "definitions": {},
  "securityDefinitions": {}
}
```

### Action Definition (Operation)
```json
{
  "paths": {
    "/orders": {
      "get": {
        "operationId": "ListOrders",
        "summary": "List orders",
        "description": "Retrieve a list of orders with optional filtering",
        "x-ms-visibility": "important",
        "parameters": [
          {
            "name": "status",
            "in": "query",
            "type": "string",
            "description": "Filter by order status",
            "enum": ["active", "completed", "cancelled"],
            "x-ms-summary": "Order Status"
          },
          {
            "name": "$top",
            "in": "query",
            "type": "integer",
            "default": 50,
            "description": "Maximum number of records to return",
            "x-ms-summary": "Page Size"
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "schema": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "array",
                  "items": { "$ref": "#/definitions/Order" }
                }
              }
            }
          },
          "401": { "description": "Unauthorized" },
          "500": { "description": "Internal Server Error" }
        }
      },
      "post": {
        "operationId": "CreateOrder",
        "summary": "Create order",
        "description": "Create a new order in the ERP system",
        "x-ms-visibility": "important",
        "parameters": [
          {
            "name": "body",
            "in": "body",
            "required": true,
            "schema": { "$ref": "#/definitions/CreateOrderRequest" }
          }
        ],
        "responses": {
          "201": {
            "description": "Created",
            "schema": { "$ref": "#/definitions/Order" }
          }
        }
      }
    },
    "/orders/{orderId}": {
      "get": {
        "operationId": "GetOrder",
        "summary": "Get order by ID",
        "x-ms-visibility": "important",
        "parameters": [
          {
            "name": "orderId",
            "in": "path",
            "required": true,
            "type": "string",
            "x-ms-summary": "Order ID",
            "x-ms-url-encoding": "single"
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "schema": { "$ref": "#/definitions/Order" }
          },
          "404": { "description": "Not Found" }
        }
      }
    }
  }
}
```

### Schema Definitions
```json
{
  "definitions": {
    "Order": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique order identifier",
          "x-ms-summary": "Order ID"
        },
        "orderNumber": {
          "type": "string",
          "description": "Human-readable order number",
          "x-ms-summary": "Order Number"
        },
        "status": {
          "type": "string",
          "enum": ["active", "completed", "cancelled"],
          "description": "Current order status",
          "x-ms-summary": "Status"
        },
        "totalAmount": {
          "type": "number",
          "format": "double",
          "description": "Total order value",
          "x-ms-summary": "Total Amount"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "description": "When the order was created",
          "x-ms-summary": "Created Date"
        }
      }
    },
    "CreateOrderRequest": {
      "type": "object",
      "required": ["customerName", "items"],
      "properties": {
        "customerName": {
          "type": "string",
          "x-ms-summary": "Customer Name"
        },
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "productId": { "type": "string" },
              "quantity": { "type": "integer" }
            }
          }
        }
      }
    }
  }
}
```

---

## x-ms Extensions (Power Platform-Specific)

| Extension | Purpose | Example |
|---|---|---|
| `x-ms-summary` | Display name in designer | `"x-ms-summary": "Order ID"` |
| `x-ms-visibility` | Control visibility in UI | `"important"`, `"advanced"`, `"internal"` |
| `x-ms-dynamic-values` | Dynamic dropdown from API | Populate choices from another action |
| `x-ms-dynamic-schema` | Dynamic response schema | Response shape depends on input |
| `x-ms-url-encoding` | Path parameter encoding | `"single"` (no double-encoding) |
| `x-ms-trigger` | Mark as trigger operation | `"single"` (polling), `"batch"` (webhook) |
| `x-ms-trigger-hint` | Help text for trigger | `"Poll the API every 5 minutes"` |
| `x-ms-notification-content` | Webhook push schema | Schema of webhook callback body |

### Dynamic Dropdown Example
```json
{
  "name": "customerId",
  "in": "query",
  "type": "string",
  "x-ms-summary": "Customer",
  "x-ms-dynamic-values": {
    "operationId": "ListCustomers",
    "value-path": "id",
    "value-title": "name"
  }
}
```
