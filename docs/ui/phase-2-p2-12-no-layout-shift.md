# P2-12 — No-layout-shift enforcement and reserved badge-space adoption

## Objective

Freeze one canonical reservation contract so shared shell state markers can appear/disappear without reflowing shell geometry.

## Why now

- Two overlapping reservation systems (`layoutStability.ts` and `badgeSpace.ts`) created drift risk.
- Proof surfaces (`StatusSummaryHeader`, `WorldModuleCard`) still had local conditional state blocks with avoidable jump risk.

## Dependency chain

- `docs/ui/phase-2-p2-04-token-sheet.md`
- `docs/ui/phase-2-p2-07-ribbon-dock-convergence.md`
- `docs/ui/phase-2-p2-08-inspector-panel-drawer.md`
- `docs/ui/phase-2-p2-11-quality-tier-matrix.md`
- fallback doctrine references: `docs/ui/section-a-layout-stability-rules.md`, `docs/ui/renderer-stack-foundation.md`

## Current repo truth (packet basis)

- `BadgeSlot` is the semantic shell-slot primitive.
- `layoutStability.ts` is still used by chip/no-shift helpers and now bridges to semantic presets.
- `TopRibbon`, `PlaqueHeader`, and `FrameCard` already consume `BadgeSlot`.
- `BottomNavDock` keeps a local reserved indicator slot and remains intentionally stable.
- `ScenicLabel` reserves state slot by default (`reserveStateSlot = true`).

## Canonical reservation contract

- **Canonical semantic source:** `src/ui/shell/badgeSpace.ts`.
- Semantic preset map:
  - `headerTrailing`
  - `rowEnd`
  - `inlineEnd`
  - `cardCorner`
  - `moduleMeta`
- `layoutStability.ts` now bridges legacy/generic presets onto semantic slot truth for shared dimensions.
- `useReservedBadgeSpace()` is now live via `BadgeSlot` adoption.

## Semantic slot preset table

| Preset | Default purpose | Reserve behavior |
| --- | --- | --- |
| `headerTrailing` | Header trailing stamp/action lane | Reserved by default |
| `rowEnd` | End-of-row short state/action marks | Reserved by default |
| `inlineEnd` | Compact inline trailing state | Reserved by default |
| `cardCorner` | Explicit card-corner slot where supported | Reserved by default |
| `moduleMeta` | Module-card state marker home | Reserved by default |

Rules:

- Slot content is short + single-line.
- No counters.
- No multiline slot payloads.
- No long ribbon behavior inside slot containers.

## Additive-only state rules

State changes should be additive and dimension-stable:

- allowed: tint/outline/inset/shadow/content occupancy
- disallowed: border-width/padding/size growth, uncontrolled wrapping, surprise structural insertion

## Shared primitive adoption notes

- `BadgeSlot` keeps `reserveWhenEmpty = true` and now consumes `useReservedBadgeSpace`.
- `TopRibbon` remains shallow and retains reserved start/end slot behavior.
- `PlaqueHeader` trailing slot remains explicit and stable.
- `FrameCard` header trailing lane remains slot-driven and stable.
- `BottomNavDock` keeps intentionally local reserved indicator slot (no item model change).
- `InspectorPanel` keeps explicit status/recommendation reserve/collapse policy.
- `ScenicLabel` continues default state-slot reservation.

## Proof surfaces

- `StatusSummaryHeader`
  - Added always-present top-fix hint and action lane reservation policy.
  - Top-fix and action button now occupy stable space when absent/present.
- `WorldModuleCard`
  - Added `moduleMeta` state slot for active marker.
  - Chip lane always reserves two compact chip slots (max-two-chip discipline preserved).
  - CTA remains bottom-anchored.

## Diagnostics/tracking notes

Updated visual manifest tracked style files to include:

- `src/ui/status/StatusSummaryHeader.scss`
- `src/ui/world/WorldModuleCard.scss`

No broad diagnostics-system overhaul.

## Preserve / enhance / defer

- **Preserve:** existing shell identities, world ownership, status hierarchy, max-two-chip discipline.
- **Enhance now:** reservation contract unification, shell slot semantics, proof-surface no-shift stabilization.
- **Defer:** manual/technique/inventory shift debt and broader screen-level normalization.

## Non-goals

- No screen redesign.
- No world card retheme.
- No chip taxonomy rewrite.
- No motion retuning program.
- No art requests/assets.

## Manual QA script

1. TopRibbon: toggle start/end slots and verify no width/height jump.
2. BottomNavDock: toggle active/recommended/attention and verify stable button geometry.
3. InspectorPanel: with/without status/recommendation zones and verify calm body position.
4. ScenicLabel: default/active/recommended/locked and verify hotspot geometry remains fixed.
5. StatusSummaryHeader: with and without top fix/action and verify no abrupt top-grid drift.
6. WorldModuleCard: default/active/chip states and verify stable header/chip lane + bottom CTA anchoring.

## Screenshot requirements

- Reuse existing Section A screenshot workflow.
- No new screenshot root creation.
- Capture only proof surfaces touched by this packet when running visual signoff.

## Acceptance gate

P2-12 is complete when:

1. Reservation truth is canonical (`badgeSpace`) with explicit bridge from legacy helpers.
2. Shared shell primitives retain stable slot semantics without redesign.
3. StatusSummaryHeader and WorldModuleCard have explicit reserved state lanes.
4. Max-two-chip module-card discipline is preserved.
5. Contract tests cover reservation source, shell adoption, and proof-surface stability.
6. Validation commands are run (`typecheck`, `build`, `test:contracts`).
