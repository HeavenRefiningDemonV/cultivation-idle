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

test('Gate Trial and Prestige exact surfaces expose compact Run Compass V2 projections', async () => {
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
    runCompassHint: {
      milestoneLabel: v2.milestone.label,
      blockerLabel: v2.primaryBlocker.label,
      routeLabel: v2.primaryRoute.label,
      detail: v2.prestigeHint?.detail ?? v2.primaryRoute.detail,
      active: v2.primaryRoute.target?.kind === 'tab' && v2.primaryRoute.target.tab === 'prestige',
      recentDeltaLine: null,
    },
  });

  assert.equal(gateTrial.runCompass?.milestoneLabel, v2.milestone.label);
  assert.equal(gateTrial.runCompass?.primaryRouteLabel, v2.primaryRoute.label);
  assert.equal(prestige.runCompassHint?.milestoneLabel, v2.milestone.label);
});

test('World screen wires Run Compass route keys into the world routing surface', () => {
  const source = read('src/components/screens/WorldScreen.tsx');

  assert.match(source, /useRunCompassSurface/);
  assert.match(source, /runCompassPrimaryModuleKey/);
  assert.doesNotMatch(source, /runCompassPrimaryModuleKey:\s*null/);
  assert.match(source, /const secondary = primaryTarget\?\.kind === 'world_module'/);
  assert.match(source, /allowWorldRecommendationFallback/);
  assert.match(source, /economicModuleKeys:\s*allowWorldRecommendationFallback/);
  assert.match(source, /trackedBountyModuleKey:\s*allowWorldRecommendationFallback/);
});
