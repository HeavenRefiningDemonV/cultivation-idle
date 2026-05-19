export type DaoImpressionSourceKind =
  | 'outskirts_first_boss'
  | 'gate_close_defeat'
  | 'gate_clear'
  | 'ruins_completion'
  | 'breakthrough_resonance'
  | 'technique_mastery_milestone';

export type DaoImpressionRarityBand = 'faint' | 'clear' | 'deep' | 'threshold';

export interface DaoImpressionDefinition {
  impressionId: string;
  sourceKind: DaoImpressionSourceKind;
  title: string;
  doctrineFamily: 'breath' | 'vessel' | 'blade' | 'formation' | 'alchemy' | 'trial' | 'ruin' | 'neutral';
  comprehensionDelta: number;
  rarityBand: DaoImpressionRarityBand;
  displaySeal: 'ink' | 'jade' | 'vermillion' | 'gold' | 'shadow';
  memoryEligible: boolean;
  maxAwardsPerLife?: number;
  cooldownMs?: number;
  runtimeStatus?: 'active' | 'future_stub_only';
  copy: {
    shortLine: string;
    aftermathLine: string;
    heartLawLine: string;
    lifeSummaryLine?: string;
  };
}

export interface DaoImpressionAward {
  awardId: string;
  impressionId: string;
  sourceKind: DaoImpressionSourceKind;
  sourceEventKey: string;
  createdAt: number;
  title: string;
  doctrineFamily: DaoImpressionDefinition['doctrineFamily'];
  comprehensionDelta: number;
  applied: boolean;
  targetHeartLawId: string | null;
  skippedReason?: 'no_selected_heart_law' | 'invalid_amount' | 'duplicate' | 'cooldown' | 'unsupported_source';
  rarityBand: DaoImpressionRarityBand;
  memoryEligible: boolean;
  routeHint?: {
    kind: 'heart_law' | 'cultivation' | 'gate_trial' | 'techniques' | 'records';
    label: string;
  };
  memoryLine: string;
}

export interface DaoImpressionSurfaceV1 {
  version: 1;
  awardId: string;
  title: string;
  sourceLabel: string;
  doctrineLine: string;
  comprehensionLine: string;
  targetLine: string;
  rarityBand: DaoImpressionRarityBand;
  sealTone: 'ink' | 'jade' | 'vermillion' | 'gold' | 'shadow';
  memoryEligible: boolean;
  routeLabel?: string;
  debugNotes: string[];
}

export interface DaoImpressionCandidate {
  impressionId: string;
  sourceKind: DaoImpressionSourceKind;
  sourceEventKey: string;
  createdAt: number;
  routeHint?: DaoImpressionAward['routeHint'];
}
