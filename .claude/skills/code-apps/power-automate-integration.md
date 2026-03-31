# Code Apps — Power Automate Integration

## Triggering Power Automate from Code Apps

Code Apps cannot call Power Automate flows directly. Use one of these patterns:

### Pattern 1: Custom API (Recommended)
```tsx
// Call a Custom API that internally triggers the flow logic
// Custom API is registered as a Dataverse action callable via generated service
const result = await customApiService.executeApprovalWorkflow({
  orderId: selectedOrderId,
  approverEmail: "manager@contoso.com",
});
```

### Pattern 2: Dataverse record trigger
```tsx
// Create/update a Dataverse record that triggers a flow
// Flow trigger: "When a row is added or modified" with filtering on status
await orderService.update(orderId, {
  contoso_workflowstatus: 100000001, // "Pending Approval" — triggers flow
});
```
