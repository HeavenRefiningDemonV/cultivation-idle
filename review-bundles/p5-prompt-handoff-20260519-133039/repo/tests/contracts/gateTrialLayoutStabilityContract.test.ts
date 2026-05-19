import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3E layout stability reserves key Gate Trial state slots', () => {
  const styles = read('src/components/screens/world/buildings/CombatStyles.scss');

  assert.match(styles, /\.gateTrialReadinessCard__detail\s*\{[\s\S]*min-height: 32px;/);
  assert.match(styles, /\.gateTrialReadinessCard__score\s*\{[\s\S]*min-height: 18px;/);
  assert.match(styles, /\.gateTrialReadinessCard__counts\s*\{[\s\S]*min-height: 34px;/);
  assert.match(styles, /\.gateTrialReadinessCard__facts\s*\{[\s\S]*min-height: 56px;/);
  assert.match(styles, /\.gateTrialChecklist__rows\s*\{[\s\S]*min-height: 104px;/);
  assert.match(styles, /\.gateTrialSafetyNetCard__stack\s*\{[\s\S]*min-height: 150px;/);
  assert.match(styles, /\.gateTrialAttemptCluster__detail\s*\{[\s\S]*min-height: 18px;/);
});
