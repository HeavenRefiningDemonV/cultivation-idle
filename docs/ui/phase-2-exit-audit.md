# P2-14 — Phase 2 exit audit

## A) Title, purpose, and dependency basis

### Packet title
P2-14 — Phase 2 exit audit and Phase 3 handoff.

### Objective
Close Phase 2 with explicit repo-truth: what landed, what is frozen, what evidence exists, what is still missing, and what Phase 3 must not bypass.

### Why now
Phase 2 now has packet docs through P2-13 plus broad contract coverage, but a single closeout authority doc is required so later packets do not infer cleanup authority or fabricate proof assumptions.

### Dependency chain used
Primary Phase 2 docs present and used:
- `docs/ui/phase-2-p2-01-runtime-split.md`
- `docs/ui/phase-2-p2-02-screen-fx-contract.md`
- `docs/ui/phase-2-p2-04-token-sheet.md`
- `docs/ui/phase-2-p2-05-material-primitive-convergence.md`
- `docs/ui/phase-2-p2-06-shell-api-freeze.md`
- `docs/ui/phase-2-p2-07-ribbon-dock-convergence.md`
- `docs/ui/phase-2-p2-08-inspector-panel-drawer.md`
- `docs/ui/phase-2-p2-09-ritual-modal-contract.md`
- `docs/ui/phase-2-p2-10-secondary-consumer-containment.md`
- `docs/ui/phase-2-p2-11-quality-tier-matrix.md`
- `docs/ui/phase-2-p2-12-no-layout-shift.md`
- `docs/ui/phase-2-p2-13-proof-surface-normalization.md`
- `docs/ui/phase-2-proof-surface-matrix.md`

Fallback authorities also used:
- `docs/ui/phase-0-p0-15-exit-audit-and-handoff.md`
- `docs/ui/phase-1-exit-audit.md`
- `docs/ui/phase-1-phase2-handoff.md`
- `docs/ui/section-a-cutover-gate.md`
- `docs/ui/section-a-screenshot-approval-workflow.md`
- `docs/ui/section-a-definition-of-done-registry.md`
- `docs/release/ui_screen_signoff_sheet.md`
- `docs/release/ui_cutover_red_flags.md`

### Git/audit basis
- branch: `work`
- short commit at audit start: `cbcf65a`
- HEAD detached: no
- working tree at audit start: clean

### Phase 2 doc existence audit
- Present: P2-01, P2-02, P2-04..P2-13 packet docs and proof matrix/register docs.
- Alias drift in external plans: `phase-2-p2-06-framecard-plaqueheader.md` and `phase-2-p2-10-scenic-label-contract.md` are non-canonical names.
- Inference policy used: where packet-name mismatch existed, this audit used live repo truth from implementation + tests + existing packet docs (`p2-06-shell-api-freeze`, `p2-10-secondary-consumer-containment`) instead of inventing missing history.

## B) Verdict summary

### Status vocabulary used in this audit
- `green`: landed, evidenced, and contract-consistent for Phase 2 closeout scope.
- `partial`: landed in repo but still carries explicit evidence, naming, or watchpoint debt.
- `blocked`: required closeout proof is missing for legal cutover certainty.
- `absent`: no packet-level or capability-level repo truth found.

### Top-line Phase 2 verdict
**Phase 2 verdict: `partial` (handoff-eligible, cleanup-ineligible).**

### Rationale
- Shell/FX/no-shift/proof-surface contracts are materially landed and broad contract coverage exists.
- Evidence roots are real but still mostly README + route instructions with missing committed PNG captures.
- Therefore Phase 3 can inherit frozen contracts, but Phase 2 does not grant blanket cleanup authority.

### "Done enough to hand off" means
- later packets may assume frozen shared-shell and proof-surface contract boundaries;
- later packets may use existing harness routes/manifests as canonical audit infrastructure;
- later packets must keep preserve-first, DOM-truth, no-bypass rules.

### "Done enough to hand off" does NOT mean
- cleanup approval for old scenic/base layers;
- that screenshot evidence is complete;
- that support-art scaffold roots are now packaged art.

## C) Packet status matrix (P2-00..P2-13)

| Packet | Intended purpose | Observed repo truth | Status | Evidence basis | Key follow-up / watchpoint |
| --- | --- | --- | --- | --- | --- |
| P2-00 | Phase 2 entry/governance | No explicit `p2-00` doc; governance is inferred through packet register + existing Section A/Phase 0+1 handoff doctrine. | partial | `phase-2-packet-register.md`, `section-a-*`, phase handoff docs | Keep explicit naming in future packet plans; avoid implicit packet ids. |
| P2-01 | Runtime split | Runtime-split doc exists and FX/runtime contracts are present in code/tests. | green | `phase-2-p2-01-runtime-split.md`, `src/ui/fx/*`, `tests/contracts/fx*` | Maintain no-bypass runtime ownership in later packets. |
| P2-02 | Screen FX contract | Screen FX contract doc exists; `ScreenFxStage`/`FxStagePortal` adoption is present on primary FX proof screens. | green | `phase-2-p2-02-screen-fx-contract.md`, `CultivateScreen`, `StatusScreen` | Keep screen-owner primacy; no forced FX rollout to non-owned screens. |
| P2-03 | Shared motion token normalization | Dedicated P2-03 doc now exists and codifies shared motion token normalization doctrine. | partial | `phase-2-p2-03-shared-motion-token-normalization.md`, `src/ui/motion/*`, P2-11/P2-12 docs | Keep motion normalization additive and preserve reduced-motion/no-shift law. |
| P2-04 | Token sheet | Token-sheet doc exists and structural token expansion landed. | green | `phase-2-p2-04-token-sheet.md`, `src/styles/paperInkTokens.scss` | Later packets must consume, not fork, token families. |
| P2-05 | Material primitive convergence | `ui/ink` canonicalization + `ui/paper` compatibility layer is landed and test-guarded. | green | `phase-2-p2-05-material-primitive-convergence.md`, `src/ui/ink/*`, `src/ui/paper/*`, contracts | Keep compatibility wrappers thin; no third primitive family. |
| P2-06 | Frame/plaque/shell API freeze | Canonical doc is `shell-api-freeze`; legacy alias `framecard-plaqueheader` tracked as naming drift only. | green | `phase-2-p2-06-shell-api-freeze.md`, shell freeze contracts | Naming mismatch documented; freeze truth itself is present. |
| P2-07 | Ribbon/dock convergence | Top ribbon + bottom dock compatibility contracts are present and tested. | green | `phase-2-p2-07-ribbon-dock-convergence.md`, `BottomTabBar`, `BottomNavDock` tests | Preserve tab order/canonical labels and no-shift behavior. |
| P2-08 | Inspector panel/drawer | Inspector contract exists and world proof-surface wiring is stable. | green | `phase-2-p2-08-inspector-panel-drawer.md`, `WorldScreen`, inspector contracts | Keep map owner dominant; inspector remains contextual. |
| P2-09 | Ritual modal contract | Ritual modal frame contract is landed and used by proof modals. | green | `phase-2-p2-09-ritual-modal-contract.md`, modal sources, contracts | Keep ritual truth readable in DOM; no modal-local clone primitives. |
| P2-10 | Scenic-label/secondary containment | Canonical doc is `secondary-consumer-containment`; scenic-label alias tracked as naming drift only. | green | `phase-2-p2-10-secondary-consumer-containment.md`, consumer guard tests | Naming mismatch documented; do not promote secondary screens silently. |
| P2-11 | Quality tier matrix | Quality-tier doc exists with high/low/reduced contract truth in runtime/tests. | green | `phase-2-p2-11-quality-tier-matrix.md`, FX quality contracts | Medium-mode evidence routing remains an explicit watchpoint where absent. |
| P2-12 | No-layout-shift contract | Reservation/no-shift doctrine and contracts are present. | green | `phase-2-p2-12-no-layout-shift.md`, no-layout-shift contract tests | Carry no-shift law into all new screen-phase work. |
| P2-13 | Proof-surface normalization | Primary/secondary proof matrix + contracts exist; boundaries are explicit. | green | `phase-2-p2-13-proof-surface-normalization.md`, `phase-2-proof-surface-matrix.md`, proof-surface tests | Keep primary set fixed unless a later packet explicitly extends it. |

## D) Capability freeze matrix

| Capability family | Phase 2 state | Status | Canonical source | Watchpoint |
| --- | --- | --- | --- | --- |
| Runtime split / FX stage contract | Frozen + canonical | green | `p2-01`, `p2-02`, `src/ui/fx/*`, FX contracts | Keep ownership boundaries; no generic scenic takeover. |
| Motion token normalization | Explicit and documented | partial | `p2-11`, `p2-12`, `src/ui/motion/*` | Maintain shared token authority; avoid local motion-token forks. |
| Token sheet / structural tokens | Frozen + canonical | green | `p2-04`, `paperInkTokens.scss` | Avoid local token forks. |
| Material primitive convergence | Canonical `ui/ink`, `ui/paper` compatibility shim | green | `p2-05`, material contracts | Keep shim compatibility-only. |
| FrameCard / PlaqueHeader | Frozen API family under shell freeze | green | `p2-06`, shell contracts | No ad-hoc local frame clones. |
| TopRibbon / BottomNavDock | Frozen and adopted | green | `p2-07`, `BottomTabBar` | No tab-order drift. |
| InspectorPanel / InspectorDrawer | Frozen and adopted on world proof surface | green | `p2-08`, world inspector contracts | Preserve map ownership primacy. |
| RitualModalFrame | Frozen and adopted by proof modals | green | `p2-09`, ritual contracts | Preserve title/consequence/action hierarchy. |
| ScenicLabel | Present/frozen as shell primitive but not global promotion authority | partial | shell contracts + world usage | Keep bounded to legal owners; no casual spread. |
| Quality tiers / reduced motion | Frozen quality contract | green | `p2-11`, FX quality contracts | Evidence-mode coverage remains uneven in screenshot roots. |
| No-layout-shift / reservation contract | Frozen and contract-tested | green | `p2-12`, no-shift contracts | Track remaining local drift debt as later watchpoints. |
| Proof-surface normalization | Primary/secondary classification frozen | green | `p2-13`, proof matrix/contracts | No silent primary-set expansion. |
| Support-art package readiness | Scaffold-only in canonical support roots | blocked | Phase 1 exit + support root READMEs | Later packets must not imply packaged binaries exist. |

## E) Proof-surface verdict

### Primary proof surfaces

| Surface | Owner that must remain intact | Shell primitives in use | FX path | Canonical route / evidence path | Signoff state | Remaining watchpoints | Phase 2 proof quality |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WorldScreen | world map + city routing owner | TopRibbon + InspectorPanel/Drawer + RunCompass | none | `/?uiAudit=phase-0&surface=world&fx=*`; `phase-0-core-screens/04-world` | deferred | root overlap with `world-main`; no committed PNG slots | partial |
| CultivateScreen | altar/cultivator center | RunCompassCompact (support lane) | ScreenFxStage + FxStagePortal | `/?uiAudit=phase-0&surface=cultivation&fx=*`; `phase-0-core-screens/02-cultivation` | deferred | overlap with `cultivation-main`; no committed PNG slots | partial |
| StatusScreen | diagnostic-center owner | RunCompass + StatusSummaryHeader | ScreenFxStage + FxStagePortal | `/?uiAudit=phase-0&surface=status&fx=*`; `phase-0-core-screens/03-status` | deferred | overlap with `status-main`; no committed PNG slots | partial |
| PrestigeScreen | decree/reincarnation owner | TopRibbon + PaperStamp + RunCompassCompact | none | `/?uiAudit=phase-0&surface=prestige&fx=*`; `phase-0-core-screens/10-prestige` | deferred | no committed PNG slots | partial |
| PrestigeRitualModal | ritual consequence truth | RitualModalFrame | none | `/?uiAudit=section-c&surface=prestige-ritual&fx=*`; `prestige-ritual/` | deferred | no committed PNG slots | partial |
| CurrentChapterExhaustedModal | authored-cap consequence truth | RitualModalFrame | none | `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=*`; `current-chapter-exhausted/` | deferred | no committed PNG slots | partial |
| LifeSummaryModal | life-summary truth | RitualModalFrame | none | `/?uiAudit=section-c&surface=life-summary&fx=*`; `life-summary/` | deferred | no committed PNG slots | partial |
| ChangeHeartLawModal | rewrite consequence truth | RitualModalFrame | none | `/?uiAudit=section-c&surface=change-heart-law&fx=*`; `change-heart-law/` | deferred | no committed PNG slots | partial |
| BottomTabBar | dock/tab owner | BottomNavDock compatibility wrapper | none | runtime surface + `layoutInteractionStabilityMatrix` + visual manifest tracking | pending reviewer signoff | dock screenshot slots currently represented through core-screen captures, not standalone folder | partial |

### Secondary already-opted-in compact consumers
- Classified as **secondary** only: ApothecaryPanel, BountyBoardPanel, ExpeditionBoardPanel, ManualPavilionPanel, TechniqueLibraryScreen, OutskirtsBuildingPanel, RuinsBuildingPanel, ForgeWorkshop.
- Current state: tolerated/normalized under Phase 2 contracts but **not promoted** into the primary proof set.
- Local drift remains a later packet concern where present.

## F) Evidence-root normalization

### Canonical Phase 2 proof references (chosen)
- Core screen proofs: `docs/release/qa/ui-cutover/phase-0-core-screens/*` (for world/cultivation/status/prestige and core compact-screen captures).
- Ritual/modal proofs: `docs/release/qa/ui-cutover/{prestige-ritual,current-chapter-exhausted,life-summary,change-heart-law}` + Section C routes.
- Baseline references only (not canonical proof for P2 primary surfaces): `world-main`, `cultivation-main`, `status-main`, `phase-0-p0-0X-*` folders.

### Overlap classification
- `cultivation` vs `cultivation-main`: canonical = phase0 core; `cultivation-main` = adjacent baseline/manual reference.
- `status` vs `status-main`: canonical = phase0 core; `status-main` = adjacent baseline/manual reference.
- `world-main` vs `phase-0-core-screens/04-world`: canonical = phase0 core; `world-main` = adjacent baseline/manual reference.
- `phase-0-core-screens` vs `phase-0-p0-0X`: canonical = phase0 core; `phase-0-p0-0X` = legacy packet-era reference roots.
- Section C modal roots remain canonical for ritual proof modals.

No evidence folders were removed in this packet.

## G) Support-art reality statement
- Phase 1 canonical support-art roots remain scaffold-only/readme-first unless packaged binaries are explicitly present.
- Phase 2 shell completion does **not** imply scenic replacement authority.
- CSS/fallback shell/material systems remain legal and required where support-art binaries are absent.
- Later packets must still pass preserve-first and exact-screen cutover approval before any destructive layer removal.

## H) Carry-forward watchpoints (explicit)
- Verse mini bar placement: later screen-family watchpoint (cultivation/status UX pass), not auto-owned by Phase 2 closeout.
- Lotus cultivation-state icon scale/state logic: later cultivation-focused packet watchpoint.
- Remaining blue/gradient residue: later visual cleanup packet watchpoint under no-shift law.
- Manual spine/technique/collapsible layout-shift debt: later dense-management packet watchpoint.
- Custom icon pass debt: later icon/asset follow-through watchpoint.
- Heart Law / Dao Heart bespoke treatment: later ritual/life-start family watchpoint; not resolved by shell freeze alone.

## I) Cleanup authority statement
- Phase 2 completion does not grant mass cleanup authority.
- Later screen packets must still pass exact-screen cutover gate.
- Old scenic/base layers remain until screen-specific approval is recorded.
- P2-14 is an audit + handoff boundary, not a cleanup license.
