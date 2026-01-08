import type { RewardBundle, GrantRewardsResult, RewardCurrencyBundle } from '../rewards/types';
import type { ActiveActivity } from '../../types/activity';
import type { GameTab, WorldBuildingKey } from '../../stores/uiStore';

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
  | RewardsSpentEvent;

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
