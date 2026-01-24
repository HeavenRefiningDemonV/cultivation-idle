import classNames from 'classnames';
import type { ReactNode } from 'react';

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
          <div className="forgeHandsOnHudRail__instruction" title={instruction}>
            {instruction}
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
          <div className="forgeHandsOnHudRail__meterHeader">
            <div className="forgeHandsOnHudRail__meterLabel">Overall</div>
            <div className="forgeHandsOnHudRail__meterValue">{Math.round(overallScore * 100)}%</div>
          </div>
          <div className="forgeHandsOnHudRail__meterBar">
            <div className="forgeHandsOnHudRail__meterFill" style={{ width: `${Math.round(overallScore * 100)}%` }} />
          </div>
          <div className="forgeHandsOnHudRail__meterGrid">
            {meters.map((meter) => (
              <div key={meter.id} className="forgeHandsOnHudRail__meterRow">
                <div>{meter.label}</div>
                <div className="forgeHandsOnHudRail__miniBar">
                  <div
                    className="forgeHandsOnHudRail__miniFill"
                    style={{ width: `${Math.round(meter.value * 100)}%` }}
                  />
                </div>
                <div className="forgeHandsOnHudRail__meterValue">{Math.round(meter.value * 100)}%</div>
              </div>
            ))}
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
