# Section C Baseline Screenshot Index (Packet C.0)

This file is the master tracker for Section C baseline capture.

## Current Phase 3 owner-truth pointer
- Use `docs/ui/phase-3-repo-truth-register.md` as the current owner/reachability authority for Phase 3 prompts.
- This index remains baseline capture tracking and does not unlock cleanup authority.

## Run context
- Harness gate: `import.meta.env.DEV` + `?uiAudit=section-c`.
- Baseline work only; no cleanup approval is granted by this file.
- Environment status for this pass: **CAPTURE PENDING — MANUAL** (no browser/image artifact tool available in this Codex runtime).

## Surface tracker
| surface id | human label | family | harness route | capture status | reachability | most important retained old layer | likely next packet | blocker summary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `life-start-path` | Life Start Path (Step 1) | life-start ritual sequence | `/?uiAudit=section-c&surface=life-start-path&fx=high` | CAPTURE PENDING — MANUAL | live | Full-height triptych + path portrait ownership (`path_heaven 1.png`, `path_earth 1.png`, `path_martial 1.png`). | C.1 | No blocker beyond capture pending. |
| `life-start-heart-law` | Life Start Heart Law (Step 2) | ritual modal | `/?uiAudit=section-c&surface=life-start-heart-law&fx=high` | CAPTURE PENDING — MANUAL | live | `InkModalFrame` + paper card/chip material stack and live unlock truth. | C.1 | Generic card-grid treatment still present. |
| `life-start-breath-focus` | Life Start Breath Focus (Step 3) | ritual modal | `/?uiAudit=section-c&surface=life-start-breath-focus&fx=high` | CAPTURE PENDING — MANUAL | state-gated (forced hold for capture) | Existing breath mode choices and finish action inside life-start ritual shell. | C.4 | Surface is live but transient; harness forced hold is still needed for deterministic screenshot timing. |
| `dao-heart-law` | Dao Heart — Heart Law tab | ritual modal | `/?uiAudit=section-c&surface=dao-heart-law&fx=high` | CAPTURE PENDING — MANUAL | live | DaoHeart modal scroll shell + dao-element wash + atmospheric FX layers + active radial verse ring reading plane. | C.2 | Manual evidence capture is still pending. |
| `dao-heart-study` | Dao Heart — Study tab | ritual modal | `/?uiAudit=section-c&surface=dao-heart-study&fx=high` | CAPTURE PENDING — MANUAL | live but awkward | Current tab shell and Study widget integration inside DaoHeart modal. | C.3 | Study surface still visually uneven vs surrounding modal language. |
| `change-heart-law` | Change Heart Law overlay | ritual modal | `/?uiAudit=section-c&surface=change-heart-law&fx=high` | CAPTURE PENDING — MANUAL | gated by another state | Existing warning/cost/option truth and modal interaction flow. | C.5 | Uses existing `ChangeHeartLawModal.scss` treatment but still reads generic for ritual consequence emphasis. |
| `prestige-ritual` | Prestige Reincarnation Ritual | ritual modal | `/?uiAudit=section-c&surface=prestige-ritual&fx=high` | CAPTURE PENDING — MANUAL | live | `RitualModalFrame` + hold-to-confirm + reset/carry/rebuilt truth and AP breakdown structure. | C.6 | Visual polish debt remains, but truth structure is strong. |
| `current-chapter-exhausted` | Current Chapter Exhausted | ritual modal | `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=high` | CAPTURE PENDING — MANUAL | gated by another state | `RitualModalFrame` with concise chapter-cap truth and three clear actions. | C.7 | Modal-family polish target; content truth already clear. |
| `life-summary` | Life Summary (`current`) | ritual modal | `/?uiAudit=section-c&surface=life-summary&fx=high` | CAPTURE PENDING — MANUAL | gated by another state | `RitualModalFrame` + current-life summary blocks + advisor/AP truth rows. | C.8 | Visual finish and density balancing remain for later packet. |

## Capture discipline notes
- Do not create placeholder PNGs.
- Record true `N/A` slots in per-surface README files.
- Optional narrow capture may use `07-narrow.png`.
- Cleanup packets must use `docs/release/ui_screen_signoff_sheet.md` only after additive implementation and real screenshot evidence are complete.

## C.12 closeout comparison note (2026-03-31)

- C.0 baseline artifacts are still **not present as image files** in-repo for the nine Section C targets.
- C.12 therefore compares against the current additive worktree state and records this as an evidence limitation in the signoff sheet.
- No destructive cleanup is unlocked from this index alone; explicit per-screen cutover approval is still required.

## C.12R-A audit-readiness note (2026-03-31)

- Canonical evidence mapping now lives in `src/dev/sectionCAudit/sectionCEvidenceManifest.ts`.
- Machine audit command is available via `npm run release:section-c-evidence-audit` (and `:json` variant).
- Expected current result remains **FAIL** until manual PNG evidence is added to each target folder and reviewed by a human reviewer.

## Legacy packet-name crosswalk
- Legacy C.x naming can be used for chronology only; targeting should use canonical surface IDs (`life-start-path` ... `life-summary`) and current owner map in the Phase 3 repo-truth register.
- Historical "Path Selection" wording maps to `life-start-path` under `LifeStartWizardModal`, not a standalone `PathSelectionModal`.

## C.12R-B ingest note (2026-03-31)

- Re-ran `npm run release:section-c-evidence-audit -- --json`.
- Result remained `overallPass: false`; required PNG artifacts are still missing across all nine target folders.
- Section C stays additive and deferred pending real evidence files plus human reviewer signoff.
