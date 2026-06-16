import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { PathMeridianDef, PathMeridiansConfig } from '../../src/content/types.js';
import {
  buildTemperingCourtSurface,
  createMeridianProgress,
  effectiveMeridianCap,
  type BuildCourtSurfaceInput,
  type CourtStatView,
  type MeridianTrainingState,
} from '../../src/systems/meridians/index.js';

/**
 * W6 — the render-only Tempering Court surface builder. Maps engine state → the K.3
 * shape the W7 UI renders (no gameplay recompute in the consumer).
 */

const AXES: CourtStatView[] = [
  { id: 'cultivation_base', zi: '修为', name: 'Cultivation Base', value: 46 },
  { id: 'qi_pool', zi: '灵力', name: 'Qi Pool', value: 38 },
  { id: 'qi_purity', zi: '气纯', name: 'Qi Purity', value: 31 },
  { id: 'meridian_openness', zi: '经脉', name: 'Meridian Openness', value: 34 },
  { id: 'spiritual_sense', zi: '神识', name: 'Spiritual Sense', value: 29 },
  { id: 'soul_strength', zi: '魂', name: 'Soul Strength', value: 27 },
  { id: 'dao_comprehension', zi: '道', name: 'Dao Comprehension', value: 22 },
];
const FOUNDATION: CourtStatView[] = [
  { id: 'physique', zi: '体', name: 'Physique', value: 24 },
  { id: 'vitality', zi: '元', name: 'Vitality', value: 26 },
  { id: 'agility', zi: '敏', name: 'Agility', value: 21 },
  { id: 'perception', zi: '悟', name: 'Perception', value: 30 },
  { id: 'willpower', zi: '志', name: 'Willpower', value: 23 },
  { id: 'luck', zi: '运', name: 'Luck', grade: '慧 · Auspicious' },
];

async function martialDefs(): Promise<PathMeridianDef[]> {
  const file = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config', 'path_meridians.json');
  const pack = JSON.parse(await fs.readFile(file, 'utf8')) as PathMeridiansConfig;
  return pack.meridians;
}

function martialState(): MeridianTrainingState {
  const rootByMeridianId: Record<string, 'true'> = {};
  for (const id of [
    'martial_weapon_intent', 'martial_flowing_step', 'martial_battle_rhythm', 'martial_killing_intent',
    'martial_sword_heart', 'martial_unbroken_momentum', 'martial_dao_asura',
  ]) {
    rootByMeridianId[id] = 'true';
  }
  return {
    activeMeridianId: 'martial_weapon_intent',
    rootByMeridianId,
    progressByMeridianId: { martial_weapon_intent: createMeridianProgress(false) },
  };
}

function input(overrides: Partial<BuildCourtSurfaceInput> = {}): BuildCourtSurfaceInput {
  return {
    path: 'martial',
    meridianDefs: [],
    trainingState: martialState(),
    realmIndex1to7: 2,
    cultPct: 0.4,
    fatigue: 54,
    intensityId: 'steady',
    status: 'active',
    perception: 30,
    axes: AXES,
    foundation: FOUNDATION,
    ...overrides,
  };
}

test('surface drips meridians by realm: at R2, 2 unlocked + 5 sealed, signature first', async () => {
  const defs = await martialDefs();
  const surface = buildTemperingCourtSurface(input({ meridianDefs: defs }));
  assert.equal(surface.meridians.length, 7);
  assert.equal(surface.meridians[0].id, 'martial_weapon_intent');
  assert.equal(surface.meridians[0].unlocked, true);
  assert.equal(surface.meridians[1].unlocked, true);
  assert.equal(surface.meridians[2].unlocked, false, 'realm-3 meridian sealed at R2');
  assert.equal(surface.realm.unlockedCount, 2);
  assert.equal(surface.realm.cap, 60); // MERIDIAN_REALM_CAPS[1]
  assert.equal(surface.realm.nextUnlock?.name, 'Battle Rhythm');
});

test('surface exposes the active meridian, the rate factors (lens order), heat and intensity', async () => {
  const defs = await martialDefs();
  const surface = buildTemperingCourtSurface(input({ meridianDefs: defs }));
  assert.equal(surface.activeMeridian?.id, 'martial_weapon_intent');
  assert.deepEqual(
    surface.rate.factors.map((factor) => factor.key),
    ['regimenMastery', 'intensity', 'perception', 'aptitude', 'fatigue', 'comprehension', 'capFalloff', 'pathAffinity', 'offline', 'formMemory'],
  );
  assert.ok(surface.rate.mult > 0 && surface.rate.mult <= 2.25);
  assert.equal(surface.heat.tier, 'tiring'); // fatigue 54
  assert.equal(surface.intensity.mult, 1.0);
  assert.equal(surface.intensity.fpm, 0.14);
  assert.equal(surface.tiers.axes.length, 7);
  assert.equal(surface.tiers.foundation.length, 6);
});

test('exactly one unlocked meridian is the bottleneck (lowest capPct)', async () => {
  const defs = await martialDefs();
  const surface = buildTemperingCourtSurface(input({ meridianDefs: defs }));
  const flagged = surface.meridians.filter((meridian) => meridian.isBottleneck);
  assert.equal(flagged.length, 1);
  assert.equal(flagged[0].unlocked, true);
});

test('capped active meridian reports capped state + overflow alert', async () => {
  const defs = await martialDefs();
  const cap = effectiveMeridianCap(2, 'true');
  const state = martialState();
  state.progressByMeridianId.martial_weapon_intent = { rating: cap, ratingXp: 0, masteryXp: 0, comprehension: 1 };
  const surface = buildTemperingCourtSurface(input({ meridianDefs: defs, trainingState: state }));
  assert.equal(surface.activeMeridian?.capState, 'capped');
  assert.ok(surface.alerts.some((alert) => alert.glyph === '滿'), 'capped meridian raises the overflow alert');
});

test('no-path surface is empty + guides to Life Start', async () => {
  const defs = await martialDefs();
  const surface = buildTemperingCourtSurface(input({ meridianDefs: defs, path: null, status: 'no_path' }));
  assert.equal(surface.meridians.length, 0);
  assert.equal(surface.activeMeridian, null);
  assert.deepEqual(surface.rate.factors, []);
  assert.ok(surface.alerts.some((alert) => alert.text.includes('Life Start')));
});
