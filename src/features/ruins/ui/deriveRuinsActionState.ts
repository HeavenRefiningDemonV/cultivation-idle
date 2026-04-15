export interface DeriveRuinsActionStateArgs {
  runActive: boolean;
}

export interface RuinsActionState {
  primaryActionLabel: 'Start Ruins Run' | 'Stop Ruins Run';
  primaryActionTone: 'start' | 'stop';
}

export function deriveRuinsActionState(args: DeriveRuinsActionStateArgs): RuinsActionState {
  if (args.runActive) {
    return {
      primaryActionLabel: 'Stop Ruins Run',
      primaryActionTone: 'stop',
    };
  }

  return {
    primaryActionLabel: 'Start Ruins Run',
    primaryActionTone: 'start',
  };
}
