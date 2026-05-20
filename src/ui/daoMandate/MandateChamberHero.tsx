import { useId } from 'react';
import classNames from 'classnames';

import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateSurfaceV1,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import { DaoMandateStatusSeal } from './DaoMandateStatusSeal.js';
import {
  getDaoMandateMotionClassName,
  getDaoMandateProfileLabel,
  getDaoObstructionSeverityTone,
  sanitizeDomIdPart,
} from './daoMandateUiFormatters.js';
import './MandateChamberHero.scss';

export interface MandateChamberHeroProps {
  surface: DaoMandateSurfaceV1;
  motionMode?: DaoMandateEffectiveMotionMode;
  onRouteAction?: DaoMandateRouteActionHandler;
  className?: string;
}

export function MandateChamberHero({
  surface,
  motionMode = 'medium',
  onRouteAction,
  className,
}: MandateChamberHeroProps) {
  const reactId = useId();
  const titleId = `dao-mandate-chamber-${sanitizeDomIdPart(surface.milestone.id)}-${sanitizeDomIdPart(reactId)}`;
  const realmLine = surface.milestone.nextRealmLabel
    ? `${surface.milestone.currentRealmLabel} to ${surface.milestone.nextRealmLabel}`
    : surface.milestone.currentRealmLabel;
  const secondaryRoutes = surface.secondaryRoutes.slice(0, 3);

  return (
    <section
      className={classNames(
        'daoMandateChamberHero',
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-labelledby={titleId}
    >
      <div className="daoMandateChamberHero__header">
        <div className="daoMandateChamberHero__titleBlock">
          <span className="daoMandateChamberHero__eyebrow">Current Mandate</span>
          <h2 id={titleId} className="daoMandateChamberHero__title">
            {surface.milestone.label}
          </h2>
          <p className="daoMandateChamberHero__profile">
            {getDaoMandateProfileLabel(surface.meta.guidanceProfile)} - confidence {surface.meta.confidence}
          </p>
        </div>
        <DaoMandateStatusSeal
          tone={getDaoObstructionSeverityTone(surface.obstruction.severity)}
          label={surface.obstruction.label}
          detail={surface.obstruction.detail}
          motionMode={motionMode}
          animated={surface.obstruction.severity === 'success'}
        />
      </div>

      <div className="daoMandateChamberHero__grid">
        <div className="daoMandateChamberHero__milestone">
          <span className="daoMandateChamberHero__label">Milestone</span>
          <strong>{realmLine}</strong>
          <p>{surface.milestone.detail}</p>
          {surface.milestone.chapterLine ? <span>{surface.milestone.chapterLine}</span> : null}
        </div>

        <div className="daoMandateChamberHero__obstruction">
          <span className="daoMandateChamberHero__label">Primary Obstruction</span>
          <strong>{surface.obstruction.label}</strong>
          <p>{surface.obstruction.detail}</p>
        </div>

        <div className="daoMandateChamberHero__route">
          <span className="daoMandateChamberHero__label">Primary Route</span>
          <DaoMandateRouteButton
            route={surface.primaryRoute}
            onRouteAction={onRouteAction}
            variant="primary"
            size="large"
            showDestination
          />
          {surface.primaryRoute.expectedDeltaLabel ? (
            <p className="daoMandateChamberHero__delta">{surface.primaryRoute.expectedDeltaLabel}</p>
          ) : null}
        </div>
      </div>

      {secondaryRoutes.length > 0 ? (
        <div className="daoMandateChamberHero__secondary" aria-label="Secondary Mandate routes">
          {secondaryRoutes.map((route) => (
            <DaoMandateRouteButton
              key={route.id}
              route={route}
              onRouteAction={onRouteAction}
              variant="secondary"
              size="compact"
              showDestination
            />
          ))}
        </div>
      ) : null}

      {surface.meta.guidanceProfile === 'jade' ? (
        <div className="daoMandateChamberHero__footer">
          Sources: {surface.meta.sourceIds.join(', ') || 'None'}
        </div>
      ) : null}
    </section>
  );
}
