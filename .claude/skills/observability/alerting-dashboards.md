# Alerting & Dashboards

## Overview

Application Insights alerting and Azure dashboards provide proactive monitoring for Power Platform workloads. This file covers alert rule configuration, action groups, KQL-based alerts for common Power Platform scenarios, and dashboard templates.

---

## Alert Rules

### Alert Rule Types

| Type | Trigger | Use Case |
|---|---|---|
| **Metric alert** | Metric crosses threshold | Server response time > 5s, failure rate > 10% |
| **Log alert** | KQL query returns results above threshold | Plugin failures > 5 in 15 min, specific error pattern |
| **Smart detection** | AI detects anomaly | Unusual spike in failures, performance degradation |
| **Availability** | URL ping fails | Dataverse endpoint health check |

### Create a Log Alert Rule

```
Azure Portal → Application Insights → [resource]
  → Alerts → + New alert rule
  → Condition → Custom log search
    → Query: [KQL query]
    → Threshold: [count > X]
    → Evaluation period: [5/15/30 min]
  → Actions → Select action group
  → Details → Alert name, severity, description
  → Create
```

---

## Action Groups

Action groups define who gets notified and how.

### Create an Action Group

```
Azure Portal → Monitor → Alerts → Action groups → + Create

  Name: "PP-Ops-Team"
  Actions:
    - Email: ops-team@contoso.com
    - Teams: Post to #pp-operations channel (via Logic App/webhook)
    - Azure Function: Trigger auto-remediation
    - Webhook: Post to ServiceNow/PagerDuty
```

### Notification Channels

| Channel | Setup | Best For |
|---|---|---|
| **Email** | Direct in action group | Critical alerts, audit trail |
| **Teams** | Webhook to Teams channel (via Logic App or Incoming Webhook connector) | Real-time team awareness |
| **SMS** | Direct in action group | On-call critical alerts |
| **Azure Function** | HTTP trigger function | Auto-remediation (restart flow, clear cache) |
| **Webhook** | HTTP POST to external URL | ITSM integration (ServiceNow, PagerDuty, Jira) |
| **ITSM** | ITSM connector in action group | Automatic incident creation |

### Teams Webhook Example

```json
// Incoming Webhook payload for Teams
{
  "@type": "MessageCard",
  "@context": "https://schema.org/extensions",
  "summary": "Power Platform Alert",
  "themeColor": "FF0000",
  "title": "Plugin Failure Spike",
  "sections": [{
    "activityTitle": "5 plugin failures in 15 minutes",
    "facts": [
      { "name": "Environment", "value": "Contoso-HR-Prod" },
      { "name": "Plugin", "value": "AccountPostCreate" },
      { "name": "Error", "value": "Timeout exceeded" },
      { "name": "Time", "value": "2026-03-23T14:30:00Z" }
    ]
  }],
  "potentialAction": [{
    "@type": "OpenUri",
    "name": "View in App Insights",
    "targets": [{ "os": "default", "uri": "https://portal.azure.com/#blade/..." }]
  }]
}
```

---

## KQL Alert Queries for Power Platform

### 1. Plugin Failure Spike

```kql
// Alert when > 5 plugin failures in 15 minutes
dependencies
| where timestamp > ago(15m)
| where type == "Plugin" and success == false
| summarize failCount = count() by name
| where failCount > 5
```
**Severity:** High | **Evaluation:** Every 5 min | **Period:** 15 min

### 2. Flow Failure Rate Above Threshold

```kql
// Alert when flow failure rate exceeds 10%
requests
| where timestamp > ago(30m)
| where customDimensions.resourceType == "CloudFlow"
| summarize total = count(), failures = countif(success == false)
| extend failureRate = round(100.0 * failures / total, 1)
| where failureRate > 10
```
**Severity:** High | **Evaluation:** Every 15 min | **Period:** 30 min

### 3. Slow Form Loads

```kql
// Alert when average MDA form load > 5 seconds
pageViews
| where timestamp > ago(30m)
| where duration > 5000
| summarize slowCount = count(), avgDuration = avg(duration)
| where slowCount > 10
```
**Severity:** Medium | **Evaluation:** Every 15 min | **Period:** 30 min

### 4. API Throttling Detected

```kql
// Alert on HTTP 429 responses (API throttling)
dependencies
| where timestamp > ago(15m)
| where resultCode == "429"
| summarize throttleCount = count() by tostring(customDimensions.connectorName)
| where throttleCount > 3
```
**Severity:** Medium | **Evaluation:** Every 5 min | **Period:** 15 min

### 5. Dataverse API Error Spike

```kql
// Alert on > 20 API errors in 15 minutes
requests
| where timestamp > ago(15m)
| where success == false
| where customDimensions.resourceType == "DataverseApi"
| summarize errorCount = count() by resultCode
| where errorCount > 20
```
**Severity:** High | **Evaluation:** Every 5 min | **Period:** 15 min

### 6. Code App JavaScript Errors

```kql
// Alert on > 5 unhandled JS errors in 30 minutes
exceptions
| where timestamp > ago(30m)
| where client_Type == "Browser"
| where customDimensions.source == "ReactErrorBoundary"
| summarize errorCount = count()
| where errorCount > 5
```
**Severity:** Medium | **Evaluation:** Every 15 min | **Period:** 30 min

### 7. Canvas App Data Call Slow

```kql
// Alert when canvas app data calls > 3 seconds average
dependencies
| where timestamp > ago(30m)
| where customDimensions.appType == "CanvasApp"
| summarize avgDuration = avg(duration), slowCount = countif(duration > 3000) by tostring(customDimensions.appName)
| where slowCount > 5
```
**Severity:** Low | **Evaluation:** Every 30 min | **Period:** 30 min

### 8. Flow Run Queue Growing

```kql
// Alert when queued flow runs exceed threshold
customEvents
| where timestamp > ago(15m)
| where name == "FlowRunQueued"
| summarize queuedCount = count()
| where queuedCount > 50
```
**Severity:** Medium | **Evaluation:** Every 15 min | **Period:** 15 min

---

## Dashboard Templates

### Azure Dashboard — Power Platform Operations

Create a shared dashboard for the operations team:

```
Azure Portal → Dashboard → + New dashboard → Blank dashboard

Add tiles:
  1. [Metric chart] Request count — last 24h, 5-min granularity
  2. [Metric chart] Failed requests — last 24h, 5-min granularity
  3. [Metric chart] Server response time (P95) — last 24h
  4. [Log query] Top 10 failing plugins (KQL)
  5. [Log query] Top 10 failing flows (KQL)
  6. [Log query] Slowest form loads (KQL)
  7. [Log query] API throttling events (KQL)
  8. [Metric chart] Exceptions — last 24h
```

### KQL Dashboard Tiles

#### Tile 1: Environment Health Summary
```kql
requests
| where timestamp > ago(24h)
| summarize
    total = count(),
    succeeded = countif(success == true),
    failed = countif(success == false),
    avgDuration = avg(duration)
| extend successRate = round(100.0 * succeeded / total, 1)
| project total, successRate, failed, avgDuration = round(avgDuration, 0)
```

#### Tile 2: Top Errors
```kql
exceptions
| where timestamp > ago(24h)
| summarize count() by outerMessage
| top 10 by count_
| render barchart
```

#### Tile 3: Flow Success/Failure Trend
```kql
requests
| where timestamp > ago(7d)
| where customDimensions.resourceType == "CloudFlow"
| summarize succeeded = countif(success == true), failed = countif(success == false) by bin(timestamp, 1h)
| render timechart
```

#### Tile 4: Plugin Performance Heatmap
```kql
dependencies
| where timestamp > ago(24h)
| where type == "Plugin"
| summarize p95 = percentile(duration, 95) by name, bin(timestamp, 1h)
| render timechart
```

---

## Azure Workbook (Advanced)

For more interactive dashboards, use Azure Workbooks:

```
Azure Portal → Application Insights → Workbooks → + New

Sections:
  1. Environment selector (parameter)
  2. Time range selector (parameter)
  3. Overall health (success rate, avg latency, error count)
  4. Flow performance (run count, failure rate, duration trend)
  5. Plugin performance (execution time, failure rate)
  6. Form performance (load time by entity)
  7. Top errors (table with drill-down)
  8. Capacity utilization (API requests, storage)
```

Workbooks support:
- Interactive parameters (filter by environment, time range, entity)
- Drill-down from summary to detail
- Export to PDF
- Scheduled email delivery

---

## Alert Tuning

### Avoid Alert Fatigue

| Problem | Solution |
|---|---|
| Too many low-severity alerts | Increase thresholds, use smart detection instead |
| Same alert firing repeatedly | Add cooldown period (suppress for 30 min after firing) |
| Alerts for transient issues | Increase evaluation window (15 min instead of 5 min) |
| Alerts nobody acts on | Remove or downgrade severity |
| Missing critical alerts | Add alerts for business-critical flows and APIs |

### Alert Severity Guidelines

| Severity | Criteria | Response Time | Notification |
|---|---|---|---|
| **Sev 0 — Critical** | Production down, data loss risk | Immediate | SMS + Teams + email + PagerDuty |
| **Sev 1 — Error** | Feature degraded, high error rate | < 1 hour | Teams + email |
| **Sev 2 — Warning** | Performance degraded, capacity concern | < 4 hours | Email |
| **Sev 3 — Informational** | Trend to watch, non-urgent | Next business day | Email digest |

---

## Anti-Patterns

- No alerts configured (reactive-only incident management)
- Alerts without action groups (alert fires, nobody is notified)
- Too many Sev 0 alerts (alert fatigue, real critical alerts ignored)
- No dashboard for stakeholders (telemetry exists but nobody looks at it)
- Dashboard without auto-refresh (stale data misleads)
- KQL queries without time bounds (slow queries, high cost)
- Alert on every single error (noise; alert on rates and trends instead)
- No cooldown on alerts (same alert fires every 5 minutes for the same issue)
- Teams notifications without deep links (recipient can't navigate to the issue)
- No regular alert review (alerts drift out of relevance over time)
