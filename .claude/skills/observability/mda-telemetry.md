# Model-Driven App Telemetry

## Overview

Model-driven app telemetry is collected automatically when environment-level Application Insights export is configured. This covers form loads, JavaScript errors, web resource performance, and plugin execution. Developers can add custom telemetry via JavaScript on forms and ILogger/ITracingService in plugins.

---

## Automatic Telemetry

When App Insights export is enabled for the environment, MDA apps automatically emit:

| Event | App Insights Table | Key Properties |
|---|---|---|
| Form load | `pageViews` | Form name, entity, load duration |
| Web resource load | `dependencies` | Resource name, duration, success |
| JavaScript errors | `exceptions` | Error message, stack trace, form context |
| Ribbon command execution | `customEvents` | Command name, duration |
| API calls (from client) | `dependencies` | URL, method, duration, status code |
| Subgrid data load | `dependencies` | Grid name, entity, record count, duration |

---

## Form Load Performance

Form load events appear in `pageViews`:

```kql
// Average form load time by entity, last 7 days
pageViews
| where timestamp > ago(7d)
| where customDimensions.formType == "main"
| summarize avg_ms = avg(duration), p95_ms = percentile(duration, 95), count() by tostring(customDimensions.entityName)
| order by avg_ms desc
```

### Form Load Phases

| Phase | What Happens | Optimization Target |
|---|---|---|
| **Network** | Form XML + metadata fetched | Cache warm-up, reduce form complexity |
| **Rendering** | HTML form layout rendered | Fewer tabs, fewer sections |
| **Data** | Record data fetched | Fewer columns on form, $select optimization |
| **Scripts** | OnLoad JS executed | Minimize OnLoad logic, defer non-critical work |
| **Subgrids** | Related records loaded | Lazy-load subgrids, limit visible columns |

### Performance Targets

| Metric | Good | Acceptable | Poor |
|---|---|---|---|
| Form load time | < 2s | 2-5s | > 5s |
| OnLoad script time | < 500ms | 500ms-2s | > 2s |
| Subgrid load time | < 1s | 1-3s | > 3s |

---

## JavaScript Custom Telemetry

Add custom telemetry from form scripts to track business events.

### Setup: App Insights JavaScript SDK on MDA Forms

```javascript
// Web resource: contoso_appInsightsHelper.js
// Load the App Insights JS SDK via a web resource or CDN

var contoso = contoso || {};
contoso.telemetry = (function () {
    "use strict";

    var _appInsights = null;

    function initialize(connectionString) {
        if (_appInsights) return;

        // Use the Application Insights JS SDK snippet
        // (loaded as a separate web resource or from CDN)
        var snippet = new Microsoft.ApplicationInsights.ApplicationInsights({
            config: {
                connectionString: connectionString,
                enableAutoRouteTracking: false, // MDA handles routing
                disableFetchTracking: false
            }
        });
        _appInsights = snippet.loadAppInsights();
    }

    function trackEvent(name, properties) {
        if (_appInsights) {
            _appInsights.trackEvent({ name: name }, properties);
        }
    }

    function trackException(error, properties) {
        if (_appInsights) {
            _appInsights.trackException({ exception: error }, properties);
        }
    }

    function trackMetric(name, value, properties) {
        if (_appInsights) {
            _appInsights.trackMetric({ name: name, average: value }, properties);
        }
    }

    return {
        initialize: initialize,
        trackEvent: trackEvent,
        trackException: trackException,
        trackMetric: trackMetric
    };
})();
```

### Using in Form OnLoad

```javascript
// Web resource: contoso_accountFormOnLoad.js
function onLoad(executionContext) {
    var formContext = executionContext.getFormContext();

    // Initialize telemetry (get connection string from env variable)
    contoso.telemetry.initialize(
        Xrm.Utility.getGlobalContext().getCurrentAppProperties().then(function(props) {
            // Or fetch from a Dataverse config table
        })
    );

    // Track custom business event
    var accountType = formContext.getAttribute("accountcategorycode").getValue();
    contoso.telemetry.trackEvent("AccountFormOpened", {
        accountType: accountType ? accountType.toString() : "none",
        formId: formContext.ui.formSelector.getCurrentItem().getId()
    });

    // Track form load timing
    var loadTime = performance.now();
    contoso.telemetry.trackMetric("AccountFormLoadMs", loadTime);
}
```

### Common Custom Events to Track

| Event | Properties | Use Case |
|---|---|---|
| `FormOpened` | entity, formId, recordId | Track which forms users access |
| `BusinessProcessStageChanged` | processName, fromStage, toStage | BPF flow analytics |
| `QuickCreateUsed` | entity, source (subgrid/command bar) | Quick create adoption |
| `LookupSelected` | entity, lookupField, selectedRecordType | User behavior |
| `SaveCompleted` | entity, duration, success | Save performance |
| `CustomButtonClicked` | buttonName, context | Command bar usage |

---

## Plugin Telemetry

### ITracingService (Built-in)

All plugins should use `ITracingService` for diagnostic output. Traces appear in Plugin Trace Log (Admin Center) and in Application Insights `traces` table when export is configured.

```csharp
public class AccountPostCreate : IPlugin
{
    public void Execute(IServiceProvider serviceProvider)
    {
        var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
        var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));

        tracingService.Trace("AccountPostCreate started. Target: {0}", context.PrimaryEntityId);

        try
        {
            // Business logic
            tracingService.Trace("Processing account creation for {0}", context.PrimaryEntityId);

            // ... logic ...

            tracingService.Trace("AccountPostCreate completed successfully");
        }
        catch (Exception ex)
        {
            tracingService.Trace("AccountPostCreate FAILED: {0}", ex.Message);
            throw; // Re-throw to trigger platform error handling
        }
    }
}
```

### ILogger (Application Insights Direct)

`ILogger` sends telemetry directly to Application Insights (requires environment-level export):

```csharp
public class AccountPostCreate : IPlugin
{
    public void Execute(IServiceProvider serviceProvider)
    {
        var logger = (ILogger)serviceProvider.GetService(typeof(ILogger));
        var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));

        // Custom event
        logger.LogInformation("AccountCreated: {AccountId}, Category: {Category}",
            context.PrimaryEntityId,
            context.InputParameters.Contains("accountcategorycode")
                ? context.InputParameters["accountcategorycode"].ToString()
                : "none");

        // Custom metric
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        // ... business logic ...
        stopwatch.Stop();

        logger.LogInformation("AccountPostCreate duration: {DurationMs}ms",
            stopwatch.ElapsedMilliseconds);
    }
}
```

### Plugin Trace Log Configuration

```
Power Platform Admin Center → Environments → [env]
  → Settings → Administration → System Settings → Customization tab
    → Plugin Trace Log: Exception / All
```

| Setting | When to Use |
|---|---|
| **Off** | Production (if App Insights export is configured) |
| **Exception** | Production (if App Insights export is NOT configured) |
| **All** | Development and debugging only (high volume) |

> **Warning:** Plugin Trace Log set to "All" generates massive volume and can impact performance. Use App Insights export for production monitoring instead.

---

## KQL Queries for MDA

### Slow Form Loads
```kql
pageViews
| where timestamp > ago(24h)
| where duration > 5000 // > 5 seconds
| summarize count(), avg(duration), max(duration) by tostring(customDimensions.entityName), tostring(customDimensions.formType)
| order by count_ desc
```

### JavaScript Errors
```kql
exceptions
| where timestamp > ago(24h)
| where client_Type == "Browser"
| summarize count() by outerMessage, tostring(customDimensions.formName)
| order by count_ desc
```

### Plugin Failures
```kql
dependencies
| where timestamp > ago(24h)
| where type == "Plugin"
| where success == false
| summarize count() by name, resultCode
| order by count_ desc
```

### Plugin Execution Duration
```kql
dependencies
| where timestamp > ago(7d)
| where type == "Plugin"
| summarize avg_ms = avg(duration), p95 = percentile(duration, 95), count() by name
| order by p95 desc
```

---

## Anti-Patterns

- Plugin Trace Log set to "All" in production (performance degradation, storage bloat)
- No ITracingService usage in plugins (impossible to debug failures)
- Custom JavaScript telemetry without connection string management (hardcoded keys)
- Not tracking business events (only infrastructure metrics, no business insight)
- Ignoring form load times (slow forms degrade user adoption)
- No baseline metrics (can't detect regression without historical comparison)
