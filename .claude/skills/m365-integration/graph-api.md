# Microsoft Graph API

## Overview

Microsoft Graph is the unified API for Microsoft 365 data — users, groups, mail, calendar, files, Teams, and more. Power Platform accesses Graph via the built-in connectors (Office 365 Users, Office 365 Groups) or custom connectors for advanced scenarios.

---

## Access Methods

| Method | Complexity | Best For |
|---|---|---|
| **Built-in connectors** (Office 365 Users, Outlook, Teams) | Low | Standard operations covered by connectors |
| **HTTP connector with Entra ID** | Medium | Graph endpoints not covered by connectors |
| **Custom connector** | Medium | Reusable Graph API integration, typed operations |
| **Azure Function intermediary** | High | Complex Graph operations, batch requests, app permissions |

---

## Delegated vs Application Permissions

| Permission Type | Auth Flow | Identity | Use Case |
|---|---|---|---|
| **Delegated** | User signs in | Runs as the signed-in user | User-facing apps, Canvas Apps, flows triggered by users |
| **Application** | Client credentials | Runs as the app itself | Background flows, scheduled automation, no user context |

### When to Use Each

| Scenario | Permission Type | Why |
|---|---|---|
| Canvas App reading user's calendar | Delegated | App acts on behalf of user |
| Flow triggered by button reading user's email | Delegated | User context available |
| Scheduled flow reading all users | Application | No user context, needs tenant-wide access |
| Background sync of group membership | Application | Runs unattended |
| Copilot Studio agent looking up user profile | Delegated | Agent acts on behalf of chatting user |

---

## Built-In Connectors

### Office 365 Users

```
Actions:
  Get my profile: Current user's profile
  Get user profile (V2): Specific user by UPN or ID
  Search for users (V2): Search by name, email
  Get manager (V2): User's reporting manager
  Get direct reports (V2): User's direct reports
  Update my profile: Update current user's profile
```

### Office 365 Outlook

```
Actions:
  Send an email (V2): Send email
  Get emails (V2): Read inbox
  Create event (V2): Calendar event
  Get calendars: List calendars
  Get contacts (V2): Read contacts
```

### Microsoft Teams

```
Actions:
  Post message: Post to channel or chat
  Get channels: List channels in a team
  Create channel: Create new channel
  List teams: Get all teams user is member of
  Get team: Team details
```

---

## HTTP Connector to Graph API

For Graph endpoints not covered by built-in connectors:

### Setup

```
Action: HTTP with Microsoft Entra ID
  Base Resource URL: https://graph.microsoft.com
  Azure AD Resource URI: https://graph.microsoft.com

  Method: GET
  URL: https://graph.microsoft.com/v1.0/users?$filter=department eq 'Engineering'&$select=displayName,mail,jobTitle&$top=100
```

### Common Graph Queries

#### List Users in a Department

```
GET https://graph.microsoft.com/v1.0/users
  ?$filter=department eq 'Engineering'
  &$select=displayName,mail,jobTitle,department
  &$top=100
  &$orderby=displayName
```

#### Get User's Manager Chain

```
GET https://graph.microsoft.com/v1.0/users/{user-id}/manager
GET https://graph.microsoft.com/v1.0/users/{user-id}/manager/manager  // Manager's manager
```

#### List Group Members

```
GET https://graph.microsoft.com/v1.0/groups/{group-id}/members
  ?$select=displayName,mail,userPrincipalName
  &$top=100
```

#### Search Files in OneDrive/SharePoint

```
GET https://graph.microsoft.com/v1.0/search/query
POST body:
{
  "requests": [{
    "entityTypes": ["driveItem"],
    "query": { "queryString": "annual report 2026" },
    "from": 0,
    "size": 25
  }]
}
```

#### Get User's Calendar Events

```
GET https://graph.microsoft.com/v1.0/me/calendarView
  ?startDateTime=2026-03-23T00:00:00Z
  &endDateTime=2026-03-30T00:00:00Z
  &$select=subject,start,end,location
  &$orderby=start/dateTime
```

---

## Pagination Handling

Graph API returns paged results. Always check for `@odata.nextLink`.

### In Power Automate

```
Initialize variable: allResults (Array)
Initialize variable: nextLink (String) = initial URL

Do Until: empty(nextLink)
  HTTP GET: nextLink
  Append to array: allResults += body('HTTP')?['value']
  Set variable: nextLink = body('HTTP')?['@odata.nextLink']
  (If no nextLink property, exit loop)
```

### Common Pagination Pitfalls

| Pitfall | Impact | Fix |
|---|---|---|
| Ignoring `@odata.nextLink` | Only get first page (~100 items) | Always check and follow nextLink |
| No $top parameter | Default page size varies | Set explicit $top (max 999) |
| Pagination in Apply to Each | Nested loops, slow | Paginate first, then process |

---

## Batch Requests

Combine multiple Graph calls into a single HTTP request (max 20 per batch):

```
POST https://graph.microsoft.com/v1.0/$batch
Content-Type: application/json

{
  "requests": [
    {
      "id": "1",
      "method": "GET",
      "url": "/users/user1@contoso.com?$select=displayName,mail"
    },
    {
      "id": "2",
      "method": "GET",
      "url": "/users/user2@contoso.com?$select=displayName,mail"
    },
    {
      "id": "3",
      "method": "GET",
      "url": "/groups/group-id/members?$top=5"
    }
  ]
}
```

### When to Use Batch

- Looking up multiple users/groups in a single flow run
- Checking multiple mailboxes for new mail
- Updating multiple records in one operation
- Reducing API call count (Graph has per-tenant throttling limits)

---

## Custom Connector for Graph

For reusable, typed Graph operations in flows and apps:

### Create Custom Connector

```
Power Automate → Custom connectors → + New → Create from blank

General:
  Host: graph.microsoft.com
  Base URL: /v1.0

Security:
  Authentication type: OAuth 2.0
  Identity Provider: Microsoft Entra ID
  Client ID: [App Registration Client ID]
  Client Secret: [App Registration Secret]
  Authorization URL: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
  Token URL: https://login.microsoftonline.com/common/oauth2/v2.0/token
  Scope: https://graph.microsoft.com/.default

Actions:
  GetUsers:
    Method: GET
    URL: /users
    Query: $filter, $select, $top
  GetUserManager:
    Method: GET
    URL: /users/{userId}/manager
```

---

## Anti-Patterns

- Using delegated permissions in scheduled flows (no user context — use application permissions)
- Not handling pagination (missing data beyond first page)
- Calling Graph API once per record in Apply to Each (use batch requests)
- Personal account as the connection for Graph operations in production
- Not specifying $select (retrieving all properties when you only need 2-3)
- Ignoring Graph throttling limits (429 errors without retry logic)
- Building a custom connector when a built-in connector covers the use case
- Application permissions broader than needed (e.g., User.Read.All when User.Read is sufficient)
- No error handling on Graph calls (network failures, permission errors)
