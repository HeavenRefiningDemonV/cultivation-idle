import CryptoJS from 'crypto-js';
import type { SaveData, SaveManualSatchelState } from '../types';
import type { ManualPavilionSaveState } from '../features/manuals/pavilionStockTypes';
import { useGameStore } from '../stores/gameStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCombatStore } from '../stores/combatStore';
import { useTechniqueStore } from '../stores/techniqueStore';
import { useZoneStore } from '../stores/zoneStore';
import { usePrestigeStore } from '../stores/prestigeStore';
import { useUIStore } from '../stores/uiStore';
import { useCityStore } from '../stores/cityStore';
import { useActivityStore } from '../stores/activityStore';
import { useOutskirtsStore } from '../stores/outskirtsStore';
import { useTrialStore } from '../stores/trialStore';
import { useRuinsStore } from '../stores/ruinsStore';
import { useShopStore } from '../stores/shopStore';
import { useTechCollectionStore } from '../stores/techCollectionStore';
import { useProfessionStore } from '../stores/professionStore';
import { useEquipmentStore } from '../stores/equipmentStore';
import { useBuffStore } from '../stores/buffStore';
import { useBountyStore } from '../stores/bountyStore';
import { useExpeditionStore } from '../stores/expeditionStore';
import { getDefaultUnlockedHeartLawIds, useHeartLawStore } from '../stores/heartLawStore';
import { useManualPavilionStore } from '../stores/manualPavilionStore';
import { useManualSatchelStore } from '../stores/manualSatchelStore';
import { useMedicinePouchStore } from '../stores/medicinePouchStore';
import { useCraftSessionStore } from '../stores/craftSessionStore';
import { useRecipeMasteryStore } from '../stores/recipeMasteryStore';
import { useContentStore } from '../stores/contentStore';
import { recomputeAndApplyPrestigeUnlocks } from '../systems/prestige/applyPrestigeEffects';
import { assertRequiredSaveKeys, buildDefaultSaveState, migrateSave, SAVE_VERSION } from '../save/defaultSaveState';
import { buildOfflineContext, type OfflineContext } from '../systems/offline';

/**
 * Save system constants
 */
const SAVE_KEY = 'cultivation-idle-save-v3';
const BACKUP_A_KEY = 'cultivation-idle-save-v3-backup-A';
const BACKUP_B_KEY = 'cultivation-idle-save-v3-backup-B';
const BACKUP_C_KEY = 'cultivation-idle-save-v3-backup-C';

let lastLoadedSaveData: SaveData | null = null;

/**
 * Encryption key - in production, this could be more sophisticated
 * For an idle game, basic obfuscation is usually sufficient
 */
const ENCRYPTION_KEY = 'cultivation-idle-secret-2025';

function cloneManualPavilionState(
  source: ManualPavilionSaveState['stockByPavilionId'],
): ManualPavilionSaveState['stockByPavilionId'] {
  const copy: ManualPavilionSaveState['stockByPavilionId'] = {};
  Object.entries(source ?? {}).forEach(([pavilionId, stock]) => {
    if (!stock || typeof stock !== 'object') return;
    copy[pavilionId] = {
      ...stock,
      slots: Array.isArray(stock.slots) ? stock.slots.map((slot) => ({ ...slot })) : [],
      pity: { ...(stock.pity ?? { featuredEpic: 0, featuredLegendary: 0 }) },
      history: Array.isArray(stock.history) ? stock.history.map((entry) => ({ ...entry })) : [],
    };
  });
  return copy;
}

const isValidRuinsRunSummary = (value: unknown): value is SaveData['ruinsState']['runHistory'][number] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.runId !== 'string') return false;
  if (typeof record.ruinId !== 'string') return false;
  if (typeof record.startedAt !== 'number' || typeof record.endedAt !== 'number') return false;
  if (typeof record.durationSec !== 'number') return false;
  if (typeof record.roomsCleared !== 'number' || typeof record.roomCount !== 'number') return false;
  if (typeof record.victory !== 'boolean') return false;
  if (typeof record.goldGained !== 'number') return false;
  if (typeof record.rareDropCount !== 'number') return false;
  if (!Array.isArray(record.drops)) return false;
  return record.drops.every((drop) => {
    if (!drop || typeof drop !== 'object' || Array.isArray(drop)) return false;
    const d = drop as Record<string, unknown>;
    if (typeof d.itemId !== 'string') return false;
    if (typeof d.qty !== 'number') return false;
    if ('rarity' in d && d.rarity != null && typeof d.rarity !== 'string') return false;
    if ('reason' in d && d.reason != null && typeof d.reason !== 'string') return false;
    return true;
  });
};

function cloneManualSatchelState(source: SaveManualSatchelState): SaveManualSatchelState {
  return {
    manuals: Array.isArray(source?.manuals) ? source.manuals.map((manual) => ({ ...manual })) : [],
    activeStudy: source?.activeStudy
      ? {
          ...source.activeStudy,
          manual: { ...source.activeStudy.manual },
        }
      : null,
    lastLearned: source?.lastLearned ? { ...source.lastLearned } : null,
  };
}

/**
 * Gather current game state from all stores
 */
function gatherGameState(): SaveData {
  const now = Date.now();
  const gameState = useGameStore.getState();
  const inventoryState = useInventoryStore.getState();
  const combatState = useCombatStore.getState();
  const zoneState = useZoneStore.getState();
  const techniqueState = useTechniqueStore.getState();
  const prestigeState = usePrestigeStore.getState();
  const cityState = useCityStore.getState();
  const trialState = useTrialStore.getState();
  const ruinsState = useRuinsStore.getState();
  const shopState = useShopStore.getState();
  const techCollectionState = useTechCollectionStore.getState();
  const professionState = useProfessionStore.getState();
  const equipmentState = useEquipmentStore.getState();
  const buffState = useBuffStore.getState();
  const bountyState = useBountyStore.getState();
  const expeditionState = useExpeditionStore.getState();
  const heartLawState = useHeartLawStore.getState();
  const manualPavilionState = useManualPavilionStore.getState();
  const manualSatchelState = useManualSatchelStore.getState();
  const medicinePouchState = useMedicinePouchStore.getState();
  const craftSessionState = useCraftSessionStore.getState();
  const recipeMasteryState = useRecipeMasteryStore.getState();
  const activityState = useActivityStore.getState();
  const outskirtsState = useOutskirtsStore.getState();

  const saveData: SaveData = {
    version: SAVE_VERSION,
    timestamp: now,
    meta: {
      lastActiveAtMs: now,
    },

    gameState: {
      realm: gameState.realm,
      qi: gameState.qi,
      spiritRoot: prestigeState.spiritRoot,
      selectedPath: gameState.selectedPath,
      lifePath: gameState.lifePath,
      focusMode: gameState.focusMode,
      pathPerks: gameState.pathPerks,
      totalAuras: gameState.totalAuras,
      upgradeTiers: gameState.upgradeTiers,
      pityState: gameState.pityState,
      playerLuck: gameState.playerLuck,
      lastTickTime: gameState.lastTickTime,
      lastActiveTime: gameState.lastActiveTime,
      runStartTime: gameState.runStartTime,
    },

    prestigeState: {
      totalAP: prestigeState.totalAP,
      lifetimeAP: prestigeState.lifetimeAP,
      currentRunAP: prestigeState.currentRunAP,
      prestigeCount: prestigeState.prestigeCount,
      prestigeRuns: prestigeState.prestigeRuns,
      purchasesById: { ...prestigeState.purchasesById },
      highestRealmReached: prestigeState.highestRealmReached,
      runStartTime: prestigeState.runStartTime,
      rerollCount: prestigeState.rerollCount,
      spiritRoot: prestigeState.spiritRoot,
    },

    inventoryState: {
      currencies: { ...inventoryState.currencies },
      items: { ...inventoryState.items },
    },

    craftSessionState: craftSessionState.toSaveState(),
    medicinePouchState: medicinePouchState.toSaveState(),
    recipeMasteryState: recipeMasteryState.toSaveState(),

    combatSettings: {
      autoAttack: combatState.autoAttack,
      autoCombatAI: combatState.autoCombatAI,
    },

    zoneState: {
      unlockedZones: zoneState.unlockedZones,
      zoneProgress: zoneState.zoneProgress,
    },

    cityState: {
      currentCityId: cityState.currentCityId,
      unlockedCityIds: [...cityState.unlockedCityIds],
      selectedModuleByCity: { ...cityState.selectedModuleByCity },
      cityFlagsById: { ...cityState.cityFlagsById },
      initializedFromContent: cityState.initializedFromContent,
    },

    activityState: {
      active: activityState.active ? { ...activityState.active } : null,
      lastChangedAt: activityState.lastChangedAt ?? null,
      history: Array.isArray(activityState.history) ? [...activityState.history] : [],
    },

    outskirtsState: {
      progressByOutskirtsId: { ...outskirtsState.progressByOutskirtsId },
      autoContinue: outskirtsState.autoContinue,
      stopAtBoss: outskirtsState.stopAtBoss,
    },

    bountyState: {
      activeByCityId: { ...bountyState.activeByCityId },
      lastRefreshAtByCityId: { ...bountyState.lastRefreshAtByCityId },
      trackedByCityId: { ...(bountyState.trackedByCityId ?? {}) },
    },

    expeditionState: {
      slots: expeditionState.slots,
      active: expeditionState.active.map((run) => ({ ...run })),
      rareProgressByKey: { ...(expeditionState.rareProgressByKey ?? {}) },
    },

    heartLawState: {
      selectedHeartLawId: heartLawState.selectedHeartLawId,
      chapter: heartLawState.chapter,
      comprehension: heartLawState.comprehension,
      unlockedHeartLawIds: [...heartLawState.unlockedHeartLawIds],
      breathMode: heartLawState.breathMode,
      studyEnabled: heartLawState.studyEnabled,
      studyTechniqueId: heartLawState.studyTechniqueId,
      lastInsightAt: heartLawState.lastInsightAt,
      nextInsightAt: heartLawState.nextInsightAt ?? null,
      insight: heartLawState.insight ?? null,
      stability: heartLawState.stability,
      stabilityCap: heartLawState.stabilityCap,
    },

    manualPavilionState: {
      stockByPavilionId: cloneManualPavilionState(manualPavilionState.stockByPavilionId),
    },

    manualSatchelState: cloneManualSatchelState(manualSatchelState.toSaveState()),

    techniqueState: {
      loadouts: techniqueState.loadouts,
      selectedLoadoutId: techniqueState.selectedLoadoutId,
    },

    trialState: {
      activeTrialSessionId: trialState.activeTrialSessionId ?? null,
      progressByTrialId: Object.fromEntries(
        Object.entries(trialState.progressByTrialId ?? {}).map(([trialId, progress]) => [
          trialId,
          {
            ...progress,
            sessionAttempts: progress.sessionAttempts ?? 0,
            attemptStartAt: progress.attemptStartAt ?? null,
            lastAttemptSummary: progress.lastAttemptSummary
              ? { ...progress.lastAttemptSummary, suggestions: [...progress.lastAttemptSummary.suggestions] }
              : null,
          },
        ]),
      ),
    },

    ruinsState: {
      progressByRuinId: { ...ruinsState.progressByRuinId },
      autoRepeatDefault: ruinsState.autoRepeatDefault,
      autoRestart: ruinsState.autoRestart,
      runHistory: ruinsState.runHistory.map((run) => ({
        ...run,
        drops: run.drops.map((drop) => ({ ...drop })),
      })),
      lastRunSummary: ruinsState.lastRunSummary
        ? { ...ruinsState.lastRunSummary, drops: ruinsState.lastRunSummary.drops.map((drop) => ({ ...drop })) }
        : null,
    },

    shopState: {
      dayKey: shopState.dayKey,
      purchasedToday: Object.fromEntries(
        Object.entries(shopState.purchasedToday).map(([shopId, entries]) => [
          shopId,
          { ...entries },
        ]),
      ),
    },

    equipmentState: {
      equippedWeaponId: equipmentState.equippedWeaponId,
      equippedAccessoryId: equipmentState.equippedAccessoryId,
      refineLevelBySlot: { ...equipmentState.refineLevelBySlot },
      temperBonusesBySlot: { ...equipmentState.temperBonusesBySlot },
      forgeToolTiers: { ...equipmentState.forgeToolTiers },
    },

    buffState: {
      activeTalismans: buffState.activeTalismans.map((entry) => ({ ...entry })),
    },

    techCollectionState: {
      unlockedTechs: { ...techCollectionState.unlockedTechs },
      fragments: { ...techCollectionState.fragments },
      rngSeed: techCollectionState.rngSeed,
    },

    professionState: {
      alchemyQueue: professionState.alchemyQueue.map((job) => ({ ...job })),
      talismanQueue: professionState.talismanQueue.map((job) => ({ ...job })),
      forgeQueue: professionState.forgeQueue.map((job) => ({ ...job })),
      lastTickAt: professionState.lastTickAt,
    },
  };

  return saveData;
}

/**
 * Validate save data structure
 */
function validateSaveData(data: unknown): data is SaveData {
  try {
    if (!data || typeof data !== 'object') return false;
    const record = data as Record<string, unknown>;
    if (!('version' in record) || !('timestamp' in record)) return false;
    if (!('gameState' in record) || !('inventoryState' in record) || !('combatSettings' in record)) return false;
    if ('meta' in record && record.meta !== undefined) {
      const meta = record.meta as Record<string, unknown>;
      if (typeof meta.lastActiveAtMs !== 'number') return false;
    }

    // Basic structure validation
    const gs = record.gameState as Record<string, unknown>;
    if (!('realm' in gs) || typeof gs.qi !== 'string') return false;
    if ('spiritRoot' in gs && gs.spiritRoot !== undefined) {
      const sr = (gs as { spiritRoot?: unknown }).spiritRoot as
        | { grade?: unknown; element?: unknown; purity?: unknown }
        | null;
      if (
        sr !== null &&
        (!sr || typeof sr.grade !== 'number' || typeof sr.element !== 'string' || typeof sr.purity !== 'number')
      ) {
        return false;
      }
    }
    if (
      'lifePath' in gs &&
      (gs as { lifePath?: unknown }).lifePath !== null &&
      (gs as { lifePath?: unknown }).lifePath !== undefined &&
      typeof (gs as { lifePath?: unknown }).lifePath !== 'string'
    ) {
      return false;
    }
    if ('lastTickTime' in gs && typeof gs.lastTickTime !== 'number') return false;
    if ('lastActiveTime' in gs && typeof gs.lastActiveTime !== 'number') return false;
    if ('runStartTime' in gs && typeof gs.runStartTime !== 'number') return false;

    if ('prestigeState' in record && record.prestigeState) {
      const ps = record.prestigeState as Record<string, unknown>;

      const numbersValid =
        typeof ps.totalAP === 'number' &&
        typeof ps.lifetimeAP === 'number' &&
        typeof ps.currentRunAP === 'number' &&
        typeof ps.prestigeCount === 'number' &&
        typeof ps.highestRealmReached === 'number' &&
        typeof ps.runStartTime === 'number' &&
        typeof ps.rerollCount === 'number';

      if (!numbersValid) return false;

      if (!Array.isArray((ps as { prestigeRuns?: unknown }).prestigeRuns)) return false;
      if ('purchasesById' in ps && ps.purchasesById !== undefined && typeof ps.purchasesById !== 'object') {
        return false;
      }
      if ('upgrades' in ps && ps.upgrades !== undefined && typeof ps.upgrades !== 'object') {
        return false;
      }

      if ('spiritRoot' in ps && ps.spiritRoot !== undefined) {
        const sr = (ps as { spiritRoot?: unknown }).spiritRoot as
          | { grade?: unknown; element?: unknown; purity?: unknown }
          | null;
        if (
          sr !== null &&
          (!sr || typeof sr.grade !== 'number' || typeof sr.element !== 'string' || typeof sr.purity !== 'number')
        ) {
          return false;
        }
      }
    }

    const is = record.inventoryState as Record<string, unknown>;
    const itemsValue = (is as { items?: unknown }).items;
    const itemsValid =
      (typeof itemsValue === 'object' && itemsValue !== null) || Array.isArray(itemsValue);
    if (!itemsValid) return false;

    const currenciesValue = (is as { currencies?: unknown }).currencies as
      | { gold?: unknown; spiritStones?: unknown; merit?: unknown }
      | undefined;
    const currenciesValid =
      currenciesValue === undefined ||
      (typeof currenciesValue === 'object' &&
        currenciesValue !== null &&
        typeof currenciesValue.gold === 'string' &&
        typeof currenciesValue.spiritStones === 'string' &&
        typeof currenciesValue.merit === 'string');
    if (!currenciesValid) return false;

    if ('medicinePouchState' in record && record.medicinePouchState !== undefined) {
      const pouch = record.medicinePouchState as Record<string, unknown>;
      const slots = (pouch as { slots?: unknown }).slots;
      const hasSlots = slots && typeof slots === 'object';
      if (!hasSlots) return false;
    }

    const cs = record.combatSettings as Record<string, unknown>;
    if (typeof cs.autoAttack !== 'boolean' || typeof cs.autoCombatAI !== 'boolean') return false;

    // Zone state validation (optional for backward compatibility)
    if ('zoneState' in record && record.zoneState) {
      const zs = record.zoneState as Record<string, unknown>;
      if (!Array.isArray((zs as { unlockedZones?: unknown }).unlockedZones) || typeof zs.zoneProgress !== 'object') return false;
    }

    if ('cityState' in record && record.cityState) {
      const cs = record.cityState as Record<string, unknown>;
      const invalid =
        (cs.currentCityId !== null && typeof cs.currentCityId !== 'string') ||
        !Array.isArray((cs as { unlockedCityIds?: unknown }).unlockedCityIds) ||
        typeof cs.selectedModuleByCity !== 'object' ||
        cs.selectedModuleByCity === null ||
        typeof cs.cityFlagsById !== 'object' ||
        cs.cityFlagsById === null;

      if (invalid) {
        console.warn('[SaveLoad] cityState invalid in save, ignoring section');
      }
    }

    if ('bountyState' in record && record.bountyState) {
      const bs = record.bountyState as Record<string, unknown>;
      if (typeof bs.activeByCityId !== 'object' || bs.activeByCityId === null) return false;
      if (typeof bs.lastRefreshAtByCityId !== 'object' || bs.lastRefreshAtByCityId === null) return false;
      if ('trackedByCityId' in bs && bs.trackedByCityId !== undefined) {
        if (typeof bs.trackedByCityId !== 'object' || bs.trackedByCityId === null) return false;
        const values = Object.values(bs.trackedByCityId as Record<string, unknown>);
        if (!values.every((value) => value === null || typeof value === 'string')) return false;
      }
    }

    if ('expeditionState' in record && record.expeditionState) {
      const es = record.expeditionState as Record<string, unknown>;
      if (typeof es.slots !== 'number') return false;
      if (!Array.isArray((es as { active?: unknown }).active)) return false;
    }

    if ('heartLawState' in record && record.heartLawState) {
      const hs = record.heartLawState as Record<string, unknown>;
      if (hs.selectedHeartLawId !== null && hs.selectedHeartLawId !== undefined && typeof hs.selectedHeartLawId !== 'string') {
        return false;
      }
      if (typeof hs.chapter !== 'number') return false;
      if (typeof hs.comprehension !== 'number') return false;
      if (!Array.isArray((hs as { unlockedHeartLawIds?: unknown }).unlockedHeartLawIds)) return false;
      if (
        'breathMode' in hs &&
        hs.breathMode !== undefined &&
        !['balanced', 'safe', 'fast'].includes(hs.breathMode as string)
      ) {
        return false;
      }
      if ('studyEnabled' in hs && hs.studyEnabled !== undefined && typeof hs.studyEnabled !== 'boolean') {
        return false;
      }
      if (
        'studyTechniqueId' in hs &&
        hs.studyTechniqueId !== null &&
        hs.studyTechniqueId !== undefined &&
        typeof hs.studyTechniqueId !== 'string'
      ) {
        return false;
      }
      if (
        'lastInsightAt' in hs &&
        hs.lastInsightAt !== null &&
        hs.lastInsightAt !== undefined &&
        typeof hs.lastInsightAt !== 'number'
      ) {
        return false;
      }
      if (
        'nextInsightAt' in hs &&
        hs.nextInsightAt !== null &&
        hs.nextInsightAt !== undefined &&
        typeof hs.nextInsightAt !== 'number'
      ) {
        return false;
      }
      if ('stability' in hs && hs.stability !== undefined && typeof hs.stability !== 'number') {
        return false;
      }
      if ('stabilityCap' in hs && hs.stabilityCap !== undefined && typeof hs.stabilityCap !== 'number') {
        return false;
      }
    }

    if ('manualPavilionState' in record && record.manualPavilionState) {
      const mps = record.manualPavilionState as Record<string, unknown>;
      if (!mps.stockByPavilionId || typeof mps.stockByPavilionId !== 'object') return false;
    }

    if ('manualSatchelState' in record && record.manualSatchelState) {
      const mss = record.manualSatchelState as Record<string, unknown>;
      if (!Array.isArray(mss.manuals)) return false;
    }

    if ('techniqueState' in record && record.techniqueState) {
      const ts = record.techniqueState as Record<string, unknown>;
      if (typeof ts.selectedLoadoutId !== 'string') return false;
      if (!Array.isArray((ts as { loadouts?: unknown }).loadouts)) return false;

      const loadouts = (ts as { loadouts: any[] }).loadouts;
      for (const loadout of loadouts) {
        if (!loadout || typeof loadout !== 'object') return false;
        const typed = loadout as Record<string, unknown>;
        if (typeof typed.id !== 'string' || typeof typed.name !== 'string') return false;
        if (typeof typed.aiProfile !== 'string') return false;
        const slots = typed.slots as Record<string, unknown>;
        if (!slots || typeof slots !== 'object') return false;
        if (!Array.isArray(slots.active) || !Array.isArray(slots.passive)) return false;
        if ('ultimate' in slots && slots.ultimate !== null && typeof slots.ultimate !== 'string')
          return false;
      }
    }

    if ('trialState' in record && record.trialState) {
      const ts = record.trialState as Record<string, unknown>;
      if (typeof ts.progressByTrialId !== 'object' || ts.progressByTrialId === null) return false;

      const progressById = ts.progressByTrialId as Record<string, unknown>;
      for (const value of Object.values(progressById)) {
        if (!value || typeof value !== 'object') return false;
        const progress = value as Record<string, unknown>;

        if (
          typeof progress.attempts !== 'number' ||
          typeof progress.cleared !== 'boolean' ||
          ('lastAttemptAt' in progress && progress.lastAttemptAt !== null && typeof progress.lastAttemptAt !== 'number') ||
          ('lastClearAt' in progress && progress.lastClearAt !== null && typeof progress.lastClearAt !== 'number')
        ) {
          return false;
        }
      }
    }

    if ('ruinsState' in record && record.ruinsState) {
      const rs = record.ruinsState as Record<string, unknown>;
      if (typeof rs.progressByRuinId !== 'object' || rs.progressByRuinId === null) return false;
      if (
        'autoRepeatDefault' in rs &&
        (rs as { autoRepeatDefault?: unknown }).autoRepeatDefault !== undefined &&
        typeof (rs as { autoRepeatDefault?: unknown }).autoRepeatDefault !== 'boolean'
      ) {
        return false;
      }
      if (
        'autoRestart' in rs &&
        (rs as { autoRestart?: unknown }).autoRestart !== undefined &&
        typeof (rs as { autoRestart?: unknown }).autoRestart !== 'boolean'
      ) {
        return false;
      }

      if ('runHistory' in rs && rs.runHistory !== undefined) {
        if (!Array.isArray(rs.runHistory)) return false;
        if (!rs.runHistory.every((entry: unknown) => isValidRuinsRunSummary(entry))) return false;
      }

      if ('lastRunSummary' in rs && rs.lastRunSummary != null && !isValidRuinsRunSummary(rs.lastRunSummary)) {
        return false;
      }

      const progressById = rs.progressByRuinId as Record<string, unknown>;
      for (const value of Object.values(progressById)) {
        if (!value || typeof value !== 'object') return false;
        const progress = value as Record<string, unknown>;
        if (
          typeof progress.totalRuns !== 'number' ||
          typeof progress.totalRoomsCleared !== 'number' ||
          typeof progress.bossKills !== 'number'
        ) {
          return false;
        }

        if ('bestRunSeconds' in progress && progress.bestRunSeconds !== undefined && typeof progress.bestRunSeconds !== 'number') {
          return false;
        }

        if ('lastRun' in progress && progress.lastRun !== undefined) {
          const lr = progress.lastRun as any;
          if (
            !lr ||
            typeof lr.endedAt !== 'number' ||
            typeof lr.victory !== 'boolean' ||
            typeof lr.roomsCleared !== 'number' ||
            typeof lr.seconds !== 'number'
          ) {
            return false;
          }
        }
      }
    }

    if ('shopState' in record && record.shopState) {
      const ss = record.shopState as Record<string, unknown>;
      if (typeof ss.dayKey !== 'string') return false;
      if (typeof ss.purchasedToday !== 'object' || ss.purchasedToday === null) return false;
    }

    if ('equipmentState' in record && record.equipmentState) {
      const es = record.equipmentState as Record<string, unknown>;
      const weaponId = (es as { equippedWeaponId?: unknown }).equippedWeaponId;
      const accessoryId = (es as { equippedAccessoryId?: unknown }).equippedAccessoryId;
      if (weaponId !== null && weaponId !== undefined && typeof weaponId !== 'string') return false;
      if (accessoryId !== null && accessoryId !== undefined && typeof accessoryId !== 'string') return false;

      const refine = (es as { refineLevelBySlot?: unknown }).refineLevelBySlot as
        | { weapon?: unknown; accessory?: unknown }
        | undefined;
      if (refine) {
        if (typeof refine.weapon !== 'number' || typeof refine.accessory !== 'number') return false;
      }
    }

    if ('buffState' in record && record.buffState) {
      const bs = record.buffState as Record<string, unknown>;
      if (!Array.isArray((bs as { activeTalismans?: unknown }).activeTalismans)) return false;
      const active = (bs as { activeTalismans: Array<Record<string, unknown>> }).activeTalismans;
      for (const entry of active) {
        if (!entry || typeof entry !== 'object') return false;
        if (typeof entry.id !== 'string') return false;
        if (typeof entry.itemId !== 'string') return false;
        if (typeof entry.startedAt !== 'number') return false;
        if (typeof entry.endsAt !== 'number') return false;
        if ('bonuses' in entry && entry.bonuses !== undefined && typeof entry.bonuses !== 'object') return false;
      }
    }

    if ('professionState' in record && record.professionState) {
      const ps = record.professionState as Record<string, unknown>;
      if ('alchemyQueue' in ps && !Array.isArray((ps as { alchemyQueue?: unknown }).alchemyQueue)) return false;
      if ('talismanQueue' in ps && !Array.isArray((ps as { talismanQueue?: unknown }).talismanQueue)) return false;
      if ('forgeQueue' in ps && !Array.isArray((ps as { forgeQueue?: unknown }).forgeQueue)) return false;
      if ('lastTickAt' in ps && typeof ps.lastTickAt !== 'number') return false;

      const queue = (ps as { alchemyQueue?: Array<Record<string, unknown>> }).alchemyQueue ?? [];
      for (const job of queue) {
        if (!job || typeof job !== 'object') return false;
        if (typeof job.id !== 'string') return false;
        if (typeof job.recipeId !== 'string') return false;
        if (typeof job.qty !== 'number') return false;
        if (typeof job.startedAt !== 'number') return false;
        if (typeof job.endsAt !== 'number') return false;
        if ('cityId' in job && job.cityId !== undefined && typeof job.cityId !== 'string') return false;
      }

      const talismanQueue = (ps as { talismanQueue?: Array<Record<string, unknown>> }).talismanQueue ?? [];
      for (const job of talismanQueue) {
        if (!job || typeof job !== 'object') return false;
        if (typeof job.id !== 'string') return false;
        if (typeof job.recipeId !== 'string') return false;
        if (typeof job.qty !== 'number') return false;
        if (typeof job.startedAt !== 'number') return false;
        if (typeof job.endsAt !== 'number') return false;
        if ('cityId' in job && job.cityId !== undefined && typeof job.cityId !== 'string') return false;
      }

      const forgeQueue = (ps as { forgeQueue?: Array<Record<string, unknown>> }).forgeQueue ?? [];
      for (const job of forgeQueue) {
        if (!job || typeof job !== 'object') return false;
        if (typeof job.id !== 'string') return false;
        if (typeof job.blueprintId !== 'string') return false;
        if (typeof job.qty !== 'number') return false;
        if (typeof job.startedAt !== 'number') return false;
        if (typeof job.endsAt !== 'number') return false;
        if ('targetSlot' in job && job.targetSlot !== undefined) {
          if (job.targetSlot !== 'weapon' && job.targetSlot !== 'accessory') return false;
        }
        if ('mode' in job && job.mode !== undefined) {
          if (job.mode !== 'IDLE' && job.mode !== 'ASSISTED' && job.mode !== 'HANDS_ON') return false;
        }
        if ('status' in job && job.status !== undefined) {
          if (job.status !== 'QUEUED' && job.status !== 'ACTIVE' && job.status !== 'READY_TO_CLAIM' && job.status !== 'CLAIMED') {
            return false;
          }
        }
        if ('sessionId' in job && job.sessionId !== undefined && typeof job.sessionId !== 'string') return false;
        if ('performance' in job && job.performance !== undefined) {
          if (typeof job.performance !== 'object' || job.performance === null) return false;
          const perf = job.performance as Record<string, unknown>;
          const checkNum = (value: unknown) => value === undefined || (typeof value === 'number' && Number.isFinite(value));
          if (!checkNum(perf.heatScore)) return false;
          if (!checkNum(perf.hammerScore)) return false;
          if (!checkNum(perf.specialScore)) return false;
          if (!checkNum(perf.qualityScore)) return false;
          if ('stepBreakdown' in perf && perf.stepBreakdown !== undefined) {
            if (!Array.isArray(perf.stepBreakdown)) return false;
            for (const entry of perf.stepBreakdown) {
              if (!entry || typeof entry !== 'object') return false;
              const record = entry as Record<string, unknown>;
              if (typeof record.stepId !== 'string') return false;
              if (typeof record.type !== 'string') return false;
              if (record.score !== undefined && (typeof record.score !== 'number' || !Number.isFinite(record.score))) return false;
            }
          }
        }
        if ('resultSnapshot' in job && job.resultSnapshot !== undefined) {
          if (typeof job.resultSnapshot !== 'object' || job.resultSnapshot === null) return false;
          const snapshot = job.resultSnapshot as Record<string, unknown>;
          if (snapshot.outputItemId !== undefined && typeof snapshot.outputItemId !== 'string') return false;
          if (snapshot.outputBundle !== undefined) {
            if (typeof snapshot.outputBundle !== 'object' || snapshot.outputBundle === null) return false;
            const bundle = snapshot.outputBundle as Record<string, unknown>;
            if (bundle.items !== undefined) {
              if (!Array.isArray(bundle.items)) return false;
              for (const item of bundle.items) {
                if (!item || typeof item !== 'object') return false;
                const record = item as Record<string, unknown>;
                if (typeof record.itemId !== 'string') return false;
                if (typeof record.qty !== 'number') return false;
              }
            }
          }
          if (snapshot.beforeItem !== undefined && typeof snapshot.beforeItem !== 'object') return false;
          if (snapshot.afterItem !== undefined && typeof snapshot.afterItem !== 'object') return false;
        }
        if ('cityId' in job && job.cityId !== undefined && typeof job.cityId !== 'string') return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Save data validation error:', error);
    return false;
  }
}

/**
 * Encrypt save data
 */
function encryptSaveData(data: SaveData): string {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt save data');
  }
}

/**
 * Decrypt save data
 */
function decryptSaveData(encrypted: string): SaveData | null {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!jsonString) {
      console.error('Decryption produced empty string');
      return null;
    }

    const data = JSON.parse(jsonString);
    const migrated = migrateSave(data);
    if (!validateSaveData(migrated)) {
      console.warn('[SaveLoad] Migrated save data failed validation, using defaults');
      return buildDefaultSaveState();
    }
    pendingOfflineContext = buildOfflineContext(
      migrated.meta?.lastActiveAtMs ??
        migrated.gameState.lastActiveTime ??
        migrated.gameState.lastTickTime ??
        Date.now(),
      {
        wasMeditating: migrated.activityState?.active?.type === 'meditate',
      },
    );
    return migrated;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

let pendingOfflineContext: OfflineContext | null = null;

export function consumeOfflineContext(): OfflineContext | null {
  const context = pendingOfflineContext;
  pendingOfflineContext = null;
  return context;
}

export function getLastLoadedSaveSnapshot(): SaveData | null {
  return lastLoadedSaveData;
}

/**
 * Rotate backup saves (C → B → A → main)
 */
function rotateBackups(): void {
  try {
    // Get current saves
    const mainSave = localStorage.getItem(SAVE_KEY);
    const backupA = localStorage.getItem(BACKUP_A_KEY);
    const backupB = localStorage.getItem(BACKUP_B_KEY);

    // Rotate: C ← B ← A ← main
    if (backupB) {
      localStorage.setItem(BACKUP_C_KEY, backupB);
    }
    if (backupA) {
      localStorage.setItem(BACKUP_B_KEY, backupA);
    }
    if (mainSave) {
      localStorage.setItem(BACKUP_A_KEY, mainSave);
    }
  } catch (error) {
    console.error('Backup rotation error:', error);
    // Don't throw - backup rotation failing shouldn't prevent saving
  }
}

/**
 * Save game to localStorage
 * Returns true if successful, false otherwise
 */
export function saveGame(): boolean {
  try {
    console.log('[SaveLoad] Saving game...');

    // Gather state
    const saveData = gatherGameState();

    // Encrypt
    const encrypted = encryptSaveData(saveData);

    // Rotate backups before saving
    rotateBackups();

    // Save to main slot
    localStorage.setItem(SAVE_KEY, encrypted);

    console.log('[SaveLoad] Game saved successfully at', new Date(saveData.timestamp).toLocaleString());
    return true;
  } catch (error) {
    console.error('[SaveLoad] Save failed:', error);
    return false;
  }
}

/**
 * Apply save data to stores
 */
function applySaveData(saveData: SaveData): void {
  try {
    const defaults = buildDefaultSaveState();
    const prestigeStore = usePrestigeStore.getState();
    const gameStore = useGameStore.getState();
    const cityState =
      saveData.cityState ??
      defaults.cityState ?? {
        currentCityId: null,
        unlockedCityIds: [],
        selectedModuleByCity: {},
        cityFlagsById: {},
        initializedFromContent: false,
      };
    const shopState = saveData.shopState ?? defaults.shopState ?? { dayKey: '', purchasedToday: {} };
    const equipmentState =
      saveData.equipmentState ??
      defaults.equipmentState ?? {
        equippedWeaponId: null,
        equippedAccessoryId: null,
        refineLevelBySlot: { weapon: 0, accessory: 0 },
        temperBonusesBySlot: { weapon: [], accessory: [] },
        forgeToolTiers: { anvil: 1, hammer: 1, bellows: 1, quenchTub: 1 },
      };
    const buffState = saveData.buffState ?? defaults.buffState ?? { activeTalismans: [] };
    const professionState =
      saveData.professionState ??
      defaults.professionState ?? { alchemyQueue: [], talismanQueue: [], forgeQueue: [], lastTickAt: 0 };
    const collectionState =
      saveData.techCollectionState ?? defaults.techCollectionState ?? { unlockedTechs: {}, fragments: {}, rngSeed: undefined };
    const activityState = saveData.activityState ?? defaults.activityState ?? { active: null, lastChangedAt: null, history: [] };
    const outskirtsState =
      saveData.outskirtsState ?? defaults.outskirtsState ?? { progressByOutskirtsId: {}, autoContinue: true, stopAtBoss: false };
    const heartLawState =
      saveData.heartLawState ??
      defaults.heartLawState ?? {
        selectedHeartLawId: null,
        chapter: 1,
        comprehension: 0,
        unlockedHeartLawIds: [],
        breathMode: 'balanced',
        studyTechniqueId: null,
        lastInsightAt: null,
      };
    const trialState = saveData.trialState ?? defaults.trialState ?? { progressByTrialId: {}, activeTrialSessionId: null };
    const bountyState =
      saveData.bountyState ?? defaults.bountyState ?? { activeByCityId: {}, lastRefreshAtByCityId: {}, trackedByCityId: {} };
    const expeditionState =
      saveData.expeditionState ?? defaults.expeditionState ?? { slots: 0, active: [], rareProgressByKey: {} };
  const ruinsState =
    saveData.ruinsState ??
    defaults.ruinsState ?? { progressByRuinId: {}, autoRepeatDefault: false, autoRestart: false, runHistory: [], lastRunSummary: null };
  const craftSessionState =
    saveData.craftSessionState ?? defaults.craftSessionState ?? { modeByStation: {}, activeSession: null };
  const recipeMasteryState = saveData.recipeMasteryState ?? defaults.recipeMasteryState ?? { alchemy: {} };

    // Restore spirit root (fallback to reroll for old saves)
    const spiritRoot = saveData.prestigeState?.spiritRoot ?? saveData.gameState.spiritRoot;
    if (spiritRoot && typeof spiritRoot.grade === 'number' && spiritRoot.element) {
      usePrestigeStore.setState({ spiritRoot, rerollCount: saveData.prestigeState?.rerollCount ?? 0 });
    } else {
      prestigeStore.generateSpiritRoot();
    }

    if (saveData.prestigeState) {
      const prestigeState = saveData.prestigeState;
      usePrestigeStore.setState((state) => {
        state.totalAP = prestigeState.totalAP;
        state.lifetimeAP = prestigeState.lifetimeAP;
        state.currentRunAP = prestigeState.currentRunAP;
        state.prestigeCount = prestigeState.prestigeCount;
        state.prestigeRuns = prestigeState.prestigeRuns || [];
        const legacyUpgrades = (prestigeState as { upgrades?: Record<string, { currentLevel?: number }> }).upgrades;
        const legacyPurchases: Record<string, number> = {};
        if (legacyUpgrades) {
          Object.entries(legacyUpgrades).forEach(([id, upgrade]) => {
            const level = typeof upgrade?.currentLevel === 'number' ? upgrade.currentLevel : 0;
            if (level > 0) legacyPurchases[id] = level;
          });
        }
        state.purchasesById = {
          ...legacyPurchases,
          ...(prestigeState.purchasesById || {}),
        };
        state.highestRealmReached = prestigeState.highestRealmReached;
        state.runStartTime = prestigeState.runStartTime;
        state.rerollCount = prestigeState.rerollCount;
      });
    }

    // Apply to game store
    useGameStore.setState({
      realm: saveData.gameState.realm,
      qi: saveData.gameState.qi,
      selectedPath: saveData.gameState.selectedPath,
      lifePath: saveData.gameState.lifePath ?? null,
      focusMode: saveData.gameState.focusMode,
      pathPerks: saveData.gameState.pathPerks || [],
      totalAuras: saveData.gameState.totalAuras,
      upgradeTiers: saveData.gameState.upgradeTiers,
      pityState: saveData.gameState.pityState || {
        killsSinceUncommon: 0,
        killsSinceRare: 0,
        killsSinceEpic: 0,
        killsSinceLegendary: 0,
      },
      playerLuck: saveData.gameState.playerLuck || 0,
      lastTickTime: saveData.gameState.lastTickTime || Date.now(),
      lastActiveTime: saveData.gameState.lastActiveTime || Date.now(),
      runStartTime: saveData.gameState.runStartTime || prestigeStore.runStartTime,
    });

    // Apply to inventory store
    useInventoryStore.setState((state) => {
      const savedItems = saveData.inventoryState.items as unknown;
      const nextItems: Record<string, number> = {};

      if (Array.isArray(savedItems)) {
        for (const entry of savedItems as Array<{ itemId?: string; quantity?: number }>) {
          if (!entry || typeof entry.itemId !== 'string') continue;
          const qty = Math.floor(entry.quantity ?? 0);
          if (Number.isNaN(qty) || qty <= 0) continue;
          nextItems[entry.itemId] = (nextItems[entry.itemId] || 0) + qty;
        }
      } else if (savedItems && typeof savedItems === 'object') {
        Object.entries(savedItems as Record<string, unknown>).forEach(([itemId, qty]) => {
          if (typeof itemId !== 'string') return;
          const amount = Math.floor(typeof qty === 'number' ? qty : 0);
          if (Number.isNaN(amount) || amount <= 0) return;
          nextItems[itemId] = amount;
        });
      }

      const savedCurrencies = (saveData.inventoryState as { currencies?: Record<string, unknown> }).currencies;
      const gold =
        typeof savedCurrencies?.gold === 'string'
          ? savedCurrencies.gold
          : typeof (saveData.inventoryState as { gold?: unknown }).gold === 'string'
            ? (saveData.inventoryState as { gold?: string }).gold!
            : '0';
      const spiritStones =
        typeof savedCurrencies?.spiritStones === 'string'
          ? savedCurrencies.spiritStones
          : typeof (saveData.inventoryState as { spiritStones?: unknown }).spiritStones === 'string'
            ? (saveData.inventoryState as { spiritStones?: string }).spiritStones!
            : '0';
      const merit =
        typeof savedCurrencies?.merit === 'string'
          ? savedCurrencies.merit
          : typeof (saveData.inventoryState as { merit?: unknown }).merit === 'string'
            ? (saveData.inventoryState as { merit?: string }).merit!
            : '0';

      state.currencies = {
        gold,
        spiritStones,
        merit,
      };
      state.items = nextItems;
      state.gold = gold;
      state.spiritStones = spiritStones;
      state.merit = merit;
    });

    useCraftSessionStore.getState().hydrate(craftSessionState);
    useMedicinePouchStore.getState().hydrate(saveData.medicinePouchState ?? defaults.medicinePouchState);
    useRecipeMasteryStore.getState().hydrate(recipeMasteryState);

    // Apply combat settings
    useCombatStore.setState({
      autoAttack: saveData.combatSettings.autoAttack,
      autoCombatAI: saveData.combatSettings.autoCombatAI,
    });

    // Apply zone state (if exists)
    useZoneStore.setState({
      unlockedZones: saveData.zoneState.unlockedZones,
      zoneProgress: saveData.zoneState.zoneProgress,
    });

    useCityStore.setState({
      currentCityId: cityState.currentCityId ?? null,
      unlockedCityIds: Array.isArray(cityState.unlockedCityIds) ? [...cityState.unlockedCityIds] : [],
      selectedModuleByCity: { ...(cityState.selectedModuleByCity ?? {}) },
      cityFlagsById: { ...(cityState.cityFlagsById ?? {}) },
      initializedFromContent: cityState.initializedFromContent ?? false,
    });

    useTechniqueStore.getState().hydrateFromSave(saveData.techniqueState);

    const restoredTrials = Object.fromEntries(
      Object.entries(trialState.progressByTrialId ?? {}).map(([trialId, progress]) => [
        trialId,
        {
          ...progress,
          sessionAttempts: progress.sessionAttempts ?? 0,
          attemptStartAt: progress.attemptStartAt ?? null,
          lastAttemptSummary: progress.lastAttemptSummary
            ? { ...progress.lastAttemptSummary, suggestions: [...progress.lastAttemptSummary.suggestions] }
            : null,
        },
      ]),
    );

    useTrialStore.setState({
      activeTrialSessionId: trialState.activeTrialSessionId ?? null,
      progressByTrialId: restoredTrials,
    });

    useBountyStore.setState({
      activeByCityId: { ...(bountyState.activeByCityId ?? {}) },
      lastRefreshAtByCityId: {
        ...(bountyState.lastRefreshAtByCityId ?? {}),
      },
      trackedByCityId: { ...(bountyState.trackedByCityId ?? {}) },
    });

    useExpeditionStore.setState({
      slots: expeditionState.slots,
      active: Array.isArray(expeditionState.active)
        ? expeditionState.active.map((run) => ({
            ...run,
            seed:
              typeof run.seed === 'number' && Number.isFinite(run.seed)
                ? run.seed >>> 0
                : ((run as { startedAt?: number }).startedAt ?? Date.now()) >>> 0,
          }))
        : [],
      rareProgressByKey: { ...(expeditionState.rareProgressByKey ?? {}) },
    });
    useExpeditionStore.getState().tick(Date.now());

    useHeartLawStore.setState({
      selectedHeartLawId: heartLawState.selectedHeartLawId ?? null,
      chapter: typeof heartLawState.chapter === 'number' ? heartLawState.chapter : 1,
      comprehension: typeof heartLawState.comprehension === 'number' ? heartLawState.comprehension : 0,
      unlockedHeartLawIds: Array.isArray(heartLawState.unlockedHeartLawIds)
        ? Array.from(new Set(heartLawState.unlockedHeartLawIds))
        : getDefaultUnlockedHeartLawIds(),
      breathMode:
        heartLawState.breathMode === 'safe' || heartLawState.breathMode === 'fast'
          ? heartLawState.breathMode
          : 'balanced',
      studyEnabled: typeof heartLawState.studyEnabled === 'boolean' ? heartLawState.studyEnabled : false,
      studyTechniqueId:
        typeof heartLawState.studyTechniqueId === 'string' || heartLawState.studyTechniqueId === null
          ? heartLawState.studyTechniqueId
          : null,
      lastInsightAt:
        typeof heartLawState.lastInsightAt === 'number' && Number.isFinite(heartLawState.lastInsightAt)
          ? heartLawState.lastInsightAt
          : null,
      nextInsightAt:
        typeof heartLawState.nextInsightAt === 'number' && Number.isFinite(heartLawState.nextInsightAt)
          ? heartLawState.nextInsightAt
          : null,
      insight: (heartLawState as any).insight ?? null,
      stability:
        typeof heartLawState.stability === 'number' && Number.isFinite(heartLawState.stability)
          ? heartLawState.stability
          : 0,
      stabilityCap:
        typeof heartLawState.stabilityCap === 'number' && Number.isFinite(heartLawState.stabilityCap)
          ? heartLawState.stabilityCap
          : 100,
    });

    const manualSatchelState = saveData.manualSatchelState ?? defaults.manualSatchelState ?? {
      manuals: [],
      activeStudy: null,
      lastLearned: null,
    };
    const manualPavilionState = saveData.manualPavilionState ?? defaults.manualPavilionState;
    useManualPavilionStore.getState().hydrate(manualPavilionState);
    useManualSatchelStore.getState().hydrate(manualSatchelState);

    const hydratedRuinProgress = Object.fromEntries(
      Object.entries(ruinsState.progressByRuinId ?? {}).map(([ruinId, progress]) => [
        ruinId,
        { ...progress, bossChestRareFailures: progress.bossChestRareFailures ?? 0 },
      ]),
    );

    useRuinsStore.setState({
      progressByRuinId: hydratedRuinProgress,
      autoRepeatDefault: ruinsState.autoRepeatDefault,
      autoRestart: ruinsState.autoRestart ?? ruinsState.autoRepeatDefault ?? false,
      runHistory: Array.isArray(ruinsState.runHistory)
        ? (ruinsState.runHistory as SaveData['ruinsState']['runHistory']).slice(0, 5)
        : [],
      lastRunSummary: ruinsState.lastRunSummary ?? null,
      activeRun: null,
    });

    useShopStore.getState().hydrate(shopState);

    useEquipmentStore.setState({
      equippedWeaponId: equipmentState.equippedWeaponId ?? null,
      equippedAccessoryId: equipmentState.equippedAccessoryId ?? null,
      refineLevelBySlot: {
        weapon: equipmentState.refineLevelBySlot?.weapon ?? 0,
        accessory: equipmentState.refineLevelBySlot?.accessory ?? 0,
      },
      temperBonusesBySlot: {
        weapon: Array.isArray((equipmentState as any).temperBonusesBySlot?.weapon)
          ? (((equipmentState as any).temperBonusesBySlot?.weapon as any[]) ?? [])
          : [],
        accessory: Array.isArray((equipmentState as any).temperBonusesBySlot?.accessory)
          ? (((equipmentState as any).temperBonusesBySlot?.accessory as any[]) ?? [])
          : [],
      },
      forgeToolTiers: {
        anvil: Math.max(1, Math.min(10, Number((equipmentState as any).forgeToolTiers?.anvil) || 1)),
        hammer: Math.max(1, Math.min(10, Number((equipmentState as any).forgeToolTiers?.hammer) || 1)),
        bellows: Math.max(1, Math.min(10, Number((equipmentState as any).forgeToolTiers?.bellows) || 1)),
        quenchTub: Math.max(1, Math.min(10, Number((equipmentState as any).forgeToolTiers?.quenchTub) || 1)),
      },
    });

    useBuffStore.setState({
      activeTalismans: Array.isArray(buffState.activeTalismans)
        ? buffState.activeTalismans.map((entry) => ({ ...entry }))
        : [],
    });
    useBuffStore.getState().purgeExpired(Date.now());

    const fallbackCityId =
      useCityStore.getState().currentCityId ??
      useCityStore.getState().unlockedCityIds[0] ??
      'city_pinewind_hamlet';

    useProfessionStore.setState({
      alchemyQueue: Array.isArray(professionState.alchemyQueue)
        ? professionState.alchemyQueue.map((job) => ({ ...job, cityId: job.cityId ?? fallbackCityId }))
        : [],
      talismanQueue: Array.isArray(professionState.talismanQueue)
        ? professionState.talismanQueue.map((job) => ({ ...job, cityId: job.cityId ?? fallbackCityId }))
        : [],
      forgeQueue: Array.isArray(professionState.forgeQueue)
        ? professionState.forgeQueue.map((job) => ({ ...job, cityId: job.cityId ?? fallbackCityId }))
        : [],
      lastTickAt: typeof professionState.lastTickAt === 'number' ? professionState.lastTickAt : 0,
    });

    useTechCollectionStore.getState().hydrate(collectionState);

    useActivityStore.setState({
      active: (activityState.active as any) ?? null,
      lastChangedAt: activityState.lastChangedAt ?? null,
      history: Array.isArray(activityState.history) ? ([...activityState.history] as any) : [],
    });

    useOutskirtsStore.setState({
      progressByOutskirtsId: {
        ...(outskirtsState.progressByOutskirtsId ?? {}),
      },
      autoContinue: outskirtsState.autoContinue ?? true,
      stopAtBoss: outskirtsState.stopAtBoss ?? false,
    });

    const contentState = useContentStore.getState();
    if (contentState.isLoaded) {
      recomputeAndApplyPrestigeUnlocks(usePrestigeStore.getState().purchasesById);
    } else {
      const unsubscribe = useContentStore.subscribe((state) => {
        if (!state.isLoaded) return;
        recomputeAndApplyPrestigeUnlocks(usePrestigeStore.getState().purchasesById);
        unsubscribe();
      });
    }

    // Recalculate derived values after hydration
    gameStore.calculateQiPerSecond();
    gameStore.calculatePlayerStats();

    assertRequiredSaveKeys(gatherGameState());
    console.log('[SaveLoad] Save data applied successfully');
  } catch (error) {
    console.error('[SaveLoad] Error applying save data:', error);
    throw error;
  }
}

/**
 * Load game from localStorage
 * Tries main save, then backups A, B, C in order
 * Returns true if successful, false otherwise
 */
export function loadGame(): boolean {
  try {
    console.log('[SaveLoad] Loading game...');

    const saveKeys = [SAVE_KEY, BACKUP_A_KEY, BACKUP_B_KEY, BACKUP_C_KEY];
    let saveData: SaveData | null = null;
    let loadedFrom: string | null = null;

    // Try each save slot in order
    for (const key of saveKeys) {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) {
        console.log(`[SaveLoad] No save found at ${key}`);
        continue;
      }

      console.log(`[SaveLoad] Attempting to load from ${key}...`);
      saveData = decryptSaveData(encrypted);

      if (saveData) {
        loadedFrom = key;
        break;
      } else {
        console.warn(`[SaveLoad] Failed to decrypt save from ${key}`);
      }
    }

    if (!saveData) {
      console.log('[SaveLoad] No valid save found');
      return false;
    }

    lastLoadedSaveData = saveData;

    pendingOfflineContext = buildOfflineContext(
      saveData.meta?.lastActiveAtMs ??
        saveData.gameState.lastActiveTime ??
        saveData.gameState.lastTickTime ??
        Date.now(),
      {
        wasMeditating: saveData.activityState?.active?.type === 'meditate',
      },
    );

    // Apply save data to stores
    applySaveData(saveData);

    // If we loaded from a backup, save it to main slot
    if (loadedFrom !== SAVE_KEY) {
      console.log(`[SaveLoad] Loaded from backup ${loadedFrom}, saving to main slot`);
      saveGame();
    }

    console.log('[SaveLoad] Game loaded successfully from', loadedFrom);
    console.log('[SaveLoad] Save timestamp:', new Date(saveData.timestamp).toLocaleString());
    return true;
  } catch (error) {
    console.error('[SaveLoad] Load failed:', error);
    return false;
  }
}

/**
 * Delete all saves and reset game
 * Returns true if successful, false otherwise
 */
export function deleteSave(): boolean {
  try {
    console.log('[SaveLoad] Deleting all saves...');

    // Remove all save slots
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_A_KEY);
    localStorage.removeItem(BACKUP_B_KEY);
    localStorage.removeItem(BACKUP_C_KEY);

    // Reset all stores to initial state
    const gameStore = useGameStore.getState();
    gameStore.resetRun();

    useInventoryStore.getState().hardResetInventory();

    useCraftSessionStore.getState().hardReset();
    useMedicinePouchStore.getState().hardReset();
    useRecipeMasteryStore.getState().hardReset();

    useCombatStore.setState({
      autoAttack: false,
      autoCombatAI: false,
    });

    useCityStore.getState().hardResetCity();

    useTrialStore.getState().hardResetTrials();

    useRuinsStore.getState().hardResetRuins();

    useShopStore.getState().hardResetShop();

    useProfessionStore.setState({ alchemyQueue: [], talismanQueue: [], forgeQueue: [], lastTickAt: 0 });
    useEquipmentStore.getState().hardResetEquipment();
    useBuffStore.getState().hardResetBuffs();
    useBountyStore.getState().hardResetBounties();
    useExpeditionStore.setState({ slots: 1, active: [] });
    useHeartLawStore.setState({
      selectedHeartLawId: null,
      chapter: 1,
      comprehension: 0,
      unlockedHeartLawIds: getDefaultUnlockedHeartLawIds(),
    });

    try {
      useTechCollectionStore.getState().hardReset();
    } catch (error) {
      console.warn('[deleteSave] Failed to reset technique collection', error);
    }

    try {
      useManualSatchelStore.getState().hardReset();
    } catch (error) {
      console.warn('[deleteSave] Failed to reset manual satchel', error);
    }

    console.log('[SaveLoad] All saves deleted and game reset');
    return true;
  } catch (error) {
    console.error('[SaveLoad] Delete save failed:', error);
    return false;
  }
}

/**
 * Delete all save data and fully reset the game to a fresh install state.
 */
export function deleteSaveAndHardReset(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_A_KEY);
    localStorage.removeItem(BACKUP_B_KEY);
    localStorage.removeItem(BACKUP_C_KEY);
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to remove save keys', error);
  }

  try {
    useGameStore.getState().hardResetGameState();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset game state', error);
  }

  try {
    useInventoryStore.getState().hardResetInventory();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset inventory', error);
  }

  try {
    useCraftSessionStore.getState().hardReset();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset craft session state', error);
  }

  try {
    useMedicinePouchStore.getState().hardReset();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset medicine pouch', error);
  }

  try {
    useRecipeMasteryStore.getState().hardReset();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset recipe mastery', error);
  }

  try {
    useCombatStore.getState().hardResetCombat();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset combat', error);
  }

  try {
    useCityStore.getState().hardResetCity();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset city state', error);
  }

  try {
    useTrialStore.getState().hardResetTrials();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset trial state', error);
  }

  try {
    useRuinsStore.getState().hardResetRuins();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset ruins state', error);
  }

  try {
    useShopStore.getState().hardResetShop();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset shop state', error);
  }

  try {
    useProfessionStore.setState({ alchemyQueue: [], talismanQueue: [], forgeQueue: [], lastTickAt: 0 });
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset profession state', error);
  }

  try {
    useEquipmentStore.getState().hardResetEquipment();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset equipment state', error);
  }

  try {
    useBuffStore.getState().hardResetBuffs();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset buff state', error);
  }

  try {
    useZoneStore.getState().hardResetZones();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset zones', error);
  }

  try {
    useTechniqueStore.getState().resetLoadouts();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset technique loadouts', error);
  }

  try {
    useTechCollectionStore.getState().hardReset();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset technique collection', error);
  }

  try {
    useManualSatchelStore.getState().hardReset();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset manual satchel', error);
  }

  try {
    usePrestigeStore.getState().hardResetPrestige();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset prestige', error);
  }

  try {
    useUIStore.getState().hardResetUI();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset UI state', error);
  }

  window.location.reload();
}

/**
 * Export save as base64 string (for manual backup)
 * Returns base64 string or null on error
 */
export function exportSave(): string | null {
  try {
    console.log('[SaveLoad] Exporting save...');

    const saveData = gatherGameState();
    const jsonString = JSON.stringify(saveData);

    // Double encoding: JSON → base64 → encrypt → base64
    // This makes it copy-paste friendly
    const base64Json = btoa(jsonString);
    const encrypted = CryptoJS.AES.encrypt(base64Json, ENCRYPTION_KEY).toString();
    const exportString = btoa(encrypted);

    console.log('[SaveLoad] Save exported successfully');
    return exportString;
  } catch (error) {
    console.error('[SaveLoad] Export failed:', error);
    return null;
  }
}

/**
 * Import save from base64 string
 * Returns true if successful, false otherwise
 */
export function importSave(base64String: string): boolean {
  try {
    console.log('[SaveLoad] Importing save...');

    if (!base64String || typeof base64String !== 'string') {
      console.error('[SaveLoad] Invalid import string');
      return false;
    }

    // Reverse the export encoding
    const encrypted = atob(base64String);
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const base64Json = decrypted.toString(CryptoJS.enc.Utf8);

    if (!base64Json) {
      console.error('[SaveLoad] Decryption failed');
      return false;
    }

    const jsonString = atob(base64Json);
    const rawSave = JSON.parse(jsonString);
    const saveData = migrateSave(rawSave);
    pendingOfflineContext = null;

    // Apply the imported data
    applySaveData(saveData);

    // Save to localStorage
    saveGame();

    console.log('[SaveLoad] Save imported successfully');
    return true;
  } catch (error) {
    console.error('[SaveLoad] Import failed:', error);
    return false;
  }
}

/**
 * Autosave interval ID (stored globally to allow stopping)
 */
let autosaveIntervalId: number | null = null;

/**
 * Start autosave timer
 * Saves every 60 seconds
 * Returns the interval ID
 */
export function startAutosave(): number {
  // Stop existing autosave if running
  if (autosaveIntervalId !== null) {
    stopAutosave();
  }

  console.log('[SaveLoad] Starting autosave (every 60 seconds)');

  // Save immediately
  saveGame();

  // Set up autosave interval
  autosaveIntervalId = window.setInterval(() => {
    console.log('[SaveLoad] Autosave triggered');
    saveGame();
  }, 60000); // 60 seconds

  return autosaveIntervalId;
}

/**
 * Stop autosave timer
 */
export function stopAutosave(): void {
  if (autosaveIntervalId !== null) {
    console.log('[SaveLoad] Stopping autosave');
    window.clearInterval(autosaveIntervalId);
    autosaveIntervalId = null;
  }
}

/**
 * Check if a save exists
 * Returns true if any save slot has data
 */
export function hasSave(): boolean {
  try {
    const mainSave = localStorage.getItem(SAVE_KEY);
    const backupA = localStorage.getItem(BACKUP_A_KEY);
    const backupB = localStorage.getItem(BACKUP_B_KEY);
    const backupC = localStorage.getItem(BACKUP_C_KEY);

    return !!(mainSave || backupA || backupB || backupC);
  } catch (error) {
    console.error('[SaveLoad] Error checking for saves:', error);
    return false;
  }
}

/**
 * Get save information without loading it
 * Returns save metadata or null if no save exists
 */
export function getSaveInfo(): { timestamp: number; version: string } | null {
  try {
    const encrypted = localStorage.getItem(SAVE_KEY);
    if (!encrypted) return null;

    const saveData = decryptSaveData(encrypted);
    if (!saveData) return null;

    return {
      timestamp: saveData.timestamp,
      version: saveData.version,
    };
  } catch (error) {
    console.error('[SaveLoad] Error getting save info:', error);
    return null;
  }
}
