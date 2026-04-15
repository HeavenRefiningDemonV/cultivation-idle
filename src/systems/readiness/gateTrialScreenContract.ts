import type {
  GateTrialAttemptPresentation,
  GateTrialReadinessSurface,
  Section5PostFailureSurface,
} from './section5Adapters.js';

export interface GateTrialScreenContract {
  roleTag: string;
  roleSummary: string;
  checklistMinimumTitle: string;
  checklistRecommendedTitle: string;
  readinessScoreLine: string;
  failSafeLabel: string;
  diagnosisLabel: string;
  attemptPresentation: GateTrialAttemptPresentation;
  hasDiagnosis: boolean;
}

function formatReadinessScore(surface: GateTrialReadinessSurface): string {
  if (surface.readinessScore == null) return 'Readiness Score: unavailable';
  return `Readiness Score: ${surface.readinessScore}/100`;
}

export function buildGateTrialScreenContract(input: {
  readinessSurface: GateTrialReadinessSurface;
  attemptPresentation: GateTrialAttemptPresentation;
  postFailureSurface: Section5PostFailureSurface | null;
}): GateTrialScreenContract {
  const { readinessSurface, attemptPresentation, postFailureSurface } = input;

  return {
    roleTag: 'Milestone Validation',
    roleSummary: 'Use this screen to validate readiness and risk before attempting a breakthrough gate.',
    checklistMinimumTitle: 'Minimum Floor',
    checklistRecommendedTitle: 'Recommended Floor',
    readinessScoreLine: formatReadinessScore(readinessSurface),
    failSafeLabel: 'Safety Net',
    diagnosisLabel: postFailureSurface?.primaryLabel ? `Diagnosis: ${postFailureSurface.primaryLabel}` : 'Diagnosis: Not available yet',
    attemptPresentation,
    hasDiagnosis: Boolean(postFailureSurface?.primaryLabel),
  };
}
