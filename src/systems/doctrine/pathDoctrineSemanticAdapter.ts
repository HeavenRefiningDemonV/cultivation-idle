import type { CultivationPath } from '../../types/index.js';
import type { PathDoctrineProfile } from './pathDoctrineTypes.js';
import { getPathDoctrineProfile } from './pathDoctrineRegistry.js';

export interface PathDoctrineSemanticView {
  id: CultivationPath;
  label: string;
  summary: string;
  coreIdentity: PathDoctrineProfile['coreIdentity'];
  playIdentityKeywords: readonly string[];
  doctrineBudget: PathDoctrineProfile['doctrineBudget'];
  prepBias: readonly string[];
  forgeBias: readonly string[];
  buildBiasSummary: readonly string[];
  recommendedAiByPhase: PathDoctrineProfile['recommendedAiByPhase'];
  commonFailureModes: readonly string[];
  objectiveLine: string;
}

function freezePathDoctrineSemanticView(profile: PathDoctrineProfile): PathDoctrineSemanticView {
  const semanticView: PathDoctrineSemanticView = {
    id: profile.id,
    label: profile.label,
    summary: profile.summary,
    coreIdentity: profile.coreIdentity,
    playIdentityKeywords: Object.freeze([...profile.playIdentityKeywords]),
    doctrineBudget: Object.freeze(profile.doctrineBudget.map((entry) => Object.freeze({ ...entry }))) as PathDoctrineSemanticView['doctrineBudget'],
    prepBias: Object.freeze([...profile.prepBias]),
    forgeBias: Object.freeze([...profile.forgeBias]),
    buildBiasSummary: Object.freeze([...profile.buildBiasSummary]),
    recommendedAiByPhase: Object.freeze({
      early: Object.freeze([...profile.recommendedAiByPhase.early]),
      boss: Object.freeze([...profile.recommendedAiByPhase.boss]),
    }),
    commonFailureModes: Object.freeze([...profile.commonFailureModes]),
    objectiveLine: profile.objectiveLine,
  };

  return Object.freeze(semanticView);
}

export function adaptPathDoctrineToSemanticView(path: CultivationPath | null): PathDoctrineSemanticView | null {
  const profile = getPathDoctrineProfile(path);
  if (profile === null) {
    return null;
  }

  return freezePathDoctrineSemanticView(profile);
}
