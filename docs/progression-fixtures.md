# Progression Fixtures (Section 0 / Packet 0.3B)

This document defines the reusable progression-fixture catalog introduced for packet 0.3B.

## Why this catalog exists

Later packets need stable, named progression states.
Without a shared catalog, each packet would rebuild ad hoc state blobs, drift from the progression contract, and lose ownership of legacy contradictions.

The fixture catalog solves that by providing:
- canonical fixture ids
- reusable metadata
- contract-scenario, save-shaped, and migration-shaped adapters
- a validation matrix tied to the 0.3A semantic validator stack
- an explicit future-packet consumer map

## Fixture kinds

- `fresh_save`: coherent new-life baseline.
- `gate_edge`: gate/trial edge states for breakthrough and city-unlock work.
- `prestige_ready`: coherent near-prestige state.
- `cap_reached`: current semester cap boundary.
- `legacy_save`: intentionally contradictory migration/save fixtures retained as regression targets.

## Canonical fixture catalog

| Fixture ID | Kind | Source | Owner | Future consumers | Expected status |
|---|---|---|---|---|---|
| `fresh-save` | fresh_save | contract_derived | 0.3B | 1.1, 1.2 | clean |
| `gate-edge-pre-first` | gate_edge | contract_derived | 0.3B | 1.3, 1.4 | clean |
| `gate-edge-post-first` | gate_edge | contract_derived | 0.3B | 1.4, 1.5 | clean |
| `prestige-ready` | prestige_ready | contract_derived | 0.3B | 1.6, 1.7, 1.8 | clean |
| `cap-reached` | cap_reached | contract_derived | 0.3B | 1.1, 1.5 | clean |
| `legacy-path-conflict` | legacy_save | migrated_legacy | 0.3B | 1.2 | warning |
| `legacy-gate-alias` | legacy_save | migrated_legacy | 0.3B | 1.3 | warning |
| `legacy-trial-mismatch` | legacy_save | migrated_legacy | 0.3B | 1.4 | clean |
| `legacy-over-cap` | legacy_save | migrated_legacy | 0.3B | 1.1 | warning |
| `legacy-hidden-prestige` | legacy_save | migrated_legacy | 0.3B | 1.6 | warning |
| `legacy-partial-reset-residue` | legacy_save | migrated_legacy | 0.3B | 1.7 | warning |
| `legacy-offline-split` | legacy_save | migrated_legacy | 0.3B | 1.8 | warning |

## Legacy fixture warning semantics

Legacy fixtures intentionally preserve contradictions that later packets must clean up.
Current expected categories are:

- `legacy-path-conflict` → `PATH_TRUTH_SPLIT`
- `legacy-gate-alias` → `MIGRATION_ALIAS_PRESENT`
- `legacy-over-cap` → `CONTENT_CAP_BREACH`
- `legacy-hidden-prestige` → `HIDDEN_PRESTIGE_RUNTIME_CONSUMER`
- `legacy-partial-reset-residue` → `PARTIAL_PRESTIGE_RESET`
- `legacy-offline-split` → `OFFLINE_PIPELINE_SPLIT`

These warnings are intentional and should not be “fixed” by mutating the migration-input fixtures unless the owning packet lands. For packet 1.2 specifically, canonical scenario/save truth is `selectedPath`, while `lifePath` is retained only in intentionally legacy alias fixtures. For packet 1.3, legacy gate aliases remain valid migration inputs, but canonical save-shape/current-shape outputs should use `gate_*` item ids. For packet 1.4, canonical save-shape/current-shape outputs should preserve explicit trial lifecycle state (`none`, `cleared`, `bypassed`) instead of flattening every resolved gate into one ambiguous bucket. `legacy-trial-mismatch` stays in the catalog as a migration-owned contradiction fixture even though the semantic validator does not classify it as a standalone warning category.

## Adapter model

The catalog supports three layers:

1. **Contract scenario adapter**
   - exposes a `ProgressionScenario` view for contract-level tests.
   - packet 1.4 scenarios preserve `resolutionByTransitionId` so true clears stay distinct from legacy bypasses.
2. **Save-shape adapter**
   - exposes a save-like object for tests that want serialized progression state without booting full runtime stores.
   - packet 1.4 save shapes emit canonical trial lifecycle state (`eligibleFailures`, `resolution`, `bypassedAt`) rather than the older `attempts + cleared` shape alone.
   - packet 1.5 save shapes now preserve canonical city progression state (`currentCityId`, `unlockedCityIds`, `selectedModuleByCity`, `cityFlagsById`) instead of treating city truth as an omitted or guessed current-save detail.
3. **Migration fixture adapter**
   - exposes migration-shaped inputs for validator and migration-path coverage.

Not every consumer needs every layer, but the catalog standardizes how to ask for them.
When projecting intentionally incomplete legacy save inputs back into a contract scenario, city unlock inference from entered realms remains a backward-compat fallback only; canonical current-shape outputs should carry explicit city truth now that packet 1.5 owns it.

## Future packet consumer map

- **1.1** → `fresh-save`, `cap-reached`, `legacy-over-cap`
- **1.2** → `fresh-save`, `legacy-path-conflict`
- **1.3** → `gate-edge-pre-first`, `legacy-gate-alias`
- **1.4** → `gate-edge-pre-first`, `gate-edge-post-first`, `legacy-trial-mismatch`
- **1.5** → `gate-edge-post-first`, `cap-reached`
- **1.6** → `prestige-ready`, `legacy-hidden-prestige`
- **1.7** → `prestige-ready`, `legacy-partial-reset-residue`
- **1.8** → `prestige-ready`, `legacy-offline-split`

## Scripts

Developer-only scripts:

- `npm run progression:fixtures`
  - list fixture ids, descriptions, owners, and tags.
  - optional filters: `--packet=<packet>` and `--tag=<tag>`.
  - optional `--json` for machine-readable output.
- `npm run validate:progression-fixtures`
  - validate every fixture against the 0.3A semantic validator stack.
  - optional `--json` output.
- `npm run progression:matrix`
  - print the validation matrix in human-readable form.

## Validation relationship to 0.3A

The matrix reuses the progression semantic validator from packet 0.3A.
That means fixture validation is anchored to the same contract truth used for diagnostics, rather than a second hand-written ruleset.

## Rules for adding a new fixture later

When adding a fixture:
1. give it a stable id and a clear description;
2. declare owner packet and future consumer packets;
3. define expected issue categories if it is intentionally legacy;
4. prefer reusing migration fixtures rather than inventing duplicate save blobs;
5. ensure the matrix passes and update this document.
