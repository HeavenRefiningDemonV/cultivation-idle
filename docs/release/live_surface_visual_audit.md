# Live Surface Visual Audit (Packet 7.5d)

## Tracked live surfaces/files
- Source of truth: `src/services/diagnostics/release/liveSurfaceVisualManifest.ts`.
- Reuses the packet 7.5 live surface scope from `LIVE_SURFACE_MANIFEST` and adds visual-file focus for:
  - shell/tab chrome
  - cultivation/inventory/manual satchel/offline modal
  - manual pavilion and combat building styles
  - live icon-bearing TSX files

## Blue-remnant audit scope
- Detects dashboard-era blue remnants on tracked files only:
  - bright blue hexes (`#0ea5e9`, `#0284c7`, `#3b82f6`, `#2563eb`)
  - known blue rgba remnants (`rgba(59,130,246,*)`, `rgba(125,211,252,*)`)
  - dark-blue panel-era rgba patterns in tracked semester surfaces
- Explicit narrow exceptions are documented in the visual manifest with file + reason.

## Layout-shift audit scope
- High-risk interaction states audited via source-level checks:
  - `:hover`
  - `:focus-visible`
  - `:active`
  - selected/active class variants
- Flags state blocks that change size-driving properties (`border-width`, `padding`, `min-width`, `min-height`, `width`, `height`).
- Enforces `uiNoShift` hooks on tracked controls:
  - bottom tab buttons
  - offline modal continue button
  - inventory header/pocket/slot controls

## Icon consistency audit scope
- Complements (does not replace) `scripts/checkNoEmojiIcons.ts`.
- Live-surface focused checks ensure tracked files avoid:
  - literal emoji glyphs
  - `lucide-react` direct imports on tracked semester UI files
- Uses canonical `GameIcon`/icon registry semantics for live controls.

## Automated coverage
- Audit helper: `src/services/diagnostics/release/liveSurfaceVisualAudit.ts`
- Manifest: `src/services/diagnostics/release/liveSurfaceVisualManifest.ts`
- Integration gate: `tests/integration/release/liveSurfaceVisualAudit.test.ts`
- Global emoji guard remains: `npm run check:icons`

## Manual smoke checks
1. Switch major tabs repeatedly and verify no tab chrome size jumps.
2. Open/close World building flows and confirm shell/action controls stay dimensionally stable.
3. Switch cities and verify related controls/chips remain stable.
4. Interact with technique/loadout/inventory selection and confirm no button/card jump on hover/selected states.
5. Open Prestige, Current Chapter Exhausted, and Life Summary surfaces and verify paper/ink chrome consistency.
6. Open Offline Progress + Manual Satchel and validate no dashboard-blue remnants remain.
7. Confirm controls/chips/cards do not visibly jump in size across hover/selected/warning/disabled states.

## Current narrow exceptions
- `CultivateScreen` keeps a subtle dark-ink border value for one action-button edge; this is explicitly tracked as a non-blue semantic edge in the manifest exception list.
