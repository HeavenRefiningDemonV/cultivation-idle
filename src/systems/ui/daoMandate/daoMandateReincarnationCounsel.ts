import type { DaoMandateRoute, DaoReincarnationCounselSurface } from './daoMandateTypes.js';

export type DaoReincarnationAdvisorState =
  | 'hidden'
  | 'too_early'
  | 'viable'
  | 'recommended'
  | 'chapter_exhausted'
  | 'cap_recommended'
  | 'blocked';

export interface BuildDaoReincarnationCounselArgs {
  advisorState: DaoReincarnationAdvisorState;
  route: DaoMandateRoute | null;
  potentialApGain?: number | null;
  forecastLine?: string | null;
  blockedDetail?: string | null;
}

function stateFromAdvisor(args: BuildDaoReincarnationCounselArgs): DaoReincarnationCounselSurface['state'] {
  if (args.advisorState === 'hidden') return 'hidden';
  if (args.route?.blocked && args.advisorState !== 'cap_recommended' && args.advisorState !== 'chapter_exhausted') return 'blocked';
  if (args.advisorState === 'chapter_exhausted') return 'cap_recommended';
  if (args.advisorState === 'cap_recommended') return 'cap_recommended';
  return args.advisorState;
}

function copyForState(state: DaoReincarnationCounselSurface['state'], ap: number | null | undefined, blockedDetail?: string | null) {
  if (state === 'hidden') {
    return { label: 'Reincarnation hidden', detail: 'Reincarnation counsel is not relevant yet.' };
  }
  if (state === 'blocked') {
    return {
      label: 'Reincarnation blocked',
      detail: blockedDetail ?? 'Reincarnation is not unlocked yet. Reach the required realm or resolved gate first.',
    };
  }
  if (state === 'too_early') {
    return {
      label: 'Reincarnation too early',
      detail: 'This life has not gathered enough proof for a strong reincarnation. Push the current Mandate first.',
    };
  }
  if (state === 'viable') {
    return {
      label: 'Reincarnation viable',
      detail: `Reincarnation is available${ap && ap > 0 ? ` for +${ap} AP` : ''}. Later milestones can improve value, but the ritual is no longer wasteful.`,
    };
  }
  if (state === 'cap_recommended') {
    return {
      label: 'Reincarnation cap recommended',
      detail: 'The current authored chapter is sealed here. Reincarnation is the intended next loop.',
    };
  }
  return {
    label: 'Reincarnation recommended',
    detail: 'The ledger has reached a strong handoff. Review the Life Summary before sealing this life.',
  };
}

export function buildDaoReincarnationCounsel(args: BuildDaoReincarnationCounselArgs): DaoReincarnationCounselSurface | null {
  const state = stateFromAdvisor(args);
  if (state === 'hidden') return null;
  const copy = copyForState(state, args.potentialApGain, args.blockedDetail);
  const potential = Math.max(0, Math.floor(args.potentialApGain ?? 0));
  return {
    state,
    label: copy.label,
    detail: copy.detail,
    route: args.route,
    forecastLine: args.forecastLine ?? (potential > 0 ? `Potential AP on reincarnation: +${potential}.` : null),
  };
}
