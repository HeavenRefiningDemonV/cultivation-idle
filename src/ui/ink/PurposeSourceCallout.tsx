import classNames from 'classnames';
import { PaperCard } from './PaperCard.js';
import { PaperChip } from './PaperChip.js';
import type { PurposeSourceSurface } from '../../systems/economy/purposeSourceSurface.js';
import './PurposeSourceCallout.scss';

interface PurposeSourceCalloutProps {
  surface: PurposeSourceSurface | null;
  className?: string;
  compact?: boolean;
}

function SourceLine({ label, line }: { label: string; line?: string }) {
  return (
    <div className="purposeSourceCallout__line">
      <span className="purposeSourceCallout__lineLabel">{label}</span>
      {line ? <span className="purposeSourceCallout__lineText">{line}</span> : null}
    </div>
  );
}

export function PurposeSourceCallout({ surface, className, compact = false }: PurposeSourceCalloutProps) {
  if (!surface) return null;

  return (
    <PaperCard
      variant="tray"
      className={classNames('purposeSourceCallout', compact && 'purposeSourceCallout--compact', className)}
    >
      <div className="purposeSourceCallout__chips">
        <PaperChip variant="tag" tone="ink" text={surface.purposeTag} />
        {surface.primarySourceLabel ? <PaperChip variant="pill" tone="neutral" text={surface.primarySourceLabel} /> : null}
      </div>
      <div className="purposeSourceCallout__body">{surface.purposeLine}</div>
      {surface.primarySourceLine ? <SourceLine label="Primary source" line={surface.primarySourceLine} /> : null}
      {surface.secondarySourceLabel ? <SourceLine label={surface.secondarySourceLabel} line={surface.secondarySourceLine} /> : null}
      {surface.boundaryLine ? <div className="purposeSourceCallout__boundary">{surface.boundaryLine}</div> : null}
    </PaperCard>
  );
}
