/**
 * M.II.3 — `buildCultivationSeatSurface`: the ONE seam where the raw input becomes the typed
 * `CultivationSeatSurfaceV1`. It computes NOTHING about gameplay — it reads the runtime's
 * already-computed outputs and arranges them into the payload (formatting, enum mapping, static
 * path data). Presentational derivations (a 0..1 motion scalar, realm beats) are display-only and
 * tagged [tune] → D15. Pure: no stores, no React.
 */
import type { CultivationPath } from '../../../types/index.js';
import type { PathId } from '../../../content/types.js';
import { CULTIVATION_PATH_DATA, CANONICAL_FOCUS_AXES } from './cultivationPathData.js';
import type { CultivationSeatRawInput } from './cultivationSeatInput.js';
import {
  CULTIVATION_SEAT_SCHEMA_VERSION,
  type CultivationFocusAxisId,
  type CultivationGateReadiness,
  type CultivationInstrument,
  type CultivationSeatMode,
  type CultivationSeatSurfaceV1,
  type CultivationSeatVisualState,
} from './cultivationSeatTypes.js';

const LIVE_REALMS_TOTAL = 6; // R7 sealed (M.II.1 / R-8)
const QPS_REF = 5000; // [tune] → D15 — reference rate for the 0..1 motion scalar

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

function toPath(selectedPath: string | null): { path: CultivationPath; fallback: boolean } {
  if (selectedPath === 'heaven' || selectedPath === 'earth' || selectedPath === 'martial') {
    return { path: selectedPath, fallback: false };
  }
  return { path: 'heaven', fallback: true };
}

function formatNumberLabel(value: string | number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (Math.abs(n) >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 100) / 10}K`;
  return `${Math.round(n)}`;
}

// R-1: the live 3-way focusMode mapped onto a canonical D2 axis (lossy until F1 widens it).
function mapFocusModeToAxis(focusMode: string): CultivationFocusAxisId {
  if (focusMode === 'balanced') return 'balanced';
  if (focusMode === 'body') return 'meridianOpenness';
  if (focusMode === 'spirit') return 'spiritualSense';
  return 'balanced';
}

function buildInstrument(path: CultivationPath, rf: number, foreground: string): CultivationInstrument {
  if (path === 'heaven') {
    const horizon = Math.round(2 + rf * 4);
    return { kind: 'heaven', label: 'PREMONITION', valLabel: `Foresight horizon · ${horizon}`, foresightHorizon: horizon };
  }
  if (path === 'earth') {
    const depth = Math.round((0.2 + rf * 0.8) * 100);
    const beasts = Math.min(7, 1 + Math.round(rf * 6));
    return { kind: 'earth', label: 'BEAST LORE', valLabel: `Essences ${beasts} · depth ${depth}%`, temperingDepthPct: depth, absorbedCount: beasts };
  }
  const bond = Math.round((0.18 + rf * 0.82) * 100);
  const arts = Math.min(5, 1 + Math.round(rf * 4));
  const communion = foreground === 'cultivating' ? 'deepening' : foreground === 'combat-held' ? 'held' : 'idle';
  return { kind: 'martial', label: 'WEAPON-BOND', valLabel: `Bond depth ${bond}% · ${arts} arts`, bondDepthPct: bond, artsCount: arts, communion };
}

function buildGateReadiness(
  raw: CultivationSeatRawInput,
  realmPct: number,
  qiText: string,
  atPeak: boolean,
): CultivationGateReadiness {
  const qiReady = Number(raw.game.qi) >= Number(raw.game.breakthroughRequirement);
  const fractured = raw.daoHeart.fractured;
  const itemOk = !raw.gate.itemRequired || raw.gate.itemSatisfied;
  const verdict: CultivationGateReadiness['verdict'] = fractured ? 'held' : !qiReady ? 'not-yet' : !itemOk ? 'not-yet' : 'ready';

  const band = raw.breakthrough.stability?.band ?? 'tense';
  const pityMaxed = raw.pity != null && raw.pity.banked >= raw.pity.toGuarantee && raw.pity.toGuarantee > 0;
  const safetyBand: CultivationGateReadiness['safetyBand'] = pityMaxed
    ? 'guaranteed'
    : band === 'serene'
      ? 'serene'
      : band === 'stable' || band === 'tense'
        ? 'steady'
        : band === 'unstable'
          ? 'perilous'
          : 'dire';
  const safetyOdds: Record<CultivationGateReadiness['safetyBand'], string> = {
    serene: 'A serene crossing — the gate is wide open.',
    steady: 'A steady crossing — most attempts at this band succeed.',
    perilous: 'A perilous crossing — settle the heart and purify the qi first.',
    dire: 'A dire crossing — the odds are against you; widen the band before attempting.',
    guaranteed: 'A guaranteed crossing — the Safety Net assures it.',
  };

  return {
    verdict,
    verdictZh: verdict === 'ready' ? '順遂' : verdict === 'held' ? '觀' : '瓶頸',
    checks: [
      { id: 'qi', state: qiReady ? 'ok' : 'caution', label: 'Cultivation Base', value: qiText, detail: 'at the breakthrough cost' },
      { id: 'edge', state: atPeak ? 'ok' : 'blocked', label: 'Realm edge', value: atPeak ? `${raw.game.substage}th · Peak` : `Stage ${raw.game.substage} / ${raw.game.substages}`, detail: 'the stage is full' },
      {
        id: 'item',
        state: itemOk ? 'ok' : 'blocked',
        label: 'Gate requirement',
        value: raw.gate.itemRequired ? (raw.gate.itemSatisfied ? 'satisfied' : 'missing') : 'none',
        detail: raw.gate.itemRequired ? 'a pill or key gates this crossing' : 'no pill or key needed here',
      },
      {
        id: 'mind',
        state: fractured ? 'blocked' : 'ok',
        label: 'Heart & mind',
        value: `Turbulence ${Math.round(raw.daoHeart.turbulence)}%`,
        detail: fractured ? 'past the fracture line — settle first' : 'below the fracture line',
      },
    ],
    blockers: [
      ...(fractured ? [{ reason: 'The heart is fractured — Turbulence is past the fracture line.', routeTo: 'daoHeart' as const, routeLabel: 'Settle the heart in the Dao Heart ↗' }] : []),
      ...(!qiReady ? [{ reason: 'Cultivation Base is below the breakthrough cost.', routeTo: null, routeLabel: 'Cultivate in seclusion and return when the base is full.' }] : []),
    ],
    safetyBand,
    safetyOdds: safetyOdds[safetyBand],
    safetyTerms: ['qi purity', 'heart alignment', 'Turbulence', 'Luck'],
    raiseHint: safetyBand === 'serene' || safetyBand === 'guaranteed' ? null : 'Purer qi and a calmer heart widen the safe band.',
    pity: raw.pity,
    heartFractured: fractured,
    canCommit: verdict === 'ready',
  };
}

export function buildCultivationSeatSurface(input: { raw: CultivationSeatRawInput; mode: CultivationSeatMode; nowMs: number }): CultivationSeatSurfaceV1 {
  const { raw, mode, nowMs } = input;
  const debugNotes: string[] = [];

  const { path, fallback } = toPath(raw.game.selectedPath);
  if (fallback) debugNotes.push('path: no selectedPath (pre-Life-Start) — defaulting to heaven, mode fallback');
  const def = CULTIVATION_PATH_DATA[path];

  const realmIndex1to7 = raw.game.realmIndex + 1;
  const rf = clamp01((realmIndex1to7 - 1) / 5); // 0..1 across the 6 live realms (R7 sealed)
  const realmDef = def.realms[Math.min(def.realms.length - 1, raw.game.realmIndex)] ?? def.realms[0];
  const atPeak = raw.game.substage >= raw.game.substages;

  const realmPct = clamp01(Number(raw.game.qi) / Number(raw.game.breakthroughRequirement));
  const qiText = `${formatNumberLabel(raw.game.qi)} / ${formatNumberLabel(raw.game.breakthroughRequirement)} Qi`;

  const foreground: CultivationSeatSurfaceV1['scene']['foreground'] = raw.activity.combatHeld
    ? 'combat-held'
    : raw.activity.foregroundType === 'meditate'
      ? 'cultivating'
      : raw.activity.foregroundType === 'path_training'
        ? 'tempering'
        : 'idle';
  const foregroundLabel = foreground === 'combat-held' ? 'Held — resumes after combat' : foreground === 'cultivating' ? 'Cultivating' : foreground === 'tempering' ? 'Tempering' : 'In seclusion';

  const gateReadiness = atPeak ? buildGateReadiness(raw, realmPct, qiText, atPeak) : null;

  const visualState: CultivationSeatVisualState = raw.activity.combatHeld
    ? 'combatHeld'
    : atPeak && gateReadiness?.verdict === 'ready'
      ? 'peakReady'
      : atPeak
        ? 'peakBlocked'
        : foreground === 'cultivating'
          ? 'cultivating'
          : 'seclusion';

  // ── focus (R-1: 6 canonical axes; live 3-way mapped onto the nearest spoke) ──
  const emphasisId = mapFocusModeToAxis(raw.game.focusMode);
  debugNotes.push(`focus: 6-axis display over 3-way live model (${raw.game.focusMode} → ${emphasisId}) — widen in F1`);
  const axes = CANONICAL_FOCUS_AXES.map((axis) => ({
    id: axis.id,
    label: axis.label,
    glyph: axis.glyph,
    weight: axis.id === emphasisId ? 0.62 : 0.16, // [tune] → D15 display bias
    effect: axis.effect,
    lean: axis.lean,
  }));
  const emphasisAxis = CANONICAL_FOCUS_AXES.find((a) => a.id === emphasisId) ?? CANONICAL_FOCUS_AXES[CANONICAL_FOCUS_AXES.length - 1];

  // ── ascent rungs ──
  const rungs = def.realms.map((r, i) => {
    const rIndex = i + 1;
    const state: 'crossed' | 'current' | 'sealed' = rIndex < realmIndex1to7 ? 'crossed' : rIndex === realmIndex1to7 ? 'current' : 'sealed';
    return {
      realmIndex: rIndex,
      name: r.name,
      zh: r.zh,
      meridian: r.meridian,
      state,
      detail: state === 'crossed' ? `Meridian opened · ${r.meridian}` : state === 'current' ? `Tempering now · ${r.meridian}` : `Will open · ${r.meridian}`,
    };
  });
  const nextRealmDef = realmIndex1to7 < LIVE_REALMS_TOTAL ? def.realms[realmIndex1to7] : null; // next realm (null at cap)

  const instrument = buildInstrument(path, rf, foreground);

  const treasureItems: CultivationSeatSurfaceV1['treasures']['items'] = [
    { id: 'jing', label: 'Body', glyph: '精', value: raw.treasures.jing },
    { id: 'qi', label: 'Energy', glyph: '气', value: raw.treasures.qi },
    { id: 'shen', label: 'Spirit', glyph: '神', value: raw.treasures.shen },
  ];

  const qiPerSec = raw.activity.combatHeld ? '—' : formatNumberLabel(raw.game.qiPerSecond);
  const rateEquation = {
    base: '1.00',
    realmMult: `${(1 + rf * 3).toFixed(1)}×`, // [tune] → D15 (display only; not the live rate decomposition)
    focusMult: foreground === 'cultivating' ? '1.16×' : '1.05×',
    result: qiPerSec,
  };

  const motionQiFlow: CultivationSeatSurfaceV1['meta']['motionHints']['qiFlow'] = raw.activity.combatHeld ? 'held' : foreground === 'cultivating' ? 'cultivating' : 'idle';
  const qps = Number(raw.game.qiPerSecond);
  const cultivationRate = raw.activity.combatHeld ? null : clamp01(Math.log10(Math.max(0, qps) + 1) / Math.log10(QPS_REF + 1));

  return {
    meta: {
      rootTestId: 'cultivation-seat-root',
      schemaVersion: CULTIVATION_SEAT_SCHEMA_VERSION,
      mode: fallback ? 'fallback' : mode,
      visualState,
      path,
      currentPath: (raw.game.selectedPath as PathId | null) ?? null,
      generatedAt: nowMs,
      contentLoaded: raw.content.loaded,
      reducedMotion: raw.ui.reducedMotion,
      selectedScroll: (raw.ui.selectedScroll as CultivationSeatSurfaceV1['meta']['selectedScroll']) ?? null,
      motionHints: { qiPerSecond: raw.activity.combatHeld ? null : qps, cultivationRate, qiFlow: motionQiFlow },
      debugNotes,
    },
    identity: {
      pathGlyph: def.glyph,
      pathName: def.name,
      roomSub: def.roomSub,
      roomTitle: 'The Seat of Becoming',
      verb: def.verb,
      counter: def.counter,
      peakTitle: def.peak,
      verse: def.verse,
      realmIndex: realmIndex1to7,
      realmName: realmDef.name,
      realmZh: realmDef.zh,
      stageInRealm: raw.game.substage,
      stageLabel: atPeak ? (def.counter === 'Edge' ? '9th Edge · Peak' : `${def.peak} Peak`) : `Stage ${raw.game.substage} / ${raw.game.substages}`,
      atPeak,
      accentTokenId: def.accentTokenId,
      glyphId: def.glyphId,
    },
    scene: {
      skyBeat: rf,
      figureBeat: rf,
      qiBeat: rf,
      foreground,
      foregroundLabel,
      watermarkZh: def.inscribe,
    },
    realmProgress: {
      pct: atPeak ? 0.985 : realmPct,
      qiText,
      towardLabel: atPeak ? 'toward the Threshold' : 'toward the next stage',
    },
    idle: {
      qiPerSec,
      offlineCapLabel: `${raw.offline.capHours}h`,
      offlineEfficiency: `${raw.offline.efficiencyPct}%`,
      stateWord: raw.activity.combatHeld ? 'Held' : def.verb,
      combatHeld: raw.activity.combatHeld,
      rateEquation,
      lifeMerit: raw.prestige.lifeMerit != null ? formatNumberLabel(raw.prestige.lifeMerit) : '—',
    },
    focus: {
      axes,
      emphasisId,
      leanCaption: `favors ${emphasisAxis.lean}`,
    },
    treasures: {
      items: treasureItems,
      lead: raw.treasures.lead,
      leadLabel: raw.treasures.lead === 'jing' ? 'Body-led' : raw.treasures.lead === 'qi' ? 'Energy-led' : 'Spirit-led',
    },
    ascent: {
      realmsCrossed: realmIndex1to7 - 1,
      realmsTotalLive: LIVE_REALMS_TOTAL,
      rungs,
      nextMeridian: nextRealmDef ? { name: nextRealmDef.meridian, zh: nextRealmDef.zh, fantasy: nextRealmDef.fantasy } : null,
    },
    breakthrough: {
      thresholdWoken: atPeak,
      gateReadiness,
      ceremonyActive: false,
    },
    instrument,
    scrolls: {
      ledger: {
        rate: { base: rateEquation.base, realmMult: rateEquation.realmMult, focusMult: rateEquation.focusMult, result: rateEquation.result, terms: `Your banked stats set the base; the realm scalar multiplies it; the Focus emphasis (${emphasisAxis.label}) tilts it.` },
        clocks: { seclusion: raw.activity.combatHeld ? 'paused' : 'running', sojourn: raw.activity.combatHeld ? 'in combat' : 'idle' },
        offline: { capHours: raw.offline.capHours, efficiency: `${raw.offline.efficiencyPct}%` },
        foregroundTerms: 'A single foreground task runs at once — cultivate, temper a meridian, or tend the Dao Heart. Combat preempts it and holds the Seat.',
        lifeMerit: raw.prestige.lifeMerit != null ? formatNumberLabel(raw.prestige.lifeMerit) : '—',
      },
      seclusionReturn: null, // deferred to F4 offline-resolution engine (§11.7)
    },
  };
}
