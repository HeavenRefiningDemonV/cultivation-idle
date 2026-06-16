import type { MeridianCombatEffect, MeridianPathId, PathMeridianDef } from '../../content/types.js';

export type { MeridianCombatEffect, MeridianPathId, PathMeridianDef };

/** Spirit-root aptitude grade rolled per meridian at Life Start; re-rolled only by prestige (§2.3). */
export type SpiritRootGrade = 'heavenly' | 'true' | 'earthly' | 'mortal' | 'chaos';

export interface MeridianRootDef {
  key: SpiritRootGrade;
  label: string;
  /** Court root-chip grade key (matches courtChips .courtRootChip--<chipClass>). */
  chipClass: SpiritRootGrade;
  /** multiplies the meridian's realm cap (§2.3). */
  capMult: number;
  /** multiplies the meridian's training + passive rate (§2.5). */
  rateMult: number;
}

export const MERIDIAN_ROOTS: Record<SpiritRootGrade, MeridianRootDef> = {
  heavenly: { key: 'heavenly', label: 'Heavenly Root', chipClass: 'heavenly', capMult: 1.6, rateMult: 1.8 },
  true: { key: 'true', label: 'True Root', chipClass: 'true', capMult: 1.3, rateMult: 1.4 },
  earthly: { key: 'earthly', label: 'Earthly Root', chipClass: 'earthly', capMult: 1.1, rateMult: 1.1 },
  mortal: { key: 'mortal', label: 'Mortal Root', chipClass: 'mortal', capMult: 0.9, rateMult: 0.85 },
  // Chaos: high but volatile — flavor-fixed in v1; real variance deferred to W12 (D5).
  chaos: { key: 'chaos', label: 'Chaos Root', chipClass: 'chaos', capMult: 1.45, rateMult: 1.6 },
};

export const SPIRIT_ROOT_GRADES: readonly SpiritRootGrade[] = ['heavenly', 'true', 'earthly', 'mortal', 'chaos'];

/**
 * Realm meridian-cap ladder, R1..R7. The R7 (Immortal Ascension) cap of 170 is the
 * one sanctioned constant addition. The legacy tri-stat TRAINING_REALM_BAND_MAX stays
 * 6-length until W3's engine rewrite — this is a SEPARATE constant for the new model.
 * R7 is reachable only once the capstone meridian unseals; in the live 6-realm content
 * slice the capstone renders sealed (authored-but-sealed per the locked decision).
 */
export const MERIDIAN_REALM_CAPS = [40, 60, 80, 100, 125, 150, 170] as const;

export const MERIDIAN_COUNT_PER_PATH = 7;

/** Effective per-meridian cap = round(realmCap × root.capMult) (§2.3 / §2.4). */
export function effectiveMeridianCap(realmIndex1to7: number, grade: SpiritRootGrade): number {
  const clamped = Math.min(Math.max(Math.trunc(realmIndex1to7), 1), MERIDIAN_REALM_CAPS.length);
  return Math.round(MERIDIAN_REALM_CAPS[clamped - 1] * MERIDIAN_ROOTS[grade].capMult);
}

/** A meridian is unlocked at realm R when unlockRealm <= R (§2.4 drip cadence). */
export function isMeridianUnlocked(unlockRealm: number, realmIndex1to7: number): boolean {
  return unlockRealm <= realmIndex1to7;
}

export type MeridianCapState = 'open' | 'near_cap' | 'capped';

/** Per-cultivator spirit-root roll: meridianId -> grade. Persisted in save (wired in W3). */
export type MeridianRootRoll = Record<string, SpiritRootGrade>;

/**
 * Render-only computed shape the Court + Observatory consume (Appendix K.3). The W6
 * surface builder assembles this from PathMeridianDef + save state; nothing here is
 * recomputed in components.
 */
export interface MeridianView {
  id: string;
  zi: string;
  name: string;
  exercise: string;
  room: string;
  trigger: string;
  unlocked: boolean;
  unlockRealm: number;
  rating: number;
  cap: number;
  capPct: number;
  capState: MeridianCapState;
  isActive: boolean;
  isBottleneck: boolean;
  root: MeridianRootDef;
  mastery: { rank: number; nextMilestone: number };
  traitRank: number;
  trait: string;
  comp: number;
  eff: MeridianCombatEffect[];
  pathEffect: string;
  index: number;
}
