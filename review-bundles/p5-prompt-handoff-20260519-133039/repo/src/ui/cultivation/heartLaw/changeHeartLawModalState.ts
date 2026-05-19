export interface ResolveChangeHeartLawActionStateInput {
  canChange: boolean;
  canAfford: boolean;
  selectedHeartLawId: string | null;
  currentHeartLawId: string | null;
  selectedUnlocked: boolean;
  selectedUnlockLine: string | null;
}

export interface ChangeHeartLawActionState {
  primaryLabel: 'Rewrite Heart Law' | 'Keep Current Law';
  primaryDisabled: boolean;
  disabledReason: string | null;
}

export function resolveChangeHeartLawActionState(input: ResolveChangeHeartLawActionStateInput): ChangeHeartLawActionState {
  if (!input.selectedHeartLawId) {
    return {
      primaryLabel: 'Rewrite Heart Law',
      primaryDisabled: true,
      disabledReason: 'Select a Heart Law first.',
    };
  }

  if (input.selectedHeartLawId === input.currentHeartLawId) {
    return {
      primaryLabel: 'Keep Current Law',
      primaryDisabled: false,
      disabledReason: null,
    };
  }

  if (!input.selectedUnlocked) {
    return {
      primaryLabel: 'Rewrite Heart Law',
      primaryDisabled: true,
      disabledReason: input.selectedUnlockLine ?? 'This Heart Law is locked.',
    };
  }

  if (!input.canChange) {
    return {
      primaryLabel: 'Rewrite Heart Law',
      primaryDisabled: true,
      disabledReason: 'Heart Law rewriting is unavailable right now.',
    };
  }

  if (!input.canAfford) {
    return {
      primaryLabel: 'Rewrite Heart Law',
      primaryDisabled: true,
      disabledReason: 'Not enough Gold to rewrite.',
    };
  }

  return {
    primaryLabel: 'Rewrite Heart Law',
    primaryDisabled: false,
    disabledReason: null,
  };
}
