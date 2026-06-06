import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLiveEconomicRecommendationEngine,
  buildMilestoneReadinessScreenGuidance,
  buildMilestoneReadinessSurface,
  getMilestoneActivityRoleEntries,
} from '../../src/systems/economy/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import { useExpeditionStore } from '../../src/stores/expeditionStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import {
  getValidatedEconomicContent,
  primeContentStore,
  resetEconomicRuntimeStores,
} from '../helpers/economy/setupEconomicRuntimeScenario.js';

let contentPromise: ReturnType<typeof getValidatedEconomicContent> | null = null;
async function getContent() {
  if (!contentPromise) contentPromise = getValidatedEconomicContent();
  return contentPromise;
}

async function primeFreshRuntime() {
  const content = await getContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useCityStore.setState({
    currentCityId: 'city_pinewind_hamlet',
    unlockedCityIds: ['city_pinewind_hamlet'],
    selectedModuleByCity: { city_pinewind_hamlet: 'outskirts' },
  });
  useGameStore.setState({
    realm: { index: 0, substage: 3, name: 'Qi Condensation' },
    selectedPath: 'earth',
  });
  useExpeditionStore.getState().hydrate({ slots: 1, active: [], rareProgressByKey: {} }, 0);
  return content;
}

const forbiddenDefaultPublicLabels = [
  'Current Omen',
  'Gate Proof',
  'Recent Omens',
  'Source Thread',
  'Proof Detail',
  'Preparation Health',
  'Mandate Lens',
  'Module Source-Sink',
  'Threshold Omen',
  'Dao Mandate Interface',
];

test.beforeEach(async () => {
  await primeFreshRuntime();
});

test('MP3 milestone surface ranks the fresh gate blocker and routes to the same best source as the economy engine', () => {
  const engine = buildLiveEconomicRecommendationEngine();
  const surface = buildMilestoneReadinessSurface({ engine, generatedAtMs: 1234 });

  assert.equal(surface.schemaVersion, 'milestone-readiness-surface-v1');
  assert.equal(surface.generatedAtMs, 1234);
  assert.equal(surface.currentCityId, 'city_pinewind_hamlet');
  assert.equal(surface.currentCityName, 'Pinewind Hamlet');
  assert.equal(surface.currentRealmName, 'Qi Condensation');
  assert.equal(surface.currentMilestone.targetRealmName, 'Foundation Establishment');
  assert.equal(surface.currentMilestone.gateId, 'trial_novices_clearing');
  assert.equal(surface.currentMilestone.status, 'blocked');

  assert.ok(surface.currentBlocker, 'fresh gate should expose a primary blocker');
  assert.equal(surface.currentBlocker?.id, engine.orderedShortfalls[0]?.id);
  assert.equal(surface.currentBlocker?.blockerType, 'healing_floor');
  assert.equal(surface.currentBlocker?.bestSource?.moduleKey, 'apothecary');
  assert.equal(surface.currentBlocker?.routeAction.moduleKey, 'apothecary');
  assert.match(surface.currentBlocker?.expectedBenefit ?? '', /readiness|survival|pouch/i);
  assert.ok(surface.currentBlocker?.fallbackSource, 'best-source surface should expose a fallback when one exists');

  assert.equal(surface.bestActions[0]?.destinationModuleKey, engine.topRecommendation?.destinationModuleKey);
  assert.equal(surface.bestActions[0]?.routeAction.moduleKey, engine.topRecommendation?.destinationModuleKey);
  assert.ok(surface.sourceSinkHighlights.some((entry) => entry.id === 'cons_healing_pellet_t1'));
});

test('MP3 screen guidance slices preserve one shared blocker truth across Status, Cultivation, Gate Trial, and World', () => {
  const surface = buildMilestoneReadinessSurface({
    engine: buildLiveEconomicRecommendationEngine(),
    generatedAtMs: 5678,
  });
  const guidance = buildMilestoneReadinessScreenGuidance(surface);

  assert.equal(guidance.status.primaryBlockerId, surface.currentBlocker?.id);
  assert.equal(guidance.cultivation.primaryBlockerId, surface.currentBlocker?.id);
  assert.equal(guidance.gateTrial.primaryBlockerId, surface.currentBlocker?.id);
  assert.equal(guidance.world.recommendedModuleKey, surface.bestActions[0]?.destinationModuleKey);
  assert.equal(guidance.status.primaryRoute.moduleKey, guidance.cultivation.primaryRoute.moduleKey);
  assert.equal(guidance.status.primaryRoute.moduleKey, guidance.gateTrial.primaryRoute.moduleKey);

  const publicCopy = JSON.stringify(guidance);
  forbiddenDefaultPublicLabels.forEach((label) => {
    assert.equal(publicCopy.includes(label), false, `${label} must not leak into default MP3 guidance`);
  });
});

test('MP3 activity role surface covers the live system roles without changing economy-only registry semantics', () => {
  const roles = getMilestoneActivityRoleEntries();
  assert.deepEqual(
    roles.map((entry) => entry.activityKey),
    [
      'cultivation',
      'status',
      'world',
      'outskirts',
      'ruins',
      'gateTrial',
      'manualPavilion',
      'techniques',
      'apothecary',
      'forge',
      'bounties',
      'expeditions',
      'inventory',
      'prestige',
    ],
  );

  roles.forEach((entry) => {
    assert.ok(entry.label.length > 0, `${entry.activityKey} needs a public label`);
    assert.ok(entry.roleSubtitle.length > 0, `${entry.activityKey} needs a role subtitle`);
    assert.ok(entry.currentReason.length > 0, `${entry.activityKey} needs a current reason`);
    assert.equal(entry.roleSubtitle.includes('Dao'), false);
    assert.equal(/\p{Emoji}/u.test(entry.roleSubtitle), false, `${entry.activityKey} role copy must not use emoji`);
  });
});

test('MP3 milestone surface reflects prep changes without local screen-specific blocker math', () => {
  const before = buildMilestoneReadinessSurface({
    engine: buildLiveEconomicRecommendationEngine(),
    generatedAtMs: 1,
  });
  assert.equal(before.currentBlocker?.blockerType, 'healing_floor');

  useInventoryStore.getState().addItem('cons_healing_pellet_t1', 20);
  useInventoryStore.getState().addItem('cons_ironblood_pellet_t1', 4);
  useInventoryStore.getState().addItem('cons_qi_elixir_t1', 4);
  useEquipmentStore.setState({
    refineLevelBySlot: { weapon: 0, accessory: 0 },
    temperBonusesBySlot: { weapon: [], accessory: [] },
  });

  const after = buildMilestoneReadinessSurface({
    engine: buildLiveEconomicRecommendationEngine(),
    generatedAtMs: 2,
  });

  assert.equal(after.currentBlocker?.blockerType, 'gear_floor');
  assert.equal(after.currentBlocker?.bestSource?.moduleKey, 'forge');
  assert.equal(after.bestActions[0]?.destinationModuleKey, 'forge');
});
