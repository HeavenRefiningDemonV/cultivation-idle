import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

test('drift guard: constants keep helper-derived realm qi baseline path', () => {
  const constantsSource = read('src/constants/index.ts');
  assert.match(constantsSource, /deriveRealmBaseQiPerSecond\(/);
  assert.doesNotMatch(constantsSource, /qiPerSecond:\s*'1'/);
  assert.doesNotMatch(constantsSource, /qiPerSecond:\s*'10000'/);
  assert.doesNotMatch(constantsSource, /qiPerSecond:\s*'100000000'/);
});

test('drift guard: prestige AP no longer depends on run time placeholder logic', () => {
  const prestigeStoreSource = read('src/stores/prestigeStore.ts');
  const advisorSource = read('src/features/prestige/prestigeAdvisorSurface.ts');

  assert.doesNotMatch(prestigeStoreSource, /timeBonus/);
  assert.doesNotMatch(prestigeStoreSource, /Every hour adds potential AP\./);
  assert.doesNotMatch(advisorSource, /RECOMMENDED_AP_THRESHOLD/);
  assert.doesNotMatch(advisorSource, /Build your life to Foundation Establishment before beginning Reincarnation\./);
});

test('drift guard: offline catch-up is not meditating gated', () => {
  const catchupSource = read('src/services/time/OfflineCatchup.ts');
  const balanceSource = read('src/systems/balance/semesterBalanceTargets.ts');

  assert.doesNotMatch(catchupSource, /wasMeditating\s*\?/);
  assert.match(catchupSource, /resolveOfflineCultivationEfficiency/);
  assert.match(balanceSource, /meditatingOnly:\s*false/);
});

test('drift guard: study contract remains canonical and balance module does not absorb it', () => {
  const studyContractSource = read('src/systems/manuals/studyContract.ts');
  const balanceTypesSource = read('src/systems/balance/balanceTargetTypes.ts');
  const balanceTargetsSource = read('src/systems/balance/semesterBalanceTargets.ts');

  assert.match(studyContractSource, /30_000/);
  assert.match(studyContractSource, /90_000/);
  assert.match(studyContractSource, /240_000/);
  assert.match(studyContractSource, /600_000/);

  assert.doesNotMatch(balanceTypesSource, /STUDY_DURATION_BY_GRADE/);
  assert.doesNotMatch(balanceTargetsSource, /STUDY_DURATION_BY_GRADE/);
});
