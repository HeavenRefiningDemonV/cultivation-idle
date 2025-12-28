import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyYieldBonuses,
  completePrompt,
  scheduleAssistedPrompts,
  updatePromptStatuses,
} from '../src/systems/crafting/assistedPrompts.js';
import type { PromptDef } from '../src/systems/crafting/craftingTypes.js';

const baseStart = 0;
const baseEnd = 10_000;

const promptDefs: PromptDef[] = [
  { id: 'mid', type: 'STABILIZE_FLAME', atPct: 0.5, windowSec: 5, bonus: { yieldPct: 2 } },
];

test('assisted prompts shift from pending to available and missed over time', () => {
  const scheduled = scheduleAssistedPrompts(promptDefs, baseStart, baseEnd);
  assert.equal(scheduled[0]?.status, 'PENDING');

  const available = updatePromptStatuses(scheduled, 5_000);
  assert.equal(available[0]?.status, 'AVAILABLE');

  const missed = updatePromptStatuses(available, 11_000);
  assert.equal(missed[0]?.status, 'MISSED');
});

test('completing assisted prompt applies yield bonus', () => {
  const scheduled = scheduleAssistedPrompts(promptDefs, baseStart, baseEnd);
  const { prompts, ok } = completePrompt(scheduled, 'mid', 5_100);
  assert.ok(ok);
  const resolved = updatePromptStatuses(prompts, 6_000);

  const baseItems = [{ itemId: 'cons_healing_pellet_t1', qty: 50 }];
  const { items, bonusItems, completed, total } = applyYieldBonuses(baseItems, resolved);

  assert.equal(completed, 1);
  assert.equal(total, 1);
  assert.equal(items[0]?.qty, 51);
  assert.equal(bonusItems[0]?.qty, 1);
});
