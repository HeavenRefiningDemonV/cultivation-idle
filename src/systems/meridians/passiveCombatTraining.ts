import { advanceMeridian, type MeridianTrainingState } from './meridianTrainingState.js';

/**
 * W5 — passive combat training (§2.9), ADDITIVE. Each meridian is also honed in combat
 * by a themed trigger, feeding the SAME meridian a fraction of the Court rate through
 * the SAME advanceMeridian path (so caps / overflow / mastery apply identically).
 * Online-only, per-fight capped, so it supplements deliberate training without
 * replacing it.
 *
 * This module is the pure logic + the trigger→meridian mapping. The live wiring (a
 * GameEvents subscription to CombatStore's `combat/resolved` — there is no external
 * store.subscribe — and the CombatStore-event → CombatTriggerKind mapping) is added on
 * the flag-gated path (W7), keeping CombatStore + techniques byte-identical.
 */

export type CombatTriggerKind =
  // Martial
  | 'weapon_skill_damage'
  | 'dodge_reposition'
  | 'consecutive_hits'
  | 'opening_execute'
  | 'counter_parry'
  | 'sustained_offense'
  | 'high_realm_kill'
  // Earth
  | 'take_deal_physical'
  | 'block_being_hit'
  | 'endure_dot'
  | 'hold_ground'
  | 'absorb_hits'
  | 'tank_taunt'
  | 'survive_lethal'
  // Heaven
  | 'precise_ranged_hit'
  | 'dodge_perceive'
  | 'resist_soul_mental'
  | 'composure'
  | 'soul_curse_effect'
  | 'control_suppress'
  | 'high_realm_soul_kill';

/** 1:1 structured form of the pack `trigger` column (Appendix A): meridian id → kind. */
export const MERIDIAN_TRIGGER_KIND: Record<string, CombatTriggerKind> = {
  martial_weapon_intent: 'weapon_skill_damage',
  martial_flowing_step: 'dodge_reposition',
  martial_battle_rhythm: 'consecutive_hits',
  martial_killing_intent: 'opening_execute',
  martial_sword_heart: 'counter_parry',
  martial_unbroken_momentum: 'sustained_offense',
  martial_dao_asura: 'high_realm_kill',
  earth_body_temper: 'take_deal_physical',
  earth_bone_forging: 'block_being_hit',
  earth_marrow_essence: 'endure_dot',
  earth_root_depth: 'hold_ground',
  earth_iron_skin: 'absorb_hits',
  earth_mountain_stance: 'tank_taunt',
  earth_dao_sovereign: 'survive_lethal',
  heaven_spirit_sense: 'precise_ranged_hit',
  heaven_mind_eye: 'dodge_perceive',
  heaven_soul_clarity: 'resist_soul_mental',
  heaven_dao_heart: 'composure',
  heaven_void_gaze: 'soul_curse_effect',
  heaven_heavenly_mandate: 'control_suppress',
  heaven_dao_firmament: 'high_realm_soul_kill',
};

const MERIDIAN_BY_TRIGGER_KIND: Record<string, string> = Object.fromEntries(
  Object.entries(MERIDIAN_TRIGGER_KIND).map(([meridianId, kind]) => [kind, meridianId]),
);

/** The meridian a combat trigger hones (1:1), or null for an unknown kind. */
export function meridianForTriggerKind(kind: CombatTriggerKind): string | null {
  return MERIDIAN_BY_TRIGGER_KIND[kind] ?? null;
}

/** Passive combat rate as a fraction of the Court rate (§2.9, D6) ‹tune W12›. */
export const PASSIVE_RATE = 0.15;

/** Default per-fight passive cap so combat supplements, never replaces, the Court ‹tune W12›. */
export const DEFAULT_PER_FIGHT_PASSIVE_CAP = 12;

export interface ApplyCombatPassiveInput {
  state: MeridianTrainingState;
  triggerKind: CombatTriggerKind;
  /** the meridian's full Court-rate amount for this event (baseRate × mult × dt), precomputed. */
  courtRateAmount: number;
  realmIndex1to7: number;
  unlockRealm: number;
  /** passive XP already granted this fight (for the per-fight cap). */
  perFightAccrued: number;
  perFightCap?: number;
  perception?: number;
  /** online-only: combat passive never accrues offline (§2.9). */
  online?: boolean;
}

export interface ApplyCombatPassiveResult {
  state: MeridianTrainingState;
  meridianId: string | null;
  granted: number; // passive XP actually applied (post-cap)
  ratingGained: number;
  perFightAccrued: number;
  skipped: null | 'offline' | 'unknown-trigger' | 'not-active-path' | 'sealed' | 'cap-reached';
}

/**
 * Apply one combat trigger's passive XP to the matching meridian, capped per fight,
 * via advanceMeridian(..., 'combat'). Returns a new state; no-ops (with a `skipped`
 * reason) when offline, the meridian isn't on the cultivator's path, it's sealed, or
 * the per-fight cap is exhausted.
 */
export function applyCombatPassive(input: ApplyCombatPassiveInput): ApplyCombatPassiveResult {
  const {
    state,
    triggerKind,
    courtRateAmount,
    realmIndex1to7,
    unlockRealm,
    perFightAccrued,
    perFightCap = DEFAULT_PER_FIGHT_PASSIVE_CAP,
    perception,
    online = true,
  } = input;

  const noop = (skipped: ApplyCombatPassiveResult['skipped'], meridianId: string | null = null): ApplyCombatPassiveResult => ({
    state,
    meridianId,
    granted: 0,
    ratingGained: 0,
    perFightAccrued,
    skipped,
  });

  if (!online) return noop('offline');

  const meridianId = meridianForTriggerKind(triggerKind);
  if (!meridianId) return noop('unknown-trigger');
  // The trigger only hones the cultivator's own path: skip if the meridian isn't theirs.
  if (!(meridianId in state.rootByMeridianId)) return noop('not-active-path', meridianId);
  if (unlockRealm > realmIndex1to7) return noop('sealed', meridianId);

  const remaining = perFightCap - perFightAccrued;
  if (remaining <= 0) return noop('cap-reached', meridianId);

  const granted = Math.min(Math.max(0, courtRateAmount) * PASSIVE_RATE, remaining);
  if (granted <= 0) return noop('cap-reached', meridianId);

  const advance = advanceMeridian({
    state,
    meridianId,
    amount: granted,
    source: 'combat',
    realmIndex1to7,
    unlockRealm,
    perception,
  });

  return {
    state: advance.state,
    meridianId,
    granted,
    ratingGained: advance.ratingGained,
    perFightAccrued: perFightAccrued + granted,
    skipped: null,
  };
}
