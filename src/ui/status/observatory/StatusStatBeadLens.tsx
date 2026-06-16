import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type { StatusObservatoryStatNodeSurface } from '../../../systems/ui/status/statusObservatoryTypes.js';
import {
  STATUS_OBSERVATORY_STAT_CONTRIBUTION_LABELS,
  STATUS_OBSERVATORY_STAT_LENS_STATE_LABELS,
  STATUS_OBSERVATORY_STAT_NODE_STATE_LABELS,
  STATUS_OBSERVATORY_STAT_PATH_LABELS,
} from '../../../systems/ui/status/statusObservatoryPresentation.js';

export interface StatusStatBeadLensProps {
  node: StatusObservatoryStatNodeSurface;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

function pathLabel(node: StatusObservatoryStatNodeSurface): string {
  return STATUS_OBSERVATORY_STAT_PATH_LABELS[node.path]?.shortLabel ?? node.path;
}

function lensStateLabel(node: StatusObservatoryStatNodeSurface): string {
  if (node.weakLink) return 'Weak Link';
  return STATUS_OBSERVATORY_STAT_LENS_STATE_LABELS[node.nodeState] ?? node.nodeState.replace(/_/g, ' ');
}

function stateDetail(node: StatusObservatoryStatNodeSurface): string {
  if (node.weakLink && node.weakReason) return node.weakReason;
  return STATUS_OBSERVATORY_STAT_NODE_STATE_LABELS[node.nodeState]?.detail ?? node.detail;
}

function valueLabel(node: StatusObservatoryStatNodeSurface): string {
  if (node.cap > 0) return `${node.currentRating} / ${node.cap}`;
  return `${node.currentRating}`;
}

function sourceLabel(node: StatusObservatoryStatNodeSurface): string {
  if (node.sourceSystems.length > 0) return node.sourceSystems.join(' / ');
  const rowSource = node.detailRows.find((row) => row.sourceLabel)?.sourceLabel;
  return rowSource ?? 'Status analysis';
}

function routeButtonLabel(action: StatusLedgerActionSurface): string {
  return action.destinationLabel ? `${action.label} - ${action.destinationLabel}` : action.label;
}

export function StatusStatBeadLens({ node, onAction }: StatusStatBeadLensProps) {
  const action = node.routeAction;
  const disabled = !action || action.disabled || !onAction;
  const contributionLabel = STATUS_OBSERVATORY_STAT_CONTRIBUTION_LABELS[node.contributionState];

  return (
    <aside
      className="statusStatBeadLens"
      data-testid="status-stat-bead-lens"
      data-stat-id={node.id}
      data-node-state={node.nodeState}
      data-contribution-state={node.contributionState}
      data-weak-link={node.weakLink ? 'true' : 'false'}
      aria-label={`Stat bead lens for ${node.displayName}`}
      aria-live="polite"
    >
      <div className="statusStatBeadLens__seal" aria-hidden="true" data-weak-link={node.weakLink ? 'true' : 'false'} />
      <div className="statusStatBeadLens__title">
        <span>Stat Bead Lens</span>
        <h3>{node.displayName}</h3>
      </div>

      <div className="statusStatBeadLens__facts" aria-label="Selected stat facts">
        <div>
          <span>Path</span>
          <strong>{pathLabel(node)}</strong>
        </div>
        <div>
          <span>State</span>
          <strong>{lensStateLabel(node)}</strong>
        </div>
        <div>
          <span>Current Value</span>
          <strong>{valueLabel(node)}</strong>
        </div>
        <div>
          <span>Contribution</span>
          <strong>{contributionLabel}</strong>
        </div>
      </div>

      <div className="statusStatBeadLens__copy">
        <span>Effect</span>
        <p>{node.effectSummary}</p>
      </div>
      <div className="statusStatBeadLens__copy">
        <span>Source</span>
        <p>{sourceLabel(node)}</p>
      </div>
      <div className="statusStatBeadLens__copy">
        <span>Why it matters now</span>
        <p>{stateDetail(node)}</p>
      </div>

      {action ? (
        <button
          type="button"
          className="statusStatBeadLens__route"
          data-tone={action.tone}
          disabled={disabled}
          aria-disabled={disabled ? 'true' : undefined}
          title={action.disabled ? action.disabledReason ?? action.detail : action.detail}
          onClick={() => {
            if (!disabled && onAction) onAction(action);
          }}
        >
          <strong>{action.label}</strong>
          <small>{routeButtonLabel(action)}</small>
        </button>
      ) : null}
    </aside>
  );
}
