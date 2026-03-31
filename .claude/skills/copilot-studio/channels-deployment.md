# Copilot Studio — Channels & Deployment

## Overview

Copilot Studio agents can be deployed to multiple channels simultaneously. Each channel
has unique capabilities, authentication models, and customization options. Choose the
channel based on audience, use case, and integration requirements.

---

## Microsoft Teams

The recommended channel for internal enterprise agents.

### Capabilities

| Feature | Support |
|---|---|
| **Adaptive cards** | Full support — rich interactive cards |
| **SSO** | Automatic via Teams identity (Entra ID) |
| **File sharing** | Agent can send/receive files |
| **Deep linking** | Link directly to agent in Teams |
| **Proactive messaging** | Send messages without user prompt (via Bot Framework) |
| **Task modules** | Open modal dialogs for complex input |

### Deployment Steps

```
1. In Copilot Studio, navigate to Channels → Microsoft Teams
2. Configure agent name, description, and icon for Teams
3. Select availability:
   - Specific users/groups (for testing)
   - Entire organization (for production rollout)
4. Submit for admin approval (if required by tenant policy)
5. Once approved, agent appears in Teams app catalog
6. Users add the agent from the Teams app store or via direct link
```

### Teams-Specific Best Practices

- Use adaptive cards for structured data display (not plain text for tables)
- Keep responses under 4000 characters (Teams message limit)
- Support both chat and channel conversation modes
- Test with mobile Teams client (card rendering differs)
- Use deep links for onboarding: `https://teams.microsoft.com/l/chat/0/0?users=28:{bot-id}`

---

## Custom Website

Embed agents on organizational websites for external or internal audiences.

### Embedding Options

| Option | Description | Customization |
|---|---|---|
| **Iframe embed** | Drop-in HTML snippet from Copilot Studio | Minimal — size, position only |
| **Web Chat SDK** | JavaScript SDK for full control | Full — custom UI, events, styling |
| **Direct Line API** | REST API for custom client apps | Complete — build entirely custom chat UI |

### Iframe Embed

```html
<!-- Copilot Studio embed snippet -->
<iframe
  src="https://copilotstudio.microsoft.com/environments/{env-id}/bots/{bot-id}/webchat"
  frameborder="0"
  style="width: 400px; height: 600px;"
  allow="microphone *"
></iframe>
```

### Web Chat SDK Integration

```javascript
// Initialize with Direct Line token
const directLine = new DirectLine({
  token: 'YOUR_DIRECT_LINE_TOKEN'
});

// Render chat widget
WebChat.renderWebChat(
  {
    directLine: directLine,
    userID: 'user-id',
    username: 'User Name',
    locale: 'en-US',
    styleOptions: {
      botAvatarImage: '/images/bot-avatar.png',
      hideUploadButton: true,
      bubbleBackground: '#f0f0f0',
      bubbleBorderRadius: 8
    }
  },
  document.getElementById('webchat-container')
);
```

### Customization Options

| Customization | Iframe | Web Chat SDK | Direct Line API |
|---|---|---|---|
| Colors and branding | No | Yes | Yes (custom UI) |
| Custom avatar | No | Yes | Yes |
| Pre-chat form | No | Yes | Yes |
| Post-chat survey | No | Yes | Yes |
| Event hooks (on message, on activity) | No | Yes | Yes |
| File upload control | No | Yes | Yes |
| Proactive greeting | Limited | Yes | Yes |

---

## Mobile App

For native mobile applications that need embedded agent capabilities.

### Integration Options

| Option | Platform | Description |
|---|---|---|
| **Direct Line API** | iOS, Android, cross-platform | REST API for sending/receiving messages |
| **WebView** | iOS, Android | Embed the web chat in a WebView component |
| **Bot Framework SDK** | iOS, Android | Native SDKs for rich integration |

### Direct Line API Usage

```
Endpoint: https://directline.botframework.com/v3/directline

1. POST /conversations — Start a new conversation
2. POST /conversations/{id}/activities — Send a message
3. GET /conversations/{id}/activities — Receive messages (polling or WebSocket)

Authentication: Bearer token (Direct Line secret or token)
```

### Mobile Best Practices

- Use WebSocket connection for real-time message delivery (not polling)
- Handle network interruption gracefully (reconnect logic)
- Cache conversation history locally for offline viewing
- Respect platform-specific UI guidelines (iOS HIG, Material Design)
- Test on low-bandwidth connections

---

## Omnichannel for Customer Service

Integrate Copilot Studio agents with Dynamics 365 Customer Service for unified
customer support.

### Integration Architecture

```
Customer (any channel)
      |
Omnichannel routing
      |
      |--- Agent can handle? → Copilot Studio agent responds
      |
      |--- Needs human? → Route to human agent in D365 CS
              |
              |--- Conversation context transferred
              |--- Agent transcript visible to human agent
```

### Configuration

```
1. In D365 Customer Service admin center, navigate to Workstreams
2. Create or edit a workstream
3. Add a Copilot Studio agent as the bot
4. Configure escalation rules:
   - On topic "Escalate" → route to human queue
   - On sentiment threshold → route to human queue
   - On max turns without resolution → route to human queue
5. Map agent variables to Omnichannel context variables
6. Enable transcript transfer to human agent workspace
```

### Supported Omnichannel Channels

| Channel | Description |
|---|---|
| Live chat | Web chat widget on D365 portal |
| Voice | Phone calls via voice channel |
| SMS | Text messaging |
| Social (Facebook, WhatsApp, LINE) | Social media messaging |
| Microsoft Teams | Internal support via Teams |
| Email | Email-based support |

---

## Agent API for Power Pages

The Agent API (generally available March 2026) enables custom chat experiences on Power Pages
sites, backed by Copilot Studio agents.

### What Agent API Provides

| Capability | Description |
|---|---|
| **REST API** | HTTP endpoints for sending messages and receiving responses |
| **Streaming** | Server-sent events (SSE) for real-time token streaming |
| **Custom UI** | Build any chat interface — not limited to iframe embed |
| **Authentication** | Integrated with Power Pages authentication (Entra ID, B2C, local) |
| **Session management** | API handles conversation state and history |
| **Citation access** | API returns source citations for grounded responses |

### API Endpoints

```
Base URL: https://{site}.powerappsportals.com/api/agent/v1

POST /conversations
  → Start a new conversation session
  → Returns: conversationId, session token

POST /conversations/{id}/messages
  → Send a user message
  → Body: { "text": "user message here" }
  → Returns: agent response with citations (or SSE stream)

GET /conversations/{id}/messages
  → Retrieve conversation history
  → Returns: array of messages with timestamps

DELETE /conversations/{id}
  → End the conversation session
```

### Custom Chat UI Example (Power Pages)

```javascript
// Start conversation
const response = await fetch('/api/agent/v1/conversations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  }
});
const { conversationId } = await response.json();

// Send message with streaming
const eventSource = new EventSource(
  `/api/agent/v1/conversations/${conversationId}/messages/stream`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  appendToChat(data.text, data.citations);
};

// Send user message
await fetch(`/api/agent/v1/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: userInput })
});
```

### Agent API Authentication

| Auth Method | Description | Use Case |
|---|---|---|
| **Power Pages authenticated** | User logged into Power Pages site | Personalized agent responses |
| **Anonymous** | No authentication required | Public-facing support agents |
| **Entra ID B2C** | External user identity | Customer portals |

---

## Authentication Per Channel

### Authentication Matrix

| Channel | Auth Method | SSO Available | Notes |
|---|---|---|---|
| **Microsoft Teams** | Entra ID (automatic) | Yes | Seamless — user identity flows through |
| **Custom website** | Entra ID / OAuth 2.0 | Configurable | Requires auth widget in website |
| **Custom website** | Anonymous | N/A | No user context, limited personalization |
| **Power Pages** | Power Pages auth | Yes | Integrated with portal authentication |
| **Omnichannel** | D365 contact matching | Varies | Matches customer via channel identity |
| **Mobile app** | OAuth 2.0 / Direct Line token | Configurable | App handles auth, passes token |

### Configuring Authentication

```
In Copilot Studio:
  1. Navigate to agent Settings → Security → Authentication
  2. Select authentication option:
     - No authentication (anonymous)
     - Authenticate with Microsoft (Entra ID only)
     - Authenticate manually (custom OAuth 2.0)
  3. For manual authentication:
     - Provide token endpoint URL
     - Client ID and secret
     - Scope(s)
  4. Test authentication flow in each target channel
```

---

## Deployment Checklist

| Step | Description | Required |
|---|---|---|
| Configure authentication per channel | Match auth method to audience | Yes |
| Test in each target channel | Card rendering, auth flow, conversation | Yes |
| Configure fallback and escalation | Ensure no dead-ends | Yes |
| Set up analytics | Resolution rate, CSAT per channel | Yes |
| Configure DLP | Ensure connector policies align with channel | Yes |
| Performance test | Concurrent user load per channel | Recommended |
| Accessibility review | Screen reader, keyboard nav, color contrast | Recommended |
| Mobile testing | Responsive layout, touch interaction | If applicable |

---

## Anti-Patterns

- Deploying to all channels without testing each one (card rendering, auth differ per channel)
- Using iframe embed when customization is needed (use Web Chat SDK instead)
- No authentication on agents that access user-specific data
- Skipping Omnichannel escalation configuration (agent cannot hand off to human)
- Agent API without rate limiting on Power Pages (potential abuse)
- Not configuring SSO for Teams (forcing users to re-authenticate)
- Same agent configuration for internal and external audiences (different security needs)
- No mobile testing for website-embedded agents (layout breaks on small screens)
- Proactive messages without user opt-in (poor user experience, potential compliance issue)
- Not transferring conversation context during Omnichannel escalation (human agent lacks context)
