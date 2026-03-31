# Prompt: Component-Level Design Recipes for Fluent UI V9

---

## Phase 0: Audit Existing Work (DO THIS FIRST)

Before building anything new, audit the UI/UX files created in the previous session. They were written at the end of a long context window and may have quality issues.

**Read these files in full and verify:**

1. **`skills/code-apps/fluent-ui.md`** (~705 lines)
   - Are all Fluent UI V9 token names correct? (Check against `@fluentui/react-components` exports)
   - Are the makeStyles code examples syntactically correct and following Griffel best practices?
   - Is the FluentProvider setup pattern correct for Code Apps?
   - Is the BrandVariants example realistic (16 stops, correct key range 10-160)?
   - Is the dark/light mode ThemeContext pattern production-quality?
   - Are the component patterns (AppShell, Form, DataGrid, Dialog) correct and complete?
   - Is anything factually wrong, outdated, or misleading?

2. **`skills/accessibility-ux/visual-design.md`** (~349 lines)
   - Are the Fluent 2 design principles accurately stated?
   - Is the spacing scale correct (token names → pixel values)?
   - Is the typography ramp accurate (Fluent 2 web type ramp)?
   - Are the elevation/shadow mappings correct (shadow2→shadow64)?
   - Are the page recipes (dashboard, list, detail, form) well-structured and actionable?
   - Is the research attribution accurate (CXL form study, F-pattern scanning)?

3. **Cross-references**: Do the links between fluent-ui.md, visual-design.md, SKILL.md files, and ORCHESTRATION.md all work correctly?

**If you find errors, fix them before proceeding.** Document what you fixed and why.

Then proceed to the research and building phases below.

---

## Context

You are working in a Power Platform skills repository. It contains 33 skills that guide AI agents building Power Platform solutions. The UI/UX capability has been built out in three layers:

1. **`skills/code-apps/fluent-ui.md`** (705 lines) — Technical foundation: FluentProvider setup, theme customization, BrandVariants, dark/light mode, design tokens reference, makeStyles patterns, component API quick reference. This tells agents HOW to use Fluent UI V9 components.

2. **`skills/accessibility-ux/visual-design.md`** (349 lines) — Page-level composition: Fluent 2 design principles, 4px grid, spacing rhythm, color 60-30-10 rule, surface elevation, page recipes (dashboard, list, detail, form), typography, motion, navigation patterns. This tells agents HOW TO LAYOUT pages.

3. **`skills/accessibility-ux/ux-patterns.md`** (191 lines) — UX states: loading/empty/error patterns, form UX, navigation UX, toast notifications. This tells agents WHAT STATES to handle.

### The Gap (What You Need to Build)

We have page-level recipes but NO component-level recipes. An agent knows WHERE to put a KPI card on a dashboard, but not EXACTLY HOW TO STYLE one — what padding, shadow, corner radius, spacing between number and label, hover behavior, etc.

An audit identified these specific missing component recipes:

| Component | What's Missing |
|---|---|
| **KPI / Metric Card** | Inner padding, number sizing, label styling, delta indicator, border vs shadow, hover state |
| **Data Card (content card)** | Image ratio, header/body/footer sections, action button placement, padding |
| **Form Field** | Input height, border styling, error state (border color + message position), disabled state, help text, focus ring, placeholder |
| **Table Header** | Background color, font weight, sticky behavior, sort indicator styling, border |
| **Table Row States** | Hover background, selected background, expanded row, action menu trigger |
| **Badge / Status Indicator** | Sizing, padding, filled vs outline vs ghost, icon+text combination |
| **Dialog / Modal** | Width ranges (small/medium/large), max-height, button spacing, scrollable content, backdrop |
| **Navigation Item** | Active state, hover state, icon+text spacing, indent for sub-items, collapse rail state |
| **Page Header** | Title + breadcrumb + actions layout, bottom border, responsive behavior |
| **Empty State** | Container sizing, illustration size, text hierarchy, action button |
| **Skeleton / Loading** | Pulse animation, shape matching, which components use skeleton vs spinner |
| **Toast / Notification** | Width, padding, icon+text spacing, dismiss button, stacking |
| **Toolbar / Action Bar** | Button spacing, divider placement, overflow behavior, responsive collapse |

## Your Task

Create `skills/accessibility-ux/component-recipes.md` — a concrete, token-specific component recipe book.

### Requirements

1. **Deep research first.** Before writing anything:
   - Read the existing files: `skills/code-apps/fluent-ui.md`, `skills/accessibility-ux/visual-design.md`, `skills/accessibility-ux/ux-patterns.md`
   - Fetch https://skills.sh/ — search for existing skills related to Fluent UI, React components, UI design systems, component patterns. Download and read any relevant skills that could inform this work.
   - Research Fluent UI V9 Storybook: https://react.fluentui.dev/ — look at actual component styling defaults (padding, sizing, states)
   - Fetch https://fluent2.microsoft.design/ — look for component-specific design guidance
   - Search Microsoft Learn for Fluent UI component best practices
   - Search for "enterprise UI component patterns" and "design system component specifications"
   - Look at how Atlassian, Salesforce Lightning, and Carbon document component specs

2. **Every recipe must include exact token values.** Not "use appropriate padding" — instead: `padding: tokens.spacingVerticalM tokens.spacingHorizontalL` (12px 16px). The agent must be able to produce the exact styling without guessing.

3. **Every recipe must include all states.** Rest, hover, pressed, focused, disabled, error (where applicable). With exact token names for each state.

4. **Each recipe should show a makeStyles example** — actual Fluent V9 code that produces the described styling.

5. **Target: 400-600 lines.** Match the quality bar of `skills/code-apps/fluent-ui.md`.

6. **After creating the file**, update:
   - `skills/accessibility-ux/SKILL.md` — add component-recipes.md to the Topics list
   - `ORCHESTRATION.md` — add `component-recipes` to the Accessibility & UX sub-files list

### File Conventions

- No frontmatter (sub-files don't use it)
- Start with `# Title`
- Use `---` between major sections
- Use tables for specifications
- Use code blocks for makeStyles examples
- Use the consistent callout pattern for any preview features: `> **Preview (Wave 1 2026):**`

### How to Verify

1. Read the file back and check every token name is a real `@fluentui/react-components` v9.46+ export
2. Check that makeStyles examples use correct syntax (shorthands helper for CSS shorthands, mergeClasses for conditional)
3. Confirm no overlap with existing content in fluent-ui.md or visual-design.md
4. Line count should be 400-600 lines
