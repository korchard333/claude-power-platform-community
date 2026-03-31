# Power Automate + AI

## Overview

Power Automate integrates with Azure OpenAI through three paths: AI Builder prompts (low-code), the Azure AI Foundry connector (premium), or direct HTTP calls to AOAI endpoints. Each has different trade-offs in flexibility, control, and ease of use.

---

## Option 1: AI Builder Prompts (Simplest)

AI Builder prompts let you call GPT models with zero code — define a prompt template, map inputs/outputs, and use it as a flow action.

### Create a Prompt

```
Power Automate → AI Builder → Prompts → + New prompt

Name: "Classify Support Ticket"
Model: GPT-4o (or latest available)
System message: "You are a support ticket classifier."
Prompt:
  "Classify the following support ticket into one of these categories:
   Billing, Technical, Account, General.

   Ticket: {{ticketDescription}}

   Respond with ONLY the category name."

Input: ticketDescription (Text)
Output: category (Text)
```

### Use in a Flow

```
Trigger: When a Dataverse record is created (Case)
  ↓
Action: AI Builder — Create text with GPT
  Prompt: "Classify Support Ticket"
  ticketDescription: triggerBody()?['description']
  ↓
Action: Update Dataverse record
  Category: outputs('AI_Builder')?['category']
```

### AI Builder Prompt Limitations

| Limitation | Impact |
|---|---|
| Limited model selection | Only models Microsoft makes available in AI Builder |
| No streaming | Full response returned, not streamed |
| No function calling / tools | Cannot use structured tool calls |
| Token limits set by platform | Cannot configure max tokens directly |
| Copilot Credits consumed | Each call consumes Copilot Credits (or AI Builder credits) |
| No fine-tuned models | Cannot use custom fine-tuned deployments |

---

## Option 2: Azure AI Foundry Connector (Premium)

The Azure AI Foundry connector provides direct access to your AOAI deployments.

### Prerequisites

1. Azure OpenAI resource with deployed model
2. API key or managed identity access
3. Power Automate Premium license (premium connector)

### Flow Pattern

```
Trigger: When a Dataverse record is created
  ↓
Action: Azure AI Foundry — Chat Completions
  Endpoint: https://[your-resource].openai.azure.com/
  Deployment: gpt-4o
  API Key: [from Key Vault or flow secret]
  Messages:
    - System: "You are a helpful assistant that summarizes case notes."
    - User: "Summarize: {{caseDescription}}"
  Temperature: 0.3
  Max tokens: 500
  ↓
Parse JSON: Parse the response
  ↓
Update record with AI summary
```

---

## Option 3: HTTP Connector to AOAI (Maximum Control)

Direct HTTP calls give full control over every parameter.

### Chat Completions

```
Action: HTTP
  Method: POST
  URI: https://[resource].openai.azure.com/openai/deployments/[deployment]/chat/completions?api-version=2024-10-21
  Headers:
    api-key: [API key]
    Content-Type: application/json
  Body:
    {
      "messages": [
        {
          "role": "system",
          "content": "You are a contract analyst. Extract key terms from contracts."
        },
        {
          "role": "user",
          "content": "Extract key terms from this contract:\n\n@{triggerBody()?['contractText']}"
        }
      ],
      "temperature": 0.1,
      "max_tokens": 1000,
      "response_format": { "type": "json_object" }
    }
```

### Structured Output with JSON Mode

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Extract contract terms and return as JSON with keys: parties, effectiveDate, terminationDate, value, keyTerms (array of strings)."
    },
    {
      "role": "user",
      "content": "Contract text: @{triggerBody()?['contractText']}"
    }
  ],
  "temperature": 0,
  "response_format": { "type": "json_object" }
}
```

Parse the response:
```
Action: Parse JSON
  Content: body('HTTP')?['choices']?[0]?['message']?['content']
  Schema: {
    "type": "object",
    "properties": {
      "parties": { "type": "array", "items": { "type": "string" } },
      "effectiveDate": { "type": "string" },
      "terminationDate": { "type": "string" },
      "value": { "type": "string" },
      "keyTerms": { "type": "array", "items": { "type": "string" } }
    }
  }
```

---

## Retry and Fallback Patterns

### Retry on 429 (Rate Limited)

```
Action: HTTP (call AOAI)
  Configure run after: is successful
  ↓
If action failed with 429:
  ↓
  Delay: Parse Retry-After header (or default 10 seconds)
  ↓
  Retry HTTP call (in a Do Until loop, max 3 retries)
```

### Expression to Check for 429

```
// In a condition
@equals(outputs('HTTP_Call_AOAI')['statusCode'], 429)
```

### Retry-After Header

```
// Extract Retry-After from headers
@int(outputs('HTTP_Call_AOAI')['headers']?['Retry-After'] ?? '10')
```

### Fallback Pattern

```
Try: Call primary AOAI deployment (GPT-4o)
  If fails (429 or 500):
    Fallback: Call secondary deployment (GPT-4o-mini — cheaper, higher limits)
      If fails:
        Fallback: Queue for manual processing
        Post to Teams: "AI processing failed for [record]"
```

---

## Token Limit Management

### Model Context Windows

| Model | Context Window | Output Limit |
|---|---|---|
| GPT-4o | 128K tokens | 16K tokens |
| GPT-4o-mini | 128K tokens | 16K tokens |
| GPT-4 Turbo | 128K tokens | 4K tokens |
| GPT-3.5 Turbo | 16K tokens | 4K tokens |

### Estimating Tokens

```
Rule of thumb: 1 token ≈ 4 characters (English)

Example:
  System prompt: ~200 tokens
  Input text: 5,000 characters ≈ 1,250 tokens
  Desired output: ~500 tokens
  Total: ~1,950 tokens (well within limits)
```

### Handling Long Input

```
If input text > 100K characters:
  1. Chunk the text into segments (with overlap)
  2. Process each chunk separately
  3. Combine results in a final summarization call

Flow pattern:
  Split text → Apply to each chunk → AI call per chunk → Combine → Final AI summary
```

---

## Common Prompt Patterns for Flows

### Classification
```
System: "Classify the input into exactly one category: {categories}. Respond with only the category name."
User: "{input}"
Temperature: 0
```

### Extraction
```
System: "Extract the following fields from the text and return as JSON: {fields}. If a field is not found, return null."
User: "{input}"
Temperature: 0
Response format: json_object
```

### Summarization
```
System: "Summarize the following text in {length} sentences. Focus on key decisions and action items."
User: "{input}"
Temperature: 0.3
```

### Draft Generation
```
System: "Draft a professional {type} based on the following context. Tone: {tone}. Length: {length}."
User: "Context: {input}"
Temperature: 0.7
```

---

## Security Considerations

| Concern | Mitigation |
|---|---|
| API key exposure | Store in Key Vault, reference via environment variable |
| Data sent to AOAI | AOAI does not use customer data for training (enterprise terms) |
| PII in prompts | Redact PII before sending, or use Azure AI Content Safety |
| Prompt injection | Validate/sanitize user input before including in prompts |
| Response quality | Always validate AI output before writing to Dataverse |

---

## Anti-Patterns

- Hardcoding AOAI API keys in flow definitions (use Key Vault or connection)
- No retry logic on AI calls (AOAI returns 429 under load)
- Sending entire documents without token limit check (truncation or failure)
- Using free-form text output when structured data is needed (parse failures)
- No fallback when AI call fails (flow fails silently)
- Calling AI for every record in a large Apply to Each (use batch processing)
- Not validating AI output before writing to Dataverse (garbage data)
- Using high temperature for classification/extraction tasks (inconsistent results)
