# Outlook Integration

## Overview

Power Automate integrates with Outlook for email automation, calendar management, and meeting coordination. The Office 365 Outlook connector is a standard connector (no Premium required) that supports both personal and shared mailboxes.

---

## Outlook Connector Actions

### Email Actions

| Action | Description | Common Use |
|---|---|---|
| **Send an email (V2)** | Send from current user's mailbox | Notifications, alerts |
| **Send an email from a shared mailbox (V2)** | Send from shared mailbox | Support team, department inbox |
| **Get emails (V2)** | Read emails from inbox/folder | Email processing, triage |
| **Reply to an email (V2)** | Reply to existing thread | Automated responses |
| **Move email** | Move to specific folder | Triage, archival |
| **Flag email** | Add follow-up flag | Priority marking |
| **Mark as read** | Mark email as read | After processing |

### Calendar Actions

| Action | Description | Common Use |
|---|---|---|
| **Create event (V2)** | Create calendar event | Meeting scheduling |
| **Get events (V2)** | Read calendar events | Availability check |
| **Update event** | Modify existing event | Reschedule, add attendees |
| **Delete event** | Cancel event | Cancellation workflow |
| **Get calendars** | List available calendars | Calendar selection |
| **Get calendar view** | Events in date range | Schedule overview |

---

## Email Templates with Dynamic Content

### HTML Email from Flow

```
Action: Send an email (V2)
  To: @{triggerBody()?['requester_email']}
  Subject: "Your leave request has been @{triggerBody()?['status']}"
  Body (HTML):

<html>
<body style="font-family: Segoe UI, sans-serif; color: #333;">
  <h2>Leave Request Update</h2>
  <p>Hi @{triggerBody()?['requester_name']},</p>
  <p>Your leave request has been <strong>@{triggerBody()?['status']}</strong>.</p>

  <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
    <tr style="background: #f5f5f5;">
      <td style="padding: 8px; border: 1px solid #ddd;"><strong>Start Date</strong></td>
      <td style="padding: 8px; border: 1px solid #ddd;">@{formatDateTime(triggerBody()?['start_date'], 'dd MMM yyyy')}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;"><strong>End Date</strong></td>
      <td style="padding: 8px; border: 1px solid #ddd;">@{formatDateTime(triggerBody()?['end_date'], 'dd MMM yyyy')}</td>
    </tr>
    <tr style="background: #f5f5f5;">
      <td style="padding: 8px; border: 1px solid #ddd;"><strong>Days</strong></td>
      <td style="padding: 8px; border: 1px solid #ddd;">@{triggerBody()?['days']}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;"><strong>Approved by</strong></td>
      <td style="padding: 8px; border: 1px solid #ddd;">@{triggerBody()?['approver_name']}</td>
    </tr>
  </table>

  <p style="margin-top: 20px;">
    <a href="@{triggerBody()?['app_url']}" style="background: #0078d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View in App</a>
  </p>
</body>
</html>
```

### Dynamic Table from Array

```
// Create an HTML table from an array of items
Action: Create HTML table
  From: @{body('Get_items')?['value']}
  Columns:
    Name: @{item()?['Title']}
    Status: @{item()?['Status']}
    Due Date: @{formatDateTime(item()?['DueDate'], 'dd MMM yyyy')}

Action: Send an email (V2)
  Body: @{body('Create_HTML_table')}
```

---

## Shared Mailbox Patterns

### When to Use Shared Mailboxes

| Scenario | Personal Mailbox | Shared Mailbox |
|---|---|---|
| Individual user notification | Yes | No |
| Team/department inbox | No | Yes |
| Automated support responses | No | Yes |
| Application-generated emails | No | Yes |
| Compliance (consistent sender) | No | Yes |

### Configure Shared Mailbox in Flow

```
Action: Send an email from a shared mailbox (V2)
  Original Mailbox Address: support@contoso.com
  To: @{triggerBody()?['customer_email']}
  Subject: "Re: @{triggerBody()?['subject']}"
  Body: "Thank you for contacting us..."
```

### Monitor Shared Mailbox

```
Trigger: When a new email arrives in a shared mailbox (V2)
  Original Mailbox Address: support@contoso.com
  Folder: Inbox
  Include attachments: Yes

  → Parse email content
  → AI classify the email (AI Builder or AOAI)
  → Create Dataverse record (support case)
  → Send acknowledgment reply
```

---

## Calendar Integration

### Find Free/Busy Times

```
Action: HTTP with Microsoft Entra ID
  Method: POST
  URL: https://graph.microsoft.com/v1.0/me/findMeetingTimes
  Body:
  {
    "attendees": [
      { "emailAddress": { "address": "user1@contoso.com" } },
      { "emailAddress": { "address": "user2@contoso.com" } }
    ],
    "timeConstraint": {
      "timeslots": [{
        "start": { "dateTime": "2026-03-24T09:00:00", "timeZone": "AUS Eastern Standard Time" },
        "end": { "dateTime": "2026-03-28T17:00:00", "timeZone": "AUS Eastern Standard Time" }
      }]
    },
    "meetingDuration": "PT1H",
    "maxCandidates": 5
  }
```

### Create Meeting with Teams Link

```
Action: Create event (V2)
  Calendar: Calendar
  Subject: "Project Review - @{triggerBody()?['project_name']}"
  Start time: @{triggerBody()?['meeting_start']}
  End time: @{triggerBody()?['meeting_end']}
  Time zone: AUS Eastern Standard Time
  Required attendees: @{triggerBody()?['attendees']}
  Body: "Agenda:\n1. Status update\n2. Risks\n3. Next steps"
  Is online meeting: Yes (generates Teams link)
```

### Room Booking Pattern

```
1. Get available rooms:
   GET https://graph.microsoft.com/v1.0/places/microsoft.graph.room
     ?$filter=capacity ge 10
     &$select=displayName,emailAddress,capacity

2. Check room availability:
   POST https://graph.microsoft.com/v1.0/users/{room-email}/getSchedule
     Body: { "schedules": ["{room-email}"], "startTime": {...}, "endTime": {...} }

3. Book the room (add as attendee):
   Action: Create event (V2)
     Required attendees: room-email@contoso.com; attendees
     Location: Room name
```

---

## Email Processing Patterns

### Pattern: Email-to-Case

```
Trigger: When a new email arrives (shared mailbox: support@contoso.com)
  ↓
AI Builder: Classify email (Billing, Technical, General)
  ↓
Dataverse: Create Case record
  Title: Email subject
  Description: Email body
  Category: AI classification result
  Customer email: From address
  ↓
Reply: "We've received your request. Case #@{body('Create_record')?['ticketnumber']}"
  ↓
Attachment handling: Save attachments to SharePoint document library
```

### Pattern: Digest Email

```
Trigger: Recurrence (daily at 8:00 AM)
  ↓
Get items: New Dataverse records from last 24h
  ↓
Create HTML table: Format as summary
  ↓
Send email: Daily digest to team distribution list
```

---

## Anti-Patterns

- Sending emails from personal accounts in automated flows (use shared mailbox)
- Using Outlook connector for bulk email (> 100 recipients) — triggers throttling
- No unsubscribe mechanism in automated emails (spam complaints)
- Hardcoding email addresses in flows (use Dataverse lookup or environment variable)
- HTML emails without inline styles (Outlook strips `<style>` tags)
- Calendar events without timezone specification (defaults vary, causes scheduling errors)
- Not handling email attachments (lost data from customer communications)
- Polling email inbox at high frequency (every 1 minute) — use push trigger where possible
- No error handling on send email actions (silent failures)
