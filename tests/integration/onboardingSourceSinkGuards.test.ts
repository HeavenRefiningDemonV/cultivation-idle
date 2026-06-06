import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOnboardingSourceSinkGuards,
  type OnboardingSourceSinkGuard,
} from '../../src/systems/onboarding/onboardingSourceSinkGuards.js';

const FORBIDDEN_PUBLIC_LABELS = [
  'Current Omen',
  'Gate Proof',
  'Recent Omens',
  'Source Thread',
  'Proof Detail',
  'Preparation Health',
  'Mandate Lens',
  'Module Source-Sink',
  'Threshold Omen',
  'Omen evidence',
  'Proof sealed',
  'Source sealed',
  'Mandate after return',
  'Dao Mandate Interface',
  'Current Mandate',
];

function findGuard(guards: readonly OnboardingSourceSinkGuard[], id: OnboardingSourceSinkGuard['id']) {
  const guard = guards.find((entry) => entry.id === id);
  assert.ok(guard, `expected guard ${id}`);
  return guard;
}

function allPublicCopy(guards: readonly OnboardingSourceSinkGuard[]): string {
  return guards
    .flatMap((guard) => [
      guard.title,
      guard.body,
      guard.primaryRoute?.label ?? '',
      guard.detail ?? '',
    ])
    .join('\n');
}

test('source/sink guards route first-life dead ends to the next concrete action', () => {
  const m3 = findGuard(buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'M3_world_outskirts',
    currentCityId: 'city_pinewind_hamlet',
    availableWorldModules: ['outskirts'],
    teaserWorldModules: ['manualPavilion'],
  }), 'outskirts_gold_needs_pavilion_context');
  assert.equal(m3.primaryRoute?.target.kind, 'world_module');
  assert.equal(m3.primaryRoute?.target.kind === 'world_module' ? m3.primaryRoute.target.moduleKey : null, 'outskirts');
  assert.match(m3.body, /Pavilion/);
  assert.match(m3.body, /manual/);

  const lowGold = findGuard(buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'M4_pavilion_satchel',
    currentCityId: 'city_pinewind_hamlet',
    availableWorldModules: ['outskirts', 'manualPavilion'],
    currencies: { gold: '0' },
    firstManualGoldCost: 25,
  }), 'pavilion_insufficient_gold_routes_outskirts');
  assert.equal(lowGold.severity, 'blocked');
  assert.equal(lowGold.primaryRoute?.target.kind === 'world_module' ? lowGold.primaryRoute.target.moduleKey : null, 'outskirts');

  const emptyTechniques = findGuard(buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'M5_techniques_loadout',
    eligibleTechniqueCount: 0,
    manualStudyActive: false,
  }), 'techniques_empty_routes_manual_study');
  assert.equal(emptyTechniques.primaryRoute?.target.kind, 'tab');
  assert.equal(emptyTechniques.primaryRoute?.target.kind === 'tab' ? emptyTechniques.primaryRoute.target.tab : null, 'records');

  const noMedicine = findGuard(buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'M6_apothecary_expedition',
    currentCityId: 'city_pinewind_hamlet',
    availableWorldModules: ['apothecary', 'expeditions'],
    medicineStockCount: 0,
    pouchEquippedCount: 0,
    herbStockCount: 0,
  }), 'apothecary_no_stock_routes_source');
  assert.equal(noMedicine.primaryRoute?.target.kind === 'world_module' ? noMedicine.primaryRoute.target.moduleKey : null, 'expeditions');

  const forge = findGuard(buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'M7_forge',
    currentCityId: 'city_pinewind_hamlet',
    availableWorldModules: ['outskirts', 'forge'],
    forgeMissingMaterialIds: ['mat_pine_iron'],
    bestSourceByItemId: {
      mat_pine_iron: {
        label: 'Hunt Outskirts',
        moduleKey: 'outskirts',
        reason: 'Outskirts is the first common-material route.',
      },
    },
  }), 'forge_missing_material_routes_source');
  assert.equal(forge.primaryRoute?.target.kind === 'world_module' ? forge.primaryRoute.target.moduleKey : null, 'outskirts');

  const support = findGuard(buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'M8_ruins_bounties',
    currentCityId: 'city_pinewind_hamlet',
    availableWorldModules: ['ruins', 'bounties'],
    teaserWorldModules: ['gateTrial'],
  }), 'ruins_bounties_support_route');
  assert.equal(support.primaryRoute?.target.kind === 'world_module' ? support.primaryRoute.target.moduleKey : null, 'ruins');

  const gateTeaser = findGuard(buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'M8_ruins_bounties',
    currentCityId: 'city_pinewind_hamlet',
    availableWorldModules: ['ruins', 'bounties'],
    teaserWorldModules: ['gateTrial'],
  }), 'gate_trial_teaser_not_openable');
  assert.equal(gateTeaser.severity, 'locked');
  assert.equal(gateTeaser.primaryRoute?.target.kind === 'world_module' ? gateTeaser.primaryRoute.target.moduleKey : null, 'ruins');

  const gateDefeat = findGuard(buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'M9_gate_trial',
    currentCityId: 'city_pinewind_hamlet',
    availableWorldModules: ['apothecary', 'forge', 'ruins', 'bounties', 'gateTrial'],
    lastGateDefeat: {
      timestamp: 999,
      diagnosisCode: 'healing_low',
      topFixDestination: 'apothecary',
      topFixReason: 'Stock medicine before another attempt.',
    },
  }), 'gate_defeat_routes_top_fix');
  assert.equal(gateDefeat.primaryRoute?.target.kind === 'world_module' ? gateDefeat.primaryRoute.target.moduleKey : null, 'apothecary');
  assert.match(gateDefeat.body, /Stock medicine/);

  const graduated = findGuard(buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'complete',
    firstLifeOnlyComplete: true,
  }), 'foundation_no_first_life_replay');
  assert.equal(graduated.severity, 'info');
});

test('source/sink guard public copy avoids old Dao/Omen/Proof/Source labels', () => {
  const guards = buildOnboardingSourceSinkGuards({
    activeMilestoneId: 'M9_gate_trial',
    currentCityId: 'city_pinewind_hamlet',
    availableWorldModules: ['apothecary', 'gateTrial'],
    lastGateDefeat: {
      timestamp: 999,
      topFixDestination: 'apothecary',
      topFixReason: 'Stock medicine before another attempt.',
    },
  });
  const copy = allPublicCopy(guards);

  for (const label of FORBIDDEN_PUBLIC_LABELS) {
    assert.equal(copy.includes(label), false, `guard copy leaked forbidden public label: ${label}`);
  }
});

