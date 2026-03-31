# React Accessibility Patterns

## Semantic HTML First (Before ARIA)
```tsx
// BAD — div soup with ARIA bolted on
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
  Save
</div>

// GOOD — semantic HTML, accessibility is free
<button onClick={handleClick}>Save</button>
```

**Rule:** If a native HTML element does what you need, use it. ARIA is a last resort, not a first choice.

## Focus Management
```tsx
// After navigation or content change, move focus to the new content
const headingRef = useRef<HTMLHeadingElement>(null);

useEffect(() => {
  headingRef.current?.focus();
}, [pageLoaded]);

return <h1 ref={headingRef} tabIndex={-1}>Page Title</h1>;
```

## Skip Link
```tsx
// First focusable element in the app — bypasses navigation
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:p-2 focus:rounded">
  Skip to main content
</a>

// Target
<main id="main-content" tabIndex={-1}>
  {/* page content */}
</main>
```

## Live Regions (Screen Reader Announcements)
```tsx
// Announce dynamic content changes
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}  {/* e.g., "3 results found", "Record saved", "Loading..." */}
</div>

// Use aria-live="assertive" only for critical alerts (errors, session expiry)
// Use aria-live="polite" for everything else (search results, status updates)
```

## Form Accessibility
```tsx
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    Email address <span aria-hidden="true" className="text-red-500">*</span>
    <span className="sr-only">(required)</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : "email-hint"}
    className={cn("input", errors.email && "border-red-500")}
  />
  <p id="email-hint" className="text-xs text-muted-foreground">
    We'll use this for account recovery
  </p>
  {errors.email && (
    <p id="email-error" role="alert" className="text-sm text-red-500">
      {errors.email}
    </p>
  )}
</div>
```

## Modal / Dialog Focus Trap
```tsx
// shadcn/ui Dialog and Radix UI handle this automatically
// If building custom: trap focus inside modal, return focus on close

// Radix UI / shadcn pattern (preferred — built-in a11y):
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    {/* Focus automatically trapped, Escape closes, focus returns to trigger */}
  </DialogContent>
</Dialog>
```

## Data Table Accessibility
```tsx
<table role="grid" aria-label="Contact list" aria-rowcount={totalRows}>
  <thead>
    <tr>
      <th scope="col" aria-sort={sortField === "name" ? sortDirection : "none"}>
        <button onClick={() => handleSort("name")}>
          Name
          {sortField === "name" && <SortIcon direction={sortDirection} />}
        </button>
      </th>
      <th scope="col">Email</th>
      <th scope="col">Actions</th>
    </tr>
  </thead>
  <tbody>
    {contacts.map((contact, index) => (
      <tr key={contact.id} aria-rowindex={index + 2}>
        <td>{contact.name}</td>
        <td>{contact.email}</td>
        <td>
          <Button variant="ghost" size="sm" aria-label={`Edit ${contact.name}`}>
            <PencilIcon aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" aria-label={`Delete ${contact.name}`}>
            <TrashIcon aria-hidden="true" />
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## Reduced Motion
```css
/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// In React — check preference before animating
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

---

## shadcn/ui + Radix Accessibility Notes

shadcn/ui components are built on Radix UI primitives which provide built-in accessibility:

| Component | Built-in A11y | You Must Add |
|---|---|---|
| Dialog | Focus trap, Escape close, focus return | `DialogTitle` + `DialogDescription` (required) |
| DropdownMenu | Arrow key navigation, typeahead | Descriptive `aria-label` on trigger |
| Select | Keyboard nav, ARIA combobox pattern | Label association |
| Tabs | Arrow keys between tabs, panel association | Nothing (fully handled) |
| Toast | Auto-dismiss, `aria-live` region | Error toasts: set to `assertive` |
| AlertDialog | Focus trap, requires explicit action | Clear action labels ("Delete" not "OK") |
| Tooltip | Show on focus + hover | `aria-describedby` linkage (automatic) |

**Rule:** Always prefer shadcn/ui or Radix components over custom implementations. They handle complex ARIA patterns that are easy to get wrong manually.
