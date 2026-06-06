import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { REALMS } from '../../src/constants/index.js';
import {
  getCanonicalCultivationStageIndex,
  getCanonicalCultivationStageIndexStrict,
  getCanonicalCultivationStageNumber,
  REALM_SUBSTAGE_COUNTS,
} from '../../src/systems/progression/cultivationStageIndex.js';

test('MP0 canonical cultivation stage indexes use cumulative realm substage counts', () => {
  assert.deepEqual(REALM_SUBSTAGE_COUNTS, [9, 9, 9, 6, 6, 6]);
  assert.deepEqual(REALM_SUBSTAGE_COUNTS, REALMS.map((realm) => realm.substages));

  const cases = [
    { label: 'Qi Condensation I', realmIndex: 0, substage: 1, index: 0, number: 1 },
    { label: 'Qi Condensation IX', realmIndex: 0, substage: 9, index: 8, number: 9 },
    { label: 'Foundation Establishment I', realmIndex: 1, substage: 1, index: 9, number: 10 },
    { label: 'Core Formation IX', realmIndex: 2, substage: 9, index: 26, number: 27 },
    { label: 'Nascent Soul I', realmIndex: 3, substage: 1, index: 27, number: 28 },
    { label: 'Nascent Soul VI', realmIndex: 3, substage: 6, index: 32, number: 33 },
    { label: 'Soul Formation I', realmIndex: 4, substage: 1, index: 33, number: 34 },
    { label: 'Spirit Severing VI', realmIndex: 5, substage: 6, index: 44, number: 45 },
  ] as const;

  for (const entry of cases) {
    const input = { realmIndex: entry.realmIndex, substage: entry.substage };
    assert.equal(getCanonicalCultivationStageIndex(input), entry.index, entry.label);
    assert.equal(getCanonicalCultivationStageNumber(input), entry.number, entry.label);
  }
});

test('MP0 stage resolver clamps runtime save values but exposes strict authoring validation', () => {
  assert.equal(getCanonicalCultivationStageIndex({ realmIndex: Number.NaN, substage: Number.NaN }), 0);
  assert.equal(getCanonicalCultivationStageIndex({ realmIndex: 5, substage: 99 }), 44);
  assert.equal(getCanonicalCultivationStageNumber({ realmIndex: 5, substage: 99 }), 45);

  assert.throws(
    () => getCanonicalCultivationStageIndexStrict({ realmIndex: 3, substage: 7 }),
    /substage 7 outside realm 3 bounds 1-6/,
  );
});

test('MP0 active runtime code does not use the old nine-substage stage formula', async () => {
  const checkedFiles = [
    'src/stores/gameStore.ts',
    'src/stores/cultivationStore.ts',
    'src/features/daoHeartSanctuary/DaoHeartSanctuaryView.tsx',
    'src/features/daoHeartSanctuary/buildDaoHeartSanctuarySurface.ts',
    'src/features/cultivation/exact/buildCultivationExactSurface.ts',
    'src/systems/daoHeart/heartLawLevelResolver.ts',
    'src/systems/breakthrough/breakthroughStabilityResolver.ts',
    'src/systems/prestige/prestigeMemory.ts',
    'src/services/time/OfflineCatchup.ts',
  ];
  const source = (
    await Promise.all(checkedFiles.map(async (file) => {
      const body = await fs.readFile(path.resolve(process.cwd(), file), 'utf8');
      return `\n// ${file}\n${body}`;
    }))
  ).join('\n');

  assert.doesNotMatch(source, /realm\.index\s*\*\s*9|state\.realm\.index\s*\*\s*9|game\.realm\.index\s*\*\s*9/);
  assert.doesNotMatch(source, /\*\s*9\s*\+\s*(?:state\.|game\.)?realm\.substage/);
});

test.todo('Packet 1: full Qi cultivation must not advance while Path Training owns the foreground activity gate');
test.todo('Packet 1: Dao Heart practice and Path Training must remain mutually exclusive through ActivityStore');
