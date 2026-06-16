import type { MeridianCombatEffect, PathMeridianDef } from '../../content/types.js';
import {
  COURT_INTENSITY_RATE,
  computeMeridianRate,
  fatigueDampening,
  type CourtIntensityId,
  type RateFactor,
} from './computeMeridianRate.js';
import {
  MERIDIAN_REALM_CAPS,
  MERIDIAN_ROOTS,
  effectiveMeridianCap,
  type MeridianView,
} from './meridianModel.js';
import {
  MERIDIAN_MASTERY_MILESTONES,
  createMeridianProgress,
  masteryRankFromXp,
  meridianCapState,
  type MeridianTrainingState,
} from './meridianTrainingState.js';

/**
 * W6 — the render-only Tempering Court surface (Appendix K.3), ADDITIVE. A NEW surface
 * (not an extension of the live TrainingHallSurfaceV1, which stays intact until W13) so
 * the old hall + its contract test are untouched. The builder assembles the snapshot
 * from the W2–W5 engine pieces; the W7 UI renders it and recomputes nothing.
 */

export type CourtStatus = 'active' | 'idle' | 'blocked_by_combat' | 'blocked_by_activity' | 'no_path';
export type CourtPath = 'martial' | 'earth' | 'heaven';

export type CourtAlertTone = 'jade' | 'gold' | 'cinn' | 'ink';
export interface CourtAlert {
  tone: CourtAlertTone;
  glyph: string;
  text: string;
}

export interface CourtStatView {
  id: string;
  zi: string;
  name: string;
  value?: number;
  grade?: string;
}

export interface CourtRealmView {
  index1to7: number;
  name: string;
  cap: number;
  unlockedCount: number;
  nextUnlock: { name: string; realm: string } | null;
  cultPct: number;
}

export interface CourtRateView {
  mult: number;
  clampMax: number;
  factors: RateFactor[];
}

export interface CourtHeatView {
  value: number;
  tier: 'fresh' | 'tiring' | 'strained' | 'overworked';
  damp: number;
}

export interface CourtIntensityView {
  id: CourtIntensityId;
  label: string;
  mult: number;
  fpm: number;
}

export interface CourtOfflineSummary {
  minutes: string;
  meridian: string;
  gained: string;
  ratings: string;
  mastery: string;
  passive: string;
  fatigue: number;
  tier: string;
  downgrades: number;
}

export interface TemperingCourtSurface {
  path: CourtPath | null;
  status: CourtStatus;
  realm: CourtRealmView;
  activeMeridian: MeridianView | null;
  meridians: MeridianView[];
  tiers: { axes: CourtStatView[]; foundation: CourtStatView[] };
  rate: CourtRateView;
  heat: CourtHeatView;
  intensity: CourtIntensityView;
  alerts: CourtAlert[];
  offlineSummary: CourtOfflineSummary | null;
}

/** The Court's 7-realm display ladder (artifact). NOTE: live realms are 6
 *  (…Soul Formation, Spirit Severing); W7/W8 reconcile the active realm's display name
 *  with the live runtime. R7 (Immortal Ascension) is the sealed capstone realm. */
export const COURT_REALM_NAMES = [
  'Qi Condensation',
  'Foundation Establishment',
  'Core Formation',
  'Nascent Soul',
  'Spirit Severing',
  'Tribulation',
  'Immortal Ascension',
] as const;

export const COURT_INTENSITY_FPM: Record<CourtIntensityId, number> = {
  quiet: 0.04,
  steady: 0.14,
  harsh: 0.35,
  limit: 0.75,
};

const COURT_INTENSITY_LABEL: Record<CourtIntensityId, string> = {
  quiet: 'Quiet',
  steady: 'Steady',
  harsh: 'Harsh',
  limit: 'Limit',
};

export function forgeHeatTier(fatigue: number): CourtHeatView['tier'] {
  if (fatigue >= 80) return 'overworked';
  if (fatigue >= 60) return 'strained';
  if (fatigue >= 35) return 'tiring';
  return 'fresh';
}

function nextMasteryMilestone(masteryXp: number): number {
  for (const milestone of MERIDIAN_MASTERY_MILESTONES) {
    if (masteryXp < milestone) return milestone;
  }
  return MERIDIAN_MASTERY_MILESTONES[MERIDIAN_MASTERY_MILESTONES.length - 1];
}

export interface BuildCourtSurfaceInput {
  path: CourtPath | null;
  /** Meridian defs for the active path (any order; builder sorts by unlockRealm). */
  meridianDefs: PathMeridianDef[];
  trainingState: MeridianTrainingState;
  realmIndex1to7: number;
  cultPct: number;
  fatigue: number;
  intensityId: CourtIntensityId;
  status: CourtStatus;
  perception: number;
  axes: CourtStatView[];
  foundation: CourtStatView[];
  realmName?: string; // active realm's display name (from the live runtime in W7)
  offlineSummary?: CourtOfflineSummary | null;
}

function buildMeridianView(
  def: PathMeridianDef,
  index: number,
  input: BuildCourtSurfaceInput,
): MeridianView {
  const { trainingState, realmIndex1to7 } = input;
  const grade = trainingState.rootByMeridianId[def.id] ?? 'true';
  const root = MERIDIAN_ROOTS[grade];
  const progress = trainingState.progressByMeridianId[def.id] ?? createMeridianProgress(false);
  const unlocked = def.unlockRealm <= realmIndex1to7;
  const cap = effectiveMeridianCap(realmIndex1to7, grade);
  const capPct = cap > 0 ? progress.rating / cap : 0;
  const eff: MeridianCombatEffect[] = def.eff.map((effect) => ({ tone: effect.tone, label: effect.label }));
  return {
    id: def.id,
    zi: def.zi,
    name: def.name,
    exercise: def.exercise,
    room: def.room,
    trigger: def.trigger,
    unlocked,
    unlockRealm: def.unlockRealm,
    rating: progress.rating,
    cap,
    capPct,
    capState: meridianCapState(capPct),
    isActive: trainingState.activeMeridianId === def.id,
    isBottleneck: false, // assigned after the full list is built
    root,
    mastery: { rank: masteryRankFromXp(progress.masteryXp), nextMilestone: nextMasteryMilestone(progress.masteryXp) },
    traitRank: def.traitRank,
    trait: def.trait,
    comp: progress.comprehension,
    eff,
    pathEffect: def.pathEffect,
    index,
  };
}

export function buildTemperingCourtSurface(input: BuildCourtSurfaceInput): TemperingCourtSurface {
  const realmIndex = Math.min(Math.max(input.realmIndex1to7, 1), 7);
  const realmName = input.realmName ?? COURT_REALM_NAMES[realmIndex - 1];

  const ordered = input.path
    ? input.meridianDefs.filter((def) => def.path === input.path).slice().sort((a, b) => a.unlockRealm - b.unlockRealm)
    : [];
  const meridians = ordered.map((def, index) => buildMeridianView(def, index, input));

  // Bottleneck = the unlocked meridian furthest from its cap (lowest capPct).
  const unlocked = meridians.filter((meridian) => meridian.unlocked);
  if (unlocked.length > 0) {
    let bottleneck = unlocked[0];
    for (const meridian of unlocked) {
      if (meridian.capPct < bottleneck.capPct) bottleneck = meridian;
    }
    bottleneck.isBottleneck = true;
  }

  const activeMeridian = meridians.find((meridian) => meridian.isActive && meridian.unlocked) ?? null;

  const rate: CourtRateView = activeMeridian
    ? (() => {
        const result = computeMeridianRate({
          intensityId: input.intensityId,
          fatigue: input.fatigue,
          perception: input.perception,
          rootGrade: activeMeridian.root.key,
          masteryRank: activeMeridian.mastery.rank,
          comprehension: activeMeridian.comp,
          capPct: activeMeridian.capPct,
        });
        return { mult: result.mult, clampMax: result.clampMax, factors: result.factors };
      })()
    : { mult: 0, clampMax: 2.25, factors: [] };

  const unlockedCount = meridians.filter((meridian) => meridian.unlocked).length;
  const nextDef = ordered.find((def) => def.unlockRealm === realmIndex + 1) ?? null;
  const nextUnlock = nextDef
    ? { name: nextDef.name, realm: COURT_REALM_NAMES[Math.min(nextDef.unlockRealm, 7) - 1] }
    : null;

  return {
    path: input.path,
    status: input.status,
    realm: {
      index1to7: realmIndex,
      name: realmName,
      cap: MERIDIAN_REALM_CAPS[realmIndex - 1],
      unlockedCount,
      nextUnlock,
      cultPct: Math.max(0, Math.min(1, input.cultPct)),
    },
    activeMeridian,
    meridians,
    tiers: { axes: input.axes, foundation: input.foundation },
    rate,
    heat: { value: input.fatigue, tier: forgeHeatTier(input.fatigue), damp: fatigueDampening(input.fatigue) },
    intensity: {
      id: input.intensityId,
      label: COURT_INTENSITY_LABEL[input.intensityId],
      mult: COURT_INTENSITY_RATE[input.intensityId],
      fpm: COURT_INTENSITY_FPM[input.intensityId],
    },
    alerts: buildCourtAlerts(input, meridians, activeMeridian),
    offlineSummary: input.offlineSummary ?? null,
  };
}

function buildCourtAlerts(
  input: BuildCourtSurfaceInput,
  meridians: MeridianView[],
  activeMeridian: MeridianView | null,
): CourtAlert[] {
  const alerts: CourtAlert[] = [];
  if (input.status === 'no_path') {
    alerts.push({ tone: 'ink', glyph: '無', text: 'Choose a path at Life Start to open the Court.' });
    return alerts;
  }
  if (input.status === 'blocked_by_combat') {
    alerts.push({ tone: 'cinn', glyph: '戰', text: 'The Court is closed while you are in combat.' });
  }
  if (activeMeridian?.capState === 'capped') {
    alerts.push({ tone: 'gold', glyph: '滿', text: `${activeMeridian.name} reached its realm cap — overflow now feeds mastery.` });
  }
  if (activeMeridian && activeMeridian.comp < 1) {
    const pct = Math.round(activeMeridian.comp * 100);
    alerts.push({ tone: 'gold', glyph: '悟', text: `Still comprehending ${activeMeridian.name} — ${pct}% learned; rate climbs as you grasp the form.` });
  }
  const bottleneck = meridians.find((meridian) => meridian.isBottleneck);
  if (bottleneck && bottleneck !== activeMeridian && bottleneck.unlocked) {
    alerts.push({ tone: 'cinn', glyph: '滯', text: `${bottleneck.name} is your bottleneck — furthest from its cap.` });
  }
  return alerts.slice(0, 3);
}
