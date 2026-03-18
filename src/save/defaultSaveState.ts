import type { SaveData } from '../types';
import type {
  CraftMode,
  CraftPromptState,
  CraftSession,
  CraftSessionPayment,
  CraftSessionSaveState,
  CraftStation,
  CraftScript,
} from '../systems/crafting/craftingTypes';
import { useGameStore } from '../stores/gameStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCombatStore } from '../stores/combatStore';
import { useZoneStore } from '../stores/zoneStore';
import { usePrestigeStore } from '../stores/prestigeStore';
import { useCityStore } from '../stores/cityStore';
import { useActivityStore } from '../stores/activityStore';
import { useOutskirtsStore } from '../stores/outskirtsStore';
import { normalizeTrialProgress, useTrialStore } from '../stores/trialStore';
import { useRuinsStore } from '../stores/ruinsStore';
import { useShopStore } from '../stores/shopStore';
import { useTechCollectionStore } from '../stores/techCollectionStore';
import { useTechniqueStore } from '../stores/techniqueStore';
import { useProfessionStore } from '../stores/professionStore';
import { useEquipmentStore } from '../stores/equipmentStore';
import { useBuffStore } from '../stores/buffStore';
import { useBountyStore } from '../stores/bountyStore';
import { useExpeditionStore } from '../stores/expeditionStore';
import { useHeartLawStore } from '../stores/heartLawStore';
import { useManualPavilionStore } from '../stores/manualPavilionStore';
import { useManualSatchelStore } from '../stores/manualSatchelStore';
import { createDefaultMedicinePouchState, useMedicinePouchStore } from '../stores/medicinePouchStore';
import { createDefaultCraftSessionState, useCraftSessionStore } from '../stores/craftSessionStore';
import { createDefaultRecipeMasteryState, useRecipeMasteryStore } from '../stores/recipeMasteryStore';

import { CURRENT_SAVE_VERSION, migrateIncomingSaveForHydration } from './migrations';

export const SAVE_VERSION = CURRENT_SAVE_VERSION;

const REQUIRED_SAVE_KEYS = [
  'cityState',
  'activityState',
  'outskirtsState',
  'trialState',
  'ruinsState',
  'techCollectionState',
  'techniqueState',
  'professionState',
  'shopState',
  'bountyState',
  'expeditionState',
  'heartLawState',
  'prestigeState',
  'manualPavilionState',
  'manualSatchelState',
  'craftSessionState',
  'medicinePouchState',
  'recipeMasteryState',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const isValidRuinsRunSummary = (value: unknown): value is import('../types').RuinsRunSummary => {
  if (!isRecord(value)) return false;
  if (typeof value.runId !== 'string') return false;
  if (typeof value.ruinId !== 'string') return false;
  if (typeof value.startedAt !== 'number' || typeof value.endedAt !== 'number') return false;
  if (typeof value.durationSec !== 'number') return false;
  if (typeof value.roomsCleared !== 'number' || typeof value.roomCount !== 'number') return false;
  if (typeof value.victory !== 'boolean') return false;
  if (typeof value.goldGained !== 'number') return false;
  if (typeof value.rareDropCount !== 'number') return false;
  if (!Array.isArray(value.drops)) return false;
  if ('bossChestRare' in value && value.bossChestRare != null) {
    const pity = (value as any).bossChestRare;
    if (!isRecord(pity)) return false;
    if (typeof pity.hit !== 'boolean') return false;
    if (typeof pity.guaranteed !== 'boolean') return false;
    if (typeof pity.failuresBefore !== 'number') return false;
    if (typeof pity.pityCap !== 'number') return false;
  }
  return value.drops.every((drop) => {
    if (!isRecord(drop)) return false;
    if (typeof drop.itemId !== 'string') return false;
    if (typeof drop.qty !== 'number') return false;
    if ('rarity' in drop && drop.rarity != null && typeof drop.rarity !== 'string') return false;
    if ('reason' in drop && drop.reason != null && typeof drop.reason !== 'string') return false;
    return true;
  });
};

const warnInvalidSlice = (slice: string) => {
  console.warn(`[SaveLoad] ${slice} invalid in save, using defaults`);
};

const cloneManualPavilionState = (
  source: ReturnType<typeof useManualPavilionStore.getState>['stockByPavilionId'],
): ReturnType<typeof useManualPavilionStore.getState>['stockByPavilionId'] => {
  const copy: ReturnType<typeof useManualPavilionStore.getState>['stockByPavilionId'] = {};
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
};

export function buildDefaultSaveState(): SaveData {
  const now = Date.now();
  const gameState = useGameStore.getState();
  const inventoryState = useInventoryStore.getState();
  const combatState = useCombatStore.getState();
  const zoneState = useZoneStore.getState();
  const prestigeState = usePrestigeStore.getState();
  const cityState = useCityStore.getState();
  const activityState = useActivityStore.getState();
  const outskirtsState = useOutskirtsStore.getState();
  const trialState = useTrialStore.getState();
  const ruinsState = useRuinsStore.getState();
  const shopState = useShopStore.getState();
  const techCollectionState = useTechCollectionStore.getState();
  const techniqueState = useTechniqueStore.getState();
  const professionState = useProfessionStore.getState();
  const equipmentState = useEquipmentStore.getState();
  const buffState = useBuffStore.getState();
  const bountyState = useBountyStore.getState();
  const expeditionState = useExpeditionStore.getState();
  const heartLawState = useHeartLawStore.getState();
  const manualPavilionState = useManualPavilionStore.getState();
  const manualSatchelState = useManualSatchelStore.getState();
  const craftSessionState = useCraftSessionStore.getState();
  const medicinePouchState = useMedicinePouchStore.getState();
  const recipeMasteryState = useRecipeMasteryStore.getState();

  return {
    version: SAVE_VERSION,
    timestamp: now,
    meta: {
      lastActiveAtMs: now,
    },
    gameState: {
      realm: gameState.realm,
      qi: gameState.qi,
      spiritRoot: prestigeState.spiritRoot ?? null,
      selectedPath: gameState.selectedPath,
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
      spiritRoot: prestigeState.spiritRoot ?? null,
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
    trialState: {
      activeTrialSessionId: trialState.activeTrialSessionId ?? null,
      progressByTrialId: Object.fromEntries(
        Object.entries(trialState.progressByTrialId ?? {}).map(([trialId, progress]) => [
          trialId,
          normalizeTrialProgress(progress),
        ]),
      ),
    },
    ruinsState: {
      progressByRuinId: Object.fromEntries(
        Object.entries(ruinsState.progressByRuinId ?? {}).map(([ruinId, progress]) => [
          ruinId,
          { ...progress, bossChestRareFailures: progress.bossChestRareFailures ?? 0 },
        ]),
      ),
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
      purchasedToday: { ...shopState.purchasedToday },
    },
    techCollectionState: {
      unlockedTechs: { ...techCollectionState.unlockedTechs },
      fragments: { ...techCollectionState.fragments },
      rngSeed: techCollectionState.rngSeed,
    },
    techniqueState: {
      loadouts: techniqueState.loadouts.map((loadout) => ({
        ...loadout,
        slots: {
          active: [...loadout.slots.active],
          passive: [...loadout.slots.passive],
          ultimate: loadout.slots.ultimate ?? null,
        },
      })),
      selectedLoadoutId: techniqueState.selectedLoadoutId,
    },
    professionState: {
      alchemyQueue: professionState.alchemyQueue.map((job) => ({ ...job })),
      talismanQueue: professionState.talismanQueue.map((job) => ({ ...job })),
      forgeQueue: professionState.forgeQueue.map((job) => ({ ...job })),
      lastTickAt: professionState.lastTickAt,
    },
    equipmentState: {
      equippedWeaponId: equipmentState.equippedWeaponId ?? null,
      equippedAccessoryId: equipmentState.equippedAccessoryId ?? null,
      refineLevelBySlot: { ...equipmentState.refineLevelBySlot },
      temperBonusesBySlot: { ...equipmentState.temperBonusesBySlot },
      forgeToolTiers: { ...equipmentState.forgeToolTiers },
    },
    buffState: {
      activeTalismans: buffState.activeTalismans.map((entry) => ({ ...entry })),
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
    manualSatchelState: manualSatchelState.toSaveState(),
  };
}

function isValidCityState(value: unknown): value is SaveData['cityState'] {
  if (!isRecord(value)) return false;
  if (
    value.currentCityId !== null &&
    value.currentCityId !== undefined &&
    typeof value.currentCityId !== 'string'
  ) {
    return false;
  }
  if (!isStringArray(value.unlockedCityIds)) return false;
  if (!isRecord(value.selectedModuleByCity)) return false;
  if (!isRecord(value.cityFlagsById)) return false;
  return true;
}

function isValidActivityState(value: unknown): value is SaveData['activityState'] {
  if (!isRecord(value)) return false;
  const active = value.active;
  const validateActive = (entry: unknown) => {
    if (entry === null || entry === undefined) return true;
    if (!isRecord(entry)) return false;
    if (typeof entry.type !== 'string') return false;
    if (typeof entry.startedAt !== 'number') return false;
    if (entry.payload !== undefined && !isRecord(entry.payload)) return false;
    return true;
  };

  if (active !== null && active !== undefined && !validateActive(active)) return false;

  if (
    value.lastChangedAt !== undefined &&
    value.lastChangedAt !== null &&
    typeof value.lastChangedAt !== 'number'
  ) {
    return false;
  }

  if (value.history !== undefined && value.history !== null) {
    if (!Array.isArray(value.history)) return false;
    for (const entry of value.history) {
      if (!isRecord(entry)) return false;
      if (!validateActive(entry.previous)) return false;
      if (!validateActive(entry.next)) return false;
      if (typeof entry.changedAt !== 'number') return false;
      if (entry.reason !== undefined && entry.reason !== null && typeof entry.reason !== 'string') return false;
    }
  }
  return true;
}

function isValidOutskirtsState(value: unknown): value is SaveData['outskirtsState'] {
  if (!isRecord(value)) return false;
  if (!isRecord(value.progressByOutskirtsId)) return false;
  for (const progress of Object.values(value.progressByOutskirtsId)) {
    if (!isRecord(progress)) return false;
    if (typeof progress.killsSinceBoss !== 'number') return false;
    if (typeof progress.totalKills !== 'number') return false;
    if (typeof progress.bossDefeated !== 'boolean') return false;
  }
  if (value.autoContinue !== undefined && typeof value.autoContinue !== 'boolean') return false;
  if (value.stopAtBoss !== undefined && typeof value.stopAtBoss !== 'boolean') return false;
  return true;
}

function isValidTrialState(value: unknown): value is SaveData['trialState'] {
  if (!isRecord(value)) return false;
  if (!isRecord(value.progressByTrialId)) return false;
  if (
    'activeTrialSessionId' in value &&
    value.activeTrialSessionId !== null &&
    value.activeTrialSessionId !== undefined &&
    typeof value.activeTrialSessionId !== 'string'
  ) {
    return false;
  }
  for (const progress of Object.values(value.progressByTrialId)) {
    if (!isRecord(progress)) return false;
    if (typeof progress.attempts !== 'number') return false;
    if (typeof progress.cleared !== 'boolean') return false;
    if ('sessionAttempts' in progress && typeof progress.sessionAttempts !== 'number') return false;
    if ('eligibleFailures' in progress && typeof progress.eligibleFailures !== 'number') return false;
    if ('resolution' in progress && !['none', 'cleared', 'bypassed'].includes(String(progress.resolution))) return false;
    if ('bypassedAt' in progress && progress.bypassedAt !== null && typeof progress.bypassedAt !== 'number') return false;
    if ('attemptStartAt' in progress && progress.attemptStartAt !== null && typeof progress.attemptStartAt !== 'number')
      return false;
    if ('lastAttemptSummary' in progress && progress.lastAttemptSummary != null) {
      const summary = progress.lastAttemptSummary;
      if (!isRecord(summary)) return false;
      if (typeof summary.trialId !== 'string') return false;
      if (typeof summary.startedAt !== 'number' || typeof summary.endedAt !== 'number') return false;
      if (typeof summary.durationSec !== 'number') return false;
      if (typeof summary.bossHpPct !== 'number') return false;
      if (typeof summary.maxHit !== 'number') return false;
      if (typeof summary.maxHitLabel !== 'string') return false;
      if (!Array.isArray(summary.suggestions)) return false;
    }
  }
  return true;
}

function isValidRuinsState(value: unknown): value is SaveData['ruinsState'] {
  if (!isRecord(value)) return false;
  if (!isRecord(value.progressByRuinId)) return false;
  for (const progress of Object.values(value.progressByRuinId)) {
    if (!isRecord(progress)) return false;
    if (typeof progress.totalRuns !== 'number') return false;
    if (typeof progress.totalRoomsCleared !== 'number') return false;
    if (typeof progress.bossKills !== 'number') return false;
    if ('bossChestRareFailures' in progress && progress.bossChestRareFailures !== undefined) {
      if (typeof progress.bossChestRareFailures !== 'number') return false;
    }
  }
  if ('autoRepeatDefault' in value && typeof value.autoRepeatDefault !== 'boolean') return false;
  if ('autoRestart' in value && value.autoRestart !== undefined && typeof value.autoRestart !== 'boolean') return false;
  if (value.runHistory !== undefined) {
    if (!Array.isArray(value.runHistory)) return false;
    if (!value.runHistory.every((entry) => isValidRuinsRunSummary(entry))) return false;
  }
  if ('lastRunSummary' in value && value.lastRunSummary != null && !isValidRuinsRunSummary(value.lastRunSummary))
    return false;
  return true;
}

function isValidTechCollectionState(value: unknown): value is SaveData['techCollectionState'] {
  if (!isRecord(value)) return false;
  if (!isRecord(value.unlockedTechs)) return false;
  if (!isRecord(value.fragments)) return false;
  if ('rngSeed' in value && typeof value.rngSeed !== 'number') return false;
  return true;
}

function isValidProfessionState(value: unknown): value is SaveData['professionState'] {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.alchemyQueue)) return false;
  if (!Array.isArray(value.talismanQueue)) return false;
  if (!Array.isArray(value.forgeQueue)) return false;
  if (typeof value.lastTickAt !== 'number') return false;
  return true;
}

function isValidShopState(value: unknown): value is SaveData['shopState'] {
  if (!isRecord(value)) return false;
  if (typeof value.dayKey !== 'string') return false;
  if (!isRecord(value.purchasedToday)) return false;
  return true;
}

function isValidBountyState(value: unknown): value is SaveData['bountyState'] {
  if (!isRecord(value)) return false;
  if (!isRecord(value.activeByCityId)) return false;
  if (!isRecord(value.lastRefreshAtByCityId)) return false;
  if ('trackedByCityId' in value && value.trackedByCityId !== undefined) {
    if (!isRecord(value.trackedByCityId)) return false;
    const values = Object.values(value.trackedByCityId as Record<string, unknown>);
    if (!values.every((entry) => entry === null || typeof entry === 'string')) return false;
  }
  return true;
}

function isValidExpeditionState(value: unknown): value is SaveData['expeditionState'] {
  if (!isRecord(value)) return false;
  if (typeof value.slots !== 'number') return false;
  if (!Array.isArray(value.active)) return false;
  if ('rareProgressByKey' in value && value.rareProgressByKey !== undefined) {
    if (!isRecord(value.rareProgressByKey)) return false;
    const entries = Object.values(value.rareProgressByKey as Record<string, unknown>);
    if (!entries.every((entry) => typeof entry === 'number' && Number.isFinite(entry))) return false;
  }
  return true;
}

const validCraftStations: CraftStation[] = ['alchemy', 'forge', 'talisman'];
const validCraftModes: CraftMode[] = ['idle', 'assisted', 'handsOn'];
const isCraftStationValue = (value: unknown): value is CraftStation =>
  typeof value === 'string' && validCraftStations.includes(value as CraftStation);
const isCraftModeValue = (value: unknown): value is CraftMode =>
  typeof value === 'string' && validCraftModes.includes(value as CraftMode);
const isCraftSessionMode = (value: unknown): value is CraftSession['mode'] => value === 'assisted' || value === 'handsOn';

const sanitizePromptStatus = (value: unknown): CraftPromptState['status'] | null => {
  if (value === 'PENDING' || value === 'AVAILABLE' || value === 'COMPLETED' || value === 'MISSED') return value;
  return null;
};

const sanitizePromptState = (raw: unknown): CraftPromptState | null => {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || typeof (raw as any).type !== 'string') return null;
  if (typeof (raw as any).dueAtMs !== 'number' || typeof (raw as any).expiresAtMs !== 'number') return null;
  const status = sanitizePromptStatus((raw as any).status);
  if (!status) return null;
  const completedAtMs =
    (raw as any).completedAtMs === null || typeof (raw as any).completedAtMs === 'number'
      ? ((raw as any).completedAtMs as number | null)
      : null;
  const bonus = isRecord((raw as any).bonus) ? ((raw as any).bonus as CraftPromptState['bonus']) : undefined;
  const ui = isRecord((raw as any).ui) ? ((raw as any).ui as CraftPromptState['ui']) : undefined;
  return {
    id: raw.id,
    type: (raw as any).type as CraftPromptState['type'],
    dueAtMs: (raw as any).dueAtMs as number,
    expiresAtMs: (raw as any).expiresAtMs as number,
    status,
    completedAtMs,
    bonus,
    ui,
  };
};

function isValidCraftSessionState(value: unknown): value is SaveData['craftSessionState'] {
  if (!isRecord(value)) return false;
  if ('modeByStation' in value && value.modeByStation !== undefined && value.modeByStation !== null) {
    if (!isRecord(value.modeByStation)) return false;
    for (const mode of Object.values(value.modeByStation)) {
      if (mode !== undefined && !isCraftModeValue(mode)) return false;
    }
  }

  if (value.activeSession !== undefined && value.activeSession !== null) {
    if (!isRecord(value.activeSession)) return false;
    const session = value.activeSession as Record<string, unknown>;
    if (typeof session.sessionId !== 'string') return false;
    if (!isCraftStationValue(session.station)) return false;
    if (!isCraftSessionMode(session.mode)) return false;
    if (typeof session.sourceId !== 'string') return false;
    if (typeof session.qty !== 'number' || typeof session.createdAt !== 'number' || typeof session.seed !== 'number') return false;
    if (typeof session.startedAt !== 'number' || typeof session.endsAt !== 'number') return false;
    if (!isRecord(session.cursor) || typeof (session.cursor as any).stepIndex !== 'number') return false;
    if (!isRecord(session.script)) return false;
    const script = session.script as CraftScript;
    if (!Array.isArray(script.steps)) return false;
    if (!script.steps.every((step) => isRecord(step) && typeof step.id === 'string' && typeof (step as any).type === 'string'))
      return false;

    if ('prompts' in session && session.prompts !== undefined && session.prompts !== null) {
      if (!Array.isArray(session.prompts)) return false;
      if (
        !session.prompts.every(
          (prompt) =>
            isRecord(prompt) &&
            typeof prompt.id === 'string' &&
            typeof (prompt as any).type === 'string' &&
            typeof (prompt as any).dueAtMs === 'number' &&
            typeof (prompt as any).expiresAtMs === 'number' &&
            typeof (prompt as any).status === 'string',
        )
      ) {
        return false;
      }
    }

    if ('payment' in session && session.payment !== undefined && session.payment !== null) {
      const payment = session.payment as Record<string, unknown>;
      if ('currencies' in payment && payment.currencies !== undefined && payment.currencies !== null && !isRecord(payment.currencies))
        return false;
      if ('items' in payment && payment.items !== undefined && payment.items !== null) {
        if (!Array.isArray(payment.items)) return false;
        if (
          !payment.items.every(
            (entry) => isRecord(entry) && typeof entry.itemId === 'string' && typeof (entry as any).qty === 'number',
          )
        ) {
          return false;
        }
      }
    }
  }

  return true;
}

function isValidRecipeMasteryState(value: unknown): value is SaveData['recipeMasteryState'] {
  if (!isRecord(value)) return false;
  if ('alchemy' in value && value.alchemy !== undefined && value.alchemy !== null && !isRecord(value.alchemy)) return false;
  return true;
}

function isValidHeartLawState(value: unknown): value is SaveData['heartLawState'] {
  if (!isRecord(value)) return false;
  if (
    value.selectedHeartLawId !== null &&
    value.selectedHeartLawId !== undefined &&
    typeof value.selectedHeartLawId !== 'string'
  ) {
    return false;
  }
  if (typeof value.chapter !== 'number') return false;
  if (typeof value.comprehension !== 'number') return false;
  if (!isStringArray(value.unlockedHeartLawIds)) return false;
  if (
    'breathMode' in value &&
    value.breathMode !== undefined &&
    !['balanced', 'safe', 'fast'].includes(value.breathMode as string)
  ) {
    return false;
  }
  if ('studyEnabled' in value && value.studyEnabled !== undefined && typeof value.studyEnabled !== 'boolean') {
    return false;
  }
  if (
    'studyTechniqueId' in value &&
    value.studyTechniqueId !== null &&
    value.studyTechniqueId !== undefined &&
    typeof value.studyTechniqueId !== 'string'
  ) {
    return false;
  }
  if (
    'lastInsightAt' in value &&
    value.lastInsightAt !== null &&
    value.lastInsightAt !== undefined &&
    typeof value.lastInsightAt !== 'number'
  ) {
    return false;
  }
  if (
    'nextInsightAt' in value &&
    value.nextInsightAt !== null &&
    value.nextInsightAt !== undefined &&
    typeof value.nextInsightAt !== 'number'
  ) {
    return false;
  }
  if (
    'insight' in value &&
    value.insight !== null &&
    value.insight !== undefined &&
    typeof value.insight !== 'object'
  ) {
    return false;
  }
  if ('stability' in value && value.stability !== undefined && typeof value.stability !== 'number') {
    return false;
  }
  if ('stabilityCap' in value && value.stabilityCap !== undefined && typeof value.stabilityCap !== 'number') {
    return false;
  }
  return true;
}

function isValidMedicinePouchSlot(value: unknown): value is import('../types').MedicinePouchSlotState {
  if (!isRecord(value)) return false;
  if (typeof value.slotKey !== 'string') return false;
  if ('equippedItemId' in value && value.equippedItemId !== null && typeof value.equippedItemId !== 'string') return false;
  if ('enabled' in value && value.enabled !== undefined && typeof value.enabled !== 'boolean') return false;
  if (
    'trigger' in value &&
    value.trigger !== undefined &&
    !['manual', 'hpBelowPct', 'qiBelowPct', 'intentBelowPct', 'fightStart', 'bossStart'].includes(
      value.trigger as string,
    )
  ) {
    return false;
  }
  if ('thresholdPct' in value && value.thresholdPct !== undefined && typeof value.thresholdPct !== 'number') return false;
  if ('cooldownSec' in value && value.cooldownSec !== undefined && typeof value.cooldownSec !== 'number') return false;
  if ('bossOnly' in value && value.bossOnly !== undefined && typeof value.bossOnly !== 'boolean') return false;
  if ('lastUsedAt' in value && value.lastUsedAt !== undefined && value.lastUsedAt !== null && typeof value.lastUsedAt !== 'number') {
    return false;
  }
  return true;
}

function isValidMedicinePouchState(value: unknown): value is SaveData['medicinePouchState'] {
  if (!isRecord(value)) return false;
  if (!isRecord(value.slots)) return false;
  return (['healing', 'utility', 'specialty'] as const).every((slotKey) => isValidMedicinePouchSlot(value.slots[slotKey]));
}

function isValidManualPavilionState(value: unknown): value is SaveData['manualPavilionState'] {
  if (!isRecord(value)) return false;
  if (!isRecord(value.stockByPavilionId)) return false;
  for (const stock of Object.values(value.stockByPavilionId)) {
    if (!isRecord(stock)) return false;
    if (typeof stock.pavilionId !== 'string') return false;
    if (typeof stock.cityId !== 'string') return false;
    if (typeof stock.cityIndex !== 'number') return false;
    if (typeof stock.generatedAt !== 'number') return false;
    if (typeof stock.nextRefreshAt !== 'number') return false;
    if (typeof stock.rngSeed !== 'number') return false;
    if (!Array.isArray(stock.slots)) return false;
    if (!isRecord(stock.pity)) return false;
    if (typeof (stock.pity as any).featuredEpic !== 'number') return false;
    if (typeof (stock.pity as any).featuredLegendary !== 'number') return false;
    for (const slot of stock.slots) {
      if (!isRecord(slot)) return false;
      if (typeof slot.slotIndex !== 'number') return false;
      if (typeof slot.shelf !== 'string') return false;
      if (typeof slot.techniqueId !== 'string') return false;
      if (typeof slot.grade !== 'string') return false;
      if (typeof slot.rarity !== 'string') return false;
      if (slot.price !== undefined && slot.price !== null && typeof slot.price !== 'object') return false;
    }
    if (stock.history !== undefined && stock.history !== null && !Array.isArray(stock.history)) return false;
  }
  return true;
}

function isValidManualSatchelState(value: unknown): value is SaveData['manualSatchelState'] {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.manuals)) return false;
  for (const entry of value.manuals) {
    if (!isRecord(entry)) return false;
    if (typeof entry.id !== 'string') return false;
    if (typeof entry.techId !== 'string') return false;
    if (typeof entry.grade !== 'string') return false;
    if (typeof entry.rarity !== 'string') return false;
    if (typeof entry.acquiredAt !== 'number') return false;
  }
  if (value.activeStudy !== null && value.activeStudy !== undefined) {
    const study = value.activeStudy as any;
    if (!isRecord(study)) return false;
    if (typeof study.studyId !== 'string') return false;
    if (!isRecord(study.manual)) return false;
    if (typeof (study.manual as any).techId !== 'string') return false;
    if (typeof (study.manual as any).grade !== 'string') return false;
    if (typeof (study.manual as any).rarity !== 'string') return false;
    if (typeof (study.manual as any).acquiredAt !== 'number') return false;
  }
  return true;
}

function isValidPrestigeState(value: unknown): value is SaveData['prestigeState'] {
  if (!isRecord(value)) return false;
  if (typeof value.totalAP !== 'number') return false;
  if (typeof value.lifetimeAP !== 'number') return false;
  if (typeof value.currentRunAP !== 'number') return false;
  if (typeof value.prestigeCount !== 'number') return false;
  if (!Array.isArray(value.prestigeRuns)) return false;
  if (!isRecord(value.purchasesById)) return false;
  if (typeof value.highestRealmReached !== 'number') return false;
  if (typeof value.runStartTime !== 'number') return false;
  if (typeof value.rerollCount !== 'number') return false;
  return true;
}

function mergeSlice<T>(
  raw: unknown,
  defaults: T,
  isValid: (value: unknown) => value is T,
  slice: string,
): T {
  if (!isValid(raw)) {
    if (raw !== undefined) {
      warnInvalidSlice(slice);
    }
    return defaults;
  }
  const record = raw as Record<string, unknown>;
  return { ...defaults, ...record } as T;
}

function mergeTechniqueState(
  raw: unknown,
  defaults: SaveData['techniqueState'],
): SaveData['techniqueState'] {
  if (raw === undefined || raw === null) {
    return defaults;
  }
  if (!isRecord(raw)) {
    warnInvalidSlice('techniqueState');
    return defaults;
  }
  const loadouts = Array.isArray(raw.loadouts) ? raw.loadouts : defaults.loadouts;
  const selectedLoadoutId =
    typeof raw.selectedLoadoutId === 'string' ? raw.selectedLoadoutId : defaults.selectedLoadoutId;
  return { ...defaults, ...raw, loadouts, selectedLoadoutId };
}

const validMedicineTriggers = ['manual', 'hpBelowPct', 'qiBelowPct', 'intentBelowPct', 'fightStart', 'bossStart'] as const;

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function sanitizeMedicinePouchSlot(
  slotKey: import('../types').MedicinePouchSlotKey,
  raw: unknown,
  fallback: import('../types').MedicinePouchSlotState,
): import('../types').MedicinePouchSlotState {
  if (!isRecord(raw)) return fallback;
  const equippedItemId = typeof raw.equippedItemId === 'string' ? raw.equippedItemId : null;
  const enabled = raw.enabled !== undefined ? Boolean(raw.enabled) : fallback.enabled;
  const trigger =
    typeof raw.trigger === 'string' && (validMedicineTriggers as readonly string[]).includes(raw.trigger)
      ? (raw.trigger as (typeof validMedicineTriggers)[number])
      : fallback.trigger;
  const thresholdPct = clampNumber(
    typeof raw.thresholdPct === 'number' && Number.isFinite(raw.thresholdPct) ? raw.thresholdPct : fallback.thresholdPct,
    0,
    100,
  );
  const cooldownSec = clampNumber(
    typeof raw.cooldownSec === 'number' && Number.isFinite(raw.cooldownSec) ? raw.cooldownSec : fallback.cooldownSec,
    0,
    3600,
  );
  const bossOnly = raw.bossOnly !== undefined ? Boolean(raw.bossOnly) : fallback.bossOnly;
  const lastUsedAt = typeof raw.lastUsedAt === 'number' && Number.isFinite(raw.lastUsedAt) ? raw.lastUsedAt : null;

  return {
    slotKey,
    equippedItemId,
    enabled,
    trigger,
    thresholdPct,
    cooldownSec,
    bossOnly,
    lastUsedAt,
  };
}

function mergeMedicinePouchState(
  raw: unknown,
  defaults: SaveData['medicinePouchState'],
): SaveData['medicinePouchState'] {
  if (!isValidMedicinePouchState(raw)) {
    if (raw !== undefined) {
      warnInvalidSlice('medicinePouchState');
    }
    return defaults;
  }

  const nextSlots: SaveData['medicinePouchState']['slots'] = { ...defaults.slots } as any;
  (['healing', 'utility', 'specialty'] as const).forEach((slotKey) => {
    nextSlots[slotKey] = sanitizeMedicinePouchSlot(slotKey, raw.slots?.[slotKey], defaults.slots[slotKey]);
  });

  return { slots: nextSlots };
}

const cloneCraftScript = (script: CraftScript): CraftScript => ({
  ...script,
  steps: Array.isArray(script.steps) ? script.steps.map((step) => ({ ...step })) : [],
});

function sanitizeCraftPayment(raw: unknown): CraftSessionPayment {
  const payment: CraftSessionPayment = {};
  if (!isRecord(raw)) return payment;
  if (isRecord((raw as any).currencies)) {
    payment.currencies = {};
    (Object.keys((raw as any).currencies) as Array<keyof CraftSessionPayment['currencies']>).forEach((key) => {
      const value = (raw as any).currencies?.[key];
      if (typeof value === 'string') {
        payment.currencies![key] = value;
      }
    });
  }
  if (Array.isArray((raw as any).items)) {
    payment.items = (raw as any).items
      .filter((entry) => isRecord(entry) && typeof (entry as any).itemId === 'string' && typeof (entry as any).qty === 'number')
      .map((entry) => ({ itemId: (entry as any).itemId as string, qty: Math.max(0, Math.floor((entry as any).qty as number)) }))
      .filter((entry) => entry.qty > 0);
  }
  return payment;
}

function sanitizeCraftSession(raw: unknown, fallback: CraftSession | null): CraftSession | null {
  if (!isRecord(raw)) return fallback;
  const session = raw as Record<string, unknown>;
  if (typeof session.sessionId !== 'string') return fallback;
  if (!isCraftStationValue(session.station)) return fallback;
  if (!isCraftSessionMode(session.mode)) return fallback;
  if (typeof session.sourceId !== 'string') return fallback;
  const qty =
    typeof session.qty === 'number' && Number.isFinite(session.qty) ? Math.min(Math.max(1, Math.floor(session.qty)), 999) : null;
  if (qty === null) return fallback;
  if (typeof session.createdAt !== 'number' || typeof session.seed !== 'number') return fallback;
  const startedAt = typeof session.startedAt === 'number' ? session.startedAt : session.createdAt;
  const endsAt = typeof session.endsAt === 'number' ? session.endsAt : startedAt;
  if (!isRecord(session.script)) return fallback;
  const script = session.script as CraftScript;
  if (!Array.isArray(script.steps)) return fallback;
  if (!script.steps.every((step) => isRecord(step) && typeof step.id === 'string' && typeof (step as any).type === 'string')) {
    return fallback;
  }
  const cursor =
    isRecord(session.cursor) && typeof (session.cursor as any).stepIndex === 'number'
      ? {
          stepIndex: (session.cursor as any).stepIndex as number,
          stepStartedAt:
            (session.cursor as any).stepStartedAt === undefined || typeof (session.cursor as any).stepStartedAt === 'number'
              ? ((session.cursor as any).stepStartedAt as number | undefined)
              : undefined,
          stepEndsAt:
            (session.cursor as any).stepEndsAt === undefined || typeof (session.cursor as any).stepEndsAt === 'number'
              ? ((session.cursor as any).stepEndsAt as number | undefined)
              : undefined,
          heatSetting:
            (session.cursor as any).heatSetting === undefined || typeof (session.cursor as any).heatSetting === 'number'
              ? ((session.cursor as any).heatSetting as number | undefined)
              : undefined,
          impurities:
            (session.cursor as any).impurities === undefined || typeof (session.cursor as any).impurities === 'number'
              ? ((session.cursor as any).impurities as number | undefined)
              : undefined,
          scoreParts:
            (session.cursor as any).scoreParts && typeof (session.cursor as any).scoreParts === 'object'
              ? { ...(session.cursor as any).scoreParts }
              : undefined,
          orderMistakes:
            (session.cursor as any).orderMistakes === undefined || typeof (session.cursor as any).orderMistakes === 'number'
              ? ((session.cursor as any).orderMistakes as number | undefined)
              : undefined,
          backgroundResolveAt:
            (session.cursor as any).backgroundResolveAt === undefined || (session.cursor as any).backgroundResolveAt === null
              ? ((session.cursor as any).backgroundResolveAt as number | null | undefined)
              : typeof (session.cursor as any).backgroundResolveAt === 'number'
                ? ((session.cursor as any).backgroundResolveAt as number)
                : null,
          backgroundReason:
            (session.cursor as any).backgroundReason === undefined || (session.cursor as any).backgroundReason === null
              ? ((session.cursor as any).backgroundReason as CraftSession['cursor']['backgroundReason'])
              : (session.cursor as any).backgroundReason === 'closed' ||
                  (session.cursor as any).backgroundReason === 'navigated' ||
                  (session.cursor as any).backgroundReason === 'crashed'
                ? ((session.cursor as any).backgroundReason as CraftSession['cursor']['backgroundReason'])
                : null,
        }
      : { stepIndex: 0 };
  const payment = sanitizeCraftPayment(session.payment);
  const prompts = Array.isArray((session as any).prompts)
    ? ((session as any).prompts as unknown[])
        .map((prompt) => sanitizePromptState(prompt))
        .filter((prompt): prompt is CraftPromptState => Boolean(prompt))
    : [];

  return {
    sessionId: session.sessionId,
    station: session.station as CraftStation,
    mode: session.mode as CraftSession['mode'],
    sourceId: session.sourceId,
    qty,
    createdAt: session.createdAt as number,
    seed: session.seed as number,
    startedAt,
    endsAt,
    script: cloneCraftScript(script),
    cursor,
    payment,
    prompts,
  };
}

function mergeCraftSessionState(raw: unknown, defaults: CraftSessionSaveState): CraftSessionSaveState {
  if (!isValidCraftSessionState(raw)) {
    if (raw !== undefined) {
      warnInvalidSlice('craftSessionState');
    }
    return defaults;
  }

  const record = raw as CraftSessionSaveState;
  const nextModes: CraftSessionSaveState['modeByStation'] = { ...defaults.modeByStation };
  if (record.modeByStation && isRecord(record.modeByStation)) {
    Object.entries(record.modeByStation).forEach(([station, mode]) => {
      if (isCraftStationValue(station) && isCraftModeValue(mode)) {
        nextModes[station] = mode;
      }
    });
  }

  const activeSession = sanitizeCraftSession(record.activeSession, defaults.activeSession ?? null);
  return { modeByStation: nextModes, activeSession };
}

function mergeRecipeMasteryState(
  raw: unknown,
  defaults: NonNullable<SaveData['recipeMasteryState']>,
): SaveData['recipeMasteryState'] {
  if (!isValidRecipeMasteryState(raw)) {
    if (raw !== undefined) {
      warnInvalidSlice('recipeMasteryState');
    }
    return defaults;
  }

  const record = raw as SaveData['recipeMasteryState'];
  const nextAlchemy: Record<string, number> = { ...defaults.alchemy };
  if (record.alchemy && isRecord(record.alchemy)) {
    Object.entries(record.alchemy).forEach(([recipeId, value]) => {
      if (typeof value !== 'number') return;
      const clamped = Math.min(100, Math.max(0, Math.floor(value)));
      nextAlchemy[recipeId] = clamped;
    });
  }

  return { alchemy: nextAlchemy };
}

export function mergeWithDefaults(partialSave: unknown): SaveData {
  const defaults = buildDefaultSaveState();
  const record = isRecord(partialSave) ? partialSave : {};
  const defaultsMeta = defaults.meta ?? { lastActiveAtMs: Date.now() };
  const baseEquipment =
    defaults.equipmentState ??
    ({
      equippedWeaponId: null,
      equippedAccessoryId: null,
      refineLevelBySlot: { weapon: 0, accessory: 0 },
      temperBonusesBySlot: { weapon: [], accessory: [] },
      forgeToolTiers: { anvil: 1, hammer: 1, bellows: 1, quenchTub: 1 },
    } as SaveData['equipmentState']);
  const baseBuffState = defaults.buffState ?? ({ activeTalismans: [] } as SaveData['buffState']);
  const baseMedicinePouchState = defaults.medicinePouchState ?? createDefaultMedicinePouchState();
  const baseCraftSessionState = defaults.craftSessionState ?? createDefaultCraftSessionState();
  const baseRecipeMasteryState = defaults.recipeMasteryState ?? createDefaultRecipeMasteryState();

  const merged: SaveData & Record<string, unknown> = {
    ...defaults,
    ...record,
    meta: isRecord(record.meta)
      ? {
          ...defaultsMeta,
          ...record.meta,
          lastActiveAtMs:
            typeof record.meta.lastActiveAtMs === 'number'
              ? record.meta.lastActiveAtMs
              : defaultsMeta.lastActiveAtMs,
        }
      : defaultsMeta,
    gameState: isRecord(record.gameState) ? { ...defaults.gameState, ...record.gameState } : defaults.gameState,
    prestigeState: mergeSlice(record.prestigeState, defaults.prestigeState, isValidPrestigeState, 'prestigeState'),
    inventoryState: isRecord(record.inventoryState)
      ? { ...defaults.inventoryState, ...record.inventoryState }
      : defaults.inventoryState,
    craftSessionState: mergeCraftSessionState(record.craftSessionState, baseCraftSessionState),
    medicinePouchState: mergeMedicinePouchState(record.medicinePouchState, baseMedicinePouchState),
    recipeMasteryState: mergeRecipeMasteryState(record.recipeMasteryState, baseRecipeMasteryState),
    combatSettings: isRecord(record.combatSettings)
      ? { ...defaults.combatSettings, ...record.combatSettings }
      : defaults.combatSettings,
    zoneState: isRecord(record.zoneState) ? { ...defaults.zoneState, ...record.zoneState } : defaults.zoneState,
    cityState: mergeSlice(record.cityState, defaults.cityState, isValidCityState, 'cityState'),
    activityState: mergeSlice(record.activityState, defaults.activityState, isValidActivityState, 'activityState'),
    outskirtsState: mergeSlice(record.outskirtsState, defaults.outskirtsState, isValidOutskirtsState, 'outskirtsState'),
    trialState: mergeSlice(record.trialState, defaults.trialState, isValidTrialState, 'trialState'),
    ruinsState: mergeSlice(record.ruinsState, defaults.ruinsState, isValidRuinsState, 'ruinsState'),
    shopState: mergeSlice(record.shopState, defaults.shopState, isValidShopState, 'shopState'),
    techCollectionState: mergeSlice(
      record.techCollectionState,
      defaults.techCollectionState,
      isValidTechCollectionState,
      'techCollectionState',
    ),
    techniqueState: mergeTechniqueState(record.techniqueState, defaults.techniqueState),
    professionState: mergeSlice(
      record.professionState,
      defaults.professionState,
      isValidProfessionState,
      'professionState',
    ),
    equipmentState: (() => {
      if (!isRecord(record.equipmentState)) return baseEquipment;
      const incoming = record.equipmentState as SaveData['equipmentState'];
      const temperBonuses = isRecord(incoming.temperBonusesBySlot)
        ? {
            weapon: Array.isArray((incoming.temperBonusesBySlot as any).weapon)
              ? ((incoming.temperBonusesBySlot as any).weapon as any[])
              : [],
            accessory: Array.isArray((incoming.temperBonusesBySlot as any).accessory)
              ? ((incoming.temperBonusesBySlot as any).accessory as any[])
              : [],
          }
        : baseEquipment.temperBonusesBySlot ?? { weapon: [], accessory: [] };
      const toolTiers = isRecord(incoming.forgeToolTiers)
        ? {
            anvil: Math.max(1, Math.min(10, Number((incoming.forgeToolTiers as any).anvil) || 1)),
            hammer: Math.max(1, Math.min(10, Number((incoming.forgeToolTiers as any).hammer) || 1)),
            bellows: Math.max(1, Math.min(10, Number((incoming.forgeToolTiers as any).bellows) || 1)),
            quenchTub: Math.max(1, Math.min(10, Number((incoming.forgeToolTiers as any).quenchTub) || 1)),
          }
        : baseEquipment.forgeToolTiers ?? { anvil: 1, hammer: 1, bellows: 1, quenchTub: 1 };

      return {
        ...baseEquipment,
        ...incoming,
        refineLevelBySlot: {
          weapon: Math.max(0, Math.floor(incoming.refineLevelBySlot?.weapon ?? baseEquipment.refineLevelBySlot.weapon)),
          accessory: Math.max(0, Math.floor(incoming.refineLevelBySlot?.accessory ?? baseEquipment.refineLevelBySlot.accessory)),
        },
        temperBonusesBySlot: temperBonuses,
        forgeToolTiers: toolTiers,
      } as SaveData['equipmentState'];
    })(),
    buffState: isRecord(record.buffState)
      ? ({ ...baseBuffState, ...record.buffState } as SaveData['buffState'])
      : baseBuffState,
    bountyState: mergeSlice(record.bountyState, defaults.bountyState, isValidBountyState, 'bountyState'),
    expeditionState: mergeSlice(
      record.expeditionState,
      defaults.expeditionState,
      isValidExpeditionState,
      'expeditionState',
    ),
    heartLawState: mergeSlice(
      record.heartLawState,
      defaults.heartLawState,
      isValidHeartLawState,
      'heartLawState',
    ),
    manualPavilionState: mergeSlice(
      record.manualPavilionState,
      defaults.manualPavilionState,
      isValidManualPavilionState,
      'manualPavilionState',
    ),
    manualSatchelState: mergeSlice(
      record.manualSatchelState,
      defaults.manualSatchelState,
      isValidManualSatchelState,
      'manualSatchelState',
    ),
  };

  if (typeof merged.timestamp !== 'number' || Number.isNaN(merged.timestamp)) {
    merged.timestamp = defaults.timestamp;
  }

  merged.version = SAVE_VERSION;

  return merged;
}


const preserveUnknownFields = (raw: unknown, normalized: unknown): unknown => {
  if (Array.isArray(raw) || Array.isArray(normalized)) {
    return normalized;
  }
  if (!isRecord(raw) || !isRecord(normalized)) {
    return normalized;
  }

  const result: Record<string, unknown> = { ...normalized };
  for (const [key, rawValue] of Object.entries(raw)) {
    if (!(key in result)) {
      result[key] = rawValue;
      continue;
    }
    result[key] = preserveUnknownFields(rawValue, result[key]);
  }

  return result;
};

export function migrateSave(raw: unknown): SaveData {
  const { migrated } = migrateIncomingSaveForHydration(raw, (candidate) => {
    const normalized = mergeWithDefaults(candidate);
    return preserveUnknownFields(candidate, normalized) as Record<string, unknown>;
  });

  return migrated as SaveData;
}

export function assertRequiredSaveKeys(saveData: SaveData): void {
  if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return;
  const record = saveData as unknown as Record<string, unknown>;
  const missing = REQUIRED_SAVE_KEYS.filter((key) => !(key in record));
  if (missing.length > 0) {
    console.warn('[SaveLoad] Missing required save keys after hydration:', missing.join(', '));
  }
}
