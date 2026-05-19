import type { RunCompassActionTarget } from '../ui/runCompass/types.js';

export type RunDeltaSource =
  | 'rewards'
  | 'spend'
  | 'combat'
  | 'trial'
  | 'breakthrough'
  | 'crafting'
  | 'bounty'
  | 'expedition'
  | 'prestige'
  | 'life'
  | 'offline'
  | 'manual'
  | 'technique'
  | 'unknown';

export interface RunCausalityDelta {
  id: string;
  source: RunDeltaSource;
  timestamp: number;
  tone: 'success' | 'info' | 'warning' | 'danger' | 'muted';
  label: string;
  detail: string;
  memoryLine: string;
  rewardSummary?: string | null;
  readinessDelta?: {
    beforeLabel?: string | null;
    afterLabel?: string | null;
    deltaLabel?: string | null;
  } | null;
  economyDelta?: {
    currencies?: string[];
    items?: string[];
  } | null;
  doctrineDelta?: {
    heartLawId?: string | null;
    amount?: number;
    beforeChapter?: number;
    afterChapter?: number;
  } | null;
  routeDelta?: {
    target?: RunCompassActionTarget | null;
    label?: string | null;
  } | null;
  debug?: string[];
}
