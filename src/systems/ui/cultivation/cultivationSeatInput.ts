/**
 * M.II.3 — the pure store-reading seam (§5.1). `CultivationSeatRawInput` is the normalized
 * shape the builder consumes; `readCultivationSeatRawInput` assembles it from the live stores
 * (NOT pure — reads stores; lives at the seam boundary, mirroring derivedStatInput). Keeping the
 * builder pure over this type makes it testable without a live store (the fixtures path).
 */
import { REALMS } from '../../../constants/index.js';
import {
  clampRealmIndexToSemesterSlice,
  getNextLiveRealm,
  isAtSemesterCap,
} from '../../progression/runtime/index.js';
import { resolveForegroundGrowthMode } from '../../cultivation/foregroundGrowthResolver.js';
import { resolveDaoHeartTurbulencePreview } from '../../daoHeart/daoHeartTurbulenceResolver.js';
import type { BreakthroughStabilitySnapshot } from '../../breakthrough/breakthroughStabilityResolver.js';
import { resolveTrialFailSafeConfig } from '../../progression/runtime/trialLifecycle.js';
import { MAX_OFFLINE_HOURS, resolveOfflineCultivationEfficiency } from '../../../services/time/offlineShared.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useTrialStore } from '../../../stores/trialStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { getGateTransitionItemIdForRealmIndex } from '../../progression/runtime/gateResolver.js';
import { CULTIVATION_PATH_DATA } from './cultivationPathData.js';
import { useTrainingStore } from '../../../stores/trainingStore.js';
import { isDerivedStatEngineAuthoritative } from '../../meridians/statEngineFlag.js';

export interface CultivationSeatRawInput {
  game: {
    realmIndex: number; // 0-based live index
    substage: number;
    substages: number;
    qi: string;
    qiPerSecond: string;
    breakthroughRequirement: string;
    selectedPath: string | null;
    focusMode: string; // 'balanced'|'body'|'spirit'
  };
  cultivation: { stability: number; stabilityCap: number; chapter: number; comprehension: number; turbulence: number; clarity: number };
  daoHeart: { turbulence: number; fractured: boolean };
  breakthrough: { stability: BreakthroughStabilitySnapshot | null };
  treasures: { jing: number; qi: number; shen: number; lead: 'jing' | 'qi' | 'shen' };
  prestige: { lifeMerit: number | null };
  activity: { foregroundType: string | null; combatHeld: boolean };
  pity: { banked: number; toGuarantee: number } | null;
  gate: { itemRequired: boolean; itemSatisfied: boolean; resolution: 'none' | 'cleared' | 'bypassed' };
  offline: { capHours: number; efficiencyPct: number };
  ui: { reducedMotion: boolean; selectedScroll: string | null; focusAxis?: string | null };
  content: { loaded: boolean };
  /**
   * C-PATH (Premonition) — live derived-engine reads for the per-path mechanics. OPTIONAL so fixtures
   * (which omit them) default to engine-off ⇒ the honest "not yet active" preview is preserved.
   */
  derived?: { perception: number; engineActive: boolean };
}

/** Read the live raw input. Impure (store reads). */
export function readCultivationSeatRawInput(opts: { reducedMotion?: boolean; selectedScroll?: string | null; focusAxis?: string | null } = {}): CultivationSeatRawInput {
  const game = useGameStore.getState();
  const cultivation = useCultivationStore.getState();
  const activity = useActivityStore.getState();
  const prestige = usePrestigeStore.getState();
  const content = useContentStore.getState();

  const liveRealmIndex = clampRealmIndexToSemesterSlice(game.realm.index);
  const currentRealm = REALMS[liveRealmIndex] ?? REALMS[0];
  const substages = currentRealm?.substages ?? game.realm.substage;
  const atContentCap = isAtSemesterCap(liveRealmIndex);
  const willAdvanceRealm = game.realm.substage >= substages && !atContentCap;

  const active = activity.active;
  const foreground = resolveForegroundGrowthMode(active);
  const combatHeld = foreground.mode === 'combat';

  const turbulence = cultivation.turbulence ?? 0;
  const turbulencePreview = resolveDaoHeartTurbulencePreview({ turbulence });

  // Item gate: at the major-crossing edge, the gate item must be held in inventory — the SAME check
  // gameStore.breakthrough() enforces. (Earlier waves stubbed this to null, so live gate-readiness
  // ignored the item and could read "ready" while the crossing fails on the missing item.)
  const requiredGateItemId = willAdvanceRealm ? getGateTransitionItemIdForRealmIndex(content.raw, liveRealmIndex) : null;
  let gateItemHeld = requiredGateItemId == null;
  if (requiredGateItemId) {
    try {
      gateItemHeld = useInventoryStore.getState().getItemCount(requiredGateItemId) > 0;
    } catch {
      gateItemHeld = false;
    }
  }

  // Gate trial (for pity + the safety band) — read the current realm's gate trial if any.
  let pity: { banked: number; toGuarantee: number } | null = null;
  let gateResolution: 'none' | 'cleared' | 'bypassed' = 'none';
  try {
    const trial = content.raw?.trials.find((entry) => {
      // best-effort: the trial whose fromRealm matches the current realm edge
      return entry.gateItemId != null;
    }) ?? null;
    if (trial) {
      const progress = useTrialStore.getState().getProgress(trial.id);
      gateResolution = progress.resolution;
      const threshold = resolveTrialFailSafeConfig(trial).threshold;
      pity = { banked: progress.eligibleFailures ?? 0, toGuarantee: threshold };
    }
  } catch {
    pity = null;
  }

  const offlineEfficiency = resolveOfflineCultivationEfficiency({
    prestigeEfficiencyAdd: typeof prestige.getOfflineEfficiencyBonusAdditive === 'function' ? prestige.getOfflineEfficiencyBonusAdditive() : 0,
  });

  // M.II.3 truthful-now (D6 §D.14): the Gate-Readiness preview must show the SAME odds the next real
  // crossing will roll. previewBreakthroughSnapshot() runs the shared buildLiveBreakthroughSnapshot —
  // real heart-law parity, root resonance, the live stat seam (inert pre-linchpin, exactly as the
  // real roll), and mind alignment — instead of the old hardcoded parity-1/neutral-root stub that
  // could understate the band. Returns null off a major crossing, so willAdvanceRealm still gates it.
  const breakthroughStability = willAdvanceRealm
    ? useGameStore.getState().previewBreakthroughSnapshot()
    : null;

  const lifeMerit = typeof (prestige as { lifeMerit?: number }).lifeMerit === 'number' ? (prestige as { lifeMerit?: number }).lifeMerit ?? null : null;
  const nextRealm = getNextLiveRealm(liveRealmIndex);

  return {
    game: {
      realmIndex: liveRealmIndex,
      substage: game.realm.substage,
      substages,
      qi: game.qi,
      qiPerSecond: game.qiPerSecond,
      breakthroughRequirement: String(game.getBreakthroughRequirement()),
      selectedPath: game.selectedPath,
      focusMode: game.focusMode,
    },
    cultivation: {
      stability: cultivation.stability,
      stabilityCap: cultivation.stabilityCap,
      chapter: cultivation.chapter,
      comprehension: cultivation.comprehension,
      turbulence,
      clarity: cultivation.daoHeartClarity ?? 0,
    },
    daoHeart: { turbulence, fractured: turbulencePreview.breakthroughBlocked },
    breakthrough: { stability: breakthroughStability },
    treasures: deriveTreasures(game.selectedPath),
    prestige: { lifeMerit },
    activity: { foregroundType: active?.type ?? null, combatHeld },
    pity,
    gate: { itemRequired: requiredGateItemId != null, itemSatisfied: gateItemHeld, resolution: gateResolution },
    offline: { capHours: MAX_OFFLINE_HOURS, efficiencyPct: Math.round(offlineEfficiency * 100) },
    ui: { reducedMotion: opts.reducedMotion ?? false, selectedScroll: opts.selectedScroll ?? null, focusAxis: opts.focusAxis ?? null },
    content: { loaded: content.isLoaded === true || content.raw != null },
    // C-PATH (Premonition): perception (the live spirit_sense rating — the same statRatingsById source
    // the breakthrough risk seam reads) + whether the derived engine is authoritative. Off ⇒ the
    // builder keeps the honest "not yet active" preview.
    derived: {
      perception: useTrainingStore.getState().statRatingsById.spirit_sense ?? 0,
      engineActive: isDerivedStatEngineAuthoritative(),
    },
    // nextRealm consumed by the builder via path data; not surfaced here directly
    ...(nextRealm ? {} : {}),
  };
}

/**
 * Three-Treasures balance preview. The live derived engine (F1) owns the true balance; until a
 * stable per-path read is surfaced here, the builder shows the path's authored lead at a fixed
 * preview balance. [tune] → D15 / bind to the live engine when the read is exposed.
 */
function deriveTreasures(path: string | null): { jing: number; qi: number; shen: number; lead: 'jing' | 'qi' | 'shen' } {
  // M.II.3 truthful-now: there is NO live jing/qi/shen stat layer (D15 §3.3 — "compositional, not a
  // player-facing layer today"). The LEAD is real authored path content (D5 treasuresLead); the
  // per-treasure values are only an ordinal illustration of that lead (the triad renders the lead,
  // never a fabricated stat magnitude). When a real composition lands, derive these from live stats.
  const def = path === 'earth' || path === 'martial' || path === 'heaven'
    ? CULTIVATION_PATH_DATA[path]
    : CULTIVATION_PATH_DATA.heaven;
  const lead = def.treasuresLead;
  return { jing: lead === 'jing' ? 2 : 1, qi: lead === 'qi' ? 2 : 1, shen: lead === 'shen' ? 2 : 1, lead };
}
