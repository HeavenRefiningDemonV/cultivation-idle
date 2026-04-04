# P0-02 — Screenshot baseline and review folder

## Purpose

Create the canonical Phase 0 before-state screenshot review path for the ten locked recovery targets so later packets can compare exact-screen changes against baseline evidence slots instead of memory.

## Dependency state

- P0-00 files present: `yes` (`docs/ui/phase-0-source-lock.md`, `docs/ui/phase-0-packet-register.md`).
- P0-01 files present: `yes` (`docs/ui/phase-0-destructive-migration-audit.md`, `docs/ui/phase-0-destructive-migration-ledger.json`).

## Capture basis

- Branch: `work`
- Short commit: `a8410d5`
- Working tree at capture pass: dirty (docs-only packet edits in progress)
- Viewport standard: `1440x900` (planned standard for capture)
- Capture method: `manual-documented` (no approved automated pipeline available in this snapshot)
- Fixture strategy:
  - `fresh-life` planned for Path / Life Start
  - `core-run` planned for Cultivation/Status/World/Manual Pavilion/Techniques/Apothecary/Forge/Bounties-Expeditions
  - `outer-loop` planned for Prestige only if `core-run` cannot reach it

## Recovery-order target roster

1. Path / Life Start
2. Cultivation
3. Status
4. World
5. Manual Pavilion
6. Techniques
7. Apothecary
8. Forge
9. Bounties / Expeditions
10. Prestige

## Folder structure

Review root: `docs/ui/review/phase-0-baseline/`

- `01-path-life-start/`
- `02-cultivation/`
- `03-status/`
- `04-world/`
- `05-manual-pavilion/`
- `06-techniques/`
- `07-apothecary/`
- `08-forge/`
- `09-bounties-expeditions/`
- `10-prestige/`
- `appendix/`

Each subfolder currently includes a `README.md` slot note with expected filenames and blocker reason.

## Screenshot state matrix

Status legend:
- `captured` = real screenshot file exists
- `blocked` = capture is required but currently unavailable
- `not-applicable` = state does not apply on current screen

For this snapshot, all required shot slots are **blocked** (see blockers section).

## Per-screen baseline notes

### 1) Path / Life Start (`path-life-start`)
- Owner anchor: portrait-led triptych / ritual first-contact
- Current design-state summary: Life Start wizard owner exists in code and remains the intended first-contact flow.
- Captured shot list: `default` (blocked), `selected-path` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: blocked
- Visible risks to watch later: owner integrity under step transitions and interaction no-shift states
- Route / fixture notes: use `fresh-life`; capture from wizard entrypoint

### 2) Cultivation (`cultivation`)
- Owner anchor: central cultivator / dantian / altar composition
- Current design-state summary: Cultivation centerpiece and breakthrough/readiness surfaces are present.
- Captured shot list: `default` (blocked), `readiness-or-breakthrough` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: blocked (`fx-high`, `fx-low`, `fx-reduced-motion` required when available)
- Visible risks to watch later: centerpiece ownership, breakthrough truth readability
- Route / fixture notes: use `core-run`; active tab `cultivation`

### 3) Status (`status`)
- Owner anchor: diagnostic summary surface with symbolic center
- Current design-state summary: Status summary + run compass diagnostic surface present.
- Captured shot list: `default` (blocked), `shortfall-or-next-action` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: blocked when applicable
- Visible risks to watch later: diagnostic truth visibility and no-layout-shift on state indicators
- Route / fixture notes: use `core-run`; active tab `status`

### 4) World (`world`)
- Owner anchor: scenic city/map ownership with contextual inspector
- Current design-state summary: world map + inspector shell path is present.
- Captured shot list: `default` (blocked), `inspector-open` (blocked), `route-or-recommendation` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: blocked
- Visible risks to watch later: map ownership versus shell dominance; inspector clarity
- Route / fixture notes: use `core-run`; active tab `adventure`

### 5) Manual Pavilion (`manual-pavilion`)
- Owner anchor: bookshelf/spine room identity
- Current design-state summary: pavilion shelf/spine ownership remains in module panel path.
- Captured shot list: `default` (blocked), `selected-spine` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: not-applicable currently (module-level requirement remains default + interaction)
- Visible risks to watch later: spine selection layout stability and shelf ownership retention
- Route / fixture notes: use `core-run`; enter via world module modal path

### 6) Techniques (`techniques`)
- Owner anchor: Inner Palace / altar ownership
- Current design-state summary: techniques dense surface and build altar area present.
- Captured shot list: `default` (blocked), `selected-slot-or-loadout` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: not-applicable currently
- Visible risks to watch later: dense-state no-shift and selection clarity
- Route / fixture notes: use `core-run`; active tab `techniques`

### 7) Apothecary (`apothecary`)
- Owner anchor: preparation-room / pouch identity
- Current design-state summary: apothecary room and pouch-related substate surfaces are present.
- Captured shot list: `default` (blocked), `selected-substate` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: not-applicable currently
- Visible risks to watch later: room identity persistence and stock/slot warning clarity
- Route / fixture notes: use `core-run`; enter via world module modal path

### 8) Forge (`forge`)
- Owner anchor: workshop ownership
- Current design-state summary: forge screen routes to live workshop surface.
- Captured shot list: `default` (blocked), `selected-blueprint-or-detail` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: not-applicable currently
- Visible risks to watch later: workshop owner visibility and side/detail composition stability
- Route / fixture notes: use `core-run`; enter via world module modal path

### 9) Bounties / Expeditions (`bounties-expeditions`)
- Owner anchor: paper-board / route-paper support identity
- Current design-state summary: bounty and expedition boards are available as separate module surfaces under one recovery bucket.
- Captured shot list: `bounties-default` (blocked), `expeditions-default-or-active-queue` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: not-applicable currently
- Visible risks to watch later: board identity coherence and queue/route truth readability
- Route / fixture notes: use `core-run`; enter via world module modal path

### 10) Prestige (`prestige`)
- Owner anchor: decree-like reincarnation surface
- Current design-state summary: prestige tab and ritual/decree structures are present.
- Captured shot list: `default` (blocked), `node-detail-or-confirmation-preview` (blocked)
- Interaction-state coverage: blocked
- Quality-tier coverage: not-applicable currently
- Visible risks to watch later: decree identity, reset/keep/rebuild truth visibility
- Route / fixture notes: use `outer-loop` only if `core-run` cannot reach honest prestige state

## Appendix-only captures

No appendix screenshots captured in this packet.

Appendix folder prepared: `docs/ui/review/phase-0-baseline/appendix/`.

## Open blockers / missing baseline coverage

1. This repo snapshot documents manual screenshot expectations but has no approved automated capture pipeline for these Phase 0 targets.
2. Browser-based manual capture is unavailable in this Codex execution environment.
3. Per doctrine, synthetic or fabricated substitute images are not allowed; blocked slots are recorded instead of faking captures.

## How later packets must use this pack

- Treat this folder+manifest as the canonical slot map for P0-03 and P0-04..P0-13 evidence capture.
- Fill blocked slots with real screenshots before claiming exact-screen recovery completion.
- Do not use mockups or regenerated “pretty” states in place of real branch captures.
