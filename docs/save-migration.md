# Save Migration Framework (Semester v2.0.0)

This document describes the Section 0 save migration framework and the first populated semester migration pack.

## Current save version

- Current save version: `2.0.0`

## Active transform steps

- `v2_0_0_seed_version_and_meta`
  - stamps `version: 2.0.0`
  - normalizes `meta.lastActiveAtMs`
- `v2_0_0_normalize_path_truth`
  - backfills canonical `selectedPath` from legacy `lifePath` when needed
  - resolves conflicts deterministically to canonical `selectedPath`
  - removes legacy `lifePath` from migrated current-save output after it has been consumed

## Active/reporting coverage

| Step ID | Kind | Owner packet | Purpose |
|---|---|---|---|
| `v2_0_0_plan_gate_item_alias_migration` | transform | `1.3` | detect legacy gate item IDs, report the normalization plan, and remap quantities into canonical `gate_*` IDs on apply |
| `v2_0_0_plan_semester_slice_clamp` | plannedTransform | `1.1` | detect out-of-slice progress and report the clamp plan |
| `v2_0_0_clamp_semester_slice` | transform | `1.1` | clamp legacy over-cap realm truth to Spirit Severing and normalize cap-facing fields |
| `v2_0_0_normalize_city_progression_state` | transform | `1.5` | backfill and normalize `cityState` from canonical realm-entry city unlock truth, including current city and default selected modules |
| `v2_0_0_plan_deferred_prestige_refund` | transform | `1.6` | detect hidden/deferred prestige purchases, compute refund totals, clear refunded purchases on apply, and restore spendable AP in `prestigeState.totalAP` |
| `v2_0_0_plan_trial_resolution_normalization` | transform | `1.4` | detect contradictory first-gate progression state and normalize it to an honest bypassed resolution on apply |
| `v2_0_0_plan_partial_reset_residue_cleanup` | plannedTransform | `1.7` | detect clean-life residue across per-life stores |
| `v2_0_0_plan_offline_unification` | reportOnly | `1.8` | detect split offline metadata surfaces |

## Fixture catalog

See `tests/migrations/fixtures/README.md` for the complete list.

Key fixtures:
- `legacy-path-only`
- `legacy-path-conflict`
- `legacy-gate-item-ids`
- `legacy-city-current-invalid`
- `legacy-future-slice`
- `legacy-hidden-prestige`
- `legacy-hidden-unsupported-prestige`
- `legacy-trial-mismatch`
- `legacy-partial-reset-residue`
- `legacy-offline-split`

## How later packets should handle the remaining planned transforms

- Add/adjust step logic in `src/save/migrations/steps/v2_0_0/`
- Keep packet-owned transform/reporting behavior aligned with shipped runtime truth so dry-run and apply reports remain trustworthy
- Keep owner-packet strings accurate so dry-run reports remain trustworthy
- Packet 1.4 now owns legacy first-gate mismatch normalization; apply mode should mark the gate as `bypassed` instead of fabricating a combat clear or retroactive gate proof.
- Packet 1.5 now owns city progression support-layer normalization; apply mode should backfill missing or contradictory `cityState` from the entered realm, keep `currentCityId` valid, seed `selectedModuleByCity` to `outskirts`, and never imply a city beyond Ironpeak Bastion.
- Packet 1.6 now owns prestige tree honesty in the support layer; apply mode should refund hidden/deferred prestige purchases from content-defined upgrade costs, clear refunded `prestigeState.purchasesById` entries, restore spendable AP to `prestigeState.totalAP`, and leave dry-run/report output transparent about the node ids and refund totals.
- Packet 1.8 now owns offline pipeline unification; keep split offline metadata surfaces report-only until that packet lands.

## Dry-run command examples

- Human-readable fixture run:
  - `npm run migration:dry-run -- --fixture=legacy-hidden-prestige`
- JSON report output:
  - `npm run migration:report -- --fixture=legacy-gate-item-ids`
- Arbitrary file input:
  - `npm run migration:dry-run -- --file=./my-save.json`
