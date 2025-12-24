import type { RewardBundle, GrantRewardsResult } from '../rewards/types';

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
    activityType: string | null;
    activityId?: string | null;
  };
};

export type ManualPurchasedEvent = {
  type: 'manuals/purchased';
  payload: {
    manualId: string;
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
  };
};

export type HeartLawSelectedEvent = {
  type: 'heartlaw/selected';
  payload: {
    heartLawId: string | null;
  };
};

export type GameEvent =
  | RewardsGrantedEvent
  | CombatResolvedEvent
  | ActivityChangedEvent
  | ManualPurchasedEvent
  | ManualStudiedEvent
  | TechniqueEquippedEvent
  | HeartLawSelectedEvent;

export type GameEventType = GameEvent['type'];
export type GameEventForType<TType extends GameEventType> = Extract<GameEvent, { type: TType }>;
export type GameEventHandler<TType extends GameEventType> = (event: GameEventForType<TType>) => void;

type Listener = (event: GameEvent) => void;

const listeners: Partial<Record<GameEventType, Set<Listener>>> = {};

function on<TType extends GameEventType>(type: TType, handler: GameEventHandler<TType>): void {
  if (!listeners[type]) {
    listeners[type] = new Set();
  }
  listeners[type]!.add(handler as Listener);
}

function off<TType extends GameEventType>(type: TType, handler: GameEventHandler<TType>): void {
  listeners[type]?.delete(handler as Listener);
}

function emit(event: GameEvent): void {
  const handlers = listeners[event.type];
  if (!handlers || handlers.size === 0) return;

  handlers.forEach((handler) => {
    try {
      (handler as GameEventHandler<typeof event.type>)(event as never);
    } catch (error) {
      console.warn('[GameEvents] Handler error for', event.type, error);
    }
  });
}

export const GameEvents = {
  emit,
  on,
  off,
};
