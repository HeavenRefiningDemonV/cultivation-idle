import classNames from 'classnames';

import type { DaoCurrentOmenV1, DaoOmenSeverity, DaoOmenTone } from '../../systems/ui/daoMandate/daoOmenProjectionTypes.js';
import './OmenSeal.scss';

export interface OmenSealAction {
  label: string;
  ariaLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
}

export interface OmenSealProps {
  omen: DaoCurrentOmenV1;
  action?: OmenSealAction;
  detailAction?: OmenSealAction;
  compact?: boolean;
  showEvidenceCount?: boolean;
  className?: string;
  testId?: string;
}

const SEVERITY_LABELS: Record<DaoOmenSeverity, string> = {
  quiet: 'Quiet',
  observed: 'Observed',
  thin: 'Thin',
  locked: 'Locked',
  ready: 'Ready',
  reflection: 'Reflection',
  cap: 'Cap',
};

const TONE_LABELS: Record<DaoOmenTone, string> = {
  ink: 'Ink',
  jade: 'Jade',
  bronze: 'Bronze',
  cinnabar: 'Cinnabar',
  gold: 'Gold',
};

export function OmenSeal({
  omen,
  action,
  detailAction,
  compact = false,
  showEvidenceCount = false,
  className,
  testId = 'dao-omen-seal',
}: OmenSealProps) {
  const canShowPrimaryAction = omen.allowDirectRoute && action !== undefined;
  const evidenceCount = omen.evidenceIds.length;

  return (
    <section
      className={classNames(
        'daoOmenSeal',
        `daoOmenSeal--tone-${omen.tone}`,
        `daoOmenSeal--severity-${omen.severity}`,
        compact && 'daoOmenSeal--compact',
        className,
      )}
      data-testid={testId}
      role="group"
      aria-label={`Current omen: ${omen.title}`}
    >
      <span className="daoOmenSeal__icon" aria-hidden="true" data-icon-id={omen.iconId}>
        <span className="daoOmenSeal__glyph" />
      </span>

      <div className="daoOmenSeal__body">
        <span className="daoOmenSeal__kicker">Current omen</span>
        <h3 className="daoOmenSeal__title">{omen.title}</h3>
        <p className="daoOmenSeal__detail">{omen.detail}</p>
        <div className="daoOmenSeal__meta" aria-label="Omen state">
          <span className="daoOmenSeal__state">{SEVERITY_LABELS[omen.severity]}</span>
          <span className="daoOmenSeal__tone">{TONE_LABELS[omen.tone]} seal</span>
          {showEvidenceCount ? (
            <span className="daoOmenSeal__evidence">
              {evidenceCount} {evidenceCount === 1 ? 'proof trace' : 'proof traces'}
            </span>
          ) : null}
        </div>
      </div>

      <div className="daoOmenSeal__actions" aria-label="Omen actions">
        {detailAction ? <OmenSealButton action={detailAction} variant="detail" idBase={`${testId}-detail`} /> : null}
        {canShowPrimaryAction ? <OmenSealButton action={action} variant="primary" idBase={`${testId}-primary`} /> : null}
      </div>
    </section>
  );
}

function OmenSealButton({
  action,
  variant,
  idBase,
}: {
  action: OmenSealAction;
  variant: 'primary' | 'detail';
  idBase: string;
}) {
  const disabledReasonId = `${idBase}-disabled-reason`;
  const showDisabledReason = action.disabled && action.disabledReason;

  return (
    <span className="daoOmenSeal__actionWrap">
      <button
        type="button"
        className={classNames('daoOmenSeal__action', `daoOmenSeal__action--${variant}`)}
        onClick={action.onClick}
        disabled={action.disabled}
        aria-label={action.ariaLabel ?? action.label}
        aria-describedby={showDisabledReason ? disabledReasonId : undefined}
      >
        {action.label}
      </button>
      {showDisabledReason ? (
        <span id={disabledReasonId} className="daoOmenSeal__disabledReason">
          {action.disabledReason}
        </span>
      ) : null}
    </span>
  );
}
