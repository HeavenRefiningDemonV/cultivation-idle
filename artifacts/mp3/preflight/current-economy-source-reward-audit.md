# MP3 Current Economy / Source / Reward Audit

Generated: 2026-05-29T01:37:16+03:00

## Relevant Modules Found

| Area | Files found |
|---|---|
| Economic recommendation | `src/systems/economy/economicRecommendationEngine.ts`, `economicRecommendationTypes.ts`, `economicSnapshot.ts`, `economicShortfallEvaluator.ts`, `moduleRecommendationSummaries.ts` |
| Best-source/source-sink | `bestSourceIndex.ts`, `missingMaterialRouteResolver.ts`, `purposeSourceSurface.ts`, `resourceProvenanceSurface.ts`, `sourceSinkAudit.ts`, `targetedMaterialSinkMap.ts`, `targetedMaterialSinkAudit.ts` |
| Reward parity/runtime | `rewardParityAudit.ts`, `activityRewardAudit.ts`, `activityRewardRuntime.ts`, `activityRewardReadModel.ts`, `RewardService.ts`, `rewardSummary.ts`, `rewardsLogStore.ts` |
| Prep/readiness economy | `prepBudgetRegistry.ts`, `spendOrderPolicy.ts`, `supportCurrencyTargets.ts`, `supportEconomySurfaceModel.ts`, `supportEconomyReadModel.ts`, `prepPackageFitReadModel.ts`, `prepVsBypassReadModel.ts`, `gateFailureMeritPolicy.ts` |
| Gate readiness/failure | `src/systems/readiness/readinessRuntime.ts`, `readinessScoringEngine.ts`, `readinessScoringTypes.ts`, `failureDiagnosis.ts`, `failureDiagnosisTypes.ts`, `gateBuildFloorRegistry.ts`, `gateTrialScreenContract.ts` |
| Route/fix actions | `src/systems/ui/trials/gateTrialFixActions.ts`, `src/systems/ui/postFailure/*` |

Conclusion: MP3 should extend existing economy/readiness surfaces. A duplicate greenfield model would be wrong.

## Existing Guidance Surfaces Found

| Screen/system | Existing surface |
|---|---|
| Status | `src/systems/ui/status/statusLedgerSurface.ts`, `statusDashboardSurface.ts`, `statusTroubleshootingSurface.ts` |
| Cultivation | `src/features/cultivation/exact/buildCultivationExactSurface.ts` uses live Run Compass compact/full surfaces |
| World | `src/components/screens/WorldScreen.tsx` consumes `buildLiveEconomicRecommendationEngine()` |
| Inventory | `src/components/screens/InventoryScreen.tsx` uses `buildPurposeSourceContext`, item/currency purpose-source surfaces |
| Techniques | `src/features/techniquesExact/*`, `src/components/screens/TechniqueLibraryScreen.tsx`, `techniqueGateFitSurface.ts` |
| Manual Pavilion | `buildManualPavilionExactSurface.ts`, `manualOfferFitSurface.ts` |
| Apothecary | `buildApothecaryExactSurface.ts`, `apothecaryPrepSurface.ts` |
| Forge | `buildForgeExactSurface.ts`, `forgeFloorReadModel.ts`, `forgeFloorSurface.ts` |
| Bounties | `buildBountiesExactSurface.ts`, `bountyRouteSurface.ts`, support-economy tests |
| Expeditions | `buildExpeditionsExactSurface.ts`, `expeditionShortageSurface.ts` |
| Ruins/Outskirts | exact/planning surfaces plus activity reward read models |
| Gate Trial | `buildGateTrialExactSurface.ts`, `GateTrialBuildingPanel.tsx`, failure/top-fix surfaces |
| Prestige | `buildPrestigeLedgerExactSurface.ts` and exact screen |

## Current Reward Parity Tests Found

- `tests/contracts/rewardParityDrift.test.ts`
- `tests/integration/rewardParityRuntimeEnvelope.test.ts`
- `tests/integration/outskirtsRuinsRewardRouting.test.ts`
- `tests/integration/p3ResourceProvenanceRewardSummary.test.ts`
- `tests/contracts/resourceProvenanceSurfaceContract.test.ts`
- `tests/contracts/economySourceSinkContract.test.ts`
- `tests/contracts/bestSourceIndex.test.ts`
- `tests/contracts/moduleRoleRegistry.test.ts`
- `tests/contracts/forgeFloorSurfaceContract.test.ts`
- `tests/contracts/apothecaryPrepSurfaceContract.test.ts`
- `tests/contracts/bountySupportEconomyContract.test.ts`
- `tests/contracts/expeditionShortageSurfaceContract.test.ts`
- `tests/contracts/manualOfferFitSurfaceContract.test.ts`
- `tests/contracts/manualStudyContract.test.ts`
- `tests/integration/manualPavilionBridge.test.ts`
- `tests/integration/techniquesManualBuildGapRuntime.test.ts`
- `tests/integration/expeditionsExactActionController.test.ts`
- `tests/integration/failureDiagnosisRuntimeBridge.test.ts`

## Screens Already Consuming Economy/Readiness Models

- Status consumes live economic recommendations, gate readiness, failure diagnosis, fail-safe lifecycle, and status ledger rows.
- World consumes live economic recommendations and module summaries.
- Inventory/Technique Library consume purpose-source/provenance surfaces.
- Apothecary consumes resource provenance for prep lines.
- Expeditions consumes resource provenance for shortage lines.
- Forge consumes forge floor/delta/material route surfaces.
- Bounties consumes current blocker kind for route fit and support economy rows.
- Gate Trial consumes live readiness/top fixes/fail-safe surfaces.

## Screens That Still Need MP3 Review

- Cultivation still primarily renders Run Compass compact guidance; MP3 should add or verify one concise shared current-blocker/source line without crowding the sacred center.
- Status has command-ledger rows, but MP3 should verify the top blocker and best action are sourced from the same shared economy/readiness truth used by World/module screens.
- Gate Trial advanced lifecycle visual states remain partial; MP3 should avoid broad cutover and add only targeted proof if needed.
- Inventory and Techniques have MP2 first-run guidance; MP3 should verify item/source/sink and manual-to-technique relevance are data-backed.

## Reward Paths That Already Use RewardService

- Outskirts/Gate Trial combat rewards: `src/stores/combatStore.ts`
- Ruins rewards: `src/stores/ruinsStore.ts`
- Bounties: `src/stores/bountyStore.ts`
- Expeditions: `src/stores/expeditionStore.ts`
- Manual Pavilion purchases/rewards: `src/stores/manualPavilionStore.ts`
- Shops: `src/stores/shopStore.ts`
- Profession/craft outputs: `src/stores/professionStore.ts`, `src/stores/craftSessionStore.ts`
- Debug mega grant: `src/components/screens/SettingsScreen.tsx` via `RewardService.grantRewards`

## Suspicious Reward / Ownership Paths To Review

These are existing paths observed before MP3 source edits. They are not yet classified as MP3-caused regressions.

| Path | Concern |
|---|---|
| `src/components/screens/world/buildings/GateTrialBuildingPanel.tsx` | UI component calls `RewardService.grantRewards()` for Safety Net gate purchase. MP3 should not add more UI grant ownership. |
| `src/features/world/gateTrialExact/useGateTrialExactActionController.ts` | Action controller calls `RewardService.grantRewards()` for Gate Trial exact fail-safe path. If MP3 touches fail-safe proof, prefer moving/centralizing rather than duplicating. |
| `src/systems/ui/postFailure/postFailureFixActions.ts` | UI post-failure action grants gate reward on Safety Net purchase; review for existing lifecycle contract before changing. |
| `src/components/screens/SettingsScreen.tsx` | Debug grant path is gated by settings/debug use; not a public reward path but should stay clearly debug-only. |
| `src/stores/professionStore.ts` / `src/stores/craftSessionStore.ts` | Some spend/refund paths directly add/remove items for costs/refunds while outputs use RewardService. This may be accepted store-level crafting ownership; do not change casually in MP3. |

## Tests To Add Or Repair

- Shared `milestoneReadinessSurface` contract that wraps existing economic recommendation + readiness + failure diagnosis without duplicating logic.
- Module role registry public-copy contract covering all MP3 live modules including Status, Cultivation, World, Inventory, Techniques, and Prestige role entries or documented non-world entries.
- Best-source contract for gold, Merit, herbs/medicine, ore/materials, manual fragments, gate catalyst.
- Reward parity runtime/report test that covers existing runtime envelope and writes MP3 report rows if feasible.
- Cultivation/Status/World shared-truth contract proving the top blocker/action comes from the same economic/readiness model.
- No forbidden public Dao/Omen/Proof/Source copy leak contract for new MP3 public surfaces.

## UI Areas Where Small Copy/Chips Are Enough

- Status: top blocker, best source chips, source/sink highlights, safety-net reserve.
- Cultivation: one support line/route when the gate item or prep blocker is current.
- World: module role subtitles and recommended marker already exist; verify against `moduleRecommendationSummaries`.
- Inventory: purpose/source/sink details already exist; verify key resource families.
- Techniques/Manual Pavilion: route/study/build gap copy already partially exists; deepen with shared blocker kind.
- Apothecary/Forge/Bounties/Expeditions: keep existing exact screens and add only concise current-benefit/source lines if missing.

## Out Of Scope For MP4 / MP5 / Follow-up

- MP4: final timing bands, AP/hour, reclaim, economy ratios, first prestige timing, first-gate prep pacing.
- MP5: release gate hardening, dependency/security/observability, full waiver/GO classification.
- MP2 follow-up: Gate Trial advanced-state screenshot matrix.
- Story/tutorial/final menu polish: blocked until release truth is stable.
