import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { TechniqueDef } from '../../src/content/index.js';
import { auditTechniqueTaxonomyFromDefinitions } from '../../src/systems/builds/techniqueTaxonomyAudit.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function loadTechniqueDefinitions(): Promise<TechniqueDef[]> {
  const raw = await fs.readFile(path.join(CONTENT_DIR, 'techniques.json'), 'utf8');
  return JSON.parse(raw).techniques as TechniqueDef[];
}

test('live techniques have full current raw-type taxonomy coverage', async () => {
  const report = auditTechniqueTaxonomyFromDefinitions(await loadTechniqueDefinitions());

  assert.equal(report.totalTechniques, 60);
  assert.deepEqual(report.techniquesMissingFamilies, []);
  assert.deepEqual(report.unknownPrimaryEffectTypes, []);
  assert.deepEqual(report.unknownSecondaryEffectTypes, []);
});

test('live override list is exact and small', async () => {
  const report = auditTechniqueTaxonomyFromDefinitions(await loadTechniqueDefinitions());

  assert.deepEqual(report.overriddenTechniques, [
    'tech_earth_forge_bone',
    'tech_heaven_astral_focus',
    'tech_heaven_heavenly_cataclysm',
    'tech_martial_executioner_mark',
    'tech_martial_ninefold_sword_rain',
    'tech_martial_weapon_forged_will',
  ]);
});

test('key taxonomy coverage counts are locked', async () => {
  const report = auditTechniqueTaxonomyFromDefinitions(await loadTechniqueDefinitions());

  assert.equal(report.familyCoverage.aoe, 2);
  assert.equal(report.familyCoverage.cleanse, 2);
  assert.equal(report.familyCoverage.farm, 4);
  assert.equal(report.supportFlagCoverage.farm, 6);
  assert.equal(report.alignmentCoverage.off, 0);
  assert.equal(report.alignmentCoverage.strong > 0, true);
  assert.equal(report.alignmentCoverage.neutral > 0, true);
});

test('unknown future raw types are surfaced honestly', () => {
  const synthetic: TechniqueDef[] = [{
    id: 'tech_synthetic_drift_probe',
    name: 'Synthetic Drift Probe',
    path: 'heaven',
    type: 'active',
    role: 'offense',
    effect: { type: 'spectralNova' },
    secondaryAtMastery75: { type: 'chainEcho' },
  }];
  const report = auditTechniqueTaxonomyFromDefinitions(synthetic);

  assert.equal(report.unknownPrimaryEffectTypes.includes('spectralNova'), true);
  assert.equal(report.unknownSecondaryEffectTypes.includes('chainEcho'), true);
});
