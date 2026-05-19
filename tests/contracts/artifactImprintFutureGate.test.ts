import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { ARTIFACT_IMPRINT_FUTURE_SPECS } from '../../src/systems/artifactImprints/index.js';

test('artifact imprint future specs are stub-only and do not create live drops', () => {
  assert.equal(ARTIFACT_IMPRINT_FUTURE_SPECS.length > 0, true);
  for (const spec of ARTIFACT_IMPRINT_FUTURE_SPECS) {
    assert.equal(spec.runtimeStatus, 'future_stub_only');
    assert.equal(Boolean(spec.sourceLine && spec.sinkLine && spec.memoryLine), true);
  }

  const srcEvents = readFileSync('src/services/events/GameEvents.ts', 'utf8');
  assert.equal(srcEvents.includes("type: 'artifact/imprint_awarded'"), false);
  assert.equal(srcEvents.includes("type: 'treasure/imprint_awarded'"), false);
});

test('artifact future gate docs name source sink memory rules and forbid loot bloat', () => {
  const docPath = 'docs/design/artifact_treasure_imprints.md';
  assert.equal(existsSync(docPath), true);
  const doc = readFileSync(docPath, 'utf8');

  assert.match(doc, /source/i);
  assert.match(doc, /sink/i);
  assert.match(doc, /memory/i);
  assert.match(doc, /No live random relic drops/i);
  assert.match(doc, /future_stub_only/i);
});

test('artifact imprint type stub is not imported by RewardService or CombatStore', () => {
  const rewardService = readFileSync('src/services/rewards/RewardService.ts', 'utf8');
  const combatStore = readFileSync('src/stores/combatStore.ts', 'utf8');

  assert.equal(rewardService.includes('artifactImprints'), false);
  assert.equal(combatStore.includes('artifactImprints'), false);
});
