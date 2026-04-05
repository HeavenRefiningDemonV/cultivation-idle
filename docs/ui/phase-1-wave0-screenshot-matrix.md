# P1-01A — Phase 1 Wave 0 Screenshot-Proof Matrix

## Packet identity

- Packet: `P1-01A`
- Phase: `Phase 1 — Support-art generation and asset preparation`
- Class: `docs-only / QA-prep`
- Deliverable: `evidence-capture plan`

## Purpose and bounded scope

This matrix defines the exact screenshot-proof expectations required before any later Phase 1 support-art packet is reviewable.

Wave 0 proof is **support-art justification evidence** only. It is **not** cleanup approval, **not** scenic-owner replacement authority, and **not** cutover completion.

## Authority basis used

1. Latest repo snapshot.
2. `docs/ui/section-a-screenshot-approval-workflow.md`
3. `docs/release/ui_screen_signoff_sheet.md`
4. `docs/release/qa/ui-cutover/section-c-baseline-index.md`
5. `docs/ui/section-c-baseline-audit.md`
6. `docs/ui/section-a-touchpoint-registry.md`
7. `docs/ui/section-a-touchpoint-registry.json`
8. `docs/ui/section-a-asset-constitution.md`
9. `docs/ui/section-a-screen-family-matrix.md`
10. `docs/ui/section-a-cutover-gate.md`
11. `docs/ui/section-a-acceptance-matrix.md`

## Screenshot slot standard (Wave 0)

Core slots used across all rows:

- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`

Optional:

- `07-narrow.png`

Rule: if a slot is not applicable for the exact surface, mark explicit `N/A` in the row and README; omission is invalid.

## Wave 0 matrix rows

| Surface id | Human label | Screen family | Owner files / touchpoint source | Preserved owner that must remain visible in frame | Capture mechanism | Capture route / navigation | Required slot set | `03-truth-states` | `07-narrow` | Likely missing-role gaps (operational phrasing only) | Future support family tags | Current blockers | Priority tier |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `life-start-path` | Life Start Path Selection | Hero ritual screen | `docs/ui/section-a-touchpoint-registry.md` (`LifeStartWizardModal` target row); `src/assets/menus/path_heaven 1.png`, `src/assets/menus/path_earth 1.png`, `src/assets/menus/path_martial 1.png` | Full-height triptych + path portrait ownership | deterministic harness | `/?uiAudit=section-c&surface=life-start-path&fx=high|low|reduced` | `01`, `02`, `04`, `05`, `06` required | N/A | optional | No dedicated selection-underlay / summary-plaque combination currently bridges triptych focus to option summary without generic card framing. | `plaque-ribbon-titleplate-family`, `state-underlays-and-stamps` | None beyond manual capture completion | P0 |
| `life-start-heart-law` | Life Start Heart Law Selection | Hero ritual screen | `docs/ui/section-a-touchpoint-registry.md` (`LifeStartWizardModal` target row); `src/ui/ink/InkModalFrame.tsx`, `src/ui/ink/PaperCard.tsx`, `src/ui/ink/PaperChip.tsx` | Current life-start shell + `InkModalFrame` + paper card/chip stack | deterministic harness | `/?uiAudit=section-c&surface=life-start-heart-law&fx=high|low|reduced` | `01`-`06` required | required | optional | No dedicated altar/seal support layer currently differentiates doctrine-state emphasis from generic option-card emphasis. | `plaque-ribbon-titleplate-family`, `heart-law-altar-seal-kit` | None beyond manual capture completion | P0 |
| `dao-heart-law` | Dao Heart — Heart Law tab | Hero ritual modal | `docs/ui/section-a-touchpoint-registry.md` (`DaoHeartModal` target row) | Dao Heart modal shell + current right-reading truth + radial verse ring / doctrine shell | deterministic harness | `/?uiAudit=section-c&surface=dao-heart-law&fx=high|low|reduced` | `01`-`06` required | required | recommended | No shared title-plate hierarchy currently bridges ritual heading, doctrine context, and action rail without per-screen ad hoc treatment. | `plaque-ribbon-titleplate-family`, `heart-law-altar-seal-kit`, `shared-fx-atlas` | None beyond manual capture completion | P0 |
| `prestige-ritual` | Prestige Reincarnation Ritual | Ritual modal | `docs/ui/section-a-touchpoint-registry.md` (`PrestigeRitualModal` target row) | Ritual modal frame + AP/reset/keep/rebuilt truth block | deterministic harness | `/?uiAudit=section-c&surface=prestige-ritual&fx=high|low|reduced` | `01`-`06` required | required | optional | No shared decree/plaque support family currently standardizes ritual decision hierarchy across all ritual modals. | `plaque-ribbon-titleplate-family`, `frame-atlas-variants` | None beyond manual capture completion | P1 |
| `current-chapter-exhausted` | Current Chapter Exhausted modal | Ritual modal | `docs/ui/section-a-touchpoint-registry.md` (`CurrentChapterExhaustedModal` target row) | Ritual modal frame + explicit chapter-cap truth | deterministic harness | `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=high|low|reduced` | `01`, `02`, `04`, `05`, `06` required | N/A | optional | No shared chapter-cap stamp underlay currently separates chapter lock state from standard modal warning copy with reusable semantics. | `state-underlays-and-stamps`, `plaque-ribbon-titleplate-family` | State-gated truth variant may require forced audit state | P2 |
| `life-summary` | Life Summary modal | Ritual modal | `docs/ui/section-a-touchpoint-registry.md` (`LifeSummaryModal` target row) | Ritual modal frame + current-life summary blocks + AP/advisor truth | deterministic harness | `/?uiAudit=section-c&surface=life-summary&fx=high|low|reduced` | `01`-`06` required | required | optional | No shared summary plaque and section-divider family currently preserves hierarchy between advisor/AP truth rows and recap blocks. | `plaque-ribbon-titleplate-family`, `frame-atlas-variants` | State-gated availability in natural flow | P2 |
| `cultivation-main` | Cultivation main | Hero ritual screen | `src/components/screens/CultivateScreen.tsx`, `src/ui/cultivation/DantianOrb.tsx`, `src/ui/cultivation/VerseMiniBar.tsx`, `src/ui/cultivation/QiLotusIcon.tsx`; `src/assets/onscreen/cultivator_backshots.png`, `src/assets/onscreen/qi_lotus_closed.png`, `src/assets/onscreen/qi_lotus_open.png`, `src/assets/onscreen/qi_lotus_full.png` | Current cultivator / dantian center + Qi bar + qi-lotus family + doctrine/truth stack | manual live navigation | Open active run → Cultivation | `01`-`06` required | required | recommended | No reusable overlay/mask part currently bridges cultivator center scene to inspector plane without introducing screen-local one-offs. | `overlay-mask-pack`, `shared-fx-atlas`, `cultivation-hero-overlay-kit` | No deterministic harness route documented for this surface | P0 |
| `status-main` | Status main | Hero ritual screen | `src/ui/status/RunCompass.tsx`, `src/ui/status/PostFailureDiagnosisPanel.tsx`, `src/ui/text/playerFacingLabels.ts` | Current diagnostic summary structure + root/readiness/next-action truth surfaces | manual live navigation | Open active run → Status | `01`, `03`, `04`, `05`, `06` required; `02` required if expandable/focus cards materially change state | required | recommended | No shared frame-atlas variant currently standardizes section framing for diagnostic clusters without bespoke per-panel borders. | `frame-atlas-variants`, `state-underlays-and-stamps` | Interaction slot depends on whether expandable state is active in capture | P0 |
| `world-main` | World main map | Scenic world screen | `src/components/screens/WorldScreen.tsx`, `src/components/screens/CityMapHub.tsx`, `src/assets/background/city.png`, `src/assets/background/citystates/` | City map + citystate overlays / current world scenic ownership | manual live navigation | Open active run → World with current city visible | `01`-`06` required | required | recommended | No reusable diegetic building-label plaque family currently supports readable map labels and module entry hierarchy on top of scenic ownership. | `frame-atlas-variants`, `plaque-ribbon-titleplate-family`, `overlay-mask-pack`, `shared-fx-atlas`, `world-building-label-plaques` | No deterministic harness route documented for this surface | P0 |
| `gate-trial-main` | Gate Trial main panel | Module activity screen | `src/components/screens/world/buildings/GateTrialBuildingPanel.tsx` | Current gate/trial shell + readiness/fail-safe truth surfaces | manual live navigation | Open active run → World → current city → Gate Trial | `01`-`06` required | required | recommended | No shared trial-state underlay/stamp family currently marks readiness, lock, and fail-safe states with reusable semantics across module cards. | `plaque-ribbon-titleplate-family`, `state-underlays-and-stamps`, `shared-fx-atlas` | No deterministic harness route documented for this surface | P0 |
| `forge-main` | Forge main panel | Module activity screen | `src/components/screens/ForgePanel.tsx`, `src/assets/background/forgewide_empty.png`, `src/assets/background/forgewide_unshaped.png`, `src/assets/background/forgewide_shaping.png`, `src/assets/background/forgewide_shaped.png` | Forgewide workshop room + current workshop scene ownership | manual live navigation | Open active run → World → current city → Forge | `01`-`06` required | required | recommended | No shared requirement-rail plaque family currently bridges forge scene ownership to right-side materials and progress rails with consistent hierarchy. | `frame-atlas-variants`, `plaque-ribbon-titleplate-family`, `overlay-mask-pack`, `shared-fx-atlas` | No deterministic harness route documented for this surface | P0 |
| `bounty-board-main` | Bounty Board main | Module activity screen | `src/components/screens/BountyBoardPanel.tsx`, `src/assets/background/bountyboard.png` | Bounty board scene element + posted-paper identity | manual live navigation | Open active run → World → current city → Bounties | `01`-`06` required | required | optional | No shared bounty-state stamp and recommendation underlay family currently expresses tracked/available/completed states without bespoke badge art per board card. | `plaque-ribbon-titleplate-family`, `state-underlays-and-stamps` | No deterministic harness route documented for this surface | P0 |
| `expedition-board-main` | Expedition Board main | Module activity screen | `src/components/screens/ExpeditionBoardPanel.tsx`, `src/assets/icons/hourglass_empty.png`, `src/assets/icons/hourglass_progress.png` | Current route-paper/board shell + hourglass family | manual live navigation | Open active run → World → current city → Expeditions | `01`-`06` required | required | optional | No shared route-plaque + state-stamp set currently supports readable route hierarchy and timing truth without per-row one-off decoration. | `plaque-ribbon-titleplate-family`, `state-underlays-and-stamps` | No deterministic harness route documented for this surface | P0 |

## Inherited-coverage note (not expanded rows)

The following Section C surfaces are already in baseline scaffold and may be cited when relevant to support-role proof, but are not expanded as primary P1 Wave 0 priority rows in this packet:

- `life-start-breath-focus`
- `dao-heart-study`
- `change-heart-law`

## Future support-family mapping to concrete screens and slots

### Shared families (cross-screen)

| Support family tag | Classification | Screen + slot evidence required before review | Missing-role trigger discipline |
| --- | --- | --- | --- |
| `frame-atlas-variants` | shared support | `status-main` (`01`, `03`), `world-main` (`01`, `03`), `forge-main` (`01`, `03`) | Trigger only if screenshots show repeated hierarchy breaks that current shells cannot solve without screen-local one-offs. |
| `plaque-ribbon-titleplate-family` | shared support | `life-start-path` (`01`, `02`), `dao-heart-law` (`01`, `03`), `world-main` (`01`, `02`), `gate-trial-main` (`01`, `03`), `forge-main` (`01`, `03`), `bounty-board-main` (`01`, `03`), `expedition-board-main` (`01`, `03`), `prestige-ritual` (`01`, `03`) | Trigger only when evidence shows current title hierarchy cannot be expressed with existing paper/ink and menu assets while retaining owners. |
| `overlay-mask-pack` | shared support | `cultivation-main` (`01`, `02`, `04`), `world-main` (`01`, `02`, `04`), `forge-main` (`01`, `02`, `04`) | Trigger only if owner-to-inspector transitions remain visually disjoint across multiple screens after additive proof. |
| `state-underlays-and-stamps` | shared support | `gate-trial-main` (`03`), `bounty-board-main` (`03`), `expedition-board-main` (`03`) | Trigger only if ready/locked/tracked/completed truth states cannot be distinguished with reusable semantics. |
| `shared-fx-atlas` | shared support | `cultivation-main` (`04`, `05`, `06`), `world-main` (`04`, `05`, `06`), `forge-main` (`04`, `05`, `06`), `gate-trial-main` (`04`, `05`, `06`) | Trigger only if the same intended effects require divergent one-off FX treatment across screens or reduced-motion fallback fails coherence. |

### Screen-cluster or later-only families

| Support family tag | Classification | Screen + slot evidence required before review | Honest constraint / block |
| --- | --- | --- | --- |
| `world-building-label-plaques` | screen-cluster support | `world-main` (`01`, `02`, `03`) | World-specific because map overlays and diegetic building labels are unique to world-scene geography and not global module rails. |
| `cultivation-hero-overlay-kit` | later-only hero support | `cultivation-main` (`01`, `02`, `03`, `04`, `05`, `06`) | Blocked until Wave 0 plus later pass evidence confirms current cultivator/dantian center is compositionally coherent yet still missing a support-role bridge. |
| `heart-law-altar-seal-kit` | later-only hero support | `life-start-heart-law` (`01`, `03`) and `dao-heart-law` (`01`, `03`) | Blocked until ritual shells remain compositionally coherent in evidence and a missing support role persists across both surfaces. |

## Reviewability gate for later Phase 1 packets

Later Phase 1 art/support packets are not reviewable unless they cite all of the following:

1. matrix row id(s) from this file;
2. screenshot folder path(s) under `docs/release/qa/ui-cutover/<screen-id>/`;
3. exact slot filenames used as evidence;
4. missing-role statement in operational language;
5. explicit confirmation that scenic/thematic owner remains preserved.

## Non-goals

- No screenshot generation in this packet.
- No art prompt generation in this packet.
- No UI/gameplay code changes.
- No cleanup authorization.
