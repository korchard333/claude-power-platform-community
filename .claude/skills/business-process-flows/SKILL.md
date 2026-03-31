---
name: business-process-flows
description: "Business Process Flows (BPFs). Use when: creating BPFs, BPF stages, BPF branching, cross-entity BPFs, BPF XAML creation via API, BPF activation, BPF client-side JavaScript, process instance management."
---

# Skill: Business Process Flows

## When to Use
Trigger when designing, creating, or managing Business Process Flows (BPFs) in Model-Driven Apps.

---

## BPF Overview

Business Process Flows guide users through a defined set of stages to complete a business process. They appear as a horizontal stage bar at the top of Model-Driven App forms.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Qualify     │ → │  Develop     │ → │  Propose     │ → │  Close       │
│  ○ Budget    │    │  ○ Contacts  │    │  ○ Proposal  │    │  ○ Decision  │
│  ○ Timeline  │    │  ○ Needs     │    │  ○ Review    │    │  ○ Sign-off  │
│  ○ Authority │    │  ○ Solution  │    │  ○ Pricing   │    │  ○ Order     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### When to Use BPF vs Alternatives
| Scenario | Use |
|---|---|
| Linear guided process (sales, onboarding) | **BPF** |
| Approval routing with multiple approvers | **Power Automate** |
| Complex branching with parallel paths | **Power Automate** |
| Simple field validation on stage transition | **BPF + Business Rule** |
| Process spans multiple entities | **BPF (cross-entity)** |
| Status tracking without enforcement | **Status Reason field** |

---

## BPF Concepts

### Key Terms
| Term | Description |
|---|---|
| Stage | A phase in the process (e.g., Qualify, Develop) |
| Step | A data field within a stage that should be completed |
| Branch | Conditional path based on field values |
| Cross-entity | BPF that spans multiple tables (e.g., Lead → Opportunity → Order) |
| Active Path | The current set of stages the record is following |
| Process Instance | The specific BPF record tracking this entity's progress |

### BPF Entity
Every BPF creates a hidden system table (e.g., `new_bpf_abc123`) that stores process instance data. This table has:
- `activestageid` — current stage
- `traversedpath` — stages visited
- `businessprocessflowinstanceid` — unique process instance
- `bpf_[entityname]id` — link to the primary record

---

## BPF Management via Web API

### List Business Process Flows
```http
GET /api/data/v9.2/workflows
  ?$select=name,uniquename,primaryentity,category,statecode,statuscode
  &$filter=category eq 4 and statecode eq 1
```
Category `4` = Business Process Flow. Statecode `1` = Activated.

### Get BPF Stages
```http
GET /api/data/v9.2/processstages
  ?$select=stagename,stagecategory,primaryentitytypecode,processstageid
  &$filter=processid/workflowid eq 'bpf-workflow-guid'
  &$orderby=stagecategory asc
```

### Get Active Process Instance for a Record
```http
GET /api/data/v9.2/RetrieveActivePath(Target=@target)
  ?@target={'@odata.id':'contoso_projects(record-guid)'}
```

### Move to Next Stage
```http
# Get current active stage
GET /api/data/v9.2/new_bpf_projectonboarding
  ?$filter=bpf_contoso_projectid/contoso_projectid eq 'record-guid' and statecode eq 0
  &$select=businessprocessflowinstanceid,activestageid,traversedpath

# Update to next stage
PATCH /api/data/v9.2/new_bpf_projectonboarding(instance-guid)
Content-Type: application/json

{
  "activestageid@odata.bind": "/processstages(next-stage-guid)"
}
```

### Set BPF on a Record
```http
# Create process instance
POST /api/data/v9.2/new_bpf_projectonboarding
Content-Type: application/json

{
  "bpf_contoso_projectid@odata.bind": "/contoso_projects(record-guid)",
  "activestageid@odata.bind": "/processstages(first-stage-guid)"
}
```

### Activate / Deactivate BPF Definition
```http
# Activate BPF
PATCH /api/data/v9.2/workflows(bpf-workflow-guid)
Content-Type: application/json

{ "statecode": 1, "statuscode": 2 }

# Deactivate BPF
PATCH /api/data/v9.2/workflows(bpf-workflow-guid)
Content-Type: application/json

{ "statecode": 0, "statuscode": 1 }
```

> ⚠️ SetState does NOT work for BPFs (category 4). POST /workflows({id})/Microsoft.Dynamics.CRM.SetState returns 404. Use PATCH instead.

---

## BPF Creation via Web API

### ⚠️ CRITICAL: BPFs Require XAML — clientdata-Only Creation Always Fails

Unlike business rules and cloud flows, BPFs MUST be created with a `xaml` property. Attempting `POST /workflows` with `category: 4` and `clientdata` but no `xaml` returns `0x80040203: workflowstep`. The system auto-generates `clientdata` from the XAML.

### Required Properties

```http
POST /api/data/v9.2/workflows
Content-Type: application/json
MSCRM.SolutionUniqueName: YourSolution

{
  "name": "Asset Onboarding",
  "category": 4,
  "type": 1,
  "primaryentity": "contoso_asset",
  "scope": 4,
  "statecode": 0,
  "statuscode": 1,
  "xaml": "<Activity x:Class=\"XrmWorkflow...\" ...>[XAML]</Activity>"
}
```

| Property | Value | Notes |
|---|---|---|
| `category` | `4` | Business Process Flow |
| `type` | `1` | Definition |
| `scope` | `4` | Organization (NOT 1 — scope=1 is rejected for BPFs) |
| `primaryentity` | logical name | The table the BPF applies to |
| `xaml` | string | REQUIRED — clientdata is auto-generated |

### ⚠️ CRITICAL: BPF XAML Uses ActivityReference Format, Not Simplified Elements

The XAML structure below shows the conceptual hierarchy. **The actual API format requires `mxswa:ActivityReference` elements with `AssemblyQualifiedName`** — not simplified `<mcwb:StageComposite>` elements.

**Reliable discovery method:** Query an existing BPF's XAML from the environment and use it as a structural template:
```http
GET /api/data/v9.2/workflows?$filter=category eq 4 and statecode eq 1&$select=name,xaml&$top=5
```
Adapt the discovered XAML (change entity names, stage names, field references). This is more reliable than building XAML from scratch.

**Key format differences from simplified documentation:**
- Uses `mxswa:ActivityReference` with `AssemblyQualifiedName` for every composite element
- Requires `x:Members` block (`InputEntities`/`CreatedEntities`) in the Activity header
- Uses `mxswa:Workflow` wrapper
- All properties via `sco:Collection` with `x:Key` entries
- StepLabels with GUIDs required on every step and stage
- Sequential DisplayName numbering is global across all XAML
- StageCategory is always `"-1"` (not 0, 1, 2, 3)
- Last stage requires `<x:Null x:Key="NextStageId" />`

### XAML Structure

```
StageRelationshipCollectionComposite
  → EntityComposite (one per stage, even if same entity)
    → StageComposite
      → StepComposite
        → Sequence with mcwb:Control
```

### BPF Step Control ClassIds

| Type | ClassId |
|------|---------|
| Text | `4273edbd-ac1d-40d3-9fb2-095c621b552d` |
| Date | `5b773807-9fb2-42db-97c3-7a91eff8adff` |
| Choice | `3ef39988-22bb-4f0b-bbbe-64b5a3748aee` |
| Lookup | `270bd3db-d9af-4782-9025-509e298dec0a` |
| Number | `c6d124ca-7eda-4a60-aea9-7fb8d318b68f` |
| Money | `533b9e00-756b-4312-95a0-dc888637ac78` |

### ⚠️ BPF Backing Tables Must Be Added to Solution

Creating a BPF auto-creates a backing table (e.g., `contoso_assetonboarding`) but the `MSCRM.SolutionUniqueName` header only adds the workflow — NOT the backing table. Without solution membership + security role privileges, users can see the BPF on forms but cannot advance stages.

The backing table logical name equals the workflow's `uniquename` property. After creating the BPF:

1. Add backing table to solution: `AddSolutionComponent` with `ComponentType: 1`
2. Grant security role privileges: Create, Read, Write, Append, AppendTo at Global depth

---

## BPF Client-Side JavaScript

### Get Active Process
```typescript
// Get the current BPF on the form
const activeProcess = formContext.data.process.getActiveProcess();
if (activeProcess) {
  const processName = activeProcess.getName();
  const processId = activeProcess.getId();
}
```

### Get/Set Active Stage
```typescript
// Get current stage
const stage = formContext.data.process.getActiveStage();
const stageName = stage.getName();
const stageId = stage.getId();

// Get stage steps
const steps = stage.getSteps();
steps.forEach((step) => {
  console.log(step.getName(), step.getAttribute(), step.isRequired());
});

// Move to next stage
formContext.data.process.moveNext((result) => {
  if (result === "success") {
    console.log("Moved to next stage");
  } else if (result === "crossEntity") {
    console.log("Process moved to different entity");
  } else if (result === "end") {
    console.log("Process completed");
  } else {
    console.log("Cannot move: incomplete required steps");
  }
});

// Move to previous stage
formContext.data.process.movePrevious((result) => {
  console.log("Move back result:", result);
});
```

### BPF Events
```typescript
// Stage change event
formContext.data.process.addOnStageChange((executionContext) => {
  const eventArgs = executionContext.getEventArgs();
  const direction = eventArgs.getDirection(); // "Next" or "Previous"
  const stage = eventArgs.getStage();

  // Prevent stage change based on conditions
  if (direction === "Next" && !isStageComplete(formContext)) {
    eventArgs.preventDefault();
    formContext.ui.setFormNotification(
      "Please complete all required fields before proceeding.",
      "WARNING",
      "stage_incomplete"
    );
  }
});

// Stage selected event (user clicks on a stage header)
formContext.data.process.addOnStageSelected((executionContext) => {
  const stage = executionContext.getEventArgs().getStage();
  console.log("User selected stage:", stage.getName());
});

// Process status change
formContext.data.process.addOnProcessStatusChange((executionContext) => {
  const status = formContext.data.process.getStatus();
  // "active", "aborted", "finished"
  if (status === "finished") {
    formContext.ui.setFormNotification(
      "Process completed successfully!",
      "INFO",
      "process_complete"
    );
  }
});
```

### Set BPF Visibility
```typescript
// Show/hide the BPF bar
formContext.ui.process.setVisible(false); // Hide the BPF
formContext.ui.process.setDisplayState("collapsed"); // Collapse
formContext.ui.process.setDisplayState("expanded"); // Expand
```

---

## BPF with Branching

### Branch Conditions
Branches are defined in the BPF designer based on field values:
```
Stage: Qualification
  ├── If account_type = "Enterprise" → Stage: Enterprise Review
  └── If account_type = "SMB" → Stage: SMB Fast Track
```

The active path recalculates when the branching field value changes.

---

## Anti-Patterns

- Using BPF for non-linear processes (use Power Automate instead)
- Too many stages (>7 becomes unusable, aim for 3-5)
- Mandatory steps on every stage (frustrates users — use recommended instead)
- Not handling cross-entity BPF transitions in automation
- Ignoring the BPF entity table when querying process data
- Creating BPFs via API without XAML (clientdata-only always fails)
- Using SetState for activation (returns 404 — use PATCH)
- Forgetting to add BPF backing tables to the solution
- Using scope=1 instead of scope=4 for BPFs

---

## Related Skills

- `model-driven-apps` — BPFs are consumed in Model-Driven Apps
- `dataverse` — Underlying table and relationship design for BPF entities
- `dashboards` — Dashboards are a separate skill for visualization
- `dataverse-web-api/business-rules-api` — Business rules share the workflow entity but differ in category and creation patterns
