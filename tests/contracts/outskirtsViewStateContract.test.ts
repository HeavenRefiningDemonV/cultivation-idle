import assert from 'node:assert/strict';
import test from 'node:test';

import { getOutskirtsModuleViewState } from '../../src/features/world/outskirts/getOutskirtsModuleViewState.js';

void test('P9 view-state helper returns unavailable when no outskirts definition exists', () => {
  const state = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: null,
    activity: null,
    combatContext: { type: null },
  });
  assert.equal(state, 'unavailable');
});

void test('P12 view-state helper returns active for same-city active truth even when outskirtsId is temporarily unresolved', () => {
  const fromActivity = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: null,
    activity: {
      type: 'outskirts',
      startedAt: 1,
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_pinewind',
    },
    combatContext: { type: null },
  });
  assert.equal(fromActivity, 'active');

  const fromCombat = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: null,
    activity: null,
    combatContext: {
      type: 'outskirts',
      cityId: 'city_pinewind_hamlet',
      sourceId: undefined,
    },
  });
  assert.equal(fromCombat, 'active');
});


void test('P12 view-state helper treats same-source activity-only and combat-only truth as active when outskirtsId is resolved', () => {
  const fromActivityOnly = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: {
      type: 'outskirts',
      startedAt: 1,
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_pinewind',
    },
    combatContext: { type: null },
  });
  assert.equal(fromActivityOnly, 'active');

  const fromCombatOnly = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: null,
    combatContext: {
      type: 'outskirts',
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_pinewind',
    },
  });
  assert.equal(fromCombatOnly, 'active');
});

void test('P12 view-state helper rejects mismatched city combat truth even when outskirtsId is unresolved', () => {
  const mismatchedCity = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: null,
    activity: null,
    combatContext: {
      type: 'outskirts',
      cityId: 'city_ember_falls',
      sourceId: undefined,
    },
  });
  assert.equal(mismatchedCity, 'unavailable');
});

void test('P9 view-state helper returns planning when no same-source outskirts run is active', () => {
  const state = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: null,
    combatContext: { type: null },
  });
  assert.equal(state, 'planning');
});

void test('P9 view-state helper returns active for same-source activity/combat', () => {
  const activityState = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: {
      type: 'outskirts',
      startedAt: 1,
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_pinewind',
    },
    combatContext: { type: null },
  });
  assert.equal(activityState, 'active');

  const reopenWhileActiveState = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: null,
    combatContext: {
      type: 'outskirts',
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_pinewind',
      cityIndex: 0,
      isBoss: false,
    },
  });
  assert.equal(reopenWhileActiveState, 'active');
});

void test('P9 view-state helper does not misclassify different module or different outskirts source as active', () => {
  const differentModule = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: {
      type: 'trial',
      startedAt: 1,
      cityId: 'city_pinewind_hamlet',
      sourceId: 'trial_pinewind_1',
    },
    combatContext: { type: null },
  });
  assert.equal(differentModule, 'planning');

  const differentOutskirtsSource = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: {
      type: 'outskirts',
      startedAt: 1,
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_other',
    },
    combatContext: {
      type: 'outskirts',
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_other',
    },
  });
  assert.equal(differentOutskirtsSource, 'planning');
});

void test('P9 transition contract: planning -> active -> planning when same-source truth changes', () => {
  const base = {
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
  } as const;

  const planning = getOutskirtsModuleViewState({
    ...base,
    activity: null,
    combatContext: { type: null },
  });
  assert.equal(planning, 'planning');

  const active = getOutskirtsModuleViewState({
    ...base,
    activity: {
      type: 'outskirts',
      startedAt: 1,
      cityId: base.cityId,
      sourceId: base.outskirtsId,
    },
    combatContext: { type: null },
  });
  assert.equal(active, 'active');

  const planningAfterStop = getOutskirtsModuleViewState({
    ...base,
    activity: null,
    combatContext: { type: null },
  });
  assert.equal(planningAfterStop, 'planning');
});
