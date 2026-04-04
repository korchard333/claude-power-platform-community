---
name: accessibility-ux
description: "WCAG 2.2 AA compliance, accessibility patterns, UX design for Power Platform. Use when: building accessible components, reviewing WCAG compliance, designing loading/empty/error states, responsive design, form accessibility, keyboard navigation, screen reader support, color contrast, focus management."
---

# Skill: Accessibility & UX/UI Design

## When to Use
Trigger when designing UI layouts, building components, reviewing user experience, or ensuring WCAG compliance in Code Apps, Canvas Apps, or PCF controls.

---

## ⚠️ REQUIRED: Load Sub-Files Before Implementation

**SKILL.md is a summary only — it is NOT sufficient for implementation.**

The detailed content (complete payloads, XML templates, working examples, edge-case handling) lives in sub-files in the **same directory** as this SKILL.md. Before writing any code, you MUST use `read_file` on the sub-files relevant to your task:
- [WCAG 2.2 AA Requirements](wcag.md) — perceivable, operable, understandable, robust criteria with implementation guidance; contrast ratios
- [React Accessibility Patterns](react-patterns.md) — semantic HTML, focus management, skip links, live regions, form a11y, dialogs, data tables, reduced motion; shadcn/ui + Radix notes
- [UX Patterns](ux-patterns.md) — loading/empty/error states, form design, navigation, toasts; typography, spacing, and dark mode design tokens
- [Visual Design Patterns](visual-design.md) — page composition recipes (dashboard, list, detail, form), visual hierarchy, spacing rhythm, color usage (60-30-10 rule), surface elevation, typography rules, border/divider guidance, interactive states, common visual mistakes
- [Component Recipes](component-recipes.md) — component-level styling specifications (KPI cards, data cards, form fields, table headers/rows, badges, dialogs, navigation items, page headers, empty states, skeletons, toasts, toolbars) with exact token values, states, and makeStyles examples
- [Responsive Design](responsive.md) — breakpoints, enterprise app responsive patterns (mobile / tablet / desktop)
- [Accessibility Testing](a11y-testing.md) — automated testing (axe-core, eslint-plugin-jsx-a11y, Lighthouse), manual checklist, Playwright pattern, top 10 failures

> For Fluent UI V9 component accessibility (built-in ARIA, focus management via Tabster, high-contrast theme support), see [code-apps/fluent-ui.md](../code-apps/fluent-ui.md).

---

## Anti-Patterns

- Using `<div>` or `<span>` as interactive elements (buttons, links) — not keyboard accessible, not announced by screen readers. Use semantic `<button>` and `<a>` elements instead.
- Adding `role="button"` to a `<div>` instead of using `<button>` — you then need to manually handle Enter, Space, focus, and disabled states. Native elements get these for free.
- Color as the only indicator of state (error = red, success = green) — invisible to colorblind users. Always pair color with icons, text, or patterns. **All color-coded states must have a visible legend.** Users will guess meanings based on common conventions (yellow = warning/draft, red = error). If your color means something domain-specific (e.g., yellow = non-billable), make it explicit with a legend or label — don't rely on color alone.
- Missing skip-to-main-content link — keyboard users must tab through the entire navigation on every page. Add a visually-hidden skip link as the first focusable element.
- Placeholder text as the only label — disappears on input, not reliably announced by screen readers. Always use a visible `<label>` element.
- Auto-playing animations without respecting `prefers-reduced-motion` — causes motion sickness for vestibular disorder users. Wrap all animations in a media query check.
- Generic link text ("Click here", "Read more") — meaningless out of context for screen reader users who navigate by links. Use descriptive text: "View project details".
- Missing `aria-live` regions for dynamic content — screen readers miss toast notifications, status updates, and inline validation messages. Use `aria-live="polite"` for status, `aria-live="assertive"` for errors.

---

## Related Skills

- `code-apps` — Accessibility patterns in Code Apps (React components, shadcn/ui)
- `canvas-apps` — Accessible Canvas App design
- `pcf` — PCF control accessibility requirements
- `testing` — Accessibility testing with axe-core and Playwright
