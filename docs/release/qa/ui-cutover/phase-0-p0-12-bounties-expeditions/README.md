# P0-12 Bounties & Expeditions recovery — review evidence

This folder tracks after-state QA artifacts for Phase 0 packet P0-12.

## Screenshot status
Automated screenshot capture is unavailable in this runtime.
Status: **MANUAL-PENDING**.

## Manual capture checklist

### Bounties
1. `after-bounties-default`
2. `after-bounties-tracked`
3. `after-bounties-claim-ready`
4. `after-bounties-route-order`

### Expeditions
5. `after-expeditions-default`
6. `after-expeditions-route-selected`
7. `after-expeditions-slot-running`
8. `after-expeditions-claim-ready`
9. `after-expeditions-ceremony`

### Shared / quality tiers
10. `after-low-fx`
11. `after-reduced-motion`
12. `after-no-layout-shift-proof`
13. `after-city-locality-origin-memory-proof`

## Manual QA checks to run with captures
- World entry route: open both boards from `WorldBuildingModal` and verify board-owner identity remains dominant.
- Bounties: verify run compass, Merit reserve, tracked strip above offers, 3-offer readability, role labels, route CTA, and no state resize.
- Expeditions: verify run compass, top slot strip, Forage/Mine/Scout route cards, purpose + best-when lines, duration choices, claim-ready/ceremony flow.
- Locality/origin checks: track in one city then switch; start expedition in one city then claim from another and confirm origin city remains explicit.
- Motion checks: default, Low FX, Reduced Motion remain coherent without comprehension-critical animation.

## QA references
- `docs/ui/phase-0-p0-12-bounties-expeditions-recovery.md`
- `docs/bounties-expeditions-pass3-qa.md`
- `docs/release/surface_truth_audit.md`
- `docs/release/performance_smoke_checklist.md`
