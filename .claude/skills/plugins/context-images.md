# Plugins — Context & Entity Images

## Plugin Context (IPluginExecutionContext)

> **Stateless Design Requirement:** The platform caches plugin class instances across executions. Never store per-execution state in class fields (other than constructor-injected configuration). All execution state must use local variables within `Execute()`.

### Key Properties
| Property | Type | Description |
|---|---|---|
| `MessageName` | `string` | "Create", "Update", "Delete", "Retrieve", custom API name |
| `Stage` | `int` | 10 (PreValidation), 20 (PreOperation), 40 (PostOperation) |
| `Mode` | `int` | 0 (Synchronous), 1 (Asynchronous) |
| `Depth` | `int` | Execution depth (>1 means triggered by another plugin) |
| `PrimaryEntityName` | `string` | Logical name of the entity |
| `PrimaryEntityId` | `Guid` | ID of the record |
| `UserId` | `Guid` | Calling user's ID |
| `InitiatingUserId` | `Guid` | Original user (even in impersonation) |
| `InputParameters` | `ParameterCollection` | Contains "Target" (Entity) for CUD |
| `OutputParameters` | `ParameterCollection` | Contains "id" after Create |
| `PreEntityImages` | `EntityImageCollection` | Snapshot before operation |
| `PostEntityImages` | `EntityImageCollection` | Snapshot after operation |
| `SharedVariables` | `ParameterCollection` | Pass data between pipeline stages |
| `ParentContext` | `IPluginExecutionContext` | Parent pipeline context (null if top-level) |

### Accessing Target Entity
```csharp
// Create: Target is the full entity being created
// Update: Target contains ONLY the changed fields
// Delete: Target is an EntityReference (not Entity)

// Create / Update
if (context.InputParameters["Target"] is Entity target)
{
    var name = target.GetAttributeValue<string>("contoso_name");
    var priority = target.GetAttributeValue<OptionSetValue>("contoso_priority")?.Value;
    var accountRef = target.GetAttributeValue<EntityReference>("contoso_accountid");
}

// Delete
if (context.InputParameters["Target"] is EntityReference targetRef)
{
    var deletedId = targetRef.Id;
    var entityName = targetRef.LogicalName;
}
```

---

## Entity Images (Pre/Post Snapshots)

### When to Use
| Image Type | Available In | Contains |
|---|---|---|
| Pre-Image | Pre-Operation, Post-Operation | Record state BEFORE the operation |
| Post-Image | Post-Operation only | Record state AFTER the operation |

### Registration
Images must be registered with the plugin step. Specify which attributes to include (never all).

### Accessing Images
```csharp
// Pre-image: what the record looked like before
if (context.PreEntityImages.Contains("PreImage"))
{
    var preImage = context.PreEntityImages["PreImage"];
    var oldStatus = preImage.GetAttributeValue<OptionSetValue>("statecode")?.Value;
}

// Post-image: what the record looks like after
if (context.PostEntityImages.Contains("PostImage"))
{
    var postImage = context.PostEntityImages["PostImage"];
    var newStatus = postImage.GetAttributeValue<OptionSetValue>("statecode")?.Value;
}

// Merge target + pre-image to get complete record in Pre-Operation
Entity merged = new Entity(target.LogicalName, target.Id);
if (context.PreEntityImages.Contains("PreImage"))
{
    foreach (var attr in context.PreEntityImages["PreImage"].Attributes)
        merged[attr.Key] = attr.Value;
}
foreach (var attr in target.Attributes)
    merged[attr.Key] = attr.Value; // Target overrides pre-image
```

---

## Shared Variables (Cross-Stage Communication)

```csharp
// Pre-Validation: set a shared variable
context.SharedVariables["OriginalPrice"] = target.GetAttributeValue<Money>("contoso_price")?.Value ?? 0m;

// Post-Operation: read shared variable from same pipeline
if (context.SharedVariables.Contains("OriginalPrice"))
{
    var originalPrice = (decimal)context.SharedVariables["OriginalPrice"];
    // Compare with new price...
}
```

---

## IOrganizationService Operations

### CRUD Operations
```csharp
// Create
var newContact = new Entity("contact")
{
    ["firstname"] = "Jane",
    ["lastname"] = "Smith",
    ["emailaddress1"] = "jane@contoso.com",
    ["parentcustomerid"] = new EntityReference("account", accountId)
};
Guid contactId = service.Create(newContact);

// Retrieve
var contact = service.Retrieve("contact", contactId,
    new ColumnSet("firstname", "lastname", "emailaddress1"));

// Update (only changed fields)
var update = new Entity("contact", contactId)
{
    ["emailaddress1"] = "jane.smith@contoso.com"
};
service.Update(update);

// Delete
service.Delete("contact", contactId);

// RetrieveMultiple
var query = new QueryExpression("contact")
{
    ColumnSet = new ColumnSet("fullname", "emailaddress1"),
    Criteria = {
        Conditions = {
            new ConditionExpression("statecode", ConditionOperator.Equal, 0),
            new ConditionExpression("parentcustomerid", ConditionOperator.Equal, accountId)
        }
    },
    Orders = { new OrderExpression("fullname", OrderType.Ascending) },
    TopCount = 50
};
var results = service.RetrieveMultiple(query);
```

### Associate / Disassociate
```csharp
// Associate (N:N relationship)
service.Associate(
    "contact", contactId,
    new Relationship("contoso_contact_project"),
    new EntityReferenceCollection { new EntityReference("contoso_project", projectId) });

// Disassociate
service.Disassociate(
    "contact", contactId,
    new Relationship("contoso_contact_project"),
    new EntityReferenceCollection { new EntityReference("contoso_project", projectId) });
```

### Execute Actions
```csharp
// Execute built-in action (e.g., SetState)
var setStateRequest = new SetStateRequest
{
    EntityMoniker = new EntityReference("contoso_order", orderId),
    State = new OptionSetValue(1),  // Inactive
    Status = new OptionSetValue(2)  // Cancelled
};
service.Execute(setStateRequest);

// Execute custom action
var request = new OrganizationRequest("contoso_ApproveOrder")
{
    ["Target"] = new EntityReference("contoso_order", orderId),
    ["ApproverNotes"] = "Approved by director"
};
var response = service.Execute(request);
var result = (bool)response["IsApproved"];
```
