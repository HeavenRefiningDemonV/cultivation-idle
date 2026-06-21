/**
 * W4 — the Tier-3 derived-stat layer (Appendix B), as a pure, memoizable resolver.
 * Combat reads ONLY Tier-3; Tier-3 is computed from Tiers 0/1/2 + gear and never
 * trained directly. ADDITIVE: this is a standalone resolver. It is NOT yet wired into
 * the live combat read path — the technique scaling + equipment resolvers and
 * gameStore.calculatePlayerStats are OFF-LIMITS and read legacy stat ids by name, so
 * the actual consumption is wired on the flag-gated path (W6/W7/W13). Techniques stay
 * byte-identical (the packet's hard rule).
 *
 * The single source MERIDIAN_DERIVED_MAP is shared by the resolver AND the codex
 * "In combat" chips (via meridianDerivedTargets) so UI and engine never drift.
 * All coefficients are ‹tune W12› — the structure (which source feeds which stat) is
 * the fixed contract.
 */

export type DerivedStatKey =
  | 'maxHp'
  | 'hpRegen'
  | 'physAttack'
  | 'physDefense'
  | 'flatDamageReduction'
  | 'qiPool'
  | 'qiRegen'
  | 'speed'
  | 'initiative'
  | 'attackSpeed'
  | 'accuracy'
  | 'evasion'
  | 'critChance'
  | 'critDamage'
  | 'armorPen'
  | 'soulAttack'
  | 'soulDefense'
  | 'controlPower'
  | 'tribulationResist'
  | 'suppression'
  | 'staggerResist';

export const DERIVED_STAT_KEYS: readonly DerivedStatKey[] = [
  'maxHp', 'hpRegen', 'physAttack', 'physDefense', 'flatDamageReduction',
  'qiPool', 'qiRegen', 'speed', 'initiative', 'attackSpeed',
  'accuracy', 'evasion', 'critChance', 'critDamage', 'armorPen',
  'soulAttack', 'soulDefense', 'controlPower', 'tribulationResist',
  'suppression', 'staggerResist',
];

export type FoundationKey = 'physique' | 'vitality' | 'agility' | 'perception' | 'willpower';
export type AxisKey =
  | 'cultivationBase'
  | 'qiPool'
  | 'qiPurity'
  | 'meridianOpenness'
  | 'spiritualSense'
  | 'soulStrength'
  | 'daoComprehension';
export type DerivedSourceKey = FoundationKey | AxisKey;

export type DerivedWeight = 'up' | 'upup';
export type DerivedEffectTone = 'atk' | 'def' | 'util';

export interface MeridianDerivedTarget {
  channel: DerivedStatKey;
  weight: DerivedWeight;
}

/** Tier-2 contributions: each meridian id → the derived channels it feeds (Appendix A/B).
 *  This is the single shared source for both the resolver and the codex chips. */
export const MERIDIAN_DERIVED_MAP: Record<string, MeridianDerivedTarget[]> = {
  // Martial
  martial_weapon_intent: [{ channel: 'physAttack', weight: 'upup' }],
  martial_flowing_step: [
    { channel: 'speed', weight: 'up' },
    { channel: 'evasion', weight: 'up' },
    { channel: 'initiative', weight: 'up' },
  ],
  martial_battle_rhythm: [
    { channel: 'attackSpeed', weight: 'upup' },
    { channel: 'speed', weight: 'up' },
  ],
  martial_killing_intent: [
    { channel: 'critChance', weight: 'upup' },
    { channel: 'suppression', weight: 'up' },
  ],
  martial_sword_heart: [
    { channel: 'critDamage', weight: 'upup' },
    { channel: 'armorPen', weight: 'up' },
  ],
  martial_unbroken_momentum: [{ channel: 'staggerResist', weight: 'up' }],
  martial_dao_asura: [
    { channel: 'physAttack', weight: 'up' },
    { channel: 'critDamage', weight: 'up' },
  ],
  // Earth
  earth_body_temper: [
    { channel: 'maxHp', weight: 'upup' },
    { channel: 'physDefense', weight: 'up' },
    { channel: 'physAttack', weight: 'up' }, // W12: Appendix B body-attack
  ],
  earth_bone_forging: [{ channel: 'physDefense', weight: 'upup' }],
  earth_marrow_essence: [
    { channel: 'hpRegen', weight: 'upup' },
    { channel: 'qiPool', weight: 'up' },
    { channel: 'maxHp', weight: 'up' }, // W12: Appendix B (Earth scales HP hard)
  ],
  earth_root_depth: [{ channel: 'staggerResist', weight: 'upup' }],
  earth_iron_skin: [
    { channel: 'flatDamageReduction', weight: 'upup' },
    { channel: 'physDefense', weight: 'up' }, // W12: Appendix B (Iron Skin → Phys Def)
  ],
  earth_mountain_stance: [
    { channel: 'physDefense', weight: 'up' },
    { channel: 'flatDamageReduction', weight: 'up' },
    { channel: 'staggerResist', weight: 'up' }, // W12: Appendix B (Mountain Stance → Stagger)
  ],
  earth_dao_sovereign: [
    { channel: 'maxHp', weight: 'up' },
    { channel: 'physDefense', weight: 'up' },
  ],
  // Heaven
  heaven_spirit_sense: [
    { channel: 'accuracy', weight: 'upup' },
    { channel: 'soulAttack', weight: 'up' },
  ],
  heaven_mind_eye: [
    { channel: 'evasion', weight: 'upup' },
    { channel: 'critChance', weight: 'up' },
  ],
  heaven_soul_clarity: [{ channel: 'soulDefense', weight: 'upup' }],
  heaven_dao_heart: [
    { channel: 'tribulationResist', weight: 'upup' },
    { channel: 'qiRegen', weight: 'up' },
  ],
  heaven_void_gaze: [
    { channel: 'soulAttack', weight: 'upup' },
    { channel: 'armorPen', weight: 'up' },
  ],
  heaven_heavenly_mandate: [
    { channel: 'controlPower', weight: 'upup' },
    { channel: 'suppression', weight: 'up' },
  ],
  heaven_dao_firmament: [
    { channel: 'controlPower', weight: 'up' },
    { channel: 'soulAttack', weight: 'up' },
  ],
};

/** Display metadata for the codex "In combat" chips (tone matches courtChips). */
export const DERIVED_STAT_DISPLAY: Record<DerivedStatKey, { label: string; tone: DerivedEffectTone }> = {
  maxHp: { label: 'Max HP', tone: 'def' },
  hpRegen: { label: 'HP Regen', tone: 'def' },
  physAttack: { label: 'Physical Attack', tone: 'atk' },
  physDefense: { label: 'Physical Defense', tone: 'def' },
  flatDamageReduction: { label: 'Flat DR', tone: 'def' },
  qiPool: { label: 'Qi Pool', tone: 'util' },
  qiRegen: { label: 'Qi Regen', tone: 'util' },
  speed: { label: 'Speed', tone: 'util' },
  initiative: { label: 'Initiative', tone: 'util' },
  attackSpeed: { label: 'Attack Speed', tone: 'atk' },
  accuracy: { label: 'Accuracy', tone: 'util' },
  evasion: { label: 'Evasion', tone: 'def' },
  critChance: { label: 'Crit Chance', tone: 'atk' },
  critDamage: { label: 'Crit Damage', tone: 'atk' },
  armorPen: { label: 'Armor Pen', tone: 'atk' },
  soulAttack: { label: 'Soul Attack', tone: 'atk' },
  soulDefense: { label: 'Soul Defense', tone: 'def' },
  controlPower: { label: 'Control Power', tone: 'util' },
  tribulationResist: { label: 'Tribulation Resist', tone: 'def' },
  suppression: { label: 'Suppression', tone: 'util' },
  staggerResist: { label: 'Stagger / CC Resist', tone: 'def' },
};

/** Tier-0/1 contributions per derived stat (Appendix B; coefficients ‹tune W12›). */
export const DERIVED_TIER01_SOURCES: Record<DerivedStatKey, Array<{ stat: DerivedSourceKey; k: number }>> = {
  maxHp: [{ stat: 'vitality', k: 1.2 }, { stat: 'physique', k: 0.8 }],
  hpRegen: [{ stat: 'vitality', k: 0.4 }, { stat: 'meridianOpenness', k: 0.3 }],
  physAttack: [{ stat: 'physique', k: 0.8 }],
  physDefense: [{ stat: 'physique', k: 0.5 }],
  flatDamageReduction: [],
  qiPool: [{ stat: 'cultivationBase', k: 0.6 }, { stat: 'meridianOpenness', k: 0.5 }, { stat: 'qiPurity', k: 0.4 }],
  qiRegen: [{ stat: 'meridianOpenness', k: 0.5 }],
  speed: [{ stat: 'agility', k: 0.9 }],
  initiative: [{ stat: 'agility', k: 0.7 }],
  attackSpeed: [{ stat: 'agility', k: 0.4 }],
  accuracy: [{ stat: 'perception', k: 0.5 }, { stat: 'spiritualSense', k: 0.6 }],
  evasion: [{ stat: 'agility', k: 0.6 }],
  critChance: [{ stat: 'perception', k: 0.4 }],
  critDamage: [],
  armorPen: [],
  soulAttack: [{ stat: 'spiritualSense', k: 0.7 }, { stat: 'soulStrength', k: 0.5 }],
  soulDefense: [{ stat: 'willpower', k: 0.6 }, { stat: 'soulStrength', k: 0.6 }],
  controlPower: [{ stat: 'soulStrength', k: 0.5 }, { stat: 'spiritualSense', k: 0.4 }],
  tribulationResist: [{ stat: 'willpower', k: 0.5 }, { stat: 'daoComprehension', k: 0.6 }],
  suppression: [{ stat: 'qiPurity', k: 0.5 }],
  staggerResist: [{ stat: 'willpower', k: 0.5 }],
};

export const DERIVED_BASE: Partial<Record<DerivedStatKey, number>> = {
  maxHp: 50,
  qiPool: 20,
  physAttack: 5,
  physDefense: 5,
};

/** Meridian weight → contribution coefficient (‹tune W12›). */
export const DERIVED_WEIGHT_COEF: Record<DerivedWeight, number> = { up: 0.6, upup: 1.2 };

/**
 * F1 SA-A2 — the realm-scalar growth ratio (Option A, derived-authoritative). The derived
 * layer carries the realm magnitude HERE; the legacy REALMS curve is the parity TARGET (read,
 * never edited). The legacy ladder is a clean geometric ×5.0 per realm (REALMS HP
 * 100→312,500), so the scalar is geometric at the same ratio — and the GEO calibration
 * (combatStatBridge.GEO_CALIBRATION) aligns the per-channel shape so derived base × scalar
 * reproduces the legacy band at every realm. [tune → D15 §7.1]; fixed by the SA-A2 parity gate.
 */
export const REALM_SCALAR_RATIO = 5;

/** The Court realm ladder length (1..7; R7 sealed). Mirrors MERIDIAN_REALM_CAPS.length. */
const REALM_LADDER_LENGTH = 7;

export function derivedRealmScalar(realmIndex1to7: number): number {
  const clamped = Math.min(Math.max(Math.trunc(realmIndex1to7), 1), REALM_LADDER_LENGTH);
  return Math.pow(REALM_SCALAR_RATIO, clamped - 1); // realm 1 → ρ^0 = 1.0 (preserves the pinned anchor)
}

export interface DerivedStatInput {
  foundation: Record<FoundationKey, number>;
  axes: Record<AxisKey, number>;
  /** Tier-2: meridian id → rating (only unlocked meridians of the active path). */
  meridianRatings: Record<string, number>;
  realmIndex1to7: number;
}

/** The codex "In combat" chips for a meridian — shares MERIDIAN_DERIVED_MAP with the
 *  resolver, so the preview and the math can never drift (§2.10). */
export function meridianDerivedTargets(meridianId: string): MeridianDerivedTarget[] {
  return MERIDIAN_DERIVED_MAP[meridianId] ?? [];
}

/** Compute all Tier-3 derived stats (Appendix B general form). Pure → memoizable. */
export function computeDerivedStats(
  input: DerivedStatInput,
  gear: Partial<Record<DerivedStatKey, number>> = {},
): Record<DerivedStatKey, number> {
  const scalar = derivedRealmScalar(input.realmIndex1to7);
  const sources: Record<string, number> = { ...input.foundation, ...input.axes };

  // Reverse-index the meridian map: channel -> total rating contribution.
  const meridianContribution: Partial<Record<DerivedStatKey, number>> = {};
  for (const [meridianId, targets] of Object.entries(MERIDIAN_DERIVED_MAP)) {
    const rating = input.meridianRatings[meridianId] ?? 0;
    if (rating <= 0) continue;
    for (const target of targets) {
      meridianContribution[target.channel] =
        (meridianContribution[target.channel] ?? 0) + rating * DERIVED_WEIGHT_COEF[target.weight];
    }
  }

  const result = {} as Record<DerivedStatKey, number>;
  for (const channel of DERIVED_STAT_KEYS) {
    let sum = DERIVED_BASE[channel] ?? 0;
    for (const { stat, k } of DERIVED_TIER01_SOURCES[channel]) {
      sum += (sources[stat] ?? 0) * k;
    }
    sum += meridianContribution[channel] ?? 0;
    result[channel] = sum * scalar * (gear[channel] ?? 1);
  }
  return result;
}

/**
 * Signature path-effect FLAGS (the rule-changers, §2.10 / Appendix B). Combat reads
 * these as data/modifiers — implemented here as derived data, never as technique edits.
 * Coefficients ‹tune W12›.
 */
export interface MeridianSignatureEffects {
  swordHeartDrIgnorePct: number; // crit damage ignores % of target DR
  ironSkinThreshold: number; // hits below this deal 0
  mountainStanceReflectPct: number; // reflect % of Defense
  unbrokenMomentumStacking: number; // per consecutive offensive turn
  rootDepthRooted: boolean; // immune to displacement while rooted
  heavenlyMandateAuraPct: number; // suppression aura lowering enemy stats
  voidGazeWeaknessPenPct: number; // armor-pen via weakness
  capstones: { asura: boolean; sovereign: boolean; firmament: boolean };
}

export function meridianSignatureEffects(meridianRatings: Record<string, number>): MeridianSignatureEffects {
  const r = (id: string): number => meridianRatings[id] ?? 0;
  return {
    swordHeartDrIgnorePct: r('martial_sword_heart') * 0.3,
    ironSkinThreshold: r('earth_iron_skin') * 0.5,
    mountainStanceReflectPct: r('earth_mountain_stance') * 0.4,
    unbrokenMomentumStacking: r('martial_unbroken_momentum') * 0.02,
    rootDepthRooted: r('earth_root_depth') > 0,
    heavenlyMandateAuraPct: r('heaven_heavenly_mandate') * 0.3,
    voidGazeWeaknessPenPct: r('heaven_void_gaze') * 0.5,
    capstones: {
      asura: r('martial_dao_asura') > 0,
      sovereign: r('earth_dao_sovereign') > 0,
      firmament: r('heaven_dao_firmament') > 0,
    },
  };
}
