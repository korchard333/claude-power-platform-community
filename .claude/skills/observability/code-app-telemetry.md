# Code App Telemetry

## Overview

Code Apps (React + TypeScript + Vite) integrate with Application Insights via the `@microsoft/applicationinsights-web` npm package and the Power Apps platform logger. This gives you React error boundaries, custom events, performance marks, and platform session/network metrics — all flowing to App Insights.

---

## Setup

### Step 1: Install the SDK

```bash
npm install @microsoft/applicationinsights-web
```

### Step 2: Initialize Application Insights

Create a telemetry service module:

```typescript
// src/services/telemetry.ts
import { ApplicationInsights } from "@microsoft/applicationinsights-web";

let appInsights: ApplicationInsights | null = null;

export function initTelemetry(connectionString: string): ApplicationInsights {
  if (appInsights) return appInsights;

  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: false, // We handle routing manually
      disableFetchTracking: false,    // Track fetch calls automatically
      enableCorsCorrelation: true,    // Correlate cross-origin requests
      enableRequestHeaderTracking: true,
      enableResponseHeaderTracking: true,
      autoTrackPageVisitTime: true,
    },
  });

  appInsights.loadAppInsights();
  return appInsights;
}

export function getAppInsights(): ApplicationInsights | null {
  return appInsights;
}

export function trackEvent(name: string, properties?: Record<string, string>) {
  appInsights?.trackEvent({ name }, properties);
}

export function trackException(error: Error, properties?: Record<string, string>) {
  appInsights?.trackException({ exception: error }, properties);
}

export function trackMetric(name: string, value: number, properties?: Record<string, string>) {
  appInsights?.trackMetric({ name, average: value }, properties);
}

export function trackPageView(name: string) {
  appInsights?.trackPageView({ name });
}
```

### Step 3: Initialize in App Entry Point

```typescript
// src/main.tsx
import { initTelemetry } from "./services/telemetry";

// Option A: Hardcoded per-environment (simplest for single environment)
const CONNECTION_STRING = import.meta.env.VITE_APP_INSIGHTS_CONNECTION_STRING;

// Option B: Fetch from Dataverse settings table (recommended for multi-env)
// See "Connection String Management" section below

if (CONNECTION_STRING) {
  initTelemetry(CONNECTION_STRING);
}
```

### Step 4: Configure Platform Logger

The Power Apps platform emits session and network metrics. Forward them to App Insights:

```typescript
// src/config/platformLogger.ts
import { setConfig } from "@microsoft/power-apps/app";
import type { Metric } from "@microsoft/power-apps/telemetry";
import { getAppInsights } from "../services/telemetry";

export function configurePlatformLogger() {
  setConfig({
    logger: {
      logMetric: (value: Metric) => {
        const ai = getAppInsights();
        if (ai) {
          ai.trackEvent(
            { name: value.type },
            value.data as Record<string, string>
          );
        }
      },
    },
  });
}
```

Call this once during app initialization:

```typescript
// src/main.tsx
import { configurePlatformLogger } from "./config/platformLogger";

configurePlatformLogger();
```

### Platform Metrics Emitted

| Metric Type | Description |
|---|---|
| `sessionLoadSummary` | Overall session load performance |
| `networkLoadSummary` | Network request performance summary |

---

## Connection String Management

Environment variables are not yet directly supported in Code Apps. Options:

### Option A: Build-Time Environment Variable (Single Deploy Target)
```bash
# .env.production
VITE_APP_INSIGHTS_CONNECTION_STRING=InstrumentationKey=...;IngestionEndpoint=...
```
**Limitation:** Connection string baked into the build. Different builds needed per environment.

### Option B: Dataverse Settings Table (Recommended)
```typescript
// src/services/settings.ts
import { getContext } from "@microsoft/power-apps/host";

interface AppSettings {
  appInsightsConnectionString: string;
}

export async function loadSettings(): Promise<AppSettings> {
  const context = getContext();
  const orgUrl = context.orgUrl;

  const response = await fetch(
    `${orgUrl}/api/data/v9.2/contoso_appsettingses?$filter=contoso_key eq 'AppInsightsConnectionString'&$select=contoso_value`,
    {
      headers: {
        "OData-Version": "4.0",
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();
  return {
    appInsightsConnectionString: data.value?.[0]?.contoso_value ?? "",
  };
}
```

```typescript
// src/main.tsx
import { loadSettings } from "./services/settings";
import { initTelemetry } from "./services/telemetry";
import { configurePlatformLogger } from "./config/platformLogger";

async function bootstrap() {
  const settings = await loadSettings();
  if (settings.appInsightsConnectionString) {
    initTelemetry(settings.appInsightsConnectionString);
  }
  configurePlatformLogger();

  // ... render React app
}

bootstrap();
```

### Option C: Environment Detection via getContext()
```typescript
import { getContext } from "@microsoft/power-apps/host";

function getConnectionString(): string {
  const context = getContext();
  const orgUrl = context.orgUrl;

  // Map org URL to connection string
  const connectionStrings: Record<string, string> = {
    "https://contoso-dev.crm6.dynamics.com": "InstrumentationKey=dev-key;...",
    "https://contoso-test.crm6.dynamics.com": "InstrumentationKey=test-key;...",
    "https://contoso-prod.crm6.dynamics.com": "InstrumentationKey=prod-key;...",
  };

  return connectionStrings[orgUrl] ?? "";
}
```
**Limitation:** Connection strings in code. Option B (Dataverse table) is more maintainable.

---

## React Error Boundary

Catch React rendering errors and send to App Insights:

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from "react";
import { trackException } from "../services/telemetry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackException(error, {
      componentStack: errorInfo.componentStack ?? "unknown",
      source: "ReactErrorBoundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert">
          <h2>Something went wrong</h2>
          <p>The application encountered an unexpected error. Please try refreshing.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrap your app:
```typescript
// src/App.tsx
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
```

---

## Custom Telemetry Patterns

### Track Page/Route Navigation

```typescript
// src/hooks/usePageTracking.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../services/telemetry";

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
}
```

### Track User Actions

```typescript
// In a component
import { trackEvent } from "../services/telemetry";

function handleSubmit(formData: OrderForm) {
  trackEvent("OrderSubmitted", {
    itemCount: String(formData.items.length),
    totalAmount: String(formData.total),
    paymentMethod: formData.paymentMethod,
  });

  // ... submit logic
}
```

### Track Data Query Performance

```typescript
// src/hooks/useTrackedQuery.ts
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { trackMetric } from "../services/telemetry";

export function useTrackedQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const start = performance.now();
      const result = await queryFn();
      const duration = performance.now() - start;

      trackMetric(`query_${key[0]}`, duration, {
        queryKey: key.join("/"),
      });

      return result;
    },
    ...options,
  });
}
```

### Track Bundle Load Performance

```typescript
// src/main.tsx — after app renders
window.addEventListener("load", () => {
  const perfEntries = performance.getEntriesByType("navigation");
  if (perfEntries.length > 0) {
    const nav = perfEntries[0] as PerformanceNavigationTiming;
    trackMetric("AppLoadTime", nav.loadEventEnd - nav.startTime);
    trackMetric("DOMContentLoaded", nav.domContentLoadedEventEnd - nav.startTime);
    trackMetric("FirstByte", nav.responseStart - nav.requestStart);
  }
});
```

---

## KQL Queries for Code Apps

### Page View Distribution
```kql
pageViews
| where timestamp > ago(7d)
| where customDimensions.appType == "CodeApp"
| summarize viewCount = count() by name
| order by viewCount desc
| render piechart
```

### React Error Rate
```kql
exceptions
| where timestamp > ago(24h)
| where customDimensions.source == "ReactErrorBoundary"
| summarize errorCount = count() by outerMessage, tostring(customDimensions.componentStack)
| order by errorCount desc
```

### Data Query Performance
```kql
customMetrics
| where timestamp > ago(7d)
| where name startswith "query_"
| summarize avg_ms = avg(value), p95 = percentile(value, 95) by name
| order by p95 desc
```

### App Load Time Trend
```kql
customMetrics
| where timestamp > ago(30d)
| where name == "AppLoadTime"
| summarize avg_ms = avg(value), p95 = percentile(value, 95) by bin(timestamp, 1d)
| render timechart
```

---

## Anti-Patterns

- No error boundary (React errors crash the entire app with no telemetry)
- Initializing App Insights without connection string check (errors on missing config)
- Hardcoded connection string per environment (use Dataverse settings table)
- Not configuring platform logger (miss session and network metrics from Power Apps platform)
- Tracking PII in custom events (user email, phone numbers in telemetry properties)
- No page view tracking (can't understand user navigation patterns)
- Not tracking data query performance (slow queries invisible without measurement)
- Synchronous telemetry init blocking app render (use async bootstrap)
