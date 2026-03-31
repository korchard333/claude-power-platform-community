# Ribbon / Command Bar Customization

Customize the command bar (ribbon) in Model-Driven Apps to add buttons, control visibility, and trigger JavaScript actions.

---

## Command Definition (RibbonDiffXml)

```xml
<RibbonDiffXml>
  <CustomActions>
    <CustomAction Id="contoso.contact.ApproveButton"
                  Location="Mscrm.Form.contact.MainTab.Actions.Controls._children"
                  Sequence="50">
      <CommandUIDefinition>
        <Button Id="contoso.contact.ApproveButton.Button"
                Command="contoso.contact.ApproveCommand"
                LabelText="Approve"
                ToolTipTitle="Approve Contact"
                ToolTipDescription="Approve this contact record"
                Image16by16="$webresource:contoso_/images/approve16.png"
                Image32by32="$webresource:contoso_/images/approve32.png"
                TemplateAlias="o1" />
      </CommandUIDefinition>
    </CustomAction>
  </CustomActions>

  <CommandDefinitions>
    <CommandDefinition Id="contoso.contact.ApproveCommand">
      <EnableRules>
        <EnableRule Id="contoso.contact.EnableWhenActive" />
      </EnableRules>
      <DisplayRules>
        <DisplayRule Id="contoso.contact.ShowForActiveRecords" />
      </DisplayRules>
      <Actions>
        <JavaScriptFunction FunctionName="Contoso.Contact.approveRecord"
                           Library="$webresource:contoso_/scripts/contactRibbon.js">
          <CrmParameter Value="PrimaryControl" />
        </JavaScriptFunction>
      </Actions>
    </CommandDefinition>
  </CommandDefinitions>

  <RuleDefinitions>
    <EnableRules>
      <EnableRule Id="contoso.contact.EnableWhenActive">
        <ValueRule Field="statecode" Value="0" />
      </EnableRule>
    </EnableRules>
    <DisplayRules>
      <DisplayRule Id="contoso.contact.ShowForActiveRecords">
        <ValueRule Field="statecode" Value="0" Default="false" />
      </DisplayRule>
    </DisplayRules>
  </RuleDefinitions>
</RibbonDiffXml>
```

---

## Ribbon Command Handler

```typescript
// src/scripts/contact/contactRibbon.ts
namespace Contoso.Contact {
  // Ribbon command receives PrimaryControl (formContext) via CrmParameter
  // NEVER use Xrm.Page (deprecated) -- always use the passed-in formContext
  export async function approveRecord(
    primaryControl: Xrm.FormContext
  ): Promise<void> {
    const recordId = primaryControl.data.entity.getId().replace(/[{}]/g, "");
    const entityName = primaryControl.data.entity.getEntityName();

    // Confirm action
    const confirm = await Xrm.Navigation.openConfirmDialog({
      text: "Are you sure you want to approve this contact?",
      title: "Confirm Approval"
    });

    if (!confirm.confirmed) return;

    try {
      // Update the record
      await Xrm.WebApi.updateRecord(entityName, recordId, {
        contoso_approvalstatus: 100000001, // Approved
        contoso_approvedby: Xrm.Utility.getGlobalContext().userSettings.userName,
        contoso_approvedon: new Date().toISOString()
      });

      // Show success
      await Xrm.Navigation.openAlertDialog({
        text: "Contact has been approved.",
        title: "Success"
      });

      // Refresh the form using formContext (NOT Xrm.Page)
      primaryControl.data.refresh(false);
    } catch (err: any) {
      await Xrm.Navigation.openAlertDialog({
        text: `Approval failed: ${err.message}`,
        title: "Error"
      });
    }
  }
}
```

---

## Common Ribbon Locations

| Location | Where It Appears |
|---|---|
| `Mscrm.Form.{entity}.MainTab.Actions.Controls._children` | Form command bar -- Actions group |
| `Mscrm.Form.{entity}.MainTab.Save.Controls._children` | Form command bar -- Save group |
| `Mscrm.HomepageGrid.{entity}.MainTab.Actions.Controls._children` | Grid (view) command bar |
| `Mscrm.SubGrid.{entity}.MainTab.Actions.Controls._children` | Subgrid command bar |

---

## Enable Rules

Control when a button is clickable (grayed out when rule is false):

| Rule Type | Use | Example |
|---|---|---|
| `ValueRule` | Field has specific value | `<ValueRule Field="statecode" Value="0" />` (active only) |
| `FormStateRule` | Form is in create/update/read mode | `<FormStateRule State="Existing" />` |
| `CustomRule` | JavaScript function returns true/false | See below |

### Custom Enable Rule

```xml
<EnableRule Id="contoso.contact.CustomEnableRule">
  <CustomRule FunctionName="Contoso.Contact.isApprovalAllowed"
              Library="$webresource:contoso_/scripts/contactRibbon.js"
              Default="false">
    <CrmParameter Value="PrimaryControl" />
  </CustomRule>
</EnableRule>
```

```typescript
// Must return boolean synchronously (no async)
export function isApprovalAllowed(primaryControl: Xrm.FormContext): boolean {
  const status = primaryControl.getAttribute("contoso_approvalstatus")?.getValue();
  return status === 100000000; // Only enable when status is "Pending"
}
```

---

## Display Rules

Control when a button is visible (hidden when rule is false):

| Rule Type | Use | Example |
|---|---|---|
| `ValueRule` | Field has specific value | Same as enable rules |
| `EntityPrivilegeRule` | User has specific privilege | `<EntityPrivilegeRule EntityName="contact" PrivilegeType="Write" />` |
| `FormEntityContextRule` | Button only shows on specific entity | `<FormEntityContextRule EntityName="contact" />` |

---

## Modern Commanding (Power Fx)

For simpler command bar customizations, use Modern Commanding (no XML required):

```
Model-Driven App > Edit > Command Bar > Select entity > Edit command bar

1. Add a new button
2. Set label, icon, tooltip
3. Set visibility rule (Power Fx):
   Self.Selected.Item.statecode = 0

4. Set action (Power Fx):
   Patch(Contacts, Self.Selected.Item, {contoso_approvalstatus: 'Approved'});
   Notify("Contact approved", NotificationType.Success);
```

### When to Use Modern Commanding vs RibbonDiffXml

| Scenario | Approach |
|---|---|
| Simple show/hide based on field value | Modern Commanding (Power Fx) |
| Simple CRUD action on button click | Modern Commanding (Power Fx) |
| Complex enable rules with multiple conditions | RibbonDiffXml + JavaScript |
| Need to call external APIs from button | RibbonDiffXml + JavaScript |
| Need async operations | RibbonDiffXml + JavaScript |
| Grid-level commands with multi-select | RibbonDiffXml + JavaScript |

---

## Anti-Patterns

- Modifying ribbon XML manually without testing -- easy to break form rendering
- Using `Xrm.Page` in ribbon handlers -- use the `PrimaryControl` CrmParameter
- Async functions in enable/display rules -- they must return synchronously
- Hardcoding GUIDs in ribbon XML or handlers
- Not providing 16x16 and 32x32 icons -- buttons look broken without proper icons
- Overly complex enable rules -- if your rule needs >3 conditions, consider a Custom Rule function
