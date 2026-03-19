import assert from 'node:assert/strict';
import test from 'node:test';

import type { BountyTemplate } from '../../src/content/index.js';
import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { resolveBountyDestination } from '../../src/utils/bountyRouting.js';
import {
  isLiveBoardBountyKind,
  LIVE_BOUNTY_BOARD_SIZE,
  LIVE_BOUNTY_BOARD_SLOTS,
} from '../../src/systems/world/bountyBoardContract.js';
import { SEMESTER_SLICE_CONTRACT } from '../../src/systems/progression/contract/semesterSlice.js';
import {
  loadValidatedContent,
  primeBountyRuntimeStores,
  resetBountyRuntimeStores,
} from './bountyRuntimeTestUtils.js';

const EXPECTED_SUPPORT_TITLE_PREFIX_BY_CITY_INDEX: Record<number, string> = {
  0: 'Pinewind',
  1: 'Stonecrag',
  2: 'Spirit Cavern',
  3: 'Lotusford',
  4: 'Ironpeak',
};

const SUPPORT_KINDS = new Set(['CRAFT_COMPLETE', 'EXPEDITION_COMPLETE']);
const ROUTE_KINDS = new Set(['OUTSKIRTS_KILL', 'RUINS_ROOM_CLEAR']);
const CHALLENGE_KINDS = new Set(['OUTSKIRTS_BOSS_KILL', 'RUINS_RUN_CLEAR']);

test.beforeEach(async () => {
  resetBountyRuntimeStores();
  await primeBountyRuntimeStores();
});

test('real authored support templates no longer leak legacy player-facing city names', async () => {
  const { raw } = await loadValidatedContent();
  const templates = raw.bounties.templates as BountyTemplate[];
  const names = templates.map((template: BountyTemplate) => template.name);

  names.forEach((name: string) => {
    assert.equal(name.includes('Embermist'), false);
    assert.equal(name.includes('Silverkeep'), false);
    assert.equal(name.includes('Starsea'), false);
  });

  assert.equal(names.some((name: string) => name.includes('Spirit Cavern')), true);
  assert.equal(names.some((name: string) => name.includes('Lotusford')), true);
  assert.equal(names.some((name: string) => name.includes('Ironpeak')), true);
});

test('craft and expedition support templates now have usable objective text', async () => {
  const { raw } = await loadValidatedContent();
  const supportTemplates = (raw.bounties.templates as BountyTemplate[]).filter(
    (template: BountyTemplate) => template.kind === 'CRAFT_COMPLETE' || template.kind === 'EXPEDITION_COMPLETE',
  );

  assert.equal(supportTemplates.length > 0, true);
  supportTemplates.forEach((template: BountyTemplate) => {
    assert.equal(typeof template.desc, 'string');
    assert.equal(template.desc.trim().length > 0, true);
    assert.equal(/\{target\}|Finish|Complete|Claim/i.test(template.desc), true);
  });
});

test('the slot contract stays canonical', () => {
  assert.equal(LIVE_BOUNTY_BOARD_SIZE, 3);
  assert.deepEqual(LIVE_BOUNTY_BOARD_SLOTS, [
    { role: 'support', difficulty: 'easy', allowedKinds: ['CRAFT_COMPLETE', 'EXPEDITION_COMPLETE'] },
    { role: 'route', difficulty: 'medium', allowedKinds: ['OUTSKIRTS_KILL', 'RUINS_ROOM_CLEAR'] },
    { role: 'challenge', difficulty: 'hard', allowedKinds: ['OUTSKIRTS_BOSS_KILL', 'RUINS_RUN_CLEAR'] },
  ]);
  assert.equal(isLiveBoardBountyKind('TRIAL_CLEAR'), false);
});

test('every generated board is canonical for all five live cities', () => {
  const content = useContentStoreState();
  const liveCityIdSet = new Set<string>(SEMESTER_SLICE_CONTRACT.liveCityIds as string[]);
  const liveCities = content.validated.cities
    .filter((city) => liveCityIdSet.has(city.id))
    .sort((a, b) => a.index - b.index);

  liveCities.forEach((city) => {
    useBountyStore.getState().generateForCity(city.id, city.index);
    const board = useBountyStore.getState().activeByCityId[city.id] ?? [];

    assert.equal(board.length, 3, `${city.id} should have exactly three live bounty slots`);
    assert.deepEqual(board.map((entry) => entry.difficulty), ['easy', 'medium', 'hard']);
    assert.equal(SUPPORT_KINDS.has(board[0].kind), true);
    assert.equal(ROUTE_KINDS.has(board[1].kind), true);
    assert.equal(CHALLENGE_KINDS.has(board[2].kind), true);
    assert.equal(board.some((entry) => entry.kind === 'TRIAL_CLEAR'), false);
    board.forEach((entry) => {
      assert.equal(entry.description.trim().length > 0, true);
      const destination = resolveBountyDestination({
        cityId: city.id,
        bountyKind: entry.kind,
        cityModules: city.modules,
      });
      assert.deepEqual(destination.kind, 'module');
    });

    assert.match(board[0].title, new RegExp(EXPECTED_SUPPORT_TITLE_PREFIX_BY_CITY_INDEX[city.index]));
  });
});

test('refresh preserves canonical composition', () => {
  const city = useContentStoreState().validated.cities.find((entry) => entry.id === 'city_spirit_cavern_city');
  assert.ok(city);

  useBountyStore.getState().generateForCity(city.id, city.index);
  useBountyStore.getState().refresh(city.id, city.index);
  const board = useBountyStore.getState().activeByCityId[city.id] ?? [];

  assert.equal(board.length, 3);
  assert.deepEqual(board.map((entry) => entry.difficulty), ['easy', 'medium', 'hard']);
  assert.equal(SUPPORT_KINDS.has(board[0].kind), true);
  assert.equal(ROUTE_KINDS.has(board[1].kind), true);
  assert.equal(CHALLENGE_KINDS.has(board[2].kind), true);
  assert.equal(board.some((entry) => entry.kind === 'TRIAL_CLEAR'), false);
  board.forEach((entry) => {
    const destination = resolveBountyDestination({
      cityId: city.id,
      bountyKind: entry.kind,
      cityModules: city.modules,
    });
    assert.deepEqual(destination.kind, 'module');
  });
});

test('generateForCity sanitizes stale legacy invalid boards instead of blindly accepting them', () => {
  const city = useContentStoreState().validated.cities.find((entry) => entry.id === 'city_spirit_cavern_city');
  assert.ok(city);

  const sentinelTimestamp = 123456789;
  useBountyStore.setState((state) => ({
    ...state,
    activeByCityId: {
      ...state.activeByCityId,
      [city.id]: [
        {
          instanceId: 'bad-route',
          cityId: city.id,
          cityIndex: city.index,
          templateId: 'tmpl_trial_clear',
          difficulty: 'hard',
          kind: 'TRIAL_CLEAR',
          title: 'Embermist Challenge',
          description: '',
          progress: 0,
          target: 1,
          claimed: false,
          rewards: { currencies: {} },
          createdAt: 1,
        },
        {
          instanceId: 'bad-support',
          cityId: city.id,
          cityIndex: city.index,
          templateId: 'bounty_pinewind_craft',
          difficulty: 'easy',
          kind: 'CRAFT_COMPLETE',
          title: 'Pinewind Craft Orders',
          description: 'Finish 1 crafting job for Pinewind Hamlet.',
          progress: 0,
          target: 1,
          claimed: false,
          rewards: { currencies: {} },
          createdAt: 1,
        },
        {
          instanceId: 'bad-challenge',
          cityId: city.id,
          cityIndex: city.index,
          templateId: 'tmpl_outskirts_kills',
          difficulty: 'medium',
          kind: 'OUTSKIRTS_KILL',
          title: 'Route drift',
          description: 'Defeat 10 enemies.',
          progress: 0,
          target: 10,
          claimed: false,
          rewards: { currencies: {} },
          createdAt: 1,
        },
      ],
    },
    lastRefreshAtByCityId: {
      ...state.lastRefreshAtByCityId,
      [city.id]: sentinelTimestamp,
    },
    trackedByCityId: {
      ...state.trackedByCityId,
      [city.id]: 'bad-route',
    },
  }));

  useBountyStore.getState().generateForCity(city.id, city.index);
  const nextState = useBountyStore.getState();
  const board = nextState.activeByCityId[city.id] ?? [];

  assert.equal(board.length, 3);
  assert.deepEqual(board.map((entry) => entry.difficulty), ['easy', 'medium', 'hard']);
  assert.equal(SUPPORT_KINDS.has(board[0].kind), true);
  assert.equal(ROUTE_KINDS.has(board[1].kind), true);
  assert.equal(CHALLENGE_KINDS.has(board[2].kind), true);
  assert.equal(board.some((entry) => entry.kind === 'TRIAL_CLEAR'), false);
  board.forEach((entry) => {
    assert.equal(entry.description.trim().length > 0, true);
    assert.equal(/Embermist|Silverkeep|Starsea/i.test(`${entry.title} ${entry.description}`), false);
  });
  assert.equal(nextState.trackedByCityId[city.id], null);
  assert.equal(nextState.lastRefreshAtByCityId[city.id], sentinelTimestamp);
});

function useContentStoreState() {
  const content = useContentStore.getState().raw;
  assert.ok(content);
  return { validated: content };
}
