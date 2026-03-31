# Power Fx Operators Reference

> For delegation behavior of operators, see delegation.md.
> For functions, see power-fx.md and power-fx-functions.md.

## Arithmetic Operators
| Operator | Example | Notes |
|---|---|---|
| `+` | `5 + 3` → `8` | Addition; also date + number (adds days) |
| `-` | `10 - 4` → `6` | Subtraction; date - date returns days |
| `*` | `3 * 4` → `12` | Multiplication |
| `/` | `10 / 3` → `3.333...` | Division; division by zero returns Blank |
| `^` | `2 ^ 10` → `1024` | Exponentiation |
| `%` | `50%` → `0.5` | Percentage (postfix) |
| `&` | `"Hello" & " " & "World"` | String concatenation |

## Comparison Operators
| Operator | Example | Notes |
|---|---|---|
| `=` | `Price = 100` | Equal (case-insensitive for text) |
| `<>` | `Status <> "Closed"` | Not equal |
| `<` | `Age < 18` | Less than |
| `>` | `Revenue > 1000000` | Greater than |
| `<=` | `Score <= 100` | Less than or equal |
| `>=` | `StartDate >= Today()` | Greater than or equal |

Note: Text comparisons are **case-insensitive** by default (`"abc" = "ABC"` is `true`). Use `Exact()` for case-sensitive comparison.

## Logical Operators
| Operator | Alternative | Example |
|---|---|---|
| `And` | `&&` | `Age >= 18 And HasLicense` |
| `Or` | `\|\|` | `IsAdmin Or IsSupervisor` |
| `Not` | `!` | `Not IsBlank(Email)` |

## Membership Operators
| Operator | Example | Notes |
|---|---|---|
| `in` | `"app" in "apple"` → true | Case-insensitive substring for text; membership for tables |
| `exactin` | `"App" exactin "apple"` → false | Case-sensitive version of `in` |
| `in` (table) | `record in Table` | Checks if record exists in table |

Important: `in` against a **local collection** is NOT delegable. `in` against a data source column IS delegable for Dataverse.

## Scope / Context Operators
| Operator | Use | Example |
|---|---|---|
| `ThisItem` | Current record in Gallery/DataTable | `ThisItem.Name` |
| `ThisRecord` | Current record in ForAll/With/other record scope | `ForAll(Items, ThisRecord.Price * ThisRecord.Qty)` |
| `Self` | Reference to the current control | `Self.Width / 2` |
| `Parent` | Reference to parent container/component | `Parent.Width - 20` |
| `As` | Rename a record scope | `Gallery1 As galOuter` — then `galOuter.Selected` in nested gallery |

### @ Disambiguation Operator
```powerfx
// When a column name conflicts with a control name or global:
[@Contacts]              // The data source "Contacts" (not a control named Contacts)
Gallery1.Selected.[@Name] // The column "Name" from the record (not a control named Name)
```
Use `[@...]` when a data source or column name collides with a control, variable, or enum name.

## Chaining Operator
```powerfx
// Semicolon chains behavior statements (OnSelect, OnChange, OnVisible, etc.)
Navigate(DetailScreen); Set(gblLastViewed, Gallery1.Selected.ID); Notify("Navigating...")

// In European locales where ; is the decimal separator, use ;;
Navigate(DetailScreen);; Set(gblLastViewed, Gallery1.Selected.ID)
```
Only valid in **behavior properties** (OnSelect, OnChange, OnVisible, OnHidden, OnStart, OnReset, OnTimerEnd). NOT valid in data/display properties (Text, Items, Fill, etc.).

## Type Operators
```powerfx
// Polymorphic lookup handling (e.g., Regarding field on Activity)
If(
    IsType(ThisItem.Regarding, Accounts),
    AsType(ThisItem.Regarding, Accounts).Name,
    IsType(ThisItem.Regarding, Contacts),
    AsType(ThisItem.Regarding, Contacts).'Full Name',
    "Unknown"
)
```

## Operator Precedence (highest to lowest)
| Precedence | Operators |
|---|---|
| 1 (highest) | `%` (percent) |
| 2 | `^` (power) |
| 3 | `-` (unary negation) |
| 4 | `*`, `/` |
| 5 | `+`, `-` |
| 6 | `&` (concatenation) |
| 7 | `=`, `<>`, `<`, `<=`, `>`, `>=` |
| 8 | `in`, `exactin` |
| 9 | `Not`, `!` |
| 10 | `And`, `&&` |
| 11 (lowest) | `Or`, `\|\|` |

Use parentheses to override: `(A Or B) And C`

## Anti-Patterns / Gotchas
- Using `=` when `Exact()` is needed for case-sensitive matching
- Forgetting `As` in nested galleries — inner `ThisItem` overrides outer
- Using `;` in European locales (need `;;` or switch authoring language)
- Assuming `in` is always delegable — `value in localCollection` is NOT delegable
- Using `ThisItem` outside Gallery/DataTable context (use `ThisRecord` in ForAll/With)
- Operator precedence surprises: `Not A And B` means `(Not A) And B`, not `Not (A And B)`

## Official Reference
- https://learn.microsoft.com/power-platform/power-fx/reference/operators
- https://learn.microsoft.com/power-platform/power-fx/expression-grammar
