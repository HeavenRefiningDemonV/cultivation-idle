import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RUINS_BEST_USED_WHEN,
  RUINS_GOLD_SECONDARY_LINE,
  RUINS_ROLE_TAG,
  type RuinsActivityRewardReadModel,
} from '../../src/systems/economy/activityRewardReadModel.js';
import { buildRuinsSummarySurface } from '../../src/ui/world/buildRuinsSummarySurface.js';

function makeModel(overrides?: Partial<RuinsActivityRewardReadModel>): RuinsActivityRewardReadModel {
  return {
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    activityId: 'ruin_hollow_log_den',
    role: 'ruins',
    roleTag: RUINS_ROLE_TAG,
    bestUsedWhen: RUINS_BEST_USED_WHEN,
    roomCount: 5,
    leadLocalMaterials: ['mat_spirit_leaf', 'mat_beast_bone', 'mat_beast_blood'],
    deterministicFinalAnchor: 'mat_core_fragment',
    rarePitySummary: 'Rare pity active for ruin boss chests (increment 0.02, cap 5).',
    goldIsSecondary: true,
    keyExpectedOutputs: ['mat_spirit_leaf', 'mat_core_fragment'],
    boundaryLine: RUINS_GOLD_SECONDARY_LINE,
    ...overrides,
  };
}

void test('ruins summary hierarchy surface foregrounds deterministic trio with max-two lead materials', () => {
  const surface = buildRuinsSummarySurface({
    rewardModel: makeModel(),
    ruinName: 'Hollow Log Den',
    leadMaterialNames: ['Spirit Leaf', 'Beast Bone', 'Beast Blood'],
    anchorName: 'Core Fragment',
    bossChestRareFailures: 2,
    pityCap: 5,
    autoRepeatEnabled: false,
    activeRun: null,
    trackedBountyTitle: null,
  });

  assert.equal(surface.ruinName, 'Hollow Log Den');
  assert.equal(surface.roleTag, RUINS_ROLE_TAG);
  assert.equal(surface.bestUsedWhen, RUINS_BEST_USED_WHEN);
  assert.equal(surface.roomCountLine, 'Rooms: 5');
  assert.deepEqual(surface.leadMaterialsPreview, ['Spirit Leaf', 'Beast Bone']);
  assert.match(surface.leadMaterialsLine, /Spirit Leaf\s*•\s*Beast Bone/);
  assert.equal(surface.anchorPreviewLine, 'Guaranteed anchor: Core Fragment');
  assert.equal(surface.rarePityPreviewLine, 'Rare pity: 2/4');
  assert.equal(surface.goldSecondaryBoundaryLine, RUINS_GOLD_SECONDARY_LINE);
});

void test('ruins summary hierarchy surface reflects active run, auto-repeat, and tracked bounty visibility', () => {
  const surface = buildRuinsSummarySurface({
    rewardModel: makeModel({ roomCount: 6 }),
    ruinName: 'Echo Crystal Tunnels',
    leadMaterialNames: ['Crystal Shard'],
    anchorName: 'Core Fragment',
    bossChestRareFailures: 4,
    pityCap: 5,
    autoRepeatEnabled: true,
    activeRun: { roomIndex: 3, roomCount: 6 },
    trackedBountyTitle: 'Clear 6 Ruins rooms',
  });

  assert.equal(surface.runStateLine, 'Run state: Active (Room 4/6)');
  assert.equal(surface.autoRepeatLine, 'Auto-repeat: On');
  assert.equal(surface.trackedBountyVisible, true);
  assert.match(surface.rarePityPreviewLine, /Guaranteed next rare/);
  assert.equal(surface.leadMaterialsPreview.length, 1);
});
