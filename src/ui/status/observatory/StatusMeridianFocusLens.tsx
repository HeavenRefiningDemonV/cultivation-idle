import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusMeridianFocusLensSurface,
  StatusMeridianOrganSurface,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import {
  STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS,
  STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS,
} from '../../../systems/ui/status/statusObservatoryPresentation.js';
import { StatusFocusLens } from './StatusFocusLens.js';

export interface StatusMeridianFocusLensProps {
  organ: StatusMeridianOrganSurface;
  lens: StatusMeridianFocusLensSurface;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

function uniqueSources(sources: readonly string[]): string[] {
  return [...new Set(sources.filter((source) => source.trim().length > 0))];
}

function sourceLabelsFor(organ: StatusMeridianOrganSurface, lens: StatusMeridianFocusLensSurface): string[] {
  if (lens.selectedOrganId === organ.id && lens.sources.length > 0) {
    return uniqueSources(lens.sources);
  }
  return uniqueSources(organ.detailRows.map((row) => row.sourceSystem));
}

function valueFor(organ: StatusMeridianOrganSurface, lens: StatusMeridianFocusLensSurface): string {
  return lens.selectedOrganId === organ.id ? lens.value : organ.valueLabel;
}

function titleFor(organ: StatusMeridianOrganSurface, lens: StatusMeridianFocusLensSurface): string {
  if (lens.selectedOrganId === organ.id) return lens.label;
  const strongestDetail = organ.detailRows[0];
  return strongestDetail ? `${organ.title}: ${strongestDetail.label}` : organ.title;
}

function consequenceFor(organ: StatusMeridianOrganSurface, lens: StatusMeridianFocusLensSurface): string {
  return lens.selectedOrganId === organ.id ? lens.consequence : organ.consequence;
}

function routeFor(
  organ: StatusMeridianOrganSurface,
  lens: StatusMeridianFocusLensSurface,
): StatusLedgerActionSurface | null {
  return lens.selectedOrganId === organ.id ? lens.route : organ.route;
}

function handleLensAction(
  action: StatusLedgerActionSurface,
  onAction: ((action: StatusLedgerActionSurface) => void) | undefined,
) {
  if (onAction) onAction(action);
}

export function StatusMeridianFocusLens({ organ, lens, onAction }: StatusMeridianFocusLensProps) {
  const stateLabel = STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS[organ.state];

  return (
    <div
      className="statusMeridianVesselCompass__focusLens"
      data-testid="status-meridian-focus-lens"
      data-selected-organ-id={organ.id}
      data-organ-state={organ.state}
      aria-live="polite"
    >
      <StatusFocusLens
        eyebrow={STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS.eyebrow}
        title={titleFor(organ, lens)}
        valueLabel={STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS.valueLabel}
        value={valueFor(organ, lens)}
        consequenceLabel={STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS.consequenceLabel}
        consequence={consequenceFor(organ, lens)}
        routeLabel={STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS.routeLabel}
        action={routeFor(organ, lens)}
        sourcesLabel={STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS.sourcesLabel}
        sources={sourceLabelsFor(organ, lens)}
        tone={stateLabel.tone}
        onAction={onAction ? (action) => handleLensAction(action, onAction) : undefined}
      />
    </div>
  );
}
