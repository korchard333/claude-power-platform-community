---
name: power-pages
description: "Power Pages (External Portals). Use when: building portals, web roles, table permissions, Liquid templating, entity lists, entity forms, web forms, Microsoft Entra ID B2C authentication, portal JavaScript, site settings, content snippets."
---

# Skill: Power Pages (External Portals)

## When to Use
Trigger when building external-facing websites on Dataverse — customer portals, partner portals, self-service portals, community forums, or any authenticated web experience exposing Dataverse data to external users.

---

## When to Use Power Pages vs Alternatives

| Scenario | Best Choice | Why |
|---|---|---|
| External customer self-service portal | **Power Pages** | Built-in Dataverse integration, external auth |
| Internal business app | Model-Driven or Canvas App | Simpler, no portal overhead |
| Public marketing website | Azure Static Web Apps / WordPress | Power Pages is overkill |
| External API for partners | Custom Connector + APIM | No UI needed |
| Complex custom frontend for externals | Code App + Microsoft Entra ID B2C | Full React control |
| Simple form intake from externals | Power Pages or Microsoft Forms | Depends on data destination |

---

## Architecture Overview

```
External User (Browser)
  │
  ├── Authentication (Microsoft Entra ID B2C, local, SAML, OAuth)
  │
  ├── Power Pages Runtime
  │   ├── Pages (HTML + Liquid templating)
  │   ├── Entity Lists (data grids)
  │   ├── Entity Forms (single-record CRUD)
  │   ├── Web Forms (multi-step wizards)
  │   ├── Web Templates (reusable Liquid components)
  │   └── Content Snippets (editable text blocks)
  │
  ├── Security Layer
  │   ├── Web Roles (external user roles)
  │   └── Table Permissions (row-level access control)
  │
  └── Dataverse (data store)
      └── Contact = portal user record
```

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Web Roles & Table Permissions](web-roles-permissions.md)** — Web roles, table permission scopes (Global/Contact/Account/Parent/Self), page permissions, Append/AppendTo rules
- **[Liquid Templating](liquid-templating.md)** — Variables, conditionals, loops, FetchXML in Liquid, Web API in Liquid, content snippets
- **[Entity Lists, Forms & Web Forms](entity-lists-forms.md)** — Entity lists (data grids), entity forms (single-record CRUD), form metadata overrides, web forms (multi-step wizards)
- **[Authentication](authentication.md)** — Identity providers, Microsoft Entra ID B2C setup, Contact = User model, auth in Code Sites
- **[Custom JavaScript & Portal Web API](javascript-webapi.md)** — Entity form scripts, client-side AJAX via Portal Web API, enabling Web API via site settings, Client APIs (Wave 1 2026) for Form/List/User/Web API
- **[Code Sites (SPA)](code-sites.md)** — Framework reference, PAC CLI workflow, Web API client pattern (anti-forgery token), service patterns, lookup rules, table permissions for Code Sites
- **[Agent API](agent-api.md)** — Agent API for Power Pages (March 2026), custom chat experiences backed by Copilot Studio agents, API endpoints, authentication, custom UI

---

## Site Settings (Key Configuration)

| Setting | Value | Purpose |
|---|---|---|
| `Authentication/Registration/Enabled` | `true` | Allow new user registration |
| `Authentication/Registration/RequiresConfirmation` | `true` | Email verification required |
| `Authentication/Registration/RequiresInvitation` | `true` | Invitation-only portal |
| `Webapi/[table]/enabled` | `true` | Enable Web API for table |
| `Webapi/[table]/fields` | `field1,field2` | Allowed fields via Web API |
| `Search/Enabled` | `true` | Enable global search |
| `HTTP/X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |

---

### CLI Site Management (Wave 1 2026)

> **Preview (Wave 1 2026):** Create and delete Power Pages sites from the command line.

| Command | Description |
|---|---|
| `pac pages create-site` | Create a new site (CI/CD automation, environment provisioning) |
| `pac pages delete-site` | Delete a site (cleanup of test/temporary sites) |

---

## ALM for Power Pages

```
Power Pages sites are solution-aware:
  - Site + all metadata included in solution export
  - Deploy via managed solution like any Power Platform component
  - Site Settings, Web Roles, Table Permissions travel with the solution

Per-environment configuration:
  - Authentication provider settings differ per environment
  - Use site settings + environment variables for environment-specific values
  - B2C tenant may differ between dev/test/prod
```

---

## Performance

- Enable **CDN** (Content Delivery Network) in portal admin for static assets
- Enable **server-side caching** for entity lists and web templates
- Use `{% substitution %}` blocks for content that should NOT be cached
- Minimize FetchXML queries in Liquid — each one is a Dataverse round-trip
- Use Portal Web API for client-side data loading (reduces server rendering)
- Set appropriate page sizes on entity lists (don't load 100+ records)

---

## Server Logic (Wave 1 2026)

> **GA (Wave 1 2026):** Secure server-side custom logic in Power Pages using TypeScript/JavaScript.

Server logic enables custom server-side code execution within Power Pages — no Azure Functions required. Key capabilities:
- TypeScript/JavaScript — familiar languages
- `pac pages` CLI authoring via VS Code
- Web role-scoped API access — endpoints respect web roles
- Dataverse access — read/write with elevated or user-scoped permissions

| Scenario | Best Choice | Why |
|---|---|---|
| Simple field validation | Entity form metadata | No code needed |
| Complex business rules on submit | **Server logic** | Secure, server-side, no Azure dependency |
| External API integration | **Server logic** or Azure Functions | Server logic if simple; Functions for complex orchestration |
| Client-side interactivity | Client APIs / JavaScript | Runs in browser |

**Impact:** Reduces the need for Azure Functions as a backend-for-frontend layer for portal-scoped business logic.

---

## Web Application Firewall (WAF) — Preview

- DDoS protection and bot mitigation
- OWASP rule sets for common attack patterns
- Configurable via Power Platform Admin Center
- Available as a preview feature — evaluate for production readiness

---

## Anti-Patterns

- No table permissions defined (users see nothing — silent failure)
- Global scope table permissions on sensitive data (everyone sees everything)
- Using Dataverse security roles for portal access (they don't apply — use web roles + table permissions)
- Direct DOM manipulation with jQuery when entity form metadata would suffice
- Hardcoded record GUIDs in Liquid templates
- Not enabling CSRF token validation on Web API calls (`__RequestVerificationToken`)
- Missing `HTTP/X-Frame-Options` site setting (clickjacking vulnerability)
- Authentication without email verification (spam accounts)
- Not testing as anonymous user (unauthenticated page exposure)
- Complex business logic in client-side JavaScript (should be in plugins or flows)
- FetchXML queries in Liquid without `top` limit (unbounded queries)
- Embedding secrets in web templates (visible in page source)
- Using polymorphic lookups in parent-child table permissions (not supported)
- Not associating web roles with table permissions (permissions without roles are ineffective)

---

## Power Pages Plugin for GitHub Copilot / Claude Code

A Power Pages plugin is available (preview) that provides 9 skills for building Power Pages
Code Sites from AI-assisted CLI tools:

| # | Skill | Command | Description |
|---|---|---|---|
| 1 | Create site | `/create-site` | Scaffolds a site (React/Vue/Angular/Astro), applies design, builds pages |
| 2 | Deploy site | `/deploy-site` | Builds and uploads via PAC CLI |
| 3 | Activate site | `/activate-site` | Provisions website record and assigns public URL |
| 4 | Set up data model | `/setup-datamodel` | Creates Dataverse tables, columns, relationships |
| 5 | Add sample data | `/add-sample-data` | Populates tables with realistic test records |
| 6 | Integrate Web API | `/integrate-webapi` | Generates typed API client, services, table permissions |
| 7 | Set up authentication | `/setup-auth` | Adds sign-in/sign-out and role-based access |
| 8 | Create web roles | `/create-webroles` | Generates web role YAML files |
| 9 | Add SEO | `/add-seo` | Generates robots.txt, sitemap.xml, meta tags |

Install from `microsoft/power-platform-skills`. Targets SPA (single-page application) Power Pages Code Sites.

More info: [Create a code site using Claude Code](https://learn.microsoft.com/power-pages/configure/create-code-site-using-claude-code)

---

## Related Skills

- `security` — Web roles and table permissions for portal access
- `dataverse-web-api` — Portal Web API calls to Dataverse
- `copilot-studio` — Copilot Studio agents that back Power Pages chat experiences

---

## Eval Files

The `evals/` directory contains 11 evaluation test cases for Power Pages skill validation — covering site creation, authentication setup, web roles, data modeling, Web API integration, SEO, permissions auditing, deployment, and testing workflows.
