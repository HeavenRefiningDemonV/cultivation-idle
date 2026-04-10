# 04-world canonical evidence + WR-00 recovery lock

- Screen: World
- Signoff state: `DEFERRED`
- Cleanup authority: **locked**
- WR baseline/governance packet: `WR-00`
- Current acceptance packet: `WR-09`

## 1) Canonical legal cutover evidence (approval-only)

This folder is the canonical legal gate root for World approval evidence.

Required legal slots:
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`

Current status: **missing** (`01-06` not committed).

## 1.1 WR-09 legal cutover gate evaluation (G1–G8)

| criterion id | status | notes |
| --- | --- | --- |
| G1 | FAIL | Canonical screenshot set is incomplete (`01-06` missing). |
| G2 | PASS | Additive preserve-first ownership is still retained; no cleanup performed. |
| G3 | FAIL | Cannot legally certify duplicate-system absence without canonical screenshot evidence. |
| G4 | FAIL | Cannot legally certify button/label completeness without canonical screenshot evidence. |
| G5 | FAIL | High/Low/Reduced readability not certifiable without `04/05/06`. |
| G6 | FAIL | Layout-shift claims not certifiable without `02/03` interaction/truth-state captures. |
| G7 | FAIL | Gameplay-truth parity cannot be approved without evidence. |
| G8 | FAIL | Cleanup remains locked because G1–G7 did not pass. |

WR-09 decision: **DEFERRED**.

## 2) Failure baseline references (diagnostic-only)

WR-00 records the current failed World screenshot as a **failure baseline** for recovery planning and packet routing.

Failure baselines are not legal cutover proof and must never be used to satisfy `01-06` approval slots.

Reference:
- `docs/ui/world-recovery/WR-00-world-recovery-lock-and-baseline.md`

## 3) Capture / audit commands

1. `npm run release:phase0-core-capture:world` (or all-surfaces `npm run release:phase0-core-capture`)
2. `npm run release:phase0-core-evidence-audit:world` (or all-surfaces `npm run release:phase0-core-evidence-audit`)
3. Canonical route shape: `/?uiAudit=phase-0&surface=world&fx=<high|low|reduced>&slot=<slot>`

## 4) Preserve-first reminder

- Keep scenic map + city overlays as visual owner while recovery is in progress.
- Do not treat baseline failure captures as legal approval evidence.
- No destructive cleanup is legal until exact-screen gate evidence passes.
