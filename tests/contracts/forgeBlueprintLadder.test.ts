import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildForgeLadderAudit } from '../../src/systems/forge/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('packet 3.5A forge ladder locks the live refine and temper tiers plus shard/dew sinks', async () => {
  const validated = await getValidated();
  const audit = buildForgeLadderAudit(validated);
  const byId = Object.fromEntries(validated.forge_blueprints.map((blueprint) => [blueprint.id, blueprint]));

  assert.deepEqual(audit.missingRefineIds, []);
  assert.deepEqual(audit.missingTemperIds, []);
  assert.ok(audit.spiritDewSinkIds.includes('forge_temper_accessory_t1'));
  ['forge_temper_weapon_t2', 'forge_temper_accessory_t2', 'forge_temper_weapon_t3', 'forge_temper_accessory_t3'].forEach((id) => {
    assert.ok(audit.artifactShardSinkIds.includes(id));
  });

  assert.equal(byId.forge_refine_rusty_t1?.cost?.gold, 500);
  assert.equal((byId.forge_refine_rusty_t1?.effect as { maxLevelCap?: number })?.maxLevelCap, 3);
  assert.equal(byId.forge_refine_basic?.cost?.gold, 400);
  assert.equal(byId.forge_refine_advanced?.cost?.gold, 6000);
  assert.equal(byId.forge_refine_common_t2?.cost?.gold, 8000);
  assert.equal(byId.forge_refine_uncommon_t3?.cost?.gold, 60000);
  assert.equal(byId.forge_refine_rare_t4?.cost?.gold, 300000);
  assert.equal(byId.forge_refine_legendary_t5?.cost?.gold, 1000000);

  assert.equal(byId.forge_refine_uncommon_t3?.inputs?.mat_artifact_shard, 1);
  assert.equal(byId.forge_refine_rare_t4?.inputs?.mat_artifact_shard, 2);
  assert.equal(byId.forge_refine_legendary_t5?.inputs?.mat_artifact_shard, 4);

  assert.deepEqual((byId.forge_temper_weapon_t1?.effect as { affixPool?: string[] })?.affixPool, ['boss_damage_pct', 'crit_chance_pct']);
  assert.equal((byId.forge_temper_weapon_t1?.effect as { baseProcChancePct?: number })?.baseProcChancePct, 25);
  assert.deepEqual((byId.forge_temper_accessory_t1?.effect as { affixPool?: string[] })?.affixPool, ['defense_pct', 'hp_pct', 'status_resist']);
  assert.equal((byId.forge_temper_accessory_t1?.effect as { baseProcChancePct?: number })?.baseProcChancePct, 30);
  assert.equal(byId.forge_temper_accessory_t1?.inputs?.mat_spirit_dew, 1);

  assert.equal((byId.forge_temper_weapon_t2?.effect as { baseProcChancePct?: number })?.baseProcChancePct, 40);
  assert.equal((byId.forge_temper_accessory_t2?.effect as { baseProcChancePct?: number })?.baseProcChancePct, 45);
  assert.equal((byId.forge_temper_weapon_t3?.effect as { baseProcChancePct?: number })?.baseProcChancePct, 55);
  assert.equal((byId.forge_temper_accessory_t3?.effect as { baseProcChancePct?: number })?.baseProcChancePct, 55);
});
