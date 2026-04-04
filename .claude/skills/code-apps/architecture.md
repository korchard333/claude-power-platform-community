# Code Apps — Architecture, Auth & Project Structure

## Tech Stack Reference

| Layer | Technology | Notes |
|---|---|---|
| Language | TypeScript (strict mode) | Primary language for all code |
| UI Framework | React 18/19 | Functional components only |
| Build Tool | Vite + `@microsoft/power-apps` plugin | Dev server + Power Apps integration |
| Styling | Tailwind CSS + shadcn/ui | Starter template default |
| Styling (alt) | Fluent UI v9 | For Microsoft-branded apps |
| Client State | Zustand | Cross-component state |
| Server State | TanStack Query v5 | Caching, background refresh, mutations |
| Routing | React Router v6/v7 | Hash-based routing required (see Critical Patterns) |
| Tables | TanStack Table | Sorting, filtering, pagination |
| Charts | Recharts | Data visualization |
| Notifications | Sonner | Toast notifications |
| Testing | Playwright | E2E testing |
| CLI | PAC CLI + `@microsoft/power-apps` npm | Scaffolding, data sources, deployment |

---

## Project Structure

```
my-app/
  public/
  src/
    assets/                   # Images, fonts, static files
    components/
      ui/                     # shadcn/ui primitives (Button, Card, etc.)
      [Feature]Card.tsx       # Feature-specific presentation components
      [Feature]List.tsx
      [Feature]Form.tsx
    hooks/
      use[Feature].ts         # Business logic hooks
      use[Feature]s.ts        # List/collection hooks
    theme/                    # Fluent UI V9 theme (when using Fluent — see fluent-ui.md)
      index.ts                # createLightTheme/createDarkTheme with BrandVariants
      tokens.ts               # App-specific semantic color tokens
      ThemeContext.tsx         # Dark/light/system mode provider
    lib/
      utils.ts                # Utility functions (cn(), formatters)
    pages/
      [Route]Page.tsx         # Route-level page components
    providers/
      query-provider.tsx      # TanStack Query client setup
      theme-provider.tsx      # Theme context (light/dark)
      sonner-provider.tsx     # Toast notification provider
    generated/                # PAC CLI auto-generated (NEVER EDIT)
      [entity]Service.ts      # Typed service for each data source
    App.tsx                   # Provider stack root
    main.tsx                  # React createRoot entry point
    router.tsx                # Routes + basename normalization
    index.css                 # Tailwind directives + global styles
  index.html
  vite.config.ts              # Vite config with Power Apps plugin
  power.config.json           # PAC CLI metadata (auto-generated)
  tailwind.config.ts
  tsconfig.json
  package.json
```

---

## Three-Layer Architecture

### Layer 1: Presentation (`components/`)
```tsx
// RULES:
// - Receives ALL data via props
// - User actions flow up via callback props
// - ZERO imports from generated/ or service layers
// - ZERO business logic (no filtering, sorting, transforming data)
// - Handles rendering: loading, error, empty, and data states

interface ContactCardProps {
  contact: Contact;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{contact.fullname}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{contact.emailaddress1}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => onEdit(contact.id)}>Edit</Button>
        <Button variant="destructive" onClick={() => onDelete(contact.id)}>Delete</Button>
      </CardFooter>
    </Card>
  );
}
```

### Layer 2: Business Logic (`hooks/`)
```tsx
// RULES:
// - The ONLY layer that calls generated services
// - Wraps all API calls in try/catch
// - Exposes loading, error, and data states
// - Uses TanStack Query for server state
// - Uses Zustand for shared client state

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactService } from "../generated/contactService";
import { toast } from "sonner";

export function useContacts() {
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ["contacts"],
    queryFn: () =>
      contactService.getAll({
        select: ["fullname", "emailaddress1", "telephone1", "statecode"],
        top: 50,
        orderBy: "fullname asc",
        filter: "statecode eq 0",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
    onError: (err: Error) => {
      toast.error(`Delete failed: ${err.message}`);
    },
  });

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error?.message ?? null,
    deleteContact: deleteMutation.mutateAsync,
  };
}
```

### Layer 3: Data Access (`generated/`)
```
// AUTO-GENERATED by: pac code add-data-source -a dataverse -t contact
// NEVER manually edit these files
// They are overwritten on each pac code add-data-source run
// They handle: authentication, connector routing, API formatting
```

---

## Authentication Model

Code Apps run inside the Power Apps host shell. **Authentication is fully automatic** — the host handles Entra ID sign-in and token acquisition. Generated services inherit the current user's authentication context.

```
User → Power Apps host (Entra ID login) → Code App iframe
  └── Generated services → Connectors → Dataverse / other APIs
       (auth token managed by host, no developer action needed)
```

### Key Facts
- You **never** handle login, tokens, or auth headers in Code App code
- Generated services automatically use the signed-in user's identity
- Service calls respect the user's Dataverse security roles
- There is no way to call a raw API endpoint without going through a connector
- Published Code Apps are publicly accessible (HTML/JS/CSS) — **never embed secrets**

### Calling Non-Dataverse APIs
```
Option 1: pac code add-data-source -c {connectorName}   # Add connector via CLI
Option 2: Custom API in Dataverse → call via generated service
Option 3: Power Automate flow triggered from Code App (see Integration Patterns below)
```

---

## Environment Variable Access

Code Apps cannot directly read Dataverse environment variables. Use one of these patterns:

### Pattern 1: Custom API that returns config (Recommended)
```tsx
// Hook calls a Custom API that reads env vars server-side
export function useAppConfig() {
  return useQuery({
    queryKey: ["app-config"],
    queryFn: () => configService.getAppConfig(),
    staleTime: Infinity, // Config rarely changes
  });
}
// Custom API (plugin) reads env var definitions and returns values
// This keeps env var logic server-side where it belongs
```

### Pattern 2: Dataverse query for env var values
```tsx
// Query the Environment Variable Value table directly
// Requires user to have Read privilege on environmentvariablevalue
export function useEnvVar(schemaName: string) {
  return useQuery({
    queryKey: ["env-var", schemaName],
    queryFn: () =>
      envVarService.getAll({
        select: ["value"],
        filter: `EnvironmentVariableDefinitionId/schemaname eq '${schemaName}'`,
        top: 1,
      }),
    staleTime: Infinity,
  });
}
```

---

## Critical Patterns

### ⚠️ CRITICAL: Use Hash Router, NOT Browser Router

`createBrowserRouter` with basename normalization causes **404 errors** inside the Power Apps host. The URL path won't be `/` — it's the Power Apps host path — which browser router cannot match.

**Always use `createHashRouter`** — hash-based routing avoids path conflicts with the Power Apps host URL structure entirely.

```tsx
// router.tsx — REQUIRED for Power Apps hosting
import { createHashRouter, Outlet } from "react-router-dom";

// Layout route pattern: shared nav component wrapping all pages
function Layout() {
  return (
    <div>
      <NavBar />
      <Outlet />
    </div>
  );
}

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "contacts", element: <ContactsPage /> },
      { path: "contacts/:id", element: <ContactDetailPage /> },
    ],
  },
]);
```

> **Reference:** Official Microsoft [FluentSample](https://github.com/microsoft/PowerAppsCodeApps/samples/FluentSample) uses React Router v6 with `<Routes>`/`<Route>` (component-based API). React Router v7 also works. The canonical pattern is `createHashRouter` with layout routes for shared navigation (tab bars, sidebars).

> **⚠️ Don't use `createBrowserRouter` with basename normalization** — this pattern is documented in older skill files and does NOT work in deployed Code Apps.

### Provider Stack (App.tsx)
```tsx
export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <SonnerProvider />
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ThemeProvider>
  );
}
```

### Dataverse Lookup Handling
```tsx
// READING a lookup value (returns GUID)
const accountId = contact._accountid_value; // GUID string

// WRITING a lookup value (OData bind syntax)
const updatePayload = {
  "accountid@odata.bind": `/accounts(${selectedAccountId})`,
};

// RESOLVING a lookup (on-demand, not eager)
function useLookupResolver(entitySet: string, id: string | null) {
  return useQuery({
    queryKey: [entitySet, id],
    queryFn: () => fetchEntity(entitySet, id!, { select: ["name"] }),
    enabled: !!id,
  });
}
```

---

## Known Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| No Power Apps mobile support | Cannot target mobile users | Use Canvas App for mobile scenarios |
| No Solution Packager support | Cannot decompose into source-controlled XML | Manage source via Git on the web app code directly |
| No native Git integration | Cannot use Power Platform Git sync | Standard Git workflow on source code |
| Published code is publicly accessible | Security risk if secrets embedded | NEVER embed secrets; fetch at runtime via authenticated connectors |
| Premium licensing required | End-users need Power Apps Premium | Factor into licensing budget |
| No SharePoint forms integration | Cannot embed as SharePoint form | Use Canvas App for SharePoint forms |
| No Power BI data integration | Cannot use PowerBIIntegration function | Can embed Code App in Power BI via Power Apps Visual |
| **Generated services don't support `$expand`** | Cannot eager-load related records in one call | Fetch related data separately, or use Dataverse auto-populated lookup name fields (e.g., `_ds_engagementid_value` returns the GUID; `ds_engagementidname` is auto-returned without `$select`) |

---

## Deployment Prerequisite

**Before first `pac code push`, an environment admin must enable Code App operations:**

1. Power Platform Admin Center → select the environment
2. Settings → Features
3. Enable **"Code app operations"** toggle

Without this, `pac code push` returns `403 CodeAppOperationNotAllowedInEnvironment`. This setting is OFF by default and cannot be enabled by non-admins. Check this before starting any Code App build.

---

## Embedding in Model-Driven Apps

### ⚠️ Code Apps Are NOT Custom Pages

`pagetype=custom` in the sitemap URL will show "Page does not exist". Custom pages are canvas-based; Code Apps are separate.

**Supported embedding methods:**

#### Option A: URL SubArea (simplest — opens in new tab)
```xml
<SubArea Id="sa_timesheet" Url="https://apps.powerapps.com/play/{app-id}?tenantId={tenant-id}"
         Title="Weekly Timesheet" IntroducedVersion="1.0">
  <Titles><Title LCID="1033" Title="Weekly Timesheet"/></Titles>
</SubArea>
```

#### Option B: HTML Web Resource iframe (embedded in MDA)

Create an HTML web resource with an iframe pointing to the Code App play URL:

```html
<!DOCTYPE html>
<html>
<head>
  <style>html, body, iframe { margin:0; padding:0; width:100%; height:100%; border:none; }</style>
</head>
<body>
  <iframe src="https://apps.powerapps.com/play/{app-id}?tenantId={tenant-id}"
          allow="microphone; camera; geolocation"
          title="Weekly Timesheet">
  </iframe>
</body>
</html>
```

**Requirements for Option B:**
1. **Hash router required** — the iframe src URL's path won't be `/`, so `createBrowserRouter` fails with 404. Always use `createHashRouter`.
2. **CSP `frame-ancestors`** — the Code App must allow the org's Dynamics URL as a frame ancestor. The Power Apps host normally handles this, but custom HTML web resource iframes may require CSP configuration in the Power Platform Admin Center.
3. **Generated services** — should work inside the iframe because the iframe is served from the Power Apps host domain.

> **Planning note:** The deploy-to-MDA step involves admin settings, CSP configuration, and router adjustments. Budget accordingly.

---

## Data Layer: Critical Patterns

### Generated Service Limitations

**Generated services do NOT support `$expand`.** The `IGetAllOptions` interface only supports: `select`, `filter`, `orderBy`, `top`, `skip`. For related data, use:
1. **Lookup name fields** — Dataverse auto-returns `{column}name` annotations alongside lookup GUIDs. E.g., selecting `_ds_engagementid_value` also gives you `ds_engagementidname` and `ds_engagementidtype` automatically — **without** including them in `$select`.
2. **Separate query** — fetch the related record in a second hook call.

### ⚠️ NEVER Include Annotation Fields in `$select`

Lookup "name" fields (e.g., `ds_clientidname`, `ds_engagementidname`) are **OData annotations**, not real columns. The generated model interfaces include them, but:

- **Including them in `$select` causes HTTP 400** — "Could not find property"
- They are returned **automatically** alongside the lookup GUID field when you select `_ds_clientid_value`

```tsx
// WRONG — ds_clientidname is not a real column
contactService.getAll({
  select: ["ds_name", "_ds_clientid_value", "ds_clientidname"], // ← 400 error
});

// CORRECT — annotation is returned automatically with the lookup GUID
contactService.getAll({
  select: ["ds_name", "_ds_clientid_value"], // ds_clientidname returned automatically
});
```

### Always Check `result.success`

`IOperationResult.data` is `[]` on failure — failures are **completely silent** without the check. **Always** check `result.success`:

```tsx
const result = await service.getAll({ select: ["name"] });
if (!result.success) {
  // result.data is [] here — without this check, UI silently shows empty
  throw new Error(result.error?.message ?? "Data load failed");
}
return result.data;
```

In TanStack Query, throw from `queryFn` so the query enters error state:
```tsx
queryFn: async () => {
  const result = await timeEntryService.getAll({ select: [...] });
  if (!result.success) throw new Error(result.error?.message ?? "Load failed");
  return result.data;
}
```

### Type Conversion Patterns

Dataverse-generated TypeScript types don't match what the API expects for writes:

| Field Type | Generated TS Type | Read As | Write As |
|---|---|---|---|
| Decimal / Currency | `string` | `parseFloat(value)` | `number` (not string) |
| Two-Option (Boolean) | `0 \| 1` | `value === 1` | `true` / `false` (boolean) |
| Lookup GUID | `string` | as-is | `string` |

```tsx
// READING — convert from generated types
const duration = parseFloat(entry.ds_duration as string);
const isBillable = entry.ds_isbillable === 1;

// WRITING — convert to API-expected types
await timeEntryService.update(id, {
  ds_duration: parseFloat(durationString),   // number, not string
  ds_isbillable: isBillable,                 // boolean, not 0/1
});
```

### Current User Resolution

Use `getContext()` from `@microsoft/power-apps/app` to resolve the signed-in user:

```tsx
import { getContext } from "@microsoft/power-apps/app";

async function getCurrentUserId(): Promise<string> {
  const context = getContext();
  const currentUserUpn = context.user?.email ?? context.user?.name;

  // Match UPN to a team member record
  const result = await teamMemberService.getAll({
    select: ["ds_teammemberid"],
    filter: `ds_email eq '${currentUserUpn}'`,
    top: 1,
  });
  if (!result.success || result.data.length === 0) {
    throw new Error("Current user not found in team members");
  }
  return result.data[0].ds_teammemberid;
}
```

---

## Date Handling

### ⚠️ UTC+ Timezone Off-By-One Bug

`new Date(2026, 2, 30).setHours(0, 0, 0, 0).toISOString().slice(0, 10)` returns the **previous day** on UTC+10/+11 machines (midnight local = previous day in UTC).

**Always use noon (12:00) for date-only operations:**

```tsx
// WRONG — midnight local produces wrong date in UTC+ timezones
const date = new Date(year, month, day);
date.setHours(0, 0, 0, 0);
return date.toISOString().slice(0, 10); // Off by one day in AU/APAC

// CORRECT — noon local stays on the same calendar date in all practical timezones
const date = new Date(year, month, day);
date.setHours(12, 0, 0, 0);
return date.toISOString().slice(0, 10); // ✅ Stable across UTC-11 to UTC+12
```

This affects all date utilities: `getMonday()`, `getWeekDates()`, date comparisons, and any date-to-string conversions for Dataverse filters.

---

## Debugging Code Apps

### Binary Isolation Testing

When a Code App appears non-interactive or shows no data, isolate systematically:

1. **Strip to template** — remove all business logic, confirm bare React renders
2. **Add Fluent UI** — confirm FluentProvider and basic components work
3. **Add Router** — confirm hash routing and page transitions work
4. **Add QueryClient** — confirm TanStack Query doesn't error in this environment
5. **Add real data hooks** — confirm service calls succeed
6. **Add specific feature** — narrow to the failing component

Each `pac code push` takes ~30 seconds, making rapid iteration viable.

### Common Silent Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Empty data, no errors | `result.success` not checked | Add success guard, throw on failure |
| HTTP 400 on data fetch | Annotation field in `$select` | Remove `{field}name`/`{field}type` from select |
| HTTP 400 on create/update | Decimal sent as string | Use `parseFloat()` / `number` for Edm.Decimal fields |
| Filter returns no results | Hardcoded ID that isn't a valid entity GUID | Use `getContext()` to resolve real IDs |
| "Could not find property" | Wrong field name in select/filter | Verify logical names vs display names |

---

## Reference Architecture

The official Microsoft Code Apps sample is **FluentSample** at `github.com/microsoft/PowerAppsCodeApps/samples/FluentSample`. Key patterns from this reference:
- React 18 + React Router v6 with `<Routes>`/`<Route>` component API
- Fluent UI v9 with `FluentProvider`
- TanStack Query v5 with `staleTime: 5 * 60 * 1000` and `refetchOnWindowFocus: false`
- Layout component with `Link` navigation (sidebar/tab pattern)
- Lazy-loaded routes with `React.lazy` + `<Suspense>`

Use this as the canonical reference before building any Code App.
