import classNames from 'classnames';

import type { DaoReflectionKind, DaoReflectionV1 } from '../../systems/ui/daoMandate/daoOmenProjectionTypes.js';
import './ReflectionPlaque.scss';

export interface ReflectionPlaqueAction {
  label: string;
  ariaLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
}

export interface ReflectionPlaqueProps {
  reflection: DaoReflectionV1;
  compact?: boolean;
  action?: ReflectionPlaqueAction;
  className?: string;
  testId?: string;
}

const KIND_LABELS: Record<DaoReflectionKind, string> = {
  survival_pattern: 'Survival reflection',
  forge_pattern: 'Forge reflection',
  doctrine_pattern: 'Doctrine reflection',
  threshold_pattern: 'Threshold reflection',
  source_pattern: 'Source reflection',
  unknown_pattern: 'Reflection',
};

export function ReflectionPlaque({
  reflection,
  compact = false,
  action,
  className,
  testId = 'dao-reflection-plaque',
}: ReflectionPlaqueProps) {
  const disabledReasonId = `${testId}-${reflection.id}-disabled-reason`;
  const showDisabledReason = action?.disabled && action.disabledReason;

  return (
    <article
      className={classNames(
        'daoReflectionPlaque',
        `daoReflectionPlaque--${reflection.kind}`,
        `daoReflectionPlaque--tone-${reflection.tone}`,
        compact && 'daoReflectionPlaque--compact',
        className,
      )}
      data-testid={testId}
      aria-label={`${KIND_LABELS[reflection.kind]}: ${reflection.label}`}
    >
      <span className="daoReflectionPlaque__icon" aria-hidden="true" data-icon-id={reflection.iconId}>
        <span className="daoReflectionPlaque__glyph" />
      </span>
      <span className="daoReflectionPlaque__body">
        <span className="daoReflectionPlaque__kicker">{KIND_LABELS[reflection.kind]}</span>
        <span className="daoReflectionPlaque__title">{reflection.label}</span>
        {!compact ? <span className="daoReflectionPlaque__detail">{reflection.detail}</span> : null}
      </span>
      {action ? (
        <span className="daoReflectionPlaque__actionWrap">
          <button
            type="button"
            className="daoReflectionPlaque__action"
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.ariaLabel ?? action.label}
            aria-describedby={showDisabledReason ? disabledReasonId : undefined}
          >
            {action.label}
          </button>
          {showDisabledReason ? (
            <span id={disabledReasonId} className="daoReflectionPlaque__disabledReason">
              {action.disabledReason}
            </span>
          ) : null}
        </span>
      ) : null}
    </article>
  );
}
