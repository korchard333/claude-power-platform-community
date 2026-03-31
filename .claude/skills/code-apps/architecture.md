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
| Routing | React Router v6 | With basename normalization |
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

### Router Basename Normalization
```tsx
// router.tsx — REQUIRED for Power Apps hosting
import { createBrowserRouter } from "react-router-dom";

const basename = window.location.pathname.includes("index.html")
  ? new URL(".", window.location.href).pathname
  : "/";

const routes = [
  { path: "/", element: <HomePage /> },
  { path: "/contacts", element: <ContactsPage /> },
  { path: "/contacts/:id", element: <ContactDetailPage /> },
];

export const router = createBrowserRouter(routes, { basename });
```

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
