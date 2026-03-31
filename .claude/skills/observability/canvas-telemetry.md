# Canvas App Telemetry

## Overview

Canvas app telemetry combines two approaches: Application Insights integration (for production monitoring) and the Monitor tool (for real-time development diagnostics). Together they provide visibility into screen transitions, data call performance, delegation warnings, formula errors, and user behavior.

---

## Application Insights Integration

### Enable Per-App

```
Power Apps Studio → App → Settings → General
  → Pass to Application Insights connection string: [paste connection string]
  → Save → Publish
```

> Use environment variables to manage connection strings across environments. Retrieve the value at app startup via `LookUp('Environment Variable Values', ...)`.

### Automatic Telemetry

When connected to App Insights, canvas apps automatically emit:

| Event | App Insights Table | Details |
|---|---|---|
| **App launch** | `customEvents` | App name, user, session start |
| **Screen view** | `pageViews` | Screen name, duration on screen |
| **Unhandled error** | `exceptions` | Error message, formula, screen context |
| **Network request** | `dependencies` | Connector call, duration, status |
| **App close** | `customEvents` | Session duration, screen count |

### Custom Telemetry with Trace()

Use the `Trace()` function to send custom events:

```powerfx
// Track a business event
Trace(
    "OrderSubmitted",
    TraceSeverity.Information,
    {
        OrderId: Text(ThisItem.OrderId),
        OrderTotal: Text(ThisItem.Total),
        ItemCount: Text(CountRows(OrderLines)),
        Screen: App.ActiveScreen.Name
    }
)

// Track a performance measurement
Trace(
    "DataLoadComplete",
    TraceSeverity.Information,
    {
        Duration: Text(Timer1.Value),
        RecordCount: Text(CountRows(colAccounts)),
        Screen: "AccountList"
    }
)

// Track an error
Trace(
    "PaymentProcessingFailed",
    TraceSeverity.Error,
    {
        ErrorMessage: Text(FirstError.Message),
        OrderId: Text(varCurrentOrder.Id),
        PaymentMethod: varPaymentMethod
    }
)
```

### Trace Severity Levels

| Severity | Use Case | App Insights Severity |
|---|---|---|
| `TraceSeverity.Information` | Business events, normal operations | Informational |
| `TraceSeverity.Warning` | Delegation warnings, approaching limits | Warning |
| `TraceSeverity.Error` | Failed operations, data errors | Error |
| `TraceSeverity.Critical` | App-breaking issues | Critical |

---

## Monitor Tool (Development)

The Monitor tool provides real-time diagnostics during development and testing. It captures everything happening inside a running canvas app.

### Launch Monitor

```
Power Apps Studio → App → Advanced tools → Monitor
  → Open monitor (opens in new tab)
  → Play the app (in another tab/window)
  → Events stream in real-time
```

Or for published apps:
```
Power Apps → Apps → [app] → Monitor → Connect to a player session
  → Share the session link with the user to monitor
```

### What Monitor Captures

| Category | Events | Useful For |
|---|---|---|
| **Data** | Connector calls, Dataverse queries, SharePoint requests | Performance, query optimization |
| **Network** | HTTP requests/responses, headers, payloads | Debugging connector issues |
| **Delegation** | Delegation warnings with formula context | Finding non-delegable operations |
| **User Actions** | Screen navigation, button clicks, selections | Understanding user flows |
| **Formulas** | Formula evaluation, errors | Debugging formula logic |
| **Performance** | Screen render time, data load time | Identifying bottlenecks |

### Monitor for Delegation Analysis

Monitor highlights delegation warnings in real-time:

```
Event: Delegation Warning
Formula: Filter(Accounts, Name = TextInput1.Text)
Reason: "Text" functions are delegable to Dataverse but not to SharePoint
Impact: Only first 500/2000 records processed locally

Action:
  - Use delegable functions (StartsWith instead of Contains for SP)
  - Or switch data source to Dataverse (most operations delegable)
```

---

## KQL Queries for Canvas Apps

### Screen Usage Patterns
```kql
pageViews
| where timestamp > ago(30d)
| where customDimensions.appName == "Expense Report"
| summarize viewCount = count(), avgDuration = avg(duration) by name
| order by viewCount desc
```

### App Launch Frequency
```kql
customEvents
| where timestamp > ago(30d)
| where name == "AppLaunch" or name == "ScreenView"
| summarize sessions = dcount(session_Id), users = dcount(user_Id) by bin(timestamp, 1d)
| render timechart
```

### Data Call Performance
```kql
dependencies
| where timestamp > ago(7d)
| where customDimensions.appName == "Expense Report"
| summarize avg_ms = avg(duration), p95 = percentile(duration, 95), count() by name
| order by p95 desc
```

### Error Frequency by Screen
```kql
exceptions
| where timestamp > ago(7d)
| where customDimensions.appName == "Expense Report"
| summarize errorCount = count() by tostring(customDimensions.screenName), outerMessage
| order by errorCount desc
```

### Custom Business Events
```kql
customEvents
| where timestamp > ago(7d)
| where name == "OrderSubmitted"
| extend orderTotal = todouble(customDimensions.OrderTotal)
| summarize totalOrders = count(), totalValue = sum(orderTotal) by bin(timestamp, 1d)
| render timechart
```

---

## Performance Monitoring Patterns

### Track Data Load Times

```powerfx
// OnVisible of data-heavy screen
UpdateContext({ _loadStart: Now() });

ClearCollect(
    colAccounts,
    Filter(Accounts, Status = "Active")
);

UpdateContext({ _loadEnd: Now() });

Trace(
    "AccountListLoaded",
    TraceSeverity.Information,
    {
        Duration: Text(DateDiff(_loadStart, _loadEnd, TimeUnit.Milliseconds)),
        RecordCount: Text(CountRows(colAccounts)),
        Screen: "AccountListScreen"
    }
)
```

### Track Navigation Flow

```powerfx
// OnVisible of each screen
Trace(
    "ScreenView",
    TraceSeverity.Information,
    {
        Screen: App.ActiveScreen.Name,
        PreviousScreen: varPreviousScreen,
        UserId: User().Email
    }
);

Set(varPreviousScreen, App.ActiveScreen.Name);
```

### Track Feature Adoption

```powerfx
// When user uses a specific feature
Trace(
    "FeatureUsed",
    TraceSeverity.Information,
    {
        Feature: "BulkApproval",
        ItemCount: Text(CountRows(selectedItems)),
        Screen: App.ActiveScreen.Name
    }
)
```

---

## Performance Targets

| Metric | Good | Acceptable | Poor |
|---|---|---|---|
| App startup | < 3s | 3-6s | > 6s |
| Screen transition | < 1s | 1-3s | > 3s |
| Data call (Dataverse) | < 1s | 1-3s | > 3s |
| Data call (SharePoint) | < 2s | 2-5s | > 5s |
| Collection load (500 records) | < 2s | 2-4s | > 4s |

---

## Anti-Patterns

- No Application Insights connection configured (no production telemetry)
- Using Monitor tool as the only diagnostics method (not available in production)
- No `Trace()` calls for business events (only infrastructure-level insight)
- Trace() with sensitive data (PII in custom properties — violates compliance)
- Not tracking delegation warnings (silent data completeness issues)
- No screen view tracking (can't understand user navigation patterns)
- Ignoring data call durations (slow connectors degrade UX silently)
- Hardcoded connection string (breaks when promoting across environments)
