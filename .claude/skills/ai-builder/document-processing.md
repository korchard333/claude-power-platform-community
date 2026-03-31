# Document Processing

AI Builder document processing is the most common AI Builder use case -- extracting structured data from unstructured documents (invoices, receipts, IDs, custom forms).

---

## Prebuilt vs Custom Models

| Type | Model | Training? | Notes |
|---|---|---|---|
| Invoices | **Prebuilt** | No | Extracts vendor, total, line items, dates, tax, PO number |
| Receipts | **Prebuilt** | No | Extracts merchant, total, items, date, payment method |
| ID documents | **Prebuilt** | No | Extracts name, DOB, ID number, address, expiry |
| Business cards | **Prebuilt** | No | Extracts name, company, phone, email, address |
| Custom documents | **Custom** | Yes | Any structured or semi-structured document |

> **Rule:** Always check if a prebuilt model handles your document type before building a custom model. Prebuilt models are included with Power Apps/Automate Premium (no AI Builder credits needed) and are continuously improved by Microsoft.

---

## Custom Model Training Workflow

### Step-by-Step

1. **Create model** -- AI Builder > Models > Document processing > New
2. **Define fields** -- name each field you want extracted (e.g., "InvoiceTotal", "VendorName", "LineItems")
3. **Upload sample documents** -- minimum 5, recommended 15-20 for production accuracy
4. **Tag fields** -- draw bounding boxes around each field on each sample
5. **Train** -- model learns field positions, patterns, and contextual clues
6. **Evaluate** -- review confidence scores per field on the test set
7. **Publish** -- makes the model available in flows and apps

### Training Best Practices

| Practice | Why |
|---|---|
| Use 15-20+ samples | 5 is the minimum; more samples = better accuracy on edge cases |
| Include document variations | Different layouts, handwriting styles, scan quality |
| Cover all field positions | If a field can appear in different locations, include samples of each |
| Use real production documents | Training with synthetic data produces unreliable results |
| Retrain after format changes | If the document layout changes, retrain with new samples |

### Field Types

| Type | Use For | Example |
|---|---|---|
| Single-line text | Short values | Invoice number, vendor name |
| Multi-line text | Paragraphs | Notes, descriptions |
| Number | Numeric values | Quantities, amounts |
| Date | Date values | Invoice date, due date |
| Checkbox | Yes/No fields | Approval checkboxes |
| Selection mark | Radio buttons | Selected options |
| Table | Repeating rows | Line items, product lists |

---

## Power Automate Integration

### Basic Flow: Process Documents from SharePoint

```
Trigger: When a file is created in a folder (SharePoint)
  |
  +-- Condition: File extension is PDF or image
  |     |
  |     +-- Yes:
  |           |
  |           +-- AI Builder: Process and save information from documents
  |           |     Model: "Invoice Processing" (prebuilt or custom)
  |           |     Document: triggerOutputs()?['body/{Content}']
  |           |
  |           +-- Condition: Confidence score >= 0.8
  |           |     |
  |           |     +-- Yes: Create Dataverse row with extracted fields
  |           |     |     - contoso_vendorname = prediction['VendorName'].value
  |           |     |     - contoso_invoicetotal = prediction['InvoiceTotal'].value
  |           |     |     - contoso_invoicedate = prediction['InvoiceDate'].value
  |           |     |     - contoso_confidence = prediction['VendorName'].confidence
  |           |     |
  |           |     +-- No: Route to human review queue
  |           |           - Create Dataverse row with status "Pending Review"
  |           |           - Send Teams notification to reviewer
```

### Accessing Extracted Data in Expressions

```
// Single field value
outputs('Process_document')?['body/responsev2/predictionOutput/VendorName/value']

// Single field confidence
outputs('Process_document')?['body/responsev2/predictionOutput/VendorName/confidence']

// Table (line items) -- iterate with Apply to Each
outputs('Process_document')?['body/responsev2/predictionOutput/LineItems/value']

// Individual line item fields (inside Apply to Each)
items('Apply_to_each')?['Description/value']
items('Apply_to_each')?['Amount/value']
items('Apply_to_each')?['Quantity/value']
```

---

## Batch Processing Pattern

For processing large volumes of documents (e.g., monthly invoice runs):

```
Trigger: Recurrence (monthly) or Manual
  |
  +-- List files in SharePoint folder ("Unprocessed Invoices")
  |
  +-- Apply to Each (concurrency: 5)
  |     |
  |     +-- Get file content
  |     +-- AI Builder: Process document
  |     +-- Condition: Confidence >= threshold
  |     |     +-- Yes: Create/update Dataverse record
  |     |     +-- No: Add to review queue
  |     +-- Move file to "Processed" folder
  |
  +-- Send summary email: X processed, Y sent to review
```

**Throttling considerations:**
- AI Builder has per-environment rate limits (varies by license tier)
- Set Apply to Each concurrency to 5 or lower to avoid throttling
- Add retry policy on the AI Builder action (exponential backoff)
- For very large batches (1000+ documents), use a queue pattern with multiple flow runs

---

## Confidence Thresholds

Every extracted field has a confidence score (0.0 to 1.0). Use thresholds to route decisions:

| Confidence Range | Action | Rationale |
|---|---|---|
| >= 0.9 | Auto-accept | High confidence -- process automatically |
| 0.7 - 0.89 | Auto-accept with flag | Likely correct but worth periodic spot-check |
| 0.5 - 0.69 | Route to human review | Too uncertain for automation |
| < 0.5 | Reject / re-scan | Model cannot extract reliably |

**Set thresholds per field, not globally.** A vendor name may be highly reliable (0.9 threshold) while a handwritten notes field may need lower tolerance (0.6 threshold).

---

## Human Review Loop Pattern

For documents that fall below confidence thresholds:

1. **Store in review queue** -- Dataverse table with columns: document link, extracted values, confidence scores, status (Pending/Approved/Rejected), reviewer
2. **Notify reviewer** -- Teams adaptive card or Canvas App showing the document alongside extracted values
3. **Reviewer corrects** -- Fixes incorrect fields, approves the record
4. **Feed corrections back** -- Use corrected data as additional training samples (retrain quarterly)

This creates a feedback loop that improves model accuracy over time.

---

## Canvas App Integration

```
// Process uploaded document
Set(varResult, AzureAIDocumentProcessingModel.Process(UploadedFile.Content))

// Access extracted fields
varResult.InvoiceTotal
varResult.VendorName
varResult.InvoiceDate

// Display confidence to user
If(varResult.VendorName.Confidence >= 0.8,
    "Vendor: " & varResult.VendorName.Value,
    "Low confidence -- please verify vendor name"
)

// Prebuilt text recognition (OCR)
Set(varOCR, TextRecognition.Recognize(Camera1.Photo))
varOCR.Text
```

---

## Anti-Patterns

- **Training with fewer than 5 samples** -- Model accuracy will be unreliable. Use 15-20 for production.
- **No confidence threshold** -- Accepting all extractions without checking confidence leads to bad data.
- **No human review loop** -- Low-confidence extractions need human verification.
- **Not retraining after document format changes** -- Model performance degrades when layouts change.
- **Processing documents synchronously in Canvas Apps** -- Document processing can take 10-30 seconds. Show a loading indicator and use async patterns.
- **Ignoring line item table extraction** -- Table fields require special handling (Apply to Each in flows, ForAll in Canvas Apps).
- **Hardcoding model IDs** -- Use environment variables so models promote correctly across environments.
