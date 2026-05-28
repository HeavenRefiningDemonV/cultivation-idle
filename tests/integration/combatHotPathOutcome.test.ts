import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const combatStoreSource = readFileSync('src/stores/combatStore.ts', 'utf8');
const combatViewModelSource = readFileSync('src/systems/combat/combatViewModel.ts', 'utf8');
const combatMinibarSource = readFileSync('src/components/combat/CombatMinibar.tsx', 'utf8');

function sourceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `Missing start marker ${start}`);
  assert.notEqual(endIndex, -1, `Missing end marker ${end}`);
  return source.slice(startIndex, endIndex);
}

describe('combat hot-path outcome ownership', () => {
  it('keeps victory, gate clear, and rewards inside CombatStore resolution', () => {
    const defeatEnemySource = sourceBetween(combatStoreSource, 'defeatEnemy:', 'playerDefeat:');

    assert.match(defeatEnemySource, /combatResultVersion\s*=\s*bumpVersion/);
    assert.match(defeatEnemySource, /useTrialStore\.getState\(\)\.markCleared/);
    assert.match(defeatEnemySource, /useCityStore\.getState\(\)\.markGateTrialCleared/);
    assert.match(defeatEnemySource, /RewardService\.grantRewards\(rewardBundle \?\? \{\}, 'Gate Trial clear'\)/);
    assert.match(defeatEnemySource, /RewardService\.grantRewards\(rewards, `Outskirts Victory/);
  });

  it('keeps defeat and trial failure inside CombatStore resolution', () => {
    const playerDefeatSource = sourceBetween(combatStoreSource, 'playerDefeat:', 'tick: (deltaTime: number) => {');

    assert.match(playerDefeatSource, /combatResultVersion\s*=\s*bumpVersion/);
    assert.match(playerDefeatSource, /trialStore\.recordFailure\(context\.trialId, context\.countsTowardFailSafe\)/);
  });

  it('keeps compact combat presentation free of reward or trial mutation', () => {
    const presentationSource = `${combatViewModelSource}\n${combatMinibarSource}`;

    assert.doesNotMatch(presentationSource, /RewardService\.grantRewards/);
    assert.doesNotMatch(presentationSource, /markCleared|recordFailure|markGateTrialCleared|playerDefeat|defeatEnemy/);
  });
});
