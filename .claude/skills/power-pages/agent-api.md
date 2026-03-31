# Power Pages — Agent Integration & Custom Chat

Copilot Studio agents can be added to Power Pages sites to provide conversational AI
experiences. Developers can either use the default agent widget or build fully custom chat
UIs using the `$pages.agent` Client API (preview).

## Agent Integration Options

| Option | Effort | Control | Best For |
|---|---|---|---|
| **Default agent widget** | Low — enable in Set up workspace | Minimal (CSS customization only) | Quick deployment, standard chat UX |
| **Custom chat UI via `$pages.agent` API** | Medium — build custom frontend | Full control over UX, styling, behavior | Branded experiences, complex chat flows |

## Adding an Agent to a Power Pages Site

### Via the Setup Workspace

1. In Power Pages, go to **Set up workspace**
2. Under **AI assistance**, select **Agents**
3. Turn on the **Site agent** option — this creates a Copilot Studio agent with generative answers
4. Assign web roles to control which users can see the agent
5. The agent automatically uses the site's content for generative answers

### Adding an Existing Copilot Studio Agent

1. In the Set up workspace > Agents, select **Add agent**
2. Choose an existing Copilot Studio agent from the environment
3. Assign web roles for visibility control
4. The agent uses Generic OAuth 2 authentication with token pass-through, supporting all identity providers configured for the site (including anonymous users)

## Custom Chat UI with `$pages.agent` Client API

The `$pages.agent` Client API (preview) provides a JavaScript API for building fully custom
chat interfaces. This is **not a REST API** — it is a client-side JavaScript object available
on Power Pages sites.

### API Surface

```javascript
// Send a message to the agent and receive responses via callbacks
$pages.agent.SendActivity(
  agentSchemaName,    // string — the agent's schema name (not a GUID)
  inputActivity,      // object — the message to send
  responseSubscriber, // callback — receives agent responses
  errorSubscriber     // callback — receives errors
);
```

### Building a Custom Chat — Vanilla JavaScript

```javascript
// Send a user message and handle the agent's response
function sendMessage(userText) {
  const activity = {
    type: "message",
    text: userText
  };

  $pages.agent.SendActivity(
    "contoso_SupportAgent",  // Agent schema name
    activity,
    function(response) {
      // response contains the agent's reply
      // response.text — the text content
      // response.attachments — Adaptive Cards, if any
      // response.suggestedActions — quick-reply buttons
      displayAgentMessage(response);
    },
    function(error) {
      console.error("Agent error:", error);
      displayErrorMessage("Sorry, something went wrong. Please try again.");
    }
  );
}
```

### Building a Custom Chat — React (Code Site)

```tsx
import { useState, useCallback } from "react";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
  cards?: any[];
}

function ChatPanel({ agentSchemaName }: { agentSchemaName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: "user", text }]);
    setIsLoading(true);

    const activity = { type: "message", text };

    // $pages.agent is available globally on Power Pages sites
    (window as any).$pages.agent.SendActivity(
      agentSchemaName,
      activity,
      (response: any) => {
        setMessages(prev => [...prev, {
          role: "agent",
          text: response.text,
          cards: response.attachments
        }]);
        setIsLoading(false);
      },
      (error: any) => {
        console.error("Agent error:", error);
        setIsLoading(false);
      }
    );
  }, [agentSchemaName]);

  return (
    <div role="log" aria-live="polite" className="chat-container">
      {messages.map((msg, i) => (
        <div key={i} className={`chat-message chat-${msg.role}`}>
          {msg.text}
        </div>
      ))}
      {isLoading && <div className="typing-indicator">Agent is typing...</div>}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
```

## Authentication

### How Authentication Works

1. User authenticates to Power Pages via configured identity provider (Entra ID B2C, SAML, OAuth)
2. Portal session cookie authenticates agent API calls automatically
3. The `$pages.agent` API handles the connection lifecycle internally (uses Direct Line behind the scenes)
4. Authenticated user context (contact record) is passed to the Copilot Studio agent as a variable

### Authenticated vs Anonymous

| Mode | Session Cookie | Agent Context | Use Case |
|---|---|---|---|
| Authenticated | Required | Agent receives user identity, can personalize responses | Customer portal, account-specific support |
| Anonymous | Not required | Agent has no user context, generic responses only | Public FAQ, pre-login help |

Agent visibility is controlled via **web roles** — assign roles to determine which users can access which agents.

## Message Rendering

- **Text:** Render as HTML (sanitize agent output to prevent XSS)
- **Adaptive Cards:** Use the `adaptivecards` npm package to render card payloads from agent responses
- **Links and citations:** Agent may return source links from knowledge base — render as clickable references
- **Suggested actions:** Render as quick-reply buttons that submit the action text as a user message

## UX Requirements

- Display a typing indicator while waiting for the agent response
- Preserve conversation history in component state (or session storage for page refreshes)
- Enforce input character limits (agent topics may have token constraints)
- Auto-scroll to latest message on new responses

## Accessibility (WCAG 2.2 AA)

- Chat container must have `role="log"` and `aria-live="polite"` for screen reader announcements
- All interactive elements (send button, quick replies) must be keyboard accessible
- Maintain minimum 4.5:1 contrast ratio for message text
- Provide visible focus indicators on input fields and buttons
- Include `aria-label` on the send button and input field

## Copilot Studio Agent Configuration

### Channel Setup

When an agent is added to a Power Pages site:
- Power Pages automatically registers as a channel in Copilot Studio
- The agent uses Generic OAuth 2 with token pass-through
- This supports all identity providers configured for the site

### Knowledge Source Scoping

- Scope the agent's knowledge to portal-relevant content (product docs, FAQs, site help)
- Do not expose the entire organizational knowledge base to public-facing portals
- Configure content moderation level in Copilot Studio (medium or high for public sites)

### Multiple Agents Per Site

Multiple agents can be added to a single site. Use web roles to control visibility:
- Support agent visible to authenticated customers
- Sales agent visible to anonymous visitors
- Internal agent visible only to employees with specific roles

## Use Cases

- **Customer support chat:** Authenticated portal users get personalized help based on their account, cases, and entitlements
- **Self-service troubleshooting:** Knowledge-base-backed agent walks users through diagnostic steps before escalating to a live agent
- **Guided form filling:** Conversational AI collects information step-by-step, then submits a Dataverse record
- **Product recommendations:** E-commerce portal agent suggests products based on user preferences and browsing context

## Anti-Patterns

- Using the default widget when custom branding is required — use the `$pages.agent` Client API instead
- Skipping web role assignment — anonymous access may leak responses meant for authenticated users
- Not scoping knowledge sources to portal-relevant content — agent answers off-topic questions or exposes internal documentation
- Missing escalation path to a human agent — users get stuck in loops with no way to reach support
- Chat UI without accessibility — missing keyboard navigation, screen reader support, or insufficient contrast
- Storing conversation history in local storage without expiration — stale data accumulates and may contain sensitive information
- Not handling errors from the `$pages.agent` API — always provide an `errorSubscriber` callback with user-friendly fallback messaging
- Building a custom REST API wrapper when `$pages.agent` is available — the Client API handles auth and Direct Line connection management internally
