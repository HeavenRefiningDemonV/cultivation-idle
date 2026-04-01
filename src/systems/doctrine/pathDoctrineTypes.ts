import type { CultivationPath, AiProfile, PathModifiers } from '../../types/index.js';

export type PathDoctrineCoreIdentity =
  | 'precision_pressure'
  | 'durable_inevitability'
  | 'tempo_kill_window';

export type PathDoctrineBudgetEntry = {
  readonly label: string;
  readonly weight: number;
};

export interface PathDoctrineProfile {
  id: CultivationPath;
  label: string;
  summary: string;
  coreIdentity: PathDoctrineCoreIdentity;
  modifierSignature: Readonly<PathModifiers>;
  playIdentityKeywords: readonly string[];
  doctrineBudget: readonly [
    PathDoctrineBudgetEntry,
    PathDoctrineBudgetEntry,
    PathDoctrineBudgetEntry,
    PathDoctrineBudgetEntry,
  ];
  prepBias: readonly string[];
  forgeBias: readonly string[];
  buildBias: readonly string[];
  buildBiasSummary: readonly string[];
  recommendedAiByPhase: {
    readonly early: readonly AiProfile[];
    readonly boss: readonly AiProfile[];
  };
  commonFailureModes: readonly string[];
  objectiveLine: string;
}
