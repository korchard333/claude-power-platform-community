# Teams Integration

## Overview

Microsoft Teams is the primary deployment channel for Power Platform experiences. Apps can be embedded as tabs, Copilot Studio agents deployed as bots, Adaptive Cards sent from flows, and notifications pushed to channels.

---

## Deployment Options

| Pattern | Description | Use Case |
|---|---|---|
| **Teams tab (Canvas App)** | Canvas App embedded in a Teams tab | Team-scoped data entry, dashboards |
| **Teams tab (Code App)** | Code App embedded in a Teams tab | Complex UI, custom React experiences |
| **Personal app** | App pinned in user's left rail | Individual productivity, personal dashboards |
| **Copilot Studio bot** | Conversational agent in Teams chat | Q&A, self-service, guided workflows |
| **Adaptive Cards** | Rich interactive cards in Teams messages | Approvals, notifications, quick actions |
| **Message extension** | Search/action extensions in compose box | Lookup records, quick insert |

---

## Embedding Apps in Teams

### Canvas App as Teams Tab

```
Power Apps → [app] → Share → Add to Teams
  → Select channel or personal app
  → App appears as a tab in the selected channel
```

**Or via Teams Admin Center:**
```
Teams Admin Center → Manage apps → Upload custom app
  → Upload the app package (zip with manifest.json)
```

### Code App as Teams Tab

Code Apps can be embedded using the Teams tab framework:

```
1. Build the Code App: npm run build
2. Deploy to Power Platform: pac code push
3. Get the app URL from Power Platform
4. Create Teams app manifest with tab pointing to the app URL
5. Upload to Teams or publish via Teams Admin Center
```

### Teams App Manifest (Tab)

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.17/MicrosoftTeams.schema.json",
  "manifestVersion": "1.17",
  "version": "1.0.0",
  "id": "unique-app-guid",
  "name": { "short": "HR Dashboard" },
  "description": { "short": "HR metrics dashboard", "full": "..." },
  "developer": { "name": "Contoso", "websiteUrl": "https://contoso.com" },
  "staticTabs": [
    {
      "entityId": "hr-dashboard",
      "name": "HR Dashboard",
      "contentUrl": "https://apps.powerapps.com/play/e/{app-id}?tenantId={tenant-id}",
      "scopes": ["personal"]
    }
  ],
  "configurableTabs": [
    {
      "configurationUrl": "https://apps.powerapps.com/play/e/{app-id}?tenantId={tenant-id}",
      "scopes": ["team", "groupChat"],
      "canUpdateConfiguration": false
    }
  ],
  "permissions": ["identity", "messageTeamMembers"],
  "validDomains": ["apps.powerapps.com", "*.dynamics.com"]
}
```

### Personal App vs Channel Tab

| Feature | Personal App | Channel Tab |
|---|---|---|
| Scope | Individual user | Entire team/channel |
| Data context | User-specific | Team-scoped |
| Navigation | Left rail of Teams | Tab in channel |
| Authentication | Automatic (SSO) | Automatic (SSO) |
| Best for | Personal dashboards, task lists | Team dashboards, shared data |

---

## Copilot Studio Bot in Teams

### Deploy Agent to Teams

```
Copilot Studio → Agent → Channels → Microsoft Teams
  → Connect → Configure:
    - Bot display name
    - Bot icon
    - Scope: Personal, Team, Group Chat
  → Publish
```

### Teams-Specific Agent Features

| Feature | Description |
|---|---|
| **SSO** | Automatic single sign-on with Teams identity |
| **Adaptive Cards** | Rich card responses in chat |
| **Proactive messages** | Agent initiates conversation (e.g., reminders) |
| **At-mention** | Respond when @mentioned in channels |
| **File upload** | User can upload files to agent |
| **Deep links** | Link to specific app pages or records |

---

## Adaptive Cards from Power Automate

### Post Adaptive Card to Teams

```
Action: Post Adaptive Card and wait for a response

Channel: Teams channel or chat
Card JSON:
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "Expense Approval Required",
      "weight": "Bolder",
      "size": "Medium"
    },
    {
      "type": "FactSet",
      "facts": [
        { "title": "Submitted by:", "value": "@{triggerBody()?['submittedBy']}" },
        { "title": "Amount:", "value": "$@{triggerBody()?['amount']}" },
        { "title": "Category:", "value": "@{triggerBody()?['category']}" }
      ]
    },
    {
      "type": "TextBlock",
      "text": "@{triggerBody()?['description']}",
      "wrap": true
    }
  ],
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Approve",
      "data": { "action": "approve" }
    },
    {
      "type": "Action.Submit",
      "title": "Reject",
      "data": { "action": "reject" }
    }
  ]
}
```

### Handle Adaptive Card Response

```
// After "Post Adaptive Card and wait for a response"
// The flow pauses until user clicks Approve/Reject

Condition: body('Post_Adaptive_Card')?['data']?['action'] == 'approve'
  True: Update record status to Approved
  False: Update record status to Rejected, send rejection email
```

---

## Deep Linking

Create links that open specific content in Teams:

### Link to a Teams Tab

```
https://teams.microsoft.com/l/entity/{app-id}/{entity-id}
  ?webUrl={encoded-url}
  &label={tab-name}
```

### Link to a Power App

```
https://teams.microsoft.com/l/entity/com.microsoft.teamspace.tab.powerapps/{app-id}
```

### Link to a Specific Record (via Canvas App)

```
// In a flow notification, include a deep link
https://apps.powerapps.com/play/e/{app-id}?recordId={record-guid}

// In the Canvas App, read the parameter
Set(varRecordId, Param("recordId"));
Navigate(DetailScreen, ScreenTransition.None);
```

---

## Teams Notifications from Flows

### Post to Channel

```
Action: Microsoft Teams → Post message in a chat or channel
  Team: [select team]
  Channel: [select channel]
  Message: "New high-priority case created: @{triggerBody()?['title']}"
```

### Post to Individual (Chat)

```
Action: Microsoft Teams → Post message in a chat or channel
  Post as: Flow bot
  Post in: Chat with Flow bot
  Recipient: @{triggerBody()?['assignedTo']?['email']}
  Message: "You've been assigned case: @{triggerBody()?['title']}"
```

---

## Anti-Patterns

- Canvas App in Teams without testing responsive layout (Teams container is narrower)
- Copilot Studio bot without SSO configuration (users prompted to sign in separately)
- Adaptive Cards with too many actions (Teams limits actions per card)
- Posting to Teams channels at high frequency (channel noise, users mute)
- Deep links with hardcoded GUIDs (break across environments)
- No fallback for Adaptive Card rendering (older Teams clients may not support v1.4)
- Personal app that requires team context (wrong scope)
- Bot without welcome message (users don't know what it can do)
