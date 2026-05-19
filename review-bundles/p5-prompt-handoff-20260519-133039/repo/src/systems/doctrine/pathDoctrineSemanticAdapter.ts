import type { CultivationPath } from '../../types/index.js';
import type { PathDoctrineProfile } from './pathDoctrineTypes.js';
import { getPathDoctrineProfile } from './pathDoctrineRegistry.js';

export interface PathDoctrineSemanticView {
  id: CultivationPath;
  label: string;
  summary: string;
  coreIdentity: PathDoctrineProfile['coreIdentity'];
  prepBias: readonly string[];
  forgeBias: readonly string[];
  buildBias: readonly string[];
  recommendedAiByPhase: PathDoctrineProfile['recommendedAiByPhase'];
  commonFailureModes: readonly string[];
}

function freezePathDoctrineSemanticView(profile: PathDoctrineProfile): PathDoctrineSemanticView {
  const semanticView: PathDoctrineSemanticView = {
    id: profile.id,
    label: profile.label,
    summary: profile.summary,
    coreIdentity: profile.coreIdentity,
    prepBias: Object.freeze([...profile.prepBias]),
    forgeBias: Object.freeze([...profile.forgeBias]),
    buildBias: Object.freeze([...profile.buildBias]),
    recommendedAiByPhase: Object.freeze({
      early: Object.freeze([...profile.recommendedAiByPhase.early]),
      boss: Object.freeze([...profile.recommendedAiByPhase.boss]),
    }),
    commonFailureModes: Object.freeze([...profile.commonFailureModes]),
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
