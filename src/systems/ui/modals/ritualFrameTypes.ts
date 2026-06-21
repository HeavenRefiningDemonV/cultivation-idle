/**
 * F2-MODALS / S0 — the Ritual Ceremony shell surface (Codex §III.X).
 *
 * Render-only typed surface. The shell renders a constant lintel · rite stage · outcome
 * reveal · exit, skinned per `rite`, over a state-keyed backdrop. Every intent is an OPAQUE
 * route id the owning system resolves; the shell NEVER mutates. The never-regress readout is
 * present in EVERY rite (a gameplay truth: no earned state is lost; pity accumulates).
 */

export const RITUAL_FRAME_SCHEMA_VERSION = 'ritual-frame-v1' as const;

export type RitualRite = 'breakthrough' | 'tribulation' | 'echo' | 'lifeSummary' | 'rootUpgrade';
export const RITUAL_RITE_OPTIONS =
  ['breakthrough', 'tribulation', 'echo', 'lifeSummary', 'rootUpgrade'] as const satisfies readonly RitualRite[];
// DR-17a: a future 'heartDevil' rite may be appended additively in Movement VII. NOT added here.

/** The backdrop key — slate-teal default / warm-bronze prestige / cinnabar-edged postFailure. */
export type RitualRiteState = 'default' | 'prestige' | 'postFailure';
export const RITUAL_RITE_STATE_OPTIONS =
  ['default', 'prestige', 'postFailure'] as const satisfies readonly RitualRiteState[];

export type RitualOutcomeKind = 'success' | 'not-yet';
export const RITUAL_OUTCOME_KIND_OPTIONS =
  ['success', 'not-yet'] as const satisfies readonly RitualOutcomeKind[];

/** The eight ritual fixture/visual states (Codex X.8). */
export type RitualVisualState =
  | 'breakthrough-success'
  | 'breakthrough-not-yet'
  | 'tribulation-success'
  | 'tribulation-not-yet'
  | 'echo-decree'
  | 'life-summary'
  | 'root-upgrade'
  | 'ritual-skipped';
export const RITUAL_VISUAL_STATE_OPTIONS = [
  'breakthrough-success',
  'breakthrough-not-yet',
  'tribulation-success',
  'tribulation-not-yet',
  'echo-decree',
  'life-summary',
  'root-upgrade',
  'ritual-skipped',
] as const satisfies readonly RitualVisualState[];

/** X.5 stakes panel — what is risked / gained / guaranteed. */
export interface RitualStakes {
  risked: string[];
  gained: string[];
  /** the guaranteed floor (the never-regress promise, concretely). */
  guaranteed: string[];
}

/** Present in EVERY rite — the never-regress readout. */
export interface RitualNeverRegress {
  /** "No earned state is lost." */
  headline: string;
  /** "Pity accumulates toward a guaranteed success." */
  pityNote: string;
}

/** X.7.3 — the held result (the reveal-main zone: eyebrow · title + CJK · body). */
export interface RitualOutcome {
  kind: RitualOutcomeKind;
  /** the small uppercase eyebrow, e.g. "Threshold crossed" / "Not yet". */
  eyebrow?: string;
  /** the large headline, e.g. "Foundation Establishment". */
  title?: string;
  /** the Kai-ti CJK line beside the title, e.g. "築基 · 第四重". */
  titleCjk?: string;
  /** the descriptive paragraph beneath the title. */
  body?: string;
  /** success: the new stage/realm/effect (legacy one-line summary; superseded by title/body). */
  result?: string;
  /** not-yet: the pity accrued (never a loss). */
  pityGained?: string;
  /** not-yet: 0..100 fill for the pity progress bar (sober bronze — never alarm). */
  pityPercent?: number;
}

/**
 * F2.UI — per-rite scene data the SVG scenes consume (additive; the scene is render-only art).
 * Only the genuinely data-driven scene parameters live here; success/skin are derived from
 * `outcome.kind` / `rite`. Surface-owned — never re-derived in the view.
 */
export interface RitualSceneData {
  /** breakthrough — the current minor stage on the 九转 nine-stage ladder (1..9). */
  breakthroughStage?: number;
  /** rootUpgrade — spirit-root grade before → after (1..5; 凡→地→玄→天 deterministic). */
  rootFromGrade?: number;
  rootToGrade?: number;
}

/** F2.UI — the reincarnation reveal richness (binds to LifeSummarySurface at wire-time). */
export interface RitualLifeSummary {
  /** this life's deeds, summed forward (LifeSummarySurface.blocks/majorMemories). */
  deeds: string[];
  /** "+148 AP" (LifeSummarySurface.apForecastGain). */
  ap: string;
  /** the next-life path re-choice prompt (LifeSummarySurface.nextLifeFocus). */
  pathPrompt: string;
}

export interface RitualModalSurfaceV1 {
  schemaVersion: typeof RITUAL_FRAME_SCHEMA_VERSION;
  visualState: RitualVisualState;
  rite: RitualRite;
  riteState: RitualRiteState;
  /** 闖關/渡劫/輪迴/洗髓 vertical chop. */
  riteTag: string;
  /** public name — concrete xianxia, never Omen/Proof/Mandate/Source. */
  riteName: string;
  stakes: RitualStakes;
  neverRegress: RitualNeverRegress;
  /** per-rite SVG scene parameters (breakthrough stage, root grades). Optional/additive. */
  scene?: RitualSceneData;
  /** lifeSummary reveal richness (deeds / AP / path re-choice). Null on the other rites. */
  summary?: RitualLifeSummary | null;
  /** null while the stage plays; set at the reveal. */
  outcome: RitualOutcome | null;
  /** opaque intent id — jump to reveal (pure visual; no RNG). */
  skipIntent: string;
  /** Continue / Acknowledge. */
  exitIntent: string;
  /** Begin / Confirm (forwarded; the owning system mutates). */
  confirmIntent: string;
  /** gate/tribulation state their odds; root-upgrade omits (deterministic). */
  honestOdds?: { label: string; value: string };
  /** true when this surface was fast-forwarded straight to its reveal. */
  skipped?: boolean;
}
