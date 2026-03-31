# Azure Service Bus Integration

## Overview

Azure Service Bus provides reliable, asynchronous messaging between Dataverse and external systems. Messages are sent from Dataverse via registered service endpoint plugins and consumed by Azure-hosted processors. This decouples Power Platform from downstream systems.

---

## Architecture

```
Dataverse (record created/updated/deleted)
  → Plugin step (registered on message)
    → Service Bus endpoint (queue or topic)
      → Consumer (Azure Function, Logic App, custom processor)
```

---

## Queue vs Topic

| Feature | Queue | Topic + Subscription |
|---|---|---|
| **Consumers** | Single consumer (competing consumers) | Multiple subscribers (fan-out) |
| **Pattern** | Point-to-point | Publish-subscribe |
| **Use case** | Sequential processing, work queue | Event distribution to multiple systems |
| **Ordering** | FIFO (with sessions) | Per-subscription filtering |
| **Example** | Invoice processing pipeline | "Contact created" → CRM sync + email + audit |

---

## Dataverse Service Bus Integration

### Step 1: Create Service Bus Namespace and Queue/Topic

```bash
# Create namespace
az servicebus namespace create \
  --resource-group "rg-integration" \
  --name "sb-contoso-pp" \
  --location australiaeast \
  --sku Standard

# Create queue
az servicebus queue create \
  --resource-group "rg-integration" \
  --namespace-name "sb-contoso-pp" \
  --name "dataverse-events"

# Or create topic + subscription
az servicebus topic create \
  --resource-group "rg-integration" \
  --namespace-name "sb-contoso-pp" \
  --name "dataverse-events"

az servicebus topic subscription create \
  --resource-group "rg-integration" \
  --namespace-name "sb-contoso-pp" \
  --topic-name "dataverse-events" \
  --name "crm-sync"
```

### Step 2: Get SAS Connection String

```bash
az servicebus namespace authorization-rule keys list \
  --resource-group "rg-integration" \
  --namespace-name "sb-contoso-pp" \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv
```

### Step 3: Register Service Endpoint in Dataverse

Use the Plugin Registration Tool (part of Power Platform CLI tools):

```
Plugin Registration Tool → Register → Register New Service Endpoint

  Name: Contoso Service Bus Queue
  Designation Type: Queue (or Topic)
  Connection String: [SAS connection string]
  Queue/Topic Name: dataverse-events
  Message Format: JSON (recommended) or XML or .NET Binary
  User Claims: UserId (includes executing user info)
```

### Step 4: Register Plugin Step on the Endpoint

```
Plugin Registration Tool → Service Endpoint → Register New Step

  Message: Create
  Primary Entity: contact
  Execution Mode: Asynchronous (recommended)
  Service Endpoint: Contoso Service Bus Queue
```

### Message Payload

The message sent to Service Bus contains the Dataverse execution context:

```json
{
  "BusinessUnitId": "guid",
  "CorrelationId": "guid",
  "Depth": 1,
  "InitiatingUserId": "guid",
  "InputParameters": {
    "Target": {
      "LogicalName": "contact",
      "Id": "guid",
      "Attributes": {
        "firstname": "John",
        "lastname": "Doe",
        "emailaddress1": "john@contoso.com"
      }
    }
  },
  "MessageName": "Create",
  "OperationCreatedOn": "2026-03-23T10:00:00Z",
  "OrganizationId": "guid",
  "PrimaryEntityId": "guid",
  "PrimaryEntityName": "contact",
  "UserId": "guid"
}
```

---

## Consumer Patterns

### Azure Function Consumer

```csharp
// Azure Function — Service Bus trigger
[Function("ProcessDataverseEvent")]
public void Run(
    [ServiceBusTrigger("dataverse-events", Connection = "ServiceBusConnection")]
    ServiceBusReceivedMessage message,
    ServiceBusMessageActions messageActions)
{
    var context = JsonSerializer.Deserialize<RemoteExecutionContext>(message.Body);
    var target = context.InputParameters["Target"] as Entity;

    _logger.LogInformation("Processing {Message} on {Entity}: {Id}",
        context.MessageName, context.PrimaryEntityName, context.PrimaryEntityId);

    // Process the event
    ProcessContactCreated(target);

    // Complete the message (auto-complete is default)
}
```

### Dead-Letter Processing

```csharp
// Process messages that failed all retries
[Function("ProcessDeadLetters")]
public void RunDeadLetter(
    [ServiceBusTrigger("dataverse-events/$deadletterqueue", Connection = "ServiceBusConnection")]
    ServiceBusReceivedMessage message)
{
    _logger.LogError("Dead letter: {Reason}, MessageId: {Id}",
        message.DeadLetterReason, message.MessageId);

    // Alert operations team
    // Store in error table for manual review
}
```

---

## Reliable Messaging Patterns

### Retry Configuration

```bash
# Queue with retry settings
az servicebus queue update \
  --resource-group "rg-integration" \
  --namespace-name "sb-contoso-pp" \
  --name "dataverse-events" \
  --max-delivery-count 5 \
  --lock-duration PT1M \
  --default-message-time-to-live P7D
```

| Setting | Recommended | Purpose |
|---|---|---|
| Max delivery count | 5 | Retries before dead-letter |
| Lock duration | 1-5 minutes | Time consumer has to process |
| Message TTL | 7 days | How long unprocessed messages live |
| Dead-letter on expiration | Enabled | Don't lose expired messages |

### Session-Aware Processing

For ordered processing of related messages (e.g., all events for the same record):

```bash
# Create session-enabled queue
az servicebus queue create \
  --resource-group "rg-integration" \
  --namespace-name "sb-contoso-pp" \
  --name "dataverse-ordered" \
  --enable-session true
```

Set the session ID to the record ID:
```
Plugin Registration Tool → Step → Properties
  Session Id: {PrimaryEntityId}
```

This ensures all events for the same Dataverse record are processed in order.

---

## Topic Subscription Filters

Filter which messages a subscription receives:

```bash
# Only receive Contact creates
az servicebus topic subscription rule create \
  --resource-group "rg-integration" \
  --namespace-name "sb-contoso-pp" \
  --topic-name "dataverse-events" \
  --subscription-name "contact-sync" \
  --name "contacts-only" \
  --filter-sql-expression "PrimaryEntityName = 'contact' AND MessageName = 'Create'"
```

---

## Anti-Patterns

- Synchronous Service Bus calls from plugins (blocks the user, risks timeout)
- No dead-letter queue monitoring (failed messages silently accumulate)
- No session awareness for ordered processing (race conditions on related events)
- Message TTL too short (messages expire before processing during outages)
- Consumer without idempotency (duplicate messages cause duplicate processing)
- No correlation between Dataverse event and Service Bus message (impossible to trace)
- Single queue for all entity types (no filtering, all consumers see all messages)
- Shared Access Signature with root permissions (use least-privilege SAS policies)
