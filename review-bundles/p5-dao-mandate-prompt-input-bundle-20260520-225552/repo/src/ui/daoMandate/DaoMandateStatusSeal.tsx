import classNames from 'classnames';

import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateTone,
  DaoRequirementState,
  DaoReincarnationCounselSurface,
  DaoSafetyNetSurface,
} from '../../systems/ui/daoMandate/index.js';
import { GameIcon } from '../icons/index.js';
import {
  getDaoMandateMotionClassName,
  getDaoMandateToneIconId,
  getDaoRequirementStateLabel,
  getDaoRequirementStateTone,
} from './daoMandateUiFormatters.js';
import './DaoMandateStatusSeal.scss';

export interface DaoMandateStatusSealProps {
  tone: DaoMandateTone | 'hardGate' | 'readiness' | 'support' | 'source' | 'optional' | 'omen';
  label: string;
  detail?: string | null;
  state?: DaoRequirementState | DaoSafetyNetSurface['state'] | DaoReincarnationCounselSurface['state'];
  compact?: boolean;
  animated?: boolean;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

function toneFromExtendedTone(tone: DaoMandateStatusSealProps['tone']): DaoMandateTone {
  switch (tone) {
    case 'hardGate':
      return 'danger';
    case 'readiness':
      return 'warning';
    case 'support':
    case 'source':
    case 'omen':
      return 'info';
    case 'optional':
      return 'muted';
    default:
      return tone;
  }
}

function stateTone(state: DaoMandateStatusSealProps['state'], fallback: DaoMandateTone): DaoMandateTone {
  if (!state) return fallback;

  switch (state) {
    case 'unmet':
    case 'blocked':
      return state === 'blocked' ? 'danger' : 'warning';
    case 'partial':
    case 'available':
    case 'progressing':
    case 'viable':
      return 'info';
    case 'met':
    case 'resolved':
    case 'recommended':
    case 'cap_recommended':
      return 'success';
    case 'hidden':
    case 'too_early':
    case 'unknown':
      return 'muted';
  }
}

function stateLabel(state: DaoMandateStatusSealProps['state']): string | null {
  if (!state) return null;
  if (['unmet', 'partial', 'met', 'resolved', 'blocked', 'unknown'].includes(state)) {
    return getDaoRequirementStateLabel(state as DaoRequirementState);
  }
  return state.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DaoMandateStatusSeal({
  tone,
  label,
  detail = null,
  state,
  compact = false,
  animated = false,
  motionMode = 'medium',
  className,
}: DaoMandateStatusSealProps) {
  const baseTone = toneFromExtendedTone(tone);
  const resolvedTone = state && ['unmet', 'partial', 'met', 'resolved', 'blocked', 'unknown'].includes(state)
    ? getDaoRequirementStateTone(state as DaoRequirementState)
    : stateTone(state, baseTone);
  const resolvedLabel = label || stateLabel(state) || 'Mandate';
  const resolvedDetail = detail ?? stateLabel(state);
  const canAnimate = animated && motionMode !== 'reduced';

  return (
    <span
      className={classNames(
        'daoMandateStatusSeal',
        `daoMandateStatusSeal--${resolvedTone}`,
        getDaoMandateMotionClassName(motionMode),
        {
          'daoMandateStatusSeal--compact': compact,
          'daoMandateStatusSeal--animated': canAnimate,
        },
        className,
      )}
      data-dao-motion={motionMode}
      aria-label={resolvedDetail ? `${resolvedLabel}: ${resolvedDetail}` : resolvedLabel}
    >
      <span className="daoMandateStatusSeal__icon" aria-hidden="true">
        <GameIcon icon={getDaoMandateToneIconId(resolvedTone)} size={compact ? 14 : 16} />
      </span>
      <span className="daoMandateStatusSeal__text">
        <span className="daoMandateStatusSeal__label">{resolvedLabel}</span>
        {resolvedDetail && !compact ? (
          <span className="daoMandateStatusSeal__detail">{resolvedDetail}</span>
        ) : null}
      </span>
    </span>
  );
}
