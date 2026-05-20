import { type CSSProperties, useId } from 'react';
import classNames from 'classnames';

import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoReadinessLedger,
  DaoReadinessRow,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import { DaoMandateStatusSeal } from './DaoMandateStatusSeal.js';
import {
  getDaoMandateMotionClassName,
  sanitizeDomIdPart,
} from './daoMandateUiFormatters.js';
import './ReadinessLedger.scss';

export interface ReadinessLedgerProps {
  readiness: DaoReadinessLedger;
  title?: string;
  profile?: DaoMandateGuidanceProfile;
  variant?: 'summary' | 'default' | 'detailed';
  onRouteAction?: DaoMandateRouteActionHandler;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

function readinessTone(row: DaoReadinessRow) {
  return row.tone;
}

export function ReadinessLedger({
  readiness,
  title = 'Readiness Ledger',
  profile = 'elder',
  variant = 'default',
  onRouteAction,
  motionMode = 'medium',
  className,
}: ReadinessLedgerProps) {
  const reactId = useId();
  const titleId = `dao-readiness-ledger-${sanitizeDomIdPart(title)}-${sanitizeDomIdPart(reactId)}`;
  const score = readiness.score;
  const boundedScore = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : null;
  const scoreStyle = boundedScore === null
    ? undefined
    : ({ '--dao-readiness-score': `${boundedScore}%` } as CSSProperties);
  const showDetails = profile === 'jade' || variant === 'detailed';

  return (
    <section
      className={classNames(
        'daoReadinessLedger',
        `daoReadinessLedger--${variant}`,
        `daoReadinessLedger--profile-${profile}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-labelledby={titleId}
    >
      <header className="daoReadinessLedger__header">
        <div>
          <span className="daoReadinessLedger__eyebrow">Readiness record</span>
          <h3 id={titleId} className="daoReadinessLedger__title">{title}</h3>
        </div>
        <DaoMandateStatusSeal
          tone={boundedScore === null ? 'muted' : boundedScore >= 70 ? 'success' : boundedScore >= 45 ? 'warning' : 'danger'}
          label={readiness.label}
          detail={readiness.band}
          motionMode={motionMode}
        />
      </header>

      <div className="daoReadinessLedger__summary">
        <div className="daoReadinessLedger__score">
          <span className="daoReadinessLedger__scoreLabel">Score</span>
          {boundedScore === null ? (
            <strong>Not scored</strong>
          ) : (
            <div
              className="daoReadinessLedger__meter"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={boundedScore}
              aria-label={`${readiness.label} readiness score`}
              style={scoreStyle}
            >
              <span className="daoReadinessLedger__meterFill" />
              <strong>{boundedScore} / 100</strong>
            </div>
          )}
        </div>
        <div className="daoReadinessLedger__diagnosis">
          <span>{readiness.band ?? 'No band'}</span>
          {readiness.diagnosisLabel ? <strong>{readiness.diagnosisLabel}</strong> : null}
          {readiness.primaryShortfallLabel ? <p>{readiness.primaryShortfallLabel}</p> : null}
        </div>
      </div>

      {readiness.rows.length > 0 ? (
        <ul className="daoReadinessLedger__rows">
          {readiness.rows.map((row) => (
            <li key={row.id} className={classNames('daoReadinessLedgerRow', `daoReadinessLedgerRow--${readinessTone(row)}`)}>
              <DaoMandateStatusSeal tone={row.tone} label={row.label} compact motionMode={motionMode} />
              <div className="daoReadinessLedgerRow__main">
                <strong>{row.label}</strong>
                <span>{row.detail}</span>
                {showDetails ? <span className="daoReadinessLedgerRow__source">Source: {row.source}</span> : null}
              </div>
              <div className="daoReadinessLedgerRow__value">
                <span>{row.currentLabel ?? '-'}</span>
                <span>{row.targetLabel ?? '-'}</span>
              </div>
              <div className="daoReadinessLedgerRow__action">
                {row.route ? (
                  <DaoMandateRouteButton
                    route={row.route}
                    onRouteAction={onRouteAction}
                    variant="secondary"
                    size="compact"
                  />
                ) : (
                  <span className="daoReadinessLedgerRow__reservedAction" aria-hidden="true" />
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="daoReadinessLedger__empty">No visible readiness rows.</div>
      )}
    </section>
  );
}
