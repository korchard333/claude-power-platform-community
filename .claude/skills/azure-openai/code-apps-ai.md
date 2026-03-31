# Code Apps + AI

## Overview

Code Apps (React + TypeScript + Vite) integrate with Azure OpenAI through a server-side intermediary — never directly from the browser. The recommended patterns are: Custom API in Dataverse (called via Web API), Azure Function (called via Custom Connector or direct HTTP), or Power Automate flow (triggered from the Code App).

---

## Architecture: Never Client-Side Keys

```
WRONG (insecure):
  Code App (browser) → Azure OpenAI API (key in JS bundle)

RIGHT (secure):
  Code App (browser) → Dataverse Custom API → Plugin → Azure OpenAI
  Code App (browser) → Azure Function (managed identity) → Azure OpenAI
  Code App (browser) → Power Automate flow → Azure OpenAI
```

**Why?** Any API key shipped in a browser bundle is extractable. Azure OpenAI keys grant full access to your deployment — token consumption, model access, everything.

---

## Pattern 1: Azure Function Intermediary (Recommended)

### Azure Function

```typescript
// Azure Function — api/chat/index.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
  // Uses AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY env vars
  // Or managed identity (recommended)
});

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
}

app.http("chat", {
  methods: ["POST"],
  authLevel: "function",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const body = (await request.json()) as ChatRequest;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant for the HR department." },
        ...body.messages,
      ],
      max_tokens: body.maxTokens ?? 1000,
      temperature: 0.3,
    });

    return {
      jsonBody: {
        content: completion.choices[0]?.message?.content ?? "",
        usage: completion.usage,
      },
    };
  },
});
```

### Code App — Custom Hook

```typescript
// src/hooks/useAIChat.ts
import { useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseAIChatOptions {
  functionUrl: string;
  functionKey: string;
}

export function useAIChat({ functionUrl, functionKey }: UseAIChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
      setMessages(newMessages);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${functionUrl}/api/chat?code=${functionKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (!response.ok) {
          throw new Error(`AI service error: ${response.status}`);
        }

        const data = await response.json();
        setMessages([...newMessages, { role: "assistant", content: data.content }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "AI call failed");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, functionUrl, functionKey]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, sendMessage, isLoading, error, clearMessages };
}
```

### Code App — Chat UI Component

```typescript
// src/components/AIChat.tsx
import { useAIChat } from "../hooks/useAIChat";
import { useState, FormEvent } from "react";

interface AIChatProps {
  functionUrl: string;
  functionKey: string;
}

export function AIChat({ functionUrl, functionKey }: AIChatProps) {
  const { messages, sendMessage, isLoading, error } = useAIChat({ functionUrl, functionKey });
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="ai-chat">
      <div className="ai-chat__messages" role="log" aria-live="polite">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-chat__message ai-chat__message--${msg.role}`}>
            <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        {isLoading && <div className="ai-chat__loading" aria-busy="true">Thinking...</div>}
        {error && <div className="ai-chat__error" role="alert">{error}</div>}
      </div>
      <form onSubmit={handleSubmit} className="ai-chat__form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
          aria-label="Message input"
        />
        <button type="submit" disabled={isLoading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
```

---

## Pattern 2: Dataverse Custom API

Create a Custom API in Dataverse backed by a plugin that calls AOAI. The Code App calls it via the standard Web API.

### Custom API Definition

```
POST /api/data/v9.2/customapis
{
  "uniquename": "contoso_AISummarize",
  "name": "AI Summarize",
  "displayname": "AI Summarize",
  "description": "Summarize text using Azure OpenAI",
  "bindingtype": 0,        // Global
  "isfunction": false,     // Action (POST)
  "isprivate": false,
  "plugintypeid@odata.bind": "/plugintypes(guid)"
}

// Request parameter
POST /api/data/v9.2/customapirequestparameters
{
  "customapiid@odata.bind": "/customapis(guid)",
  "uniquename": "InputText",
  "name": "InputText",
  "type": 10,              // String
  "isoptional": false
}

// Response property
POST /api/data/v9.2/customapiresponseproperties
{
  "customapiid@odata.bind": "/customapis(guid)",
  "uniquename": "Summary",
  "name": "Summary",
  "type": 10               // String
}
```

### Calling from Code App

```typescript
// src/services/aiService.ts
import { getContext } from "@microsoft/power-apps/host";

export async function summarizeText(inputText: string): Promise<string> {
  const context = getContext();
  const orgUrl = context.orgUrl;

  const response = await fetch(`${orgUrl}/api/data/v9.2/contoso_AISummarize`, {
    method: "POST",
    headers: {
      "OData-Version": "4.0",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ InputText: inputText }),
  });

  if (!response.ok) {
    throw new Error(`Custom API error: ${response.status}`);
  }

  const data = await response.json();
  return data.Summary;
}
```

### Advantages of Custom API Pattern

| Advantage | Details |
|---|---|
| Authentication handled | Uses Dataverse auth — no separate key management |
| Security model | Respects Dataverse security roles |
| Solution-aware | Custom API deploys with solution |
| No CORS issues | Same-origin call to Dataverse |
| Audited | Calls logged in Dataverse audit |

---

## Pattern 3: Power Automate Flow

Trigger a flow from the Code App, pass data, get AI response back.

### Flow Setup

```
Trigger: When an HTTP request is received (Request/Response)
  Schema: { "inputText": "string" }
  ↓
Action: HTTP — Call Azure OpenAI
  ↓
Response: Return AI result
  Body: { "summary": "@{body('HTTP')['choices'][0]['message']['content']}" }
```

### Code App Call

```typescript
export async function callAIFlow(inputText: string): Promise<string> {
  const flowUrl = "https://prod-xx.westus.logic.azure.com:443/workflows/...";

  const response = await fetch(flowUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText }),
  });

  const data = await response.json();
  return data.summary;
}
```

> **Caveat:** HTTP-triggered flows expose a URL with a SAS token. Treat it as a secret. For production, prefer the Custom API pattern.

---

## Streaming Responses

For chat interfaces, streaming gives better UX. Only the Azure Function pattern supports streaming to the browser.

### Azure Function — Streaming

```typescript
// Azure Function with streaming
app.http("chat-stream", {
  methods: ["POST"],
  handler: async (request, context) => {
    const body = await request.json();

    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      messages: body.messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return { body: readable, headers: { "Content-Type": "text/event-stream" } };
  },
});
```

### Code App — Streaming Consumer

```typescript
export async function streamChat(
  messages: Message[],
  onChunk: (content: string) => void,
  functionUrl: string
): Promise<void> {
  const response = await fetch(`${functionUrl}/api/chat-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split("\n").filter((line) => line.startsWith("data: "));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") return;
      const parsed = JSON.parse(data);
      onChunk(parsed.content);
    }
  }
}
```

---

## Anti-Patterns

- API keys in Code App bundle (extractable, full AOAI access)
- Calling AOAI directly from browser (CORS issues + key exposure)
- No loading state during AI calls (user thinks app is frozen)
- No error handling on AI responses (network failures, rate limits)
- Streaming without graceful degradation (fall back to non-streaming if SSE fails)
- Using flow HTTP trigger URL without treating it as a secret
- No token budget management (sending huge inputs that exceed context window)
- No input validation (prompt injection via user input)
