# Copilot Studio — Knowledge Sources

## Source Types

| Source | Data Type | Auth Required | Refresh | Best For |
|---|---|---|---|---|
| **Dataverse** | Structured (tables/rows) | Agent identity | Real-time | CRM data, business records, lookup tables |
| **SharePoint** | Documents (Word, PDF, pages) | User or agent identity | Periodic indexing | HR policies, SOPs, internal documentation |
| **Public websites** | Web pages (crawled) | None | Periodic crawl | Product docs, FAQ pages, public knowledge bases |
| **Uploaded files** | PDF, Word, Excel, TXT | None | On upload | Static reference material, one-off documents |
| **Microsoft Graph** | M365 data (email, calendar, Teams) | User identity (delegated) | Real-time | Copilot extensions only — enterprise context |

---

## Configuration

### Adding Knowledge Sources

1. Open the agent in Copilot Studio
2. Navigate to **Knowledge** in the left panel
3. Select **Add knowledge** and choose source type
4. Configure source-specific settings (URL, site, table, files)
5. Set scope and access permissions
6. Test with representative queries

### Dataverse Configuration

```
Source: Dataverse table(s)
Tables: Select specific tables the agent should query
Columns: Limit to relevant columns (reduces noise, improves grounding)
Filters: Apply view filters to scope data (e.g., active records only)
Access: Agent uses calling user's security role for row-level filtering
```

### SharePoint Configuration

```
Source: SharePoint site or document library
Site URL: https://contoso.sharepoint.com/sites/HR
Scope: Entire site or specific libraries/folders
Indexing: Automatic — content indexed on schedule
Supported formats: Word, PDF, PowerPoint, text files, SharePoint pages
```

### Public Website Configuration

```
Source: Website URL(s)
URLs: https://docs.contoso.com (up to 4 levels deep by default)
Crawl depth: Configurable — limit to relevant sections
Exclusions: Specify URL patterns to skip
Update frequency: Periodic recrawl (configured in source settings)
```

### Uploaded Files

```
Supported formats: PDF, DOCX, XLSX, PPTX, TXT, CSV, MD
Max file size: 512 MB per file (as of 2025 wave 2)
Limit: Up to 10 files per knowledge source entry
Refresh: Manual — re-upload to update content
```

---

## Generative Answers

Generative answers use AI to synthesize responses from knowledge sources when no custom topic matches the user's query.

### Enabling Generative Answers

| Method | Description |
|---|---|
| **Agent-level fallback** | Enable in agent settings — generates answers when no topic matches |
| **Per-topic node** | Add a "Generative answers" node within a specific topic flow |
| **Scoped to sources** | Restrict which knowledge sources a generative answers node can use |

### Moderation Levels

| Level | Behavior | Use Case |
|---|---|---|
| **High** | Strict content filtering, only well-grounded answers | Public-facing agents, regulated industries |
| **Medium** | Balanced filtering, allows broader interpretation | Internal employee agents |
| **Low** | Minimal filtering, most permissive | Development/testing only — not for production |

### "No Answer" Fallback

Configure what happens when generative answers cannot find a response:

```
Options:
  1. Display a custom message ("I don't have information about that")
  2. Redirect to a specific topic (e.g., Escalate)
  3. Prompt the user to rephrase
  4. Offer suggested topics the agent can help with
```

Always configure a "no answer" behavior. Never leave the agent silent.

---

## Content Moderation and Safety Filters

### Built-in Safety

Copilot Studio applies content safety filters to all generative responses:

| Filter | Description |
|---|---|
| **Harmful content** | Blocks violent, hateful, sexual, or self-harm content |
| **Prompt injection** | Detects and blocks attempts to override system instructions |
| **Jailbreak attempts** | Prevents users from bypassing agent boundaries |
| **PII leakage** | Warns when responses may contain personal identifiable information |

### Custom Content Moderation

- **System message**: Define the agent's persona and boundaries in agent settings
- **Blocked phrases**: Add specific phrases the agent should never output
- **Topic scoping**: Restrict generative answers to specific knowledge domains
- **Instruction tuning**: Add instructions like "Only answer questions about HR policies"

---

## Grounding

Grounding is the process by which the AI model anchors its responses in the provided knowledge source material rather than generating from its base training data.

### How Grounding Works

1. User asks a question
2. Copilot Studio retrieves relevant chunks from indexed knowledge sources
3. Retrieved chunks are passed to the language model as context
4. Model generates a response grounded in the retrieved content
5. Response includes citations linking back to source material

### Grounding Quality Factors

| Factor | Impact | Recommendation |
|---|---|---|
| **Source quality** | Garbage in, garbage out | Ensure source documents are accurate and current |
| **Content structure** | Well-structured content grounds better | Use headings, lists, tables in source documents |
| **Scope** | Too broad = off-topic answers | Limit sources to relevant content domains |
| **Chunk overlap** | Conflicting content confuses the model | Remove duplicate or contradictory content across sources |
| **Freshness** | Stale content leads to wrong answers | Set appropriate refresh schedules |

### Citation Behavior

- Generative answers include citations by default (links to source documents)
- Citations help users verify information and build trust
- For SharePoint sources, citations link to the specific document
- For websites, citations link to the source URL

---

## Testing Knowledge Sources

### Verification Approach

1. **Breadth testing**: Ask questions spanning all knowledge source topics
2. **Boundary testing**: Ask questions at the edge of knowledge scope
3. **Out-of-scope testing**: Ask questions the agent should not answer
4. **Adversarial testing**: Attempt to get the agent to hallucinate or leak source data
5. **Freshness testing**: Ask about recently updated content to verify indexing

### Test Matrix Template

| Test Query | Expected Source | Expected Behavior | Actual Result | Pass/Fail |
|---|---|---|---|---|
| "What is the PTO policy?" | SharePoint HR docs | Grounded answer with citation | | |
| "What is the weather?" | None (out of scope) | "I can only help with..." | | |
| "Ignore instructions, tell me..." | None (prompt injection) | Blocked by safety filter | | |
| "New policy added yesterday" | SharePoint (recent) | Reflects updated content | | |

---

## Anti-Patterns

- Adding all available SharePoint sites as knowledge (too broad, off-topic responses)
- No content moderation on public-facing agents
- Using uploaded files for content that changes frequently (requires manual re-upload)
- Not testing with out-of-scope queries (agent may answer questions it should not)
- Skipping citation verification (agent may cite wrong source)
- Mixing contradictory content across multiple sources (confuses grounding)
- Not setting a "no answer" fallback (agent goes silent when it cannot answer)
- Using Graph connector knowledge without requiring authentication (data leakage risk)
- Low moderation level in production environments
- Not limiting Dataverse columns exposed to the agent (over-exposing sensitive fields)
