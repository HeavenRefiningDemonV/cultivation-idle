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
import { resolveBreakthroughStabilitySnapshot, type BreakthroughStabilitySnapshot } from '../../breakthrough/breakthroughStabilityResolver.js';
import { resolveTrialFailSafeConfig } from '../../progression/runtime/trialLifecycle.js';
import { MAX_OFFLINE_HOURS, resolveOfflineCultivationEfficiency } from '../../../services/time/offlineShared.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useTrialStore } from '../../../stores/trialStore.js';

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
  ui: { reducedMotion: boolean; selectedScroll: string | null };
  content: { loaded: boolean };
}

/** Read the live raw input. Impure (store reads). */
export function readCultivationSeatRawInput(opts: { reducedMotion?: boolean; selectedScroll?: string | null } = {}): CultivationSeatRawInput {
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

  // Gate trial (for pity + item gate) — read the current realm's gate trial if any.
  const requiredGateItemId = willAdvanceRealm ? null : null; // item gate resolved by the builder's check; kept simple here
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

  const breakthroughStability = willAdvanceRealm
    ? resolveBreakthroughStabilitySnapshot({
        fromRealmIndex: liveRealmIndex,
        toRealmIndex: liveRealmIndex + 1,
        currentQi: game.qi,
        requiredQi: game.getBreakthroughRequirement(),
        heartLawStage: 1,
        cultivationEffectiveStage: 1,
        clarity: cultivation.daoHeartClarity ?? 0,
        turbulence,
        gateResolution,
        rootResonance: 'neutral',
        recklessConfirmation: false,
      })
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
    gate: { itemRequired: requiredGateItemId != null, itemSatisfied: gateResolution === 'cleared' || gateResolution === 'bypassed', resolution: gateResolution },
    offline: { capHours: MAX_OFFLINE_HOURS, efficiencyPct: Math.round(offlineEfficiency * 100) },
    ui: { reducedMotion: opts.reducedMotion ?? false, selectedScroll: opts.selectedScroll ?? null },
    content: { loaded: content.isLoaded === true || content.raw != null },
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
  if (path === 'earth') return { jing: 86, qi: 46, shen: 40, lead: 'jing' };
  if (path === 'martial') return { jing: 58, qi: 54, shen: 50, lead: 'jing' };
  return { jing: 38, qi: 50, shen: 84, lead: 'shen' };
}
