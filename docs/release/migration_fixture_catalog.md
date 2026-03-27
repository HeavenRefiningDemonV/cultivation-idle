# Release Migration Fixture Catalog (Packet 7.2a / 7.2b)

Canonical source of truth is code: `src/save/migrations/releaseMigrationFixtureCatalog.ts`.

| Fixture ID | Group | Risk class | Why this exists | Expected primary step(s) | Expected post-apply truth |
|---|---|---|---|---|---|
| `legacy-path-conflict` | primary_risk | `path_conflict` | `selectedPath` and legacy `lifePath` disagree. | `v2_0_0_normalize_path_truth` | Canonical `selectedPath` preserved (`martial`), legacy alias no longer truth source. |
| `legacy-path-only` | compatibility | `path_alias_backfill` | Older saves only carry `lifePath`. | `v2_0_0_normalize_path_truth` | `selectedPath` backfilled (`earth`) and save remains current-version. |
| `legacy-gate-item-ids` | primary_risk | `gate_item_alias` | Pre-1.3 gate aliases must remap to canonical `gate_*` ids. | `v2_0_0_plan_gate_item_alias_migration` | No legacy gate aliases remain; canonical gate ids exist. |
| `legacy-trial-mismatch` | primary_risk | `trial_gate_contradiction` | Packet-1.4 contradiction: realm advanced but first-gate proof state is invalid. | `v2_0_0_plan_trial_resolution_normalization`, `v2_0_0_normalize_city_progression_state` | First trial resolves to `bypassed`; city progression coherent; no fake city 6. |
| `legacy-city-current-invalid` | primary_risk | `city_progression_invalid` | Packet-1.5 contradiction where current city and unlock chain disagree. | `v2_0_0_normalize_city_progression_state` | Current city valid/unlocked (`city_lotusford`), unlocks in live slice only. |
| `legacy-future-slice` | primary_risk | `over_cap_realm_slice` | Realm/city progression exceeds authored semester cap. | `v2_0_0_clamp_semester_slice`, `v2_0_0_normalize_city_progression_state` | Realm clamped to Spirit Severing, Ironpeak current city, exact five-city chain. |
| `legacy-hidden-prestige` | primary_risk | `hidden_prestige_refund` | Hidden deferred prestige purchases must be refunded/cleared. | `v2_0_0_plan_deferred_prestige_refund` | Hidden purchases removed; spendable AP restored. |
| `legacy-hidden-unsupported-prestige` | primary_risk | `hidden_prestige_refund` | Hidden unsupported prestige purchases must be refunded/cleared. | `v2_0_0_plan_deferred_prestige_refund` | Hidden purchases removed; spendable AP restored. |
| `legacy-partial-reset-residue` | primary_risk | `partial_reset_residue` | Packet-1.7 clean-life residue cleanup. | `v2_0_0_plan_partial_reset_residue_cleanup` | Pinewind baseline restored; residue surfaces cleared; permanent prestige preserved. |
| `legacy-hidden-craft-outputs` | primary_risk | `hidden_craft_outputs` | Packet-3.1 hidden/deferred craft cleanup is release-critical now. | `v2_0_0_refund_hidden_craft_outputs` | Hidden output inventory + queue/session/buff/pouch residues cleared; apply idempotent. |
| `legacy-offline-split` | primary_risk | `offline_timestamp_split` | Offline timestamp surfaces can drift and must be unified. | `v2_0_0_plan_offline_unification` | `meta.lastActiveAtMs`, `gameState.lastActiveTime`, and `gameState.lastTickTime` are aligned. |
| `current-save` | compatibility | `current_save_regression` | Ensure canonical current saves do not regress under migration path. | _(none required)_ | No false failures; final version remains current. |
| `legacy-unversioned-save` | compatibility | `legacy_unversioned_source` | Release report must expose legacy-unversioned detection while migrating output to current version. | _(none required)_ | Source kind is `legacy-unversioned`; final version current. |

## Matrix command

- Human output: `npm run release:migration-matrix`
- JSON output: `npm run release:migration-matrix:json`
- Optional subset: `npm run release:migration-matrix -- --fixture=<fixture-id>`
- Optional gate: `npm run release:migration-matrix -- --fail-on-drift`
