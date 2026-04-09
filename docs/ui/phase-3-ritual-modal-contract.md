# P3-09 — Phase 3 ritual modal contract

## Why this packet exists

P3-09 freezes a **shared ritual-modal standard** for consequence surfaces so later packets (especially P3-10+) inherit one stable family instead of inventing local shell rules.

This packet does **not** introduce new gameplay mechanics and does **not** request new art.

## Relationship to P2-09

This contract extends (not replaces) `docs/ui/phase-2-p2-09-ritual-modal-contract.md`.

- **P2-09** remains the lifecycle/shell-behavior source of truth (focus trap, body scroll lock, reduced-motion toggle, ownership split with `InkModalFrame`).
- **P3-09** defines semantic ritual-modal family usage, hierarchy, anatomy, DOM-truth guarantees, and no-shift/action-band rules for Phase 3 proof surfaces.

## Phase 3 ritual-modal family definition

Ritual modals are centered consequence frames with explicit gameplay truth in the DOM.

The live shell base remains `RitualModalFrame` (which wraps `InkModalFrame`).

### Semantic uses (mapped to current runtime variants)

1. **Choice / consequence ritual** (`variant="ritual"`)
   - High-consequence choice or doctrinal rewrite.
   - One clear title.
   - One explicit consequence/cost block.
   - One dominant confirm lane.
   - Current live proofs: `PrestigeRitualModal`, `ChangeHeartLawModal`.

2. **Warning / chapter-end ritual** (`variant="chapterEnd"`)
   - Cap-state and forced-warning consequence surface.
   - Warning truth remains high in hierarchy.
   - Multiple next-step actions may exist, but one action remains visually primary.
   - Current live proof: `CurrentChapterExhaustedModal`.

3. **Summary / review ritual** (`variant="summary"`)
   - Review/recap interpretive surface.
   - Summary identity over destructive-warning tone.
   - Grouped recap blocks and subordinate action lane.
   - Current live proof: `LifeSummaryModal`.

## Required anatomy zones

Each ritual modal uses the same shell grammar with stable zones:

1. Title plate / header zone (`data-ritual-zone="header"`).
2. Optional symbolic ornament zone (`data-ritual-zone="ornament"`).
3. Primary reading zone (`data-ritual-zone="reading"`).
4. Optional consequence / warning / compare block(s) inside reading zone.
5. Optional status line zone (consumer-owned, but remains in DOM).
6. Action band / footer zone (`data-ritual-zone="action-band"`).

Not every surface emphasizes every zone equally, but the zone grammar remains consistent.

## DOM truth rules (non-negotiable)

Essential consequence truth must remain in the DOM (never ornament-only):

- reset / keep / rebuild truth
- chapter-end cap truth
- cost truth
- lock/unavailable reasons
- AP forecast and advisor state
- selected/current doctrine comparison text
- life-summary meta + block lines
- live status/helper lines tied to action eligibility

Allowed ornament-only content:
- seals, halos, decorative underplates, symbolic accents.

Forbidden:
- moving core reset/cost/cap/status truth into image-only or effect-only presentation
- requiring hover/tooltips to understand consequence legality

## Action-band hierarchy rules

- Exactly one visually dominant confirm action where choice/consequence applies.
- Secondary/cancel actions remain subordinate.
- Status text remains visible and stable in DOM.
- Footer geometry should remain stable across enabled/disabled/reason states.

## No-layout-shift contract

Ritual modals may not:

- resize action rows when states change
- change footer height unpredictably due reason text
- grow rows/cards on selection/lock/current markers
- shift panel layout when ornament state changes

Preferred techniques:

- reserved badge/status space
- stable min-heights
- tint/underlay/inset-shadow emphasis
- fixed outline strategy
- stable action-band lane

Avoid:

- border-thickness growth that changes box model
- row expansion on selection
- dynamic insertion that pushes primary actions around

## FX and motion degradation contract

- **High FX:** symbolic warmth/flourish allowed, but readability remains DOM-led.
- **Low FX:** hierarchy and consequence clarity remain complete without glow reliance.
- **Reduced motion:** ritual surfaces degrade to near-static/static while preserving hierarchy and action clarity.

Motion timing source remains `src/ui/motion/ritualMotion.ts` with explicit reduced profile zeroing.

## Current proof surfaces establishing this standard

- `PrestigeRitualModal`
- `CurrentChapterExhaustedModal`
- `LifeSummaryModal`
- `ChangeHeartLawModal`

Section C proof/evidence surfaces stay mapped in existing QA folders and harness routes.

## Inheritance for later packets (P3-10+)

Later consequence modals may inherit:

- `RitualModalFrame` zone grammar + variants
- stable action-band rhythm
- DOM-truth requirement
- no-shift constraints
- low/reduced degradation rules

Later packets may not invent conflicting local shell behavior for these fundamentals.

## Explicit non-goals in P3-09

- No broad consumer redesign.
- No shell-system rewrite.
- No new art request.
- No change to gameplay economics/unlock rules.
