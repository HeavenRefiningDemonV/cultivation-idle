import assert from 'node:assert/strict';
import test from 'node:test';

import type { PrestigeUpgradeDef } from '../../src/content/index.js';
import {
  buildPrestigeLedgerExactSurfaceFromStores,
  createPrestigeLedgerExactMockupFixture,
} from '../../src/features/prestige/prestigeLedgerExact/buildPrestigeLedgerExactSurface.js';
import { createPrestigeLedgerActionController } from '../../src/features/prestige/prestigeLedgerExact/usePrestigeLedgerActionController.js';

const makeBreakdown = (potentialGain: number, rows: Array<{ key: string; label: string; value: number; hint?: string }>) => ({
  availableNow: 5,
  totalEarned: 9,
  reincarnations: 1,
  potentialGain,
  rows,
});

const makeUpgrade = (id: string, name: string, costs: number[], effectPerLevel = 0.1): PrestigeUpgradeDef => ({
  id,
  name,
  description: `${name} description`,
  category: 'laws',
  type: 'multiplier',
  maxLevel: costs.length,
  costs,
  stat: id === 'ap_combat_mult' ? 'combatMult' : 'idleQiMult',
  effectPerLevel,
});

test('fixture surface matches the locked Prestige ledger mockup values', () => {
  const surface = createPrestigeLedgerExactMockupFixture();

  assert.equal(surface.header.title, 'Prestige');
  assert.equal(surface.header.subtitle, 'Reincarnation Ledger');
  assert.deepEqual(surface.header.chips, [
    { label: 'AP Reserve', value: '0' },
    { label: 'Lifetime AP', value: '0' },
    { label: 'Lives', value: '0' },
  ]);
  assert.equal(surface.reincarnationDecree.apValueLabel, '+21 AP');
  assert.deepEqual(
    surface.currentLifeLedger.apReceiptRows.map((row) => row.value),
    ['+12 AP', '+3 AP', '+6 AP'],
  );
  assert.equal(surface.nextLifeRail.recommendedDecrees.length, 3);
  assert.deepEqual(
    surface.nextLifeRail.recommendedDecrees.map((card) => [card.displayTitle, card.costLabel, card.effectLine, card.whyLine]),
    [
      ['Root Memory', '12 AP', 'Idle Qi +10%', 'Best first reclaim speed.'],
      ['Combat Memory', '10 AP', 'Combat power +8%', 'Softens gate retries.'],
      ['Technique Warrant', '15 AP', 'Extra technique slot', 'Improves build flexibility.'],
    ],
  );
  assert.equal(surface.resetContract.tablets.length, 3);
  assert.equal(surface.shell.showLegacyVerticalStack, false);
  assert.equal(surface.shell.showFullDecreeTreeByDefault, false);
});

test('live surface maps AP gain and receipt rows from supplied store truth', () => {
  const surface = buildPrestigeLedgerExactSurfaceFromStores({
    mode: 'live',
    prestige: {
      totalAP: 5,
      lifetimeAP: 9,
      prestigeCount: 1,
      apGain: 17,
      canPrestige: true,
      contentCapReached: false,
      hasLastLifeSummary: false,
      highestRealmReached: 2,
      spiritRoot: { element: 'metal', grade: 2, purity: 77 },
      breakdown: makeBreakdown(17, [
        { key: 'realm', label: 'Realm advancement', value: 11, hint: 'Realm truth' },
        { key: 'substage', label: 'Substage progress', value: 4 },
        { key: 'gates', label: 'Resolved gate trials', value: 2 },
      ]),
      purchasesById: {},
    },
    game: {
      selectedPath: 'earth',
      realm: { index: 2, substage: 5, name: 'Core Formation' },
    },
    advisor: {
      stateLabel: 'Viable',
      stateDetail: 'Reincarnation is available now, but later milestones can improve long-term value.',
      resetPreview: {
        resetsThisLife: ['Realm progress'],
        carriesForward: ['Ascension Points (AP)'],
        rebuiltNextLife: ['City baseline (starter city)'],
      },
    },
    heartLawName: 'Stone Lantern Method',
    cityNamesReached: ['Pinewind Hamlet', 'Stonewake Market'],
    resolvedGateCount: 2,
    visibleUpgrades: [
      makeUpgrade('ap_idle_qi_mult', 'Idle Qi Multiplier', [5, 8]),
      makeUpgrade('ap_combat_mult', 'Combat Power Multiplier', [5, 8], 0.08),
    ],
  });

  assert.equal(surface.meta.mode, 'live');
  assert.equal(surface.reincarnationDecree.apValueLabel, '+17 AP');
  assert.notEqual(surface.reincarnationDecree.apValueLabel, '+21 AP');
  assert.deepEqual(
    surface.currentLifeLedger.apReceiptRows.map((row) => [row.label, row.value, row.hint]),
    [
      ['Realm advancement', '+11 AP', 'Realm truth'],
      ['Substage progress', '+4 AP', undefined],
      ['Resolved gate trials', '+2 AP', undefined],
    ],
  );
});

test('live Too Early surface locks the seal and primary CTA', () => {
  const surface = buildPrestigeLedgerExactSurfaceFromStores({
    mode: 'live',
    prestige: {
      totalAP: 0,
      lifetimeAP: 0,
      prestigeCount: 0,
      apGain: 0,
      canPrestige: false,
      contentCapReached: false,
      hasLastLifeSummary: false,
      highestRealmReached: 0,
      spiritRoot: null,
      breakdown: makeBreakdown(0, [
        { key: 'too_early', label: 'Too early for Reincarnation', value: 0, hint: 'Reach Core Formation to begin earning AP.' },
      ]),
      purchasesById: {},
    },
    game: {
      selectedPath: null,
      realm: { index: 0, substage: 1, name: 'Qi Condensation' },
    },
    advisor: {
      stateLabel: 'Too Early',
      stateDetail: 'Push this life to Core Formation before beginning Reincarnation.',
      resetPreview: {
        resetsThisLife: ['Realm progress'],
        carriesForward: ['Ascension Points (AP)'],
        rebuiltNextLife: ['City baseline (starter city)'],
      },
    },
    heartLawName: null,
    cityNamesReached: ['Pinewind Hamlet'],
    resolvedGateCount: 0,
    visibleUpgrades: [makeUpgrade('ap_idle_qi_mult', 'Idle Qi Multiplier', [5])],
  });

  assert.equal(surface.meta.advisorState, 'Too Early');
  assert.equal(surface.reincarnationDecree.sealState, 'locked');
  assert.equal(surface.reincarnationDecree.apValueLabel, '+0 AP');
  assert.equal(surface.reincarnationDecree.primaryAction.enabled, false);
  assert.equal(surface.reincarnationDecree.primaryAction.label, 'Reincarnation Locked');
});

test('live recommendations are a subset of visible runtime upgrade IDs and fill to exactly three cards', () => {
  const visibleUpgrades = [
    makeUpgrade('ap_idle_qi_mult', 'Idle Qi Multiplier', [5, 8]),
    makeUpgrade('ap_combat_mult', 'Combat Power Multiplier', [5, 8], 0.08),
  ];
  const visibleIds = new Set(visibleUpgrades.map((upgrade) => upgrade.id));

  const surface = buildPrestigeLedgerExactSurfaceFromStores({
    mode: 'live',
    prestige: {
      totalAP: 5,
      lifetimeAP: 5,
      prestigeCount: 1,
      apGain: 12,
      canPrestige: true,
      contentCapReached: false,
      hasLastLifeSummary: false,
      highestRealmReached: 2,
      spiritRoot: { element: 'earth', grade: 3, purity: 93 },
      breakdown: makeBreakdown(12, [{ key: 'realm', label: 'Realm advancement', value: 12 }]),
      purchasesById: {},
    },
    game: {
      selectedPath: 'heaven',
      realm: { index: 2, substage: 1, name: 'Core Formation' },
    },
    advisor: {
      stateLabel: 'Viable',
      stateDetail: 'Reincarnation is available now, but later milestones can improve long-term value.',
      resetPreview: {
        resetsThisLife: ['Realm progress'],
        carriesForward: ['Ascension Points (AP)'],
        rebuiltNextLife: ['City baseline (starter city)'],
      },
    },
    heartLawName: 'Ember Thread Sutra',
    cityNamesReached: ['Pinewind Hamlet'],
    resolvedGateCount: 1,
    visibleUpgrades,
  });

  assert.equal(surface.nextLifeRail.recommendedDecrees.length, 3);
  const actionableIds = surface.nextLifeRail.recommendedDecrees
    .filter((card) => card.affordance === 'buy_now' || card.affordance === 'save_for_next' || card.affordance === 'owned')
    .map((card) => card.id);
  assert.equal(actionableIds.every((id) => visibleIds.has(id)), true);
  assert.equal(surface.nextLifeRail.recommendedDecrees.some((card) => card.id === 'ap_unlock_meridian_hall'), false);
});

test('primary action bridge opens ritual modal before calling performPrestige when confirmation is enabled', () => {
  let ritualOpened = false;
  let prestigeCalls = 0;

  const controller = createPrestigeLedgerActionController({
    canPrestigeNow: true,
    requirePrestigeConfirm: true,
    setShowConfirmation: (open) => {
      ritualOpened = open;
    },
    setSellBeforePrestige: () => {},
    setRitualError: () => {},
    setLibraryOpen: () => {},
    setApBreakdownOpen: () => {},
    setSelectedUpgradeId: () => {},
    openLifeSummaryModal: () => {},
    performImmediatePrestige: () => {
      prestigeCalls += 1;
    },
  });

  controller.reviewAndReincarnate();

  assert.equal(ritualOpened, true);
  assert.equal(prestigeCalls, 0);
});
