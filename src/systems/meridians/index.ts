/** The Tempering Court Tier-2 meridian model (Three Treasures, W2): roots, realm
 *  caps, cadence helpers, and the render-only MeridianView shape. The 21-meridian
 *  data lives in the validated content pack (path_meridians.json). */
export * from './meridianModel.js';

/** W3 — the one-meridian training engine (additive; legacy tri-stat engine untouched
 *  until W13): the §2.5 rate formula + the single advanceMeridian path. */
export * from './computeMeridianRate.js';
export * from './meridianTrainingState.js';

/** W4 — the Tier-3 derived-stat resolver + the shared meridian→derived mapping
 *  (codex chips + engine, single source) + signature-effect flags. */
export * from './derivedStats.js';

/** W5 — passive combat training: trigger→meridian mapping + the per-fight-capped
 *  0.15× grant routed through advanceMeridian('…','combat'). */
export * from './passiveCombatTraining.js';

/** W6 — the render-only Tempering Court surface + builder (additive; the legacy
 *  TrainingHallSurfaceV1 is untouched until W13). The W7 UI renders this. */
export * from './temperingCourtSurface.js';

/** W8 — the Observatory ⇄ Three-Treasures re-bind (D8/D9): the explicit 20→28 node
 *  map + drop-in constellation-surface builder + astrolabe aptitude chips. ADDITIVE +
 *  flag-gated — NOT wired into the live (legacy-bound, public-default) observatory;
 *  swaps in at the W13 cutover. */
export * from './observatoryMeridianBinding.js';

/** W12 — the single balance-tuning surface: every ‹tune W12› coefficient aggregated
 *  into one COURT_BALANCE audit object (references the live consts; numbers tunable,
 *  structure fixed). Guarded by courtBalanceGuard.test.ts. */
export * from './courtBalance.js';
