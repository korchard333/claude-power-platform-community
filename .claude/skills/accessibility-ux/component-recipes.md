# Component-Level Design Recipes

Exact styling specifications for common enterprise UI components. Each recipe provides token-specific values, all interactive states, and a ready-to-use `makeStyles` example. Use alongside [visual-design.md](visual-design.md) for page-level layout and [fluent-ui.md](../code-apps/fluent-ui.md) for component API reference.

**Convention:** All token names are from `@fluentui/react-components` v9.46+. CSS shorthands work directly in `makeStyles` — no `shorthands` helper needed.

---

## KPI / Metric Card

A single key metric with label, value, and optional delta indicator. Used in dashboard top rows (3-4 max).

| Property | Token / Value |
|---|---|
| Padding | `spacingVerticalL` × `spacingHorizontalL` (16px) |
| Border radius | `borderRadiusMedium` (4px) |
| Background | `colorNeutralBackground1` |
| Shadow | `shadow4` |
| Min width | 180px |
| Gap (internal) | `spacingVerticalS` (8px) |

**Value (big number):** `fontSizeBase600` (24px), `fontWeightSemibold`, `colorNeutralForeground1`
**Label:** `fontSizeBase200` (12px), `colorNeutralForeground3`
**Delta indicator:** `fontSizeBase200` — positive: `colorPaletteGreenForeground1`, negative: `colorPaletteRedForeground1`

**States** (only if card is clickable):

| State | Change |
|---|---|
| Hover | `colorNeutralBackground1Hover`, `shadow8` |
| Pressed | `colorNeutralBackground1Pressed` |
| Focus | `outline: 2px solid colorStrokeFocus2`, `outlineOffset: 2px` |

```tsx
const useKpiCardStyles = makeStyles({
  root: {
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium, boxShadow: tokens.shadow4,
    minWidth: '180px',
  },
  interactive: {
    cursor: 'pointer', transitionDuration: tokens.durationFast,
    transitionProperty: 'background-color, box-shadow',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, boxShadow: tokens.shadow8 },
    ':active': { backgroundColor: tokens.colorNeutralBackground1Pressed },
    ':focus-visible': { outlineColor: tokens.colorStrokeFocus2, outlineWidth: '2px', outlineStyle: 'solid', outlineOffset: '2px' },
  },
  value: { fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground1, lineHeight: tokens.lineHeightBase600 },
  label: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  deltaPositive: { fontSize: tokens.fontSizeBase200, color: tokens.colorPaletteGreenForeground1 },
  deltaNegative: { fontSize: tokens.fontSizeBase200, color: tokens.colorPaletteRedForeground1 },
});
```

---

## Data Card (Content Card)

General-purpose content card with optional image, header, body, and footer actions.

| Property | Token / Value |
|---|---|
| Padding | `spacingVerticalL` × `spacingHorizontalL` (16px) |
| Border radius | `borderRadiusMedium` (4px) |
| Background | `colorNeutralBackground1` |
| Shadow | `shadow4` |
| Internal gap | `spacingVerticalM` (12px) between sections |
| Image | `aspect-ratio: 16/9`, `object-fit: cover` |

**Header:** `fontSizeBase400` (16px), `fontWeightSemibold`, `colorNeutralForeground1`
**Body:** `fontSizeBase300` (14px), `colorNeutralForeground2`
**Footer actions:** Right-aligned, `spacingHorizontalS` (8px) gap, separated by `strokeWidthThin` top border in `colorNeutralStroke2`

**States:** Hover (if clickable): `shadow8`. Selected: `border: 2px solid colorBrandStroke1`.

```tsx
const useDataCardStyles = makeStyles({
  root: {
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium, boxShadow: tokens.shadow4,
  },
  image: { aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: tokens.borderRadiusSmall, width: '100%' },
  header: { fontSize: tokens.fontSizeBase400, fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground1 },
  body: { fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS, borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  selected: { border: `2px solid ${tokens.colorBrandStroke1}` },
});
```

---

## Form Field

Styling for the `Field` + `Input` composition. Covers all validation states.

| Property | Token / Value |
|---|---|
| Input height | 32px (medium size) |
| Border | `strokeWidthThin` (1px) solid `colorNeutralStroke1` |
| Border radius | `borderRadiusMedium` (4px) |
| Inner padding | `spacingHorizontalS` (8px) horizontal |
| Font | `fontSizeBase300` (14px), `colorNeutralForeground1` |
| Placeholder | `colorNeutralForeground4` |
| Label | `fontSizeBase300`, above input, gap `spacingVerticalXXS` (2px) |
| Hint text | `fontSizeBase200` (12px), `colorNeutralForeground3` |
| Between fields | `spacingVerticalL` (16px) |

**States:**

| State | Border | Notes |
|---|---|---|
| Rest | `colorNeutralStroke1` | — |
| Hover | `colorNeutralStroke1Hover` | — |
| Focus | Bottom 2px `colorBrandStroke1` | Fluent underline-thickens effect |
| Error | `colorPaletteRedBorder1` | Error message below: `colorPaletteRedForeground1`, `fontSizeBase200` |
| Disabled | `colorNeutralStrokeDisabled` | Text: `colorNeutralForegroundDisabled` |

> Prefer using Fluent's `<Field>` component — it handles label, hint, validation message, and `aria-describedby` automatically. Custom styles are only for layout adjustments.

---

## Table Header

| Property | Token / Value |
|---|---|
| Height | 44px |
| Background | `colorNeutralBackground2` |
| Font | `fontSizeBase300` (14px), `fontWeightSemibold` |
| Color | `colorNeutralForeground2` |
| Padding | `0 spacingHorizontalM` (0 12px) |
| Border bottom | `strokeWidthThin` solid `colorNeutralStroke2` |
| Sort indicator | Arrow icon in `colorBrandForeground1` when active |
| Sticky | `position: sticky`, `top: 0`, `zIndex: 1` |

**Hover (sortable columns):** `colorNeutralBackground2Hover`, `cursor: pointer`
**Sorted column:** Sort icon visible, `fontWeightBold`

```tsx
const useTableHeaderStyles = makeStyles({
  root: {
    display: 'flex', alignItems: 'center', height: '44px',
    padding: `0 ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    position: 'sticky', top: '0', zIndex: 1,
  },
  sortable: { cursor: 'pointer', ':hover': { backgroundColor: tokens.colorNeutralBackground2Hover } },
  sortIcon: { fontSize: tokens.fontSizeBase200, color: tokens.colorBrandForeground1, marginLeft: tokens.spacingHorizontalXS },
});
```

---

## Table Row States

| Property | Token / Value |
|---|---|
| Height | 44px (condensed) / 48px (regular) / 56px (relaxed) |
| Padding | `0 spacingHorizontalM` (0 12px) |
| Font | `fontSizeBase300` (14px), `colorNeutralForeground1` |
| Border bottom | `strokeWidthThin` solid `colorNeutralStroke2` |

**States:**

| State | Background | Other |
|---|---|---|
| Rest | `colorNeutralBackground1` | — |
| Hover | `colorNeutralBackground1Hover` | Overflow menu icon appears |
| Selected | `colorNeutralBackground1Selected` | Left border: 2px `colorBrandStroke1` |

**Numbers:** Right-align, use tabular (monospace) figures for financial data alignment.

```tsx
const useTableRowStyles = makeStyles({
  root: {
    display: 'flex', alignItems: 'center', height: '44px',
    padding: `0 ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground1,
    transitionDuration: tokens.durationFast, transitionProperty: 'background-color',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  selected: { backgroundColor: tokens.colorNeutralBackground1Selected, borderLeft: `2px solid ${tokens.colorBrandStroke1}` },
});
```

---

## Badge / Status Indicator

### Sizing

| Size | Height | Padding | Font Size |
|---|---|---|---|
| Tiny | 6px | — (dot only) | — |
| Extra small | 10px | 0 2px | — |
| Small | 16px | 0 2px | `fontSizeBase100` (10px) |
| Medium | 20px | 0 4px | `fontSizeBase200` (12px) |
| Large | 24px | 0 4px | `fontSizeBase200` (12px) |
| Extra large | 32px | 0 8px | `fontSizeBase300` (14px) |

**Shapes:** `borderRadiusCircular` (default pill), `borderRadiusMedium` (rounded), `borderRadiusNone` (square)

### Appearance × Color

| Appearance | Background | Text |
|---|---|---|
| Filled + brand | `colorBrandBackground` | `colorNeutralForegroundOnBrand` |
| Filled + danger | `colorPaletteRedBackground3` | `colorNeutralForegroundOnBrand` |
| Filled + success | `colorPaletteGreenBackground3` | `colorNeutralForegroundOnBrand` |
| Filled + warning | `colorPaletteYellowBackground3` | `colorNeutralForeground1` |
| Filled + informative | `colorNeutralBackground5` | `colorNeutralForeground1` |
| Outline | transparent | `colorBrandForeground1` + 1px `colorBrandStroke1` border |
| Ghost | transparent | `colorBrandForeground1` |
| Tint | `colorBrandBackground2` | `colorBrandForeground2` |

Icon-to-text gap: `spacingHorizontalXXS` (2px). Icon size matches badge font size.

---

## Dialog / Modal

Width, height, and internal spacing for `DialogSurface`.

### Size Variants

| Property | Small | Medium | Large |
|---|---|---|---|
| Width | 400px | 600px | 800px |
| Max width | 90vw | 90vw | 90vw |
| Max height | 85vh | 85vh | 85vh |

| Property | Token / Value |
|---|---|
| Border radius | `borderRadiusXLarge` (8px) |
| Shadow | `shadow64` |
| Padding | `spacingVerticalXXL` × `spacingHorizontalXXL` (24px) |
| Backdrop | `rgba(0, 0, 0, 0.4)` (Smoke material) |

**Title:** `fontSizeBase500` (20px), `fontWeightSemibold`, `colorNeutralForeground1`
**Content:** `fontSizeBase300` (14px), `colorNeutralForeground2`, `overflowY: auto`
**Actions:** Right-aligned, `spacingHorizontalS` (8px) gap, `paddingTop: spacingVerticalL` (16px)

```tsx
const useDialogStyles = makeStyles({
  small: { width: '400px', maxWidth: '90vw' },
  medium: { width: '600px', maxWidth: '90vw' },
  large: { width: '800px', maxWidth: '90vw' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: tokens.spacingHorizontalS, paddingTop: tokens.spacingVerticalL },
});
```

> Use Fluent's `<Dialog>` components — they handle shadow, radius, backdrop, and focus trapping. Custom styles are only for width overrides.

---

## Navigation Item

Styling for `NavItem` within `NavDrawer`.

| Property | Token / Value |
|---|---|
| Height | 36px |
| Padding | `spacingVerticalXS` (4px) × `spacingHorizontalM` (12px) |
| Border radius | `borderRadiusMedium` (4px) |
| Font | `fontSizeBase300` (14px), `fontWeightRegular` |
| Color | `colorNeutralForeground2` |
| Icon size | 20px |
| Icon-to-text gap | `spacingHorizontalS` (8px) |
| Sub-item indent | `spacingHorizontalXXL` (24px) left padding per level |

**States:**

| State | Background | Text | Other |
|---|---|---|---|
| Rest | transparent | `colorNeutralForeground2` | — |
| Hover | `colorNeutralBackground1Hover` | — | — |
| Pressed | `colorNeutralBackground1Pressed` | — | — |
| Active | `colorBrandBackground2` | `colorBrandForeground2` | Left: 3px `colorBrandStroke1` |
| Focus | — | — | `outline: 2px solid colorStrokeFocus2` |

**Collapsed rail:** Hide text, center icon, width 48px. Add `Tooltip` on each icon.

```tsx
const useNavItemStyles = makeStyles({
  root: {
    display: 'flex', alignItems: 'center', height: '36px',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium, gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground2,
    transitionDuration: tokens.durationFast, transitionProperty: 'background-color',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    ':active': { backgroundColor: tokens.colorNeutralBackground1Pressed },
  },
  active: {
    backgroundColor: tokens.colorBrandBackground2, color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold, borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
  },
  subItem: { paddingLeft: tokens.spacingHorizontalXXL },
});
```

---

## Page Header

Title + breadcrumb + action buttons at the top of each page.

| Property | Token / Value |
|---|---|
| Padding | `spacingVerticalL` (16px) × `spacingHorizontalXXL` (24px) |
| Bottom border | `strokeWidthThin` solid `colorNeutralStroke2` |
| Margin bottom | `spacingVerticalXL` (20px) |

**Breadcrumb:** `fontSizeBase200` (12px), `colorNeutralForeground3`, `marginBottom: spacingVerticalXS` (4px)
**Title:** `fontSizeBase600` (24px), `fontWeightSemibold`, `colorNeutralForeground1`
**Actions:** Right-aligned via `marginLeft: auto`, `spacingHorizontalS` (8px) gap

```
┌─────────────────────────────────────────────────┐
│  Home > Projects > Alpha Launch    (breadcrumb)  │
│  Alpha Launch Project        [Edit] [Export] [•••]│
└─────────────────────────────────────────────────┘
```

```tsx
const usePageHeaderStyles = makeStyles({
  root: {
    display: 'flex', flexDirection: 'column',
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalXL,
  },
  breadcrumb: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalXS },
  titleRow: { display: 'flex', alignItems: 'center' },
  title: { fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground1 },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, marginLeft: 'auto' },
});
```

**Responsive (< 640px):** Stack title and actions vertically, full-width primary button.

---

## Empty State

Centered placeholder when a view has no data.

| Property | Token / Value |
|---|---|
| Container max width | 400px |
| Alignment | Centered horizontally and vertically |
| Padding | `spacingVerticalXXL` (24px) |
| Illustration size | 120×120px max |
| Gap | `spacingVerticalM` (12px) |

**Heading:** `fontSizeBase400` (16px), `fontWeightSemibold`, `colorNeutralForeground1`
**Description:** `fontSizeBase300` (14px), `colorNeutralForeground3`, centered
**Action button:** Primary appearance, `marginTop: spacingVerticalM`

Three types: **No data yet** (action: create first item), **Filtered to nothing** (action: clear filters), **Error** (action: retry). Always explain WHY.

```tsx
const useEmptyStateStyles = makeStyles({
  root: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: tokens.spacingVerticalXXL, maxWidth: '400px', margin: '0 auto',
    textAlign: 'center', gap: tokens.spacingVerticalM,
  },
  illustration: { maxWidth: '120px', maxHeight: '120px', opacity: 0.6 },
  heading: { fontSize: tokens.fontSizeBase400, fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground1 },
  description: { fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground3 },
});
```

---

## Skeleton / Loading

Placeholder shimmer patterns for known layouts.

| Property | Token / Value |
|---|---|
| Background | `colorNeutralStencil1` (purpose-built skeleton token) |
| Shimmer | Wave sweep (default) or pulse, 2s duration |
| Border radius (text) | `borderRadiusMedium` (4px) |
| Border radius (avatar) | `borderRadiusCircular` |
| Text line height | 14px |
| Heading height | 20px |
| Width | 60-80% for text, 100% for full-width, fixed for avatars |

**When to use what:**

| Scenario | Component |
|---|---|
| Known page layout (tables, cards) | `Skeleton` + `SkeletonItem` |
| Unknown layout / short wait (< 3s) | `Spinner` inline near trigger |
| Long operation with progress | `ProgressBar` with label |

> Prefer Fluent's `<Skeleton>` and `<SkeletonItem>` components — they include shimmer animation automatically. Only build custom skeleton shapes when SkeletonItem doesn't cover the layout.

---

## Toast / Notification

Transient notifications via `Toaster` and `Toast`.

| Property | Token / Value |
|---|---|
| Width | 360px |
| Max width | 90vw |
| Padding | `spacingVerticalM` × `spacingHorizontalM` (12px) |
| Border radius | `borderRadiusMedium` (4px) |
| Shadow | `shadow16` |
| Position | Top-right (desktop), top-center (mobile) |
| Max visible | 3 (queue the rest) |
| Icon-to-text gap | `spacingHorizontalS` (8px) |

### Intent Variants

| Intent | Icon Color | Left Border | Auto-dismiss |
|---|---|---|---|
| Success | `colorPaletteGreenForeground1` | 4px `colorPaletteGreenBorder1` | 5 seconds |
| Error | `colorPaletteRedForeground1` | 4px `colorPaletteRedBorder1` | Persistent + retry |
| Warning | `colorPaletteYellowForeground1` | 4px `colorPaletteYellowBorder1` | Persistent |
| Info | `colorBrandForeground1` | 4px `colorBrandStroke1` | 5 seconds |

All toasts: background `colorNeutralBackground1`, dismiss button `appearance="subtle"` top-right.

```tsx
const { dispatchToast } = useToastController('toaster-id');
dispatchToast(
  <Toast>
    <ToastTitle>Contact saved</ToastTitle>
    <ToastBody>Kim Smith's record has been updated.</ToastBody>
  </Toast>,
  { intent: 'success', timeout: 5000, position: 'top-end' }
);
```

---

## Toolbar / Action Bar

Horizontal button bar for page or section-level actions.

| Property | Token / Value |
|---|---|
| Height | 44px |
| Padding | `spacingVerticalXS` (4px) × `spacingHorizontalM` (12px) |
| Button gap | `spacingHorizontalXS` (4px) |
| Divider | `strokeWidthThin` × 24px tall, `colorNeutralStroke2`, margin `spacingHorizontalXS` |

**Overflow:** Trailing items collapse into a `Menu` triggered by `MoreHorizontalRegular` icon. Use Fluent's `Overflow` + `OverflowItem`.

**Responsive (< 640px):** Icon-only buttons with `Tooltip` labels. Secondary actions in overflow menu.

```tsx
const useToolbarStyles = makeStyles({
  root: {
    display: 'flex', alignItems: 'center', height: '44px',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    gap: tokens.spacingHorizontalXS,
  },
  divider: {
    width: tokens.strokeWidthThin, height: '24px',
    backgroundColor: tokens.colorNeutralStroke2,
    margin: `0 ${tokens.spacingHorizontalXS}`,
  },
});
```

---

## Usage Guide

These component recipes combine with page-level recipes from [visual-design.md](visual-design.md):

| Page Recipe | Components Used |
|---|---|
| Dashboard | KPI Card + Data Card + Toolbar |
| List / Table | Page Header + Table Header + Table Rows + Toolbar + Empty State |
| Detail / Record | Page Header + Data Card + Badge + Toast |
| Form / Edit | Page Header + Form Field + Dialog (confirmation) + Toast |

All tokens are exports from `@fluentui/react-components`. Import via:

```tsx
import { tokens } from '@fluentui/react-components';
```

Tokens resolve to CSS custom properties that adapt to light, dark, and high-contrast themes automatically.
