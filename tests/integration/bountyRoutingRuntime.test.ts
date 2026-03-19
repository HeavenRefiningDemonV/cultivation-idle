import assert from 'node:assert/strict';
import test from 'node:test';

import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { resolveBountyDestination } from '../../src/utils/bountyRouting.js';
import { inspectLiveBountyBoard } from '../../src/systems/world/bountyBoardContract.js';
import {
  getSupportTemplateCityIndexById,
} from '../../src/systems/bounties/liveBountyBoard.js';
import {
  primeBountyRuntimeStores,
  resetBountyRuntimeStores,
} from './bountyRuntimeTestUtils.js';

const LIVE_CITY_MODULES = [
  'outskirts',
  'ruins',
  'gateTrial',
  'manualPavilion',
  'apothecary',
  'forge',
  'bounties',
  'expeditions',
];

test.beforeEach(async () => {
  resetBountyRuntimeStores();
  await primeBountyRuntimeStores();
});

test('CRAFT_COMPLETE routes to Forge only for live semester cities', () => {
  const destination = resolveBountyDestination({
    cityId: 'city_pinewind_hamlet',
    bountyKind: 'CRAFT_COMPLETE',
    cityModules: LIVE_CITY_MODULES,
  });

  assert.deepEqual(destination, { kind: 'module', moduleKey: 'forge', cityId: 'city_pinewind_hamlet' });
  assert.notDeepEqual(destination.kind, 'moduleChoice');
});

test('craft destination is unavailable if Forge is absent', () => {
  const destination = resolveBountyDestination({
    cityId: 'city_pinewind_hamlet',
    bountyKind: 'CRAFT_COMPLETE',
    cityModules: LIVE_CITY_MODULES.filter((moduleKey) => moduleKey !== 'forge'),
  });

  assert.equal(destination.kind, 'unavailable');
  assert.match(destination.reason, /Forge/i);
});

test('existing route, challenge, and expedition destinations remain correct', () => {
  assert.deepEqual(
    resolveBountyDestination({ cityId: 'city_pinewind_hamlet', bountyKind: 'OUTSKIRTS_KILL', cityModules: LIVE_CITY_MODULES }),
    { kind: 'module', moduleKey: 'outskirts', cityId: 'city_pinewind_hamlet' },
  );
  assert.deepEqual(
    resolveBountyDestination({
      cityId: 'city_pinewind_hamlet',
      bountyKind: 'OUTSKIRTS_BOSS_KILL',
      cityModules: LIVE_CITY_MODULES,
    }),
    { kind: 'module', moduleKey: 'outskirts', cityId: 'city_pinewind_hamlet' },
  );
  assert.deepEqual(
    resolveBountyDestination({
      cityId: 'city_pinewind_hamlet',
      bountyKind: 'RUINS_ROOM_CLEAR',
      cityModules: LIVE_CITY_MODULES,
    }),
    { kind: 'module', moduleKey: 'ruins', cityId: 'city_pinewind_hamlet' },
  );
  assert.deepEqual(
    resolveBountyDestination({
      cityId: 'city_pinewind_hamlet',
      bountyKind: 'RUINS_RUN_CLEAR',
      cityModules: LIVE_CITY_MODULES,
    }),
    { kind: 'module', moduleKey: 'ruins', cityId: 'city_pinewind_hamlet' },
  );
  assert.deepEqual(
    resolveBountyDestination({
      cityId: 'city_pinewind_hamlet',
      bountyKind: 'EXPEDITION_COMPLETE',
      cityModules: LIVE_CITY_MODULES,
    }),
    { kind: 'module', moduleKey: 'expeditions', cityId: 'city_pinewind_hamlet' },
  );
});

test('board inspector rejects non-live semester board drift', () => {
  const content = useContentStoreState();
  const supportTemplateCityIndexById = getSupportTemplateCityIndexById(content.bounties.templates);
  const report = inspectLiveBountyBoard({
    cityId: 'city_spirit_cavern_city',
    cityIndex: 2,
    cityModules: ['outskirts', 'ruins', 'gateTrial', 'manualPavilion', 'apothecary', 'bounties', 'expeditions'],
    supportTemplateCityIndexById,
    board: [
      {
        instanceId: 'bad-support',
        cityId: 'city_spirit_cavern_city',
        cityIndex: 2,
        templateId: 'bounty_pinewind_craft',
        difficulty: 'medium',
        kind: 'CRAFT_COMPLETE',
        title: 'Embermist Craft Orders',
        description: '',
      },
      {
        instanceId: 'bad-route',
        cityId: 'city_spirit_cavern_city',
        cityIndex: 2,
        templateId: 'tmpl_trial_clear',
        difficulty: 'easy',
        kind: 'TRIAL_CLEAR',
        title: 'Trial drift',
        description: 'Clear the trial.',
      },
      {
        instanceId: 'bad-challenge',
        cityId: 'city_spirit_cavern_city',
        cityIndex: 2,
        templateId: 'tmpl_ruins_runs',
        difficulty: 'hard',
        kind: 'RUINS_RUN_CLEAR',
        title: 'Ruins Run',
        description: 'Complete 1 run.',
      },
    ],
  });

  assert.equal(report.valid, false);
  assert.equal(report.reasons.some((reason) => /TRIAL_CLEAR/.test(reason)), true);
  assert.equal(report.reasons.some((reason) => /blank description/i.test(reason)), true);
  assert.equal(report.reasons.some((reason) => /moduleChoice|unavailable|Forge unavailable/i.test(reason)), true);
  assert.equal(report.reasons.some((reason) => /legacy city naming/i.test(reason)), true);
  assert.equal(report.reasons.some((reason) => /support slot template/i.test(reason)), true);
});

test('tracked bounty ids are per-city and survive city switching', () => {
  const citiesSorted = useCityStoreSetup();
  useCityStore.getState().initializeFromContent(citiesSorted);
  useCityStore.getState().syncRealmEntry('foundation_establishment');

  const pinewind = 'city_pinewind_hamlet';
  const stonecrag = 'city_stonecrag_town';
  useBountyStore.getState().generateForCity(pinewind, 0);
  useBountyStore.getState().generateForCity(stonecrag, 1);

  const pinewindBountyId = useBountyStore.getState().activeByCityId[pinewind]?.[0]?.instanceId ?? null;
  const stonecragBountyId = useBountyStore.getState().activeByCityId[stonecrag]?.[0]?.instanceId ?? null;
  assert.ok(pinewindBountyId);
  assert.ok(stonecragBountyId);

  useBountyStore.getState().setTrackedBounty(pinewind, pinewindBountyId);
  useBountyStore.getState().setTrackedBounty(stonecrag, stonecragBountyId);
  useCityStore.getState().setCurrentCity(stonecrag);

  const bountyState = useBountyStore.getState();
  assert.equal(bountyState.trackedByCityId[pinewind], pinewindBountyId);
  assert.equal(bountyState.trackedByCityId[stonecrag], stonecragBountyId);
  assert.equal(bountyState.getTrackedBounty(pinewind)?.instanceId, pinewindBountyId);
});

test('tracked bounty ids invalidate cleanly on refresh and sanitize-regeneration', () => {
  const cityId = 'city_pinewind_hamlet';
  useBountyStore.getState().generateForCity(cityId, 0);
  const trackedId = useBountyStore.getState().activeByCityId[cityId]?.[0]?.instanceId ?? null;
  assert.ok(trackedId);

  useBountyStore.getState().setTrackedBounty(cityId, trackedId);
  useBountyStore.setState((state) => ({
    ...state,
    lastRefreshAtByCityId: {
      ...state.lastRefreshAtByCityId,
      [cityId]: 0,
    },
  }));
  useBountyStore.getState().refresh(cityId, 0);
  assert.equal(useBountyStore.getState().trackedByCityId[cityId], null);

  useBountyStore.setState((state) => ({
    ...state,
    activeByCityId: {
      ...state.activeByCityId,
      [cityId]: [
        {
          instanceId: 'legacy-tracked',
          cityId,
          cityIndex: 0,
          templateId: 'tmpl_trial_clear',
          difficulty: 'hard',
          kind: 'TRIAL_CLEAR',
          title: 'Legacy Trial',
          description: '',
          progress: 0,
          target: 1,
          claimed: false,
          rewards: { currencies: {} },
          createdAt: 1,
        },
        {
          instanceId: 'legacy-support',
          cityId,
          cityIndex: 0,
          templateId: 'bounty_pinewind_craft',
          difficulty: 'easy',
          kind: 'CRAFT_COMPLETE',
          title: 'Pinewind Craft Orders',
          description: '',
          progress: 0,
          target: 1,
          claimed: false,
          rewards: { currencies: {} },
          createdAt: 1,
        },
        {
          instanceId: 'legacy-route',
          cityId,
          cityIndex: 0,
          templateId: 'tmpl_outskirts_kills',
          difficulty: 'medium',
          kind: 'OUTSKIRTS_KILL',
          title: 'Route',
          description: 'Defeat 10 enemies.',
          progress: 0,
          target: 10,
          claimed: false,
          rewards: { currencies: {} },
          createdAt: 1,
        },
      ],
    },
    trackedByCityId: {
      ...state.trackedByCityId,
      [cityId]: 'legacy-tracked',
    },
  }));

  useBountyStore.getState().generateForCity(cityId, 0);
  assert.equal(useBountyStore.getState().trackedByCityId[cityId], null);
});

test('first-visit city bounty generation now produces canonical boards', () => {
  const citiesSorted = useCityStoreSetup();
  useCityStore.getState().initializeFromContent(citiesSorted);

  const unlocked = useCityStore.getState().syncRealmEntry('foundation_establishment');
  assert.deepEqual(unlocked, ['city_stonecrag_town']);

  const board = useBountyStore.getState().activeByCityId.city_stonecrag_town ?? [];
  assert.equal(board.length, 3);
  assert.deepEqual(board.map((entry) => entry.difficulty), ['easy', 'medium', 'hard']);
  assert.equal(['CRAFT_COMPLETE', 'EXPEDITION_COMPLETE'].includes(board[0].kind), true);
  assert.equal(['OUTSKIRTS_KILL', 'RUINS_ROOM_CLEAR'].includes(board[1].kind), true);
  assert.equal(['OUTSKIRTS_BOSS_KILL', 'RUINS_RUN_CLEAR'].includes(board[2].kind), true);
  assert.equal(board.some((entry) => entry.kind === 'TRIAL_CLEAR'), false);
});

function useContentStoreState() {
  const content = useContentStore.getState().raw;
  assert.ok(content);
  return content;
}

function useCityStoreSetup() {
  const citiesSorted = useContentStore.getState().citiesSorted;
  assert.equal(citiesSorted.length > 0, true);
  return citiesSorted;
}
