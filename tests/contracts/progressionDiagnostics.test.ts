import assert from 'node:assert/strict';
import test from 'node:test';

import { buildProgressionContract, type ProgressionAuthoredContent } from '../../src/systems/progression/contract/index.js';
import { collectProgressionDiagnostics } from '../../src/systems/progression/diagnostics/index.js';

const baseContent: ProgressionAuthoredContent = {
  economy: {
    majorRealms: [
      { id: 'qi_condensation', index: 0 },
      { id: 'foundation_establishment', index: 1 },
      { id: 'core_formation', index: 2 },
      { id: 'nascent_soul', index: 3 },
      { id: 'soul_formation', index: 4 },
      { id: 'spirit_severing', index: 5 },
    ],
  },
  cities: [{ id: 'city_pinewind_hamlet', unlockMajorRealm: 'qi_condensation' }],
  trials: [
    {
      id: 'trial_novices_clearing',
      cityId: 'city_pinewind_hamlet',
      gatesToMajorRealm: 'foundation_establishment',
      gateItemId: 'gate_foundation_pill',
      eligibilityRule: { fromMajorRealm: 'qi_condensation' },
    },
  ],
  items: { items: [{ id: 'gate_foundation_pill' }] },
};

test('diagnostics detect mocked contradictions', () => {
  const contract = buildProgressionContract(baseContent);
  const diagnostics = collectProgressionDiagnostics(contract, {
    authoredContent: {
      economyRealms: ['qi_condensation', 'foundation_establishment'],
      cities: [{ id: 'city_bad', unlockMajorRealm: 'unknown_realm' }],
      trials: [{ id: 'trial_bad', gateItemId: 'foundation_pill', fromMajorRealm: 'qi_condensation', toMajorRealm: 'foundation_establishment' }],
      items: ['gate_foundation_pill'],
    },
    runtimeFileTextByPath: {
      'src/stores/gameStore.ts': 'selectedPath lifePath getQiMultiplier prestige reset',
      'src/systems/loot.ts': 'foundation_pill',
      'src/systems/offline.ts': 'offline pipeline',
      'src/services/time/OfflineCatchup.ts': 'offline catchup',
    },
  });

  const categories = new Set(diagnostics.map((entry) => entry.category));
  assert.equal(categories.has('PATH_TRUTH_SPLIT'), true);
  assert.equal(categories.has('GATE_NAMESPACE_SPLIT'), true);
  assert.equal(categories.has('OFFLINE_PIPELINE_SPLIT'), true);
  assert.equal(categories.has('CITY_UNLOCK_UNBOUND'), true);
});

test('diagnostics emit no issues on clean fixture', () => {
  const contract = buildProgressionContract(baseContent);
  const diagnostics = collectProgressionDiagnostics(contract, {
    authoredContent: {
      economyRealms: ['qi_condensation', 'foundation_establishment', 'core_formation', 'nascent_soul', 'soul_formation', 'spirit_severing'],
      cities: [{ id: 'city_pinewind_hamlet', unlockMajorRealm: 'qi_condensation' }],
      trials: [
        {
          id: 'trial_novices_clearing',
          gateItemId: 'gate_foundation_pill',
          fromMajorRealm: 'qi_condensation',
          toMajorRealm: 'foundation_establishment',
        },
      ],
      items: ['gate_foundation_pill'],
    },
    runtimeFileTextByPath: {},
  });

  assert.deepEqual(diagnostics, []);
});

test('content-cap breach ownership stays on packet 1.1', () => {
  const contract = buildProgressionContract(baseContent);
  const breachedContract = {
    ...contract,
    contentCap: { ...contract.contentCap, realmId: 'nascent_soul' as const },
  };
  const diagnostics = collectProgressionDiagnostics(breachedContract, {
    authoredContent: {
      economyRealms: ['qi_condensation', 'foundation_establishment', 'core_formation', 'nascent_soul', 'soul_formation', 'spirit_severing'],
      cities: [{ id: 'city_pinewind_hamlet', unlockMajorRealm: 'qi_condensation' }],
      trials: [
        {
          id: 'trial_novices_clearing',
          gateItemId: 'gate_foundation_pill',
          fromMajorRealm: 'qi_condensation',
          toMajorRealm: 'foundation_establishment',
        },
      ],
      items: ['gate_foundation_pill'],
    },
    runtimeFileTextByPath: {},
  });

  const breach = diagnostics.find((entry) => entry.category === 'CONTENT_CAP_BREACH');
  assert.equal(breach?.suggestedOwnerPacket, '1.1');
});
