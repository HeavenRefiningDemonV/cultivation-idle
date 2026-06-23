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
