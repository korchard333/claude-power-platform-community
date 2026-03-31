# Dataverse — Relationships

## Relationship Patterns

### N:1 (Most Common)
```
Order → Account (many orders belong to one account)
Column: contoso_accountid (Lookup to Account)
Cascade: Referential (default) — prevents orphans, no cascade delete
```

### 1:N with Parental Cascade
```
Project → ProjectTask (child records deleted/reassigned with parent)
Cascade: Delete = Cascade, Assign = Cascade
WARNING: Avoid cascade delete on tables with >10,000 child records — use async deletion instead
```

### N:N (Native — No Attributes on Relationship)
```
Contact ↔ Account (via system intersect table)
Access via: Relate() / Unrelate() in Power Fx
Use when: the relationship itself has no data (no "role", "start date", etc.)
```

### N:N via Manual Intersect Table (Relationship Has Attributes)
```
Contact (1) ── (N) ContactRole (N) ── (1) Project
ContactRole has: Role (Choice), StartDate, EndDate
Use when: you need attributes on the relationship itself
```
