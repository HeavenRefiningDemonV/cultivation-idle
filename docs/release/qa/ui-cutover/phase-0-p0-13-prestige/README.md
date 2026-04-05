# P0-13 Prestige recovery — review evidence

This folder tracks after-state QA artifacts for Phase 0 packet P0-13.

## Screenshot status
Automated screenshot capture is unavailable in this runtime.
Status: **MANUAL-PENDING**.

## Manual capture checklist

### Prestige main screen
1. `after-prestige-default`
2. `after-prestige-viable-or-recommended`
3. `after-ap-forecast`
4. `after-node-selected`
5. `after-top-recommendations`

### Ritual family
6. `after-ritual-modal-open`
7. `after-ritual-hold-state`
8. `after-current-chapter-exhausted`
9. `after-life-summary-current`
10. `after-life-summary-last-completed`

### Shared quality/state checks
11. `after-low-fx`
12. `after-reduced-motion`
13. `after-no-layout-shift-proof`
14. `after-visible-live-nodes-proof`

## Manual QA checks to run with captures
- Confirm Prestige reads as reincarnation/decree owner, not a generic upgrade tree.
- Confirm AP Forecast, advisor label (`Too Early` / `Viable` / `Recommended`), and reset/keep/rebuild contract are visible without hover.
- Confirm only runtime-backed visible decrees appear in main list and detail flows.
- Confirm ritual modal hold-to-confirm flow is stable (hold complete triggers, early release cancels, no hold-button/status layout jitter).
- Confirm `Current Chapter Exhausted` and life-summary entry points remain continuous with Prestige routing.
- Confirm low-FX and reduced-motion modes remain coherent and do not hide AP/reset truth.

## QA references
- `docs/ui/phase-0-p0-13-prestige-recovery.md`
- `docs/prestige-ritual-qa.md`
- `docs/release/surface_truth_audit.md`
- `docs/release/performance_smoke_checklist.md`
