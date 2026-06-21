import type { CourtStatView } from './temperingCourtSurface.js';
import type { AxisKey, DerivedStatKey, FoundationKey } from './derivedStats.js';

/**
 * F1 — the PURE legacy↔derived combat-stat bridge (SA-A1, §3.1). No store reads: it adapts
 * the derived resolver's output onto the legacy `state.stats` base shape, and renames the
 * Court shared-stat views into the resolver's input records. Pure ⇒ unit-testable, cannot
 * drift. The store-reading input assembly lives in derivedStatInput.ts (wired via the lazy
 * injector to avoid the gameStore↔trainingStore cycle).
 */

/** The legacy combat-stat base shape calculatePlayerStats consumes (mirrors REALMS baseStats). */
export interface LegacyCombatBaseStats {
  hp: string;
  atk: string;
  def: string;
  regen: string;
  crit: number;
  critDmg: number;
  dodge: number;
  speed: number;
}

/**
 * SPEED normalization (§3.1, the one non-pass-through channel): legacy speed is a small
 * 1.0–1.5 multiplier; derived `speed` is a large points value. Map it into the legacy band
 * so the channel is the same KIND of number. Saturating; [tune → D15 via the parity table].
 */
export function normalizeDerivedSpeed(derivedSpeed: number): number {
  return 1 + Math.min(0.5, Math.max(0, derivedSpeed) / 400);
}

/**
 * Map the 21 derived channels onto the 8-field legacy combat base (§3.1). GEO channels
 * (hp/atk/def/regen) are direct, emitted as Decimal strings to match the REALMS baseStats
 * shape; GENTLE channels map from their derived sources with speed normalized into the band.
 *
 * NOTE on consumption: the F1 cutover branch uses this bridge's GEO outputs and carves the
 * GENTLE channels to the realm row (their derived sources cannot reproduce the per-realm
 * GENTLE constants — e.g. critDamage has no Tier-0/1 source — §3.1/App.D). The full 8-channel
 * mapping is kept faithful here for the contract and for downstream consumers (B-MERID layers
 * meridian/signature contributions onto the GENTLE channels).
 */
export function deriveLegacyCombatStats(derived: Record<DerivedStatKey, number>): LegacyCombatBaseStats {
  return {
    hp: String(derived.maxHp),
    atk: String(derived.physAttack),
    def: String(derived.physDefense),
    regen: String(derived.hpRegen),
    crit: derived.critChance,
    critDmg: derived.critDamage,
    dodge: derived.evasion,
    speed: normalizeDerivedSpeed(derived.speed),
  };
}

/**
 * F1 SA-A2 — per-channel GEO calibration ([tune → D15]). The derived resolver's natural output
 * scale and per-channel ratios do not match the legacy REALMS combat band (e.g. its atk/def
 * ratio is structural and can't be reproduced by ratings alone). These factors align the four
 * GEO channels to the legacy band. They are tuned to the REFERENCE parity cultivator (all 13
 * shared-tier ratings = 100): at realm 1 (scalar 1.0) the reference core is
 *   maxHp 50+1.2·100+0.8·100 = 250 · physAttack 5+0.8·100 = 85 · physDefense 5+0.5·100 = 55 ·
 *   hpRegen 0.4·100+0.3·100 = 70,
 * so each factor = (REALMS R0 target) / (reference core). With REALM_SCALAR_RATIO = 5 (the same
 * geometric ratio as REALMS), the realm index cancels and parity holds at EVERY realm — proven
 * by the SA-A2 per-realm parity gate.
 */
export const GEO_CALIBRATION = {
  hp: 100 / 250, // 0.40   — REALMS R0 hp / reference maxHp core
  atk: 10 / 85, // ≈0.1176 — REALMS R0 atk / reference physAttack core
  def: 5 / 55, // ≈0.0909 — REALMS R0 def / reference physDefense core
  regen: 1 / 70, // ≈0.0143 — REALMS R0 regen / reference hpRegen core
} as const;

/**
 * Apply the GEO calibration to a mapped legacy base (GEO channels only; GENTLE passed through,
 * since the cutover carves GENTLE to the realm row). Pure.
 */
export function calibrateGeoBase(base: LegacyCombatBaseStats): LegacyCombatBaseStats {
  return {
    ...base,
    hp: String(Number(base.hp) * GEO_CALIBRATION.hp),
    atk: String(Number(base.atk) * GEO_CALIBRATION.atk),
    def: String(Number(base.def) * GEO_CALIBRATION.def),
    regen: String(Number(base.regen) * GEO_CALIBRATION.regen),
  };
}

/** Court foundation view id (snake) → DerivedStatInput foundation key (camel). `luck` is dropped. */
const FOUNDATION_ID_MAP: Record<string, FoundationKey> = {
  physique: 'physique',
  vitality: 'vitality',
  agility: 'agility',
  perception: 'perception',
  willpower: 'willpower',
};

/** Court axis view id (snake) → DerivedStatInput axis key (camel). §1.5 rename map. */
const AXIS_ID_MAP: Record<string, AxisKey> = {
  cultivation_base: 'cultivationBase',
  qi_pool: 'qiPool',
  qi_purity: 'qiPurity',
  meridian_openness: 'meridianOpenness',
  spiritual_sense: 'spiritualSense',
  soul_strength: 'soulStrength',
  dao_comprehension: 'daoComprehension',
};

export function mapFoundationViewsToRecord(views: CourtStatView[]): Record<FoundationKey, number> {
  const out: Record<FoundationKey, number> = {
    physique: 0,
    vitality: 0,
    agility: 0,
    perception: 0,
    willpower: 0,
  };
  for (const view of views) {
    const key = FOUNDATION_ID_MAP[view.id];
    if (key) out[key] = view.value ?? 0;
  }
  return out;
}

export function mapAxisViewsToRecord(views: CourtStatView[]): Record<AxisKey, number> {
  const out: Record<AxisKey, number> = {
    cultivationBase: 0,
    qiPool: 0,
    qiPurity: 0,
    meridianOpenness: 0,
    spiritualSense: 0,
    soulStrength: 0,
    daoComprehension: 0,
  };
  for (const view of views) {
    const key = AXIS_ID_MAP[view.id];
    if (key) out[key] = view.value ?? 0;
  }
  return out;
}
