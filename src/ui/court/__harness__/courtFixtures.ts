import {
  buildTemperingCourtSurface,
  effectiveMeridianCap,
  type CourtIntensityId,
  type CourtPath,
  type CourtStatView,
  type CourtStatus,
  type MeridianTrainingState,
  type PathMeridianDef,
  type SpiritRootGrade,
  type TemperingCourtSurface,
} from '../../../systems/meridians/index.js';

/** Dev-only Appendix-F fixture surfaces (13 Court states), built via
 *  buildTemperingCourtSurface over the real meridian pack. Deterministic — no RNG. */

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
const GRADES: readonly SpiritRootGrade[] = ['true', 'earthly', 'true', 'heavenly', 'true', 'earthly', 'chaos'];
const REALM_NAMES = [
  'Qi Condensation', 'Foundation Establishment', 'Core Formation', 'Nascent Soul', 'Spirit Severing', 'Tribulation', 'Immortal Ascension',
];

interface FixtureCfg {
  path: CourtPath | null;
  realm: number;
  activeUnlockRealm: number;
  status: CourtStatus;
  fatigue: number;
  intensity: CourtIntensityId;
  cultPct: number;
  reducedMotion?: boolean;
  comprehendingUnlockRealm?: number;
  cappedActive?: boolean;
  offline?: boolean;
}

const FIXTURES: Record<string, FixtureCfg> = {
  '01_martial_R2': { path: 'martial', realm: 2, activeUnlockRealm: 2, status: 'active', fatigue: 54, intensity: 'steady', cultPct: 0.4 },
  '02_earth_R3': { path: 'earth', realm: 3, activeUnlockRealm: 3, status: 'active', fatigue: 42, intensity: 'steady', cultPct: 0.55 },
  '03_heaven_R4': { path: 'heaven', realm: 4, activeUnlockRealm: 4, status: 'active', fatigue: 30, intensity: 'steady', cultPct: 0.3, comprehendingUnlockRealm: 4 },
  '04_martial_R1_signature': { path: 'martial', realm: 1, activeUnlockRealm: 1, status: 'active', fatigue: 20, intensity: 'quiet', cultPct: 0.15 },
  '05_heaven_R6': { path: 'heaven', realm: 6, activeUnlockRealm: 6, status: 'active', fatigue: 60, intensity: 'harsh', cultPct: 0.7 },
  '06_earth_R7_all': { path: 'earth', realm: 7, activeUnlockRealm: 1, status: 'active', fatigue: 50, intensity: 'steady', cultPct: 0.95 },
  '07_idle': { path: 'martial', realm: 3, activeUnlockRealm: 2, status: 'idle', fatigue: 30, intensity: 'steady', cultPct: 0.5 },
  '08_blocked_combat': { path: 'martial', realm: 3, activeUnlockRealm: 2, status: 'blocked_by_combat', fatigue: 30, intensity: 'steady', cultPct: 0.5 },
  '09_overworked': { path: 'martial', realm: 3, activeUnlockRealm: 2, status: 'active', fatigue: 88, intensity: 'limit', cultPct: 0.5 },
  '10_reduced_motion': { path: 'martial', realm: 3, activeUnlockRealm: 2, status: 'active', fatigue: 64, intensity: 'steady', cultPct: 0.5, reducedMotion: true },
  '11_capped': { path: 'martial', realm: 4, activeUnlockRealm: 1, status: 'active', fatigue: 46, intensity: 'steady', cultPct: 0.6, cappedActive: true },
  '12_return': { path: 'martial', realm: 3, activeUnlockRealm: 2, status: 'active', fatigue: 54, intensity: 'steady', cultPct: 0.5, offline: true },
  '13_no_path': { path: null, realm: 1, activeUnlockRealm: 1, status: 'no_path', fatigue: 0, intensity: 'steady', cultPct: 0 },
};

export const COURT_FIXTURE_IDS = Object.keys(FIXTURES);

export function buildCourtFixture(
  stateId: string,
  defs: PathMeridianDef[],
): { surface: TemperingCourtSurface; reducedMotion: boolean } {
  const cfg = FIXTURES[stateId] ?? FIXTURES['01_martial_R2'];

  if (!cfg.path) {
    const surface = buildTemperingCourtSurface({
      path: null,
      meridianDefs: defs,
      trainingState: { activeMeridianId: null, rootByMeridianId: {}, progressByMeridianId: {} },
      realmIndex1to7: 1,
      cultPct: 0,
      fatigue: 0,
      intensityId: 'steady',
      status: 'no_path',
      perception: 30,
      axes: AXES,
      foundation: FOUNDATION,
    });
    return { surface, reducedMotion: false };
  }

  const ids = defs.filter((d) => d.path === cfg.path).sort((a, b) => a.unlockRealm - b.unlockRealm);
  const rootByMeridianId: Record<string, SpiritRootGrade> = {};
  ids.forEach((d, i) => {
    rootByMeridianId[d.id] = GRADES[i] ?? 'true';
  });
  const progressByMeridianId: MeridianTrainingState['progressByMeridianId'] = {};
  ids.forEach((d, i) => {
    if (d.unlockRealm > cfg.realm) return;
    const cap = effectiveMeridianCap(cfg.realm, rootByMeridianId[d.id]);
    let frac = Math.max(0.08, 0.78 - i * 0.11);
    if (cfg.cappedActive && d.unlockRealm === cfg.activeUnlockRealm) frac = 1;
    const comprehension = cfg.comprehendingUnlockRealm === d.unlockRealm ? 0.55 : 1;
    progressByMeridianId[d.id] = { rating: Math.round(cap * frac), ratingXp: 0, masteryXp: 200 * (8 - i), comprehension };
  });

  const activeId = ids[cfg.activeUnlockRealm - 1]?.id ?? null;
  const state: MeridianTrainingState = { activeMeridianId: activeId, rootByMeridianId, progressByMeridianId };
  const offlineSummary = cfg.offline
    ? {
        minutes: '5h 12m',
        meridian: ids[cfg.activeUnlockRealm - 1]?.name ?? '',
        gained: '+22 xp',
        ratings: '3 ratings',
        mastery: '+140',
        passive: '+4 xp from 2 fights',
        fatigue: 88,
        tier: 'Strained',
        downgrades: 3,
      }
    : null;

  const surface = buildTemperingCourtSurface({
    path: cfg.path,
    meridianDefs: defs,
    trainingState: state,
    realmIndex1to7: cfg.realm,
    cultPct: cfg.cultPct,
    fatigue: cfg.fatigue,
    intensityId: cfg.intensity,
    status: cfg.status,
    perception: 30,
    axes: AXES,
    foundation: FOUNDATION,
    realmName: REALM_NAMES[Math.min(cfg.realm, 7) - 1],
    offlineSummary,
  });
  return { surface, reducedMotion: cfg.reducedMotion ?? false };
}
