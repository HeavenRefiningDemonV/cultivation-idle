import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveChangeHeartLawActionState } from '../../src/ui/cultivation/heartLaw/changeHeartLawModalState.js';

test('current law selected resolves to keep-current action without disable reason', () => {
  const state = resolveChangeHeartLawActionState({
    canChange: true,
    canAfford: true,
    selectedHeartLawId: 'law_current',
    currentHeartLawId: 'law_current',
    selectedUnlocked: true,
    selectedUnlockLine: null,
  });

  assert.equal(state.primaryLabel, 'Keep Current Law');
  assert.equal(state.primaryDisabled, false);
  assert.equal(state.disabledReason, null);
});

test('different unlocked affordable law resolves to enabled rewrite action', () => {
  const state = resolveChangeHeartLawActionState({
    canChange: true,
    canAfford: true,
    selectedHeartLawId: 'law_other',
    currentHeartLawId: 'law_current',
    selectedUnlocked: true,
    selectedUnlockLine: null,
  });

  assert.equal(state.primaryLabel, 'Rewrite Heart Law');
  assert.equal(state.primaryDisabled, false);
  assert.equal(state.disabledReason, null);
});

test('unaffordable state disables rewrite with explicit reason', () => {
  const state = resolveChangeHeartLawActionState({
    canChange: true,
    canAfford: false,
    selectedHeartLawId: 'law_other',
    currentHeartLawId: 'law_current',
    selectedUnlocked: true,
    selectedUnlockLine: null,
  });

  assert.equal(state.primaryDisabled, true);
  assert.equal(state.disabledReason, 'Not enough Gold to rewrite.');
});

test('locked law selected disables rewrite with unlock reason', () => {
  const state = resolveChangeHeartLawActionState({
    canChange: true,
    canAfford: true,
    selectedHeartLawId: 'law_locked',
    currentHeartLawId: 'law_current',
    selectedUnlocked: false,
    selectedUnlockLine: 'Unlock: Jade Archive (8 AP)',
  });

  assert.equal(state.primaryDisabled, true);
  assert.equal(state.disabledReason, 'Unlock: Jade Archive (8 AP)');
});

test('canChange false disables rewrite with restriction reason', () => {
  const state = resolveChangeHeartLawActionState({
    canChange: false,
    canAfford: true,
    selectedHeartLawId: 'law_other',
    currentHeartLawId: 'law_current',
    selectedUnlocked: true,
    selectedUnlockLine: null,
  });

  assert.equal(state.primaryDisabled, true);
  assert.equal(state.disabledReason, 'Heart Law rewriting is unavailable right now.');
});
