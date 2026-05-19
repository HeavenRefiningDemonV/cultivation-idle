import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advancePromptStates,
  applyYieldBonuses,
  completePrompt,
  computeAssistedBonus,
  instantiatePrompts,
} from '../src/systems/crafting/assistedPrompts.js';
import type { PromptDef } from '../src/systems/crafting/craftingTypes.js';

const baseStart = 0;
const baseEnd = 10_000;

const promptDefs: PromptDef[] = [
  { id: 'mid', type: 'STABILIZE_FLAME', atPct: 0.5, windowSec: 5, bonus: { yieldPct: 2 } },
  { id: 'cat', type: 'ADD_CATALYST', atPct: 0.75, windowSec: 5, bonus: { yieldPct: 2 } },
];

test('assisted prompts shift from pending to available and missed over time', () => {
  const scheduled = instantiatePrompts(promptDefs, baseStart, baseEnd);
  assert.equal(scheduled[0]?.status, 'PENDING');

  const available = advancePromptStates(scheduled, 5_000);
  assert.equal(available[0]?.status, 'AVAILABLE');

  const missed = advancePromptStates(available, 11_000);
  assert.equal(missed[0]?.status, 'MISSED');
});

test('completing assisted prompt applies yield bonus', () => {
  const scheduled = instantiatePrompts(promptDefs, baseStart, baseEnd);
  const { prompts, ok } = completePrompt(scheduled, 'mid', 5_100);
  assert.ok(ok);
  const resolved = advancePromptStates(prompts, 6_000);

  const baseItems = [{ itemId: 'cons_healing_pellet_t1', qty: 50 }];
  const { items, bonusItems, completed, total } = applyYieldBonuses(baseItems, resolved);

  assert.equal(completed, 1);
  assert.equal(total, 2);
  assert.equal(items[0]?.qty, 51);
  assert.equal(bonusItems[0]?.qty, 1);
});

test('add catalyst prompt completion stacks with other bonuses', () => {
  const scheduled = instantiatePrompts(promptDefs, baseStart, baseEnd);
  const midAvailable = advancePromptStates(scheduled, 5_100);
  const midComplete = completePrompt(midAvailable, 'mid', 5_100);
  assert.ok(midComplete.ok);
  const catalystAvailable = advancePromptStates(midComplete.prompts, 8_100);
  const catalystComplete = completePrompt(catalystAvailable, 'cat', 8_150);
  assert.ok(catalystComplete.ok);
  const resolved = advancePromptStates(catalystComplete.prompts, 9_000);

  const bonusSummary = computeAssistedBonus(resolved);
  assert.equal(bonusSummary.completedCount, 2);
  assert.equal(bonusSummary.totalYieldPct, 4);

  const baseItems = [{ itemId: 'rune_ember_t1', qty: 50 }];
  const { items, bonusItems, completed, total } = applyYieldBonuses(baseItems, resolved);
  assert.equal(completed, 2);
  assert.equal(total, 2);
  assert.equal(items[0]?.qty, 50 + Math.floor(50 * 0.04));
  assert.equal(bonusItems[0]?.qty, Math.floor(50 * 0.04));
});
