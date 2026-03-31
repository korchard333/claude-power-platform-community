# Accessibility Testing & Validation

## Automated Testing (Must Run in CI)
| Tool | What It Checks | Integration |
|---|---|---|
| `eslint-plugin-jsx-a11y` | JSX accessibility violations at lint time | ESLint config |
| `axe-core` / `@axe-core/playwright` | Runtime WCAG violations | Playwright E2E tests |
| Lighthouse CI | Accessibility score + performance | CI pipeline |

## Manual Testing Checklist
- [ ] Tab through entire page — logical order, no traps, visible focus
- [ ] Use screen reader (VoiceOver/NVDA) — all content announced, controls labeled
- [ ] Zoom to 200% — no content clipped, no horizontal scroll
- [ ] Test at 320px viewport — content reflows, no horizontal scroll
- [ ] Keyboard-only operation — every function accessible without mouse
- [ ] Color-only check — remove color, verify information still conveyed
- [ ] Reduced motion — enable "reduce motion" in OS, verify no motion sickness triggers
- [ ] Dark mode — all components readable, contrast ratios pass
- [ ] Error state testing — submit empty forms, trigger API errors, verify error messaging

## Playwright Accessibility Test Pattern
```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("page has no accessibility violations", async ({ page }) => {
  await page.goto("/contacts");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Common Accessibility Failures (Top 10)

| # | Failure | Impact | Fix |
|---|---|---|---|
| 1 | Missing alt text on images | Screen readers say "image" with no context | Add descriptive `alt`, or `alt=""` for decorative |
| 2 | Icon buttons without labels | Screen readers can't identify the button | Add `aria-label="Delete contact"` |
| 3 | Color-only error indication | Color blind users miss errors | Add icon + text alongside color |
| 4 | No visible focus indicator | Keyboard users can't see where they are | `:focus-visible` with high-contrast outline |
| 5 | Missing form labels | Screen readers don't announce field purpose | `<label htmlFor>` or `aria-label` |
| 6 | Auto-playing animations | Motion sickness, distraction | Respect `prefers-reduced-motion` |
| 7 | Click handlers on divs | Not keyboard accessible, no role | Use `<button>` or `<a>` instead |
| 8 | Missing heading hierarchy | Screen reader users can't navigate by structure | h1 → h2 → h3 (no skipping levels) |
| 9 | Dynamic content not announced | Screen readers miss updates | `aria-live` regions for status changes |
| 10 | Insufficient contrast | Text unreadable for low-vision users | 4.5:1 minimum, test with tools |
