# Progression Contract (Section 0 / Packet 0.1)

> This document mirrors executable contract data generated from `src/systems/progression/contract`.
>
> Packet 0.1 defines infrastructure only; it does **not** apply gameplay behavior fixes yet.
>
> Later packets must consume the shared contract and must not recreate local progression truths.

## 1) Purpose of the progression contract

Provide one canonical, typed progression truth for semester-slice live content, gate transitions, city unlocks, deferred systems, offline behavior contract, and reset/prestige hook seams.

## 2) Semester slice summary

- Slice ID: semester_0
- Label: Five-city / five-trial authored slice ending at Spirit Severing
- Live realms: qi_condensation, foundation_establishment, core_formation, nascent_soul, soul_formation, spirit_severing
- Live trials: trial_novices_clearing, trial_stone_core_sanctum, trial_patriarchs_seal, trial_soul_lantern_vault, trial_severing_court
- Live cities: city_pinewind_hamlet, city_stonecrag_town, city_spirit_cavern_city, city_lotusford, city_ironpeak_bastion

## 3) Live major realms table

| Realm ID | Index |
|---|---:|
| qi_condensation | 0 |
| foundation_establishment | 1 |
| core_formation | 2 |
| nascent_soul | 3 |
| soul_formation | 4 |
| spirit_severing | 5 |

## 4) Transition table

| From realm | To realm | Trial | Gate item | Next city unlock or cap |
|---|---|---|---|---|
| qi_condensation | foundation_establishment | trial_novices_clearing | gate_foundation_pill | city_stonecrag_town |
| foundation_establishment | core_formation | trial_stone_core_sanctum | gate_core_catalyst | city_spirit_cavern_city |
| core_formation | nascent_soul | trial_patriarchs_seal | gate_core_stabilizer | city_lotusford |
| nascent_soul | soul_formation | trial_soul_lantern_vault | gate_soul_condensate | city_ironpeak_bastion |
| soul_formation | spirit_severing | trial_severing_court | gate_severing_seal | content_cap |

## 5) City unlock table

| City ID | Unlock on realm entry |
|---|---|
| city_pinewind_hamlet | qi_condensation |
| city_stonecrag_town | foundation_establishment |
| city_spirit_cavern_city | core_formation |
| city_lotusford | nascent_soul |
| city_ironpeak_bastion | soul_formation |

## 6) Content-cap definition

- Cap realm: spirit_severing
- Cap state: end_of_slice
- Expected in-slice behavior: no implied future city/gate unlock beyond this cap.

## 7) Deferred/live systems table

| System/module | Status |
|---|---|
| ascension_realms | deferred |
| post_severing_cities | deferred |
| advanced_trial_branches | deferred |
| cross_city_world_events | deferred |

## 8) Offline contract summary

- Pipeline ID: offline_progression_v1
- Applies to: cultivation, queued_actions, expeditions
- Excludes: combat
- Max catch-up seconds: 43200
- Cultivation policy: passive_scaled_efficiency
- Cultivation base efficiency: 0.5
- Cultivation prestige efficiency per level: 0.08
- Cultivation max efficiency: 0.9
- Meditating only: false
- Full timer advancement: queued_actions, expeditions
- Summary parts: qi_gained, queued_actions, expeditions

## 9) Reset / prestige hook summary

- Path truth canonical field: selectedPath
- Path legacy aliases: lifePath
- Reset classifier buckets: per_life / permanent / hybrid / unknown
- Prestige classifier buckets: live / deferred / unknown (contract seam)
- Packet 1.6 runtime honesty overlay: visible_live / hidden_unsupported / deferred / unknown

## 10) Diagnostics categories and packet ownership

| Drift category | Owner packet |
|---|---|
| PATH_TRUTH_SPLIT | 1.2 |
| GATE_NAMESPACE_SPLIT | 1.3 |
| TRIAL_ENTRY_CONTRADICTION | 1.3 |
| CITY_UNLOCK_UNBOUND | 1.5 |
| PARTIAL_PRESTIGE_RESET | 1.7 |
| OFFLINE_PIPELINE_SPLIT | 1.8 |
| LIVE_DEFERRED_LEAK | 1.8 |
| UNKNOWN_REALM_REFERENCE | 1.5 |
| ORPHAN_GATE_ITEM | 1.3 |
| HIDDEN_PRESTIGE_RUNTIME_CONSUMER | 1.6 |
| MIGRATION_ALIAS_PRESENT | 1.3 |
| CONTENT_CAP_BREACH | 1.1 |

## 11) Test harness overview

- Scenario builders: `tests/helpers/progression/`
- Integration skeleton suites: `tests/integration/`
- Harness smoke test: `tests/contracts/progressionHarnessSmoke.test.ts`
- 0.1A diagnostics/report: `npm run progression:report`
- Focused packet 4.7–4.8 verification: `npm run test:progression-packets-4.7-4.8`
- Packet 4.7 coverage bundle:
  - loadout semester ladder + slot caps
  - loadout snapshot honesty for equipped-vs-parked assignments
  - UI drift guards for the technique library and learned-technique picker
  - technique-store integration bridges around hydrate/reset/prestige slot behavior
- Packet 4.8 coverage bundle:
  - semester technique grade policy, trait-slot caps, and rune socket caps
  - mastery XP/rank contract and Heaven-only mastery-75 secondary potency
  - tech-collection-store normalization and snapshot bridge behavior
  - drift guards keeping combat/detail UI on the shared progression contract

## 12) Future packet ownership map

- **0.2**: save/alias migration activation using legacy scenario fixtures.
- **0.3**: validator expansion to enforce contract truth across all content surfaces.
- **1.1**: contract ingestion foundations in runtime adapters.
- **1.2**: path truth unification (life-start path as mechanical truth).
- **1.3**: gate entry/reward/consumption truth unification.
- **1.4**: gate flow hardening around trial-to-breakthrough lifecycle.
- **1.5**: city unlock timing unified to realm entry.
- **1.6**: prestige tree honesty pass, hidden/deferred prestige cleanup, and runtime-consumed effect alignment.
- **1.7**: prestige/reset orchestration and per-life/permanent/hybrid enforcement.
- **1.8**: offline pipeline unification to one contract pipeline.
