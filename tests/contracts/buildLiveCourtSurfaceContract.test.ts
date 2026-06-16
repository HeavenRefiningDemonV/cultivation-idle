import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildLiveCourtSurface,
  resolveCourtRealmIndex,
  resolveCourtStatus,
} from '../../src/features/court/buildLiveCourtSurface.js';
import type { ActiveActivity } from '../../src/stores/activityStore.js';
import type { CourtStatView, PathMeridianDef } from '../../src/systems/meridians/index.js';

/**
 * W13a-1 — the LIVE Court surface adapter (flag-gated, NOT default). Locks the live-read
 * resolution: realm-index base, the activity-gate status mapping, and the pass-through to
 * the W6 builder. Pure → no store/persistence needed here.
 */

const AXES: CourtStatView[] = [
  { id: 'cultivation_base', zi: '修为', name: 'Cultivation Base', value: 40 },
  { id: 'qi_pool', zi: '灵力', name: 'Qi Pool', value: 30 },
  { id: 'qi_purity', zi: '气纯', name: 'Qi Purity', value: 28 },
  { id: 'meridian_openness', zi: '经脉', name: 'Meridian Openness', value: 26 },
  { id: 'spiritual_sense', zi: '神识', name: 'Spiritual Sense', value: 24 },
  { id: 'soul_strength', zi: '魂', name: 'Soul Strength', value: 22 },
  { id: 'dao_comprehension', zi: '道', name: 'Dao Comprehension', value: 20 },
];
const FOUNDATION: CourtStatView[] = [
  { id: 'physique', zi: '体', name: 'Physique', value: 20 },
  { id: 'vitality', zi: '元', name: 'Vitality', value: 22 },
  { id: 'agility', zi: '敏', name: 'Agility', value: 18 },
  { id: 'perception', zi: '悟', name: 'Perception', value: 25 },
  { id: 'willpower', zi: '志', name: 'Willpower', value: 19 },
  { id: 'luck', zi: '运', name: 'Luck', grade: '慧 · Auspicious' },
];

const act = (type: string): ActiveActivity => ({ type } as unknown as ActiveActivity);

async function loadDefs(): Promise<PathMeridianDef[]> {
  const file = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config', 'path_meridians.json');
  const pack = JSON.parse(await fs.readFile(file, 'utf8')) as { meridians: PathMeridianDef[] };
  return pack.meridians;
}

test('W13a resolveCourtRealmIndex maps 0-based save index to the 1..7 Court ladder (clamped)', () => {
  assert.equal(resolveCourtRealmIndex(0), 1); // Qi Condensation
  assert.equal(resolveCourtRealmIndex(5), 6);
  assert.equal(resolveCourtRealmIndex(6), 7); // capstone realm
  assert.equal(resolveCourtRealmIndex(99), 7); // clamp high
  assert.equal(resolveCourtRealmIndex(-3), 1); // clamp low
});

test('W13a resolveCourtStatus mirrors the live activity gate', () => {
  assert.equal(resolveCourtStatus(null, null, false), 'no_path');
  assert.equal(resolveCourtStatus('martial', act('outskirts'), false), 'blocked_by_combat');
  assert.equal(resolveCourtStatus('martial', act('trial'), false), 'blocked_by_combat');
  assert.equal(resolveCourtStatus('martial', act('path_training'), true), 'active');
  assert.equal(resolveCourtStatus('martial', act('meditate'), false), 'blocked_by_activity');
  assert.equal(resolveCourtStatus('martial', act('dao_heart_practice'), false), 'blocked_by_activity');
  assert.equal(resolveCourtStatus('martial', null, false), 'idle');
});

test('W13a buildLiveCourtSurface resolves a no-path state', async () => {
  const defs = await loadDefs();
  const surface = buildLiveCourtSurface({
    selectedPath: null,
    realmIndex0Based: 0,
    cultPct: 0,
    activeActivity: null,
    isCourtTraining: false,
    fatigue: 0,
    intensityId: 'steady',
    perception: 25,
    axes: AXES,
    foundation: FOUNDATION,
    trainingState: { activeMeridianId: null, rootByMeridianId: {}, progressByMeridianId: {} },
    meridianDefs: defs,
  });
  assert.equal(surface.status, 'no_path');
  assert.equal(surface.path, null);
  assert.equal(surface.realm.index1to7, 1);
});

test('W13a buildLiveCourtSurface resolves a live active martial state from real store reads', async () => {
  const defs = await loadDefs();
  const martial = defs.filter((d) => d.path === 'martial').sort((a, b) => a.unlockRealm - b.unlockRealm);
  const activeId = martial[0]?.id ?? null;
  const surface = buildLiveCourtSurface({
    selectedPath: 'martial',
    realmIndex0Based: 3, // → realm 4
    realmName: 'Nascent Soul',
    cultPct: 0.5,
    activeActivity: act('path_training'),
    isCourtTraining: true,
    fatigue: 42,
    intensityId: 'harsh',
    perception: 25,
    axes: AXES,
    foundation: FOUNDATION,
    trainingState: {
      activeMeridianId: activeId,
      rootByMeridianId: activeId ? { [activeId]: 'true' } : {},
      progressByMeridianId: activeId ? { [activeId]: { rating: 30, ratingXp: 0, masteryXp: 0, comprehension: 1 } } : {},
    },
    meridianDefs: defs,
  });
  assert.equal(surface.path, 'martial');
  assert.equal(surface.status, 'active');
  assert.equal(surface.realm.index1to7, 4);
  assert.equal(surface.realm.name, 'Nascent Soul');
  assert.equal(surface.intensity.id, 'harsh');
});
