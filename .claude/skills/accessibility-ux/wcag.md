# WCAG 2.2 AA Requirements (Mandatory)

Every Code App MUST meet WCAG 2.2 Level AA. These are the requirements most relevant to enterprise React applications:

## Perceivable
| Requirement | Standard | How to Meet |
|---|---|---|
| Color contrast (text) | 4.5:1 normal text, 3:1 large text (18px+ bold or 24px+) | Use design tokens, test with axe-core |
| Color contrast (UI) | 3:1 for interactive elements and meaningful graphics | Borders, icons, focus rings must meet contrast |
| Don't rely on color alone | Information conveyed by color must also use text/icons/patterns | Status badges: use icon + label, not just red/green |
| Text resizing | Content must be usable at 200% zoom | Use `rem`/`em` units, test at 200% browser zoom |
| Reflow | No horizontal scrolling at 320px viewport width | Responsive design, test at 320px |
| Text spacing | Content must remain readable with increased letter/word/line spacing | Don't use fixed-height containers that clip text |
| Non-text content | All images, icons, charts need text alternatives | `alt` on images, `aria-label` on icon buttons |

## Operable
| Requirement | Standard | How to Meet |
|---|---|---|
| Keyboard accessible | All functionality available via keyboard | Tab order, Enter/Space activation, arrow key navigation |
| No keyboard traps | Users can navigate away from any component | Focus trap only in modals (with Escape to close) |
| Skip links | Bypass repeated navigation blocks | Skip-to-main-content link as first focusable element |
| Focus visible | Visible focus indicator on all interactive elements | Minimum 2px outline, 3:1 contrast against background |
| Focus not obscured | Focused element not hidden behind sticky headers/footers | `scroll-margin-top` on anchored elements |
| Target size | Interactive targets minimum 24x24 CSS pixels | Buttons, links, checkboxes meet minimum size |
| Consistent navigation | Navigation appears in same order across pages | Shared layout component with consistent nav |

## Understandable
| Requirement | Standard | How to Meet |
|---|---|---|
| Error identification | Errors described in text, associated with the field | `aria-describedby` linking error message to input |
| Labels | Every form input has a visible label | `<label>` element or `aria-label` / `aria-labelledby` |
| Error prevention | Confirm destructive actions before execution | Confirmation dialog for delete/submit |
| Consistent identification | Same function = same label across the app | "Save" is always "Save", not sometimes "Submit" |
| Language | Page language declared | `<html lang="en">` |

## Robust
| Requirement | Standard | How to Meet |
|---|---|---|
| Valid HTML | Proper semantic markup | Use semantic elements (`<nav>`, `<main>`, `<aside>`, `<button>`) |
| Name, Role, Value | Custom controls expose correct ARIA semantics | Use Radix UI / Fluent UI primitives (built-in ARIA) |
| Status messages | Dynamic content changes announced to screen readers | `aria-live` regions for toasts, loading states, results |

---

## Minimum Contrast Ratios
| Element | Ratio | Example |
|---|---|---|
| Body text | 4.5:1 | Dark gray (#1f2937) on white |
| Large text (18px+ bold, 24px+) | 3:1 | |
| Interactive elements (borders, icons) | 3:1 | Button borders, form field borders |
| Focus indicator | 3:1 against adjacent colors | 2px solid ring with offset |
| Disabled elements | Exempt | But must still be perceivable as disabled |
