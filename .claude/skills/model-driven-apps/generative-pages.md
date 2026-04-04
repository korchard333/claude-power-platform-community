# Model-Driven Apps — Generative Pages (Genux)

Generative pages (genux) are React 17 + TypeScript single-file components that run inside model-driven Power Apps. They use Fluent UI V9 for UI components, `makeStyles` with tokens for styling, and the DataAPI for typed Dataverse access. Global GA April 2026, Wave 1 — available in all supported regions (previously US-only).

## Supported Libraries

Only these libraries are available — no others may be used:

| Library | Version | Notes |
|---|---|---|
| `react` | ^17.0.2 | React 17 (not 18/19) |
| `@fluentui/react-components` | ^9.46.4 | Core Fluent UI V9 |
| `@fluentui/react-icons` | ^2.0.292 | Unsized variants only (`AddRegular` not `Add24Regular`) |
| `@fluentui/react-datepicker-compat` | ^0.5.0 | DatePicker (NOT from react-components) |
| `@fluentui/react-timepicker-compat` | ^0.3.0 | TimePicker (NOT from react-components) |
| `d3` | ^7.9.0 | Charts and data visualization |
| `uuid` | ^9.0.1 | UUID generation |

## Critical Constraints

- **Single file architecture** — all components, utilities, styles in one `.tsx` file; each as separate top-level function (no nesting)
- **No FluentProvider** — already provided at root; adding another breaks theming
- **No external routing** — use Fluent UI V9 Tabs/Breadcrumbs for multi-screen navigation
- **No `100vh`/`100vw`** — use flexbox and relative units; root container fills available space
- **`makeStyles` with tokens** — use `tokens.spacingVerticalXL`, `tokens.colorNeutralBackground1`; inline styles only for dynamic values
- **Unsized icon variants only** — `AddRegular` not `Add24Regular`
- **Forbidden functions** — `createTheme`, `mergeThemes`, `useTheme` do not exist in Fluent UI V9
- **No placeholder code** — no TODOs, ellipses, or stub functions in final output

## Component Template

```typescript
import {useEffect, useState} from 'react';
import type {
  TableRow, DataColumnValue, RowKeyDataColumnValue,
  QueryTableOptions, ReadableTableRow, ExtractFields,
  GeneratedComponentProps
} from "./RuntimeTypes";

// Additional imports: @fluentui/react-components, @fluentui/react-icons, d3

// Utility functions as separate top-level functions
// Sub-components as separate top-level functions

const GeneratedComponent = (props: GeneratedComponentProps) => {
  const { dataApi } = props;
  // Component implementation
}

export default GeneratedComponent;
```

## RuntimeTypes Workflow

**CRITICAL — generate schema before writing any code.** Column name hallucination is the #1 source of runtime errors.

```powershell
# Generate TypeScript types from Dataverse metadata
pac model genpage generate-types --data-sources "entity1,entity2" --output-file RuntimeTypes.ts
```

After generating, **read RuntimeTypes.ts** and verify: actual column names, readonly vs writable columns, enum/choice set names and values. **Never guess column names** — custom entities have unpredictable names (e.g., `cr69c_fullname` not `cr69c_name`).

## DataAPI Quick Reference

```typescript
// Query with pagination — result contains { rows, hasMoreRows, loadMoreRows }
const result = await dataApi.queryTable("account", {
  select: ["name", "revenue"],
  filter: `contains(name,'test')`,
  orderBy: `name asc`,
  pageSize: 50,
});
const accounts = result.rows; // Object[] — array of row data
// Load more rows
if (result.hasMoreRows && result.loadMoreRows) {
  const nextPage = await result.loadMoreRows();
  const moreAccounts = nextPage.rows;
}

// CRUD operations
await dataApi.createRow("account", { name: "New Account" });
await dataApi.updateRow("account", "record-id", { name: "Updated" });
const row = await dataApi.retrieveRow("account", { id: "record-id", select: ["name"] });

// Lookup fields in createRow: use @odata.bind with /entity(guid) format
const newContactId = await dataApi.createRow("contact", {
  firstname: "John",
  lastname: "Doe",
  "parentcustomerid@odata.bind": `/account(${accountId})`,
});

// Lookup fields: _value is GUID, FormattedValue is display name
const contactGuid = row._primarycontactid_value;                                            // GUID
const contactName = row["_primarycontactid_value@OData.Community.Display.V1.FormattedValue"]; // "John Smith"

// Get enum choices
const choices = await dataApi.getChoices("account-statecode");
```

### ⚠️ Foreign Key Columns Must Be Explicitly Selected

The DataAPI does NOT automatically return foreign key (`_*_value`) columns. You must explicitly include them in `select`:

```typescript
// WRONG — _ds_engagementid_value will be undefined
const result = await dataApi.queryTable("ds_timeentry", {
  select: ["ds_date", "ds_duration"],
});

// CORRECT — explicitly include lookup value columns
const result = await dataApi.queryTable("ds_timeentry", {
  select: ["ds_date", "ds_duration", "_ds_engagementid_value", "_ds_teammemberid_value"],
});
```

Formatted value annotations (e.g., `@OData.Community.Display.V1.FormattedValue`) ARE returned automatically when the `_value` column is selected — no extra work needed for display names.

### Foreign Key Values Use `/entity(guid)` Format

Foreign key values are returned in `/entity(guid)` format (e.g., `/ds_engagement(a1b2c3d4-...)`), matching the `@odata.bind` format used for writes. An `extractGuid()` helper is required to match against primary keys:

```typescript
function extractGuid(fkValue: string | null | undefined): string | null {
  if (!fkValue) return null;
  const match = fkValue.match(/\(([0-9a-f-]{36})\)/i);
  return match ? match[1] : fkValue;
}

// Usage: match foreign key to primary key
const engagementId = extractGuid(timeEntry._ds_engagementid_value);
if (engagementId === engagement.ds_engagementid) { /* match */ }
```

**DataAPI rules:**
- Only use `dataApi` when TableRegistrations are provided
- Entity logical names: singular lowercase (`"account"` not `"accounts"`)
- Always wrap async `dataApi` calls in try-catch
- Use `createTableColumn` from Fluent UI V9 for DataGrid columns

## PAC CLI Workflow

```powershell
# List available apps
pac model list

# Upload new page (all flags required)
pac model genpage upload `
  --app-id <app-id> `
  --code-file page-name.tsx `
  --name "Page Display Name" `
  --data-sources "entity1,entity2" `
  --prompt "Original request summary" `
  --model "<model-id>" `
  --agent-message "Description of what was built" `
  --add-to-sitemap

# Download existing page
pac model genpage download --app-id <app-id> --page-id <page-id> --output-directory ./output

# Update existing page (use --page-id, omit --add-to-sitemap)
pac model genpage upload --app-id <app-id> --page-id <page-id> --code-file page.tsx ...

# Detect configured languages
pac model list-languages
```

## Localization

Apply when `pac model list-languages` returns multiple languages or any non-English language.

```typescript
// Language detection
const language = React.useMemo(() => {
  const uiLanguageId = (typeof Xrm !== "undefined" &&
    Xrm.Utility?.getGlobalContext()?.userSettings?.languageId) || 1033;
  const langMap: Record<number, { code: string; name: string; isRtl: boolean }> = {
    1033: { code: "en-US", name: "English", isRtl: false },
    // Add entries for each language from pac model list-languages
  };
  return langMap[uiLanguageId] || { code: "en-US", name: "English", isRtl: false };
}, []);

// Translation dictionary — ALL user-visible text must use translate()
const translations: Record<string, Record<string, string>> = {
  "en-US": { title: "Dashboard", save: "Save", cancel: "Cancel" },
  "ar-SA": { title: "لوحة القيادة", save: "حفظ", cancel: "إلغاء" },
};
const translate = (key: string): string =>
  translations[language.code]?.[key] || translations["en-US"]?.[key] || key;
```

**RTL support:** Wrap root in `<div dir={language.isRtl ? "rtl" : "ltr"}>`. Use logical CSS properties: `marginInlineStart` not `marginLeft`, `paddingInlineEnd` not `paddingRight`, `textAlign: "start"` not `"left"`.

**User settings for formatting:** Fetch from `usersettings` table via `dataApi.retrieveRow` — retrieve `dateformatstring`, `dateseparator`, `decimalsymbol`, `numberseparator`, `currencysymbol`. Never hardcode date formats or currency symbols.

## Layout Patterns

- **Scrollable areas:** fixed `maxHeight` on parent + `overflow: auto` on content. Only content area scrolls, never entire page.
- **Page-level functions** (nav, search, filters) go in header opposite the title
- **Responsive breakpoints:** 320px, 480px, 768px, 1024px, 1440px; mobile-first; relative units
- **Navigation:** Fluent UI V9 Tabs or Breadcrumbs — no React Router

### CSS Bar Charts: Percentage Heights Need Fixed-Height Parents

For bar charts using percentage heights (without d3): the parent container must have a **fixed `height`** (not `flex: 1`), and child bar elements must NOT have `flex: 1` (it overrides `height`):

```typescript
const useStyles = makeStyles({
  barContainer: { height: "200px", display: "flex", alignItems: "flex-end", gap: tokens.spacingHorizontalS },
  bar: { width: "100%", /* NOT flex: 1 */ backgroundColor: tokens.colorBrandBackground },
});

// Set height as inline style (dynamic value)
<div className={styles.bar} style={{ height: `${percentage}%` }} />
```

Pure CSS bar charts work well for simple use cases. Use d3 only for complex interactive visualizations.

## Date Handling in Genux Pages

### ⚠️ Never Compare Locale Dates with ISO Dates

`toLocaleDateString()` produces locale-specific strings (e.g., `"4/04/2026"`) that fail string comparison against ISO dates (`"2026-03-30"`). Always maintain separate date representations:

```typescript
// Store both formats when you need dates for display AND logic
interface ProcessedEntry {
  displayDate: string;   // toLocaleDateString() — for rendering
  isoDate: string;       // toISOString().slice(0, 10) — for comparisons/filters
}

// WRONG — comparing locale string to ISO string always fails
const thisWeek = entries.filter(e => e.displayDate >= weekStartISO);

// CORRECT — compare ISO to ISO
const thisWeek = entries.filter(e => e.isoDate >= weekStartISO);
```

Also see the UTC+ timezone note in `code-apps/architecture.md` — use `setHours(12, 0, 0, 0)` (noon) not midnight to keep dates stable across timezones.

## DataGrid Patterns

### useMemo Dependencies for Column Definitions

When `useMemo` callbacks reference external reactive values, those values **MUST** be in the dependency array. An empty deps array captures the initial (empty) values:

```typescript
// WRONG — empty deps captures initial empty map, columns never update
const columns = useMemo(() => [
  createTableColumn({ columnId: "hours", renderCell: (item) => hoursByEngagement.get(item.id) ?? "—" }),
], []); // ← stale closure: hoursByEngagement is always the initial empty Map

// CORRECT — include computed data in deps
const columns = useMemo(() => [
  createTableColumn({ columnId: "hours", renderCell: (item) => hoursByEngagement.get(item.id) ?? "—" }),
], [hoursByEngagement]); // ← re-creates columns when data updates
```

## Accessibility

- Semantic HTML (`button`, `nav`, `main`, `section`)
- `aria-label` on icon-only buttons: `<Button aria-label="Delete item" icon={<DeleteRegular />} />`
- `aria-labelledby`/`aria-describedby` for form sections
- WCAG AA contrast — use theme tokens
- Keyboard navigation: tab order, enter/space for actions

## Sample Templates

Reference implementations in `samples/` — read these before generating code for the matching pattern:

| Sample | File | Pattern |
|---|---|---|
| Account Grid | [1-account-grid.tsx](samples/1-account-grid.tsx) | DataGrid with filter, sortable columns, multiselect |
| Wizard Multi-Step | [2-wizard-multi-step.tsx](samples/2-wizard-multi-step.tsx) | Tab-based multi-step wizard navigation |
| POA Revocation Wizard | [3-poa-revocation-wizard.tsx](samples/3-poa-revocation-wizard.tsx) | Domain-specific wizard with Dataverse CRUD + validation |
| Account CRUD | [4-account-crud-dataverse.tsx](samples/4-account-crud-dataverse.tsx) | Full create/read/update/delete operations |
| File Upload | [5-file-upload.tsx](samples/5-file-upload.tsx) | Hidden input + Fluent Button file upload pattern |
| Navigation Sidebar | [6-navigation-sidebar.tsx](samples/6-navigation-sidebar.tsx) | Sidebar menu + content area layout |
| Comprehensive Form | [7-comprehensive-form.tsx](samples/7-comprehensive-form.tsx) | Complex form with sections + validation |
| Responsive Cards | [8-responsive-cards.tsx](samples/8-responsive-cards.tsx) | Card grid with responsive breakpoints |

## Eval File

The [genpage.json](evals/genpage.json) file contains evaluation test cases for validating the generative pages workflow — covering account gallery, mock data dashboards, real Dataverse data, and complex multi-entity scenarios.
