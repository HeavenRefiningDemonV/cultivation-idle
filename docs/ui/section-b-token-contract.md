# Section B.2 — Shared chrome tokens and theme normalization

## 1) Purpose of B.2
B.2 centralizes shared chrome and motion values into canonical token layers so paper/ink/global shells no longer drift across multiple sources of truth.

This packet is normalization-only:
- no screen adoption,
- no visual redesign,
- no gameplay changes,
- no asset work.

## 2) Dependency on B.1
B.2 depends on the B.1 canonical chrome ownership surface existing at `src/ui/chrome/index.ts`.

Status in this packet: dependency is present; B.2 proceeds without modifying B.1 wrapper behavior.

## 3) Current repo token/theme truth
Before B.2 normalization:
- `src/styles/paperInkTokens.scss` mixed legacy Sass/CSS and acted as a de-facto source.
- `src/ui/ink/inkTheme.scss` acted as an alias/theme layer but still carried design decisions.
- `src/ui/paper/paper.scss` hardcoded many shared card/chip/stamp fundamentals.
- `src/styles/global.css` held global utility defaults (including shared timing and bottom-nav sizing).
- `src/styles/uiLayerTokens.css` already owned semantic z-layer bands.

B.2 keeps these files but reassigns authority so canonical decisions live in dedicated token files.

## 4) Canonical token ownership decision
Canonical token authorities in B.2:
- `src/styles/uiChromeTokens.scss` → shared chrome tokens (palette/surfaces/shape/layout/typography).
- `src/styles/uiMotionTokens.scss` → shared motion tokens + reduced-motion clamps.

Compatibility bridges (not independent authorities):
- `src/styles/paperInkTokens.scss` (legacy `--paper-*` mapping).
- `src/ui/ink/inkTheme.scss` (legacy `--ink-*` mapping).

## 5) Token family map
B.2 canonical token families:
- **Colors:** `--ui-chrome-color-*`
- **Surfaces/borders/outlines/shadows:** `--ui-chrome-surface-*`, `--ui-chrome-border-*`, `--ui-chrome-outline-*`, `--ui-chrome-shadow-*`
- **Shape:** `--ui-chrome-radius-*`
- **Layout/sizing:** `--ui-chrome-space-*`, `--ui-chrome-size-*`, `--ui-bottom-nav-*`
- **Typography:** `--ui-chrome-font-*`, `--ui-chrome-text-size-*`, `--ui-chrome-line-height-*`
- **Motion:** `--ui-motion-*`
- **Z-layer usage:** semantic layer variables in `uiLayerTokens.css` with chrome aliases (`--ui-layer-chrome-ribbon`, `--ui-layer-chrome-dock`, `--ui-layer-chrome-modal`).

## 6) Legacy alias map
### Canonical -> legacy paper aliases
- `--ui-chrome-color-parchment-base` -> `--paper-parchment`, `--paper-0`
- `--ui-chrome-color-ink-primary` -> `--paper-ink`
- `--ui-chrome-border-shell` -> `--paper-shell-border`
- `--ui-chrome-outline-shell` -> `--paper-shell-outline`
- `--ui-chrome-shadow-soft` -> `--paper-shadow`, `--paper-shadow-soft`
- `--ui-chrome-shadow-strong` -> `--paper-shadow-strong`
- `--ui-chrome-surface-shell-*` -> `--paper-shell-*`
- `--ui-chrome-color-seal-red` -> `--paper-stamp`

### Canonical/bridge -> legacy ink aliases
- `--paper-shell-base` -> `--ink-panel-base`
- `--paper-shell-raised` -> `--ink-panel-raised`
- `--paper-shell-muted` -> `--ink-panel-muted`
- `--paper-shell-border` -> `--ink-panel-border`
- `--paper-shell-outline` -> `--ink-panel-outline`
- `--paper-ink` -> `--ink-text-color`
- `--paper-ink-muted` -> `--ink-muted-color`
- `--paper-scrollbar-*` -> `--ink-scrollbar-*`

## 7) Shared files normalized in this packet
- `src/styles/paperInkTokens.scss`
- `src/ui/ink/inkTheme.scss`
- `src/ui/paper/paper.scss`
- `src/styles/uiLayerTokens.css`
- `src/styles/global.css`
- `src/ui/ink/InkPanel.scss`
- `src/ui/ink/PaperCard.scss`
- `src/ui/ink/PaperChip.scss`
- `src/ui/ink/InkModalFrame.scss`
- `src/components/BottomTabBar.scss`
- `src/ui/cultivation/CultivationHeaderRibbon.scss`

## 8) Files explicitly deferred
Deferred to later Section B packets:
- component-level visual convergence/adoption (`B.3+`),
- nav/ribbon semantic adoption into new chrome wrappers,
- broader typography redesign and content-level spacing updates.

## 9) No-layout-shift compatibility notes
B.2 keeps no-layout-shift behavior intact by preserving:
- outline/box-shadow emphasis patterns (no hover border-width growth for shared shells),
- tokenized transition timing without introducing dimension-changing hover states,
- existing `uiNoShift` strategy in `global.css` with tokenized timing/outline offset.

## 10) Reduced-motion notes
`uiMotionTokens.scss` now provides reduced-motion clamps via `prefers-reduced-motion: reduce` that zero interaction duration/lift/shift/scale token outputs without removing existing class behavior contracts.

## 11) Manual QA and acceptance criteria
Manual QA steps used for B.2:
1. `npm run typecheck`
2. `tsc --project tsconfig.tests.json && node --test tmp-tests/tests/contracts/chromeTokenContract.test.js`
3. `npm run build`
4. Smoke-check compile + shared shell surfaces (InkPanel, paper card/chip/stamp consumers, BottomTabBar, CultivationHeaderRibbon, InkModalFrame).

Acceptance criteria:
- canonical chrome + motion token files exist,
- legacy paper/ink aliases remain available,
- targeted z-index hardcodes (200/40/80) are removed,
- shared motion values in targeted shells route through `--ui-motion-*`,
- no screen adoption/redesign was introduced.
