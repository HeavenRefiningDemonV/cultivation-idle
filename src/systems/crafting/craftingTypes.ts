export type CraftStation = 'alchemy' | 'forge' | 'talisman';

export type CraftMode = 'idle' | 'assisted' | 'handsOn';

export type CraftStepType =
  | 'HEAT_TO'
  | 'HOLD_HEAT'
  | 'ADD_INGREDIENT'
  | 'HAMMER'
  | 'QUENCH'
  | 'TEMPER'
  | 'FINISH';

export type CraftPromptType = 'STABILIZE_FLAME';

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
      medium: 'water' | 'oil';
    }
  | {
      id: string;
      type: 'TEMPER';
      uiLabel?: string;
      targetHeat: number;
      durationMs: number;
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
}

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
  cursor: { stepIndex: number };
  payment: CraftSessionPayment;
  prompts?: CraftPromptState[];
}

export interface CraftSessionSaveState {
  modeByStation: Partial<Record<CraftStation, CraftMode>>;
  activeSession: CraftSession | null;
}
