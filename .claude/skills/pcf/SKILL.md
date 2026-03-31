---
name: pcf
description: "PCF (Power Apps Component Framework) control development. Use when: building PCF controls, ReactControl, dataset controls, manifest patterns, Fluent UI v9 integration, Canvas App deployment, debugging PCF."
---

# Skill: PCF (Power Apps Component Framework)

## When to Use
Trigger when building, debugging, or reviewing PCF controls — TypeScript React components for Model-Driven or Canvas Apps.

---

## Project Structure

```
MyControl/
├── MyControl/
│   ├── index.ts              # Main control class (StandardControl or ReactControl)
│   ├── MyComponent.tsx       # React component
│   ├── css/styles.css        # Component styles
│   ├── strings/              # Resx localization files
│   └── generated/
│       └── ManifestTypes.d.ts  # Auto-generated from manifest
├── ControlManifest.Input.xml # Component manifest (properties, resources)
├── MyControl.pcfproj         # Project file
├── package.json
├── tsconfig.json
└── solutions/
    └── Solution.cdsproj      # Solution project for deployment
```

---

## Control Types

### ReactControl (Virtual — Recommended for New Development)
```typescript
// No DOM container — React manages rendering
export class MyControl implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private notifyOutputChanged: () => void;

  public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void): void {
    this.notifyOutputChanged = notifyOutputChanged;
  }

  public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    return React.createElement(MyComponent, {
      value: context.parameters.sampleProperty.raw ?? "",
      disabled: context.mode.isControlDisabled,
      onChange: (val: string) => {
        this._value = val;
        this.notifyOutputChanged();
      },
    });
  }

  public getOutputs(): IOutputs {
    return { sampleProperty: this._value };
  }

  public destroy(): void { /* cleanup */ }
  private _value: string = "";
}
```

### StandardControl (Legacy — Has DOM Container)
```typescript
// Gets a container div for direct DOM manipulation
export class MyControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container: HTMLDivElement;

  public init(context, notifyOutputChanged, state, container: HTMLDivElement): void {
    this.container = container;
  }

  public updateView(context): void {
    ReactDOM.render(React.createElement(MyComponent, props), this.container);
  }

  public destroy(): void {
    ReactDOM.unmountComponentAtNode(this.container);
  }
}
```

---

## Manifest Patterns

### Field Control
```xml
<control namespace="Contoso" constructor="MyControl" version="1.0.0"
         display-name-key="MyControl" description-key="MyControl_Desc"
         control-type="virtual">
  <property name="sampleProperty"
            display-name-key="Property_Display"
            description-key="Property_Desc"
            of-type="SingleLine.Text"
            usage="bound"
            required="true" />
  <resources>
    <code path="index.ts" order="1" />
    <css path="css/styles.css" order="1" />
  </resources>
</control>
```

### Dataset Control
```xml
<control ... control-type="virtual">
  <data-set name="dataSetGrid"
            display-name-key="DataSet_Display"
            cds-data-set-options="displayCommandBar:true;displayViewSelector:true">
  </data-set>
</control>
```

---

## Dataset Paging Pattern

```typescript
public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
  const dataset = context.parameters.dataSetGrid;

  if (dataset.loading) return React.createElement("div", null, "Loading...");

  const records = dataset.sortedRecordIds.map((id) => {
    const record = dataset.records[id];
    return {
      id,
      name: record.getFormattedValue("name"),
      status: record.getFormattedValue("statuscode"),
    };
  });

  const hasMore = dataset.paging.hasNextPage;
  const loadMore = () => dataset.paging.loadNextPage();

  return React.createElement(MyGrid, { records, hasMore, loadMore });
}
```

---

## Fluent UI v9 Integration

```typescript
// PERFORMANCE: Import guidance for Fluent UI v9
// The barrel import tree-shakes correctly with modern bundlers (webpack 5+, esbuild):
import { Button, Input, Label } from "@fluentui/react-components"; // OK with tree-shaking

// For smaller bundles, use individual package imports:
import { Button } from "@fluentui/react-button";
import { Input } from "@fluentui/react-input";
// Check package availability — not all components have separate packages

// Wrap in FluentProvider for consistent theming
public updateView(context): React.ReactElement {
  return React.createElement(
    FluentProvider,
    { theme: webLightTheme },
    React.createElement(MyComponent, props)
  );
}
```

## React Platform Library Versions

> Last verified: March 2026. Check [Microsoft Learn](https://learn.microsoft.com/power-apps/developer/component-framework/overview) for current versions.

> **IMPORTANT:** The PCF platform library does **NOT** use React 18. The actual versions are:

| Context | React Version | Notes |
|---|---|---|
| **Build (bundled)** | **16.14.0** | Version used at compile time |
| **Model-Driven App runtime** | **17.0.2** | Provided by the MDA shell at runtime |
| **Canvas App runtime** | **16.14.0** | Provided by the Canvas runtime |

**Do NOT use React 18-specific APIs** such as `useTransition`, `useDeferredValue`, `useSyncExternalStore`, or concurrent rendering features — they are not available in the platform library.

### Fluent UI v9 Version Constraints

| Context | Fluent UI v9 Version |
|---|---|
| **Build (max)** | **≤ 9.46.2** |
| **Runtime (provided)** | **9.68.0** |

Do not install Fluent UI v9 packages above 9.46.2 in your project — the build will succeed but runtime mismatches may cause unexpected behavior.

### ReactControl (Virtual — Recommended)

**ReactControl** (virtual, `control-type="virtual"`) uses the platform-provided React automatically — no manual `createRoot` needed. The `control-type="virtual"` attribute is **required** for React controls. This is the recommended approach for all new controls.

### StandardControl (Legacy — Has DOM Container)

For StandardControl using React, use `ReactDOM.render` / `ReactDOM.unmountComponentAtNode` (matching the React 16/17 API):

```typescript
import * as ReactDOM from "react-dom";

export class MyControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container: HTMLDivElement;

  public init(context, notifyOutputChanged, state, container: HTMLDivElement): void {
    this.container = container;
  }

  public updateView(context): void {
    ReactDOM.render(React.createElement(MyComponent, props), this.container);
  }

  public destroy(): void {
    ReactDOM.unmountComponentAtNode(this.container);
  }
}
```

**Recommendation:** Always prefer `ReactControl` (virtual) — it handles React lifecycle correctly and avoids DOM container issues.

### Platform Support Limitations

- **PCF controls are NOT supported in Power Pages** — only Model-Driven Apps and Canvas Apps
- When using platform libraries, do **not** bundle React or Fluent UI as externals — this causes double-loading

---

## CLI Workflow

```bash
# Create new control
pac pcf init --namespace Contoso --name MyControl --template field --framework react

# Install dependencies
npm install

# Local development with test harness
npm start watch    # Opens http://localhost:8181

# Build
npm run build

# Create solution project
pac solution init --publisher-name Contoso --publisher-prefix contoso
pac solution add-reference --path ../MyControl

# Build solution
dotnet build    # or msbuild /t:build /restore

# Push to environment (dev only)
pac pcf push --publisher-prefix contoso
```

---

## Best Practices

- Always implement `destroy()` — clean up event listeners, timers, subscriptions
- Always handle `context.mode.isControlDisabled` — disable inputs when form is read-only
- Always handle `context.mode.isVisible` — skip rendering when hidden
- Diff props in `updateView` before re-rendering to avoid flicker
- Use `control-type="virtual"` for React controls (required for platform library React)
- Never call `notifyOutputChanged()` inside `updateView()` — causes infinite loops
- Use `context.webAPI` for Dataverse operations (respects user security context)
- Use `context.navigation` for dialog/form opening
- Always specify `required-feature-set` in manifest when using WebAPI

---

## Debugging

1. **Test Harness**: `npm start watch` → `http://localhost:8181`
2. **In Environment**: Browser DevTools → Sources → webpack:// → find your .tsx files
3. **Fiddler/DevTools Network**: Capture `api/data/v9.2` calls for dataset debugging
4. Check `context.parameters.xxx.errorMessage` for binding errors
5. Check `context.parameters.xxx.security` for field-level security restrictions

---

## Canvas App Deployment

PCF controls can be used in Canvas Apps, but require additional manifest configuration.

### Enable for Canvas Apps
```xml
<!-- In ControlManifest.Input.xml — add feature-usage section -->
<control ... control-type="virtual">
  <property ... />

  <!-- Required for Canvas App support -->
  <feature-usage>
    <uses-feature name="utility" required="true" />
    <uses-feature name="WebAPI" required="true" />
  </feature-usage>

  <resources>
    <code path="index.ts" order="1" />
  </resources>
</control>
```

### Canvas App vs Model-Driven App Differences
| Feature | Model-Driven App | Canvas App |
|---|---|---|
| `context.webAPI` | Available | Available (if declared in feature-usage) |
| `context.navigation` | Full support | Limited (no openForm) |
| `context.mode.isControlDisabled` | Managed by form | Managed by app maker |
| Dataset controls | Full support | Supported (with limitations) |
| Theming | Inherits MDA theme | Inherits Canvas theme |
| `notifyOutputChanged()` | Triggers form dirty | Triggers OnChange in Canvas |

### Import to Canvas App
```
Canvas App → Insert → Get more components → Code tab → Import → Select your PCF control
```

---

## Anti-Patterns

- Calling `notifyOutputChanged()` in `updateView()` (infinite render loop)
- Not implementing `destroy()` (memory leaks, stale listeners)
- Ignoring `isControlDisabled` (control remains editable on read-only forms)
- Using `any` types for context parameters
- Hardcoding entity names or field names (use manifest properties)
- Not handling loading state for dataset controls
- Using React 18-specific APIs (`useTransition`, `useDeferredValue`, concurrent features) — platform provides React 16.14.0/17.0.2
- Bundling React/Fluent UI as externals when using platform libraries (causes double-loading)

---

## Sub-Files

- **[PCF API Reference](api-reference.md)** — Context object properties, context.mode, context.webAPI methods, context.navigation, context.device, context.formatting, DataSet API (columns/filtering/paging/records), EntityRecord methods, custom events, platform availability matrix (MDA vs Canvas vs Portals)

---

## Related Skills

- `code-apps` — React/TypeScript patterns shared with PCF development
- `accessibility-ux` — WCAG compliance requirements for PCF controls
