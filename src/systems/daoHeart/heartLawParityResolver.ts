import { resolveCultivationMindAlignment } from '../cultivation/cultivationMindAlignmentResolver.js';

export interface HeartLawParityPreviewInput {
  heartLawStage: number;
  cultivationEffectiveStage: number;
}

export interface HeartLawParityPreview {
  parity: number;
  riskDelta: number;
  mismatchHardLock: boolean;
  confirmationRequired: boolean;
  innerDemonDebateAvailable: boolean;
  label: string;
}

export function resolveHeartLawParityPreview(input: HeartLawParityPreviewInput): HeartLawParityPreview {
  const mindAlignment = resolveCultivationMindAlignment({
    heartLawLevel: input.heartLawStage,
    cultivationStageIndex: input.cultivationEffectiveStage,
  });

  return {
    parity: mindAlignment.parityDelta,
    riskDelta: mindAlignment.breakthroughRiskDelta,
    mismatchHardLock: false,
    confirmationRequired: mindAlignment.confirmationRequired,
    innerDemonDebateAvailable: mindAlignment.innerDemonDebateAvailable,
    label: mindAlignment.causeRows[0]?.explanation ?? mindAlignment.summaryText,
  };
}
