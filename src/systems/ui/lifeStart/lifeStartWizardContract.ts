import type { CultivationPath } from '../../../types/index.js';

export const LIFE_START_WIZARD_STEPS = Object.freeze([1, 2, 3] as const);

export type LifeStartWizardStep = (typeof LIFE_START_WIZARD_STEPS)[number];

type LifeStartWizardOwnershipInput = {
  selectedPath: CultivationPath | null;
  selectedHeartLawId: string | null;
};

type LifeStartWizardUiStepInput = LifeStartWizardOwnershipInput & {
  draftHeartLawId: string | null;
  requestedStep?: LifeStartWizardStep | null;
};

export function isLifeStartWizardRequired(input: LifeStartWizardOwnershipInput): boolean {
  return input.selectedPath === null || input.selectedHeartLawId === null;
}

export function getLifeStartWizardCommittedStep(input: LifeStartWizardOwnershipInput): LifeStartWizardStep {
  if (input.selectedPath === null) return 1;
  if (input.selectedHeartLawId === null) return 2;
  return 3;
}

export function resolveLifeStartWizardUiStep(input: LifeStartWizardUiStepInput): LifeStartWizardStep {
  const baseStep =
    input.selectedPath === null
      ? 1
      : input.selectedHeartLawId === null && input.draftHeartLawId === null
        ? 2
        : 3;

  if (input.requestedStep == null) return baseStep;

  if (input.requestedStep === 2 && input.selectedPath !== null && input.selectedHeartLawId === null) {
    return 2;
  }

  if (input.requestedStep === 3 && input.selectedPath !== null && (input.selectedHeartLawId !== null || input.draftHeartLawId !== null)) {
    return 3;
  }

  return baseStep;
}
