import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  buildTargetedMaterialSinkAudit,
  getTargetedMaterialSinkAuditEntry,
  listTargetedMaterialIds,
} from '../../src/systems/economy/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('packet 3.6 targeted-material sink audit resolves every locked city material through visible-live sinks', async () => {
  const validated = await getValidated();
  const audit = buildTargetedMaterialSinkAudit(validated);

  assert.deepEqual(audit.entries.map((entry) => entry.materialId), listTargetedMaterialIds());
  assert.deepEqual(audit.unresolvedMaterialIds, []);

  audit.entries.forEach((entry) => {
    assert.equal(entry.materialStatus, 'visible_live', `${entry.materialId} is no longer visible-live`);
    assert.equal(entry.hasVisibleLiveSink, true, `${entry.materialId} lost all visible-live sinks`);
    assert.equal(entry.onlyHiddenOrDeferred, false, `${entry.materialId} is only being solved by hidden/deferred sinks`);
    assert.equal(entry.onlyDuplicateNoisy, false, `${entry.materialId} is only being solved by duplicate-noisy sinks`);
  });
});

test('packet 3.6 targeted-material sink audit keeps the named blocker and city-band truth explicit', async () => {
  const validated = await getValidated();
  const audit = buildTargetedMaterialSinkAudit(validated);

  const spiritDew = getTargetedMaterialSinkAuditEntry(audit, 'mat_spirit_dew');
  assert.deepEqual(spiritDew.primarySinks.map((entry) => entry.sinkId), ['forge_temper_accessory_t1']);
  assert.equal(spiritDew.primarySinks[0]?.domain, 'Forge Temper');

  const stonecragEarth = getTargetedMaterialSinkAuditEntry(audit, 'mat_earth_essence');
  assert.ok(stonecragEarth.primarySinks.some((entry) => entry.sinkId === 'alc_ward_salt_t1' && entry.domain === 'Apothecary Brew'));
  assert.ok(stonecragEarth.primarySinks.some((entry) => entry.sinkId === 'forge_rune_fortify_t1' && entry.domain === 'Forge Rune'));

  const artifactShard = getTargetedMaterialSinkAuditEntry(audit, 'mat_artifact_shard');
  assert.ok(artifactShard.primarySinks.some((entry) => entry.sinkId === 'forge_refine_uncommon_t3' && entry.domain === 'Forge Refine'));
  assert.ok(artifactShard.secondarySinks.some((entry) => entry.sinkId === 'forge_temper_weapon_t2' && entry.domain === 'Forge Temper'));
  assert.equal(artifactShard.hiddenOrDeferredSinkIds.includes('forge_jade_core_shell_t1'), true);

  const furnaceCinder = getTargetedMaterialSinkAuditEntry(audit, 'mat_furnace_cinder');
  assert.ok(furnaceCinder.primarySinks.some((entry) => entry.sinkId === 'alc_reagent_quenching_oil_t2'));

  const thunderSand = getTargetedMaterialSinkAuditEntry(audit, 'mat_thunder_sand');
  assert.ok(thunderSand.primarySinks.some((entry) => entry.sinkId === 'alc_reagent_quenching_oil_t2'));
  assert.ok(thunderSand.secondarySinks.some((entry) => entry.sinkId === 'forge_temper_weapon_t3'));
});
