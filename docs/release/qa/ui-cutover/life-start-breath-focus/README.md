# life-start-breath-focus baseline capture

- Surface id: `life-start-breath-focus`
- Family: `ritual modal`
- Harness URL: `/?uiAudit=section-c&surface=life-start-breath-focus&fx=high`
- Capture routes: `/?uiAudit=section-c&surface=life-start-breath-focus&fx=high`, `/?uiAudit=section-c&surface=life-start-breath-focus&fx=low`, `/?uiAudit=section-c&surface=life-start-breath-focus&fx=reduced`
- Reachability: **state-gated live flow** (harness uses forced pinning for deterministic capture)
- Capture status (this pass): **CAPTURE PENDING — MANUAL**
- Capture mechanism: manual screenshots only (no approved automated capture pipeline in this repo).

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required (mode selection + finish button state).
- `03-truth-states.png` — **N/A** (no separate ready/warning/recommended state family).
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- Optional: `07-narrow.png`.

## Manual capture steps
1. Open harness URL (this uses dev forced view to hold Step 3 for deterministic capture).
2. Capture base and interaction without changing production logic.
3. Capture low/reduced FX variants.
4. Resize browser for optional narrow capture.
