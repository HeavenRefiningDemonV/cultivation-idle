/**
 * M.II.3 — `buildCultivationSeatSurface`: the ONE seam where the raw input becomes the typed
 * `CultivationSeatSurfaceV1`. It computes NOTHING about gameplay — it reads the runtime's
 * already-computed outputs and arranges them into the payload (formatting, enum mapping, static
 * path data). Presentational derivations (a 0..1 motion scalar, realm beats) are display-only and
 * tagged [tune] → D15. Pure: no stores, no React.
 */
import type { CultivationPath } from '../../../types/index.js';
import type { PathId } from '../../../content/types.js';
import { REALMS, PATH_MODIFIERS, FOCUS_MODE_MODIFIERS } from '../../../constants/index.js';
import { resolvePremonitionOmens, type PremonitionOmensResult } from '../../cultivation/premonitionOmenResolver.js';
import {
  CULTIVATION_PATH_DATA,
  CANONICAL_FOCUS_AXES,
  BEAST_ESSENCES,
  WEAPON_ARTS,
  MARTIAL_BONDED_WEAPON,
} from './cultivationPathData.js';
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

// §6 Option B: the emphasis IS the player's stored 7-way pick (uiStore.cultivationFocusAxis), so the
// clicked axis is the one that stays emphasised. Defaults to Qi Purity (the artifact's S.emph=1).
const DEFAULT_FOCUS_AXIS_ID: CultivationFocusAxisId = 'qiPurity';
function resolveFocusEmphasis(storedAxis: string | null | undefined): CultivationFocusAxisId {
  return storedAxis && CANONICAL_FOCUS_AXES.some((a) => a.id === storedAxis)
    ? (storedAxis as CultivationFocusAxisId)
    : DEFAULT_FOCUS_AXIS_ID;
}

// M.II.3 truthful-now: the per-path mechanics (Premonition / Beast-Lore / Weapon-Bond) are designed
// (D5) but UNSHIPPED (D16 Wave C, gated on the stat linchpin) — there is no foresight / tempering /
// bond system in the live engine. So the instrument is an HONEST PREVIEW: active=false, the metric
// fields are zeroed (never presented as live progress), and the authored lore renders as "what this
// path will grant once it ships," not as fabricated current state. `communion` stays — it is a real
// activity read. No realm-fraction (`rf`) fiction.
function buildInstrument(
  path: CultivationPath,
  foreground: string,
  premonition: PremonitionOmensResult,
  beastLore: { absorbedCount: number; engineActive: boolean },
  weaponBond: { bondKills: number; engineActive: boolean },
): CultivationInstrument {
  if (path === 'heaven') {
    // C-PATH slice 1 — Heaven Premonition (Day's Omen) is LIVE under the derived engine: active, a
    // realm-graded precision, the perception rating as foresight depth, and a real idle-state read.
    // Off (player default / forceLegacy) ⇒ premonition.active false ⇒ the honest preview, byte-for-byte.
    return {
      kind: 'heaven',
      label: 'PREMONITION',
      valLabel: premonition.active ? `Heaven’s Eye · ${premonition.precision} foresight` : 'Not yet active',
      active: premonition.active,
      previewNote: premonition.active
        ? `${premonition.caption} — perception ${premonition.horizon}. Foresight sharpens each realm; combat & tribulation foresight follow in later packets.`
        : 'Premonition — Heaven’s Eye — is a designed but not-yet-active path art (D5). The omens below preview what the Eye will read once it ships.',
      foresightHorizon: premonition.horizon,
      fortuneOmens: premonition.fortuneOmens,
      riskOmens: premonition.riskOmens,
    };
  }
  if (path === 'earth') {
    // D11 — Beast-Lore goes live once a beast essence has been absorbed under the derived engine (the
    // count is the live useBeastLoreStore tally). Off / nothing absorbed ⇒ the honest preview, intact.
    const beastActive = beastLore.engineActive && beastLore.absorbedCount > 0;
    const n = Math.min(BEAST_ESSENCES.length, Math.max(0, beastLore.absorbedCount));
    return {
      kind: 'earth',
      label: 'BEAST LORE',
      valLabel: beastActive ? `${n} essence${n === 1 ? '' : 's'} absorbed` : 'Not yet active',
      active: beastActive,
      previewNote: beastActive
        ? `Body Tempering is live — ${n} bestial essence${n === 1 ? '' : 's'} drawn into the marrow. Each beast slain in the World adds to the lore.`
        : 'Beast Lore — body-tempering by absorbing bestial essence — is a designed but not-yet-active path system (D5 / D11). The essences below preview what may be drawn in once it ships.',
      temperingDepthPct: 0,
      absorbedCount: beastActive ? n : 0,
      capacity: BEAST_ESSENCES.length,
      essences: (beastActive ? BEAST_ESSENCES.slice(0, n) : BEAST_ESSENCES).map((e) => ({ ...e })),
    };
  }
  const communion = foreground === 'cultivating' ? 'deepening' : foreground === 'combat-held' ? 'held' : 'idle';
  // D5 — Weapon-Bond goes live once the natal bond has deepened (≥1 kill) under the derived engine.
  // [tune → D15]-HELD placeholder curve (logged in the ledger): ~BOND_KILLS_FOR_FULL kills → full bond,
  // an art unlocking as depth crosses even bands. The real curve is the balance pass's.
  const BOND_KILLS_FOR_FULL = 25;
  const bondActive = weaponBond.engineActive && weaponBond.bondKills > 0;
  const bondDepthPct = Math.min(100, Math.round((weaponBond.bondKills / BOND_KILLS_FOR_FULL) * 100));
  const artsCount = Math.min(WEAPON_ARTS.length, Math.floor((bondDepthPct / 100) * WEAPON_ARTS.length));
  return {
    kind: 'martial',
    label: 'WEAPON-BOND',
    valLabel: bondActive ? `Bond ${bondDepthPct}% · ${artsCount} art${artsCount === 1 ? '' : 's'}` : 'Not yet active',
    active: bondActive,
    previewNote: bondActive
      ? `Arms-Mastery is live — the ${MARTIAL_BONDED_WEAPON.name} bond is ${bondDepthPct}% deep; ${artsCount} weapon-art${artsCount === 1 ? '' : 's'} unlocked. Each kill deepens the bond.`
      : 'Weapon-Bond — the weapon as a cultivable companion — is a designed but not-yet-active path system (D5 / D8 equipment). The arts below preview what the bond will grant once it ships.',
    bondDepthPct: bondActive ? bondDepthPct : 0,
    artsCount: bondActive ? artsCount : 0,
    artsCapacity: WEAPON_ARTS.length,
    communion,
    weaponName: MARTIAL_BONDED_WEAPON.name,
    weaponGrade: MARTIAL_BONDED_WEAPON.grade,
    arts: (bondActive ? WEAPON_ARTS.slice(0, artsCount) : WEAPON_ARTS).map((a) => ({ ...a })),
  };
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
    // the real assembled odds the next crossing rolls against (D6 §D.14) — null when no live snapshot
    riskPercent: typeof raw.breakthrough.stability?.riskPercent === 'number' ? raw.breakthrough.stability.riskPercent : null,
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

  // ── focus (§6 Option B: the artifact's 7 axes; emphasis = the player's stored 7-way pick) ──
  const emphasisId = resolveFocusEmphasis(raw.ui.focusAxis);
  const emphasisIndex = CANONICAL_FOCUS_AXES.findIndex((a) => a.id === emphasisId);
  debugNotes.push(`focus: 7-axis pick=${emphasisId}; gameplay focusMode=${raw.game.focusMode} (mapped)`);
  // the artifact's focusAlloc: base [14,14,14,14,14,14,16], emphasis += 38 (raw % — a relative bias).
  const axes = CANONICAL_FOCUS_AXES.map((axis, i) => {
    const pct = (i === CANONICAL_FOCUS_AXES.length - 1 ? 16 : 14) + (i === emphasisIndex ? 38 : 0);
    return { id: axis.id, label: axis.label, glyph: axis.glyph, weight: pct / 100, effect: axis.effect, lean: axis.lean };
  });
  const emphasisAxis = CANONICAL_FOCUS_AXES.find((a) => a.id === emphasisId) ?? CANONICAL_FOCUS_AXES[0];

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

  // C-PATH slice 1 — resolve Heaven's Day's Omen from live reads (realm precision + perception +
  // whether seclusion is accruing). Engine-off ⇒ inert ⇒ the honest "not yet active" preview holds.
  const premonition = resolvePremonitionOmens({
    realmIndex1to7,
    perception: raw.derived?.perception ?? 0,
    idleRunning: !raw.activity.combatHeld,
    engineActive: raw.derived?.engineActive ?? false,
  });
  const instrument = buildInstrument(
    path,
    foreground,
    premonition,
    { absorbedCount: raw.derived?.absorbedEssences ?? 0, engineActive: raw.derived?.engineActive ?? false },
    { bondKills: raw.derived?.bondKills ?? 0, engineActive: raw.derived?.engineActive ?? false },
  );

  const treasureItems: CultivationSeatSurfaceV1['treasures']['items'] = [
    { id: 'jing', label: 'Body', glyph: '精', value: raw.treasures.jing },
    { id: 'qi', label: 'Energy', glyph: '气', value: raw.treasures.qi },
    { id: 'shen', label: 'Spirit', glyph: '神', value: raw.treasures.shen },
  ];

  const qiPerSec = raw.activity.combatHeld ? '—' : formatNumberLabel(raw.game.qiPerSecond);
  // M.II.3 truthful-now: the REAL qi/s decomposition, mirroring gameStore.calculateQiPerSecond —
  // realm base × substage bonus (1+0.2·(stage−1)) × focus mode × path, then your upgrades / prestige
  // / spirit-root / Heart-Law modifiers carry it to the shown rate. Every named term is an actual
  // engine factor (FOCUS_MODE_MODIFIERS / PATH_MODIFIERS / REALMS), not the old invented 1.00 / 1+rf·3.
  const realmBaseQps = REALMS[raw.game.realmIndex]?.qiPerSecond ?? REALMS[0].qiPerSecond;
  const substageBonus = 1 + 0.2 * Math.max(0, raw.game.substage - 1);
  const focusQiMult = FOCUS_MODE_MODIFIERS[raw.game.focusMode]?.qiMultiplier ?? 1;
  const pathQiMult = raw.game.selectedPath
    ? PATH_MODIFIERS[raw.game.selectedPath as keyof typeof PATH_MODIFIERS]?.qiMultiplier ?? 1
    : 1;
  const rateEquation = {
    base: formatNumberLabel(realmBaseQps),
    stageMult: `${substageBonus.toFixed(2)}×`,
    focusMult: `${focusQiMult.toFixed(2)}×`,
    pathMult: `${pathQiMult.toFixed(2)}×`,
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
      // 9-pip-style stage row (lit to the live substage, the current marked) — §4 / Group A lintel.
      stagePips: Array.from({ length: Math.max(1, raw.game.substages) }, (_, i) => ({
        index: i,
        on: i < raw.game.substage,
        current: i === Math.min(raw.game.substages, raw.game.substage) - 1,
      })),
      // the current realm's fantasy beat — the ambient whisper line (E4).
      fantasyLine: realmDef.fantasy,
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
        rate: {
          base: rateEquation.base,
          stageMult: rateEquation.stageMult,
          focusMult: rateEquation.focusMult,
          pathMult: rateEquation.pathMult,
          result: rateEquation.result,
          terms: `Realm base × stage × Focus (${emphasisAxis.label}) × Path are the named factors; your upgrades, prestige, spirit-root and Heart-Law modifiers then carry it to the rate above.`,
        },
        clocks: { seclusion: raw.activity.combatHeld ? 'paused' : 'running', sojourn: raw.activity.combatHeld ? 'in combat' : 'idle' },
        offline: { capHours: raw.offline.capHours, efficiency: `${raw.offline.efficiencyPct}%` },
        foregroundTerms: 'A single foreground task runs at once — cultivate, temper a meridian, or tend the Dao Heart. Combat preempts it and holds the Seat.',
        lifeMerit: raw.prestige.lifeMerit != null ? formatNumberLabel(raw.prestige.lifeMerit) : '—',
      },
      seclusionReturn: null, // deferred to F4 offline-resolution engine (§11.7)
    },
  };
}
