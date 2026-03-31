---
name: ai-builder
description: "AI Builder for Power Platform. Use when: document processing, prediction models, GPT prompt actions in flows, prebuilt models (text recognition, sentiment, entity extraction), custom models, AI Builder in Canvas Apps and Power Automate, licensing."
---

# Skill: AI Builder

## When to Use
Trigger when building, configuring, or integrating AI Builder models -- document processing, prediction, GPT prompts, prebuilt models, or custom ML models within Power Platform.

---

## Model Types

| Model Type | Description | Training Required? |
|---|---|---|
| **Document processing** | Extract fields from invoices, receipts, custom documents | Yes -- train with sample documents |
| **Text recognition (OCR)** | Extract text from images and PDFs | No (prebuilt) |
| **Sentiment analysis** | Detect positive/negative/neutral sentiment in text | No (prebuilt) |
| **Entity extraction** | Extract entities (names, dates, addresses) from text | No (prebuilt) |
| **Text classification** | Categorize text into custom categories | Yes -- train with labeled examples |
| **Object detection** | Detect and count objects in images | Yes -- train with labeled images |
| **Prediction** | Predict outcomes based on historical data | Yes -- requires Dataverse table with history |
| **GPT prompts** | Custom prompts using Azure OpenAI GPT models | No -- prompt engineering only |
| **Category classification** | Classify items into predefined categories | Yes |

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- **[Document Processing](document-processing.md)** -- Document processing models, training, publishing, Power Automate integration, batch processing, confidence thresholds, human review loop
- **[GPT Prompts](gpt-prompts.md)** -- GPT prompt actions, prompt engineering for Power Platform, Power Automate and Canvas App integration, token management
- **[Predictions](predictions.md)** -- Prediction models, category classification, object detection, training data requirements, scheduling retraining, performance monitoring

---

## Licensing

| Capability | License Requirement |
|---|---|
| Prebuilt models (OCR, sentiment) | Included with Power Apps/Automate Premium |
| Custom models (document processing, prediction) | AI Builder add-on capacity (credits) |
| GPT prompts | AI Builder add-on capacity (credits) |
| Consumption | Credit-based -- different models consume different credits per call |

> **Tip:** Start with prebuilt models (no additional cost with Premium license) before investing in custom model training.

---

## Anti-Patterns

- Training document processing models with fewer than 5 sample documents (poor accuracy)
- Not testing models with documents that differ from training samples
- Using GPT prompts for deterministic logic (use expressions or business rules instead)
- Hardcoding model IDs in flows -- use environment variables for environment promotion
- Not monitoring AI Builder credit consumption (can exhaust capacity unexpectedly)
- Processing sensitive data through GPT prompts without reviewing data residency policies
- Using custom models when a prebuilt model already handles the document type
- No error handling around AI Builder actions in flows (models can fail on unexpected input)

---

## Related Skills

- `power-automate` -- AI Builder actions are most commonly used in cloud flows
- `canvas-apps` -- AI Builder components for in-app document processing and predictions
- `dataverse` -- Prediction models train on Dataverse table data; results stored in Dataverse
- `alm` -- AI Builder models are solution-aware and promote with managed solutions
- `copilot-studio` -- GPT prompts can be used as plugin actions in Copilot agents
- `azure-openai` -- When AI Builder GPT limits are insufficient, escalate to direct Azure OpenAI
