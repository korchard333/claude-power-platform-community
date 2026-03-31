# GPT Prompts in AI Builder

AI Builder GPT prompts use Azure OpenAI GPT models to create reusable text generation, extraction, classification, and summarization actions for Power Automate and Canvas Apps.

---

## Prompt Types

| Prompt Type | Use Case | Example |
|---|---|---|
| **Create text** | Generate summaries, responses, descriptions | Summarize customer feedback |
| **Extract information** | Pull structured data from unstructured text | Extract action items from meeting notes |
| **Classify text** | Categorize into predefined labels | Route support tickets by category |
| **Summarize** | Condense long text | Summarize email threads |
| **Custom** | Any GPT-powered logic | Translate, reformat, generate code |

---

## Creating a Prompt

```
AI Builder > Prompts > New prompt
  1. Write the system prompt (instructions for the model)
  2. Define input variables (dynamic content from flows/apps)
  3. Configure settings (temperature, max tokens)
  4. Test with sample inputs
  5. Save and publish
```

### Prompt Engineering Patterns for Power Platform

**1. Role + Task + Format pattern:**
```
You are an experienced customer service analyst.
Analyze the following customer feedback and provide:
1. Primary sentiment (Positive/Negative/Neutral)
2. Key topics mentioned (comma-separated)
3. Suggested action (1 sentence)

Format your response as JSON:
{"sentiment": "...", "topics": "...", "action": "..."}

Feedback: {{CustomerFeedback}}
```

**2. Context grounding with Dataverse record:**
```
You are a project status summarizer for a construction company.

Project details:
- Name: {{ProjectName}}
- Status: {{ProjectStatus}}
- Budget: {{Budget}}
- Spent: {{AmountSpent}}
- Due date: {{DueDate}}
- Recent notes: {{RecentNotes}}

Write a 2-3 sentence executive summary for a weekly stakeholder email.
Focus on: budget health, timeline risk, and next milestone.
```

**3. Classification with explicit labels:**
```
Classify the following support ticket into exactly ONE of these categories:
- Billing
- Technical
- Account Access
- Feature Request
- General Inquiry

Return ONLY the category name, nothing else.

Ticket: {{TicketDescription}}
```

**4. Few-shot examples:**
```
Extract the delivery address from the following order email.
Return ONLY the address, formatted as a single line.

Examples:
Input: "Please ship to 123 Main St, Suite 4, Denver CO 80202"
Output: "123 Main St, Suite 4, Denver, CO 80202"

Input: "Deliver to our warehouse at 456 Industrial Blvd, Building C, Austin TX 78701"
Output: "456 Industrial Blvd, Building C, Austin, TX 78701"

Input: {{OrderEmail}}
Output:
```

---

## Power Automate Integration

### Basic Pattern: Trigger > GPT > Store Result

```
Trigger: When a Dataverse row is created (contoso_feedback table)
  |
  +-- AI Builder: Create text with GPT
  |     Prompt: "Summarize Customer Feedback"
  |     Input: triggerOutputs()?['body/contoso_feedbacktext']
  |
  +-- Update Dataverse row
        contoso_summary = outputs('Create_text_with_GPT')?['body/responsev2/predictionOutput/text']
        contoso_sentiment = outputs('Create_text_with_GPT')?['body/responsev2/predictionOutput/text']
```

### JSON Output Parsing

When your prompt returns structured JSON:

```
// Parse the GPT output as JSON
json(outputs('Create_text_with_GPT')?['body/responsev2/predictionOutput/text'])

// Access individual fields
json(outputs('Create_text_with_GPT')?['body/responsev2/predictionOutput/text'])?['sentiment']
json(outputs('Create_text_with_GPT')?['body/responsev2/predictionOutput/text'])?['topics']
```

> **Important:** GPT may occasionally return malformed JSON. Wrap the Parse JSON action in a try/catch Scope and fall back to a default value or manual review.

### Multi-Step Processing

```
Trigger: When a long email is received
  |
  +-- AI Builder: Summarize (reduce to 500 words)
  +-- AI Builder: Extract action items (structured list)
  +-- AI Builder: Classify priority (High/Medium/Low)
  |
  +-- Create Dataverse row with summary, action items, and priority
```

---

## Canvas App Integration

### AI Functions (Power Fx)

```
// Generate text with a prompt
Set(varSummary,
    AIBuilder.CreateTextWithGPT(
        "Summarize Customer Feedback",
        {CustomerFeedback: txtFeedback.Text}
    )
)

// Display result
lblSummary.Text = varSummary.Text

// Classification
Set(varCategory,
    AIBuilder.CreateTextWithGPT(
        "Classify Support Ticket",
        {TicketDescription: txtTicket.Text}
    )
)
```

### User Experience Patterns

- **Show loading indicator** -- GPT calls take 2-10 seconds. Use `UpdateContext({isProcessing: true})` before the call.
- **Cache results** -- Store GPT output in a variable or Dataverse. Don't re-call for the same input.
- **Graceful failure** -- Wrap in `IfError()` and show "Unable to process. Please try again." on failure.
- **Display confidence context** -- Tell users when AI generated the content: "AI-generated summary (review before sending)".

---

## Token Management

GPT prompts consume tokens (input + output). Manage costs by controlling token usage:

| Setting | Default | Recommendation |
|---|---|---|
| **Temperature** | 0.7 | Use 0.0-0.3 for factual/classification tasks; 0.5-0.7 for creative text |
| **Max tokens** | 800 | Set to minimum needed. Summaries: 200-400. Classifications: 50. |
| **Top P** | 1.0 | Leave at 1.0 unless you need to restrict vocabulary diversity |

### Token Estimation

- 1 token ~= 4 characters in English
- A 500-word input ~= 375 tokens
- A 200-word output ~= 150 tokens
- Total per call: input tokens + output tokens + system prompt tokens

### Cost Control

- **Limit input length** -- Truncate or summarize long inputs before sending to GPT
- **Set max tokens** -- Prevents runaway costs on unexpectedly long outputs
- **Monitor usage** -- Power Platform Admin Center > AI Builder > Usage dashboard
- **Use prebuilt models first** -- Sentiment analysis and entity extraction are cheaper than GPT prompts for those specific tasks

---

## Prompt Versioning and ALM

AI Builder prompts are **solution-aware**. They promote with managed solutions just like flows and apps.

**Best practices:**
- Store prompt text in an environment variable for easy modification per environment
- Version prompts with descriptive names: "Summarize Feedback v2"
- Test prompts in Dev before promoting to Test/Prod
- Keep a changelog of prompt modifications (prompt changes can significantly alter output)

---

## Anti-Patterns

- **Prompts without context grounding** -- Generic prompts produce generic results. Include specific Dataverse record data as context.
- **No output validation** -- GPT can return unexpected formats. Always validate/parse output before storing.
- **Ignoring token limits** -- Sending entire documents as input wastes tokens and may truncate. Summarize or chunk first.
- **Using GPT for deterministic logic** -- If the answer is always the same for a given input, use an expression or business rule instead.
- **No fallback for GPT failures** -- GPT calls can fail (rate limits, service issues). Always have error handling.
- **Temperature too high for classification** -- Use 0.0-0.1 for classification tasks to get consistent results.
- **Not testing with adversarial inputs** -- Test with edge cases: empty input, very long input, input in unexpected language, injection attempts.
- **Storing prompts as hardcoded strings in flows** -- Use AI Builder's prompt management for versioning, testing, and environment promotion.
