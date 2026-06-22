import type { RunCompassActionTarget } from '../../systems/ui/runCompass/types.js';
import type { BreakthroughMethod } from '../../services/events/GameEvents.js';

export type BreakthroughRitualMode = 'preview' | 'result';
export type BreakthroughScale = 'minor_substage' | 'major_realm';
export type { BreakthroughMethod };

export interface BreakthroughRealmSurface {
  index: number;
  substage: number;
  name: string;
  realmId?: string | null;
}

export interface BreakthroughSpentItemSurface {
  itemId: string;
  name: string;
  qty: number;
  source: 'gate_resolver' | 'progression_contract' | 'event' | 'fallback';
}

export interface BreakthroughStatDeltaSurface {
  id: string;
  label: string;
  before: string;
  after: string;
  delta: string;
  tone: 'positive' | 'neutral' | 'warning';
}

export interface BreakthroughUnlockSurface {
  id: string;
  title: string;
  detail: string;
  category: 'realm' | 'city' | 'technique_slot' | 'path_perk' | 'heart_law' | 'meridian' | 'module' | 'content_cap' | 'other';
  routeTarget?: RunCompassActionTarget | null;
}

/** M.II.1 — the single path meridian a major breakthrough reveals (the wax-seal-break, M.II.3). */
export interface BreakthroughMeridianRevealSurface {
  meridianId: string;
  label: string;
  effectLine: string;
  pathId: 'heaven' | 'earth' | 'martial';
}

export interface BreakthroughCityHandoffSurface {
  cityId: string;
  cityName: string;
  lessonTitle: string;
  lessonDetail: string;
  primaryModuleLabel: string;
  routeTarget: RunCompassActionTarget | null;
}

export interface BreakthroughDoctrineEchoSurface {
  title: string;
  line: string;
  heartLawId?: string | null;
  heartLawLabel?: string | null;
  resonanceLabel?: string | null;
}

export interface BreakthroughRitualSurfaceV1 {
  version: 1;
  mode: BreakthroughRitualMode;
  scale: BreakthroughScale;
  id: string;
  createdAt: number;
  fromRealm: BreakthroughRealmSurface;
  toRealm: BreakthroughRealmSurface;
  proofItemSpent: BreakthroughSpentItemSurface | null;
  qi: {
    requiredLabel: string;
    spentLabel: string;
    remainingLabel?: string;
    wasReady: boolean;
  };
  stabilityDelta: {
    beforeLabel?: string;
    afterLabel?: string;
    deltaLabel?: string;
    explanation: string;
    confidence: 'exact' | 'derived' | 'unknown';
  } | null;
  statDelta: BreakthroughStatDeltaSurface[];
  unlockCascade: BreakthroughUnlockSurface[];
  cityUnlocked: BreakthroughCityHandoffSurface | null;
  /** M.II.1 — null on minor substage / no path / capstone-beyond-cap. */
  meridianRevealed: BreakthroughMeridianRevealSurface | null;
  doctrineEcho: BreakthroughDoctrineEchoSurface | null;
  lifeMemoryLine: string;
  nextMilestone: {
    title: string;
    detail: string;
    primaryRouteLabel: string;
    target: RunCompassActionTarget | null;
  } | null;
  method: BreakthroughMethod;
  warnings: string[];
  debugNotes: string[];
}

export interface BreakthroughRitualBuildSnapshot {
  id?: string;
  createdAt?: number;
  mode: BreakthroughRitualMode;
  fromRealm: BreakthroughRealmSurface;
  toRealm: BreakthroughRealmSurface;
  proofItemSpent?: BreakthroughSpentItemSurface | null;
  qi: BreakthroughRitualSurfaceV1['qi'];
  stabilityDelta?: BreakthroughRitualSurfaceV1['stabilityDelta'];
  statSnapshotBefore?: Record<string, string | number> | null;
  statSnapshotAfter?: Record<string, string | number> | null;
  cityUnlockedIds?: string[];
  cityNamesById?: Record<string, string | undefined>;
  currentCityId?: string | null;
  heartLawId?: string | null;
  heartLawLabel?: string | null;
  resonanceLabel?: string | null;
  meridianRevealed?: BreakthroughMeridianRevealSurface | null;
  method?: BreakthroughMethod;
  contentCapReached?: boolean;
  nextRoute?: BreakthroughRitualSurfaceV1['nextMilestone'];
  warnings?: string[];
  debugNotes?: string[];
}
