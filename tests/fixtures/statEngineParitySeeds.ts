/**
 * F1 / SA-A0 — the deterministic per-realm parity seed set + harness constants.
 *
 * This is the reproducible reference the stat-engine parity harness
 * (tests/e2e/stat-engine-parity.spec.ts) reads. It pins:
 *   - the eight legacy combat channels the cutover must preserve (§3.1);
 *   - the six LIVE realms the parity gate runs over (R7 is sealed — §1.9);
 *   - the deterministic cultivator seed (so a run is reproducible run-to-run);
 *   - the D15-owned tolerance band (placeholder ±5% pending D15 — §3.7).
 *
 * NO app imports: this is a pure data/helper module so the Playwright spec can
 * import it without pulling the product tree. SA-A2 (compare mode) and SA-A4
 * (hold mode) read the same constants so the gate can never drift.
 */

/** The eight legacy combat channels consumed from gameStore `state.stats` (§3.1). */
export const PARITY_CHANNELS = [
  'maxHp',
  'atk',
  'def',
  'regen',
  'crit',
  'critDmg',
  'dodge',
  'speed',
] as const;
export type ParityChannel = (typeof PARITY_CHANNELS)[number];

/** The six LIVE realms the parity gate runs over (Court ladder 1..6; R7 sealed, §1.9). */
export const LIVE_PARITY_REALMS = [
  { index: 0, rung: 1, id: 'qi_condensation', name: 'Qi Condensation' },
  { index: 1, rung: 2, id: 'foundation_establishment', name: 'Foundation Establishment' },
  { index: 2, rung: 3, id: 'core_formation', name: 'Core Formation' },
  { index: 3, rung: 4, id: 'nascent_soul', name: 'Nascent Soul' },
  { index: 4, rung: 5, id: 'soul_formation', name: 'Soul Formation' },
  { index: 5, rung: 6, id: 'spirit_severing', name: 'Spirit Severing' },
] as const;

/**
 * The deterministic cultivator seed. Every field that feeds calculatePlayerStats
 * (gameStore.ts ~L962) is pinned so the legacy baseline is identical run-to-run:
 *   path heaven (hp×0.8/atk×1.3/def×0.9/crit+10/dodge+5), balanced focus (all ×1.0),
 *   substage 1 (substageMultiplier 1.0), no upgrade tiers, no equipment, no perks,
 *   no active buffs, fresh prestige (combat ×1.0, no spirit-root element bonus).
 * The realm index is swept 0..5 by the harness; everything else is held constant.
 */
export const DETERMINISTIC_SEED = {
  path: 'heaven',
  focusMode: 'balanced',
  substage: 1,
  upgradeTiers: { hp: 0, damage: 0 },
  equipment: { weapon: null, accessory: null },
  pathPerks: [] as string[],
  activeBuffs: [] as unknown[],
  prestige: 'spiritRoot=null (multiplier 1.0, no element bonus); combat ×1.0 (fresh, no upgrades)',
} as const;

/**
 * SA-A2 — the REFERENCE parity cultivator: all 13 shared-tier live stat ratings = 100 (a
 * "standard realm-appropriate" cultivator). The derived path's GEO calibration
 * (combatStatBridge.GEO_CALIBRATION) is tuned to THIS seed, so compare-mode seeds exactly
 * these into useTrainingStore.statRatingsById; resolveCourtSharedStats maps them to the
 * Three-Treasures foundation/axes (so foundation = axes = 100). Keyed by the canonical legacy
 * stat ids (statDefinitions / courtSharedStats liveStatId).
 */
export const PARITY_REFERENCE_RATINGS: Record<string, number> = {
  // Tier-0 foundation
  body_tempering: 100, // → physique
  blood_essence: 100, // → vitality
  armor_harmony: 100, // → agility
  recovery_depth: 100, // → perception
  meridian_fortitude: 100, // → willpower
  rooted_guard: 100, // → luck
  // Tier-1 axes
  dantian_depth: 100, // → cultivationBase
  body_integrity: 100, // → qiPool
  qi_purity: 100, // → qiPurity
  meridian_throughput: 100, // → meridianOpenness
  spirit_sense: 100, // → spiritualSense
  mind_clarity: 100, // → soulStrength
  dao_stability: 100, // → daoComprehension
};

/**
 * The per-channel tolerance band for the parity gate. D15-OWNED (§3.7). This is a
 * PLACEHOLDER pending D15 reconciliation — a single readable constant the harness
 * consumes so D15 can tighten/loosen it without a harness edit. The gate is
 * all-or-nothing: a single realm × channel outside this band fails SA-A2 (INV-1).
 */
export const PARITY_BAND_PCT = 0.05; // ±5% — [tune → D15]

/** The preserved damage law (INV-6): Damage = ATK × (1 − DEF/(DEF + K)), K = 100. */
export const DEFENSE_CONSTANT_K = 100;

/**
 * Representative per-hit damage proxy: a deterministic "mirror" hit — the seed's
 * own ATK against its own DEF through the UNCHANGED damage formula, no crit. It
 * exercises both the ATK and DEF channels per realm with a single reproducible
 * number, and is the integrated cross-check SA-A2 must also reproduce in band.
 */
export function mirrorDamage(atk: number, def: number, k: number = DEFENSE_CONSTANT_K): number {
  if (atk <= 0) return 0;
  return atk * (1 - def / (def + k));
}

/** Within-band check used by SA-A2/SA-A4 compare/hold modes (kept here so it can't drift). */
export function isWithinBand(legacy: number, derived: number, bandPct: number = PARITY_BAND_PCT): boolean {
  if (legacy === 0) return Math.abs(derived) <= bandPct;
  return Math.abs(derived - legacy) / Math.abs(legacy) <= bandPct;
}

/** The fixture states the visual oracle captures (mirrors status-observatory-states.spec.ts). */
export const FIXTURE_STATES = ['healthy', 'blocked', 'postFailure', 'prestigePressure', 'contentCap'] as const;
