import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('P10 planning surface component keeps canonical exact composition and omits legacy combat-shell widgets', async () => {
  const source = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');

  assert.match(source, /data-testid': 'outskirts-exact-top-region'/);
  assert.match(source, /data-testid': 'outskirts-scenic-field'/);
  assert.match(source, /OutskirtsSetupCard/);
  assert.match(source, /OutskirtsExpectedRewardsCard/);
  assert.match(source, /OutskirtsEncounterProgressStrip/);
  assert.match(source, /OutskirtsStartHuntCta/);
  assert.match(source, /OutskirtsGrindSummaryCard/);

  assert.doesNotMatch(source, /RunCompass|CombatModuleTopLane|InkCombatShell/);
  assert.doesNotMatch(source, /combatLog|playerHP|enemyHP|autoAttack/i);
});

void test('P10 planning surface keeps one dominant CTA path and no CTA content in rewards card component', async () => {
  const screenSource = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');
  const rewardsSource = await fs.readFile('src/features/world/outskirts/components/OutskirtsExpectedRewardsCard.ts', 'utf8');

  assert.equal((screenSource.match(/React\.createElement\(OutskirtsStartHuntCta/g) ?? []).length, 1);
  assert.doesNotMatch(rewardsSource, /Start Hunt|outskirts-start-hunt-cta|primary-action/i);
});
