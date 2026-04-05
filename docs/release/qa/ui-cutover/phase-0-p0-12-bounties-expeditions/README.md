# P0-12 Bounties & Expeditions recovery — review evidence

This folder tracks after-state QA artifacts for Phase 0 Bounties & Expeditions recovery.

## Screenshot status
Automated screenshot capture is unavailable in this runtime.
Status: **MANUAL-PENDING**.

## Manual capture checklist
1. `after-bounties-default`
2. `after-bounties-tracked`
3. `after-bounties-claim-ready`
4. `after-bounties-route-order`
5. `after-expeditions-default`
6. `after-expeditions-route-selected`
7. `after-expeditions-slot-running`
8. `after-expeditions-claim-ready`
9. `after-expeditions-ceremony`
10. `after-low-fx`
11. `after-reduced-motion`
12. `after-layout-shift-proof`
13. `after-origin-city-proof`

## Manual QA checklist (packet-specific)
- Confirm Bounty Board shows reserve summary, tracked strip, and Support/Route/Challenge note roles without opening detail modal.
- Confirm each bounty note shows direct route label or explicit blocked reason in-card.
- Confirm Expedition route cards show purpose tags + `Best when...` lines + stable CTA hints.
- Confirm Expedition slot strip shows Idle/Running/Claim-ready at a glance.
- Confirm active slot cards display origin city and claim returns proper ceremony/use-material routing.

## QA references
- `docs/ui/phase-0-p0-12-bounties-expeditions-recovery.md`
- `docs/bounties-expeditions-pass3-qa.md`
- `docs/release/surface_truth_audit.md`
- `docs/release/performance_smoke_checklist.md`
