import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { auditHeartLawEffectsFromDefinitions } from '../../src/systems/doctrine/index.js';
import type { HeartLawDef, HeartLawsConfig } from '../../src/content/index.js';

const HEART_LAWS_PATH = path.resolve(
  process.cwd(),
  'public',
  'cultivation_idle_content_bible_v1_config',
  'heart_laws.json',
);

async function readHeartLawsConfig(): Promise<HeartLawsConfig> {
  return JSON.parse(await fs.readFile(HEART_LAWS_PATH, 'utf8')) as HeartLawsConfig;
}

function createSyntheticLaw(overrides: Partial<HeartLawDef> = {}): HeartLawDef {
  return {
    id: overrides.id ?? 'heart_ember_thread_sutra',
    name: overrides.name ?? 'Synthetic Heart Law',
    tier: overrides.tier ?? 'tier3',
    archetype: overrides.archetype ?? 'burst',
    daoTags: overrides.daoTags ?? ['fire'],
    spiritRootAffinities: overrides.spiritRootAffinities ?? ['fire'],
    signature: overrides.signature ?? { combatDamageMult: 0.3 },
    chapters: overrides.chapters ?? [
      { chapter: 1, effects: { critDmgMult: 0.2 } },
      { chapter: 2, effects: { bossDamageMult: 0.2 } },
      { chapter: 3, effects: { voidDamageMult: 0.25 } },
    ],
    isStarter: overrides.isStarter,
  };
}

let config: HeartLawsConfig;

test.before(async () => {
  config = await readHeartLawsConfig();
});

test('the live content has full current raw-key coverage with no ignored keys', () => {
  const audit = auditHeartLawEffectsFromDefinitions(config.heartLaws, config.affinityRules);
  assert.deepEqual(audit.ignoredKeys, []);
});

test('supported keys include important authored top-level keys', () => {
  const audit = auditHeartLawEffectsFromDefinitions(config.heartLaws, config.affinityRules);

  [
    'cultivateQiMult',
    'combatDamageMult',
    'cultivationCharge',
    'combatOpenerBuff',
    'bossKillLantern',
    'voidWindow',
    'breakthroughRequirementMult',
    'forgeSpeed',
    'techniqueMasteryGainMult',
    'offlineEfficiencyAdd',
    'stabilityCostMult',
  ].forEach((key) => assert.equal(audit.supportedKeys.includes(key), true));
});

test('derived keys include expected flattened object and metadata forms', () => {
  const audit = auditHeartLawEffectsFromDefinitions(config.heartLaws, config.affinityRules);

  [
    'cultivationCharge.gainPerCultivateMinute',
    'combatOpenerBuff.atkMultPer10Charge',
    'bossKillLantern.gainPerBossKill',
    'voidWindow.ignoreDefPct',
    'ruinsFragmentGainMult.cap',
    'artifactShardGainMult.cap',
    'note',
  ].forEach((key) => assert.equal(audit.derivedKeys.includes(key), true));
});

test('budget violations are deterministic and sorted', () => {
  const a = auditHeartLawEffectsFromDefinitions(config.heartLaws, config.affinityRules);
  const b = auditHeartLawEffectsFromDefinitions(config.heartLaws, config.affinityRules);

  assert.deepEqual(a.budgetViolations, b.budgetViolations);
  a.budgetViolations.forEach((entry) => assert.equal(entry.combatBudgetPct > 40, true));
  assert.deepEqual(
    a.budgetViolations.map((entry) => entry.lawId),
    [...a.budgetViolations.map((entry) => entry.lawId)].sort((left, right) => left.localeCompare(right)),
  );
});

test('synthetic overburst laws are caught by the deterministic audit', () => {
  const syntheticLaw = createSyntheticLaw();
  const audit = auditHeartLawEffectsFromDefinitions([syntheticLaw], config.affinityRules);

  const violation = audit.budgetViolations.find((entry) => entry.lawId === syntheticLaw.id);
  assert.ok(violation);
  assert.equal((violation?.combatBudgetPct ?? 0) > 40, true);
});

test('unknown future raw keys become ignored keys instead of being silently classified', () => {
  const syntheticLaw = createSyntheticLaw({
    signature: {
      cultivateQiMult: 0.1,
      mysteryFutureScalar: 9,
    },
  });
  const audit = auditHeartLawEffectsFromDefinitions([syntheticLaw], config.affinityRules);

  assert.equal(audit.ignoredKeys.includes('mysteryFutureScalar'), true);
});
