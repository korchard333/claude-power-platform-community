# Canvas Apps — Connectors, Data Sources & Integration

## Connector Types
| Type | License | Examples |
|---|---|---|
| Standard | Included | SharePoint, Office 365, Outlook, Teams, OneDrive |
| Premium | Power Apps Premium | Dataverse, SQL Server, HTTP, Custom Connectors |
| Custom | Power Apps Premium | Any REST API via custom connector |

## Dataverse Connector Best Practices
```powerfx
// ALWAYS use column-specific Select (implicit in Canvas but mind delegation)
// ALWAYS filter at server (delegable functions)
// NEVER load entire tables without filter

// Lookup column access
Gallery1.Selected.'Account Name'.'Account Name'  // Display name
Gallery1.Selected.'Account Name'.Account          // GUID

// Polymorphic lookups (e.g., Customer = Account OR Contact)
If(
    IsType(ThisItem.'Company Name', Accounts),
    "Account: " & AsType(ThisItem.'Company Name', Accounts).'Account Name',
    "Contact: " & AsType(ThisItem.'Company Name', Contacts).'Full Name'
)

// Choice column
ThisItem.'Status (Status)' = 'Status (Contacts)'.Active  // Compare with enum
Text(ThisItem.'Priority')                                  // Get display text
```

## SharePoint Connector Patterns
```powerfx
// Filter SharePoint list (delegable subset)
Filter(
    'Project Tasks',
    Status.Value = "In Progress",
    AssignedTo.Email = User().Email
)

// SharePoint lookups
Patch(
    'Project Tasks',
    Defaults('Project Tasks'),
    {
        Title: "New Task",
        Status: {Value: "Not Started"},
        AssignedTo: {
            Claims: "i:0#.f|membership|" & User().Email,
            Department: "",
            DisplayName: User().FullName,
            Email: User().Email,
            JobTitle: "",
            Picture: ""
        }
    }
)
```

---

## Power Automate Integration

### Calling a Flow from Canvas App
```powerfx
// In the flow: PowerApps (V2) trigger with defined inputs
// In the app:
Set(
    varFlowResult,
    'Flow-ProcessOrder'.Run(
        txtOrderId.Text,          // Input parameter 1
        drpPriority.Selected.Value // Input parameter 2
    )
);

// Access flow response
If(
    varFlowResult.success,
    Notify("Order processed: " & varFlowResult.ordernumber, NotificationType.Success),
    Notify("Processing failed: " & varFlowResult.errormessage, NotificationType.Error)
);
```

### Running Flow with Loading State
```powerfx
UpdateContext({ locIsProcessing: true, locError: "" });
Set(
    varResult,
    'Flow-ProcessOrder'.Run(txtOrderId.Text)
);
UpdateContext({ locIsProcessing: false });
If(
    IsEmpty(varResult),
    UpdateContext({ locError: "Flow returned no result" })
);
```

---

## Environment Variables in Canvas Apps

```powerfx
// Read environment variable value
Set(
    gblApiBaseUrl,
    LookUp(
        'Environment Variable Values',
        'Environment Variable Definition'.'Schema Name' = "contoso_ApiBaseUrl",
        Value
    )
);

// Fallback to default value
Set(
    gblApiBaseUrl,
    Coalesce(
        LookUp(
            'Environment Variable Values',
            'Environment Variable Definition'.'Schema Name' = "contoso_ApiBaseUrl",
            Value
        ),
        LookUp(
            'Environment Variable Definitions',
            'Schema Name' = "contoso_ApiBaseUrl",
            'Default Value'
        )
    )
);
```
