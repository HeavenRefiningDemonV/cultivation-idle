import type { CultivationPath, AiProfile, PathModifiers } from '../../types/index.js';

export type PathDoctrineCoreIdentity =
  | 'precision_pressure'
  | 'durable_inevitability'
  | 'tempo_kill_window';

export interface PathDoctrineProfile {
  id: CultivationPath;
  label: string;
  summary: string;
  coreIdentity: PathDoctrineCoreIdentity;
  modifierSignature: Readonly<PathModifiers>;
  prepBias: readonly string[];
  forgeBias: readonly string[];
  buildBias: readonly string[];
  recommendedAiByPhase: {
    readonly early: readonly AiProfile[];
    readonly boss: readonly AiProfile[];
  };
  commonFailureModes: readonly string[];
}
