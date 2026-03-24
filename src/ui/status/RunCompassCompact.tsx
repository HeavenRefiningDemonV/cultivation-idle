import classNames from 'classnames';
import type { RunCompassActionLine, RunCompassCompactSurface } from '../../systems/ui/runCompass/index.js';
import { PaperChip } from '../ink/PaperChip.js';
import './RunCompass.scss';

export type RunCompassTone = 'paper' | 'ink';

export interface RunCompassCompactProps {
  surface: RunCompassCompactSurface | null;
  tone?: RunCompassTone;
  className?: string;
  onAction?: (action: RunCompassActionLine) => void;
}

export function RunCompassCompact({ surface, tone = 'paper', className }: RunCompassCompactProps) {
  return (
    <div className={classNames('runCompassCompact', `runCompassCompact--${tone}`, className)}>
      {!surface ? (
        <div className="runCompassCompact__fallback">Run Compass unavailable.</div>
      ) : (
        <>
          <div className="runCompassCompact__line runCompassCompact__line--headline">
            <span className="runCompassCompact__title">{surface.milestoneLine}</span>
            <PaperChip text={surface.readinessLabel} variant="tag" tone={surface.readinessLabel === 'Ready' ? 'success' : 'neutral'} />
          </div>
          <div className="runCompassCompact__line">{surface.blockerLine}</div>
          <div className="runCompassCompact__line">{surface.actionLine}</div>
        </>
      )}
    </div>
  );
}
