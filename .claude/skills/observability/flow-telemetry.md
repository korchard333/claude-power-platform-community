# Flow Telemetry

## Overview

Power Automate flow telemetry provides visibility into flow run success/failure, action-level timing, error details, and consumption metrics. Telemetry comes from three sources: the built-in run history, the Automation Center dashboard, and Application Insights export (Managed Environments).

---

## Telemetry Sources

| Source | Scope | Retention | Real-Time |
|---|---|---|---|
| **Flow run history** | Per flow | 28 days | Yes |
| **Automation Center** | Per environment / tenant | Ongoing | Yes |
| **Application Insights** | Per environment (Managed Env) | Configurable (90-730 days) | ~24h SLA |
| **Power Automate analytics** | Per environment | 28 days | No (daily refresh) |

---

## Flow Run History

Every flow run is tracked with action-level detail.

### Access
```
Power Automate → My flows → [flow] → Run history
  → Select a run → Action-by-action view with inputs/outputs
```

### What's Captured Per Run

| Data | Description |
|---|---|
| **Run status** | Succeeded, Failed, Cancelled, Running |
| **Start/end time** | Timestamps for the overall run |
| **Trigger details** | Trigger inputs and outputs |
| **Action details** | Per-action: inputs, outputs, status, duration |
| **Error message** | For failed actions: error code, message, details |
| **Duration** | Total run duration and per-action duration |

### Programmatic Access to Run History

```bash
# Power Automate Management API — get flow runs
GET https://management.azure.com/providers/Microsoft.ProcessSimple/environments/{env-id}/flows/{flow-id}/runs?api-version=2016-11-01
  -H "Authorization: Bearer $TOKEN"
```

---

## Automation Center

The Automation Center is the central dashboard for monitoring all automation across the environment or tenant.

### Access
```
Power Automate → Automation Center (left nav)
  → Or: Power Platform Admin Center → Automation Center
```

### Dashboard Views

| View | Description | Use Case |
|---|---|---|
| **Overview** | Total runs, success rate, failure rate | Executive summary |
| **Flow runs** | All flow runs across environment | Cross-flow monitoring |
| **Failed runs** | Filtered to failures with error details | Incident triage |
| **Queued runs** | Runs waiting for execution | Capacity monitoring |
| **Desktop flow runs** | RPA-specific run monitoring | RPA operations |
| **Agent runs** | Autonomous agent execution history | Agent monitoring |

### Key Metrics

| Metric | Description | Alert Threshold |
|---|---|---|
| **Success rate** | % of runs that succeeded | < 95% |
| **Failure rate** | % of runs that failed | > 5% |
| **Average duration** | Mean run duration | > 2x baseline |
| **Queued runs** | Runs waiting for execution | > 100 (capacity issue) |
| **Throttled runs** | Runs hitting API limits | Any (indicates limit issues) |

---

## Application Insights Export (Managed Environments)

When enabled, flow telemetry is exported to Application Insights.

> **Prerequisite:** Environment must be a Managed Environment with App Insights export configured. See [App Insights Setup](app-insights-setup.md).

### What's Exported

| Event | App Insights Table | Key Properties |
|---|---|---|
| **Flow run start** | `requests` | Flow name, trigger type, environment |
| **Flow run complete** | `requests` | Duration, status, error details |
| **Action execution** | `dependencies` | Action name, connector, duration, status |
| **Throttling events** | `customEvents` | Limit type, retry-after, affected flow |
| **Connector calls** | `dependencies` | Connector name, operation, duration |

### KQL Queries for Flow Monitoring

#### Flow Failure Summary
```kql
requests
| where timestamp > ago(24h)
| where customDimensions.resourceType == "CloudFlow"
| where success == false
| summarize failCount = count() by tostring(customDimensions.flowDisplayName), resultCode
| order by failCount desc
```

#### Flow Duration Trends
```kql
requests
| where timestamp > ago(7d)
| where customDimensions.resourceType == "CloudFlow"
| where success == true
| summarize avg_ms = avg(duration), p95 = percentile(duration, 95) by tostring(customDimensions.flowDisplayName), bin(timestamp, 1d)
| render timechart
```

#### Slowest Actions Across All Flows
```kql
dependencies
| where timestamp > ago(24h)
| where customDimensions.resourceType == "CloudFlowAction"
| summarize avg_ms = avg(duration), p95 = percentile(duration, 95), count() by name
| where count_ > 10
| order by p95 desc
| take 20
```

#### Throttling Events
```kql
customEvents
| where timestamp > ago(24h)
| where name == "ApiThrottled" or customDimensions contains "429"
| summarize count() by tostring(customDimensions.flowDisplayName), tostring(customDimensions.connectorName)
| order by count_ desc
```

#### Connector Usage Distribution
```kql
dependencies
| where timestamp > ago(7d)
| where customDimensions.resourceType == "CloudFlowAction"
| summarize actionCount = count() by tostring(customDimensions.connectorName)
| order by actionCount desc
| render piechart
```

---

## Power Automate Analytics

Built-in analytics in the Power Platform Admin Center.

```
Power Platform Admin Center → Analytics → Power Automate
  → Environment-level: run counts, success/fail, connector usage
  → Flow-level: individual flow performance
```

### Reports Available

| Report | Contents | Refresh |
|---|---|---|
| **Runs** | Total runs, success/failure by day | Daily |
| **Usage** | Active flows, unique users, connector usage | Daily |
| **Created** | New flows created by day/week | Daily |
| **Errors** | Error categorization, top failing flows | Daily |

> **Limitation:** Analytics reports have a 28-day window and daily refresh. For longer retention and real-time monitoring, use Application Insights.

---

## Flow Error Monitoring Patterns

### Pattern 1: Error Notification Flow

Build a monitoring flow that alerts on failures:

```
Trigger: When a flow run fails (built-in trigger)
  → Get flow run details
  → Post to Teams channel:
      Flow: {flow name}
      Error: {error message}
      Run URL: {deep link to failed run}
      Time: {timestamp}
```

### Pattern 2: Daily Failure Summary

```
Trigger: Recurrence (daily at 8:00 AM)
  → List flow runs (last 24h, status = Failed)
  → Create HTML table (flow name, error, count)
  → Send email to ops team
```

### Pattern 3: Degradation Alert

```
Trigger: Recurrence (every 15 minutes)
  → List flow runs (last 15 min)
  → Calculate failure rate
  → If failure rate > 10%:
      → Post to Teams operations channel
      → Create incident ticket
```

---

## Desktop Flow Monitoring

Desktop flow runs have additional telemetry:

| Metric | Description |
|---|---|
| **Machine status** | Online, offline, busy |
| **Queue depth** | Runs waiting for available machine |
| **Session type** | Attended vs unattended |
| **UI action duration** | Time for individual UI interactions |
| **Screenshot on failure** | Capture of screen state when failure occurred |

### Monitor Desktop Flow Machines
```
Power Automate → Machines → [machine]
  → Status: Online/Offline
  → Queue: Pending runs
  → Recent runs: Success/failure history
```

---

## Performance Optimization from Telemetry

| Observation | Action |
|---|---|
| Flow duration increasing over time | Check data volume growth, pagination settings |
| Specific action consistently slow | Check connector throttling, consider parallel branches |
| High failure rate on specific connector | Check connector health, authentication, DLP policies |
| Apply to Each taking too long | Increase concurrency (max 50), or use batch operations |
| Frequent throttling (429) | Reduce polling frequency, implement exponential backoff |
| Queued runs growing | Add capacity (more Process licenses) or optimize flow duration |

---

## Anti-Patterns

- Relying only on 28-day run history (not enough for trend analysis)
- No Managed Environment (misses App Insights export for flow telemetry)
- No error notification flow (failures go unnoticed)
- Not monitoring desktop flow machine status (machines go offline silently)
- Ignoring throttling events (429 errors degrade reliability over time)
- No baseline performance metrics (can't detect degradation)
- Checking run history manually instead of automated monitoring
- Not using Automation Center (scattered monitoring across individual flows)
