import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { HeartLawDef, HeartLawsConfig } from '../../src/content/index.js';
import {
  getRootStyleProfile,
  resolveRootHeartFit,
  rootHeartFitTierToRiskResonance,
} from '../../src/systems/spiritRoots/rootHeartFitResolver.js';
import type { SpiritRoot } from '../../src/types/index.js';

const HEART_LAWS_PATH = path.resolve(
  process.cwd(),
  'public',
  'cultivation_idle_content_bible_v1_config',
  'heart_laws.json',
);

async function readHeartLawsConfig(): Promise<HeartLawsConfig> {
  return JSON.parse(await fs.readFile(HEART_LAWS_PATH, 'utf8')) as HeartLawsConfig;
}

function getLaw(config: HeartLawsConfig, id: string): HeartLawDef {
  const law = config.heartLaws.find((entry) => entry.id === id);
  assert.ok(law, `expected Heart Law ${id}`);
  return law;
}

const FIRE_ROOT: SpiritRoot = { grade: 4, element: 'fire', purity: 92 };
const EARTH_ROOT: SpiritRoot = { grade: 3, element: 'earth', purity: 80 };

let config: HeartLawsConfig;

test.before(async () => {
  config = await readHeartLawsConfig();
});

test('Fire root exposes explosive volatile playstyle copy and resonant burst fit', () => {
  const law = getLaw(config, 'heart_heaven_flame_manual');
  const style = getRootStyleProfile('fire');
  const fit = resolveRootHeartFit({
    root: FIRE_ROOT,
    heartLaw: law,
    currentRootResonance: 72,
    unlockedVariantIds: [],
  });

  assert.equal(style.playstyleLabel, 'Explosive Volatility');
  assert.ok(style.temperamentTags.includes('explosive'));
  assert.ok(style.temperamentTags.includes('volatile'));
  assert.ok(style.routeBiases.some((bias) => /burst/i.test(bias.label)));
  assert.ok(style.routeBiases.some((bias) => /harsh/i.test(bias.label)));

  assert.equal(fit.tier, 'resonant');
  assert.equal(fit.hardLocksMismatchRoutes, false);
  assert.ok(fit.effects.cultivationSpeedMult > 1);
  assert.ok(fit.effects.heartLawXpMult > 1);
  assert.ok(fit.effects.rootResonanceGainMult > 1);
  assert.equal(fit.effects.expressionCap, 100);
  assert.equal(rootHeartFitTierToRiskResonance(fit.tier), 'exact');
});

test('Fire root with Quiet Breath is opposed, penalized, and recoverable through a variant route', () => {
  const fit = resolveRootHeartFit({
    root: FIRE_ROOT,
    heartLaw: getLaw(config, 'heart_quiet_breath_method'),
    currentRootResonance: 36,
    unlockedVariantIds: [],
  });

  assert.equal(fit.tier, 'opposed');
  assert.equal(fit.hardLocksMismatchRoutes, false);
  assert.ok(fit.effects.cultivationSpeedMult < 1);
  assert.ok(fit.effects.heartLawXpMult < 1);
  assert.ok(fit.effects.rootResonanceGainMult < 1);
  assert.ok(fit.effects.turbulenceDeltaPerMinute > 0);
  assert.ok(fit.effects.expressionCap <= 42);
  assert.equal(fit.recoveryRoute?.variantId, 'fire_banked_ember');
  assert.deepEqual(fit.recoveryRoute?.practiceIds, ['scripture_copying', 'breath_harmonization']);
  assert.match(fit.summary, /resists/i);
  assert.equal(rootHeartFitTierToRiskResonance(fit.tier), 'mismatch');
});

test('Strained fit caps root expression at 58 until variant work catches up', () => {
  const fit = resolveRootHeartFit({
    root: EARTH_ROOT,
    heartLaw: getLaw(config, 'heart_stormstep_diagram'),
    currentRootResonance: 74,
    unlockedVariantIds: [],
  });

  assert.equal(fit.tier, 'strained');
  assert.equal(fit.effects.expressionCap, 58);
  assert.equal(fit.effectiveExpression, 58);
  assert.equal(fit.recoveryRoute?.variantId, 'earth_dust_step');
  assert.equal(fit.recoveryRoute?.unlockResonance, 62);
  assert.equal(fit.hardLocksMismatchRoutes, false);
  assert.equal(rootHeartFitTierToRiskResonance(fit.tier), 'mismatch');
});

test('Variant unlocks keep mismatched roots playable instead of hard-invalid', () => {
  const fit = resolveRootHeartFit({
    root: EARTH_ROOT,
    heartLaw: getLaw(config, 'heart_stormstep_diagram'),
    currentRootResonance: 74,
    unlockedVariantIds: ['earth_dust_step'],
  });

  assert.equal(fit.tier, 'compatible');
  assert.equal(fit.hardLocksMismatchRoutes, false);
  assert.ok(fit.effects.expressionCap > 58);
  assert.equal(fit.recoveryRoute?.unlocked, true);
  assert.equal(rootHeartFitTierToRiskResonance(fit.tier), 'soft');
});

test('Missing root or Heart Law remains neutral and never creates a lock', () => {
  const fit = resolveRootHeartFit({
    root: null,
    heartLaw: null,
    currentRootResonance: 0,
  });

  assert.equal(fit.tier, 'neutral');
  assert.equal(fit.hardLocksMismatchRoutes, false);
  assert.equal(fit.effects.cultivationSpeedMult, 1);
  assert.equal(fit.effects.heartLawXpMult, 1);
  assert.equal(fit.effects.rootResonanceGainMult, 1);
  assert.equal(rootHeartFitTierToRiskResonance(fit.tier), 'neutral');
});
