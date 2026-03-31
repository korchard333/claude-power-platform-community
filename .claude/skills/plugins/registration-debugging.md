# Plugins — Registration & Debugging

## Plugin Registration & Deployment

### Using PAC CLI
```bash
# Build the plugin assembly
dotnet build --configuration Release

# Register assembly
pac plugin push --assembly bin/Release/net462/Contoso.Plugins.dll

# List registered plugins
pac plugin list
```

### Using Plugin Registration Tool
```
1. Connect to environment
2. Register → Register New Assembly
   - Select DLL
   - Isolation Mode: Sandbox (always for Dataverse online)
   - Location: Database (always for Dataverse online)
3. Register → Register New Step
   - Message: Create/Update/Delete
   - Primary Entity: contoso_project
   - Stage: PreOperation/PostOperation
   - Execution Mode: Synchronous/Asynchronous
   - Filtering Attributes: (specify which field changes trigger the plugin)
4. Register → Register New Image (if needed)
   - Pre-Image or Post-Image
   - Select specific attributes (not all)
```

### Step Registration Parameters
| Parameter | Values | Notes |
|---|---|---|
| Message | Create, Update, Delete, Retrieve, RetrieveMultiple, custom | What triggers the plugin |
| Stage | 10 (PreValidation), 20 (PreOperation), 40 (PostOperation) | When in pipeline |
| Mode | 0 (Sync), 1 (Async) | Sync blocks UI, async runs in background |
| Filtering Attributes | Comma-separated list | Only trigger on these field changes (Update only) |
| Rank | Integer | Execution order when multiple plugins on same step |
| Unsecure Config | String | Stored in plugin step, readable by anyone |
| Secure Config | String | Encrypted, only system admins can read |

---

## Debugging & Tracing

### Tracing Service (ITracingService — Always Use)
```csharp
tracingService.Trace("Processing {0} with ID {1}", target.LogicalName, target.Id);
tracingService.Trace("Attribute count: {0}", target.Attributes.Count);

// View traces in:
// 1. Plugin Trace Log entity (Settings → Plugin Trace Log)
// 2. System Jobs for async failures
// Traces are stored for 24 hours max
```

### Enable Plugin Trace Logging
```http
PATCH /api/data/v9.2/organizations(org-guid)
Content-Type: application/json

{
  "plugintracelogsetting": 2
}
```
Values: 0 = Off, 1 = Exception only, 2 = All

### ILogger — Application Insights Integration
Send structured telemetry to Azure Application Insights (90-day retention, queryable via KQL).

```csharp
using Microsoft.Xrm.Sdk.PluginTelemetry;

public class MyPlugin : IPlugin
{
    public void Execute(IServiceProvider serviceProvider)
    {
        // ILogger writes to Application Insights (requires App Insights connected to environment)
        var logger = (ILogger)serviceProvider.GetService(typeof(ILogger));

        // ITracingService still needed for Plugin Trace Logs
        var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

        // Use scopes for structured context
        using (logger.BeginScope("MyPlugin.Execute"))
        {
            logger.LogInformation("Plugin executing for entity {EntityName}", target.LogicalName);
            logger.LogWarning("Potential issue detected: {Detail}", detail);
            logger.LogError("Error in plugin: {Error}", ex.Message);
        }
    }
}
```

**Note:** `ILogger` (Application Insights) and `ITracingService` (Plugin Trace Logs) are separate — use **both**:
- `ITracingService`: available in all orgs, 24-hour retention, best for debugging
- `ILogger`: requires Application Insights subscription, 90-day retention, best for production monitoring

### Remote Debugging (Development Only)
```
1. Deploy plugin with debug symbols
2. Attach Visual Studio to w3wp.exe (IIS) or Plugin Registration Tool profiler
3. Set breakpoints
4. Trigger the operation
```
