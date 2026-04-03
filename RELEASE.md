# PureLayout v0.3.0

> Released: 2026-04-01
>
> Adds Grid layout support and achieves 100% browser fidelity across all layout models.

---

## Overview

PureLayout v0.3.0 marks a major milestone with the implementation of **Phase 3: CSS Grid Layout**. This release includes a robust Grid Formatting Context (GFC) with support for track sizing (`fr`, `px`, `%`), automatic placement, and explicit line positioning. 

Crucially, this version also fixes long-standing margin collapse and coordinate accumulation bugs, achieving **100% browser fidelity** across all 52 differential test fixtures (Block, Inline, Flex, and Grid).

**Key numbers:**

- 38 source files, ~3,500 lines of TypeScript (+2 files, +700 lines)
- 212 tests total (160 unit + 52 diff), all passing
- 52 diff fixtures with **100% browser fidelity** (364 comparison points)
- Zero runtime dependencies
- Enhanced CSS Parser with `repeat()` and track list support

---

## What's New

### Grid Layout (Grid Formatting Context)

Initial implementation of the CSS Grid specification:

- **Track Sizing** — Support for fixed (`px`), percentage (`%`), and flexible (`fr`) units.
- **`repeat()` Function** — Support for repeating track patterns, e.g., `grid-template-columns: repeat(3, 1fr)`.
- **Auto-placement** — Flow-based automatic placement of items into grid cells.
- **Explicit Positioning** — Support for `grid-column` and `grid-row` shorthands and longhands (e.g., `1 / 3` for spanning).
- **Gaps** — Full support for `grid-gap`, `row-gap`, and `column-gap`.
- **Stretch Alignment** — Default `align-items: stretch` behavior for grid items.

### 100% Fidelity & Engine Fixes

- **Margin Collapse 2.0** — Completely rewritten margin collapse algorithm that correctly handles self-collapsing (empty) blocks and deep nesting.
- **BFC Isolation** — Proper implementation of BFC boundaries (e.g., `overflow: hidden`) to prevent margin leakage, matching browser behavior.
- **Unified Coordinate System** — Transitioned to a robust relative-to-absolute coordinate post-processing step, eliminating "drifting" issues in deep trees.
- **Root Node Precision** — Corrected root node positioning to perfectly match `getBoundingClientRect()` in standard browsers.

### CSS Parser Enhancements

- **Track List Parsing** — New robust parser for space-separated track lists with parenthesis depth tracking.
- **Flexible Units** — Added first-class support for `fr` units in the parser and cascade.
- **Integer Types** — Improved handling of pure integers for grid line indices.

---

## New Source Files

```
src/layout/grid/
  grid-formatting.ts   — GFC main entry (Track sizing & placement)
tests/unit/layout/grid/
  grid-basic.test.ts   — TDD suite for Grid layout
```

---

## Supported CSS Properties (v0.3.0)

### Grid (New)

| Property | Supported Values |
|----------|-----------------|
| `display` | `grid` (new) |
| `grid-template-columns` | `px`, `%`, `fr`, `repeat()`, `auto` |
| `grid-template-rows` | `px`, `%`, `auto` |
| `grid-column` | shorthand (e.g., `1 / 3`) |
| `grid-row` | shorthand (e.g., `1 / 2`) |
| `grid-column-start/end` | `<integer>`, `auto` |
| `grid-row-start/end` | `<integer>`, `auto` |
| `gap` / `row-gap` / `column-gap` | `px`, `em`, `rem`, `normal` |

---

## Fidelity Report (100.0%)

| Category | Fixtures | Comparison Points | Status |
|----------|----------|-------------------|--------|
| Block layout | 11 | 77 | 100% |
| Inline layout | 7 | 49 | 100% |
| Box Model | 5 | 35 | 100% |
| Flex layout | 25 | 175 | 100% |
| **Grid layout** | **4** | **28** | **100%** |
| **Total** | **52** | **364** | **100%** |

---

## Installation & Usage

```bash
npm install purelayout
```

```typescript
import { layout, px, FallbackMeasurer } from 'purelayout';

const result = layout(
  {
    tagName: 'div',
    style: { 
      display: 'grid', 
      gridTemplateColumns: '100px 1fr', 
      gap: px(20) 
    },
    children: [
      { tagName: 'div', style: { height: px(50) } },
      { tagName: 'div', style: { height: px(50) } },
    ],
  },
  { containerWidth: 500, textMeasurer: new FallbackMeasurer() }
);
```

---

## Release History

- [v0.1.0](#purelayout-v010) — 2026-03-31 — Block + Inline layout
- [v0.2.0](#purelayout-v020) — 2026-04-01 — Flexbox layout
- **v0.3.0** — 2026-04-01 — Grid layout & 100% Fidelity (this release)
