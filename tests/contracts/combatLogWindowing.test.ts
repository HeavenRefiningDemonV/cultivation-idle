import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { useCombatStore } from '../../src/stores/combatStore.js';

describe('combat log and event windowing', () => {
  it('keeps the latest visible combat log entries after overflow', () => {
    useCombatStore.getState().hardResetCombat();

    for (let index = 0; index < 10; index += 1) {
      useCombatStore.getState().addLogEntry('system', `entry-${index}`, '#fff');
    }

    const entries = useCombatStore.getState().combatLog.map((entry) => entry.text);
    assert.equal(entries.length, 6);
    assert.deepEqual(entries, ['entry-4', 'entry-5', 'entry-6', 'entry-7', 'entry-8', 'entry-9']);
  });

  it('keeps the latest combat events after overflow', () => {
    useCombatStore.getState().hardResetCombat();

    for (let index = 0; index < 210; index += 1) {
      useCombatStore.getState().pushEvent({
        id: `event-${index}`,
        at: index,
        type: 'HIT',
        source: 'player',
        target: 'enemy',
        amount: String(index),
        isCrit: false,
      });
    }

    const events = useCombatStore.getState().events;
    assert.equal(events.length, 200);
    assert.equal(events[0]?.id, 'event-10');
    assert.equal(events[199]?.id, 'event-209');
  });
});
