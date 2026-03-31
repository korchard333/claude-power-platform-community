# Copilot Studio — Topics & Conversation Authoring

## Topic Types

| Type | Description | When to Use |
|---|---|---|
| **Custom topics** | Manually authored conversation flows with trigger phrases | Known intents with structured conversation paths |
| **System topics** | Built-in topics: Greeting, Escalate, End of Conversation, Fallback, Reset Conversation | Override to customize default behaviors |
| **Generative topics** | AI-generated responses grounded in knowledge sources | Unknown intents where knowledge sources contain the answer |

### System Topics Reference

| System Topic | Purpose | Customization |
|---|---|---|
| Greeting | First message when user starts conversation | Customize welcome message, set context variables |
| Escalate | Triggered when agent cannot resolve | Route to human agent, capture context for handoff |
| End of Conversation | Conversation complete | Post-conversation survey, CSAT prompt |
| Fallback | No topic or generative answer matches | Rephrase prompt, offer topic suggestions, escalate |
| Reset Conversation | User wants to start over | Clear variables, reset context |

---

## Trigger Phrases

Trigger phrases determine which topic fires for a given user input. The AI matches user input semantically, not just by exact string match.

### Best Practices

- Provide **5-10 trigger phrases** per topic minimum
- Vary phrasing: formal, informal, question form, command form
- Include common misspellings and abbreviations for critical topics
- Avoid single-word triggers (too broad, causes false matches)
- Do not duplicate trigger phrases across topics (causes ambiguity)
- Test with real user language, not developer-invented phrases

### Example

```
Topic: Order Status Check
Trigger phrases:
  - "Where is my order?"
  - "Check order status"
  - "I need to track my delivery"
  - "What happened to my package?"
  - "Order tracking"
  - "Has my order shipped?"
  - "When will my order arrive?"
```

---

## Conversation Flow Nodes

Topics are built from a sequence of nodes in the visual authoring canvas.

| Node Type | Purpose | Key Configuration |
|---|---|---|
| **Message** | Display text, images, cards, or adaptive cards to the user | Rich text, variables in message body |
| **Question** | Ask user a question and store response in a variable | Entity type, validation, reprompt behavior |
| **Condition** | Branch logic based on variable values | Supports equals, contains, greater than, boolean |
| **Action** | Call a Power Automate flow, connector, or plugin | Input/output variable mapping |
| **Topic redirect** | Transfer to another topic | Passes variables via input/output parameters |
| **Generative answers** | AI-generated response from knowledge sources | Scope to specific sources, moderation level |
| **Advanced: Parse value** | Extract structured data from unstructured input | JSON schema, regex patterns |
| **Advanced: Set variable** | Assign or transform a variable value | Formulas, static values, system variables |

### Conversation Design Patterns

**Linear flow** — simple question-answer sequence:
```
Message → Question → Action → Message (confirmation)
```

**Branched flow** — condition-based routing:
```
Question → Condition (value = A) → [Path A nodes]
                    (value = B) → [Path B nodes]
                    (else)      → [Default path]
```

**Loop pattern** — repeat until valid:
```
Question → Condition (valid?) → Yes → Continue
                               → No  → Message (error) → Redirect back to Question
```

---

## Variables

### Variable Scopes

| Scope | Lifetime | Access | Use Case |
|---|---|---|---|
| **Topic variable** | Current topic only | Local to topic | Intermediate values, question responses |
| **Global variable** | Entire conversation | All topics | User name, auth token, session state |
| **System variable** | Entire conversation | Read-only | Channel, locale, user ID, conversation ID |

### Key System Variables

| Variable | Description |
|---|---|
| `System.User.DisplayName` | Authenticated user's display name |
| `System.User.Id` | Authenticated user's Entra ID object ID |
| `System.User.Email` | Authenticated user's email |
| `System.Channel` | Current channel (Teams, Web, etc.) |
| `System.Conversation.Id` | Unique conversation identifier |
| `System.Activity.Text` | Raw user input text for current turn |
| `System.LastMessage.Text` | Last message sent by the agent |

### Variable Passing Between Topics

When redirecting to another topic, variables must be explicitly passed:

1. Define **input variables** on the target topic (mark as "Receive values from other topics")
2. Define **output variables** on the target topic (mark as "Return values to calling topics")
3. In the calling topic's redirect node, map values to input variables
4. After redirect returns, access output variables in the calling topic

---

## Entity Extraction

Entities define how user input is parsed into structured data.

### Prebuilt Entities

| Entity | Extracts | Example Input |
|---|---|---|
| Age | Age values | "I am 30 years old" → 30 |
| City | City names | "I live in Seattle" → Seattle |
| Date/Time | Dates and times | "next Tuesday at 3pm" → datetime |
| Email | Email addresses | "send to user@contoso.com" → email |
| Number | Numeric values | "I need 5 copies" → 5 |
| Phone number | Phone numbers | "call 555-0100" → phone |
| Person name | Names | "My name is Sarah" → Sarah |

### Custom Entities

Create custom entities for domain-specific extraction:

| Entity Type | Description | Example |
|---|---|---|
| **Closed list** | Fixed set of values with synonyms | Product names, department names |
| **Regular expression** | Pattern-matched values | Order numbers (ORD-######), SKUs |
| **Smart match** | AI-powered fuzzy matching | Handles typos and variations automatically |

---

## Topic Management

### Ordering and Priority

- Topics are evaluated in order — higher-priority topics are checked first
- System topics have default priority; custom topics are ordered by creation date
- Manually reorder topics when overlap exists
- Use the **Topic checker** to identify overlapping trigger phrases

### Fallback Hierarchy

The recommended fallback chain:

```
User input
  → Match custom topic? → Execute topic
  → Match generative topic? → Generate answer from knowledge
  → Fallback topic → Offer suggestions or escalate
  → Escalate topic → Hand off to human agent
```

### Topic Checker

Run the topic checker before deployment to catch:
- Overlapping trigger phrases between topics
- Unreachable nodes in conversation flow
- Missing variable assignments
- Broken topic redirects
- Actions with unmapped input/output variables

---

## Anti-Patterns

- Fewer than 5 trigger phrases per topic (poor matching accuracy)
- Using topic variables where global variables are needed (data lost on topic switch)
- Deep nesting of conditions (more than 3 levels — refactor into sub-topics)
- No fallback or escalation path from any conversation dead-end
- Hardcoding text that should come from environment variables or knowledge sources
- Not testing trigger phrase overlap between topics before deployment
- Using Message nodes for questions (no variable capture, no reprompt on invalid input)
- Skipping entity extraction and parsing raw `System.Activity.Text` manually
