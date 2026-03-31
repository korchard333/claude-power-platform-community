# Power Pages — Code Sites (SPA)

Code Sites are static single-page applications (React, Vue, Angular, Astro) deployed to Power Pages via PAC CLI. They replace traditional Liquid-based portals with modern frontend frameworks while leveraging Power Pages authentication, table permissions, and the Web API.

**NOT supported:** Server-rendered frameworks — Next.js, Nuxt.js, Remix, SvelteKit, Liquid.

## Framework Reference

| Framework | Build Tool | Router | Build Output | Public Dir | Index HTML |
|---|---|---|---|---|---|
| React | Vite | react-router-dom | `dist` | `public/` | `index.html` (project root) |
| Vue | Vite | vue-router | `dist` | `public/` | `index.html` (project root) |
| Angular | Angular CLI | @angular/router | `dist/__SITE_NAME__/browser` | `public/` | `src/index.html` |
| Astro | Astro | File-based + View Transitions | `dist` | `public/` | `src/layouts/*.astro` |

## PAC CLI Workflow

```powershell
# Upload built SPA to Power Pages
pac pages upload-code-site --rootPath ./dist

# Download existing code site
pac pages download-code-site

# List sites
pac pages list
```

## Web API Core Client Pattern

Code Sites access Dataverse via the Power Pages Web API (`/_api/`). Every mutating request requires an anti-forgery token.

```typescript
// src/shared/powerPagesApi.ts — key patterns

// Anti-forgery token management
const TOKEN_TTL_MS = 8 * 60 * 1000; // 8-min cache
let cachedToken: string | null = null;
let cachedTimestamp = 0;

const fetchAntiForgeryToken = async (): Promise<string> => {
  const now = Date.now();
  if (cachedToken && now - cachedTimestamp < TOKEN_TTL_MS) return cachedToken;
  const response = await fetch('/_layout/tokenhtml');
  const html = await response.text();
  // Parse token from hidden input value
  cachedToken = html.match(/value="([^"]+)"/)?.[1] ?? '';
  cachedTimestamp = now;
  return cachedToken;
};

// Every request includes __RequestVerificationToken header
const headers = await buildPowerPagesHeaders(); // adds token + Accept + Content-Type + Prefer
```

**Retry logic:** 3 retries with exponential backoff. On 403 → refresh anti-forgery token and retry. On 401 → session expired, redirect to login. On 429/5xx → transient error, backoff and retry.

## Web API Service Patterns

```typescript
// OData entity interface — matches raw Dataverse column names exactly
export interface ProductEntity {
  cr4fc_productid: string;
  cr4fc_name?: string;
  cr4fc_price?: number;
  _cr4fc_category_value?: string;         // Lookup GUID on GET
  [key: string]: unknown;                  // For formatted value annotations
}

// Clean domain type for UI consumption
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

// Entity-to-domain mapper
export const mapProduct = (e: ProductEntity): Product => ({
  id: e.cr4fc_productid,
  name: e.cr4fc_name ?? '',
  price: e.cr4fc_price ?? 0,
  category: getFormattedValue(e, '_cr4fc_category_value') ?? 'Uncategorized',
});

// Option set constants
export const PRODUCT_STATUS = { active: 100000000, inactive: 100000001 } as const;
```

## Lookup Property Rules

- **On GET:** `_<navigation>_value` returns the GUID. Include in `$select`. Use `@OData.Community.Display.V1.FormattedValue` for display name.
- **On POST/PATCH:** Use `NavigationProperty@odata.bind`: `"cr4fc_Category@odata.bind": "/cr4fc_categories(guid)"`. Setting `_value` directly causes "Undeclared Property" error.
- **To clear a lookup:** `"cr4fc_Category@odata.bind": null`

## Table Permissions for Code Sites

Code Sites respect the same Power Pages table permissions as Liquid sites.

| Scope | Code | Use Case |
|---|---|---|
| Global | 756150000 | Public reference data (read-only recommended) |
| Contact | 756150001 | "My records" — owned by logged-in user |
| Account | 756150002 | Records linked to user's parent account |
| Parent | 756150003 | Child records of accessible parent (`parententitypermission` + `parentrelationshipname`) |
| Self | 756150004 | User's own contact record (profile page) |

**Append/AppendTo for lookups:** When a table has lookup columns and `create` or `write` is enabled:
- Source table (with the lookup) needs `append: true`
- Target table needs `appendto: true`

## Site Settings for Web API

```
Webapi/<entity>/Enabled    = true         # Enable Web API for table
Webapi/<entity>/Fields     = field1,field2 # Allowed fields (whitelist)
```

Table permissions must also exist — the Web API respects them just like Liquid entity lists.
