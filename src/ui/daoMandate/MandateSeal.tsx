import { useId } from 'react';
import classNames from 'classnames';

import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoMandateSurfaceV1,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import { DaoMandateStatusSeal } from './DaoMandateStatusSeal.js';
import {
  getDaoMandateMotionClassName,
  getDaoObstructionSeverityTone,
  sanitizeDomIdPart,
} from './daoMandateUiFormatters.js';
import './MandateSeal.scss';

export interface MandateSealProps {
  surface: DaoMandateSurfaceV1;
  variant?: 'compact' | 'module' | 'default';
  profile?: DaoMandateGuidanceProfile;
  motionMode?: DaoMandateEffectiveMotionMode;
  onRouteAction?: DaoMandateRouteActionHandler;
  className?: string;
}

export function MandateSeal({
  surface,
  variant = 'default',
  profile = surface.meta.guidanceProfile,
  motionMode = 'medium',
  onRouteAction,
  className,
}: MandateSealProps) {
  const reactId = useId();
  const titleId = `dao-mandate-seal-${sanitizeDomIdPart(surface.milestone.id)}-${sanitizeDomIdPart(reactId)}`;
  const compact = variant === 'compact' || profile === 'sealed';
  const showDetails = !compact;
  const showJadeEvidence = profile === 'jade';
  const realmLine = surface.milestone.nextRealmLabel
    ? `${surface.milestone.currentRealmLabel} to ${surface.milestone.nextRealmLabel}`
    : surface.milestone.currentRealmLabel;

  return (
    <section
      className={classNames(
        'daoMandateSeal',
        `daoMandateSeal--${variant}`,
        `daoMandateSeal--profile-${profile}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-labelledby={titleId}
    >
      <div className="daoMandateSeal__header">
        <div className="daoMandateSeal__titleBlock">
          <span className="daoMandateSeal__eyebrow">
            {variant === 'module' ? 'Local Mandate' : 'Current Mandate'}
          </span>
          <h3 id={titleId} className="daoMandateSeal__title">
            {surface.milestone.label}
          </h3>
        </div>
        <DaoMandateStatusSeal
          tone={getDaoObstructionSeverityTone(surface.obstruction.severity)}
          label={surface.obstruction.label}
          compact={compact}
          motionMode={motionMode}
        />
      </div>

      <div className="daoMandateSeal__body">
        <div className="daoMandateSeal__main">
          <p className="daoMandateSeal__milestone">{showDetails ? surface.milestone.detail : realmLine}</p>
          <p className="daoMandateSeal__obstruction">
            <strong>Obstruction:</strong> {surface.obstruction.label}
            {showDetails ? <span> - {surface.obstruction.detail}</span> : null}
          </p>
          {showDetails && surface.milestone.chapterLine ? (
            <p className="daoMandateSeal__context">{surface.milestone.chapterLine}</p>
          ) : null}
          {showDetails && surface.primaryRoute.expectedDeltaLabel ? (
            <p className="daoMandateSeal__delta">{surface.primaryRoute.expectedDeltaLabel}</p>
          ) : null}
        </div>
        <div className="daoMandateSeal__route">
          <DaoMandateRouteButton
            route={surface.primaryRoute}
            onRouteAction={onRouteAction}
            variant="primary"
            size={compact ? 'compact' : 'default'}
            showDestination={!compact}
          />
        </div>
      </div>

      {showJadeEvidence ? (
        <details className="daoMandateSeal__evidence">
          <summary>Mandate evidence</summary>
          <div className="daoMandateSeal__evidenceBody">
            <span>Confidence: {surface.meta.confidence}</span>
            <span>Sources: {surface.meta.sourceIds.join(', ') || 'None'}</span>
            {surface.obstruction.evidenceIds.length > 0 ? (
              <span>Obstruction proof: {surface.obstruction.evidenceIds.join(', ')}</span>
            ) : null}
          </div>
        </details>
      ) : null}
    </section>
  );
}
