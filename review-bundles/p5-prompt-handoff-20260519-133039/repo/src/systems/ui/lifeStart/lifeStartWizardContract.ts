import type { CultivationPath } from '../../../types/index.js';

export const LIFE_START_WIZARD_STEPS = Object.freeze([1, 2, 3] as const);

export type LifeStartWizardStep = (typeof LIFE_START_WIZARD_STEPS)[number];

type WizardOwnershipInput = {
  selectedPath: CultivationPath | null;
  selectedHeartLawId: string | null;
};

type WizardUiStepInput = WizardOwnershipInput & {
  draftHeartLawId: string | null;
  requestedStep?: LifeStartWizardStep | null;
};

export function isLifeStartWizardRequired(input: WizardOwnershipInput): boolean {
  return input.selectedPath === null || input.selectedHeartLawId === null;
}

export function getLifeStartWizardCommittedStep(input: WizardOwnershipInput): LifeStartWizardStep {
  if (input.selectedPath === null) return 1;
  if (input.selectedHeartLawId === null) return 2;
  return 3;
}

export function resolveLifeStartWizardUiStep(input: WizardUiStepInput): LifeStartWizardStep {
  if (input.selectedPath === null) return 1;

  if (input.selectedHeartLawId !== null) {
    return input.requestedStep === 2 ? 2 : 3;
  }

  if (input.requestedStep === 2) return 2;
  if (input.draftHeartLawId !== null) return 3;
  return 2;
}
