import assert from 'node:assert/strict';
import test from 'node:test';

import { performPostFailureFixActionWithDeps, type PerformPostFailureFixActionArgs } from '../../src/systems/ui/postFailure/postFailureFixActions.js';

function createDepsRecorder() {
  const calls: string[] = [];
  const deps = {
    closeCombatPresentation: () => calls.push('closeCombatPresentation'),
    closeWorldBuildingModal: () => calls.push('closeWorldBuildingModal'),
    setActiveTab: (tab: string) => calls.push(`setActiveTab:${tab}`),
    openWorldModule: ({ moduleKey }: { moduleKey: string }) => calls.push(`openWorldModule:${moduleKey}`),
    addNotification: (type: string, message: string) => calls.push(`addNotification:${type}:${message}`),
  };
  return { calls, deps };
}

function perform(args: Partial<PerformPostFailureFixActionArgs> & Pick<PerformPostFailureFixActionArgs, 'action'>) {
  const { calls, deps } = createDepsRecorder();
  performPostFailureFixActionWithDeps(
    {
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      ...args,
    },
    deps as never,
  );
  return calls;
}

test('post-failure routing closes combat presentation before tab/module navigation', () => {
  const cultivationCalls = perform({
    action: {
      key: 'continue_cultivating',
      code: 'continue_cultivating',
      label: 'Cultivate for more power',
      reason: 'reason',
      destinationLabel: 'Cultivation',
      actionLabel: 'Open Cultivation',
      target: { kind: 'tab', tab: 'cultivation' },
      blocked: false,
      blockedReason: null,
    },
  });
  assert.deepEqual(cultivationCalls.slice(0, 3), ['closeCombatPresentation', 'closeWorldBuildingModal', 'setActiveTab:cultivation']);

  const forgeCalls = perform({
    action: {
      key: 'raise_forge_floor',
      code: 'raise_forge_floor',
      label: 'Raise forge floor',
      reason: 'reason',
      destinationLabel: 'Forge',
      actionLabel: 'Open Forge',
      target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'forge' },
      blocked: false,
      blockedReason: null,
    },
  });
  assert.deepEqual(forgeCalls.slice(0, 2), ['closeCombatPresentation', 'openWorldModule:forge']);

  const pouchCalls = perform({
    action: {
      key: 'configure_pouch',
      code: 'configure_pouch',
      label: 'Configure Medicine Pouch',
      reason: 'reason',
      destinationLabel: 'Medicine Pouch',
      actionLabel: 'Open Medicine Pouch',
      target: { kind: 'apothecary_surface', cityId: 'city_pinewind_hamlet', surface: 'pouch' },
      blocked: false,
      blockedReason: null,
    },
  });
  assert.deepEqual(pouchCalls.slice(0, 2), ['closeCombatPresentation', 'openWorldModule:apothecary']);
});

test('post-failure trial-local routing uses real callbacks and blocked rows emit warning', () => {
  let retried = 0;
  let bought = 0;
  let focused: string | null = null;
  const { calls, deps } = createDepsRecorder();

  performPostFailureFixActionWithDeps(
    {
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      action: {
        key: 'retry_clean',
        code: 'retry_clean',
        label: 'Retry a cleaner attempt',
        reason: 'reason',
        destinationLabel: 'Gate Trial',
        actionLabel: 'Retry Gate',
        target: { kind: 'trial_local', action: 'retry' },
        blocked: false,
        blockedReason: null,
      },
      onRetryGate: () => {
        retried += 1;
      },
      onBuySafetyNet: () => {
        bought += 1;
      },
      onFocusTrialSection: (section) => {
        focused = section;
      },
    },
    deps as never,
  );

  performPostFailureFixActionWithDeps(
    {
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      action: {
        key: 'buy_fail_safe',
        code: 'buy_fail_safe',
        label: 'Use the Safety Net',
        reason: 'reason',
        destinationLabel: 'Gate Trial',
        actionLabel: 'Buy Safety Net',
        target: { kind: 'trial_local', action: 'buy_safety_net' },
        blocked: false,
        blockedReason: null,
      },
      onBuySafetyNet: () => {
        bought += 1;
      },
    },
    deps as never,
  );

  performPostFailureFixActionWithDeps(
    {
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      action: {
        key: 'fix_ai_posture',
        code: 'fix_ai_posture',
        label: 'Correct AI posture',
        reason: 'reason',
        destinationLabel: 'Gate Trial',
        actionLabel: 'Focus Combat Options',
        target: { kind: 'trial_local', action: 'focus_combat_options' },
        blocked: false,
        blockedReason: null,
      },
      onFocusTrialSection: (section) => {
        focused = section;
      },
    },
    deps as never,
  );

  performPostFailureFixActionWithDeps(
    {
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      action: {
        key: 'blocked',
        code: 'blocked',
        label: 'Blocked',
        reason: 'reason',
        destinationLabel: 'Gate Trial',
        actionLabel: 'Blocked',
        target: { kind: 'trial_local', action: 'retry' },
        blocked: true,
        blockedReason: 'blocked now',
      },
    },
    deps as never,
  );

  assert.equal(retried, 1);
  assert.equal(bought, 1);
  assert.equal(focused, 'combat_options');
  assert.equal(calls.some((line) => line.includes('addNotification:warning:blocked now')), true);
});
