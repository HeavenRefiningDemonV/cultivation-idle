import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { deriveRuinsActionState } from '../../src/features/ruins/ui/deriveRuinsActionState.js';

void test('ruins action state keeps truthful Start/Stop semantics and no fake Continue state', () => {
  const idle = deriveRuinsActionState({ runActive: false });
  const active = deriveRuinsActionState({ runActive: true });

  assert.equal(idle.primaryActionLabel, 'Start Ruins Run');
  assert.equal(idle.primaryActionTone, 'start');
  assert.equal(active.primaryActionLabel, 'Stop Ruins Run');
  assert.equal(active.primaryActionTone, 'stop');
});

void test('ruins CTA zone keeps one dominant action and secondary auto-repeat control', async () => {
  const source = await readFile('src/features/ruins/ui/RuinsCtaZone.tsx', 'utf8');

  assert.match(source, /deriveRuinsActionState/);
  assert.match(source, /ruinsCtaZone__primary/);
  assert.match(source, /Continue farming ruins/);
  assert.doesNotMatch(source, /Continue Ruins Run/);
});
