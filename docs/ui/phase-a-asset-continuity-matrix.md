# Phase A.2 — Asset Continuity Matrix

## 1) Purpose of Packet A.2
Packet A.2 creates the working recovery map for Phase A. It is an audit-only packet and does not perform runtime fixes, art replacement, or screen recovery implementation.

## 2) Authority Chain
- `docs/ui/phase-a-recovery-constitution.md` and `docs/ui/phase-a-rollout-guardrails.md` (A.1) are the governing recovery doctrine.
- The original UI redesign/master and implementation constitution still own broad layout and atmosphere direction.
- This A.2 matrix translates that doctrine into practical, screen-by-screen recovery planning inputs.

## 3) How the Matrix Was Built
This matrix was assembled from:
- **code inspection** of live screen files, related SCSS, and key sub-surfaces,
- **asset inspection** of currently available scenic/base/chrome files,
- **screenshot inspection** of the required `/mnt/data/*` paths,
- **git history usage:** not used for this packet (`gitHistoryUsed: false`).

Evidence labels used:
- `code-confirmed`
- `needs-visual-verify`
- `screenshot-confirmed` (not used in this packet because required screenshot files were absent)
- `git-history-confirmed` (not used)

## 4) Global Preserve / Enhance / Create-New Buckets
### Preserve
- path portraits
- book spines
- city / citystate overlays
- forgewide backgrounds
- manual pavilion / techniques backdrops
- bountyboard scene element
- hourglass icons
- qi_lotus family

### Enhance
- `buttoncorners.png`
- `scroll.png`
- `bar_long.png`
- `bar_short.png`
- `block_fancy.png`
- Dantian / altar / orb presentation
- current paper/ink cards and ribbons
- current Gate Trial / Outskirts shell alignment
- current workshop / apothecary scene foundations

### Create-New
- frame atlas variants
- plaque / ribbon / breadcrumb / title-plate family
- FX sprite atlas
- cultivation enhancement kit
- Heart Law altar / seal kit
- world labels / building plaques
- overlay / mask pack
- brush swashes / recommendation underlays
- icon seals / medallions / custom system icons

## 5) Primary Recovery Order
1. `path_life_start` → A.4
2. `cultivation` → A.5
3. `status` → A.5
4. `world` → A.6
5. `manual_pavilion` → A.6
6. `techniques` → A.6
7. `apothecary` → A.7
8. `forge` → A.7
9. `bounties_expeditions` → A.7
10. `prestige` → A.7

## 6) Screen Continuity Matrix

| screen | owner packet | base art status | main breakages | cutover status | new-art need | evidence |
|---|---|---|---|---|---|---|
| path_life_start | A.4 | path portraits preserved in code; ritual framing uncertain | likely under-framed ritual composition; cutout risk | blocked | medium | code-confirmed, needs-visual-verify |
| cultivation | A.5 | cultivator + bars + lotus family still wired | hero scene flattening risk; command hierarchy may feel split | blocked | medium | code-confirmed, needs-visual-verify |
| status | A.5 | status scaffolding intact; buttoncorners/paper depth present | visual hierarchy flattening; mixed summary language risk | blocked | low | code-confirmed, needs-visual-verify |
| world | A.6 | citystate scenic overlays remain wired | map identity can be flattened by module/chrome density | blocked | high | code-confirmed, needs-visual-verify |
| manual_pavilion | A.6 | book spine assets still wired | shelf/spine identity may be diluted by generic cards | blocked | medium | code-confirmed, needs-visual-verify |
| techniques | A.6 | altar concept and hourglass cues remain | top-ribbon/inspector ownership split; PaperCard residue | blocked | medium | code-confirmed, needs-visual-verify |
| apothecary | A.7 | room foundation implied; workflow complete | heavy generic tray/card usage may flatten room identity | blocked | medium | code-confirmed, needs-visual-verify |
| forge | A.7 | forgewide scenic backgrounds available and referenced | localized forge identity may be abstracted by shared shells | blocked | medium | code-confirmed, needs-visual-verify |
| bounties_expeditions | A.7 | board/route-paper/hourglass identity still represented | tactility may flatten under generic card/chip systems | blocked | medium | code-confirmed, needs-visual-verify |
| prestige | A.7 | ritual/decree shell remains structurally rich | likely half-migrated ritual language; potential header split | blocked | high | code-confirmed, needs-visual-verify |

## 7) Cross-Screen Regression Patterns
- Old scenic/base layers are not always removed in code, but are at risk of being visually weakened by generic tray/card coverage.
- Duplicate or split ownership patterns appear where legacy local headers coexist with newer shared ribbon/chrome systems.
- Generic shared chrome can flatten scenic/hero screens when composition pass lags behind structural migration.
- Missing icons/buttons are not broadly code-confirmed; however, state-marker completeness is frequently `needs-visual-verify`.
- Cutout/floating composition risk is concentrated on hero/ritual surfaces (Path Start, Cultivation, Prestige).
- Old/new ownership split is recurring in screens now combining legacy shells with TopRibbon/Inspector/chip/stamp families.

## 8) Cutover Risk Summary
Most cutover-blocked:
- **world** (map/scenic identity coherence risk + high new-art support roles)
- **prestige** (ritual identity coherence + possible header split)
- **techniques** (altar + inspector ownership split)
- **path_life_start** (portrait ritual framing and cutout risk)

All primary screens are currently marked `blocked` because screenshot approval is unavailable and A.1 cutover gates cannot be satisfied without visual verification.

## 9) Supplementary Surfaces
Supplementary only (not in primary order):
- `heart_law_selection` (future ritual-screen packet)
- `gate_trial` (later module-screen packet)

## 10) Handoff to Later A Packets
- **A.4** consumes: `path_life_start` recovery row.
- **A.5** consumes: `cultivation`, `status`.
- **A.6** consumes: `world`, `manual_pavilion`, `techniques`.
- **A.7** consumes: `apothecary`, `forge`, `bounties_expeditions`, `prestige`.

Implementation source-of-truth handoff:
- Machine-readable authority: `docs/ui/phase-a-asset-continuity-matrix.json`.
- Human planning and review: this matrix + `docs/ui/phase-a-screen-recovery-audit.md`.
