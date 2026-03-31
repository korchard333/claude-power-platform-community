# Power Automate — Approvals & Teams Adaptive Cards

## Approval Flows with Teams Adaptive Cards

### Pattern: Approval with Teams notification
```
Trigger (e.g., Dataverse row created)
  │
  ├── Create approval
  │     Action: "Create an approval"
  │     Type: Approve/Reject - First to respond (or Everyone must approve)
  │     Title: "Order #@{triggerOutputs()?['body/contoso_ordernumber']} needs approval"
  │     Assigned to: manager@contoso.com
  │     Details: @{triggerOutputs()?['body/contoso_description']}
  │     Item link: https://make.powerapps.com/...
  │
  ├── Post adaptive card to Teams
  │     Action: "Post adaptive card in a chat or channel" (Teams connector)
  │     Recipient: @{triggerOutputs()?['body/contoso_requesteremail']}
  │     Card: @{body('Create_an_approval')?['adaptiveCard']}
  │     Update card on approval: Yes
  │
  ├── Wait for approval
  │     Action: "Wait for an approval"
  │     Approval ID: @{body('Create_an_approval')?['approvalId']}
  │
  └── Condition: @{body('Wait_for_an_approval')?['outcome']} is 'Approve'
        Yes: Update record to Approved
        No:  Update record to Rejected, notify requester
```

### Critical: Disable Email Notifications
When using Teams adaptive cards for approvals, disable the default email notification on the "Create an approval" action to prevent the approver from responding via email (which causes card sync issues):
```
Create an approval → Settings → Disable: "Send approval request emails"
```

### Approval Types
| Type | Behaviour |
|---|---|
| Approve/Reject - First to respond | Any approver can action it; flow continues after first response |
| Approve/Reject - Everyone must approve | All approvers must approve; one rejection stops the process |
| Custom Responses | Define your own response options (e.g., "Approve", "Reject", "Escalate") |
