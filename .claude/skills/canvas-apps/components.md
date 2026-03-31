# Canvas Apps — Component Library & Modern Controls

## Creating Reusable Components
```
1. Create a Component Library (separate from app)
2. Define custom properties:
   - Input properties: data passed IN to the component
   - Output properties: data passed OUT from the component
   - Event properties: callbacks (e.g., OnSelect, OnChange)
3. Import component library into apps
```

## Component Property Types
| Property Type | Direction | Example |
|---|---|---|
| Input | In | `Text`, `Number`, `Record`, `Table`, `Boolean`, `Color` |
| Output | Out | Computed values the parent reads |
| Event | Callback | `OnSelect`, `OnChange` — runs parent formula |

## Component Example
```
Component: cmpStatusBadge
  Input Properties:
    - Status (Text): The status text to display
    - StatusColor (Color): Badge color

  Controls inside component:
    - lblStatus (Label):
        Text: cmpStatusBadge.Status
        Fill: cmpStatusBadge.StatusColor
        Color: If(Luminance(cmpStatusBadge.StatusColor) < 0.5, White, Black)
```

---

## Modern Controls (Fluent 2 — GA)

Modern controls are based on Microsoft Fluent 2 design system. They replace classic controls and are the recommended choice for new apps.

### When to Use Modern Controls
- New apps: always use modern controls
- Existing apps: migrate incrementally — cannot mix modern and classic on the same screen

### Available Modern Controls (GA)
```
Button, Text Input, Checkbox, Toggle, Slider, Rating, Badge,
DatePicker, TimePicker, ComboBox, InfoButton, Link, Spinner,
ProgressBar, Divider, Container, Horizontal/Vertical Container,
Header, Sidebar, Breadcrumb, Tabs, Flyout
```

### Still in Preview
```
Card, Dropdown, Stream, Table, Copilot Answer
```

### Modern Theming
```powerfx
// Set theme at app level — all modern controls inherit automatically
App.Theme = {
    palette: {
        themePrimary: "#2563EB",
        themeSecondary: "#1D4ED8",
        neutralPrimary: "#1F2937"
    }
}
// No need to set colors on individual controls
```

### Important Behavioural Difference (vs Classic)
```
Text Input (modern): OnChange fires on focus-out (not every keystroke)
Text Input (classic): OnChange fires on every keystroke

Impact: Search-as-you-type requires explicit handling — use OnChange with
DelayOutput=false if you need immediate response, or embrace the focus-out
behaviour for better performance.
```
