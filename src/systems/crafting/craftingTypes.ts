export type CraftStation = 'alchemy' | 'forge' | 'talisman';

export type CraftMode = 'idle' | 'assisted' | 'handsOn';

export type CraftStepType =
  | 'HEAT_TO'
  | 'HOLD_HEAT'
  | 'ADD_INGREDIENT'
  | 'HAMMER'
  | 'QUENCH'
  | 'TEMPER'
  | 'SEAL_LID'
  | 'FINISH'
  | 'HEAT_MATERIAL'
  | 'ALLOY_MIX'
  | 'CAST_OR_SHAPE'
  | 'HAMMER_PATTERN'
  | 'ENGRAVE_RUNE'
  | 'LAY_FORMATION';

export type CraftPromptType = 'STABILIZE_FLAME' | 'ADD_CATALYST';

export type CraftPromptStatus = 'PENDING' | 'AVAILABLE' | 'COMPLETED' | 'MISSED';

export interface CraftPromptBonus {
  yieldPct?: number;
  qualityScore?: number;
}

export interface CraftPromptUiCopy {
  title?: string;
  body?: string;
}

export interface PromptDef {
  id: string;
  type: CraftPromptType;
  atPct: number;
  windowSec: number;
  bonus?: CraftPromptBonus;
  ui?: CraftPromptUiCopy;
}

export interface CraftPromptState {
  id: string;
  type: CraftPromptType;
  dueAtMs: number;
  expiresAtMs: number;
  status: CraftPromptStatus;
  completedAtMs?: number | null;
  bonus?: CraftPromptBonus;
  ui?: CraftPromptUiCopy;
}

export type CraftStep =
  | {
      id: string;
      type: 'HEAT_TO';
      uiLabel?: string;
      targetHeat: number;
      tolerance: number;
    }
  | {
      id: string;
      type: 'HOLD_HEAT';
      uiLabel?: string;
      durationMs: number;
    }
  | {
      id: string;
      type: 'ADD_INGREDIENT';
      uiLabel?: string;
      itemId: string;
      qty: number;
    }
  | {
      id: string;
      type: 'HAMMER';
      uiLabel?: string;
      hits: number;
      rhythm: 'slow' | 'steady' | 'fast';
    }
  | {
      id: string;
      type: 'QUENCH';
      uiLabel?: string;
      medium: 'water' | 'oil' | 'brine';
      mediumOptions?: Array<'water' | 'oil' | 'brine'>;
      timingWindow?: { goodMin: number; goodMax: number; perfectMin: number; perfectMax: number };
    }
  | {
      id: string;
      type: 'TEMPER';
      uiLabel?: string;
      targetHeat: number;
      durationMs: number;
      targetMin?: number;
      targetMax?: number;
      holdMs?: number;
    }
  | {
      id: string;
      type: 'SEAL_LID';
      uiLabel?: string;
      windowMs: number;
    }
  | {
      id: string;
      type: 'HEAT_MATERIAL';
      uiLabel?: string;
      targetMin: number;
      targetMax: number;
      holdMs: number;
      jitter?: number;
    }
  | {
      id: string;
      type: 'ALLOY_MIX';
      uiLabel?: string;
      options: Array<{ id: string; label: string; qualityDelta?: number }>;
    }
  | {
      id: string;
      type: 'CAST_OR_SHAPE';
      uiLabel?: string;
      variant: 'cast' | 'shape';
      difficulty?: number;
    }
  | {
      id: string;
      type: 'HAMMER_PATTERN';
      uiLabel?: string;
      hits: number;
      shrinkMs: number;
      tolerance: number;
      difficulty?: number;
      patternId?: string;
    }
  | {
      id: string;
      type: 'ENGRAVE_RUNE';
      uiLabel?: string;
      hits?: number;
      difficulty?: number;
      patternId?: string;
      optional?: boolean;
      runeFamily?: string;
    }
  | {
      id: string;
      type: 'LAY_FORMATION';
      uiLabel?: string;
      hits?: number;
      difficulty?: number;
      patternId?: string;
      optional?: boolean;
      formationId?: string;
    }
  | {
      id: string;
      type: 'FINISH';
      uiLabel?: string;
    };

export interface CraftScript {
  version: number;
  station: CraftStation;
  sourceId: string;
  steps: CraftStep[];
  baselineTimeSec?: number;
  handsOnBonus?: ForgeHandsOnBonus;
}

export type ForgeStepDef = Extract<
  CraftStep,
  | { type: 'HEAT_MATERIAL' }
  | { type: 'HEAT_TO' }
  | { type: 'ALLOY_MIX' }
  | { type: 'CAST_OR_SHAPE' }
  | { type: 'HAMMER_PATTERN' }
  | { type: 'QUENCH' }
  | { type: 'TEMPER' }
  | { type: 'ENGRAVE_RUNE' }
  | { type: 'LAY_FORMATION' }
  | { type: 'FINISH' }
>;

export type ForgeStepResult =
  | {
      stepId: string;
      type: 'HEAT_MATERIAL';
      achievedMin?: number;
      achievedMax?: number;
      holdMs?: number;
    }
  | {
      stepId: string;
      type: 'ALLOY_MIX';
      choiceId?: string;
      qualityDelta?: number;
    }
  | {
      stepId: string;
      type: 'CAST_OR_SHAPE';
      variant: 'cast' | 'shape';
      precision?: number;
      success?: boolean;
    }
  | {
      stepId: string;
      type: 'HAMMER_PATTERN';
      hitsLanded: number;
      hitsRequired: number;
      timingScore?: number;
    }
  | {
      stepId: string;
      type: 'QUENCH';
      medium: 'water' | 'oil' | 'brine';
      timingMs?: number;
    }
  | {
      stepId: string;
      type: 'TEMPER';
      achievedMin?: number;
      achievedMax?: number;
      holdMs?: number;
    }
  | {
      stepId: string;
      type: 'ENGRAVE_RUNE';
      hitsLanded?: number;
      hitsRequired?: number;
      timingScore?: number;
      success?: boolean;
      precision?: number;
      optional?: boolean;
      patternId?: string;
    }
  | {
      stepId: string;
      type: 'LAY_FORMATION';
      hitsLanded: number;
      hitsRequired: number;
      timingScore?: number;
      patternId?: string;
    };

export type ForgeHandsOnBonus = {
  qualityProcChancePct?: number;
  masteryMult?: number;
  timeReductionPct?: number;
  temperProcChancePct?: number;
};

export interface CraftSessionPayment {
  currencies?: Partial<Record<'gold' | 'spiritStones' | 'merit', string>>;
  items?: Array<{ itemId: string; qty: number }>;
}

export interface CraftSession {
  sessionId: string;
  station: CraftStation;
  mode: 'assisted' | 'handsOn';
  sourceId: string;
  qty: number;
  createdAt: number;
  seed: number;
  startedAt: number;
  endsAt: number;
  script: CraftScript;
  cursor: {
    stepIndex: number;
    stepStartedAt?: number;
    stepEndsAt?: number;
    heatSetting?: number;
    impurities?: number;
    scoreParts?: { heat?: number; stability?: number; order?: number; qte?: number };
    orderMistakes?: number;
    backgroundResolveAt?: number | null;
    backgroundReason?: 'closed' | 'navigated' | 'crashed' | null;
    forgeStepResults?: ForgeStepResult[];
  };
  payment: CraftSessionPayment;
  prompts?: CraftPromptState[];
}

export interface CraftSessionSaveState {
  modeByStation: Partial<Record<CraftStation, CraftMode>>;
  activeSession: CraftSession | null;
}

export interface AlchemyHandsOnResult {
  grade: 'crude' | 'low' | 'mid' | 'high' | 'perfect';
  yieldMultiplier: number;
  outputsGranted: Array<{ itemId: string; qty: number }>;
  byproductsGranted: Array<{ itemId: string; qty: number }>;
  impurities: number;
  scoreBreakdown: { heat: number; stability: number; order: number; qte: number; total: number };
  baselineTimeSec: number;
  elapsedSec: number;
  timeSavedSec: number;
  masteryBefore: number;
  masteryAfter: number;
  masteryGain: number;
}

export interface ForgeSessionOutcome {
  scoreOverall: number;
  heatScore: number;
  hammerScore: number;
  quenchScore: number;
  temperScore: number;
  timeReductionPctApplied: number;
  qualityProcChanceBonusPct: number;
  masteryMultApplied: number;
  temperProcChanceBonusPctApplied: number;
}
