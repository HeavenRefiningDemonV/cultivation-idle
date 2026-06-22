import type { PathId } from '../../../content/types.js';
import type { CultivationPath } from '../../../types/index.js';
import type { FocusAxisDef } from './cultivationPathData.js';

/**
 * M.II.3 — `CultivationSeatSurfaceV1`: the render-only contract for the Seat of Becoming.
 * Codex Part 13's `CultivationSurfaceV1` reconciled to the live engine and given the
 * Observatory's meta/motionHints/visualState/rootTestId discipline. The screen WRITES nothing
 * here; it renders this and emits intents. Every field is computed by the builder (§5).
 */

export const CULTIVATION_SEAT_SCHEMA_VERSION = 'cultivation-seat-v1' as const;
export type CultivationSeatMode = 'fixture' | 'live' | 'fallback';

export type CultivationSeatVisualState =
  | 'seclusion' // idle, accruing — the resting default
  | 'cultivating' // foreground = cultivate; the scene intensifies
  | 'combatHeld' // combat preempted the foreground; the Seat is "held"
  | 'peakReady' // at the Peak, gate ready — the Threshold wakes "ready"
  | 'peakBlocked' // at the Peak, gate blocked (qi short or heart fractured)
  | 'unknown';

export type CultivationFocusAxisId = FocusAxisDef['id'];

export type CultivationDeepLink =
  | 'status.constellation'
  | 'court.meridians'
  | 'daoHeart'
  | 'world.map'
  | 'prestige.records'
  | 'forge.equipment'
  | 'expeditions'
  | 'alchemy';

export type CultivationTone = 'jade' | 'gold' | 'cinnabar' | 'neutral';

export type CultivationScrollId =
  | 'ascent'
  | 'gatereadiness'
  | 'ledger'
  | 'focus'
  | 'premonition'
  | 'beastlore'
  | 'weaponbond'
  | 'seclusionReturn';

// ── tick-driven motion telemetry (read-only; NEVER consumed by gameplay) ──────
export interface CultivationSeatMotionHints {
  qiPerSecond: number | null;
  cultivationRate: number | null; // normalized 0..1 ([tune] → D15)
  /** semantic tempo the motion hook maps to seconds (held → frozen). */
  qiFlow: 'cultivating' | 'idle' | 'held';
}

export interface CultivationFocusAxis {
  id: CultivationFocusAxisId;
  label: string;
  glyph: string;
  weight: number; // 0..1 current bias (display)
  effect: string;
  lean: string;
}

export interface CultivationTreasure {
  id: 'jing' | 'qi' | 'shen';
  label: 'Body' | 'Energy' | 'Spirit';
  glyph: '精' | '气' | '神';
  value: number; // relative balance (preview only)
}

export interface CultivationAscentRung {
  realmIndex: number; // 1..7
  name: string;
  zh: string;
  meridian: string;
  state: 'crossed' | 'current' | 'sealed';
  detail: string;
}

export interface CultivationGateCheck {
  id: 'qi' | 'edge' | 'item' | 'mind';
  state: 'ok' | 'caution' | 'blocked';
  label: string;
  value: string;
  detail: string;
}

export interface CultivationGateBlocker {
  reason: string;
  routeTo: CultivationDeepLink | null;
  routeLabel: string;
}

export interface CultivationGateReadiness {
  verdict: 'ready' | 'not-yet' | 'held';
  verdictZh: string; // wax-seal char
  checks: CultivationGateCheck[]; // the four checks (D6 §D.14)
  blockers: CultivationGateBlocker[];
  safetyBand: 'serene' | 'steady' | 'perilous' | 'dire' | 'guaranteed';
  safetyOdds: string;
  safetyTerms: string[];
  raiseHint: string | null;
  /** R-3: live via trialLifecycle failSafe; null only when no gate trial is configured. */
  pity: { banked: number; toGuarantee: number } | null;
  heartFractured: boolean; // Turbulence ≥ fracture ⇒ hard block
  canCommit: boolean;
}

// ── the per-path discriminated instrument (only one renders) ─────────
export interface PremonitionOmen { label: string; value: string; detail: string; tone: CultivationTone }
export interface BeastEssence { name: string; glyph: string; trait: string }
export interface WeaponArt { name: string; detail: string }

export interface HeavenInstrument {
  kind: 'heaven';
  label: 'PREMONITION';
  valLabel: string;
  foresightHorizon: number;
  fortuneOmens: PremonitionOmen[];
  riskOmens: PremonitionOmen[];
}
export interface EarthInstrument {
  kind: 'earth';
  label: 'BEAST LORE';
  valLabel: string;
  temperingDepthPct: number; // 0..100
  absorbedCount: number;
  capacity: number;
  essences: BeastEssence[]; // the absorbed subset (realm-gated)
}
export interface MartialInstrument {
  kind: 'martial';
  label: 'WEAPON-BOND';
  valLabel: string;
  bondDepthPct: number; // 0..100
  artsCount: number;
  artsCapacity: number;
  communion: 'deepening' | 'held' | 'idle';
  weaponName: string;
  weaponGrade: string;
  arts: WeaponArt[]; // the unlocked subset (realm-gated)
}
export type CultivationInstrument = HeavenInstrument | EarthInstrument | MartialInstrument;

export interface CultivationLedgerScroll {
  rate: { base: string; realmMult: string; focusMult: string; result: string; terms: string };
  clocks: { seclusion: string; sojourn: string };
  offline: { capHours: number; efficiency: string };
  foregroundTerms: string;
  lifeMerit: string;
}

export interface CultivationSeclusionReturn {
  awayLabel: string;
  qiGained: string;
  hoursAway: string;
  cappedAt: string | null;
}

export interface CultivationSeatSurfaceV1 {
  meta: {
    rootTestId: 'cultivation-seat-root';
    schemaVersion: typeof CULTIVATION_SEAT_SCHEMA_VERSION;
    mode: CultivationSeatMode;
    visualState: CultivationSeatVisualState;
    path: CultivationPath;
    currentPath: PathId | null;
    generatedAt: number;
    contentLoaded: boolean;
    reducedMotion: boolean;
    selectedScroll: CultivationScrollId | null;
    motionHints: CultivationSeatMotionHints;
    debugNotes: string[];
  };

  identity: {
    pathGlyph: string;
    pathName: string;
    roomSub: string;
    roomTitle: 'The Seat of Becoming';
    verb: string;
    counter: string;
    peakTitle: string;
    verse: string;
    realmIndex: number; // 1..7
    realmName: string;
    realmZh: string;
    stageInRealm: number; // 1..9
    stageLabel: string;
    atPeak: boolean;
    accentTokenId: string; // token id, never hex (R-7)
    glyphId: string;
  };

  scene: {
    skyBeat: number; // 0..1 realm-indexed
    figureBeat: number;
    qiBeat: number;
    foreground: 'idle' | 'cultivating' | 'combat-held' | 'tempering';
    foregroundLabel: string;
    watermarkZh: string;
  };

  realmProgress: {
    pct: number; // 0..1
    qiText: string;
    towardLabel: string;
  };

  idle: {
    qiPerSec: string;
    offlineCapLabel: string;
    offlineEfficiency: string;
    stateWord: string;
    combatHeld: boolean;
    rateEquation: { base: string; realmMult: string; focusMult: string; result: string };
    lifeMerit: string;
  };

  focus: {
    axes: CultivationFocusAxis[]; // 6 canonical + balanced (generic over N)
    emphasisId: CultivationFocusAxisId;
    leanCaption: string;
  };

  treasures: {
    items: CultivationTreasure[];
    lead: 'jing' | 'qi' | 'shen';
    leadLabel: string;
  };

  ascent: {
    realmsCrossed: number;
    realmsTotalLive: number; // 6 live (R7 sealed)
    rungs: CultivationAscentRung[];
    nextMeridian: { name: string; zh: string; fantasy: string } | null;
  };

  breakthrough: {
    thresholdWoken: boolean; // === identity.atPeak
    gateReadiness: CultivationGateReadiness | null; // present at the Peak
    ceremonyActive: boolean;
  };

  instrument: CultivationInstrument;

  scrolls: {
    ledger: CultivationLedgerScroll;
    seclusionReturn: CultivationSeclusionReturn | null;
  };
}
