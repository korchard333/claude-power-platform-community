# Code Apps — Fluent UI V9

Use Fluent UI V9 (`@fluentui/react-components`) when building Microsoft-branded enterprise Code Apps that need visual consistency with Teams, Outlook, and Model-Driven Apps. For custom-branded external apps, consider Tailwind + shadcn/ui instead.

**Package:** `@fluentui/react-components` (facade re-exporting 50+ component packages)
**Icons:** `@fluentui/react-icons` (unsized variants only — `AddRegular`, not `Add24Regular`)
**Compat:** `@fluentui/react-datepicker-compat`, `@fluentui/react-timepicker-compat` (separate install)

```bash
npm install @fluentui/react-components @fluentui/react-icons
```

---

## FluentProvider Setup

Every Fluent V9 app must wrap the component tree in `FluentProvider`. It injects CSS variables for all design tokens and provides React context for theming, direction (RTL), and focus management.

```tsx
// src/main.tsx — Code App entry point
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <FluentProvider theme={webLightTheme}>
    <App />
  </FluentProvider>
);
```

### Provider Stack Order

In a Code App with routing, state, and theming:

```tsx
<FluentProvider theme={theme}>        {/* Outermost — CSS vars + context */}
  <QueryClientProvider client={qc}>   {/* Server state */}
    <RouterProvider router={router} /> {/* Routing */}
  </QueryClientProvider>
</FluentProvider>
```

### Nesting

FluentProviders can nest — inner providers override outer theme tokens. Use this for sections that need a different theme (e.g., a dark sidebar in a light app):

```tsx
<FluentProvider theme={lightTheme}>
  <MainContent />
  <FluentProvider theme={darkTheme}>
    <Sidebar />   {/* Dark tokens applied here */}
  </FluentProvider>
</FluentProvider>
```

### Portal Components

`Dialog`, `Tooltip`, `Menu`, and `Popover` render via React Portal (outside the DOM tree). They automatically inherit the nearest FluentProvider context. If a portal component renders without a FluentProvider ancestor, it loses all theming — tokens revert to browser defaults.

---

## Theme Customization

### BrandVariants Color Ramp

Every custom theme starts with a 16-stop brand color ramp (keys 10 through 160). Key 80 is the primary brand color. Generate the ramp using the [Fluent Theme Designer](https://react.fluentui.dev/?path=/docs/themedesigner--page) or manually:

```typescript
// src/theme/tokens.ts
import type { BrandVariants } from '@fluentui/react-components';

export const brand: BrandVariants = {
  10: '#1A0200',   // Darkest
  20: '#3B0700',
  30: '#570D00',
  40: '#6E1300',
  50: '#861A00',
  60: '#9E2100',
  70: '#A93200',
  80: '#B50C00',   // Primary brand color
  90: '#C43A20',
  100: '#D15C40',
  110: '#DC7A60',
  120: '#E69680',
  130: '#EEB0A0',
  140: '#F5C9BF',
  150: '#FAE1DC',
  160: '#FDF3F1',  // Lightest tint
};

// App-specific semantic tokens (not part of Fluent theme — your own convention)
export const appColors = {
  statusFlagged: '#DB802F',
  statusComplete: '#9DAA8C',
  statusInTransit: '#F6C544',
  accent: '#5A8798',
};
```

### Creating Light and Dark Themes

```typescript
// src/theme/index.ts
import { createLightTheme, createDarkTheme } from '@fluentui/react-components';
import { brand } from './tokens';

export const appLightTheme = createLightTheme(brand);
export const appDarkTheme = createDarkTheme(brand);

// Override specific tokens after creation if needed
appDarkTheme.colorBrandForeground1 = brand[110];
appDarkTheme.colorBrandForeground2 = brand[120];

// Custom font (optional)
appLightTheme.fontFamilyBase = '"DM Sans", "Segoe UI", system-ui, sans-serif';
appDarkTheme.fontFamilyBase = '"DM Sans", "Segoe UI", system-ui, sans-serif';
```

### Built-In Themes

| Theme | Use Case |
|---|---|
| `webLightTheme` | Default light theme — generic web apps |
| `webDarkTheme` | Default dark theme |
| `teamsLightTheme` | Teams-embedded apps (light) |
| `teamsDarkTheme` | Teams-embedded apps (dark) |
| `teamsHighContrastTheme` | Accessibility — always test with this |

---

## Dark / Light Mode

Use a React context to manage theme switching with localStorage persistence and system preference detection.

```tsx
// src/theme/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { webLightTheme, webDarkTheme, type Theme } from '@fluentui/react-components';
import { appLightTheme, appDarkTheme } from './index';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem('theme-mode') as ThemeMode) ?? 'system'
  );

  const systemPrefersDark = useMemo(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    []
  );

  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark);
  const theme = isDark ? appDarkTheme : appLightTheme;

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeMode = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be inside ThemeProvider');
  return ctx;
};
```

Usage in the app root:

```tsx
import { FluentProvider } from '@fluentui/react-components';
import { ThemeProvider, useThemeMode } from './theme/ThemeContext';

function ThemedApp() {
  const { theme } = useThemeMode();
  return (
    <FluentProvider theme={theme}>
      <App />
    </FluentProvider>
  );
}

// Entry point
<ThemeProvider>
  <ThemedApp />
</ThemeProvider>
```

---

## Design Tokens

Tokens are CSS variables set by FluentProvider. Access them via the `tokens` object from `@fluentui/react-components`. **Always use tokens instead of hardcoded values** — they automatically adapt to theme changes (light/dark/high contrast).

### Token Hierarchy

| Level | Purpose | Example |
|---|---|---|
| **Global** | Raw values, no semantic meaning | `Global.Color.Blue.60` |
| **Alias** | Semantic intent | `colorNeutralBackground1` (surface color) |
| **Component** | Control-specific | `buttonPrimaryBackground` |

In code, you use **alias tokens** most often.

### Quick Reference — Most-Used Tokens

**Colors:**

| Token | Purpose |
|---|---|
| `colorNeutralBackground1` | Primary surface (white in light, near-black in dark) |
| `colorNeutralBackground2` | Secondary surface (slightly off-white) |
| `colorNeutralBackground3` | Tertiary surface (hover states, sidebars) |
| `colorNeutralForeground1` | Primary text |
| `colorNeutralForeground2` | Secondary text (descriptions, captions) |
| `colorNeutralForeground3` | Tertiary text (placeholders, disabled) |
| `colorBrandBackground` | Brand-colored backgrounds (buttons, headers) |
| `colorBrandForeground1` | Brand-colored text and icons |
| `colorBrandStroke1` | Brand-colored borders (active states) |
| `colorNeutralStroke1` | Default borders |
| `colorPaletteRedForeground1` | Error/danger text |
| `colorPaletteRedBackground1` | Error backgrounds |
| `colorPaletteGreenForeground1` | Success text |
| `colorPaletteYellowForeground1` | Warning text |

**Typography:**

| Token | Value (approx) | Use |
|---|---|---|
| `fontSizeBase200` | 12px | Captions |
| `fontSizeBase300` | 14px | Body text (default) |
| `fontSizeBase400` | 16px | Subtitles |
| `fontSizeBase500` | 20px | Section headings |
| `fontSizeBase600` | 24px | Page headings |
| `fontWeightRegular` | 400 | Body |
| `fontWeightSemibold` | 600 | Headings, emphasis |
| `fontWeightBold` | 700 | Strong emphasis |
| `lineHeightBase300` | 20px | Body line height |

**Spacing:**

| Token | Value | Use |
|---|---|---|
| `spacingHorizontalXXS` | 2px | Tight gaps |
| `spacingHorizontalXS` | 4px | Icon-to-text |
| `spacingHorizontalS` | 8px | Compact spacing |
| `spacingHorizontalM` | 12px | Default spacing |
| `spacingHorizontalL` | 16px | Section padding |
| `spacingHorizontalXL` | 20px | Card padding |
| `spacingHorizontalXXL` | 24px | Page margins |
| `spacingVertical*` | Same scale | Vertical equivalents |

**Other:**

| Token | Use |
|---|---|
| `borderRadiusSmall` (2px) | Subtle rounding |
| `borderRadiusMedium` (4px) | Default (cards, inputs) |
| `borderRadiusLarge` (6px) | Prominent elements |
| `borderRadiusXLarge` (8px) | Large cards, modals |
| `borderRadiusCircular` (50%) | Avatars, badges |
| `shadow2` through `shadow64` | Elevation levels (2=subtle, 16=modal, 64=flyout) |
| `durationNormal` (300ms) | Standard transitions |
| `durationFast` (150ms) | Quick feedback |
| `curveEasyEase` | Default easing curve |

---

## makeStyles Patterns

Fluent V9 uses **Griffel** for CSS-in-JS — it generates atomic CSS at build time. Only class name selection happens at runtime, making it very performant.

### Basic Pattern

```tsx
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  highlighted: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
});

export const MyComponent = ({ isHighlighted }: { isHighlighted: boolean }) => {
  const styles = useStyles();
  return (
    <div className={mergeClasses(styles.root, isHighlighted && styles.highlighted)}>
      <h2 className={styles.header}>Title</h2>
    </div>
  );
};
```

### Conditional / Dynamic Styles

Since makeStyles is build-time optimized, you **cannot pass runtime values**. Pre-define variants and select with `mergeClasses`:

```tsx
const useStyles = makeStyles({
  base: { padding: tokens.spacingHorizontalM },
  sizeSmall: { fontSize: tokens.fontSizeBase200, padding: tokens.spacingHorizontalS },
  sizeLarge: { fontSize: tokens.fontSizeBase400, padding: tokens.spacingHorizontalL },
  statusError: { borderColor: tokens.colorPaletteRedBorder1 },
  statusSuccess: { borderColor: tokens.colorPaletteGreenBorder1 },
});

// In component:
const className = mergeClasses(
  styles.base,
  size === 'small' && styles.sizeSmall,
  size === 'large' && styles.sizeLarge,
  status === 'error' && styles.statusError,
);
```

For truly continuous runtime values (e.g., dynamic width from user input), use inline `style` props.

### Media Queries and Pseudo Selectors

```tsx
const useStyles = makeStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 1024px)': { gridTemplateColumns: '1fr 1fr' },
    '@media (max-width: 640px)': { gridTemplateColumns: '1fr' },
  },
  interactive: {
    cursor: 'pointer',
    transitionDuration: tokens.durationNormal,
    transitionProperty: 'background-color',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    ':focus-visible': {
      outlineColor: tokens.colorBrandStroke1,
      outlineWidth: '2px',
      outlineStyle: 'solid',
    },
  },
});
```

### CSS Shorthands

As of `@fluentui/react-components` v9.46+ (Griffel 2.0), CSS shorthand properties work **directly** in makeStyles. The `shorthands` helper is deprecated for most properties.

```tsx
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  card: {
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});
```

> **Exception:** `borderColor`, `borderStyle`, and `borderWidth` still require the `shorthands` helper due to Griffel internals. A codemod (`griffel-codemod-shorthands`) is available to migrate legacy code.

### Slot Styling

Prefer slot props over child selectors when styling Fluent component internals:

```tsx
// Preferred: slot prop
<Button icon={{ className: styles.myIcon, children: <AddRegular /> }} />

// Fallback: class name constants (when slots aren't enough)
import { buttonClassNames } from '@fluentui/react-components';

const useStyles = makeStyles({
  customButton: {
    [`& .${buttonClassNames.icon}`]: { fontSize: '24px' },
  },
});
```

---

## Component Patterns

### App Shell — Header + Sidebar + Content

```tsx
import {
  makeStyles, tokens,
  Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle,
  NavDrawer, NavDrawerBody, NavItem, NavSectionHeader,
  Button,
} from '@fluentui/react-components';
import { NavigationRegular, HomeRegular, PeopleRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: { display: 'flex', height: '100vh' },
  header: {
    display: 'flex',
    alignItems: 'center',
    height: '48px',
    padding: `0 ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  main: { flex: 1, overflow: 'auto', padding: tokens.spacingHorizontalXL },
});

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const styles = useStyles();
  const [isNavOpen, setNavOpen] = useState(true);

  return (
    <div className={styles.root}>
      <NavDrawer open={isNavOpen} type="inline" size="small">
        <NavDrawerBody>
          <NavSectionHeader>Main</NavSectionHeader>
          <NavItem icon={<HomeRegular />} value="home">Dashboard</NavItem>
          <NavItem icon={<PeopleRegular />} value="projects">Projects</NavItem>
        </NavDrawerBody>
      </NavDrawer>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className={styles.header}>
          <Button
            icon={<NavigationRegular />}
            appearance="transparent"
            onClick={() => setNavOpen(!isNavOpen)}
          />
          <span style={{ marginLeft: tokens.spacingHorizontalM }}>Contoso App</span>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
};
```

### Form — Field Composition

Fluent V9 forms use `Field` as the wrapper for labels, validation, and hints:

```tsx
import {
  Field, Input, Combobox, Option, Textarea, Button,
  makeStyles, tokens,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, maxWidth: '600px' },
  row: { display: 'flex', gap: tokens.spacingHorizontalL },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, justifyContent: 'flex-end' },
});

export const ProjectForm = () => {
  const styles = useStyles();
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form className={styles.form}>
      <Field
        label="Project Name"
        required
        validationMessage={errors.name}
        validationState={errors.name ? 'error' : 'none'}
      >
        <Input placeholder="Enter project name" />
      </Field>

      <div className={styles.row}>
        <Field label="Priority" style={{ flex: 1 }}>
          <Combobox placeholder="Select priority">
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Combobox>
        </Field>
        <Field label="Budget" style={{ flex: 1 }}>
          <Input type="number" contentBefore={<span>$</span>} />
        </Field>
      </div>

      <Field label="Description" hint="Provide a brief summary">
        <Textarea rows={4} />
      </Field>

      <div className={styles.actions}>
        <Button appearance="secondary">Cancel</Button>
        <Button appearance="primary" type="submit">Save Project</Button>
      </div>
    </form>
  );
};
```

### DataGrid — Sortable Table

```tsx
import {
  DataGrid, DataGridHeader, DataGridHeaderCell, DataGridBody,
  DataGridRow, DataGridCell, createTableColumn,
  TableColumnDefinition, Badge,
} from '@fluentui/react-components';

interface Project { id: string; name: string; status: string; budget: number; }

const columns: TableColumnDefinition<Project>[] = [
  createTableColumn({ columnId: 'name', renderHeaderCell: () => 'Project',
    renderCell: (item) => item.name, compare: (a, b) => a.name.localeCompare(b.name) }),
  createTableColumn({ columnId: 'status', renderHeaderCell: () => 'Status',
    renderCell: (item) => <Badge appearance="filled" color={
      item.status === 'Active' ? 'success' : item.status === 'At Risk' ? 'warning' : 'informative'
    }>{item.status}</Badge> }),
  createTableColumn({ columnId: 'budget', renderHeaderCell: () => 'Budget',
    renderCell: (item) => `$${item.budget.toLocaleString()}`,
    compare: (a, b) => a.budget - b.budget }),
];

export const ProjectGrid = ({ items }: { items: Project[] }) => (
  <DataGrid items={items} columns={columns} sortable getRowId={(item) => item.id}>
    <DataGridHeader><DataGridRow>
      {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
    </DataGridRow></DataGridHeader>
    <DataGridBody<Project>>
      {({ item, rowId }) => (
        <DataGridRow<Project> key={rowId}>
          {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
        </DataGridRow>
      )}
    </DataGridBody>
  </DataGrid>
);
```

### Dialog — Confirmation

```tsx
import {
  Dialog, DialogTrigger, DialogSurface, DialogTitle,
  DialogBody, DialogContent, DialogActions, Button,
} from '@fluentui/react-components';

export const ConfirmDialog = ({ onConfirm }: { onConfirm: () => void }) => (
  <Dialog>
    <DialogTrigger disableButtonEnhancement>
      <Button appearance="subtle" icon={<DeleteRegular />}>Delete</Button>
    </DialogTrigger>
    <DialogSurface>
      <DialogBody>
        <DialogTitle>Delete Project?</DialogTitle>
        <DialogContent>This action cannot be undone.</DialogContent>
        <DialogActions>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="secondary">Cancel</Button>
          </DialogTrigger>
          <Button appearance="primary" onClick={onConfirm}>Delete</Button>
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  </Dialog>
);
```

### Loading / Empty / Error States

```tsx
import { Spinner, MessageBar, MessageBarBody, tokens, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: tokens.spacingVerticalXXL },
  empty: { textAlign: 'center', color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXXL },
});

// Loading
export const Loading = () => {
  const styles = useStyles();
  return <div className={styles.center}><Spinner label="Loading projects..." /></div>;
};

// Error
export const ErrorState = ({ message }: { message: string }) => (
  <MessageBar intent="error"><MessageBarBody>{message}</MessageBarBody></MessageBar>
);

// Empty
export const EmptyState = ({ message }: { message: string }) => {
  const styles = useStyles();
  return <div className={styles.empty}><p>{message}</p></div>;
};
```

### Key Component Quick Reference

| Component | Key Props | Use Case |
|---|---|---|
| `Button` | `appearance` (primary/secondary/subtle/transparent/outline), `icon`, `size`, `disabled` | Actions |
| `Input` | `type`, `contentBefore`/`contentAfter`, `appearance`, `size` | Text entry |
| `Field` | `label`, `validationMessage`, `validationState`, `required`, `hint` | Form field wrapper |
| `Combobox` | `placeholder`, `multiselect`, `onOptionSelect` | Dropdowns, search |
| `Select` | `onChange`, `value` | Simple dropdowns (native-like) |
| `Dialog` | `open`, `onOpenChange`, `modalType` (modal/non-modal/alert) | Overlays, confirmations |
| `Menu` | Trigger + Popover + MenuList + MenuItem | Context menus, dropdowns |
| `DataGrid` | `items`, `columns`, `sortable`, `selectionMode`, `getRowId` | Data tables |
| `Card` | `appearance` (filled/subtle/outline), `size` | Content containers |
| `Drawer` / `NavDrawer` | `open`, `type` (inline/overlay), `position`, `size` | Sidebars, navigation |
| `Badge` | `appearance`, `color`, `size`, `shape` | Status indicators |
| `Avatar` | `name`, `image`, `size`, `badge` | User display |
| `Spinner` | `size`, `label` | Loading indicator |
| `Skeleton` | — (use `SkeletonItem` children) | Placeholder loading |
| `MessageBar` | `intent` (info/success/warning/error) | Inline notifications |
| `Toast` / `Toaster` | `useToastController`, `dispatchToast` | Transient notifications |
| `Toolbar` | Vertical/horizontal, ToolbarButton/ToolbarDivider | Action bars |
| `Tabs` / `Tab` | `selectedValue`, `onTabSelect` | Tab navigation |

---

## Responsive Layout

Fluent V9 has **no built-in responsive utilities**. Use standard CSS media queries through makeStyles:

```tsx
const BREAKPOINTS = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
};

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: tokens.spacingHorizontalL,
    [`@media (max-width: ${BREAKPOINTS.desktop})`]: { gridTemplateColumns: 'repeat(2, 1fr)' },
    [`@media (max-width: ${BREAKPOINTS.mobile})`]: { gridTemplateColumns: '1fr' },
  },
  sidebar: {
    width: '280px',
    [`@media (max-width: ${BREAKPOINTS.tablet})`]: { display: 'none' },
  },
});
```

For the sidebar, switch from `NavDrawer type="inline"` to `type="overlay"` on smaller screens using a `useMediaQuery` hook or `matchMedia`.

---

## Decision Guide: Fluent V9 vs Tailwind + shadcn/ui

| Factor | Fluent UI V9 | Tailwind + shadcn/ui |
|---|---|---|
| **Best for** | Microsoft-branded enterprise apps, internal tools | Custom-branded apps, marketing-facing, external portals |
| **Visual consistency** | Matches Teams, Outlook, MDA out of the box | Requires custom design work to match Microsoft look |
| **Dark mode** | Built-in theme system with `createDarkTheme` | Tailwind `dark:` variants + manual CSS variable setup |
| **Component library** | 50+ production-ready components | shadcn/ui components (copy-paste, fully customizable) |
| **Styling** | `makeStyles` (atomic CSS, build-time optimized) | Tailwind utility classes (pre-built, highly flexible) |
| **Bundle size** | Tree-shakeable but heavier per-component | Very small with purging |
| **Customization** | Token overrides, BrandVariants | Full CSS control, any design direction |
| **Learning curve** | Steeper (tokens, makeStyles, slot system) | Gentler (utility classes, copy-paste components) |
| **PCF/Genpage compat** | Same component library used by PCF and generative pages | Not compatible with PCF/genpage contexts |

**Rule of thumb:** If the app will sit alongside MDA, Teams, or Outlook — use Fluent V9. If you need maximum design freedom or are building for external audiences with custom branding — use Tailwind + shadcn/ui.

---

## Anti-Patterns

- **String concatenation for classes** — Never `classes.a + ' ' + classes.b`. Always use `mergeClasses()` to properly deduplicate atomic CSS
- **CSS shorthands in makeStyles (pre-v9.46)** — If on an older version, `margin: '4px 8px'` won't work — use `shorthands.margin('4px', '8px')`. On v9.46+, CSS shorthands work directly (except `borderColor`/`borderStyle`/`borderWidth`)
- **Multiple `makeResetStyles` on one element** — Only one `makeResetStyles` class per element. Use `makeStyles` for additional variations
- **Runtime values in makeStyles** — Build-time optimization means no dynamic values. Pre-define variants and select with `mergeClasses`, or use inline `style` for truly dynamic values
- **Using `!important`** — Never use it. Rely on `mergeClasses` ordering instead
- **Hardcoded colors instead of tokens** — `backgroundColor: '#ffffff'` breaks in dark mode. Use `tokens.colorNeutralBackground1`
- **`bundleIcon` inside render** — `bundleIcon(AddFilled, AddRegular)` creates a new component on every render. Define at module scope
- **Importing from `@fluentui/react` (v8)** — V8 and V9 are different libraries. V9 is `@fluentui/react-components`
- **Styling icons with `fill`** — Fluent icons use `fill="currentColor"`. Style with the `color` CSS property, not `fill`
- **Forgetting high-contrast testing** — Always test with `teamsHighContrastTheme`. Semantic tokens handle this automatically if you avoid hardcoded colors
- **Overusing nested FluentProviders** — Each provider creates a new set of CSS variables. Nest only when you genuinely need different theming (e.g., dark sidebar in light app), not for component isolation
