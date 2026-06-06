export type ForegroundActivityType =
  | 'meditate'
  | 'path_training'
  | 'dao_heart_practice'
  | 'outskirts'
  | 'trial'
  | 'ruins'
  | 'forge';

export type ForegroundActivityPayload = {
  cityId?: string;
  sourceId?: string;
  [key: string]: unknown;
};

export interface ActiveActivity extends ForegroundActivityPayload {
  type: ForegroundActivityType;
  startedAt: number;
  payload?: ForegroundActivityPayload;
}

export interface ActivityHistoryEntry {
  previous: ActiveActivity | null;
  next: ActiveActivity | null;
  changedAt: number;
  reason?: string;
}

export const COMBAT_ACTIVITY_TYPES: ForegroundActivityType[] = ['outskirts', 'trial', 'ruins'];
