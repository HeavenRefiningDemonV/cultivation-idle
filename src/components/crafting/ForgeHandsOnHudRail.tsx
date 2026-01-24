import classNames from 'classnames';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import './ForgeHandsOnHudRail.scss';

export type ForgeHandsOnHudRailStep = {
  id: string;
  label: string;
  status: 'done' | 'active' | 'pending';
};

export type ForgeHandsOnHudRailMeter = {
  id: string;
  label: string;
  value: number;
};

export interface ForgeHandsOnHudRailProps {
  blueprintName?: string;
  stepTitle: string;
  stepIndex: number;
  stepCount: number;
  instruction: string;
  metaLines: string[];
  actionHint?: string;
  meters: ForgeHandsOnHudRailMeter[];
  overallScore: number;
  steps: ForgeHandsOnHudRailStep[];
  stepsExpanded: boolean;
  onToggleSteps: () => void;
  onOpenDetails?: () => void;
  onLeave: () => void;
  onAbort: () => void;
  controls?: ReactNode;
  statusMessage?: string | null;
}

export function ForgeHandsOnHudRail({
  blueprintName,
  stepTitle,
  stepIndex,
  stepCount,
  instruction,
  metaLines,
  actionHint,
  meters,
  overallScore,
  steps,
  stepsExpanded,
  onToggleSteps,
  onOpenDetails,
  onLeave,
  onAbort,
  controls,
  statusMessage,
}: ForgeHandsOnHudRailProps) {
  const detailsDisabled = !onOpenDetails;
  const detailsTitle = detailsDisabled ? 'Select a blueprint to view details.' : 'Open full details';
  const instructionRef = useRef<HTMLDivElement | null>(null);
  const [instructionTruncated, setInstructionTruncated] = useState(false);
  const overallPercent = Math.round(overallScore * 100);

  useEffect(() => {
    const element = instructionRef.current;
    if (!element) return undefined;

    const updateTruncation = () => {
      setInstructionTruncated(element.scrollHeight > element.clientHeight + 1);
    };

    updateTruncation();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateTruncation);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateTruncation);
    return () => window.removeEventListener('resize', updateTruncation);
  }, [instruction]);

  const meterRows = [
    { id: 'overall', label: 'Overall', value: overallScore, showValue: true },
    ...meters.map((meter) => ({ ...meter, showValue: false })),
  ];

  return (
    <div className="forgeHandsOnHudRail">
      <div className="forgeHandsOnHudRail__header">
        <div className="forgeHandsOnHudRail__titleBlock">
          <div className="forgeHandsOnHudRail__titleMeta">
            Step {stepIndex}/{stepCount}
          </div>
          <div className="forgeHandsOnHudRail__title">{stepTitle}</div>
          {blueprintName && <div className="forgeHandsOnHudRail__subtitle">{blueprintName}</div>}
        </div>
        <div className="forgeHandsOnHudRail__headerActions">
          <button
            type="button"
            className="forgeHandsOnHudRail__ghostButton"
            onClick={onOpenDetails}
            disabled={detailsDisabled}
            title={detailsTitle}
          >
            Details
          </button>
          <button type="button" className="forgeHandsOnHudRail__ghostButton" onClick={onToggleSteps}>
            {stepsExpanded ? 'Hide steps' : 'Steps'}
          </button>
        </div>
      </div>

      <div className="forgeHandsOnHudRail__body">
        <div className="forgeHandsOnHudRail__card">
          <div className="forgeHandsOnHudRail__instructionRow">
            <div ref={instructionRef} className="forgeHandsOnHudRail__instruction" title={instruction}>
              {instruction}
            </div>
            {instructionTruncated && onOpenDetails && (
              <button
                type="button"
                className="forgeHandsOnHudRail__moreLink"
                onClick={onOpenDetails}
              >
                More
              </button>
            )}
          </div>
          {metaLines.length > 0 && (
            <div className="forgeHandsOnHudRail__meta">
              {metaLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          )}
          {actionHint && <div className="forgeHandsOnHudRail__hint">{actionHint}</div>}
        </div>

        {controls && <div className="forgeHandsOnHudRail__controls">{controls}</div>}

        <div className="forgeHandsOnHudRail__card">
          <div className="forgeHandsOnHudRail__meters">
            {meterRows.map((meter) => {
              const percent = Math.round(meter.value * 100);
              return (
                <div
                  key={meter.id}
                  className={classNames('forgeHandsOnHudRail__meterRow', {
                    'forgeHandsOnHudRail__meterRow--overall': meter.id === 'overall',
                  })}
                >
                  <div className="forgeHandsOnHudRail__meterLabel">
                    <span
                      className={classNames(
                        'forgeHandsOnHudRail__meterIcon',
                        `forgeHandsOnHudRail__meterIcon--${meter.id}`,
                      )}
                      aria-hidden="true"
                    />
                    <span>{meter.label}</span>
                  </div>
                  <div className="forgeHandsOnHudRail__meterTrack">
                    <div className="forgeHandsOnHudRail__meterFill" style={{ width: `${percent}%` }} />
                  </div>
                  {meter.showValue && (
                    <div className="forgeHandsOnHudRail__meterValue">{overallPercent}%</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="forgeHandsOnHudRail__actions">
          <button type="button" className="worldScreenModuleButton" onClick={onLeave}>
            Leave
          </button>
          <button type="button" className="worldScreenModuleButton" onClick={onAbort}>
            Abort
          </button>
        </div>

        {statusMessage && <div className="forgeHandsOnHudRail__status">{statusMessage}</div>}

        {stepsExpanded && (
          <div className="forgeHandsOnHudRail__steps">
            <div className="forgeHandsOnHudRail__stepsTitle">Steps</div>
            <div className="forgeHandsOnHudRail__stepsList">
              {steps.map((step) => (
                <span
                  key={step.id}
                  className={classNames('forgeHandsOnHudRail__stepPill', `forgeHandsOnHudRail__stepPill--${step.status}`)}
                >
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
