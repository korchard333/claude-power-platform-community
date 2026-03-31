# Canvas Apps — Screen Patterns & Responsive Design

## Master-Detail Pattern
```
BrowseScreen (Gallery + Search)
  ├── Gallery1
  │     Items: SortByColumns(
  │              Filter(Contacts, StartsWith(FullName, txtSearch.Text)),
  │              "fullname", SortOrder.Ascending
  │            )
  │     OnSelect: Navigate(DetailScreen, ScreenTransition.None, { varContactId: ThisItem.'Contact' })
  │
  ├── txtSearch (TextInput)
  │     OnChange: Reset(Gallery1)
  │
  └── btnNew (Button)
        OnSelect: Navigate(EditScreen, ScreenTransition.None, { varContactId: Blank() })

DetailScreen (Display Form)
  ├── DetailForm1
  │     DataSource: Contacts
  │     Item: LookUp(Contacts, 'Contact' = varContactId)
  │
  ├── btnEdit (Button)
  │     OnSelect: Navigate(EditScreen, ScreenTransition.None, { varContactId: varContactId })
  │
  └── btnDelete (Button)
        OnSelect:
          Remove(Contacts, LookUp(Contacts, 'Contact' = varContactId));
          Notify("Contact deleted", NotificationType.Success);
          Back();

EditScreen (Edit Form)
  ├── EditForm1
  │     DataSource: Contacts
  │     Item: If(IsBlank(varContactId), Defaults(Contacts), LookUp(Contacts, 'Contact' = varContactId))
  │     OnSuccess: Notify("Saved successfully", NotificationType.Success); Back();
  │     OnFailure: Notify("Save failed: " & EditForm1.Error, NotificationType.Error);
  │
  ├── btnSave (Button)
  │     OnSelect: SubmitForm(EditForm1)
  │
  └── btnCancel (Button)
        OnSelect: ResetForm(EditForm1); Back();
```

## Loading Pattern
```powerfx
// App.OnStart (or App.StartScreen with Formulas)
Set(gblIsLoading, true);
ClearCollect(colConfig, 'Environment Variable Values');
Set(gblUserRole, LookUp('Security Roles', ...));
Set(gblIsLoading, false);

// Loading screen
If(gblIsLoading,
    LoadingScreen,
    MainScreen
)
```

---

## Responsive Design

### Container-Based Layout
```
Use Containers (horizontal/vertical) instead of absolute positioning:

Screen
└── Vertical Container (fill width, fill height)
    ├── Header Container (fill width, height: 60px)
    │   ├── Logo (width: 40px)
    │   └── lblTitle (fill width)
    │
    ├── Body Container (fill width, fill remaining)
    │   ├── Sidebar Container (width: 280px, IF not mobile)
    │   └── Content Container (fill width)
    │
    └── Footer Container (fill width, height: 40px)

Responsive breakpoint:
  If(App.Width < 600, "mobile", If(App.Width < 1024, "tablet", "desktop"))
```

### Phone vs Tablet Layout
| Property | Phone | Tablet |
|---|---|---|
| App size | 640 x 1136 | 1366 x 768 |
| Orientation | Portrait | Landscape |
| Nav pattern | Bottom tabs / hamburger | Side nav |
| Gallery columns | 1 | 2-3 |
| Forms | Single column | 2-column with sections |
