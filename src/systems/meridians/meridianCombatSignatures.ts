/**
 * B-MERID (packet #06, the A→B boundary) — wire the path-meridian SIGNATURE effects into combat.
 *
 * `meridianSignatureEffects` (derivedStats.ts) is a PURE function that turns the live court meridian
 * ratings into 7 rule-changers + 3 capstones. It was INERT (zero callers). This leaf module is the
 * combat-layer read seam: combat asks for the signatures, gated by the SAME stat-engine flag the
 * linchpin uses (`isDerivedStatEngineAuthoritative` — dev-on via ?statEngine=1; shipped const false).
 *
 * PRESERVE-FIRST (INV-2): when the flag is off (every shipped player today), `resolveMeridian-
 * SignaturesForCombat()` returns the INERT struct, so the combat application helpers are no-ops and
 * legacy combat is byte-identical. `forceLegacy` always wins (it short-circuits the flag).
 *
 * OWNERSHIP: the signature COEFFICIENTS (‹tune W12›) live in `meridianSignatureEffects` and are owned
 * by D15 / F-BAL — B-MERID HOLDS them and only CONSUMES the output; it never retunes a magnitude.
 * The frozen damage core `ATK×(1−DEF/(DEF+K))`, K=100, is never touched — every effect composes into
 * ATK_eff / DEF_eff BEFORE the formula, or rides through as a post-application event.
 */
import { isDerivedStatEngineAuthoritative } from './statEngineFlag.js';
import { meridianSignatureEffects, type MeridianSignatureEffects } from './derivedStats.js';
import { useCourtMeridianStore } from '../../features/court/useCourtMeridianStore.js';

/** The all-zero / all-false signatures — what combat reads when the engine flag is off (legacy). */
export const INERT_MERIDIAN_SIGNATURES: MeridianSignatureEffects = Object.freeze({
  swordHeartDrIgnorePct: 0,
  ironSkinThreshold: 0,
  mountainStanceReflectPct: 0,
  unbrokenMomentumStacking: 0,
  rootDepthRooted: false,
  heavenlyMandateAuraPct: 0,
  voidGazeWeaknessPenPct: 0,
  capstones: { asura: false, sovereign: false, firmament: false },
});

/**
 * The combat-layer read seam. Returns the live meridian signatures ONLY under the derived engine
 * (flag-on); otherwise the inert struct (so every consumer below is a no-op and combat is legacy).
 * Impure (reads the court store) — lives at the store/seam boundary like derivedStatInput.
 */
export function resolveMeridianSignaturesForCombat(): MeridianSignatureEffects {
  if (!isDerivedStatEngineAuthoritative()) return INERT_MERIDIAN_SIGNATURES;
  const ratings: Record<string, number> = {};
  try {
    const court = useCourtMeridianStore.getState();
    for (const [id, progress] of Object.entries(court.progressByMeridianId)) {
      ratings[id] = (progress as { rating?: number }).rating ?? 0;
    }
  } catch {
    return INERT_MERIDIAN_SIGNATURES; // court store unavailable (e.g. SSR / a test without bootstrap)
  }
  return meridianSignatureEffects(ratings);
}

/**
 * PURE — Slice 1 (player offense, STEP 2). Fold the two armor-shredding signatures into the existing
 * enemy-Defense reduction (the `armorPenPct` precedent at combatStore playerAttack), clamped ≤90% as
 * the live code already clamps. Void-Gaze (Heaven) always applies; Sword-Heart (Martial) applies only
 * on a crit ("crit damage ignores % of target DR"). With INERT signatures this returns exactly
 * `min(90, armorPenPct)` — byte-identical to the legacy `Math.min(armorPenPct, 90)`.
 */
export function combineArmorPenWithSignatures(
  armorPenPct: number,
  sig: MeridianSignatureEffects,
  isCrit: boolean,
): number {
  const swordHeart = isCrit ? sig.swordHeartDrIgnorePct : 0;
  return Math.min(90, armorPenPct + sig.voidGazeWeaknessPenPct + swordHeart);
}

/**
 * PURE — Slice 2 (player defense, STEP 3). Iron-Skin (Earth): an incoming hit BELOW the threshold is
 * fully negated (chip-damage immunity). A floor beneath the formula, never a term inside it. With an
 * INERT signature the threshold is 0, so this is always false → legacy combat byte-identical. The
 * caller keeps the original Decimal when not negated (no number round-trip) to preserve precision.
 */
export function isIronSkinNegated(incomingDamage: number, ironSkinThreshold: number): boolean {
  return ironSkinThreshold > 0 && incomingDamage < ironSkinThreshold;
}

/**
 * PURE — Slice 5 (post-application event). Mountain-Stance (Earth): when a physical hit lands on the
 * defender, reflect `reflectPct%` of the defender's Defense back at the attacker. INERT pct 0 ⇒ 0,
 * so legacy combat is unchanged. A separate event after the formula, never a term inside it.
 */
export function mountainStanceReflectAmount(defenderDefense: number, reflectPct: number): number {
  if (reflectPct <= 0 || defenderDefense <= 0) return 0;
  return (defenderDefense * reflectPct) / 100;
}

/**
 * PURE — Slice 4 (transient stacking). Unbroken-Momentum (Martial): each consecutive offensive turn
 * banks a stack; the player's outgoing damage is multiplied by (1 + stacks × coeff). A landed hit on
 * the player breaks the chain (stacks → 0). INERT coeff 0 ⇒ multiplier 1 ⇒ legacy byte-identical.
 */
export function momentumDamageMultiplier(stacks: number, unbrokenMomentumStacking: number): number {
  if (unbrokenMomentumStacking <= 0 || stacks <= 0) return 1;
  return 1 + stacks * unbrokenMomentumStacking;
}

/**
 * PURE — Slice 6 (continuous suppression). Heavenly-Mandate (Heaven): a suppression aura that lowers
 * the enemy's effective attack by `auraPct%` (the "lowers enemy stats" rule, applied continuously —
 * this combat has no domain toggle). INERT auraPct 0 ⇒ unchanged ⇒ legacy byte-identical. Result is
 * floored at 0 (a >100% aura cannot heal the enemy).
 */
export function mandateSuppressedAttack(enemyAttack: number, auraPct: number): number {
  if (auraPct <= 0) return enemyAttack;
  return Math.max(0, enemyAttack * (1 - auraPct / 100));
}

/**
 * PURE — Slice 7 (structural, INERT today). Root-Depth (Earth): immune to displacement/forced
 * movement while rooted. The live combat has no displacement system, so this is wired as a flag for
 * C-PATH to read (it has no observable effect yet). Mirrors the signature's boolean.
 */
export function isDisplacementImmune(sig: MeridianSignatureEffects): boolean {
  return sig.rootDepthRooted === true;
}
