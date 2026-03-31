# Prediction Models

AI Builder prediction models use historical data in Dataverse to predict outcomes -- category classification, sentiment detection, and binary/multi-class predictions.

---

## Prediction Model Types

| Type | Input | Output | Example |
|---|---|---|---|
| **Binary prediction** | Historical records with yes/no outcome | Probability score (0-1) | Will this lead convert? |
| **Multi-class prediction** | Historical records with category labels | Category + confidence | Which support tier should handle this ticket? |
| **Category classification** | Text input + trained categories | Category + confidence | Classify product reviews into themes |
| **Object detection** | Images + labeled objects | Bounding boxes + labels | Count items on a warehouse shelf |

---

## Training Data Requirements

### Minimum Requirements

| Model Type | Min Records | Recommended Records | Notes |
|---|---|---|---|
| Binary prediction | 50 | 1,000+ | Need balanced classes (not 99% yes / 1% no) |
| Multi-class prediction | 10 per category | 100+ per category | Each category needs representative samples |
| Category classification | 10 per category | 50+ per category | Text samples with clear category labels |
| Object detection | 15 images per object | 50+ per object | Include varied angles, lighting, backgrounds |

### Data Quality Checklist

- [ ] **No missing values** in the outcome column (prediction target)
- [ ] **Balanced classes** -- if one class is >90% of records, the model will be biased
- [ ] **Clean data** -- remove duplicates, fix inconsistent labels (e.g., "High" vs "high" vs "HIGH")
- [ ] **Sufficient history** -- at least 6 months of data for time-sensitive predictions
- [ ] **No data leakage** -- input columns should not contain the answer (e.g., don't include "resolution" when predicting "will this case be resolved?")
- [ ] **Representative sample** -- training data should reflect the distribution of real-world data

### Handling Imbalanced Data

If your outcome classes are heavily imbalanced:
1. **Oversample the minority class** -- duplicate minority records in the training set
2. **Undersample the majority class** -- remove majority records to balance
3. **Collect more data** -- best approach if feasible
4. **Adjust the decision threshold** -- instead of 0.5, use a lower threshold for the minority class

---

## Building a Prediction Model

### Step-by-Step

```
1. AI Builder > Models > Prediction > New
2. Select the Dataverse table containing historical data
3. Choose the outcome column (what you want to predict)
4. Select input columns (features the model uses to predict)
5. Review data quality report -- fix issues if flagged
6. Train the model (can take minutes to hours depending on data size)
7. Review performance metrics
8. Publish to make available in flows and apps
```

### Choosing Input Columns

**Good input columns:**
- Attributes that correlate with the outcome (e.g., lead source, company size for lead conversion)
- Categorical fields with reasonable cardinality (5-50 categories)
- Numeric fields with meaningful range (e.g., deal amount, days since last activity)

**Bad input columns:**
- Unique identifiers (GUIDs, auto-numbers) -- no predictive value
- Free-text fields with high cardinality -- use AI Builder text classification instead
- Columns derived from the outcome -- creates data leakage
- Columns with >50% missing values -- insufficient signal

---

## Model Performance Metrics

After training, AI Builder reports performance metrics:

| Metric | What It Means | Good Threshold |
|---|---|---|
| **Accuracy** | % of correct predictions overall | > 80% |
| **Precision** | Of predicted positives, % that are actually positive | > 75% |
| **Recall** | Of actual positives, % that were predicted correctly | > 75% |
| **F1 Score** | Harmonic mean of precision and recall | > 0.75 |

> **Accuracy alone is misleading.** A model predicting "no" for everything in a 95% negative dataset has 95% accuracy but 0% recall. Always check precision AND recall.

### When Performance Is Poor

1. **Add more training data** -- especially for underrepresented classes
2. **Add more input columns** -- features with stronger correlation to the outcome
3. **Remove noisy columns** -- columns that add noise without predictive value
4. **Clean the data** -- fix inconsistent labels, remove outliers
5. **Check for data leakage** -- ensure no input column reveals the answer

---

## Scheduling Retraining

Prediction models degrade over time as patterns in real-world data shift (concept drift). Schedule periodic retraining:

| Scenario | Retraining Frequency | Trigger |
|---|---|---|
| Stable data patterns | Quarterly | Calendar-based |
| Fast-changing patterns | Monthly | Calendar-based |
| After data model changes | Immediately | Schema change to training table |
| Performance degradation detected | Immediately | Monitoring alert |

### Monitoring Model Performance

Set up a monthly review process:
1. Compare predicted vs actual outcomes for the past month
2. Calculate accuracy, precision, recall on recent data
3. If metrics drop >10% from training performance, retrain
4. Log metrics in a Dataverse table for trend tracking

---

## Power Automate Integration

### Predict Action

```
Trigger: When a Dataverse row is created (contoso_lead table)
  |
  +-- AI Builder: Predict
  |     Model: "Lead Conversion Prediction"
  |     Input: triggerOutputs()?['body']
  |
  +-- Condition: Prediction score >= 0.7
  |     +-- Yes: Update lead -- contoso_priority = "High"
  |     |         Send Teams notification to sales manager
  |     +-- No: Update lead -- contoso_priority = "Standard"
```

### Accessing Prediction Results

```
// Prediction score (probability)
outputs('Predict')?['body/responsev2/predictionOutput/score']

// Predicted label (for multi-class)
outputs('Predict')?['body/responsev2/predictionOutput/predictedLabel']

// Top influencing factors
outputs('Predict')?['body/responsev2/predictionOutput/explanations']
```

---

## Object Detection

### Training Workflow

1. **Upload images** -- minimum 15 per object type, recommended 50+
2. **Tag objects** -- draw bounding boxes around each instance of the object
3. **Train** -- model learns to identify and locate tagged objects
4. **Test** -- verify detection accuracy on unseen images
5. **Publish** -- use in flows and apps

### Use Cases

| Scenario | Objects to Detect | Integration |
|---|---|---|
| Inventory counting | Products on shelves | Canvas App with camera + flow to update stock levels |
| Safety compliance | Hard hats, safety vests | Power Automate processing surveillance camera captures |
| Quality inspection | Defects, damage | Canvas App for field technicians |

### Canvas App Integration

```
// Capture and detect
Set(varDetection, ObjectDetection.Detect(Camera1.Photo))

// Display results
Gallery1.Items = varDetection.Results
// Each item has: Label, Confidence, BoundingBox (top, left, width, height)
```

---

## Anti-Patterns

- **Training with fewer than 50 records** -- Model will overfit and perform poorly on new data
- **Ignoring class imbalance** -- A 95/5 split produces a model that always predicts the majority class
- **Not monitoring after deployment** -- Models degrade over time without retraining
- **Using prediction for deterministic rules** -- If "all orders > $10,000 need approval", use a business rule, not a prediction model
- **No human oversight** -- Prediction models inform decisions, they don't make them. Always present predictions as recommendations, not facts.
- **Retraining without validating data quality** -- Garbage in, garbage out. Check data quality before every retrain.
- **Not logging prediction outcomes** -- Without outcome tracking, you can't measure real-world accuracy or know when to retrain.
