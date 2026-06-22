import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBreakthroughRitualSurfaceFromSnapshot,
  type BreakthroughRitualBuildSnapshot,
} from '../../src/features/breakthroughRitual/index.js';

const baseSnapshot = {
  id: 'ritual-foundation',
  createdAt: 1000,
  mode: 'result',
  fromRealm: { index: 0, substage: 9, name: 'Qi Condensation', realmId: 'qi_condensation' },
  toRealm: { index: 1, substage: 1, name: 'Foundation Establishment', realmId: 'foundation_establishment' },
  proofItemSpent: {
    itemId: 'gate_foundation_pill',
    name: 'Gate Foundation Pill',
    qty: 1,
    source: 'gate_resolver',
  },
  qi: {
    requiredLabel: '24.4M',
    spentLabel: '24.4M',
    remainingLabel: '5.6M',
    wasReady: true,
  },
  stabilityDelta: {
    beforeLabel: '72 / 100',
    afterLabel: '82 / 100',
    deltaLabel: '+10',
    explanation: 'Vessel stabilized by breakthrough tonic.',
    confidence: 'exact',
  },
  statSnapshotBefore: { maxHp: '100', atk: '20', def: '15' },
  statSnapshotAfter: { maxHp: '145', atk: '29', def: '22' },
  cityUnlockedIds: ['city_stonecrag_town'],
  currentCityId: 'city_stonecrag_town',
  cityNamesById: { city_stonecrag_town: 'Stonecrag Town' },
  heartLawLabel: 'Ember Thread Sutra',
  resonanceLabel: 'Fire doctrine steady',
  method: 'clean_clear',
  nextRoute: {
    title: 'Prepare the Stone Core Sanctum',
    detail: 'Forge and Apothecary floors now matter more.',
    primaryRouteLabel: 'Enter Stonecrag',
    target: { kind: 'world_module', cityId: 'city_stonecrag_town', moduleKey: 'forge' },
  },
} satisfies BreakthroughRitualBuildSnapshot;

test('major breakthrough result displays consumed gate proof, realm delta, city handoff, and doctrine echo', () => {
  const surface = buildBreakthroughRitualSurfaceFromSnapshot(baseSnapshot);

  assert.equal(surface.version, 1);
  assert.equal(surface.mode, 'result');
  assert.equal(surface.scale, 'major_realm');
  assert.equal(surface.proofItemSpent?.itemId, 'gate_foundation_pill');
  assert.equal(surface.proofItemSpent?.name, 'Gate Foundation Pill');
  assert.equal(surface.fromRealm.name, 'Qi Condensation');
  assert.equal(surface.toRealm.name, 'Foundation Establishment');
  assert.equal(surface.cityUnlocked?.cityName, 'Stonecrag Town');
  assert.equal(surface.cityUnlocked?.routeTarget?.kind, 'world_module');
  assert.match(surface.doctrineEcho?.line ?? '', /Ember Thread|doctrine|resonance/i);
  assert.match(surface.lifeMemoryLine, /Foundation|life remembers|Echo/i);
  assert.ok(surface.unlockCascade.some((entry) => entry.category === 'city'));
  assert.ok(surface.statDelta.some((entry) => entry.id === 'maxHp' && entry.delta === '+45'));
});

test('minor substage preview is non-mutating and does not show city handoff', () => {
  const surface = buildBreakthroughRitualSurfaceFromSnapshot({
    ...baseSnapshot,
    id: 'ritual-minor',
    mode: 'preview',
    fromRealm: { index: 1, substage: 1, name: 'Foundation Establishment', realmId: 'foundation_establishment' },
    toRealm: { index: 1, substage: 2, name: 'Foundation Establishment', realmId: 'foundation_establishment' },
    proofItemSpent: null,
    cityUnlockedIds: [],
    currentCityId: 'city_stonecrag_town',
    method: 'unknown',
  });

  assert.equal(surface.mode, 'preview');
  assert.equal(surface.scale, 'minor_substage');
  assert.equal(surface.proofItemSpent, null);
  assert.equal(surface.cityUnlocked, null);
  assert.equal(surface.unlockCascade.some((entry) => entry.category === 'city'), false);
  assert.equal(surface.meridianRevealed, null);
  assert.equal(surface.unlockCascade.some((entry) => entry.category === 'meridian'), false);
  assert.match(surface.lifeMemoryLine, /Foundation Establishment/i);
});

test('M.II.1-B — a revealed meridian surfaces on the result and as a meridian unlock-cascade entry', () => {
  const surface = buildBreakthroughRitualSurfaceFromSnapshot({
    ...baseSnapshot,
    id: 'ritual-meridian',
    meridianRevealed: {
      meridianId: 'heaven_mind_eye',
      label: 'Mind Eye',
      effectLine: 'Reveal weaknesses; anti-ambush',
      pathId: 'heaven',
    },
  });

  assert.equal(surface.meridianRevealed?.meridianId, 'heaven_mind_eye');
  assert.equal(surface.meridianRevealed?.pathId, 'heaven');
  const meridianUnlock = surface.unlockCascade.find((entry) => entry.category === 'meridian');
  assert.ok(meridianUnlock, 'a meridian unlock-cascade entry is present');
  assert.match(meridianUnlock?.title ?? '', /Mind Eye/);
  assert.match(meridianUnlock?.detail ?? '', /weakness/i);
});

test('content cap handoff is honest and does not imply hidden future content', () => {
  const surface = buildBreakthroughRitualSurfaceFromSnapshot({
    ...baseSnapshot,
    id: 'ritual-cap',
    fromRealm: { index: 4, substage: 9, name: 'Soul Formation', realmId: 'soul_formation' },
    toRealm: { index: 5, substage: 1, name: 'Spirit Severing', realmId: 'spirit_severing' },
    proofItemSpent: {
      itemId: 'gate_severing_seal',
      name: 'Severing Seal',
      qty: 1,
      source: 'gate_resolver',
    },
    cityUnlockedIds: [],
    currentCityId: 'city_ironpeak_bastion',
    method: 'cap_transition',
    contentCapReached: true,
    nextRoute: {
      title: 'Current authored chapter complete',
      detail: 'Review Reincarnation; no future gate is exposed beyond this slice.',
      primaryRouteLabel: 'Review Reincarnation',
      target: { kind: 'tab', tab: 'prestige' },
    },
  });

  assert.equal(surface.cityUnlocked, null);
  assert.equal(surface.method, 'cap_transition');
  assert.ok(surface.unlockCascade.some((entry) => entry.category === 'content_cap'));
  assert.doesNotMatch(JSON.stringify(surface), /future city|secret future|hidden future/i);
});

test('major breakthrough city handoffs use explicit module route mapping', () => {
  const cases = [
    ['Foundation Establishment', 'city_stonecrag_town', 'forge'],
    ['Core Formation', 'city_spirit_cavern_city', 'manualPavilion'],
    ['Nascent Soul', 'city_lotusford', 'apothecary'],
    ['Soul Formation', 'city_ironpeak_bastion', 'ruins'],
  ] as const;

  for (const [realmName, cityId, moduleKey] of cases) {
    const surface = buildBreakthroughRitualSurfaceFromSnapshot({
      ...baseSnapshot,
      id: `handoff-${realmName}`,
      toRealm: {
        index: baseSnapshot.toRealm.index + 1,
        substage: 1,
        name: realmName,
        realmId: realmName.toLowerCase().replaceAll(' ', '_'),
      },
      cityUnlockedIds: [cityId],
      cityNamesById: { [cityId]: cityId },
      currentCityId: cityId,
      contentCapReached: false,
      method: 'clean_clear',
    });
    assert.equal(surface.cityUnlocked?.routeTarget?.kind, 'world_module');
    assert.equal(
      surface.cityUnlocked?.routeTarget?.kind === 'world_module'
        ? surface.cityUnlocked.routeTarget.moduleKey
        : null,
      moduleKey,
    );
  }

  const capSurface = buildBreakthroughRitualSurfaceFromSnapshot({
    ...baseSnapshot,
    id: 'handoff-spirit-severing',
    toRealm: { index: 5, substage: 1, name: 'Spirit Severing', realmId: 'spirit_severing' },
    cityUnlockedIds: ['city_ironpeak_bastion'],
    cityNamesById: { city_ironpeak_bastion: 'Ironpeak Bastion' },
    currentCityId: 'city_ironpeak_bastion',
    contentCapReached: true,
    method: 'cap_transition',
  });

  assert.equal(capSurface.cityUnlocked?.routeTarget?.kind, 'tab');
  assert.equal(capSurface.cityUnlocked?.routeTarget?.kind === 'tab' ? capSurface.cityUnlocked.routeTarget.tab : null, 'prestige');
});
