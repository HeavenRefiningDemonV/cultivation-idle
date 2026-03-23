import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BUILD_ARCHETYPE_ORDER,
  SEMESTER_BUILD_ARCHETYPES,
  TECHNIQUE_FAMILY_ORDER,
  TECHNIQUE_SUPPORT_FLAG_ORDER,
  detectArchetypeFromCoverage,
  getBuildArchetype,
  scoreArchetypeMatch,
  type TechniqueFamily,
  type TechniqueSupportFlag,
} from '../../src/systems/builds/index.js';

function makeFamilyCoverage(): Record<TechniqueFamily, number> {
  return Object.fromEntries(TECHNIQUE_FAMILY_ORDER.map((family) => [family, 0])) as Record<
    TechniqueFamily,
    number
  >;
}

function makeSupportCoverage(): Record<TechniqueSupportFlag, number> {
  return Object.fromEntries(TECHNIQUE_SUPPORT_FLAG_ORDER.map((flag) => [flag, 0])) as Record<
    TechniqueSupportFlag,
    number
  >;
}

test('packet 4.11 archetype registry is locked exactly', () => {
  assert.deepEqual(BUILD_ARCHETYPE_ORDER, [
    'heaven_scripture_flow',
    'heaven_insight_burst',
    'earth_iron_bastion',
    'earth_tempered_counter',
    'martial_pressure_duelist',
    'martial_sweeping_reaper',
  ]);

  assert.deepEqual(SEMESTER_BUILD_ARCHETYPES, [
    {
      id: 'heaven_scripture_flow',
      path: 'heaven',
      label: 'Scripture Flow',
      summary: 'Buff-and-setup Heaven posture that wins through sequencing, curses, and doctrine tempo.',
      primaryFamilies: ['buff', 'setup', 'control'],
      secondaryFamilies: ['guard', 'coreDamage'],
      preferredSupportFlags: ['tempo'],
    },
    {
      id: 'heaven_insight_burst',
      path: 'heaven',
      label: 'Insight Burst',
      summary: 'Direct-pressure Heaven posture that converts setup into burst windows and boss pressure.',
      primaryFamilies: ['coreDamage', 'execute'],
      secondaryFamilies: ['setup', 'buff'],
      preferredSupportFlags: ['boss'],
    },
    {
      id: 'earth_iron_bastion',
      path: 'earth',
      label: 'Iron Bastion',
      summary: 'Defensive Earth posture built around guard, sustain, and slow inevitability.',
      primaryFamilies: ['guard', 'heal'],
      secondaryFamilies: ['buff', 'control'],
      preferredSupportFlags: ['survival'],
    },
    {
      id: 'earth_tempered_counter',
      path: 'earth',
      label: 'Tempered Counter',
      summary: 'Earth counter-build that braces, breaks defenses, and punishes openings.',
      primaryFamilies: ['guard', 'setup', 'execute'],
      secondaryFamilies: ['control', 'heal'],
      preferredSupportFlags: ['boss', 'survival'],
    },
    {
      id: 'martial_pressure_duelist',
      path: 'martial',
      label: 'Pressure Duelist',
      summary: 'Single-target Martial posture built around pressure chains and finishing windows.',
      primaryFamilies: ['coreDamage', 'execute', 'setup'],
      secondaryFamilies: ['buff', 'mobility'],
      preferredSupportFlags: ['boss', 'tempo'],
    },
    {
      id: 'martial_sweeping_reaper',
      path: 'martial',
      label: 'Sweeping Reaper',
      summary: 'Clear-speed Martial posture built around AoE tempo and fast farming.',
      primaryFamilies: ['coreDamage', 'aoe'],
      secondaryFamilies: ['execute', 'mobility'],
      preferredSupportFlags: ['farm', 'tempo'],
    },
  ]);
});

test('packet 4.11 exact archetype scoring and detection examples are locked', () => {
  {
    const familyCoverage = makeFamilyCoverage();
    const supportCoverage = makeSupportCoverage();
    familyCoverage.buff = 1;
    familyCoverage.setup = 1;
    familyCoverage.control = 1;
    supportCoverage.tempo = 1;
    const archetype = getBuildArchetype('heaven_scripture_flow');
    assert.ok(archetype);
    assert.equal(scoreArchetypeMatch({ archetype, familyCoverage, supportCoverage }), 13);
    assert.equal(detectArchetypeFromCoverage({ path: 'heaven', familyCoverage, supportCoverage }), 'heaven_scripture_flow');
  }

  {
    const familyCoverage = makeFamilyCoverage();
    const supportCoverage = makeSupportCoverage();
    familyCoverage.coreDamage = 1;
    familyCoverage.execute = 1;
    familyCoverage.buff = 1;
    supportCoverage.boss = 1;
    const archetype = getBuildArchetype('heaven_insight_burst');
    assert.ok(archetype);
    assert.equal(scoreArchetypeMatch({ archetype, familyCoverage, supportCoverage }), 11);
    assert.equal(detectArchetypeFromCoverage({ path: 'heaven', familyCoverage, supportCoverage }), 'heaven_insight_burst');
  }

  {
    const familyCoverage = makeFamilyCoverage();
    const supportCoverage = makeSupportCoverage();
    familyCoverage.guard = 1;
    familyCoverage.heal = 1;
    supportCoverage.survival = 1;
    const archetype = getBuildArchetype('earth_iron_bastion');
    assert.ok(archetype);
    assert.equal(scoreArchetypeMatch({ archetype, familyCoverage, supportCoverage }), 9);
    assert.equal(detectArchetypeFromCoverage({ path: 'earth', familyCoverage, supportCoverage }), 'earth_iron_bastion');
  }

  {
    const familyCoverage = makeFamilyCoverage();
    const supportCoverage = makeSupportCoverage();
    familyCoverage.guard = 1;
    familyCoverage.setup = 1;
    familyCoverage.execute = 1;
    supportCoverage.boss = 1;
    const archetype = getBuildArchetype('earth_tempered_counter');
    assert.ok(archetype);
    assert.equal(scoreArchetypeMatch({ archetype, familyCoverage, supportCoverage }), 13);
    assert.equal(detectArchetypeFromCoverage({ path: 'earth', familyCoverage, supportCoverage }), 'earth_tempered_counter');
  }

  {
    const familyCoverage = makeFamilyCoverage();
    const supportCoverage = makeSupportCoverage();
    familyCoverage.coreDamage = 1;
    familyCoverage.execute = 1;
    familyCoverage.setup = 1;
    supportCoverage.boss = 1;
    const archetype = getBuildArchetype('martial_pressure_duelist');
    assert.ok(archetype);
    assert.equal(scoreArchetypeMatch({ archetype, familyCoverage, supportCoverage }), 13);
    assert.equal(detectArchetypeFromCoverage({ path: 'martial', familyCoverage, supportCoverage }), 'martial_pressure_duelist');
  }

  {
    const familyCoverage = makeFamilyCoverage();
    const supportCoverage = makeSupportCoverage();
    familyCoverage.coreDamage = 1;
    familyCoverage.aoe = 1;
    familyCoverage.mobility = 1;
    supportCoverage.farm = 1;
    const archetype = getBuildArchetype('martial_sweeping_reaper');
    assert.ok(archetype);
    assert.equal(scoreArchetypeMatch({ archetype, familyCoverage, supportCoverage }), 11);
    assert.equal(detectArchetypeFromCoverage({ path: 'martial', familyCoverage, supportCoverage }), 'martial_sweeping_reaper');
  }
});

test('packet 4.11 null and low-score archetype behavior is locked', () => {
  const zeroFamilyCoverage = makeFamilyCoverage();
  const zeroSupportCoverage = makeSupportCoverage();

  assert.equal(
    detectArchetypeFromCoverage({
      path: null,
      familyCoverage: zeroFamilyCoverage,
      supportCoverage: zeroSupportCoverage,
    }),
    null,
  );

  const heavenLowFamilyCoverage = makeFamilyCoverage();
  const heavenLowSupportCoverage = makeSupportCoverage();
  heavenLowFamilyCoverage.coreDamage = 1;

  assert.equal(
    detectArchetypeFromCoverage({
      path: 'heaven',
      familyCoverage: heavenLowFamilyCoverage,
      supportCoverage: heavenLowSupportCoverage,
    }),
    null,
  );
});

test('packet 4.11 archetype detection only considers the requested path', () => {
  const familyCoverage = makeFamilyCoverage();
  const supportCoverage = makeSupportCoverage();
  familyCoverage.coreDamage = 1;
  familyCoverage.execute = 1;
  familyCoverage.mobility = 1;
  supportCoverage.farm = 1;

  assert.equal(
    detectArchetypeFromCoverage({ path: 'martial', familyCoverage, supportCoverage }),
    'martial_pressure_duelist',
  );
  assert.equal(
    detectArchetypeFromCoverage({ path: 'heaven', familyCoverage, supportCoverage }),
    'heaven_insight_burst',
  );
  assert.equal(
    detectArchetypeFromCoverage({ path: 'earth', familyCoverage, supportCoverage }),
    null,
  );
});
