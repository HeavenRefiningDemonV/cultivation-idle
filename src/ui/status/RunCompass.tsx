import classNames from 'classnames';
import type { RunCompassActionLine, RunCompassSurface } from '../../systems/ui/runCompass/index.js';
import { PaperChip } from '../ink/PaperChip.js';
import { InkPanel } from '../ink/InkPanel.js';
import { RunCompassSection } from './RunCompassSection.js';
import './RunCompass.scss';

export type RunCompassTone = 'paper' | 'ink';

export interface RunCompassProps {
  surface: RunCompassSurface | null;
  tone?: RunCompassTone;
  density?: 'regular' | 'dense';
  className?: string;
  onAction?: (action: RunCompassActionLine) => void;
}

function toneForLine(tone: string | undefined) {
  if (tone === 'warning') return 'danger' as const;
  if (tone === 'success') return 'success' as const;
  return 'neutral' as const;
}

function renderActionButton(action: RunCompassActionLine, onAction?: (action: RunCompassActionLine) => void) {
  if (!onAction || action.blocked || !action.target) return null;
  return (
    <button type="button" className="runCompassAction__button" onClick={() => onAction(action)}>
      Open {action.destinationLabel}
    </button>
  );
}

export function RunCompass({ surface, tone = 'paper', density = 'regular', className, onAction }: RunCompassProps) {
  const content = !surface ? (
    <div className="runCompassFallback">Mandate route unavailable.</div>
  ) : (
    <>
      <RunCompassSection title="Mandate Milestone">
        <div className="runCompassMilestone">
          <div className="runCompassMilestone__header">
            <div>
              <div className="runCompassMilestone__title">{surface.milestone.title}</div>
              <div className="runCompassMilestone__detail">{surface.milestone.detail}</div>
            </div>
            <PaperChip text={surface.milestone.readinessLabel} tone={surface.milestone.readinessLabel === 'Ready' ? 'success' : 'neutral'} />
          </div>
          <div className="runCompassMilestone__context">{surface.milestone.contextLine}</div>
          {surface.milestone.prestigeLine ? <div className="runCompassMilestone__prestige">{surface.milestone.prestigeLine}</div> : null}
        </div>
      </RunCompassSection>

      <RunCompassSection title="Readiness">
        <div className="runCompassReadinessHead">
          <PaperChip text={surface.readiness.label} tone={surface.readiness.label === 'Ready' ? 'success' : 'neutral'} />
          {surface.readiness.diagnosisLabel ? <div className="runCompassReadinessHead__diagnosis">{surface.readiness.diagnosisLabel}</div> : null}
        </div>
        <div className="runCompassReadinessDetail">{surface.readiness.detail}</div>
        <div className="runCompassInfoList runCompassInfoList--fixed3">
          {surface.readiness.rows.map((row) => (
            <div key={row.id} className={classNames('runCompassInfoRow', { 'is-placeholder': Boolean(row.placeholder) })}>
              <div className="runCompassInfoRow__main">
                <div className="runCompassInfoRow__label">{row.label}</div>
                <div className="runCompassInfoRow__detail">{row.detail}</div>
              </div>
              <PaperChip text={row.placeholder ? 'Hold' : row.label} tone={toneForLine(row.tone)} variant="tag" />
            </div>
          ))}
        </div>
      </RunCompassSection>

      <RunCompassSection title="Proof Ledger">
        <div className="runCompassInfoList runCompassInfoList--fixed3">
          {surface.missingRequirements.map((row) => (
            <div key={row.id} className={classNames('runCompassInfoRow', { 'is-placeholder': Boolean(row.placeholder) })}>
              <div className="runCompassInfoRow__main">
                <div className="runCompassInfoRow__label">{row.label}</div>
                <div className="runCompassInfoRow__detail">{row.detail}</div>
              </div>
              <PaperChip text={row.placeholder ? 'Queued' : row.tone === 'success' ? 'Clear' : 'Watch'} tone={toneForLine(row.tone)} variant="tag" />
            </div>
          ))}
        </div>
      </RunCompassSection>

      <RunCompassSection title="Mandate Routes">
        <div className="runCompassActionList runCompassActionList--fixed3">
          {surface.bestNextActions.map((action) => (
            <div key={action.id} className={classNames('runCompassAction', { 'is-blocked': action.blocked })}>
              <div className="runCompassAction__main">
                <div className="runCompassAction__top">
                  <div className="runCompassAction__label">{action.label}</div>
                  <PaperChip text={action.destinationLabel} variant="tag" tone={action.blocked ? 'danger' : 'ink'} />
                </div>
                <div className="runCompassAction__why">{action.why}</div>
              </div>
              {renderActionButton(action, onAction)}
            </div>
          ))}
        </div>
      </RunCompassSection>

      <RunCompassSection title="Safety Net">
        <div className="runCompassSafetyNet">
          <div className="runCompassSafetyNet__title">{surface.safetyNet.title}</div>
          <div className="runCompassSafetyNet__line">{surface.safetyNet.progressLine}</div>
          <div className="runCompassSafetyNet__line">{surface.safetyNet.costLine}</div>
          <div className="runCompassSafetyNet__line">{surface.safetyNet.reserveLine}</div>
          <div className="runCompassSafetyNet__detail">{surface.safetyNet.detailLine}</div>
        </div>
      </RunCompassSection>
    </>
  );

  const classes = classNames('runCompass', `runCompass--${tone}`, `runCompass--${density}`, className);
  if (tone === 'ink') {
    return <InkPanel className={classes}>{content}</InkPanel>;
  }
  return <div className={classes}>{content}</div>;
}
