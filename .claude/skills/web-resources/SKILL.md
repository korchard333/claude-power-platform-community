---
name: web-resources
description: "Dataverse Web Resources (JavaScript/HTML). Use when: writing form scripts, Xrm Client API, formContext patterns, HTML web resources, ribbon/command bar customization, RibbonDiffXml, web resource deployment, event handlers."
---

# Skill: Dataverse Web Resources

## When to Use
Trigger when building JavaScript form scripts, HTML web resources, CSS styling, ribbon/command bar customization, or custom navigation for Model-Driven Apps.

---

## Web Resource Types

| Type | Code | Extension | Use Case |
|---|---|---|---|
| HTML | 1 | `.html` | Custom pages, dashboards, dialog content |
| CSS | 2 | `.css` | Custom styling for forms/views |
| JavaScript | 3 | `.js` | Form event handlers, ribbon commands, business logic |
| XML | 4 | `.xml` | Data files, configuration |
| PNG | 5 | `.png` | Icons, images |
| JPG | 6 | `.jpg` | Photos, images |
| GIF | 7 | `.gif` | Animated icons |
| SVG | 11 | `.svg` | Vector icons |
| RESX | 12 | `.resx` | Localized strings |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Form Scripts](form-scripts.md)** -- Form event handlers (OnLoad, OnSave, OnChange), formContext patterns, field/control/tab manipulation, save event handling, async OnSave
- **[Ribbon Commands](ribbon-commands.md)** -- Command bar customization, RibbonDiffXml, enable/display rules, command handlers, modern commanding (Power Fx)
- **[Xrm Client API](xrm-client-api.md)** -- Xrm.WebApi (CRUD, custom actions, FetchXML), Xrm.Navigation, Xrm.Utility, Xrm.Device, global context, async patterns, error handling
- **[HTML Dashboards](html-dashboards.md)** -- HTML web resource patterns, parent Xrm context access, postMessage communication, responsive sizing, embedding in dashboards and forms
- **[formContext API Reference](form-context-api.md)** -- formContext.data, formContext.ui, attributes (getValue/setValue/addOnChange/setRequiredLevel), controls (setDisabled/setVisible/addCustomFilter for lookups), tabs, sections, form events, save modes

---

## Project Structure (Recommended)

```
webresources/
  src/
    scripts/
      contact/
        contactForm.ts       # Contact form event handlers
        contactRibbon.ts     # Contact ribbon commands
      account/
        accountForm.ts
        accountRibbon.ts
      shared/
        common.ts            # Shared utilities
        notifications.ts     # Toast/notification helpers
        webapi.ts            # Web API wrapper
      types/
        xrm.d.ts             # Xrm type definitions
    html/
      customDashboard.html
    css/
      formStyles.css
  dist/                      # Compiled output
    contoso_/                # Publisher prefix folder
      scripts/
      html/
  package.json
  tsconfig.json
  webpack.config.js          # Bundle per form/feature
  deploy.ps1                 # Upload script
```

---

## TypeScript Setup

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "noImplicitAny": true,
    "outDir": "./dist",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Xrm Type Definitions
```bash
npm install --save-dev @types/xrm
```

---

## Deployment via Web API

### Upload Web Resource
```http
POST /api/data/v9.2/webresourceset
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "contoso_/scripts/contactForm.js",
  "displayname": "Contact Form Script",
  "description": "Event handlers for the Contact form",
  "webresourcetype": 3,
  "content": "<base64-encoded-file-content>"
}
```

### Update Existing Web Resource
```http
PATCH /api/data/v9.2/webresourceset(guid-of-webresource)
Content-Type: application/json

{
  "content": "<base64-encoded-updated-content>"
}
```

### Publish After Upload
```http
POST /api/data/v9.2/PublishXml
Content-Type: application/json

{
  "ParameterXml": "<importexportxml><webresources><webresource>{guid}</webresource></webresources></importexportxml>"
}
```

### Upload Script (Bash)
```bash
#!/bin/bash
FILE=$1
WR_NAME=$2
CONTENT=$(base64 < "$FILE")

# Check if web resource exists
EXISTING=$(curl -s "${BASE_URL}/api/data/v9.2/webresourceset?\$filter=name eq '${WR_NAME}'&\$select=webresourceid" \
  -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/json")

WR_ID=$(echo "$EXISTING" | jq -r '.value[0].webresourceid // empty')

if [ -n "$WR_ID" ]; then
  curl -s -X PATCH "${BASE_URL}/api/data/v9.2/webresourceset(${WR_ID})" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    -d "{\"content\":\"${CONTENT}\"}"
  echo "Updated: ${WR_NAME}"
else
  curl -s -X POST "${BASE_URL}/api/data/v9.2/webresourceset" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    -d "{\"name\":\"${WR_NAME}\",\"displayname\":\"${WR_NAME}\",\"webresourcetype\":3,\"content\":\"${CONTENT}\"}"
  echo "Created: ${WR_NAME}"
fi

curl -s -X POST "${BASE_URL}/api/data/v9.2/PublishAllXml" -H "Authorization: Bearer ${TOKEN}"
echo "Published"
```

---

## Naming Conventions

| Object | Convention | Example |
|---|---|---|
| JS web resource | `{prefix}_/scripts/{entity}{Purpose}.js` | `contoso_/scripts/contactForm.js` |
| HTML web resource | `{prefix}_/html/{purpose}.html` | `contoso_/html/projectDashboard.html` |
| CSS web resource | `{prefix}_/css/{purpose}.css` | `contoso_/css/formStyles.css` |
| Image web resource | `{prefix}_/images/{name}.{ext}` | `contoso_/images/approve16.png` |
| TypeScript namespace | `{Publisher}.{Entity}` | `Contoso.Contact` |
| Event handler function | `on{Event}` | `onLoad`, `onSave`, `onEmailChange` |
| Ribbon command function | `{action}{Entity}` | `approveRecord`, `exportToPdf` |

---

## Anti-Patterns

- Using `Xrm.Page` (deprecated) instead of execution context + `getFormContext()`
- Not passing execution context as first parameter to event handlers
- jQuery or other DOM manipulation libraries -- jQuery was removed from Model-Driven Apps (October 2023)
- Direct DOM manipulation of form elements (unsupported, breaks on updates)
- Hardcoding GUIDs in scripts
- Synchronous XMLHttpRequest calls (blocks UI thread)
- Not handling errors in async Web API calls
- Using `setTimeout` for timing-dependent logic instead of proper event handlers
- Publishing all customizations when only specific web resources changed
- Not using TypeScript for type safety on Xrm API calls

---

## Related Skills

- `model-driven-apps` -- Web resources are used in Model-Driven App forms and ribbons
- `dataverse-web-api` -- Web API calls from JavaScript web resources
