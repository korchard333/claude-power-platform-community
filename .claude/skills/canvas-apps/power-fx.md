# Canvas Apps — Power Fx Fundamentals

## Data Types
| Type | Example | Notes |
|---|---|---|
| Text | `"Hello"` | Strings |
| Number | `42`, `3.14` | No separate int/float distinction |
| Boolean | `true`, `false` | |
| Date | `Date(2026,3,22)` | Date only |
| DateTime | `DateTimeValue("2026-03-22T14:30:00")` | Date + time |
| Time | `Time(14,30,0)` | Time only |
| Record | `{Name: "Jane", Age: 30}` | Single row |
| Table | `[{Name: "Jane"}, {Name: "John"}]` | Collection of records |
| Color | `Color.Red`, `RGBA(255,0,0,1)` | |
| GUID | `GUID("00000000-...")` | Record identifiers |
| Blank | `Blank()` | Null equivalent |
| Enum | `SortOrder.Ascending` | Named constants |

## Core Functions Reference

### Data Operations
```powerfx
// Retrieve records from Dataverse
ClearCollect(
    colContacts,
    Filter(
        Contacts,
        'Status (Status)' = 'Status (Contacts)'.Active,
        StartsWith('Last Name', TextInput1.Text)
    )
);

// Sort
SortByColumns(
    colContacts,
    "lastname", SortOrder.Ascending,
    "firstname", SortOrder.Ascending
)

// Lookup single record
LookUp(Contacts, 'Contact' = varSelectedId)

// First / Last
First(SortByColumns(Contacts, "createdon", SortOrder.Descending))

// Count
CountRows(Filter(Contacts, 'Status (Status)' = 'Status (Contacts)'.Active))

// Distinct values
Distinct(Contacts, 'Company Name')

// Group by
GroupBy(
    Contacts,
    "company",
    "ContactsByCompany"
)
```

### Create / Update / Delete
```powerfx
// Create (Patch with Defaults)
Patch(
    Contacts,
    Defaults(Contacts),
    {
        'First Name': txtFirstName.Text,
        'Last Name': txtLastName.Text,
        'Email': txtEmail.Text,
        'Company Name': drpCompany.Selected
    }
);

// Update existing record
Patch(
    Contacts,
    LookUp(Contacts, 'Contact' = varSelectedId),
    {
        'Email': txtEmail.Text,
        'Phone': txtPhone.Text
    }
);

// Delete
Remove(Contacts, LookUp(Contacts, 'Contact' = varSelectedId));

// Bulk create from collection
ForAll(
    colImportData,
    Patch(
        Contacts,
        Defaults(Contacts),
        {
            'First Name': ThisRecord.FirstName,
            'Last Name': ThisRecord.LastName
        }
    )
);
```

### Navigation
```powerfx
// Navigate to screen with transition
Navigate(DetailScreen, ScreenTransition.Fade);

// Navigate with context variable
Navigate(
    DetailScreen,
    ScreenTransition.None,
    { varContactId: Gallery1.Selected.'Contact' }
);

// Back navigation
Back();
```

### Variables
```powerfx
// Global variable (available across all screens)
Set(gblUserName, User().FullName);
Set(gblIsAdmin, false);

// Context variable (screen-local)
UpdateContext({ locIsEditing: true, locErrorMessage: "" });

// Collection (in-memory table)
ClearCollect(colSelectedItems, []);
Collect(colSelectedItems, Gallery1.Selected);
Remove(colSelectedItems, ThisItem);
Clear(colSelectedItems);
```

---

## Named Formulas (App.Formulas)

Named formulas replace global variable declarations in `App.OnStart`. They're always up to date, evaluated lazily, and can improve app load time by up to 80%.

### Named Formula vs Set() Variable
```powerfx
// OLD: App.OnStart (runs sequentially, timing-dependent)
Set(gblUserName, User().FullName);
Set(gblIsAdmin, LookUp('Security Roles', Name = "System Administrator") <> Blank());

// NEW: App.Formulas (lazy, parallel, always current)
gblUserName = User().FullName;
gblIsAdmin = LookUp('Security Roles', Name = "System Administrator") <> Blank();
```

### Rules
- Named formulas are **immutable** — define once, they recalculate automatically
- Cannot use **behavior functions** (Navigate, Patch, Set, Collect) in named formulas
- Cannot create circular references
- Calculated in **parallel** (unlike App.OnStart which is sequential)
- Available **immediately** on app load (no timing wait)

### User-Defined Functions (UDFs) in Formulas
```powerfx
// Define a reusable function (App.Formulas)
IsWeekday(d: Date): Boolean = Weekday(d, StartOfWeek.Monday) <= 5;
FormatCurrency(amount: Number): Text = "$" & Text(amount, "[$-en-US]#,##0.00");

// Use anywhere in app
IsWeekday(DatePicker1.SelectedDate)
FormatCurrency(varTotalAmount)
```
