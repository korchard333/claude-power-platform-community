# Canvas Controls Reference

> For component libraries and modern control listing, see components.md.
> For responsive container layouts, see screens-responsive.md.

## Gallery

The most-used control for displaying lists of records.

| Property | Type | Description |
|---|---|---|
| `Items` | Table | Data source or collection to display |
| `Selected` | Record | Currently selected record |
| `AllItems` | Table | All records currently loaded in gallery |
| `TemplateFill` | Color | Background of each row; use `If(ThisItem.IsSelected, ...)` for highlight |
| `TemplateSize` | Number | Height of each row (vertical) or width (horizontal) in pixels |
| `TemplatePadding` | Number | Space between rows |
| `WrapCount` | Number | Columns in a wrap gallery (grid layout) |
| `OnSelect` | Action | Fires when row is tapped/clicked |
| `Default` | Record | Pre-selected record on load |

```powerfx
// Filtered and sorted gallery
Filter(
    Contacts,
    StartsWith('Last Name', txtSearch.Text),
    'Status (Status)' = 'Status (Contacts)'.Active
)

// Access selected record
Navigate(DetailScreen, ScreenTransition.None, {varContact: Gallery1.Selected})
```

**Gotcha:** `Gallery.Selected` persists the last selected record even after Items refresh — always check `IsBlank(Gallery1.Selected)` before using.

## Edit Form / Display Form

| Property | Type | Description |
|---|---|---|
| `DataSource` | DataSource | Table to read/write |
| `Item` | Record | Record to display/edit |
| `DefaultMode` | FormMode | `.New`, `.Edit`, `.View` |
| `OnSuccess` | Action | After successful submit |
| `OnFailure` | Action | After failed submit |
| `LastSubmit` | Record | Last successfully submitted record |
| `Valid` | Boolean | True if all required fields are filled |
| `Unsaved` | Boolean | True if user has changed any field |
| `Updates` | Record | Pending changes (before submit) |

```powerfx
// Submit with error handling
If(
    frmContact.Valid,
    SubmitForm(frmContact),
    Notify("Please fill all required fields", NotificationType.Error)
);

// OnSuccess handler
Notify("Saved successfully", NotificationType.Success);
Navigate(ListScreen, ScreenTransition.None);

// OnFailure handler
Notify("Save failed: " & frmContact.Error, NotificationType.Error)
```

**Mode switching:**
```powerfx
// Create
NewForm(frmContact); Navigate(FormScreen);
// Edit
EditForm(frmContact); Navigate(FormScreen, {varContactId: Gallery1.Selected.'Contact'});
// View only
ViewForm(frmContact);
```

## Text Input

| Property | Type | Description |
|---|---|---|
| `Default` | Text | Initial value |
| `Text` | Text | Current value (read-only from app perspective; user types into it) |
| `HintText` | Text | Placeholder text |
| `Format` | TextFormat | `.Text`, `.Number`, `.Email`, `.Multiline`, `.Password` |
| `MaxLength` | Number | Character limit |
| `DelayOutput` | Boolean | If true, `Text` updates only on blur (modern: always on blur) |
| `OnChange` | Action | Fires when value changes |

**Modern vs Classic:** Modern TextInput fires OnChange on **blur** (focus lost), not on every keystroke. Classic fires on every keystroke unless `DelayOutput` is true.

## ComboBox

| Property | Type | Description |
|---|---|---|
| `Items` | Table | Options to display |
| `DefaultSelectedItems` | Table | Pre-selected values |
| `SelectedItems` | Table | Currently selected values |
| `SelectMultiple` | Boolean | Allow multi-select |
| `IsSearchable` | Boolean | Enable type-to-search |
| `SearchFields` | List | Columns to search against |
| `OnChange` | Action | Fires when selection changes |

```powerfx
// Cascading dropdowns: filter cities by selected country
Filter(Cities, Country.Value = cmbCountry.Selected.Value)

// Multi-select: collect selected items
cmbSkills.SelectedItems
```

**Gotcha:** `ComboBox.Selected` returns the **first** selected item. Use `.SelectedItems` for multi-select scenarios.

## Button

| Property | Type | Description |
|---|---|---|
| `Text` | Text | Button label |
| `OnSelect` | Action | Click handler |
| `DisplayMode` | DisplayMode | `.Edit` (enabled), `.View` (disabled), `.Disabled` |
| `AutoDisableOnSelect` | Boolean | Prevent double-click during async operations |
| `PressedFill` | Color | Background while pressed |

```powerfx
// Conditional enable/disable
If(IsBlank(txtName.Text) Or IsBlank(txtEmail.Text), DisplayMode.Disabled, DisplayMode.Edit)

// Submit with loading pattern
Set(gblIsSubmitting, true);
Patch(Contacts, Defaults(Contacts), {Name: txtName.Text});
Set(gblIsSubmitting, false);
Notify("Saved!");
```

## Dropdown

| Property | Type | Description |
|---|---|---|
| `Items` | Table | Options; use `Choices(Table.Column)` for Choice columns |
| `Default` | Record/Text | Default selection |
| `Selected` | Record | Currently selected item |
| `AllowEmptySelection` | Boolean | Show blank option |
| `OnChange` | Action | Selection change handler |

```powerfx
// Choice column binding
Choices('Contacts'.'Preferred Method of Contact')

// Custom items
["High", "Medium", "Low"]
```

## DatePicker

| Property | Type | Description |
|---|---|---|
| `DefaultDate` | Date | Initial date |
| `SelectedDate` | Date | Current selection |
| `StartOfWeek` | StartOfWeek | First day of week |
| `StartYear` | Number | Earliest selectable year |
| `EndYear` | Number | Latest selectable year |
| `Format` | DateTimeFormat | Display format |

## Toggle / Checkbox

| Property | Type | Description |
|---|---|---|
| `Default` | Boolean | Initial state |
| `Value` | Boolean | Current state |
| `TrueText` / `FalseText` | Text | Labels (Toggle only) |
| `OnCheck` | Action | Fires when switched ON |
| `OnUncheck` | Action | Fires when switched OFF |
| `OnChange` | Action | Fires on any state change |

## DataTable

| Property | Type | Description |
|---|---|---|
| `Items` | Table | Data source |
| `SelectedItem` | Record | Selected row |
| `NoDataText` | Text | Shown when Items is empty |

**Limitation:** DataTable is **read-only** with auto-generated columns. For editable grids, use Gallery with input controls.

## Label

| Property | Type | Description |
|---|---|---|
| `Text` | Text | Display text (supports string interpolation: `$"Hello {varName}"`) |
| `HtmlText` | Text | Render HTML content |
| `AutoHeight` | Boolean | Expand to fit content |
| `Overflow` | Overflow | `.Hidden`, `.Scroll` |

## Image

| Property | Type | Description |
|---|---|---|
| `Image` | Image/Text | URL, data URI, or media reference |
| `ImagePosition` | ImagePosition | `.Fill`, `.Fit`, `.Stretch`, `.Tile`, `.Center` |
| `OnSelect` | Action | Click handler (use for image buttons) |

```powerfx
// Dynamic image from Dataverse
ThisItem.'Profile Image'

// Placeholder when no image
If(IsBlank(ThisItem.Photo), SampleImage, ThisItem.Photo)
```

## Container (Horizontal / Vertical)

| Property | Type | Description |
|---|---|---|
| `LayoutDirection` | LayoutDirection | `.Horizontal`, `.Vertical` |
| `LayoutJustifyContent` | LayoutJustifyContent | `.Start`, `.Center`, `.End`, `.SpaceBetween`, `.SpaceAround`, `.SpaceEvenly` |
| `LayoutAlignItems` | LayoutAlignItems | `.Start`, `.Center`, `.End`, `.Stretch` |
| `Gap` | Number | Space between child controls (pixels) |
| `Padding` | (Top/Right/Bottom/Left) | Inner padding |
| `LayoutWrap` | LayoutWrap | `.NoWrap`, `.Wrap` (for responsive grids) |

## Timer

| Property | Type | Description |
|---|---|---|
| `Duration` | Number | Milliseconds |
| `AutoStart` | Boolean | Start on screen visible |
| `Repeat` | Boolean | Loop continuously |
| `OnTimerEnd` | Action | Action when timer completes |
| `Start` | Boolean | Programmatic start/stop |

```powerfx
// Auto-refresh pattern (every 30 seconds)
// Timer: Duration=30000, AutoStart=true, Repeat=true
// OnTimerEnd:
Refresh(Projects); ClearCollect(colProjects, Filter(Projects, Status.Value = "Active"))
```

**Gotcha:** Set `AutoStart: false` during development — an auto-starting timer on a loading screen causes infinite refreshes.

## Camera / Barcode Scanner

| Property | Type | Description |
|---|---|---|
| `Stream` | Image | Live camera feed |
| `Photo` | Image | Captured photo (after OnSelect) |
| `OnSelect` | Action | Capture photo |
| `BarcodeType` | BarcodeType | (Scanner) `.Auto`, `.Code128`, `.QR`, etc. |
| `OnScan` | Action | (Scanner) Fires with scanned value |

## Modern vs Classic Differences

| Aspect | Classic Controls | Modern Controls |
|---|---|---|
| Style | Flat, customizable colors | Fluent 2 design system |
| TextInput OnChange | Per keystroke (unless DelayOutput) | On blur only |
| Border Radius | Per-corner control | Single `BorderRadius` property |
| Theming | Manual per control | Inherits app theme |
| Accessibility | Manual ARIA setup | Built-in ARIA roles |
| Minimum width | 0 | 100px (some controls) |

**Recommendation:** Use modern controls for new apps. Use classic only when you need per-keystroke input events or sub-100px widths.

## Common Property Categories

| Category | Properties |
|---|---|
| Core | `Items`, `Default`, `Text`, `Value`, `OnSelect`, `OnChange` |
| Display | `Visible`, `DisplayMode`, `Fill`, `Color`, `Font`, `FontSize`, `FontWeight` |
| Size/Position | `X`, `Y`, `Width`, `Height`, `Padding*`, `RadiusTopLeft/etc.` |
| Border | `BorderColor`, `BorderThickness`, `BorderStyle` |
| Accessibility | `AccessibleLabel`, `TabIndex`, `Role`, `Live` |
| State | `Focused`, `Pressed`, `Hovered`, `Disabled` (read-only) |

## Anti-Patterns / Gotchas

- Using DataTable for editable data — use Gallery + input controls instead
- Not handling `OnFailure` on forms — user gets no error feedback
- Gallery `OnSelect` referencing wrong scope in nested galleries — use `As` operator
- Timer with `AutoStart:true` on form screens — fires during navigation transitions
- Hardcoding `DisplayMode.Edit` — always check `IsBlank()` / form validity for conditional modes
- Ignoring `Unsaved` on forms — navigating away loses user input without warning
- Using `HtmlText` with untrusted data — potential XSS if rendering user-provided HTML

## Official Reference

- https://learn.microsoft.com/power-apps/maker/canvas-apps/reference-properties
- https://learn.microsoft.com/power-apps/maker/canvas-apps/controls/modern-controls-reference
