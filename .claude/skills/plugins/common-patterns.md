# Plugins — Common Patterns

## Validation Plugin (Pre-Validation)
```csharp
public class ValidateOrderTotal : IPlugin
{
    public void Execute(IServiceProvider serviceProvider)
    {
        var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));

        if (context.InputParameters["Target"] is Entity target
            && target.LogicalName == "contoso_order")
        {
            var total = target.GetAttributeValue<Money>("contoso_totalamount")?.Value ?? 0;

            if (total < 0)
            {
                // This message is shown to the user in the UI
                throw new InvalidPluginExecutionException(
                    "Order total cannot be negative. Please check the line items.");
            }

            if (total > 1000000)
            {
                throw new InvalidPluginExecutionException(
                    "Orders over $1,000,000 require director approval. " +
                    "Please submit via the approval workflow.");
            }
        }
    }
}
```

---

## Auto-Number Plugin (Pre-Operation)
```csharp
public class AutoNumberOrder : IPlugin
{
    public void Execute(IServiceProvider serviceProvider)
    {
        var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
        var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
        var service = serviceFactory.CreateOrganizationService(null); // System context
        var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

        if (context.MessageName != "Create") return;
        if (!(context.InputParameters["Target"] is Entity target)) return;

        try
        {
            // PREFER Dataverse auto-number column instead of this pattern.
            // This manual pattern has a RACE CONDITION under concurrent creates:
            // two simultaneous requests can read the same "latest" number and produce duplicates.
            // Mitigations: use Dataverse auto-number (best), or a dedicated counter table
            // with optimistic concurrency, or accept occasional duplicates and handle via
            // duplicate detection rules.
            // This pattern is only for complex numbering (e.g., ORD-2026-00001) that
            // auto-number columns cannot express.

            var year = DateTime.UtcNow.Year;
            var prefix = $"ORD-{year}-";

            // Query for the latest order number this year
            var query = new QueryExpression("contoso_order")
            {
                ColumnSet = new ColumnSet("contoso_ordernumber"),
                TopCount = 1,
                Orders = { new OrderExpression("contoso_ordernumber", OrderType.Descending) },
                Criteria = {
                    Conditions = {
                        new ConditionExpression("contoso_ordernumber", ConditionOperator.BeginsWith, prefix)
                    }
                }
            };

            var results = service.RetrieveMultiple(query);
            int nextNumber = 1;

            if (results.Entities.Count > 0)
            {
                var lastNumber = results.Entities[0].GetAttributeValue<string>("contoso_ordernumber");
                if (int.TryParse(lastNumber?.Substring(prefix.Length), out int parsed))
                    nextNumber = parsed + 1;
            }

            target["contoso_ordernumber"] = $"{prefix}{nextNumber:D5}";
            tracingService.Trace("Assigned order number: {0}", target["contoso_ordernumber"]);
        }
        catch (Exception ex)
        {
            tracingService.Trace("AutoNumber error: {0}", ex.ToString());
            throw new InvalidPluginExecutionException($"Auto-numbering failed: {ex.Message}", ex);
        }
    }
}
```

---

## Cascading Update Plugin (Post-Operation Async)
```csharp
public class CascadeAccountStatusToContacts : IPlugin
{
    public void Execute(IServiceProvider serviceProvider)
    {
        var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
        var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
        var service = serviceFactory.CreateOrganizationService(null);
        var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

        if (!(context.InputParameters["Target"] is Entity target)) return;

        // Only proceed if statecode was changed
        if (!target.Contains("statecode")) return;

        var newState = target.GetAttributeValue<OptionSetValue>("statecode").Value;
        tracingService.Trace("Account state changed to {0}", newState);

        // Get all contacts for this account
        var query = new QueryExpression("contact")
        {
            ColumnSet = new ColumnSet("contactid"),
            Criteria = {
                Conditions = {
                    new ConditionExpression("parentcustomerid", ConditionOperator.Equal, context.PrimaryEntityId)
                }
            }
        };

        var contacts = service.RetrieveMultiple(query);
        tracingService.Trace("Found {0} contacts to update", contacts.Entities.Count);

        foreach (var contact in contacts.Entities)
        {
            var update = new Entity("contact", contact.Id)
            {
                ["contoso_accountstatus"] = new OptionSetValue(newState)
            };
            service.Update(update);
        }
    }
}
```

---

## Custom API Plugin
```csharp
public class CalculateProjectHealth : IPlugin
{
    public void Execute(IServiceProvider serviceProvider)
    {
        var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
        var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
        var service = serviceFactory.CreateOrganizationService(context.UserId);
        var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

        // Read Custom API input parameters
        var includeHistory = context.InputParameters.Contains("IncludeHistory")
            ? (bool)context.InputParameters["IncludeHistory"]
            : false;

        // For bound actions, the target record is available
        var projectRef = (EntityReference)context.InputParameters["Target"];

        try
        {
            // Retrieve the project
            var project = service.Retrieve("contoso_project", projectRef.Id,
                new ColumnSet("contoso_name", "contoso_duedate", "contoso_budget", "statecode"));

            // Calculate health score (example logic)
            int healthScore = 100;
            var dueDate = project.GetAttributeValue<DateTime?>("contoso_duedate");
            if (dueDate.HasValue && dueDate.Value < DateTime.UtcNow)
                healthScore -= 30; // Overdue penalty

            // Query related tasks
            var taskQuery = new QueryExpression("contoso_task")
            {
                ColumnSet = new ColumnSet("statecode"),
                Criteria = {
                    Conditions = {
                        new ConditionExpression("contoso_projectid", ConditionOperator.Equal, projectRef.Id)
                    }
                }
            };
            var tasks = service.RetrieveMultiple(taskQuery);
            var completedCount = tasks.Entities.Count(t => t.GetAttributeValue<OptionSetValue>("statecode")?.Value == 1);
            var completionRate = tasks.Entities.Count > 0
                ? (double)completedCount / tasks.Entities.Count * 100
                : 0;

            // Set Custom API output parameters
            context.OutputParameters["HealthScore"] = healthScore;
            context.OutputParameters["CompletionRate"] = (decimal)completionRate;
            context.OutputParameters["TaskCount"] = tasks.Entities.Count;

            tracingService.Trace("Health score: {0}, Completion: {1}%", healthScore, completionRate);
        }
        catch (Exception ex)
        {
            tracingService.Trace("Error calculating health: {0}", ex.ToString());
            throw new InvalidPluginExecutionException($"Health calculation failed: {ex.Message}", ex);
        }
    }
}
```
