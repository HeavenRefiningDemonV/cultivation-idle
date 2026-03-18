import { normalizeCitySaveState } from './cityStateNormalization.js';

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

const toStringRecord = (value: unknown): Record<string, string> =>
  isRecord(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {};

const dedupeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((entry): entry is string => typeof entry === 'string')));
};

const normalizeHeartLawState = (value: unknown): Record<string, unknown> => {
  const record = isRecord(value) ? value : {};
  return {
    ...record,
    selectedHeartLawId: null,
    chapter: 1,
    comprehension: 0,
    unlockedHeartLawIds: dedupeStringArray(record.unlockedHeartLawIds),
    studyEnabled: false,
    studyTechniqueId: null,
    lastInsightAt: null,
    nextInsightAt: null,
    insight: null,
    stability: 0,
  };
};

const normalizeTechniqueState = (value: unknown): Record<string, unknown> => {
  const record = isRecord(value) ? value : {};
  const loadouts = Array.isArray(record.loadouts)
    ? record.loadouts.map((loadout) => {
        if (!isRecord(loadout)) return loadout;
        const slots = isRecord(loadout.slots) ? loadout.slots : {};
        return {
          ...loadout,
          slots: {
            ...slots,
            active: [],
            passive: [],
            ultimate: null,
          },
        };
      })
    : [];

  return {
    ...record,
    loadouts,
    selectedLoadoutId: typeof record.selectedLoadoutId === 'string' ? record.selectedLoadoutId : 'loadout_1',
  };
};

const normalizeMedicinePouchState = (value: unknown): Record<string, unknown> => {
  const record = isRecord(value) ? value : {};
  const slots = isRecord(record.slots) ? record.slots : {};
  return {
    ...record,
    slots: Object.fromEntries(
      Object.entries(slots).map(([slotKey, slotValue]) => {
        const slot = isRecord(slotValue) ? slotValue : {};
        return [slotKey, { ...slot, equippedItemId: null, lastUsedAt: null }];
      }),
    ),
  };
};

const normalizeCraftSessionState = (value: unknown): Record<string, unknown> => {
  const record = isRecord(value) ? value : {};
  return {
    ...record,
    modeByStation: toStringRecord(record.modeByStation),
    activeSession: null,
  };
};

const normalizeExpeditionState = (value: unknown): Record<string, unknown> => {
  const record = isRecord(value) ? value : {};
  return {
    ...record,
    slots: typeof record.slots === 'number' ? record.slots : 0,
    active: [],
    rareProgressByKey: {},
  };
};

const normalizeEquipmentState = (value: unknown): Record<string, unknown> => ({
  ...(isRecord(value) ? value : {}),
  equippedWeaponId: null,
  equippedAccessoryId: null,
  refineLevelBySlot: { weapon: 0, accessory: 0 },
  temperBonusesBySlot: { weapon: [], accessory: [] },
  forgeToolTiers: { anvil: 1, hammer: 1, bellows: 1, quenchTub: 1 },
});

const normalizeManualSatchelState = (value: unknown): Record<string, unknown> => {
  const record = isRecord(value) ? value : {};
  return {
    ...record,
    ...(Array.isArray(record.manuals) ? { manuals: [] } : {}),
    ...(isRecord(record.entries) ? { entries: {} } : {}),
    activeStudy: null,
    lastLearned: null,
  };
};

const normalizeActivityState = (value: unknown): Record<string, unknown> => ({
  ...(isRecord(value) ? value : {}),
  active: null,
  lastChangedAt: null,
  history: [],
});

const normalizeOutskirtsState = (value: unknown): Record<string, unknown> => ({
  ...(isRecord(value) ? value : {}),
  progressByOutskirtsId: {},
  autoContinue: true,
  stopAtBoss: false,
});

const normalizeProfessionState = (value: unknown): Record<string, unknown> => ({
  ...(isRecord(value) ? value : {}),
  alchemyQueue: [],
  talismanQueue: [],
  forgeQueue: [],
  lastTickAt: 0,
});

export interface PartialResetResidueCleanupResult {
  save: Record<string, unknown>;
  detected: {
    city: boolean;
    trial: boolean;
    ruins: boolean;
    equipment: boolean;
    inventory: boolean;
    activity: boolean;
    outskirts: boolean;
    bounty: boolean;
    expedition: boolean;
    profession: boolean;
    manualPavilion: boolean;
    manualSatchel: boolean;
    techCollection: boolean;
    heartLaw: boolean;
    technique: boolean;
    medicinePouch: boolean;
    craftSession: boolean;
    shop: boolean;
  };
  didMutate: boolean;
}

export const applyPartialResetResidueCleanup = (save: Record<string, unknown>): PartialResetResidueCleanupResult => {
  const next = JSON.parse(JSON.stringify(save)) as Record<string, unknown>;
  const gameState = isRecord(next.gameState) ? next.gameState : {};
  const realm = isRecord(gameState.realm) ? gameState.realm : {};
  const currentRealmIndex = typeof realm.index === 'number' ? realm.index : 0;

  if (currentRealmIndex !== 0) {
    return {
      save: next,
      detected: {
        city: false,
        trial: false,
        ruins: false,
        equipment: false,
        inventory: false,
        activity: false,
        outskirts: false,
        bounty: false,
        expedition: false,
        profession: false,
        manualPavilion: false,
        manualSatchel: false,
        techCollection: false,
        heartLaw: false,
        technique: false,
        medicinePouch: false,
        craftSession: false,
        shop: false,
      },
      didMutate: false,
    };
  }

  const cityState = isRecord(next.cityState) ? next.cityState : {};
  const trialState = isRecord(next.trialState) ? next.trialState : {};
  const ruinsState = isRecord(next.ruinsState) ? next.ruinsState : {};
  const equipmentState = isRecord(next.equipmentState) ? next.equipmentState : {};
  const inventoryState = isRecord(next.inventoryState) ? next.inventoryState : {};
  const activityState = isRecord(next.activityState) ? next.activityState : {};
  const outskirtsState = isRecord(next.outskirtsState) ? next.outskirtsState : {};
  const bountyState = isRecord(next.bountyState) ? next.bountyState : {};
  const expeditionState = isRecord(next.expeditionState) ? next.expeditionState : {};
  const professionState = isRecord(next.professionState) ? next.professionState : {};
  const manualPavilionState = isRecord(next.manualPavilionState) ? next.manualPavilionState : {};
  const manualSatchelState = isRecord(next.manualSatchelState) ? next.manualSatchelState : {};
  const techCollectionState = isRecord(next.techCollectionState) ? next.techCollectionState : {};
  const heartLawState = isRecord(next.heartLawState) ? next.heartLawState : {};
  const techniqueState = isRecord(next.techniqueState) ? next.techniqueState : {};
  const medicinePouchState = isRecord(next.medicinePouchState) ? next.medicinePouchState : {};
  const craftSessionState = isRecord(next.craftSessionState) ? next.craftSessionState : {};
  const shopState = isRecord(next.shopState) ? next.shopState : {};

  const normalizedCityState = normalizeCitySaveState({ content: null, realmIndex: 0, cityState: {} });
  const detected = {
    city:
      typeof cityState.currentCityId === 'string' && cityState.currentCityId !== normalizedCityState.currentCityId
        || JSON.stringify(cityState.unlockedCityIds ?? []) !== JSON.stringify(normalizedCityState.unlockedCityIds),
    trial: isRecord(trialState.progressByTrialId) && Object.keys(trialState.progressByTrialId).length > 0,
    ruins:
      (isRecord(ruinsState.progressByRuinId) && Object.keys(ruinsState.progressByRuinId).length > 0)
      || Array.isArray(ruinsState.runHistory) && ruinsState.runHistory.length > 0
      || ruinsState.activeRun != null,
    equipment:
      typeof equipmentState.equippedWeaponId === 'string'
      || typeof equipmentState.equippedAccessoryId === 'string'
      || JSON.stringify(equipmentState.refineLevelBySlot ?? {}) !== JSON.stringify({ weapon: 0, accessory: 0 }),
    inventory:
      (isRecord(inventoryState.items) && Object.keys(inventoryState.items).length > 0)
      || JSON.stringify(inventoryState.currencies ?? {}) !== JSON.stringify({ gold: '0', spiritStones: '0', merit: '0' }),
    activity: activityState.active != null || Array.isArray(activityState.history) && activityState.history.length > 0,
    outskirts: isRecord(outskirtsState.progressByOutskirtsId) && Object.keys(outskirtsState.progressByOutskirtsId).length > 0,
    bounty:
      (isRecord(bountyState.activeByCityId) && Object.keys(bountyState.activeByCityId).length > 0)
      || (isRecord(bountyState.lastRefreshAtByCityId) && Object.keys(bountyState.lastRefreshAtByCityId).length > 0),
    expedition:
      Array.isArray(expeditionState.active) && expeditionState.active.length > 0
      || (isRecord(expeditionState.rareProgressByKey) && Object.keys(expeditionState.rareProgressByKey).length > 0),
    profession:
      Array.isArray(professionState.alchemyQueue) && professionState.alchemyQueue.length > 0
      || Array.isArray(professionState.talismanQueue) && professionState.talismanQueue.length > 0
      || Array.isArray(professionState.forgeQueue) && professionState.forgeQueue.length > 0,
    manualPavilion: isRecord(manualPavilionState.stockByPavilionId) && Object.keys(manualPavilionState.stockByPavilionId).length > 0,
    manualSatchel:
      Array.isArray(manualSatchelState.manuals) && manualSatchelState.manuals.length > 0
      || isRecord(manualSatchelState.entries) && Object.keys(manualSatchelState.entries).length > 0
      || manualSatchelState.activeStudy != null,
    techCollection:
      (isRecord(techCollectionState.unlockedTechs) && Object.keys(techCollectionState.unlockedTechs).length > 0)
      || (isRecord(techCollectionState.fragments) && Object.keys(techCollectionState.fragments).length > 0),
    heartLaw:
      heartLawState.selectedHeartLawId != null
      || Number(heartLawState.chapter ?? 1) > 1
      || Number(heartLawState.comprehension ?? 0) > 0
      || heartLawState.studyTechniqueId != null,
    technique:
      Array.isArray(techniqueState.loadouts) && techniqueState.loadouts.some((loadout) => {
        if (!isRecord(loadout) || !isRecord(loadout.slots)) return false;
        const active = Array.isArray(loadout.slots.active) ? loadout.slots.active.length > 0 : false;
        const passive = Array.isArray(loadout.slots.passive) ? loadout.slots.passive.length > 0 : false;
        return active || passive || loadout.slots.ultimate != null;
      }),
    medicinePouch: isRecord(medicinePouchState.slots) && Object.values(medicinePouchState.slots).some((slot) => isRecord(slot) && (slot.equippedItemId != null || slot.lastUsedAt != null)),
    craftSession: craftSessionState.activeSession != null,
    shop: isRecord(shopState.purchasedToday) && Object.keys(shopState.purchasedToday).length > 0,
  };

  const didMutate = Object.values(detected).some(Boolean);
  if (!didMutate) {
    return { save: next, detected, didMutate: false };
  }

  next.cityState = normalizedCityState;
  next.trialState = {
    ...trialState,
    activeTrialSessionId: null,
    progressByTrialId: {},
  };
  next.ruinsState = {
    ...ruinsState,
    progressByRuinId: {},
    activeRun: null,
    autoRepeatDefault: false,
    autoRestart: false,
    runHistory: [],
    lastRunSummary: null,
  };
  next.equipmentState = normalizeEquipmentState(equipmentState);
  next.inventoryState = {
    ...inventoryState,
    currencies: { gold: '0', spiritStones: '0', merit: '0' },
    items: {},
  };
  next.activityState = normalizeActivityState(activityState);
  next.outskirtsState = normalizeOutskirtsState(outskirtsState);
  next.bountyState = {
    ...bountyState,
    activeByCityId: {},
    lastRefreshAtByCityId: {},
    trackedByCityId: {},
  };
  next.expeditionState = normalizeExpeditionState(expeditionState);
  next.professionState = normalizeProfessionState(professionState);
  next.manualPavilionState = {
    ...manualPavilionState,
    stockByPavilionId: {},
    dailyRefreshUsed: 0,
    lastRefreshDay: '',
  };
  next.manualSatchelState = normalizeManualSatchelState(manualSatchelState);
  next.techCollectionState = {
    ...techCollectionState,
    unlockedTechs: {},
    fragments: {},
  };
  next.heartLawState = normalizeHeartLawState(heartLawState);
  next.techniqueState = normalizeTechniqueState(techniqueState);
  next.medicinePouchState = normalizeMedicinePouchState(medicinePouchState);
  next.craftSessionState = normalizeCraftSessionState(craftSessionState);
  next.shopState = {
    ...shopState,
    dayKey: '',
    purchasedToday: {},
  };
  return { save: next, detected, didMutate: true };
};
