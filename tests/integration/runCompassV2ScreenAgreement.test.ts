import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildCultivationExactSurfaceFromStores } from '../../src/features/cultivation/exact/buildCultivationExactSurface.js';
import { buildGateTrialExactSurfaceFromStores } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { buildPrestigeLedgerExactSurfaceFromStores } from '../../src/features/prestige/prestigeLedgerExact/buildPrestigeLedgerExactSurface.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { buildLiveRunCompassSurfaceV2 } from '../../src/systems/ui/runCompass/buildRunCompassSurfaceV2.js';
import { adaptRunCompassV2ToLegacy } from '../../src/systems/ui/runCompass/adaptRunCompassV2ToLegacy.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

async function primeRuntime() {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useGameStore.setState({ selectedPath: 'earth' });
  return content;
}

test('Status and Cultivation render projections of the same Run Compass V2 truth', async () => {
  await primeRuntime();
  const v2 = buildLiveRunCompassSurfaceV2();
  assert.ok(v2);

  const status = buildStatusDashboardSurface();
  const cultivation = buildCultivationExactSurfaceFromStores({
    mode: 'live',
    runCompassFull: adaptRunCompassV2ToLegacy(v2),
  });

  assert.equal(status.runCompass.milestoneLabel, v2.milestone.label);
  assert.equal(status.runCompass.primaryRouteLabel, v2.primaryRoute.label);
  assert.equal(cultivation.runCompassCompact?.milestoneLine, v2.milestone.label);
  assert.equal(cultivation.runCompassCompact?.actionLine.includes(v2.primaryRoute.label), true);
});

test('Gate Trial uses native readiness while Prestige keeps live-run routes silent', async () => {
  const content = await primeRuntime();
  const v2 = buildLiveRunCompassSurfaceV2();
  assert.ok(v2);
  const cityId = useCityStore.getState().currentCityId ?? content.cities[0].id;
  const gateTrial = buildGateTrialExactSurfaceFromStores(cityId, { mode: 'live' });
  const prestige = buildPrestigeLedgerExactSurfaceFromStores({
    mode: 'live',
    prestige: {
      totalAP: 0,
      lifetimeAP: 0,
      prestigeCount: 0,
      apGain: 0,
      canPrestige: false,
      contentCapReached: false,
      hasLastLifeSummary: false,
      highestRealmReached: 0,
      spiritRoot: null,
      breakdown: { availableNow: 0, totalEarned: 0, reincarnations: 0, potentialGain: 0, rows: [] },
      purchasesById: {},
    },
    game: {
      selectedPath: 'earth',
      realm: useGameStore.getState().realm,
    },
    advisor: {
      stateLabel: 'Too Early',
      stateDetail: 'Push this life to Core Formation before beginning Reincarnation.',
      resetPreview: { resetsThisLife: [], carriesForward: [], rebuiltNextLife: [] },
    },
    heartLawName: 'Quiet Breath Method',
    cityNamesReached: ['Pinewind Hamlet'],
    resolvedGateCount: 0,
    visibleUpgrades: [],
  });

  assert.equal('mandateLens' in gateTrial, false);
  assert.ok(gateTrial.minimumChecklist.rows.length > 0);
  assert.ok(gateTrial.readinessRail.nodes.length > 0);
  assert.equal((gateTrial as { runCompass?: unknown }).runCompass, undefined);
  assert.equal('runCompassHint' in prestige, false);
  assert.equal(prestige.reincarnationDecree.title, 'Reincarnation Decree');
  assert.equal(prestige.reincarnationDecree.sealState, 'locked');
  assert.equal(prestige.reincarnationDecree.primaryAction.label, 'Reincarnation Locked');
  assert.doesNotMatch(JSON.stringify(prestige), new RegExp(v2.primaryRoute.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('World screen keeps public module routing local after Dao Mandate route retirement', () => {
  const source = read('src/components/screens/WorldScreen.tsx');

  assert.doesNotMatch(source, /buildLiveDaoMandateSurfaceV1/);
  assert.doesNotMatch(source, /buildWorldMandateRoutingLensSurface/);
  assert.doesNotMatch(source, /mandatePrimaryModuleKey/);
  assert.doesNotMatch(source, /useRunCompassSurface/);
  assert.doesNotMatch(source, /inspectorRunCompassLine/);
  assert.doesNotMatch(source, /allowWorldRecommendationFallback/);
  assert.match(source, /economicModuleKeys:\s*economicPrimary\?\.cityId/);
  assert.match(source, /trackedBountyModuleKey:\s*trackedDestination\?\.kind === 'module'/);
});
