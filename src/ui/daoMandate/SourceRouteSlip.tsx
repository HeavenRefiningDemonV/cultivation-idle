import { useId } from 'react';
import classNames from 'classnames';

import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoSourceMapEntry,
  DaoSourceOption,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import {
  getDaoMandateMotionClassName,
  sanitizeDomIdPart,
} from './daoMandateUiFormatters.js';
import './SourceRouteSlip.scss';

export interface SourceRouteSlipProps {
  entries: DaoSourceMapEntry[];
  title?: string;
  profile?: DaoMandateGuidanceProfile;
  variant?: 'compact' | 'default' | 'expanded';
  onRouteAction?: DaoMandateRouteActionHandler;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

function SourceOptionView({
  option,
  onRouteAction,
}: {
  option: DaoSourceOption;
  onRouteAction?: DaoMandateRouteActionHandler;
}) {
  return (
    <li className={classNames('daoSourceRouteSlipOption', { 'daoSourceRouteSlipOption--locked': Boolean(option.lockedReason) })}>
      <div className="daoSourceRouteSlipOption__main">
        <strong>{option.label}</strong>
        <span>{option.detail}</span>
        {option.lockedReason ? <span className="daoSourceRouteSlipOption__locked">{option.lockedReason}</span> : null}
      </div>
      <div className="daoSourceRouteSlipOption__route">
        {option.route ? (
          <DaoMandateRouteButton
            route={option.route}
            onRouteAction={onRouteAction}
            variant="inline"
            size="compact"
            disabled={Boolean(option.lockedReason)}
            disabledReason={option.lockedReason}
          />
        ) : (
          <span className="daoSourceRouteSlipOption__noRoute">No direct route</span>
        )}
      </div>
    </li>
  );
}

export function SourceRouteSlip({
  entries,
  title = 'Source Route Slip',
  profile = 'elder',
  variant = 'default',
  onRouteAction,
  motionMode = 'medium',
  className,
}: SourceRouteSlipProps) {
  const reactId = useId();
  const titleId = `dao-source-route-slip-${sanitizeDomIdPart(title)}-${sanitizeDomIdPart(reactId)}`;
  const showFallbacks = variant === 'expanded';

  return (
    <section
      className={classNames(
        'daoSourceRouteSlip',
        `daoSourceRouteSlip--${variant}`,
        `daoSourceRouteSlip--profile-${profile}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-labelledby={titleId}
    >
      <header className="daoSourceRouteSlip__header">
        <span className="daoSourceRouteSlip__eyebrow">Source and sink</span>
        <h3 id={titleId} className="daoSourceRouteSlip__title">{title}</h3>
      </header>

      {entries.length === 0 ? (
        <div className="daoSourceRouteSlip__empty">No visible source routes.</div>
      ) : (
        <ul className="daoSourceRouteSlip__entries">
          {entries.map((entry) => {
            const renderFallbacks = showFallbacks || entry.bestSources.length === 0;
            return (
              <li key={entry.id} className="daoSourceRouteSlipEntry">
                <div className="daoSourceRouteSlipEntry__summary">
                  <div>
                    <span className="daoSourceRouteSlipEntry__label">Needed</span>
                    <strong>{entry.neededThingLabel}</strong>
                  </div>
                  <div>
                    <span className="daoSourceRouteSlipEntry__label">Sink</span>
                    <span>{entry.sinkLabel}</span>
                  </div>
                  {variant !== 'compact' && entry.expectedImpactLabel ? (
                    <div>
                      <span className="daoSourceRouteSlipEntry__label">Impact</span>
                      <span>{entry.expectedImpactLabel}</span>
                    </div>
                  ) : null}
                  <div className="daoSourceRouteSlipEntry__route">
                    {entry.route ? (
                      <DaoMandateRouteButton
                        route={entry.route}
                        onRouteAction={onRouteAction}
                        variant="secondary"
                        size="compact"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="daoSourceRouteSlipEntry__sources">
                  {entry.bestSources.length > 0 ? (
                    <section aria-label={`${entry.neededThingLabel} best sources`}>
                      <h4>Best Source</h4>
                      <ul>
                        {entry.bestSources.map((option) => (
                          <SourceOptionView key={option.id} option={option} onRouteAction={onRouteAction} />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {renderFallbacks && entry.fallbackSources.length > 0 ? (
                    <section aria-label={`${entry.neededThingLabel} fallback sources`}>
                      <h4>Fallback Source</h4>
                      <ul>
                        {entry.fallbackSources.map((option) => (
                          <SourceOptionView key={option.id} option={option} onRouteAction={onRouteAction} />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
