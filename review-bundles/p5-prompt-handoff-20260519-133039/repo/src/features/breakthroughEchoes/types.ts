import type { BreakthroughMethod } from '../../services/events/GameEvents.js';

export interface BreakthroughEcho {
  echoId: string;
  createdAt: number;
  fromRealmIndex: number;
  fromRealmName: string;
  toRealmIndex: number;
  toRealmName: string;
  method: BreakthroughMethod;
  proofItemId?: string | null;
  proofItemName?: string | null;
  proofSource?: 'gate_clear' | 'safety_net' | 'unknown';
  strongestBlockerOvercome?: string | null;
  doctrineLine?: string | null;
  cityUnlockedId?: string | null;
  cityUnlockedName?: string | null;
  memoryLine: string;
}
