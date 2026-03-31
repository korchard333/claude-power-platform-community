# UX Patterns for Enterprise Data Apps

## Loading States
```
SKELETON LOADING (preferred for known layouts):
  ┌─────────────────────────────┐
  │ ████████████  ██████        │  ← Name + status skeleton
  │ ████████████████████████    │  ← Description skeleton
  │ ██████████  ████████        │  ← Metadata skeleton
  └─────────────────────────────┘

SPINNER (for unknown layouts or short waits):
  Only use for actions < 3 seconds
  Show spinner inline near the trigger, not full-page overlay

PROGRESS BAR (for long operations):
  Use for operations > 3 seconds with known progress
  Show percentage or step count ("Step 2 of 5")
```

**Rules:**
- Never show a blank screen while loading — always show skeleton or spinner
- Show skeleton for initial page loads (user knows the shape of the content)
- Show inline spinner for button actions (save, delete, submit)
- Add `aria-busy="true"` to the loading region
- Announce loading state to screen readers via `aria-live`

## Empty States
```
┌─────────────────────────────────┐
│                                 │
│         [Illustration]          │
│                                 │
│     No contacts found           │  ← Clear heading
│                                 │
│  You haven't added any contacts │  ← Helpful explanation
│  yet. Create your first one to  │
│  get started.                   │
│                                 │
│     [ + Add Contact ]           │  ← Primary action
│                                 │
└─────────────────────────────────┘
```

**Rules:**
- Never show an empty table with just column headers — show an empty state
- Explain WHY it's empty (no data yet vs filtered to nothing vs error)
- Provide the primary action to resolve the empty state
- If filtered to nothing: "No results match your filters. [Clear filters]"

## Error States
```
FIELD-LEVEL ERROR:
  Email address *
  ┌────────────────────────────┐
  │ not-an-email               │  ← Red border
  └────────────────────────────┘
  ⚠ Please enter a valid email address  ← Specific, actionable message

FORM-LEVEL ERROR (summary at top):
  ┌─ ⚠ Please fix 3 errors ───────────┐
  │  • Email address is required       │  ← Links to the field
  │  • Phone number format is invalid  │
  │  • Due date must be in the future  │
  └────────────────────────────────────┘

PAGE-LEVEL ERROR:
  ┌────────────────────────────────────┐
  │  Something went wrong              │
  │                                    │
  │  We couldn't load your contacts.   │  ← What happened
  │  This might be a temporary issue.  │  ← Why
  │                                    │
  │  [ Try Again ]  [ Contact Support ]│  ← What to do
  └────────────────────────────────────┘
```

**Rules:**
- Errors must be specific: "Email is required" not "Field is required"
- Errors must be actionable: tell the user what to DO, not just what's wrong
- Field errors must be visually AND programmatically associated with the field (`aria-describedby`)
- Form error summaries appear at the top and link/scroll to the offending fields
- Never use only color to indicate errors — use icon + text + border

## Form Design
```
LAYOUT:
- Single column forms (not multi-column — reduces cognitive load)
- Group related fields with <fieldset> and <legend>
- Place labels above inputs (not beside — better scan pattern)
- Required fields: mark with * AND add "(required)" for screen readers
- Optional fields: mark with "(optional)" label suffix

INPUTS:
- Minimum input height: 44px (touch target)
- Clear placeholder vs label distinction (placeholder is NOT a label)
- Show character count for limited text fields
- Use appropriate input types: email, tel, url, number, date

ACTIONS:
- Primary action on the right (or full-width on mobile)
- Destructive actions visually distinct (red / outlined, not primary)
- Disable submit button during submission (with loading spinner)
- Always provide Cancel / Back option
```

## Navigation
```
SIDEBAR NAVIGATION (desktop):
  ┌──────────┬────────────────────────┐
  │ Logo     │  Page Title            │
  │          │                        │
  │ ● Home   │  Content area          │
  │ ○ Orders │                        │
  │ ○ Contacts│                       │
  │ ○ Reports │                       │
  │          │                        │
  │ ─────── │                        │
  │ ○ Settings│                       │
  └──────────┴────────────────────────┘

RULES:
- Current page visually highlighted AND aria-current="page"
- Keyboard: arrow keys between nav items, Enter to activate
- Collapsible sidebar for more content space
- Breadcrumbs for >2 levels of hierarchy
- <nav aria-label="Main navigation"> wrapper
```

## Toast / Notification UX
```
PLACEMENT: Top-right (desktop), top-center (mobile)
DURATION: 5 seconds for info/success, persistent for errors
STACKING: Max 3 visible, queue the rest

TYPES:
  ✓ Success — "Contact saved successfully"       (5s auto-dismiss)
  ℹ Info    — "3 new records imported"            (5s auto-dismiss)
  ⚠ Warning — "You have unsaved changes"         (persistent until action)
  ✕ Error   — "Failed to save. Try again."        (persistent, with retry action)

RULES:
- Toasts must be in an aria-live="polite" region
- Error toasts must be aria-live="assertive"
- Always provide a close button (even on auto-dismiss)
- Never use toasts for critical errors that need action — use inline alerts
```

---

## Color & Design Tokens

### Typography Scale
```css
--font-size-xs:   0.75rem;   /* 12px — captions, metadata */
--font-size-sm:   0.875rem;  /* 14px — secondary text, table cells */
--font-size-base: 1rem;      /* 16px — body text (NEVER smaller for body) */
--font-size-lg:   1.125rem;  /* 18px — subheadings */
--font-size-xl:   1.25rem;   /* 20px — section headings */
--font-size-2xl:  1.5rem;    /* 24px — page headings */
--font-size-3xl:  1.875rem;  /* 30px — hero headings */

/* Line height: 1.5 for body text, 1.2-1.3 for headings */
/* Max line length: 65-75 characters for readability */
```

### Spacing Scale
```css
--spacing-1:  0.25rem;  /* 4px */
--spacing-2:  0.5rem;   /* 8px */
--spacing-3:  0.75rem;  /* 12px */
--spacing-4:  1rem;     /* 16px */
--spacing-6:  1.5rem;   /* 24px */
--spacing-8:  2rem;     /* 32px */
--spacing-12: 3rem;     /* 48px */

/* Consistent spacing: use the scale, don't invent arbitrary values */
```

### Dark Mode
```tsx
// ThemeProvider with system detection
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

// Rules:
// - Never hardcode colors — use CSS variables / Tailwind classes
// - Test ALL components in both light and dark mode
// - Contrast ratios must pass in BOTH modes
// - Use semantic color names: bg-background, text-foreground (not bg-white, text-black)
```
