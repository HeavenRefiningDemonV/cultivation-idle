import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { PrestigeUpgradeDef } from '../../src/content/index.js';
import { buildPrestigeLedgerExactSurfaceFromStores } from '../../src/features/prestige/prestigeLedgerExact/buildPrestigeLedgerExactSurface.js';

const readSource = (relativePath: string) =>
  fs.readFile(path.join(process.cwd(), relativePath), 'utf8');

const forbiddenPrestigeRouteCopy = /Primary Route|Mandate Context|Best Next Action|Biggest Shortfall|Run Compass|Open Apothecary|Open Forge|Tune Techniques|Cultivate Qi|Attempt Gate|Mandate points elsewhere/;

const makeBreakdown = (
  potentialGain: number,
  rows: Array<{ key: string; label: string; value: number; hint?: string }>,
) => ({
  availableNow: 0,
  totalEarned: 0,
  reincarnations: 0,
  potentialGain,
  rows,
});

const makeUpgrade = (id: string, name: string, costs: number[]): PrestigeUpgradeDef => ({
  id,
  name,
  description: `${name} description`,
  category: 'laws',
  type: 'multiplier',
  maxLevel: costs.length,
  costs,
  stat: 'idleQiMult',
  effectPerLevel: 0.1,
});

test('prestige exact screen does not render unrelated live-run route context', async () => {
  const screen = await readSource('src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx');

  assert.equal(screen.includes('Primary Route'), false);
  assert.equal(screen.includes('Mandate Context'), false);
  assert.equal(screen.includes('prestigeLedgerRunCompass'), false);
  assert.equal(screen.includes('surface.runCompassHint'), false);
  assert.equal(screen.includes('aria-label="Mandate context"'), false);
});

test('prestige owner no longer imports or builds Status Run Compass route hints', async () => {
  const owner = await readSource('src/features/prestige/prestigeLedgerExact/PrestigeLedgerScreenOwner.tsx');

  assert.equal(owner.includes('useRunCompassSurface'), false);
  assert.equal(owner.includes('runCompass.v2.primaryRoute'), false);
  assert.equal(owner.includes('runCompassHint'), false);
});

test('prestige exact surface does not expose raw runCompassHint fields', async () => {
  const types = await readSource('src/features/prestige/prestigeLedgerExact/prestigeLedgerExactTypes.ts');
  const builder = await readSource('src/features/prestige/prestigeLedgerExact/buildPrestigeLedgerExactSurface.ts');

  assert.equal(types.includes('runCompassHint'), false);
  assert.equal(builder.includes('runCompassHint: input.runCompassHint ?? null'), false);
});

test('too-early Prestige keeps reason text inside Reincarnation-owned ledger surfaces', () => {
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

  assert.equal('runCompassHint' in surface, false);
  assert.equal(surface.reincarnationDecree.title, 'Reincarnation Decree');
  assert.equal(surface.reincarnationDecree.sealState, 'locked');
  assert.equal(surface.reincarnationDecree.primaryAction.enabled, false);
  assert.equal(surface.reincarnationDecree.primaryAction.label, 'Reincarnation Locked');
  assert.match(
    `${surface.reincarnationDecree.statusLine} ${surface.reincarnationDecree.advisorySentence} ${JSON.stringify(surface.currentLifeLedger)}`,
    /Core Formation|Too early|Reincarnation/i,
  );
  assert.doesNotMatch(JSON.stringify(surface), forbiddenPrestigeRouteCopy);
});

test('recommended and cap Prestige remains Reincarnation-owned without route-board labels', () => {
  const surface = buildPrestigeLedgerExactSurfaceFromStores({
    mode: 'live',
    prestige: {
      totalAP: 12,
      lifetimeAP: 24,
      prestigeCount: 1,
      apGain: 21,
      canPrestige: true,
      contentCapReached: true,
      hasLastLifeSummary: true,
      highestRealmReached: 2,
      spiritRoot: { element: 'earth', grade: 3, purity: 93 },
      breakdown: makeBreakdown(21, [
        { key: 'realm', label: 'Realm advancement', value: 12 },
        { key: 'gates', label: 'Resolved gate trials', value: 9 },
      ]),
      purchasesById: {},
    },
    game: {
      selectedPath: 'heaven',
      realm: { index: 2, substage: 4, name: 'Core Formation' },
    },
    advisor: {
      stateLabel: 'Recommended',
      stateDetail: 'This life has reached the authored chapter handoff.',
      resetPreview: {
        resetsThisLife: ['Realm progress'],
        carriesForward: ['Ascension Points (AP)'],
        rebuiltNextLife: ['City baseline (starter city)'],
      },
    },
    heartLawName: 'Ember Thread Sutra',
    cityNamesReached: ['Pinewind Hamlet', 'Stonewake Market'],
    resolvedGateCount: 3,
    visibleUpgrades: [
      makeUpgrade('ap_idle_qi_mult', 'Idle Qi Multiplier', [5, 8]),
      makeUpgrade('ap_combat_mult', 'Combat Power Multiplier', [5, 8]),
    ],
  });

  assert.equal('runCompassHint' in surface, false);
  assert.equal(surface.header.subtitle, 'Reincarnation Ledger');
  assert.equal(surface.reincarnationDecree.sealState, 'recommended');
  assert.equal(surface.reincarnationDecree.primaryAction.label, 'Review & Reincarnate');
  assert.match(`${surface.reincarnationDecree.statusLine} ${surface.reincarnationDecree.advisorySentence}`, /handoff|Chapter|Reincarnation/i);
  assert.doesNotMatch(JSON.stringify(surface), /Primary Route|Mandate Context|Best Next Action|Biggest Shortfall|Run Compass/);
});

test('pure Prestige exact screen does not mutate gameplay owner state directly', async () => {
  const screen = await readSource('src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx');

  assert.equal(screen.includes('RewardService'), false);
  assert.equal(screen.includes('grantRewards'), false);
  assert.equal(screen.includes('usePrestigeStore'), false);
  assert.equal(screen.includes('performPrestige('), false);
  assert.equal(screen.includes('resetForNewLife'), false);
  assert.equal(screen.includes('startCombat'), false);
  assert.equal(screen.includes('recordFailure'), false);
  assert.equal(screen.includes('markCleared'), false);
  assert.equal(screen.includes('markBypassed'), false);
});
