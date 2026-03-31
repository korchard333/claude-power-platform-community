# Canvas Apps — Performance & Error Handling

## Performance Optimization

### Do's
- Use `ClearCollect` for data you'll reference multiple times (avoid repeated delegation calls)
- Use `Concurrent()` to load multiple data sources in parallel on App.OnStart
- Set `DelayOutput` on TextInput controls used for search (reduces API calls)
- Use explicit column selection in forms (don't bind to all columns)
- Use named formulas for computed values that don't change per-user-action
- Limit gallery items with `$top` or view-level filtering

### Don'ts
- Don't nest galleries more than 2 levels deep
- Don't use `CountRows(Filter(...))` — use `CountIf` instead (single delegation call)
- Don't put heavy logic in `OnVisible` for screens visited frequently
- Don't load large collections on App.OnStart if not needed immediately
- Don't use `ForAll` with `Patch` for bulk operations — use `Patch` with a table argument

### Concurrent Loading
```powerfx
// App.OnStart — load multiple sources in parallel
Concurrent(
    ClearCollect(colConfig, 'Environment Variable Values'),
    ClearCollect(colSecurityRoles, Filter('Security Roles', ...)),
    Set(gblUserEmail, User().Email),
    Set(gblUserName, User().FullName)
);
```

---

## Error Handling Patterns

### Form Validation
```powerfx
// Custom validation before submit
Set(
    gblValidationErrors,
    Concat(
        Filter(
            [
                { Field: "Email", Error: If(IsBlank(txtEmail.Text), "Email is required", "") },
                { Field: "Email", Error: If(!IsMatch(txtEmail.Text, Match.Email), "Invalid email format", "") },
                { Field: "Name", Error: If(IsBlank(txtName.Text), "Name is required", "") },
                { Field: "Amount", Error: If(Value(txtAmount.Text) <= 0, "Amount must be positive", "") }
            ],
            !IsBlank(Error)
        ),
        Error & Char(10)
    )
);

If(
    IsBlank(gblValidationErrors),
    SubmitForm(EditForm1),
    Notify(gblValidationErrors, NotificationType.Error)
);
```

### IfError Pattern
```powerfx
// Wrap operations that might fail
IfError(
    Patch(Contacts, Defaults(Contacts), {
        'First Name': txtFirstName.Text,
        'Last Name': txtLastName.Text
    }),
    Notify("Failed to save contact: " & FirstError.Message, NotificationType.Error)
);
```
