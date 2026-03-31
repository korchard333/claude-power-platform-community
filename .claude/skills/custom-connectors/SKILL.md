---
name: custom-connectors
description: "Custom Connectors for Power Platform. Use when: building custom connectors, OpenAPI definitions, OAuth authentication, API Key auth, triggers (polling/webhook), connector policies, Azure APIM integration, DLP considerations."
---

# Skill: Custom Connectors

## When to Use
Trigger when building, configuring, or debugging custom connectors — reusable API wrappers that expose REST APIs as Power Platform connectors for use in Power Automate, Power Apps, and Copilot Studio.

---

## When to Use Custom Connectors vs Alternatives

| Scenario | Use | Why |
|---|---|---|
| Standard connector exists | **Standard connector** | Zero maintenance, Microsoft-supported |
| REST API used in one flow only | **HTTP action** in Power Automate | Simpler, no connector overhead |
| REST API used across multiple flows/apps | **Custom connector** | Reusable, typed, discoverable |
| REST API with complex auth (OAuth 2.0) | **Custom connector** | Auth handled once, shared across all uses |
| High-volume API calls needing throttling | **Custom connector + Azure APIM** | APIM handles rate limiting, caching, monitoring |
| On-premises API (no public endpoint) | **Custom connector + On-premises Data Gateway** | Gateway bridges private network |

---

## Project Structure

```
custom-connectors/
  contoso-erp/
    apiDefinition.swagger.json    # OpenAPI 2.0 definition
    apiProperties.json            # Connector metadata + policies
    icon.png                      # 160x160 connector icon
    settings.json                 # Test settings
  README.md
```

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[OpenAPI Definition](openapi-definition.md)** — Swagger structure, action definitions, schema definitions, x-ms extensions, dynamic values/schema
- **[Authentication](authentication.md)** — API Key, OAuth 2.0 (Authorization Code), Azure AD / Entra ID, apiProperties.json configuration
- **[Triggers](triggers.md)** — Polling triggers (batch), webhook triggers, deregistration endpoint, trigger hints
- **[Policies & APIM](policies-apim.md)** — Connector policies (set header, route request), Azure APIM integration, DLP classification, CLI workflow, solution-aware connectors

---

## Best Practices

- Always use `x-ms-summary` on every parameter and property (maker-friendly display names)
- Always set `x-ms-visibility: "internal"` for technical parameters users shouldn't see
- Always define response schemas (Power Automate needs them for dynamic content)
- Use `x-ms-dynamic-values` for dropdown parameters (don't force users to type GUIDs)
- Test with both Power Automate and Canvas App (behaviour can differ)
- Version your connector: `host` + `basePath` should include version (e.g., `/v2/`)
- Icon must be exactly 160x160px PNG with brand colour background

---

## Anti-Patterns

- Missing `x-ms-summary` on parameters (users see raw field names)
- Missing response schemas (dynamic content unavailable in flow designer)
- Using `x-ms-visibility: "internal"` on required user inputs (hides needed fields)
- Hardcoded hostnames in OpenAPI definition (use connection parameter for environment switching)
- Not classifying connector in DLP policy (blocks use with Dataverse/SharePoint)
- Polling triggers without proper 202 handling (triggers fire with empty data)
- Not including connector in solution (breaks ALM)
- Using Basic auth for production connectors (use OAuth 2.0 or API key)
- Missing error response definitions (poor error handling in flows)

---

## Related Skills

- `power-automate` — Flows consume custom connectors as actions and triggers
- `code-apps` — Code Apps can use connectors via `pac code add-data-source -c`
- `dataverse-web-api` — Alternative when data lives in Dataverse (no connector needed)
- `alm` — Solution packaging and deployment of custom connectors
