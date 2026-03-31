# Power Fx Function Reference

> For core data operations (Filter, Sort, LookUp, Patch, Remove, ForAll), variables (Set, UpdateContext, ClearCollect), and navigation (Navigate, Back), see power-fx.md.
> For operators and precedence, see power-fx-operators.md.

## Text Functions

| Function | Syntax | Delegable | Notes |
|---|---|---|---|
| `Concat` | `Concat(Table, Expression [, Separator])` | No | Concatenate column values across rows |
| `Concatenate` | `Concatenate(String1, String2, ...)` | — | Join strings; prefer `&` operator |
| `Left` | `Left(String, Count)` | No | First N characters |
| `Mid` | `Mid(String, Start, Count)` | No | Substring (1-based index) |
| `Right` | `Right(String, Count)` | No | Last N characters |
| `Len` | `Len(String)` | No | String length |
| `Lower` / `Upper` / `Proper` | `Lower(String)` | — | Case conversion |
| `Trim` | `Trim(String)` | — | Remove leading/trailing/extra spaces |
| `TrimEnds` | `TrimEnds(String)` | — | Remove leading/trailing spaces only |
| `Substitute` | `Substitute(String, Old, New [, Count])` | — | Replace occurrences |
| `Replace` | `Replace(String, Start, Count, New)` | — | Replace by position |
| `Find` | `Find(FindStr, WithinStr [, Start])` | — | Position of substring (case-sensitive, 1-based, Blank if not found) |
| `StartsWith` | `StartsWith(Text, Start)` | **Yes** (Dataverse) | Prefix check |
| `EndsWith` | `EndsWith(Text, End)` | No (Dataverse) | Suffix check |
| `Text` | `Text(Value, Format)` | — | Format number/date/time to string |
| `Value` | `Value(String)` | — | Parse string to number |
| `Split` | `Split(String, Separator)` | — | Returns single-column table |
| `EncodeUrl` | `EncodeUrl(String)` | — | URL-encode |
| `PlainText` | `PlainText(HtmlString)` | — | Strip HTML tags |
| `Match` | `Match(Text, Pattern)` | — | First regex match |
| `MatchAll` | `MatchAll(Text, Pattern)` | — | All regex matches as table |
| `IsMatch` | `IsMatch(Text, Pattern)` | — | Boolean regex test |

### Regex Patterns (for Match/MatchAll/IsMatch)
```powerfx
// Email validation
IsMatch(txtEmail.Text, "^[\w.-]+@[\w.-]+\.\w{2,}$")

// Extract numbers
MatchAll("Order 123 has 5 items", "\d+")
// Returns table: {FullMatch: "123"}, {FullMatch: "5"}

// Named groups
Match("2026-03-28", "(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})")
// Result: {year: "2026", month: "03", day: "28"}
```

Predefined patterns: `Email`, `Hyphenated`, `Digit`, `Letter`, `MultipleLetters`, `MultipleDigits`, `Comma`, `Period`, `OptionalDigits`, `MultipleSpaces`, `Any`

## Math Functions

| Function | Syntax | Notes |
|---|---|---|
| `Abs` | `Abs(Number)` | Absolute value |
| `Round` | `Round(Number, Decimals)` | Round to N decimal places |
| `RoundUp` | `RoundUp(Number, Decimals)` | Always round up (away from zero) |
| `RoundDown` | `RoundDown(Number, Decimals)` | Always round toward zero (truncate) |
| `Int` | `Int(Number)` | Round down to nearest integer |
| `Mod` | `Mod(Number, Divisor)` | Remainder after division |
| `Power` | `Power(Base, Exponent)` | Same as `^` operator |
| `Sqrt` | `Sqrt(Number)` | Square root |
| `Exp` | `Exp(Number)` | e raised to power |
| `Ln` | `Ln(Number)` | Natural logarithm |
| `Log` | `Log(Number [, Base])` | Logarithm (default base 10) |
| `Rand` | `Rand()` | Random number 0 ≤ x < 1 |
| `RandBetween` | `RandBetween(Min, Max)` | Random integer in range |
| `Sequence` | `Sequence(Count [, Start [, Step]])` | Generate number table |
| `Sum` | `Sum(Table, Expression)` | Sum column; also `Sum(N1, N2, ...)` |
| `Average` | `Average(Table, Expression)` | Mean |
| `Min` / `Max` | `Min(Table, Expression)` | Minimum/Maximum |
| `StdevP` / `VarP` | `StdevP(Table, Expression)` | Population standard deviation / variance |
| `Count` | `Count(Table)` | Count numeric values |
| `CountA` | `CountA(Table)` | Count non-blank values |
| `CountIf` | `CountIf(Table, Condition)` | Count rows matching condition |
| `CountRows` | `CountRows(Table)` | Count all rows |

## Date & Time Functions

| Function | Syntax | Notes |
|---|---|---|
| `Date` | `Date(Year, Month, Day)` | Create date |
| `Time` | `Time(Hour, Minute, Second)` | Create time |
| `DateValue` | `DateValue(String)` | Parse date string |
| `DateTimeValue` | `DateTimeValue(String)` | Parse datetime string |
| `TimeValue` | `TimeValue(String)` | Parse time string |
| `DateAdd` | `DateAdd(DateTime, Amount, Units)` | Add to date; Units: `TimeUnit.Years/Quarters/Months/Days/Hours/Minutes/Seconds/Milliseconds` |
| `DateDiff` | `DateDiff(Start, End, Units)` | Difference between dates |
| `Year` / `Month` / `Day` | `Year(Date)` | Extract component |
| `Hour` / `Minute` / `Second` | `Hour(DateTime)` | Extract time component |
| `Weekday` | `Weekday(Date [, StartOfWeek])` | Day of week (1-7) |
| `WeekNum` | `WeekNum(Date [, StartOfWeek])` | Week number in year |
| `Today` | `Today()` | Current date (no time) |
| `Now` | `Now()` | Current date and time |
| `IsToday` | `IsToday(DateTime)` | Is date today? |
| `EDate` | `EDate(Date, Months)` | Add months to date |
| `EOMonth` | `EOMonth(Date, Months)` | Last day of month N months away |
| `Calendar` | `Calendar.MonthsLong`, `.MonthsShort`, `.WeekdaysLong`, `.WeekdaysShort` | Localized name tables |

### Date Patterns
```powerfx
// Age calculation
DateDiff(ThisItem.'Date of Birth', Today(), TimeUnit.Years)

// Business days check (exclude weekends)
With(
    {wd: Weekday(DatePicker1.SelectedDate, StartOfWeek.Monday)},
    wd <= 5
)

// Format date for display
Text(ThisItem.'Created On', "[$-en-US]mmmm d, yyyy h:mm AM/PM")

// ISO 8601 format for API calls
Text(Now(), "yyyy-mm-ddThh:mm:ss") & "Z"
```

## Logical & Conditional Functions

| Function | Syntax | Notes |
|---|---|---|
| `If` | `If(Condition, ThenResult [, ElseResult])` | Chained: `If(C1, R1, C2, R2, ..., Default)` |
| `Switch` | `Switch(Value, Match1, Result1, Match2, Result2, ..., Default)` | Prefer over deeply nested If |
| `Coalesce` | `Coalesce(Value1, Value2, ...)` | First non-blank value |
| `IsBlank` | `IsBlank(Value)` | True if Blank/null/empty string |
| `IsEmpty` | `IsEmpty(Table)` | True if table has zero rows |
| `IsError` | `IsError(Value)` | True if value is an error |
| `IfError` | `IfError(Value, Replacement [, Value2, Replacement2])` | Error handler |
| `IsNumeric` | `IsNumeric(String)` | Can string be parsed as number? |
| `IsType` | `IsType(Record, TableType)` | Polymorphic type check |
| `AsType` | `AsType(Record, TableType)` | Polymorphic type cast |
| `Error` | `Error({Kind: ErrorKind.Validation, Message: "..."})` | Raise an error |

### Error Handling Pattern
```powerfx
// Wrap risky operations with IfError
IfError(
    Patch(Orders, Defaults(Orders), {Name: txtName.Text}),
    Notify("Failed to save: " & FirstError.Message, NotificationType.Error)
)

// Propagate or replace errors
IfError(
    Value(txtPrice.Text),
    0  // Default to 0 if not a number
)
```

## Table Shaping Functions

| Function | Syntax | Notes |
|---|---|---|
| `AddColumns` | `AddColumns(Table, "NewCol", Expression)` | Add computed columns |
| `DropColumns` | `DropColumns(Table, "Col1", "Col2")` | Remove columns |
| `RenameColumns` | `RenameColumns(Table, "Old", "New")` | Rename columns |
| `ShowColumns` | `ShowColumns(Table, "Col1", "Col2")` | Keep only specified columns |
| `Table` | `Table({A:1}, {A:2})` | Create inline table |
| `Ungroup` | `Ungroup(Table, "GroupColumn")` | Flatten grouped table |
| `With` | `With({x: Expensive()}, x * x)` | Named scope / let binding |
| `Relate` | `Relate(ForeignTable, Record)` | Create relationship |
| `Unrelate` | `Unrelate(ForeignTable, Record)` | Remove relationship |

### AddColumns Pattern
```powerfx
// Add computed columns for display
AddColumns(
    Filter(Projects, Status.Value = "Active"),
    "DaysRemaining", DateDiff(Today(), 'Due Date', TimeUnit.Days),
    "IsOverdue", 'Due Date' < Today(),
    "OwnerName", 'Project Owner'.'Full Name'
)
```

## Form Functions

| Function | Syntax | Notes |
|---|---|---|
| `SubmitForm` | `SubmitForm(FormControl)` | Save form data |
| `ResetForm` | `ResetForm(FormControl)` | Reset to defaults |
| `EditForm` | `EditForm(FormControl)` | Switch to edit mode |
| `NewForm` | `NewForm(FormControl)` | Switch to new record mode |
| `ViewForm` | `ViewForm(FormControl)` | Switch to view-only mode |
| `Refresh` | `Refresh(DataSource)` | Reload data source |
| `Reset` | `Reset(Control)` | Reset a single control to default |
| `Revert` | `Revert(DataSource [, Record])` | Discard local changes |

## Behavior / Action Functions

| Function | Syntax | Notes |
|---|---|---|
| `Launch` | `Launch(URL [, Params])` | Open URL in new tab/window |
| `Exit` | `Exit([Restart])` | Close the app |
| `Concurrent` | `Concurrent(Action1, Action2, ...)` | Run actions in parallel |
| `Notify` | `Notify(Message, NotificationType)` | Show toast; types: `.Success`, `.Error`, `.Warning`, `.Information` |
| `Confirm` | `Confirm(Message)` | Modal yes/no dialog; returns boolean |
| `Copy` | `Copy(Text)` | Copy to clipboard |
| `Download` | `Download(URL)` | Download file (browser only) |
| `RequestHide` | `RequestHide()` | Close a dialog/popup (in Canvas component dialogs) |

### Concurrent Loading
```powerfx
// Load multiple data sources simultaneously on screen OnVisible
Concurrent(
    ClearCollect(colProjects, Filter(Projects, Status.Value = "Active")),
    ClearCollect(colTeamMembers, 'Team Members'),
    Set(gblUserProfile, LookUp(Users, 'User ID' = User().Email))
)
```

## JSON & Dynamic Data

| Function | Syntax | Notes |
|---|---|---|
| `JSON` | `JSON(DataStructure [, Format])` | Serialize to JSON string; Format: `JSONFormat.IndentFour`, `.Compact`, `.IncludeBinaryData`, `.FlattenValueTables` |
| `ParseJSON` | `ParseJSON(String)` | Returns Untyped Object |

### ParseJSON Pattern
```powerfx
// Parse API response and access typed values
With(
    {response: ParseJSON(flowResult)},
    {
        Name: Text(response.name),
        Count: Value(response.count),
        Items: ForAll(
            Table(response.items),
            {ItemName: Text(ThisRecord.Value.name)}
        )
    }
)
```

Untyped Object access: Use `Text()`, `Value()`, `Boolean()`, `DateValue()`, `Table()` to convert before use. Direct property access like `ParseJSON(x).name` returns Untyped — must wrap in conversion function.

## Environment & User Functions

| Function | Syntax | Returns |
|---|---|---|
| `User()` | `User()` | `.Email`, `.FullName`, `.Image` |
| `Language()` | `Language()` | User's language tag (e.g., "en-US") |
| `Param()` | `Param("paramName")` | URL parameter value |
| `Environment` | `Environment.Name`, `.Region`, `.TenantId` | Environment info |
| `Host` | `Host.BrowserUserAgent`, `.OSType`, `.SessionID`, `.TenantID` | Host info |
| `App` | `App.ActiveScreen`, `.Width`, `.Height`, `.ConfirmExit` | App-level properties |

## Anti-Patterns / Gotchas

- Using `If` with 5+ branches — use `Switch` instead
- Nesting `ForAll` inside `ForAll` for bulk Patch — use `Patch(Table, CollectionOfChanges)` single-call pattern
- `Text(date)` without format string — locale-dependent, unpredictable across regions
- Confusing `IsBlank` vs `IsEmpty`: `IsBlank` is for scalar values/records, `IsEmpty` is for tables
- Using `CountRows(Filter(...))` when `CountIf(...)` is cleaner
- Forgetting `Concurrent()` — sequential data loading doubles screen load time
- `Value("abc")` returns error, not Blank — wrap in `IfError(Value(x), 0)`
- `ParseJSON` properties are Untyped — always wrap in `Text()`, `Value()`, etc.

## Official Reference

- https://learn.microsoft.com/power-platform/power-fx/formula-reference-canvas-apps
- https://learn.microsoft.com/power-platform/power-fx/data-types
- https://learn.microsoft.com/power-platform/power-fx/error-handling
