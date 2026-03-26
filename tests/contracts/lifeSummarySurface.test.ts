import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  buildLifeSummaryFromSnapshot,
  ensureSixBlocks,
  type PrestigeLifeSummarySnapshot,
} from '../../src/features/prestige/lifeSummarySurface.ts';

const snapshot: PrestigeLifeSummarySnapshot = {
  createdAt: 1,
  advisorLabel: 'Viable',
  apForecast: 5,
  realmIndex: 2,
  realmSubstage: 3,
  runDurationSeconds: 600,
  selectedPath: 'heaven',
  focusMode: 'balanced',
  pathPerks: ['perk_a'],
  upgradeTiers: { idle: 1, damage: 2, hp: 3 },
  unlockedZones: ['training_forest'],
  completedZones: [],
  totalZoneKills: 5,
  unlockedDungeons: ['novice_clearing'],
  clearedDungeons: [],
  inventorySlotsUsed: 2,
  inventorySlotsMax: 20,
  equippedWeaponName: null,
  equippedAccessoryName: null,
  gold: '10',
  unlockedTechniques: 1,
  totalTechniques: 9,
  nextLifeFocus: ['Push realm progression.'],
};

test('life summary always resolves to six blocks', () => {
  const vm = buildLifeSummaryFromSnapshot(snapshot, 'current');
  assert.equal(ensureSixBlocks(vm.blocks).length, 6);
});

test('life summary does not fabricate lifetime earned currency labels', () => {
  const vm = buildLifeSummaryFromSnapshot(snapshot, 'current');
  const flattened = vm.blocks.flatMap((block) => block.lines).join(' ');
  assert.equal(flattened.includes('lifetime gold earned'), false);
  assert.equal(flattened.includes('lifetime merit earned'), false);
  assert.equal(flattened.includes('lifetime spirit-stone earned'), false);
});
