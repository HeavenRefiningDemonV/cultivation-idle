export type ForegroundActivityType = 'meditate' | 'outskirts' | 'trial' | 'ruins';

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
