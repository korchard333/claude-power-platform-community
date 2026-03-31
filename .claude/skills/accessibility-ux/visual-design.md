# Visual Design Patterns for Enterprise Apps

How to make pages look polished and professional — not just technically correct. Grounded in Microsoft's Fluent 2 design language and enterprise UX research. Principles are framework-agnostic; examples use Fluent UI V9 tokens.

**Source:** [fluent2.microsoft.design](https://fluent2.microsoft.design), Microsoft Teams UI Templates, CXL/Baymard form research, Pencil & Paper enterprise UX analysis.

---

## Fluent 2 Design Principles

Every design decision should trace back to one of these four official principles:

| Principle | What It Means in Practice |
|---|---|
| **Natural on Every Platform** | Adapt layout to screen size. Use platform-native fonts. Reuse familiar interaction patterns. |
| **Built for Focus** | Reduce visual clutter. Draw users forward to the next action. Technology disappears. |
| **One for All, All for One** | Design for diverse abilities and perspectives from the start, not as an afterthought. |
| **Unmistakably Microsoft** | Calming neutrals, rounded geometry, layered depth, purposeful motion. |

The signature Fluent visual identity comes from: **calming neutral surfaces** with color used sparingly for emphasis, **4px grid alignment** everywhere, **layered depth** via shadows and materials, **rounded geometry** (4px default radius), and **semantic tokens for everything**.

---

## The 4px Grid

Everything in Fluent 2 aligns to a **4-pixel base grid**. Spacing, sizing, border radius, and icon dimensions are all multiples of 4. Values 2, 6, and 10 exist to accommodate icon padding while maintaining grid alignment.

This is the single most important rule for visual consistency. If your spacing feels "off," check whether your values align to the 4px grid.

---

## Visual Hierarchy

Users scan enterprise apps in an **F-pattern**: across the top, then down the left side. Design with this:

```
1. PAGE TITLE        — Largest text, top-left. User instantly knows where they are.
2. PRIMARY ACTION    — Prominent button, top-right or near title. Brand color.
3. KEY METRIC / HERO — The single most important data point. Large number, sparse surroundings.
4. SUPPORTING DATA   — Cards, tables, charts, arranged by importance.
5. SECONDARY ACTIONS — Subtle buttons, links, filters. Visually receded.
```

**Rules:**
- If everything is bold, nothing is bold. Use exactly **3 levels of visual weight**: heading (`fontWeightSemibold`), body (`fontWeightRegular`), and caption (`colorNeutralForeground3`).
- Primary text: `colorNeutralForeground1`. Secondary: `colorNeutralForeground2`. Tertiary/caption: `colorNeutralForeground3`.
- One primary action per view. Everything else is secondary or overflow.

---

## Spacing — The Biggest Lever

The single biggest difference between amateur and professional UI is **whitespace**. Fluent 2 philosophy: spacing communicates relationships — close items are related, distant items are separate. Use spacing to create logical sections instead of borders.

### Spacing Scale (4px Base)

| Zone | Fluent Token | Value | When to Use |
|---|---|---|---|
| Tightest | `spacingHorizontalXXS` | 2px | Icon padding adjustments |
| Tight | `spacingHorizontalXS` | 4px | Icon-to-text gaps |
| Compact | `spacingHorizontalS` | 8px | Related items within a component |
| Default | `spacingHorizontalM` | 12px | Between form fields, list items, card content lines |
| Comfortable | `spacingHorizontalL` | 16px | Card inner padding, section spacing |
| Generous | `spacingHorizontalXL` | 20px | Between card groups, form sections |
| Roomy | `spacingHorizontalXXL` | 24px | Page padding, between major page regions |

### Spacing Rules

- **Proximity = relationship.** A section heading must be closer to its content than to the previous section's content. If the gap is equal, users can't tell which content belongs to which heading.
- **More space = more importance.** Key metrics surrounded by whitespace draw the eye. Dense data grids feel utilitarian.
- **Consistent card padding.** Every card on a page gets the same inner padding — `spacingHorizontalL` (16px) for compact layouts, `spacingHorizontalXL` (20px) for comfortable.
- **Max content width:** 1200-1400px on wide screens. Use `max-width` with `margin: 0 auto`. Reading full-width text on a 2560px monitor is painful.
- **Left-align by default.** Center only hero sections and empty states.

---

## Color — The 60-30-10 Rule

Fluent 2 philosophy: color expresses style and communicates meaning, but **neutral palettes ground the interface**. Brand color is for actions and emphasis, not decoration.

| Proportion | Role | Fluent Tokens | What It Covers |
|---|---|---|---|
| **60%** | Neutral surface | `colorNeutralBackground1` / `Background2` | Page background, card surfaces, table rows |
| **30%** | Secondary | `colorNeutralBackground3`, `colorNeutralStroke1` | Sidebars, headers, borders, hover states |
| **10%** | Brand accent | `colorBrandBackground`, `colorBrandForeground1` | Primary buttons, active nav items, key indicators |

### Color Rules

- **Brand color is for actions and emphasis only.** A brand-colored header bar is fine. Brand-colored body text everywhere is not.
- **Status colors are semantic, not decorative.** Red = danger. Amber = warning. Green = success. Blue = informational. Never repurpose these.
- **Interaction states darken progressively.** Rest (lightest) → Hover (darker) → Selected (darkest). Focus states use thicker strokes, not color changes.
- **Never use color as the sole indicator.** Always pair with icons, text, or patterns (accessibility).
- **Dark mode test:** Hardcoded colors break in dark mode. Always use tokens.

---

## Surface Elevation and Depth

Fluent 2 creates depth with **layered shadows** (ambient + directional). Each shadow level has a key shadow (sharp, defines edges) and an ambient shadow (soft, implies distance).

| Level | Shadow Token | Use Cases |
|---|---|---|
| **Flat** | None | Page background, inline content |
| **Subtle** | `shadow2` | Cards without visible edges |
| **Default** | `shadow4` | Cards, grid items, list items |
| **Raised** | `shadow8` | Command bars, tooltips, FABs |
| **Elevated** | `shadow16` | Hover cards, callouts |
| **High** | `shadow28` | Side navigation panels, bottom sheets |
| **Overlay** | `shadow64` | Dialogs, modal panels |

### Elevation Rules

- Cards on a page should all be the **same elevation**. Don't mix shadow levels for adjacent cards.
- Use the **Smoke material** (translucent dark scrim) behind modals to signal that content beneath is blocked.
- **Page background:** Use `colorNeutralBackground2` (slightly off-white) instead of pure white (`Background1`). This gives raised cards on `Background1` natural contrast without heavy borders.
- **Don't combine border AND shadow** on the same element. Pick one. Shadow alone is usually sufficient for cards.

---

## Page Recipes

### Recipe 1: Dashboard

```
┌────────────────────────────────────────────────────────┐
│  Page Title                        [+ New] [Export]    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  ← KPI cards (3-4 max)
│  │ 42       │ │ $125K    │ │ 87%      │ │ 3        │ │
│  │ Active   │ │ Revenue  │ │ On Track │ │ At Risk  │ │
│  │ Projects │ │ This Qtr │ │ Tasks    │ │ Items    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                        │
│  ┌────────────────────────────┐ ┌────────────────────┐ │
│  │ Recent Activity (table)   │ │ Upcoming Deadlines │ │
│  │                           │ │ (compact list)     │ │
│  └────────────────────────────┘ └────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Research-backed rules:**
- **KPI cards:** 3-4 maximum across top. ONE big number + ONE short label per card. Use `fontSizeBase600`+ for the number. Show **context** — delta (% change), comparison period, target.
- **Top-left priority** — users scan F-pattern, so the most important KPI goes top-left.
- **Color in KPIs:** Use `colorPaletteRedForeground1` for "At Risk", `colorPaletteGreenForeground1` for "On Track". Keep other KPIs neutral. Color draws the eye — use it only where you want attention.
- **Don't over-chart.** 1-2 charts maximum. Tables are more scannable for exact values. If everything is a chart, nothing stands out.
- **Progressive disclosure:** Show summarized defaults. Let users drill in via clicks, not by loading everything upfront.
- **Layout:** Two-thirds + one-third grid split for main content (table + sidebar) is reliable.

### Recipe 2: List / Table Page

```
┌────────────────────────────────────────────────────────┐
│  Projects                          [+ New Project]     │
├────────────────────────────────────────────────────────┤
│  [Search...        ]  [Status ▾]  [Priority ▾]        │
│                                                        │
│  ┌────────────────────────────────────────────────────┐│
│  │ Name          │ Status   │ Owner   │ Due     │ ••• ││
│  │───────────────│──────────│─────────│─────────│─────││
│  │ Alpha Launch  │ ● Active │ Kim S.  │ Mar 30  │ ••• ││
│  │ Beta Portal   │ ● Active │ Alex T. │ Apr 15  │ ••• ││
│  │ Data Migrate  │ ○ Draft  │ Pat R.  │ May 01  │ ••• ││
│  └────────────────────────────────────────────────────┘│
│  Showing 1-20 of 142                    [< 1 2 3 ... >]│
└────────────────────────────────────────────────────────┘
```

**Research-backed rules:**
- **Search + filters inline** with the table, not in a separate panel. Reduces clicks to filter.
- **Column alignment:** Left-align text. **Right-align numbers** (amounts, percentages). Match header alignment to column content. Never center-align data — prevents quick scanning.
- **Row height:** Condensed 40px, Regular 48px, Relaxed 56px. Choose one and be consistent.
- **Row actions:** Overflow menu (`•••`), not multiple visible buttons per row. Exception: name column can be a clickable link.
- **Row hover:** Subtle background change (`colorNeutralBackground1Hover`). Don't change multiple properties — it's distracting.
- **Pagination over infinite scroll** for business data — users need to know how much data exists. Show record count.
- **Row dividers:** Subtle 1px lines (`colorNeutralStroke2`) are the most versatile. Zebra striping conflicts with hover/selected states.
- **Monospace for numbers:** Use tabular number formatting for financial/quantity columns so digits align vertically.

### Recipe 3: Detail / Record Page

```
┌────────────────────────────────────────────────────────┐
│  ← Back to Projects                                    │
│                                                        │
│  Alpha Launch Project               [Edit] [•••]       │
│  ● Active  •  Kim Smith  •  Due Mar 30, 2026           │
│                                                        │
│  ┌── Summary ──────────────── Related ──────────────┐  │
│  │                                                   │  │
│  │  ┌── Details ──────────┐  ┌── Timeline ────────┐ │  │
│  │  │ Description:        │  │ Mar 24 — Created   │ │  │
│  │  │ Lorem ipsum dolor...│  │ Mar 25 — Assigned  │ │  │
│  │  │                     │  │ Mar 26 — In Review │ │  │
│  │  │ Budget: $125,000    │  │                    │ │  │
│  │  │ Category: External  │  │                    │ │  │
│  │  └─────────────────────┘  └────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Rules:**
- **Back navigation** at the top — users must always be able to return.
- **Entity name is the largest text.** Key metadata (status, owner, date) sits below as secondary text with `colorNeutralForeground2`.
- **Tabs for related data.** Don't show everything at once. Summary tab visible by default; Related / History / Attachments as additional tabs.
- **Two-column within content:** Primary info on the left (wider), secondary/timeline on the right.
- **Field labels:** `colorNeutralForeground3` for labels, `colorNeutralForeground1` for values. Labels are visually quieter than data.

### Recipe 4: Form / Edit Page

```
┌────────────────────────────────────────────────────────┐
│  ← Back                                                │
│                                                        │
│  Create New Project                                    │
│                                                        │
│  ── General Information ──────────────────────────      │
│                                                        │
│  Project Name *                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ── Budget & Schedule ────────────────────────────      │
│                                                        │
│  Budget            Start Date          End Date        │
│  ┌──────────┐     ┌──────────┐       ┌──────────┐     │
│  │ $        │     │          │       │          │     │
│  └──────────┘     └──────────┘       └──────────┘     │
│                                                        │
│                          [Cancel]  [Save Project]      │
└────────────────────────────────────────────────────────┘
```

**Research-backed rules (CXL Institute, Baymard):**
- **Single column by default.** CXL's study (n=702) found single-column forms completed **15.4 seconds faster** than multi-column (statistically significant at 95% confidence). Multi-column causes users to skip fields or complete unnecessary ones.
- **Multi-column exception:** Only for tightly coupled short fields (start date + end date, first name + last name, city + zip code).
- **Max width 600-700px** for the form container. Full-width inputs on a wide screen are unusable.
- **Section headings** break long forms into scannable chunks. Use `Divider` or a subtle heading (`fontSizeBase400` + `fontWeightSemibold`).
- **Field spacing:** `spacingVerticalL` (16px) between fields within a section. `spacingVerticalXXL` (24px) between sections.
- **Actions at the bottom, right-aligned.** Primary action last (right-most), matching natural reading flow.
- **Sticky footer** for long forms — keep Save/Cancel visible without scrolling.

---

## Typography

Fluent 2 type ramp (web):

| Style | Weight | Size / Line Height | Use |
|---|---|---|---|
| Caption 1 | Regular | 12px / 16px | Metadata, timestamps, helper text |
| Body 1 | Regular | 14px / 20px | Default body text, table cells |
| Body 1 Strong | Semibold | 14px / 20px | Emphasis within body content |
| Subtitle 2 | Semibold | 16px / 22px | Card titles, section headings |
| Subtitle 1 | Semibold | 20px / 26px | Page section headings |
| Title 3 | Semibold | 24px / 32px | Page titles |
| Title 2 | Semibold | 28px / 36px | Hero titles |

**Rules:**
- **Three sizes maximum per page.** Title, body, and caption. If you need more, the hierarchy is unclear.
- **Line length:** 65-75 characters max for body text. Use `max-width` on text containers.
- **Sentence case always** — Fluent 2 explicitly forbids ALL CAPS for body text. Reserve uppercase only for short badges if absolutely necessary.
- **Never skip heading levels.** Don't jump from h2 to h4. Each page has exactly one h1.
- **Font:** Segoe UI / system-ui. Don't mix fonts unless branding specifically requires it.

---

## Borders and Dividers

- **Prefer spacing over borders.** Try adding whitespace first. Only add a border if spacing alone doesn't separate elements clearly enough.
- **When to use borders:** Between table rows, around form inputs, between sidebar and content.
- **When to use dividers:** Between form sections, between major page regions.
- **Don't box everything.** Cards with both borders AND shadow are visually heavy. Pick one — subtle border (`colorNeutralStroke1`) OR shadow (`shadow4`), rarely both.
- **Border weight:** 1px (`strokeWidthThin`) for everything. 2px (`strokeWidthThick`) only for active/focused states.

---

## Interactive States

Every interactive element needs four visible states:

| State | Visual Change | Fluent Token |
|---|---|---|
| **Rest** | Default appearance | `colorNeutralBackground1` |
| **Hover** | Slight background darkening | `colorNeutralBackground1Hover` |
| **Pressed** | Darker still | `colorNeutralBackground1Pressed` |
| **Focus** | Visible 2px outline | `colorStrokeFocus2` (outer) + `colorStrokeFocus1` (inner) |

**Rules:**
- Hover changes are **subtle** — a slight background shift, not a full color change.
- Focus indicators must be visible in **all themes** including high contrast.
- Don't add hover effects to non-interactive elements. If a card changes on hover, it must be clickable.
- **Transitions:** `durationFast` (150ms) for hover/press, `durationNormal` (300ms) for layout shifts. Use `curveEasyEase` for natural feel.
- **Respect `prefers-reduced-motion`.** Wrap animations in `@media (prefers-reduced-motion: no-preference)`.

---

## Motion

Fluent 2 motion principles: **Functional** (serves UI purpose), **Natural** (follows physics), **Consistent**, **Appealing**.

| Pattern | Duration | Use |
|---|---|---|
| Micro-interaction | ~100ms | Button press, toggle, checkbox |
| Enter/Exit | 150-250ms | Panels sliding in, toasts appearing |
| Page transition | Quick fade | Top-level navigation (never sliding between pages) |
| Container resize | 200-300ms | Responsive layout shifts, accordion expand |

**Choreography:** When multiple items enter (e.g., a grid of cards loading), **stagger** their appearance with short delays between each. Animate items in order of importance — key content first.

**Anti-pattern:** Sliding page transitions. Fluent 2 uses quick fades for top-level navigation, not sliding panels.

---

## Navigation Patterns

### When to Use What

| Pattern | Use When | Examples |
|---|---|---|
| **Left sidebar** | 5+ navigation targets, deep hierarchy, desktop-primary | Admin consoles, project management tools |
| **Top tabs** | 2-7 equally important views at same hierarchy level | Record detail tabs (Summary / Related / History) |
| **Sidebar + tabs** | Complex apps with 2-3 hierarchy levels | Sidebar for sections, tabs within each section |
| **Breadcrumbs** | 3+ levels of hierarchy | Folder navigation, nested settings |

**Rules:**
- **Never mix sidebar and top-nav simultaneously** for the same hierarchy level. Pick one.
- Use **plain noun labels** (Projects, Settings), not branded verbs (Launchpad, Mission Control).
- Sidebar should **collapse to a rail** (icons only) on medium screens, then to a **hamburger overlay** on mobile.
- **Prioritize predictability** — users should always be right about where a nav item leads.

---

## Common Mistakes That Make Apps Look Amateur

| Mistake | What to Do Instead |
|---|---|
| Borders around every element | Use spacing and background color for grouping. Remove borders. |
| All text same size and weight | Three-level hierarchy: heading (semibold), body (regular), caption (tertiary color) |
| Multiple font sizes in one card | Two maximum: one for the value, one for the label |
| Inconsistent spacing | Every gap should be a token value on the 4px scale |
| Bright colors on large surfaces | Neutral backgrounds for 60% of the page. Brand color on small accents only |
| Centering everything | Left-align by default. Center only hero sections and empty states |
| Shadow on every element | Cards get shadow. Tables, forms, and inline content don't |
| No whitespace between sections | `spacingVerticalXL` between major sections. Let the page breathe |
| Dense data with no grouping | Section headers, dividers, or card grouping to break up long content |
| Too many competing focal points | One primary action, one key metric. Everything else is secondary |
| Sliding page transitions | Quick fades for page navigation. Slides for panels/drawers only |
| Mixed navigation paradigms | Sidebar OR tabs for a given level. Never both for the same hierarchy |
