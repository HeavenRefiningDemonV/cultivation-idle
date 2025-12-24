import type { SaveData } from '../types';
import { useGameStore } from '../stores/gameStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCombatStore } from '../stores/combatStore';
import { useZoneStore } from '../stores/zoneStore';
import { usePrestigeStore } from '../stores/prestigeStore';
import { useCityStore } from '../stores/cityStore';
import { useActivityStore } from '../stores/activityStore';
import { useOutskirtsStore } from '../stores/outskirtsStore';
import { useTrialStore } from '../stores/trialStore';
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

export const SAVE_VERSION = '1.0.2';

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
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

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
      spiritRoot: prestigeState.spiritRoot ?? null,
    },
    inventoryState: {
      currencies: { ...inventoryState.currencies },
      items: { ...inventoryState.items },
    },
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
    },
    trialState: {
      progressByTrialId: { ...trialState.progressByTrialId },
    },
    ruinsState: {
      progressByRuinId: { ...ruinsState.progressByRuinId },
      autoRepeatDefault: ruinsState.autoRepeatDefault,
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
    },
    buffState: {
      activeTalismans: buffState.activeTalismans.map((entry) => ({ ...entry })),
    },
    bountyState: {
      activeByCityId: { ...bountyState.activeByCityId },
      lastRefreshAtByCityId: { ...bountyState.lastRefreshAtByCityId },
    },
    expeditionState: {
      slots: expeditionState.slots,
      active: expeditionState.active.map((run) => ({ ...run })),
    },
    heartLawState: {
      selectedHeartLawId: heartLawState.selectedHeartLawId,
      chapter: heartLawState.chapter,
      comprehension: heartLawState.comprehension,
      unlockedHeartLawIds: [...heartLawState.unlockedHeartLawIds],
    },
    manualPavilionState: {
      stockByPavilionId: cloneManualPavilionState(manualPavilionState.stockByPavilionId),
    },
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
  return true;
}

function isValidTrialState(value: unknown): value is SaveData['trialState'] {
  if (!isRecord(value)) return false;
  if (!isRecord(value.progressByTrialId)) return false;
  for (const progress of Object.values(value.progressByTrialId)) {
    if (!isRecord(progress)) return false;
    if (typeof progress.attempts !== 'number') return false;
    if (typeof progress.cleared !== 'boolean') return false;
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
  }
  if ('autoRepeatDefault' in value && typeof value.autoRepeatDefault !== 'boolean') return false;
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
  return true;
}

function isValidExpeditionState(value: unknown): value is SaveData['expeditionState'] {
  if (!isRecord(value)) return false;
  if (typeof value.slots !== 'number') return false;
  if (!Array.isArray(value.active)) return false;
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
  return true;
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

export function mergeWithDefaults(partialSave: unknown): SaveData {
  const defaults = buildDefaultSaveState();
  const record = isRecord(partialSave) ? partialSave : {};
  const defaultsMeta = defaults.meta ?? { lastActiveAtMs: Date.now() };
  const baseEquipment =
    defaults.equipmentState ?? ({ equippedWeaponId: null, equippedAccessoryId: null, refineLevelBySlot: { weapon: 0, accessory: 0 } } as SaveData['equipmentState']);
  const baseBuffState = defaults.buffState ?? ({ activeTalismans: [] } as SaveData['buffState']);

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
    equipmentState: isRecord(record.equipmentState)
      ? ({ ...baseEquipment, ...record.equipmentState } as SaveData['equipmentState'])
      : baseEquipment,
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
  };

  if (typeof merged.timestamp !== 'number' || Number.isNaN(merged.timestamp)) {
    merged.timestamp = defaults.timestamp;
  }

  merged.version = SAVE_VERSION;

  return merged;
}

function parseVersion(value: string): number[] {
  return value
    .split('.')
    .map((segment) => Number(segment))
    .map((num) => (Number.isFinite(num) ? num : 0));
}

function isVersionLessThan(current: string, target: string): boolean {
  const currentParts = parseVersion(current);
  const targetParts = parseVersion(target);
  const maxLength = Math.max(currentParts.length, targetParts.length);
  for (let i = 0; i < maxLength; i += 1) {
    const currentValue = currentParts[i] ?? 0;
    const targetValue = targetParts[i] ?? 0;
    if (currentValue < targetValue) return true;
    if (currentValue > targetValue) return false;
  }
  return false;
}

export function migrateSave(raw: unknown): SaveData {
  const record = isRecord(raw) ? raw : {};
  const existingVersion = typeof record.version === 'string' ? record.version : '0.0.0';

  let working: Record<string, unknown> = { ...record };

  if (isVersionLessThan(existingVersion, SAVE_VERSION)) {
    console.info(`[SaveLoad] Migrating save from ${existingVersion} to ${SAVE_VERSION}`);
  }

  const merged = mergeWithDefaults(working);
  merged.version = SAVE_VERSION;

  return merged;
}

export function assertRequiredSaveKeys(saveData: SaveData): void {
  if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return;
  const record = saveData as unknown as Record<string, unknown>;
  const missing = REQUIRED_SAVE_KEYS.filter((key) => !(key in record));
  if (missing.length > 0) {
    console.warn('[SaveLoad] Missing required save keys after hydration:', missing.join(', '));
  }
}
