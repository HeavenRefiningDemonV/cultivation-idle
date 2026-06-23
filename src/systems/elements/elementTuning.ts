/**
 * F3-ELEM — the ElementTuning data: the D15 injected-data seam (D3 §5.4 / §6.5 / Appendix D).
 *
 * F3 owns the SHAPE and the CAPS; D15 owns the VALUES. Every field below is a deliberately
 * balance-INERT placeholder (a single shared reaction base, a uniform ICD window, a uniform state
 * duration) — obviously provisional, never a plausible-final value, so nothing here is mistaken for
 * tuned balance. Retuning is a data change to this file; the resolver's logic never changes.
 */
import type { ElementTuning } from './elementTypes.js';

export const DEFAULT_ELEMENT_TUNING: ElementTuning = Object.freeze({
  // [tune] D15 #1 (DR-3f) — resonance bonus per co-expressed allied edge. Constraint: focus AND cluster
  //   both viable; no element may be lifted past the soft-cap knee into runaway.
  resonanceBonusPerEdge: 0.05,
  // [tune] D15 #8 (D2 §7.1) — the affinity soft-cap knee + tail. Constraint: mono and cluster both reach
  //   useful value; strongly diminishing above the knee; never an exploitable asymptote.
  affinitySoftcapKnee: 1,
  affinitySoftcapTailDivisor: 2,
  // [tune] D15 #4 (DR-3c) — favourable-matchup affinity pressure. Constraint: bounded — a favourable
  //   matchup rewards without trivializing the fight.
  counterAffinityDelta: 0.1,
  // [tune] D15 #5 (DR-3c) — unfavourable-matchup blunting. Constraint: disadvantaged, NEVER nullified.
  offElementBlunt: 0.1,
  // [tune] D15 #6 (DR-3d) — the resistance hard-cap. Constraint: MUST be < 1 (the no-immunity floor —
  //   every element always does at least (1 − HARDCAP) of its damage); uniform across elements.
  resistHardcap: 0.75,
  // [tune] D15 #7 (DR-3d) — the resist half-saturation constant K. Constraint: diminishing returns on
  //   resist-stacking (anti-stacking on defence).
  resistHalfSaturation: 100,
  // [tune] D15 #3 (DR-3c) — counter resist-penetration (a NEGATIVE delta to rawResist). Constraint:
  //   bounded — a counter is an edge, not a lock; effective resist cannot be driven absurdly negative.
  counterPenetration: 0.1,
  // [tune] D15 #11-adjacent — Unmaking Touch continuous all-resist shred (a passive delta, no ICD).
  //   Constraint: bounded; the universal enabler, never an immunity-breaker into negative-resist.
  voidShredDelta: 0.1,
  // [tune] D15 #10 (DR-3e) — the shared per-reaction magnitude base. Constraint: scales off the build
  //   (Qi Purity × Spiritual Sense × (1+Σaffinity) × realmScalar), never off stack counts or RNG.
  reactionBase: 1,
  // [tune] D15 #11 (DR-3e) — true/sever cap multiple (× realmScalar). Constraint: capped — a spectacular
  //   finisher, never a same-realm one-shot delete button.
  severCapMultiple: 1,
  // [tune] D15 #12 (DR-3e) — burst cap multiple (× realmScalar). Constraint: no same-realm one-shot.
  burstCapMultiple: 1,
  // [tune] D15 #13 (DR-3h) — per-pathway ICD windows (ms). Constraint: anti-spam; the power-vs-frequency
  //   lever. (Uniform placeholder — D15 sets per-family.)
  icdMsByFamily: Object.freeze({
    cleanse: 3000, control: 3000, sever: 3000, shred: 3000, burst: 3000,
    spread: 3000, dot: 3000, drain: 3000, tempo: 3000, catalyst: 3000,
  }),
  // [tune] D15 #16 (DR-3e) — Catalyze multiplier. Constraint: amplifies exactly one reaction, then is
  //   consumed; no feedback loop.
  catalyzeMultiplier: 1.5,
  // [tune] D15 #9 (DR-03) — state base duration / intensity cap / escalation threshold. Constraint:
  //   within refresh-not-stack + bounded intensity (D3 §4 Rules 2/3). (Uniform placeholders.)
  stateBaseDurationMs: 4000,
  stateMaxIntensity: 3,
  stateEscalationThreshold: 3,
  // [tune] D15 #10-adjacent (DR-3e/DR-11a) — per-tick DoT damage coefficient, applied as
  //   dotTickCoeff × intensity × realmScalar once per dotTickIntervalMs of elapsed time (interval-
  //   accumulator, NOT frame-rate-coupled). HELD AT 0 ⇒ DoT-category afflictions deal ZERO damage
  //   until D15 deposits a real value — afflictions still age + expire (3b-0), but melt nothing. The
  //   coefficient is independent of reactionBase (which caps burst/sever) so DoT rate tunes separately.
  dotTickCoeff: 0,
  // [tune] D15 — DoT tick cadence (ms). Inert while dotTickCoeff is 0 (0 × anything = 0); D15 owns it.
  dotTickIntervalMs: 1000,
  // [tune] D15 (DR-11c) — P(a hard-CC affliction, frozen/petrified, skips the enemy's turn), 0..1.
  //   HELD AT 0 ⇒ control NEVER skips a turn (INERT): the skip-turn gate is wired + contract-proven but
  //   flag-on combat is byte-identical until D15 deposits a value. Held at 0 (not live) for two reasons:
  //   (1) the canon success roll is Control Power vs the target's Stagger/CC-Resist, but enemies have NO
  //   derived layer / no stagger source in code yet — there is no honest denominator to roll against;
  //   (2) under refresh-not-stack a control rewritten every 1000ms player-attack vs a 4000ms duration
  //   would PERMA-LOCK the enemy — a live value needs a duration/immunity-window model D15 owns first.
  controlSkipChance: 0,
});
