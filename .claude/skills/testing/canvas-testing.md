# Testing — Canvas, Flow & Model-Driven App Testing

## Canvas App Testing (Power Apps Test Studio)

> **Status Note:** Canvas App Test Studio has had limited updates. Verify current availability and feature support in your environment before building significant test suites. Consider Playwright-based E2E testing as a more robust alternative for critical Canvas Apps.

### What It Tests
- Screen navigation logic
- Formula evaluation (Power Fx)
- Control visibility and state
- Data operations (mocked or live)

### Writing Test Cases
```
Test Suite: "Order Submission"

Test Case 1: "Submit valid order"
  Setup:
    Navigate(SubmitOrderScreen)
    SetProperty(TextInput_Customer, "Contoso Ltd")
    SetProperty(TextInput_Amount, "500")
  Action:
    Select(Button_Submit)
  Assert:
    Assert(Label_Success.Text = "Order submitted successfully", "Success message shown")
    Assert(Label_Success.Visible = true, "Success label visible")

Test Case 2: "Reject empty customer"
  Setup:
    Navigate(SubmitOrderScreen)
    SetProperty(TextInput_Customer, "")
    SetProperty(TextInput_Amount, "500")
  Action:
    Select(Button_Submit)
  Assert:
    Assert(Label_Error.Visible = true, "Error shown for empty customer")
```

### Running Test Studio
```
Power Apps Studio → Tests (left panel) → Test Studio
→ Create test suite → Add test cases → Run
→ Results show pass/fail with screenshots
```

### Limitations
- Cannot test connectors that require real-time data (mock or use test data)
- Cannot test responsive behaviour (fixed screen size)
- Cannot test offline mode
- Test execution is slow (runs in browser, sequential)

---

## Power Automate Flow Testing

### Manual Testing Checklist
```markdown
- [ ] Test with valid trigger input → verify happy path
- [ ] Test with invalid/missing input → verify error handling scope catches it
- [ ] Test with empty result set (e.g., no matching Dataverse rows)
- [ ] Test Apply to Each with 0 items, 1 item, and 50+ items
- [ ] Test HTTP actions with simulated timeout (verify retry policy)
- [ ] Test approval flow: approve, reject, timeout
- [ ] Verify flow owner is service principal (not personal account)
- [ ] Verify all connections use connection references
- [ ] Run flow checker (no warnings or errors)
```

### Flow Checker
```
Power Automate → Edit flow → Flow Checker (top bar)
Checks for: missing connections, deprecated actions, expression errors,
performance anti-patterns, DLP violations
```

### Testing Expressions
Use the "Compose" action to test complex expressions before using them:
```
Compose: coalesce(triggerOutputs()?['body/contoso_email'], 'no-email@fallback.com')
→ Run the flow → Check Compose output → Verify value
```

### Monitor Tool (Real-Time Diagnostics)
```
Power Automate → Monitor → Open Monitor
→ Trigger the flow → See real-time execution trace
→ Each action shows: input, output, duration, errors
→ Drill into any failed action for full error details
```

---

## Model-Driven App Testing (EasyRepro)

### What EasyRepro Tests
- Form navigation and field interaction
- Business rule behaviour
- Command bar actions
- View filtering and sorting
- Dashboard rendering

### Basic EasyRepro Test
```csharp
[Fact]
public void Can_Create_Contact()
{
    var client = new WebClient(TestSettings.Options);
    using (var xrmApp = new XrmApp(client))
    {
        xrmApp.OnlineLogin.Login(_xrmUri, _username, _password);
        xrmApp.Navigation.OpenApp("Contoso Projects");
        xrmApp.Navigation.OpenSubArea("Operations", "Contacts");

        xrmApp.CommandBar.ClickCommand("New");
        xrmApp.Entity.SetValue("firstname", "Test");
        xrmApp.Entity.SetValue("lastname", "Contact");
        xrmApp.Entity.SetValue("emailaddress1", "test@contoso.com");
        xrmApp.Entity.Save();

        var notification = xrmApp.Entity.GetFormNotification();
        Assert.DoesNotContain("error", notification.Message, StringComparison.OrdinalIgnoreCase);
    }
}
```

**Note:** EasyRepro uses Selenium under the hood. It's the officially supported test framework for Model-Driven Apps but can be brittle due to UI changes. Consider Playwright as an alternative for more control.
