import type { RewardBundle, GrantRewardsResult, RewardCurrencyBundle } from '../rewards/types.js';
import type { ActiveActivity } from '../../types/activity.js';
import type { GameTab, WorldBuildingKey } from '../../stores/uiStore.js';
import type { CraftMode, CraftStation, CraftPromptState } from '../../systems/crafting/craftingTypes.js';
import type { MedicinePouchSlotKey } from '../../types/index.js';

export type RewardsGrantedEvent = {
  type: 'rewards/granted';
  payload: {
    reason: string;
    bundle: RewardBundle;
    result: GrantRewardsResult;
    summary: string;
    timestamp: number;
  };
};

export type CombatResolvedEvent = {
  type: 'combat/resolved';
  payload: {
    enemyId?: string;
    outcome?: 'victory' | 'defeat';
    source?: string;
    cityId?: string;
    sourceId?: string;
    ruinId?: string;
    runId?: string;
    roomIndex?: number;
    roomCount?: number;
    isBoss?: boolean;
    trialId?: string;
    durationSec?: number;
    playerHpPctRemaining?: number;
    enemyHpPctRemaining?: number;
    medicineUses?: number;
    healingEvents?: number;
    timestamp?: number;
  };
};

export type ActivityChangedEvent = {
  type: 'activity/changed';
  payload: {
    previous: ActiveActivity | null;
    next: ActiveActivity | null;
    reason?: string;
    changedAt: number;
  };
};

export type ManualPurchasedEvent = {
  type: 'manuals/purchased';
  payload: {
    manualId: string;
    techniqueId?: string;
    cost?: Record<string, string>;
    quantity?: number;
  };
};

export type ManualStudiedEvent = {
  type: 'manuals/studied';
  payload: {
    manualId: string;
    progress?: number;
  };
};

export type TechniqueEquippedEvent = {
  type: 'techniques/equipped';
  payload: {
    techniqueId: string;
    slot?: number;
    slotType?: 'active' | 'passive' | 'ultimate';
  };
};

export type HeartLawSelectedEvent = {
  type: 'heartlaw/selected';
  payload: {
    heartLawId: string | null;
  };
};

export type PavilionStockRefreshedEvent = {
  type: 'pavilion/stock_refreshed';
  payload: { pavilionId: string; cityId: string; cityIndex: number; at: number };
};

export type PavilionOpenedEvent = {
  type: 'pavilion/opened';
  payload: { buildingKey: WorldBuildingKey; cityId: string | null };
};

export type PavilionClosedEvent = {
  type: 'pavilion/closed';
  payload: { buildingKey: WorldBuildingKey; cityId: string | null };
};

export type PavilionRefreshConfirmedEvent = {
  type: 'pavilion/refresh_confirmed';
  payload: { pavilionId: string; cityId: string; cityIndex: number; at: number };
};

export type PavilionRefreshDeniedEvent = {
  type: 'pavilion/refresh_denied';
  payload: { pavilionId: string; reason: string };
};

export type PavilionBuyAttemptEvent = {
  type: 'pavilion/buy_attempt';
  payload: { pavilionId: string; slotIndex: number; techniqueId: string; mode: 'buy' | 'buyAndStudy' };
};

export type PavilionBuySuccessEvent = {
  type: 'pavilion/buy_success';
  payload: { pavilionId: string; slotIndex: number; techniqueId: string; outcome: string; mode: 'buy' | 'buyAndStudy' };
};

export type PavilionBuyFailedEvent = {
  type: 'pavilion/buy_failed';
  payload: { pavilionId: string; slotIndex?: number; reason: string };
};

export type PavilionPityIncrementEvent = {
  type: 'pavilion/pity_increment';
  payload: { previous: { featuredEpic: number; featuredLegendary: number }; next: { featuredEpic: number; featuredLegendary: number } };
};

export type PavilionPityMajorEvent = {
  type: 'pavilion/pity_major';
  payload: { previous: { featuredEpic: number; featuredLegendary: number }; next: { featuredEpic: number; featuredLegendary: number } };
};

export type PavilionGuaranteeTriggeredEvent = {
  type: 'pavilion/guarantee_trigger';
  payload: { previous: { featuredEpic: number; featuredLegendary: number }; next: { featuredEpic: number; featuredLegendary: number } };
};

export type SatchelOpenedEvent = {
  type: 'satchel/opened';
  payload: {};
};

export type SatchelClosedEvent = {
  type: 'satchel/closed';
  payload: {};
};

export type ApothecaryOpenedEvent = {
  type: 'apothecary/opened';
  payload: { cityId: string | null };
};

export type ApothecaryClosedEvent = {
  type: 'apothecary/closed';
  payload: { cityId: string | null };
};

export type ApothecaryItemSelectedEvent = {
  type: 'apothecary/item_selected';
  payload: { shopId: string; itemId: string; qty: number };
};

export type ApothecaryBuySuccessEvent = {
  type: 'apothecary/buy_success';
  payload: { shopId: string; itemId: string; qty: number };
};

export type ApothecaryBuyFailedEvent = {
  type: 'apothecary/buy_failed';
  payload: { shopId: string; itemId: string; reason: string };
};

export type ApothecaryDailyLimitHitEvent = {
  type: 'apothecary/daily_limit_hit';
  payload: { shopId: string; itemId: string };
};

export type ApothecaryBundleBuyEvent = {
  type: 'apothecary/bundle_buy';
  payload: { bundleId: string; ok: boolean };
};

export type PouchOpenedEvent = {
  type: 'pouch/opened';
  payload: {};
};

export type PouchClosedEvent = {
  type: 'pouch/closed';
  payload: {};
};

export type PouchSlotSelectedEvent = {
  type: 'pouch/slot_selected';
  payload: { slotKey: MedicinePouchSlotKey };
};

export type PouchEquippedEvent = {
  type: 'pouch/equip';
  payload: { slotKey: MedicinePouchSlotKey; itemId: string };
};

export type PouchUnequippedEvent = {
  type: 'pouch/unequip';
  payload: { slotKey: MedicinePouchSlotKey; itemId: string | null };
};

export type PouchAutoTriggerEvent = {
  type: 'pouch/auto_trigger';
  payload: { slotKey: MedicinePouchSlotKey; itemId: string };
};

export type PouchOutOfChargesEvent = {
  type: 'pouch/out_of_charges';
  payload: { slotKey?: MedicinePouchSlotKey; itemId?: string; source: 'auto' | 'manual' };
};

export type PouchLowChargesWarningEvent = {
  type: 'pouch/low_charges_warning';
  payload: { slotKey?: MedicinePouchSlotKey; itemId?: string; remaining: number };
};

export type CraftingOpenedEvent = {
  type: 'crafting/opened';
  payload: { station: CraftStation };
};

export type CraftingClosedEvent = {
  type: 'crafting/closed';
  payload: { station: CraftStation };
};

export type CraftingRecipeSelectedEvent = {
  type: 'crafting/recipe_selected';
  payload: { station: CraftStation; recipeId: string };
};

export type CraftingRecipeLockedEvent = {
  type: 'crafting/recipe_locked';
  payload: { station: CraftStation; recipeId: string };
};

export type CraftingRecipeUnlockedEvent = {
  type: 'crafting/recipe_unlocked';
  payload: { station: CraftStation; recipeId: string };
};

export type CraftingModeSelectedEvent = {
  type: 'crafting/mode_selected';
  payload: { station: CraftStation; mode: CraftMode };
};

export type CraftingQueueAddedEvent = {
  type: 'crafting/queue_added';
  payload: { station: CraftStation; sourceId: string; qty: number };
};

export type CraftingQueueCompletedEvent = {
  type: 'crafting/queue_completed';
  payload: { station: CraftStation; sourceId: string; qty: number };
};

export type CraftingSessionStartedEvent = {
  type: 'crafting/session_started';
  payload: { station: CraftStation; mode: CraftMode; sourceId: string };
};

export type CraftingSessionAbortedEvent = {
  type: 'crafting/session_aborted';
  payload: { station: CraftStation; mode: CraftMode; sourceId: string };
};

export type CraftingSessionClaimedEvent = {
  type: 'crafting/session_claimed';
  payload: { station: CraftStation; mode: CraftMode; sourceId: string };
};

export type CraftingSessionCompletedEvent = {
  type: 'crafting/session_completed';
  payload: { station: CraftStation; mode: CraftMode; sourceId: string };
};

export type CraftingSessionBackgroundedEvent = {
  type: 'crafting/session_backgrounded';
  payload: { station: CraftStation; mode: CraftMode; sourceId: string; reason: string };
};

export type CraftingAssistPromptAvailableEvent = {
  type: 'crafting/assist_prompt_available';
  payload: { station: CraftStation; promptId: string; promptType: CraftPromptState['type'] };
};

export type CraftingAssistPromptCompletedEvent = {
  type: 'crafting/assist_prompt_completed';
  payload: { station: CraftStation; promptId: string; promptType: CraftPromptState['type'] };
};

export type CraftingAssistPromptFailedEvent = {
  type: 'crafting/assist_prompt_failed';
  payload: { station: CraftStation; promptId: string; promptType: CraftPromptState['type'] };
};

export type CraftingAssistPromptTimeoutEvent = {
  type: 'crafting/assist_prompt_timeout';
  payload: { station: CraftStation; promptId: string; promptType: CraftPromptState['type'] };
};

export type AlchemyFlameIgniteEvent = {
  type: 'alchemy/flame_ignite';
  payload: { recipeId: string };
};

export type AlchemyFlameAdjustEvent = {
  type: 'alchemy/flame_adjust';
  payload: { heat: number };
};

export type AlchemyFlameStableEvent = {
  type: 'alchemy/flame_stable';
  payload: { ok: boolean };
};

export type AlchemyIngredientAddedEvent = {
  type: 'alchemy/ingredient_added';
  payload: { itemId: string; ok: boolean };
};

export type AlchemySealEvent = {
  type: 'alchemy/seal_attempt';
  payload: { ok: boolean };
};

export type AlchemyPressureReleaseEvent = {
  type: 'alchemy/pressure_release';
  payload: {};
};

export type AlchemyResultEvent = {
  type: 'alchemy/result';
  payload: { grade: string };
};

export type AlchemyByproductGainEvent = {
  type: 'alchemy/byproduct_gain';
  payload: { qty: number };
};

export type AlchemyMasteryGainEvent = {
  type: 'alchemy/mastery_gain';
  payload: { recipeId: string; gain: number; next: number };
};

export type AlchemyMasteryMilestoneEvent = {
  type: 'alchemy/mastery_milestone';
  payload: { recipeId: string; milestone: number };
};

export type ForgeFurnaceIgniteEvent = {
  type: 'forge/furnace_ignite';
  payload: { blueprintId: string };
};

export type ForgeBellowsPumpEvent = {
  type: 'forge/bellows_pump';
  payload: {};
};

export type ForgeMetalHeatEvent = {
  type: 'forge/metal_heat';
  payload: {};
};

export type ForgeHammerStrikeEvent = {
  type: 'forge/hammer_strike';
  payload: { intensity: 'light' | 'heavy' };
};

export type ForgeHammerCompleteEvent = {
  type: 'forge/hammer_complete';
  payload: {};
};

export type ForgeSparksBurstEvent = {
  type: 'forge/sparks_burst';
  payload: {};
};

export type ForgeQuenchEvent = {
  type: 'forge/quench';
  payload: {};
};

export type ForgeTemperEvent = {
  type: 'forge/temper';
  payload: {};
};

export type ForgeGrindEvent = {
  type: 'forge/grind';
  payload: {};
};

export type ForgeRefineResultEvent = {
  type: 'forge/refine_result';
  payload: { ok: boolean };
};

export type ForgeTemperResultEvent = {
  type: 'forge/temper_result';
  payload: { ok: boolean };
};

export type ForgeDeltaPanelOpenedEvent = {
  type: 'forge/delta_panel_opened';
  payload: {};
};

export type ForgeDeltaPanelClosedEvent = {
  type: 'forge/delta_panel_closed';
  payload: {};
};

export type ForgeRuneEngraveEvent = {
  type: 'forge/rune_engrave';
  payload: {};
};

export type ForgeRuneFuseEvent = {
  type: 'forge/rune_fuse';
  payload: {};
};

export type ForgeRuneCraftResultEvent = {
  type: 'forge/rune_craft_result';
  payload: { ok: boolean };
};

export type ForgeRuneDustGainEvent = {
  type: 'forge/rune_dust_gain';
  payload: { qty: number };
};

export type TalismanCraftResultEvent = {
  type: 'talisman/craft_result';
  payload: { ok: boolean };
};

export type TalismanPaperPickupEvent = {
  type: 'talisman/paper_pickup';
  payload: {};
};

export type TalismanBrushStrokeEvent = {
  type: 'talisman/brush_stroke';
  payload: {};
};

export type TalismanInkDipEvent = {
  type: 'talisman/ink_dip';
  payload: {};
};

export type TalismanSealStampEvent = {
  type: 'talisman/seal_stamp';
  payload: {};
};

export type TalismanActivatedEvent = {
  type: 'talisman/activated';
  payload: { itemId: string };
};

export type TalismanExpiredEvent = {
  type: 'talisman/expired';
  payload: { itemId: string };
};

export type ManualFocusPromptEvent = {
  type: 'manuals/focus_prompt';
  payload: { manualId: string };
};

export type ManualFocusAppliedEvent = {
  type: 'manuals/focus_applied';
  payload: { manualId: string; reward?: string };
};

export type ManualFocusFailedEvent = {
  type: 'manuals/focus_failed';
  payload: { manualId?: string; reason: string };
};

export type TechniqueLearnedModalOpenedEvent = {
  type: 'techniques/learned_modal_opened';
  payload: { techniqueId: string };
};

export type TechniqueLearnedModalClosedEvent = {
  type: 'techniques/learned_modal_closed';
  payload: { techniqueId: string | null };
};

export type UiTabChangedEvent = {
  type: 'ui/tab_changed';
  payload: { previous: GameTab; next: GameTab };
};

export type TechniquesLoadoutChangedEvent = {
  type: 'techniques/loadout_changed';
  payload: { loadoutId: string };
};

export type TechniquesEquipFailedEvent = {
  type: 'techniques/equip_failed';
  payload: { techniqueId: string; slotType: 'active' | 'passive' | 'ultimate'; slotIndex: number; reason: string };
};

export type TechniquesEquipChangedEvent = {
  type: 'techniques/equip_changed';
  payload: {
    techniqueId: string;
    slotType: 'active' | 'passive' | 'ultimate';
    slotIndex: number;
    action: 'equip' | 'swap' | 'unequip';
  };
};

export type TechniquesSlotUnlockedEvent = {
  type: 'techniques/slot_unlocked';
  payload: { slotType: 'active' | 'passive' | 'ultimate'; slotIndex: number };
};

export type TechniquesSlotSelectedEvent = {
  type: 'techniques/slot_selected';
  payload: { slotType: 'active' | 'passive' | 'ultimate'; slotIndex: number };
};

export type TechniquesSlotLockedEvent = {
  type: 'techniques/slot_locked';
  payload: { slotType: 'active' | 'passive' | 'ultimate'; slotIndex: number };
};

export type TechniquesRankUpgradeOpenedEvent = {
  type: 'techniques/rank_upgrade_opened';
  payload: { techniqueId: string };
};

export type TechniquesRankUpgradeAttemptEvent = {
  type: 'techniques/rank_upgrade_attempt';
  payload: { techniqueId: string };
};

export type TechniquesRankUpgradeSuccessEvent = {
  type: 'techniques/rank_upgrade_success';
  payload: { techniqueId: string; nextRank: number };
};

export type TechniquesRankUpgradeFailedEvent = {
  type: 'techniques/rank_upgrade_failed';
  payload: { techniqueId: string; reason: string };
};

export type TechniquesTraitRerollOpenedEvent = {
  type: 'techniques/trait_reroll_opened';
  payload: { techniqueId: string };
};

export type TechniquesTraitRerollAttemptEvent = {
  type: 'techniques/trait_reroll_attempt';
  payload: { techniqueId: string };
};

export type TechniquesTraitRerollResultEvent = {
  type: 'techniques/trait_reroll_result';
  payload: { techniqueId: string; ok: boolean };
};

export type TechniquesRuneSocketedEvent = {
  type: 'techniques/rune_socketed';
  payload: { techniqueId: string; slotIndex: number; runeItemId: string };
};

export type TechniquesRuneUnsocketedEvent = {
  type: 'techniques/rune_unsocketed';
  payload: { techniqueId: string; slotIndex: number; runeItemId: string };
};

export type TechniquesEquipNowClickedEvent = {
  type: 'techniques/equip_now_clicked';
  payload: { techniqueId: string };
};

export type RewardsSpentEvent = {
  type: 'rewards/spent';
  payload: { costs: RewardCurrencyBundle; reason?: string };
};

export type EconomyItemsSpentEvent = {
  type: 'economy/items_spent';
  payload: {
    items: Array<{ itemId: string; qty: number }>;
    reason: string;
    module?: string;
  };
};

export type ProgressionLifeStartedEvent = {
  type: 'progression/life_started';
  payload: {
    timestamp: number;
    runStartTime: number;
    elapsedMsSinceLifeStart: number;
    lifeOrdinal?: number;
    sessionKind?: 'first_life' | 'reclaim';
    trigger?: 'hard_reset' | 'prestige_reset' | 'fresh_start' | 'other';
  };
};

export type ProgressionGateAvailableEvent = {
  type: 'progression/gate_available';
  payload: {
    timestamp: number;
    runStartTime: number;
    elapsedMsSinceLifeStart: number;
    trialId: string;
    fromRealmId: string;
    toRealmId: string;
    gateIndex: number;
    cityId: string | null;
  };
};

export type ProgressionGateResolvedEvent = {
  type: 'progression/gate_resolved';
  payload: {
    timestamp: number;
    runStartTime: number;
    elapsedMsSinceLifeStart: number;
    trialId: string;
    fromRealmId: string;
    toRealmId: string;
    gateIndex: number;
    cityId: string | null;
    resolution: 'cleared' | 'bypassed';
  };
};

export type ProgressionBreakthroughEvent = {
  type: 'progression/breakthrough';
  payload: {
    timestamp: number;
    runStartTime: number;
    elapsedMsSinceLifeStart: number;
    fromRealmIndex: number;
    toRealmIndex: number;
    fromSubstage: number;
    toSubstage: number;
    major: boolean;
    fromRealmId: string;
    toRealmId: string;
  };
};

export type BreakthroughMethod =
  | 'clean_clear'
  | 'strained_clear'
  | 'safety_net_bypass'
  | 'unknown'
  | 'cap_transition';

export type ProgressionBreakthroughCompletedEvent = {
  type: 'progression/breakthrough_completed';
  payload: {
    timestamp: number;
    fromRealmIndex: number;
    fromSubstage: number;
    toRealmIndex: number;
    toSubstage: number;
    fromRealmName?: string;
    toRealmName?: string;
    major: boolean;
    gateItemIdSpent?: string | null;
    gateItemNameSpent?: string | null;
    qiSpent?: string;
    stabilityDelta?: number;
    cityUnlockedIds?: string[];
    cityUnlockedNames?: string[];
    currentCityId?: string | null;
    method?: BreakthroughMethod;
    statSnapshotBefore?: Record<string, string | number>;
    statSnapshotAfter?: Record<string, string | number>;
  };
};

export type ProgressionCityEnteredEvent = {
  type: 'progression/city_entered';
  payload: {
    timestamp: number;
    runStartTime: number;
    elapsedMsSinceLifeStart: number;
    cityId: string;
    cityIndex: number | null;
    majorRealmId: string;
  };
};

export type ProgressionContentCapReachedEvent = {
  type: 'progression/content_cap_reached';
  payload: {
    timestamp: number;
    runStartTime: number;
    elapsedMsSinceLifeStart: number;
    realmId: string;
    cityId: string | null;
  };
};

export type TrialsAttemptStartedEvent = {
  type: 'trials/attempt_started';
  payload: {
    timestamp: number;
    trialId: string;
    gateIndex: number;
    attemptId: string;
    attemptNumberThisLife: number;
    countsTowardFailSafe: boolean;
    lifecycleState: string;
  };
};

export type TrialsAttemptResolvedEvent = {
  type: 'trials/attempt_resolved';
  payload: {
    timestamp: number;
    trialId: string;
    gateIndex: number;
    attemptId: string;
    outcome: 'cleared' | 'defeated' | 'bypassed';
    durationSec: number;
    bossHpPctRemaining?: number;
    countsTowardFailSafe: boolean;
    eligibleFailCountAfterAttempt?: number;
    diagnosisCode?: string;
    topFixDestination?: string;
    topFixReason?: string;
  };
};

export type DaoImpressionAwardedEvent = {
  type: 'dao/impression_awarded';
  payload: {
    timestamp: number;
    awardId: string;
    impressionId: string;
    sourceKind:
      | 'outskirts_first_boss'
      | 'gate_close_defeat'
      | 'gate_clear'
      | 'ruins_completion'
      | 'breakthrough_resonance'
      | 'technique_mastery_milestone';
    sourceEventKey: string;
    comprehensionDelta: number;
    applied: boolean;
    targetHeartLawId: string | null;
    memoryEligible: boolean;
    title: string;
    memoryLine: string;
    routeKind?: 'heart_law' | 'cultivation' | 'gate_trial' | 'techniques' | 'records';
    routeLabel?: string;
  };
};

export type FailureReflectionUpdatedEvent = {
  type: 'failure_reflection/updated';
  payload: {
    timestamp: number;
    reflectionId: string;
    trialId: string;
    gateIndex: number;
    diagnosisCode: string;
    repeatedCount: number;
    resolved: boolean;
    correctiveRouteTarget: string;
    correctiveRouteLabel: string;
  };
};

export type BountiesClaimedEvent = {
  type: 'bounties/claimed';
  payload: {
    timestamp: number;
    cityId: string;
    templateId: string;
    difficulty: string;
    kind: string;
    claimedAt: number;
    createdAt: number;
    rewards: RewardBundle;
  };
};

export type ExpeditionsStartedEvent = {
  type: 'expeditions/started';
  payload: {
    timestamp: number;
    slotIndex: number;
    expeditionTypeId: string;
    durationId: string;
    durationSeconds: number;
    cityId: string;
  };
};

export type ExpeditionsClaimedEvent = {
  type: 'expeditions/claimed';
  payload: {
    timestamp: number;
    slotIndex: number;
    expeditionTypeId: string;
    durationId: string;
    cityId: string;
    rareDropItemId?: string;
    rolled: RewardBundle;
  };
};

export type PrestigePerformedEvent = {
  type: 'prestige/performed';
  payload: {
    timestamp: number;
    apGained: number;
    totalAPAfter: number;
    realmReached: number;
    resolvedGateCount: number;
    timeSpentSec: number;
    advisorLabel?: string;
  };
};

export type TrainingStartedEvent = {
  type: 'training/started';
  payload: {
    timestamp: number;
    path: string;
    regimenId: string;
    intensity: string;
    realmId: string;
    ratingSnapshot: Record<string, number>;
    fatigue: number;
  };
};

export type TrainingGradeChangedEvent = {
  type: 'training/grade_changed';
  payload: {
    timestamp: number;
    statId: string;
    oldGrade: number;
    newGrade: number;
    minutesSinceLastGrade: number;
    realmId: string;
  };
};

export type TrainingCapHitEvent = {
  type: 'training/cap_hit';
  payload: {
    timestamp: number;
    statId: string;
    realmId: string;
    rating: number;
    masteryRank: number;
  };
};

export type TrainingOfflineAppliedEvent = {
  type: 'training/offline_applied';
  payload: {
    timestamp: number;
    appliedMs: number;
    ratingGainedById: Record<string, number>;
    statXpGainedById: Record<string, number>;
    masteryXpGainedByRegimenId: Record<string, number>;
    fatigueGained: number;
    intensityDowngrades: number;
    blockedReason?: string;
  };
};

export type DaoHeartStartedEvent = {
  type: 'dao_heart/started';
  payload: {
    timestamp: number;
    lawId: string;
    activityId: string;
    parityDelta: number;
    turbulence: number;
    clarity: number;
  };
};

export type HeartLawLevelChangedEvent = {
  type: 'dao_heart/level_changed';
  payload: {
    timestamp: number;
    lawId: string;
    oldLevel: number;
    newLevel: number;
    parityDelta: number;
  };
};

export type DaoHeartOfflineAppliedEvent = {
  type: 'dao_heart/offline_applied';
  payload: {
    timestamp: number;
    lawId: string;
    activityId: string;
    appliedMs: number;
    heartLawXpGain: number;
    verseMasteryGain: number;
    clarityGain: number;
    turbulenceGain: number;
    levelsGained: number;
    blockedReason?: string;
  };
};

export type BreakthroughAttemptedEvent = {
  type: 'breakthrough/attempted';
  payload: {
    timestamp: number;
    fromRealm: string;
    risk: number;
    causeRows: Array<{ id: string; value: number }>;
    parityDelta: number;
    fatigue: number;
    result: 'success' | 'failure' | 'blocked';
  };
};

export type GateAttemptedEvent = {
  type: 'gate/attempted';
  payload: {
    timestamp: number;
    trialId: string;
    readinessScore: number;
    categoryScores: Record<string, number>;
    path: string | null;
    lawId: string | null;
    result: 'cleared' | 'defeated' | 'blocked' | 'bypassed';
  };
};

export type PrestigeStartedEvent = {
  type: 'prestige/started';
  payload: {
    timestamp: number;
    realm: number;
    ap: number;
    trainedStats: Record<string, number>;
    heartLawLevel: number;
    retainedMemory: number;
  };
};

export type PrestigeMemoryAppliedEvent = {
  type: 'prestige/memory_applied';
  payload: {
    timestamp: number;
    effectId: string;
    rank: number;
    value: number;
    targetId?: string;
  };
};

export type PrestigeResetBucketAppliedEvent = {
  type: 'prestige/reset_bucket_applied';
  payload: {
    timestamp: number;
    bucketId: string;
    kind: 'reset' | 'carry' | 'rebuilt' | 'hybrid';
    label: string;
  };
};

export type PrestigeUpgradePurchasedEvent = {
  type: 'prestige/upgrade_purchased';
  payload: {
    timestamp: number;
    upgradeId: string;
    nextLevel: number;
    apCost: number;
    remainingAP: number;
  };
};

export type OfflineAppliedEvent = {
  type: 'offline/applied';
  payload: {
    timestamp: number;
    rawOfflineSeconds: number;
    effectiveOfflineSeconds: number;
    effectiveEfficiency: number;
    wasCapped: boolean;
    qiGained: string;
    queuedActionsReady: number;
    expeditionsReady: number;
  };
};

export type GameEvent =
  | RewardsGrantedEvent
  | CombatResolvedEvent
  | ActivityChangedEvent
  | ManualPurchasedEvent
  | ManualStudiedEvent
  | TechniqueEquippedEvent
  | HeartLawSelectedEvent
  | PavilionStockRefreshedEvent
  | PavilionOpenedEvent
  | PavilionClosedEvent
  | PavilionRefreshConfirmedEvent
  | PavilionRefreshDeniedEvent
  | PavilionBuyAttemptEvent
  | PavilionBuySuccessEvent
  | PavilionBuyFailedEvent
  | PavilionPityIncrementEvent
  | PavilionPityMajorEvent
  | PavilionGuaranteeTriggeredEvent
  | SatchelOpenedEvent
  | SatchelClosedEvent
  | ApothecaryOpenedEvent
  | ApothecaryClosedEvent
  | ApothecaryItemSelectedEvent
  | ApothecaryBuySuccessEvent
  | ApothecaryBuyFailedEvent
  | ApothecaryDailyLimitHitEvent
  | ApothecaryBundleBuyEvent
  | PouchOpenedEvent
  | PouchClosedEvent
  | PouchSlotSelectedEvent
  | PouchEquippedEvent
  | PouchUnequippedEvent
  | PouchAutoTriggerEvent
  | PouchOutOfChargesEvent
  | PouchLowChargesWarningEvent
  | CraftingOpenedEvent
  | CraftingClosedEvent
  | CraftingRecipeSelectedEvent
  | CraftingRecipeLockedEvent
  | CraftingRecipeUnlockedEvent
  | CraftingModeSelectedEvent
  | CraftingQueueAddedEvent
  | CraftingQueueCompletedEvent
  | CraftingSessionStartedEvent
  | CraftingSessionAbortedEvent
  | CraftingSessionClaimedEvent
  | CraftingSessionCompletedEvent
  | CraftingSessionBackgroundedEvent
  | CraftingAssistPromptAvailableEvent
  | CraftingAssistPromptCompletedEvent
  | CraftingAssistPromptFailedEvent
  | CraftingAssistPromptTimeoutEvent
  | AlchemyFlameIgniteEvent
  | AlchemyFlameAdjustEvent
  | AlchemyFlameStableEvent
  | AlchemyIngredientAddedEvent
  | AlchemySealEvent
  | AlchemyPressureReleaseEvent
  | AlchemyResultEvent
  | AlchemyByproductGainEvent
  | AlchemyMasteryGainEvent
  | AlchemyMasteryMilestoneEvent
  | ForgeFurnaceIgniteEvent
  | ForgeBellowsPumpEvent
  | ForgeMetalHeatEvent
  | ForgeHammerStrikeEvent
  | ForgeHammerCompleteEvent
  | ForgeSparksBurstEvent
  | ForgeQuenchEvent
  | ForgeTemperEvent
  | ForgeGrindEvent
  | ForgeRefineResultEvent
  | ForgeTemperResultEvent
  | ForgeDeltaPanelOpenedEvent
  | ForgeDeltaPanelClosedEvent
  | ForgeRuneEngraveEvent
  | ForgeRuneFuseEvent
  | ForgeRuneCraftResultEvent
  | ForgeRuneDustGainEvent
  | TalismanCraftResultEvent
  | TalismanPaperPickupEvent
  | TalismanBrushStrokeEvent
  | TalismanInkDipEvent
  | TalismanSealStampEvent
  | TalismanActivatedEvent
  | TalismanExpiredEvent
  | ManualFocusPromptEvent
  | ManualFocusAppliedEvent
  | ManualFocusFailedEvent
  | TechniqueLearnedModalOpenedEvent
  | TechniqueLearnedModalClosedEvent
  | UiTabChangedEvent
  | TechniquesLoadoutChangedEvent
  | TechniquesEquipFailedEvent
  | TechniquesEquipChangedEvent
  | TechniquesSlotUnlockedEvent
  | TechniquesSlotSelectedEvent
  | TechniquesSlotLockedEvent
  | TechniquesRankUpgradeOpenedEvent
  | TechniquesRankUpgradeAttemptEvent
  | TechniquesRankUpgradeSuccessEvent
  | TechniquesRankUpgradeFailedEvent
  | TechniquesTraitRerollOpenedEvent
  | TechniquesTraitRerollAttemptEvent
  | TechniquesTraitRerollResultEvent
  | TechniquesRuneSocketedEvent
  | TechniquesRuneUnsocketedEvent
  | TechniquesEquipNowClickedEvent
  | RewardsSpentEvent
  | EconomyItemsSpentEvent
  | ProgressionLifeStartedEvent
  | ProgressionGateAvailableEvent
  | ProgressionGateResolvedEvent
  | ProgressionBreakthroughEvent
  | ProgressionBreakthroughCompletedEvent
  | ProgressionCityEnteredEvent
  | ProgressionContentCapReachedEvent
  | TrainingStartedEvent
  | TrainingGradeChangedEvent
  | TrainingCapHitEvent
  | TrainingOfflineAppliedEvent
  | DaoHeartStartedEvent
  | HeartLawLevelChangedEvent
  | DaoHeartOfflineAppliedEvent
  | BreakthroughAttemptedEvent
  | GateAttemptedEvent
  | TrialsAttemptStartedEvent
  | TrialsAttemptResolvedEvent
  | DaoImpressionAwardedEvent
  | FailureReflectionUpdatedEvent
  | BountiesClaimedEvent
  | ExpeditionsStartedEvent
  | ExpeditionsClaimedEvent
  | PrestigePerformedEvent
  | PrestigeStartedEvent
  | PrestigeMemoryAppliedEvent
  | PrestigeResetBucketAppliedEvent
  | PrestigeUpgradePurchasedEvent
  | OfflineAppliedEvent;

export type GameEventType = GameEvent['type'];
export type GameEventForType<TType extends GameEventType> = Extract<GameEvent, { type: TType }>;
export type GameEventHandler<TType extends GameEventType> = (event: GameEventForType<TType>) => void;

type Listener = (event: GameEvent) => void;

const listeners: Partial<Record<GameEventType, Set<Listener>>> = {};
const anyListeners: Set<Listener> = new Set();

function on<TType extends GameEventType>(type: TType, handler: GameEventHandler<TType>): void {
  if (!listeners[type]) {
    listeners[type] = new Set();
  }
  listeners[type]!.add(handler as Listener);
}

function off<TType extends GameEventType>(type: TType, handler: GameEventHandler<TType>): void {
  listeners[type]?.delete(handler as Listener);
}

function onAny(handler: Listener): void {
  anyListeners.add(handler);
}

function offAny(handler: Listener): void {
  anyListeners.delete(handler);
}

function emit(event: GameEvent): void {
  const handlers = listeners[event.type];
  handlers?.forEach((handler) => {
    try {
      (handler as GameEventHandler<typeof event.type>)(event as never);
    } catch (error) {
      console.warn('[GameEvents] Handler error for', event.type, error);
    }
  });

  anyListeners.forEach((handler) => {
    try {
      handler(event);
    } catch (error) {
      console.warn('[GameEvents] Any-handler error for', event.type, error);
    }
  });
}

export const GameEvents = {
  emit,
  on,
  off,
  onAny,
  offAny,
};
