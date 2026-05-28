import assert from 'node:assert/strict';
import test from 'node:test';
import { isCombatActivityActiveForScheduler } from '../../src/systems/gameLoop.js';
import { SimulationScheduler } from '../../src/services/time/SimulationScheduler.js';
import { useActivityStore } from '../../src/stores/activityStore.js';

test('combat scheduler predicate follows ActivityStore combat activity truth', () => {
  const activity = useActivityStore.getState();
  activity.hardResetActivity();
  assert.equal(isCombatActivityActiveForScheduler(), false);

  activity.setActivity('meditate', undefined, 'scheduler-test');
  assert.equal(isCombatActivityActiveForScheduler(), false);

  activity.setActivity('forge', undefined, 'scheduler-test');
  assert.equal(isCombatActivityActiveForScheduler(), false);

  activity.setActivity('outskirts', { cityId: 'city_pinewind_hamlet', sourceId: 'outskirts_pinewind' }, 'scheduler-test');
  assert.equal(isCombatActivityActiveForScheduler(), true);

  activity.setActivity('trial', { cityId: 'city_pinewind_hamlet', sourceId: 'trial_foundation_gate' }, 'scheduler-test');
  assert.equal(isCombatActivityActiveForScheduler(), true);

  activity.setActivity('ruins', { cityId: 'city_pinewind_hamlet', sourceId: 'ruins_mist_cave' }, 'scheduler-test');
  assert.equal(isCombatActivityActiveForScheduler(), true);

  activity.hardResetActivity();
});

test('combat fixed-step is bounded for a foreground window and clamps delayed resume', () => {
  useActivityStore.getState().setActivity('outskirts', { cityId: 'city_pinewind_hamlet' }, 'scheduler-test');
  let combatTicks = 0;
  const scheduler = new SimulationScheduler({ autoStartHost: false });
  scheduler.register({
    name: 'combat-fixed-step',
    intervalMs: 100,
    maxCatchupMs: 250,
    maxStepsPerDrain: 2,
    runWhenHidden: false,
    enabled: isCombatActivityActiveForScheduler,
    run: () => { combatTicks += 1; },
  });

  scheduler.start();
  scheduler.drain(0, 'test');
  for (let now = 100; now <= 30_000; now += 100) {
    scheduler.drain(now, 'test');
  }
  assert.equal(combatTicks, 300);

  scheduler.drain(10 * 60 * 1000, 'resume');
  assert.equal(combatTicks, 302);
  assert.equal(scheduler.getDiagnostics()['combat-fixed-step']?.catchupClampCount, 1);

  scheduler.setHidden(true);
  scheduler.drain(10 * 60 * 1000 + 30_000, 'resume');
  assert.equal(combatTicks, 302);
  assert.equal(scheduler.getDiagnostics()['combat-fixed-step']?.skippedCount, 1);
  useActivityStore.getState().hardResetActivity();
});
