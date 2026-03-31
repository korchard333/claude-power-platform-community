# Code Apps — Three-Layer Architecture Sample

This directory contains a minimal but complete reference implementation of the **three-layer architecture** for Power Apps Code Apps (React + TypeScript + Vite).

## The Three Layers

```
Layer 1: Presentation (components/)  — Props in, callbacks out. ZERO service imports.
Layer 2: Business Logic (hooks/)     — TanStack Query + Zustand. ONLY layer calling services.
Layer 3: Data Access (generated/)    — PAC CLI auto-generated. NEVER manually edit.
```

## Files

| File | Layer | Purpose |
|---|---|---|
| `types/contact.types.ts` | Shared | TypeScript interfaces for the Contact entity |
| `hooks/useContacts.ts` | Layer 2 | TanStack Query hook wrapping generated service |
| `components/ContactList.tsx` | Layer 1 | Presentation component — renders data via props |

## The `generated/` Layer

The `generated/` layer is auto-created by `pac code add-data-source`. **Never manually create or edit files in this layer.** The generated services handle authentication and connector wiring automatically — your hooks call them, your components never import them.

## How to Use This Sample

These files are **reference patterns**, not a runnable app. When building a Code App feature:

1. Define your types in `types/`
2. Create a hook in `hooks/` that wraps the generated service with TanStack Query
3. Create a presentation component in `components/` that receives data via props
4. Compose them in a page component (`pages/`)
