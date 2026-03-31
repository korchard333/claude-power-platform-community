# PCF Control Sample — DateRangePicker

This directory contains a reference implementation of a **React PCF field control** using Fluent UI v9.

## What This Demonstrates

| Pattern | Where |
|---|---|
| ReactControl (virtual) lifecycle | `DateRangePicker.tsx` — `init`, `updateView`, `getOutputs`, `destroy` |
| Fluent UI v9 integration | `FluentProvider` + `DatePicker` + `makeStyles` |
| `notifyOutputChanged()` on blur | Not on every keystroke — avoids unnecessary saves |
| Property change diffing in `updateView` | Only re-renders when bound value actually changes |
| Accessibility | `aria-label` on inputs, keyboard navigation via Fluent UI |
| `destroy()` cleanup | Clears interval/listener references |

## Important Constraints

- Platform React version is **16.14.0** (build) / **17.0.2** (MDA runtime) — do NOT use React 18 APIs
- Fluent UI v9 max build version: **≤ 9.46.2**
- Use `control-type="virtual"` in the manifest for React controls
- Never call `notifyOutputChanged()` inside `updateView()` — causes infinite loops

## This Is a Reference, Not a Runnable Control

To create a real PCF control, scaffold with `pac pcf init --framework react` and adapt these patterns.
