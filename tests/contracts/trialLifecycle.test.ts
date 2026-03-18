import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { TrialDef } from '../../src/content/types.js';
import type { LoadedContentRaw } from '../../src/content/index.js';
import type { ValidatedContent } from '../../src/content/index.js';
import { validateLoadedContent } from '../../src/content/index.js';
import { adaptProgressionAuthoredContent } from '../../src/systems/progression/contract/index.js';
import { getTrialLifecycleSnapshot } from '../../src/systems/progression/runtime/index.js';
import type { Realm } from '../../src/types/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const FILES = {
  economy: 'economy.json',
  cities: 'cities.json',
  items: 'items.json',
  techniques: 'techniques.json',
  pavilions: 'pavilions.json',
  outskirts: 'outskirts.json',
  enemies: 'enemies.json',
  trials: 'trials.json',
  ruins: 'ruins.json',
  alchemy_recipes: 'alchemy_recipes.json',
  forge_blueprints: 'forge_blueprints.json',
  runes: 'runes.json',
  talisman_recipes: 'talisman_recipes.json',
  apothecary_shops: 'apothecary_shops.json',
  expeditions: 'expeditions.json',
  bounties: 'bounties.json',
  heart_laws: 'heart_laws.json',
  prestige_store: 'prestige_store.json',
} as const;

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

const loadContent = async (): Promise<ValidatedContent> => {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return validateLoadedContent(Object.fromEntries(entries) as unknown as LoadedContentRaw);
};

const readyRealm: Realm = {
  index: 0,
  substage: 4,
  name: 'Qi Condensation',
};

test('trial lifecycle reports an available first gate and exposes fail-safe progress', async () => {
  const content = await loadContent();
  const trial = content.trials.find((entry: TrialDef) => entry.id === 'trial_novices_clearing');

  assert.ok(trial);

  const snapshot = getTrialLifecycleSnapshot({
    content,
    trial,
    progress: {
      attempts: 2,
      sessionAttempts: 2,
      eligibleFailures: 2,
      resolution: 'none',
      cleared: false,
      lastAttemptAt: null,
      lastClearAt: null,
      bypassedAt: null,
      attemptStartAt: null,
      lastAttemptSummary: null,
    },
    realm: readyRealm,
    qi: '100',
    breakthroughRequirement: '100',
    requiredItemSatisfied: true,
  });

  assert.equal(snapshot.state, 'available');
  assert.equal(snapshot.canStart, true);
  assert.equal(snapshot.countsTowardFailSafeOnStart, true);
  assert.equal(snapshot.gateItemId, 'gate_foundation_pill');
  assert.equal(snapshot.failSafe.threshold, 3);
  assert.equal(snapshot.failSafe.eligibleFailures, 2);
  assert.equal(snapshot.failSafe.remainingEligibleFailures, 1);
  assert.equal(snapshot.failSafe.canPurchase, false);
  assert.equal(snapshot.failSafe.blockedReason, 'Fail-safe unlocks after 3 eligible defeats.');
});

test('trial fail-safe authoring aliases normalize into canonical threshold and cost shape', async () => {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  const raw = Object.fromEntries(entries) as unknown as LoadedContentRaw;
  const validated = validateLoadedContent(raw);
  const validatedTrial = validated.trials.find((entry: TrialDef) => entry.id === 'trial_novices_clearing');
  const adaptedTrial = adaptProgressionAuthoredContent(raw).trials.find((entry) => entry.id === 'trial_novices_clearing');

  assert.ok(validatedTrial?.failSafe);
  assert.equal(validatedTrial?.failSafe?.thresholdAttempts, 3);
  assert.deepEqual(validatedTrial?.failSafe?.cost, { gold: '25000', merit: '10', spiritStones: '0' });

  assert.ok(adaptedTrial?.failSafe);
  assert.equal(adaptedTrial?.failSafe?.thresholdAttempts, 3);
  assert.deepEqual(adaptedTrial?.failSafe?.cost, { gold: '25000', merit: '10', spiritStones: '0' });
  assert.equal('failSafePurchase' in (adaptedTrial ?? {}), false);
});

test('trial lifecycle distinguishes bypassed trials from cleared trials', async () => {
  const content = await loadContent();
  const trial = content.trials.find((entry: TrialDef) => entry.id === 'trial_novices_clearing');

  assert.ok(trial);

  const bypassed = getTrialLifecycleSnapshot({
    content,
    trial,
    progress: {
      attempts: 3,
      sessionAttempts: 3,
      eligibleFailures: 3,
      resolution: 'bypassed',
      cleared: false,
      lastAttemptAt: null,
      lastClearAt: null,
      bypassedAt: 123,
      attemptStartAt: null,
      lastAttemptSummary: null,
    },
    realm: readyRealm,
    qi: '100',
    breakthroughRequirement: '100',
    requiredItemSatisfied: true,
  });

  assert.equal(bypassed.state, 'bypassed');
  assert.equal(bypassed.canStart, false);
  assert.equal(bypassed.reason, 'Trial already resolved via bypass.');
  assert.equal(bypassed.failSafe.status, 'resolved');
  assert.equal(bypassed.failSafe.canPurchase, false);
});
