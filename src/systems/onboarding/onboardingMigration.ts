import type { SaveData } from '../../types/index.js';
import { createDefaultOnboardingState } from '../../stores/onboardingStore.js';
import type { OnboardingMilestoneId, SaveOnboardingState } from './onboardingTypes.js';
import {
  DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE,
  ONBOARDING_MILESTONE_IDS,
} from './onboardingTypes.js';
import { resolveOnboardingUnlocksThroughMilestone } from './onboardingProgression.js';

type SaveLike = Partial<SaveData> | Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const getRealmIndex = (save: SaveLike): number => {
  const realm = getRecord(getRecord(save).gameState).realm;
  return isRecord(realm) && typeof realm.index === 'number' ? realm.index : 0;
};

const getSubstage = (save: SaveLike): number => {
  const realm = getRecord(getRecord(save).gameState).realm;
  return isRecord(realm) && typeof realm.substage === 'number' ? realm.substage : 1;
};

function hasLifeIdentity(save: SaveLike): boolean {
  const gameState = getRecord(getRecord(save).gameState);
  const heartLawState = getRecord(getRecord(save).heartLawState);
  const selectedPath = typeof gameState.selectedPath === 'string' ? gameState.selectedPath : null;
  const legacyLifePath = typeof gameState.lifePath === 'string' ? gameState.lifePath : null;
  return Boolean((selectedPath || legacyLifePath) && typeof heartLawState.selectedHeartLawId === 'string');
}

const numberFromCurrency = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

function hasInventoryEvidence(save: SaveLike): boolean {
  const inventory = getRecord(getRecord(save).inventoryState);
  const items = getRecord(inventory.items);
  if (Object.values(items).some((qty) => typeof qty === 'number' && qty > 0)) return true;
  const currencies = getRecord(inventory.currencies);
  return ['gold', 'spiritStones', 'merit'].some((key) => numberFromCurrency(currencies[key]) > 0);
}

function hasOutskirtsEvidence(save: SaveLike): boolean {
  const progress = getRecord(getRecord(getRecord(save).outskirtsState).progressByOutskirtsId);
  return Object.values(progress).some((entry) => {
    const record = getRecord(entry);
    return numberFromCurrency(record.totalKills) > 0 || numberFromCurrency(record.killsSinceBoss) > 0 || record.bossDefeated === true;
  });
}

function hasManualOwnedEvidence(save: SaveLike): boolean {
  const satchel = getRecord(getRecord(save).manualSatchelState);
  if (Array.isArray(satchel.manuals) && satchel.manuals.length > 0) return true;
  if (isRecord(satchel.activeStudy)) return true;
  if (isRecord(satchel.lastLearned)) return true;
  const pavilionStock = getRecord(getRecord(getRecord(save).manualPavilionState).stockByPavilionId);
  return Object.values(pavilionStock).some((stock) => Array.isArray(getRecord(stock).history) && (getRecord(stock).history as unknown[]).length > 0);
}

function hasManualStudyEvidence(save: SaveLike): boolean {
  const satchel = getRecord(getRecord(save).manualSatchelState);
  return isRecord(satchel.activeStudy) || isRecord(satchel.lastLearned);
}

function hasUnlockedTechniqueEvidence(save: SaveLike): boolean {
  const collection = getRecord(getRecord(getRecord(save).techCollectionState).unlockedTechs);
  return Object.values(collection).some((entry) => getRecord(entry).unlocked === true);
}

function hasEquippedTechniqueEvidence(save: SaveLike): boolean {
  const techniqueState = getRecord(getRecord(save).techniqueState);
  if (!Array.isArray(techniqueState.loadouts)) return false;
  return techniqueState.loadouts.some((loadout) => {
    const slots = getRecord(getRecord(loadout).slots);
    return (
      (Array.isArray(slots.active) && slots.active.length > 0) ||
      (Array.isArray(slots.passive) && slots.passive.length > 0) ||
      typeof slots.ultimate === 'string'
    );
  });
}

function hasPouchEvidence(save: SaveLike): boolean {
  const slots = getRecord(getRecord(getRecord(save).medicinePouchState).slots);
  return Object.values(slots).some((slot) => typeof getRecord(slot).equippedItemId === 'string');
}

function hasExpeditionEvidence(save: SaveLike): boolean {
  const expedition = getRecord(getRecord(save).expeditionState);
  if (Array.isArray(expedition.active) && expedition.active.length > 0) return true;
  if (numberFromCurrency(expedition.slots) > 0) return true;
  return Object.keys(getRecord(expedition.rareProgressByKey)).length > 0;
}

function hasForgeEvidence(save: SaveLike): boolean {
  const equipment = getRecord(getRecord(save).equipmentState);
  const refine = getRecord(equipment.refineLevelBySlot);
  if (numberFromCurrency(refine.weapon) > 0 || numberFromCurrency(refine.accessory) > 0) return true;
  const temper = getRecord(equipment.temperBonusesBySlot);
  if ((Array.isArray(temper.weapon) && temper.weapon.length > 0) || (Array.isArray(temper.accessory) && temper.accessory.length > 0)) return true;
  const tools = getRecord(equipment.forgeToolTiers);
  if (Object.values(tools).some((tier) => numberFromCurrency(tier) > 1)) return true;
  const profession = getRecord(getRecord(save).professionState);
  return Array.isArray(profession.forgeQueue) && profession.forgeQueue.length > 0;
}

function hasRuinsOrBountyEvidence(save: SaveLike): boolean {
  const ruins = getRecord(getRecord(getRecord(save).ruinsState).progressByRuinId);
  if (
    Object.values(ruins).some((entry) => {
      const record = getRecord(entry);
      return numberFromCurrency(record.totalRuns) > 0 || numberFromCurrency(record.totalRoomsCleared) > 0 || numberFromCurrency(record.bossKills) > 0;
    })
  ) {
    return true;
  }
  const ruinsState = getRecord(getRecord(save).ruinsState);
  if (Array.isArray(ruinsState.runHistory) && ruinsState.runHistory.length > 0) return true;
  const bounty = getRecord(getRecord(save).bountyState);
  if (Object.values(getRecord(bounty.activeByCityId)).some((entries) => Array.isArray(entries) && entries.length > 0)) return true;
  if (Object.values(getRecord(bounty.trackedByCityId)).some((value) => typeof value === 'string')) return true;
  const currencies = getRecord(getRecord(getRecord(save).inventoryState).currencies);
  return numberFromCurrency(currencies.merit) > 0;
}

function getGateEvidence(save: SaveLike): { attempted: boolean; resolved: boolean } {
  const progress = getRecord(getRecord(getRecord(save).trialState).progressByTrialId);
  let attempted = false;
  let resolved = false;
  Object.values(progress).forEach((entry) => {
    const record = getRecord(entry);
    if (numberFromCurrency(record.attempts) > 0 || numberFromCurrency(record.sessionAttempts) > 0) attempted = true;
    if (record.cleared === true || record.resolution === 'cleared' || record.resolution === 'bypassed') resolved = true;
  });
  return { attempted: attempted || resolved, resolved };
}

function completedThrough(id: OnboardingMilestoneId | null): OnboardingMilestoneId[] {
  if (!id) return [];
  const index = ONBOARDING_MILESTONE_IDS.indexOf(id);
  return ONBOARDING_MILESTONE_IDS.slice(0, index + 1);
}

function applyUnlocks(state: SaveOnboardingState): SaveOnboardingState {
  const unlocks = resolveOnboardingUnlocksThroughMilestone({
    completedMilestoneIds: state.completedMilestoneIds,
    activeMilestoneId: state.activeMilestoneId,
  });
  return {
    ...state,
    ...unlocks,
    teaserWorldModules: unlocks.teaserWorldModules.filter((moduleKey) => !unlocks.unlockedWorldModules.includes(moduleKey)),
  };
}

export function inferOnboardingStateFromSave(args: {
  save: SaveLike;
  now?: number;
  migratedFromVersion?: string | null;
}): SaveOnboardingState {
  const now = args.now ?? Date.now();
  const state = createDefaultOnboardingState(now);
  state.migratedFromVersion = args.migratedFromVersion ?? null;

  if (!hasLifeIdentity(args.save)) {
    return state;
  }

  const realmIndex = getRealmIndex(args.save);
  const substage = getSubstage(args.save);
  if (realmIndex >= 1) {
    return applyUnlocks({
      ...state,
      activeMilestoneId: 'complete',
      completedMilestoneIds: [...ONBOARDING_MILESTONE_IDS],
      firstLifeOnlyComplete: true,
      queuedTutorialCardIds: [],
    });
  }

  let completed: OnboardingMilestoneId[] = ['M0_life_start'];
  let active: SaveOnboardingState['activeMilestoneId'] = 'M1_cultivation_only';

  const stageActiveBySubstage: Array<[number, OnboardingMilestoneId, OnboardingMilestoneId]> = [
    [2, 'M1_cultivation_only', 'M2_status_unlock'],
    [3, 'M2_status_unlock', 'M3_world_outskirts'],
    [4, 'M3_world_outskirts', 'M4_pavilion_satchel'],
    [5, 'M4_pavilion_satchel', 'M5_techniques_loadout'],
    [6, 'M5_techniques_loadout', 'M6_apothecary_expedition'],
    [7, 'M6_apothecary_expedition', 'M7_forge'],
    [8, 'M7_forge', 'M8_ruins_bounties'],
    [9, 'M8_ruins_bounties', 'M9_gate_trial'],
  ];
  for (const [minSubstage, completeId, nextActive] of stageActiveBySubstage) {
    if (substage >= minSubstage) {
      completed = completedThrough(completeId);
      active = nextActive;
    }
  }

  const outskirts = hasOutskirtsEvidence(args.save) || hasInventoryEvidence(args.save);
  const manualOwned = hasManualOwnedEvidence(args.save);
  const manualStudied = hasManualStudyEvidence(args.save);
  const techniqueUnlocked = hasUnlockedTechniqueEvidence(args.save);
  const techniqueEquipped = hasEquippedTechniqueEvidence(args.save);
  const expedition = hasExpeditionEvidence(args.save);
  const pouch = hasPouchEvidence(args.save);
  const forge = hasForgeEvidence(args.save);
  const support = hasRuinsOrBountyEvidence(args.save);
  const gate = getGateEvidence(args.save);

  if (outskirts) {
    completed = completedThrough('M3_world_outskirts');
    active = 'M4_pavilion_satchel';
  }
  if (manualOwned) {
    completed = completedThrough(manualStudied || techniqueUnlocked || techniqueEquipped ? 'M4_pavilion_satchel' : 'M3_world_outskirts');
    active = manualStudied || techniqueUnlocked || techniqueEquipped ? 'M5_techniques_loadout' : 'M4_pavilion_satchel';
  }
  if (techniqueUnlocked) {
    completed = completedThrough('M4_pavilion_satchel');
    active = 'M5_techniques_loadout';
  }
  if (techniqueEquipped) {
    completed = completedThrough('M5_techniques_loadout');
    active = 'M6_apothecary_expedition';
  }
  if (expedition) {
    completed = completedThrough('M5_techniques_loadout');
    active = 'M6_apothecary_expedition';
  }
  if (pouch) {
    completed = completedThrough('M6_apothecary_expedition');
    active = 'M7_forge';
  }
  if (forge) {
    completed = completedThrough('M7_forge');
    active = 'M8_ruins_bounties';
  }
  if (support) {
    completed = completedThrough('M8_ruins_bounties');
    active = 'M9_gate_trial';
  }
  if (gate.attempted) {
    completed = completedThrough('M8_ruins_bounties');
    active = 'M9_gate_trial';
  }
  if (gate.resolved) {
    completed = completedThrough('M9_gate_trial');
    active = 'M10_foundation_graduation';
  }

  const next = applyUnlocks({
    ...state,
    activeMilestoneId: active,
    completedMilestoneIds: completed,
    firstLifeOnlyComplete: false,
    queuedTutorialCardIds: [],
  });

  if (active) {
    const activeUnlocks = DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE[active];
    return {
      ...next,
      unlockedTabs: Array.from(new Set([...next.unlockedTabs, ...activeUnlocks.tabs])),
      unlockedWorldModules: Array.from(new Set([...next.unlockedWorldModules, ...activeUnlocks.worldModules])),
      teaserWorldModules: Array.from(new Set([...next.teaserWorldModules, ...activeUnlocks.teaserWorldModules])),
    };
  }

  return next;
}
