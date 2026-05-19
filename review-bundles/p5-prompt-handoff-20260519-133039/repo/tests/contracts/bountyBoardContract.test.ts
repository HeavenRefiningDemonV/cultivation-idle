import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLiveBoardBountyKind,
  LIVE_BOUNTY_BOARD_SIZE,
  LIVE_BOUNTY_BOARD_SLOTS,
} from '../../src/systems/world/bountyBoardContract.js';

test('live bounty board contract exports the canonical packet 2.4 slot layout', () => {
  assert.equal(LIVE_BOUNTY_BOARD_SIZE, 3);
  assert.deepEqual(LIVE_BOUNTY_BOARD_SLOTS, [
    { role: 'support', difficulty: 'easy', allowedKinds: ['CRAFT_COMPLETE', 'EXPEDITION_COMPLETE'] },
    { role: 'route', difficulty: 'medium', allowedKinds: ['OUTSKIRTS_KILL', 'RUINS_ROOM_CLEAR'] },
    { role: 'challenge', difficulty: 'hard', allowedKinds: ['OUTSKIRTS_BOSS_KILL', 'RUINS_RUN_CLEAR'] },
  ]);
  assert.equal(isLiveBoardBountyKind('CRAFT_COMPLETE'), true);
  assert.equal(isLiveBoardBountyKind('TRIAL_CLEAR'), false);
});
