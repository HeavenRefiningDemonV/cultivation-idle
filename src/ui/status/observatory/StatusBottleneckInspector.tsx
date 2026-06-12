import type {
  StatusCauseRowSurface,
  StatusLedgerActionSurface,
  StatusLedgerFactRow,
  StatusLedgerRequirementRow,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusBottleneckInspectorSurface,
  StatusBottleneckTalismanSlipSurface,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';

export interface StatusBottleneckInspectorProps {
  inspector: StatusBottleneckInspectorSurface;
  slip: StatusBottleneckTalismanSlipSurface | null;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

type InspectorRow = StatusLedgerRequirementRow | StatusLedgerFactRow | StatusCauseRowSurface;

function rowValue(row: InspectorRow): string {
  if ('consequence' in row) return row.value || row.consequence || row.detail;
  return row.value ?? row.detail;
}

function rowSource(row: InspectorRow): string {
  if ('sourceSystem' in row) return row.sourceSystem;
  return row.sourceLabel;
}

export function StatusBottleneckInspector({
  inspector,
  slip,
  onAction,
}: StatusBottleneckInspectorProps) {
  const selectedSlip = slip;
  const selectedId = selectedSlip?.id ?? inspector.selectedSlipId ?? 'none';
  const rows = selectedSlip?.detailRows ?? inspector.detailRows;
  const action = selectedSlip?.routeAction ?? inspector.routeAction;
  const disabled = !action || action.disabled || !onAction;

  return (
    <aside
      className="statusBottleneckInspector"
      data-testid="status-bottleneck-inspector"
      data-selected-slip-id={selectedId}
      data-source-family={selectedSlip?.sourceFamily ?? inspector.sourceFamily ?? 'none'}
      data-has-route={action ? 'true' : 'false'}
      data-tone={selectedSlip?.tone ?? inspector.tone}
      aria-live="polite"
      aria-label="Selected bottleneck slip inspector"
    >
      <div className="statusBottleneckInspector__seal" aria-hidden="true" />
      <InkWaxSeal chars="檢視" size={36} variant="cinnabar" className="statusBottleneckInspector__chop" />
      <div className="statusBottleneckInspector__title">
        <span>Expanded Inspector</span>
        <h3>{selectedSlip?.title ?? inspector.title}</h3>
        <p>{selectedSlip?.detail ?? inspector.detail}</p>
      </div>

      <div className="statusBottleneckInspector__meta">
        <span>Source</span>
        <strong>{selectedSlip?.sourceLabel ?? inspector.sourceLabel}</strong>
        <small>{selectedSlip?.priorityLabel ?? selectedSlip?.stateLabel ?? inspector.priorityLabel ?? inspector.stateLabel ?? 'Observed'}</small>
      </div>

      <div className="statusBottleneckInspector__rows" aria-label="Selected slip detail rows">
        {rows.slice(0, 4).map((row) => (
          <div key={row.id} className="statusBottleneckInspector__row" data-tone={'tone' in row ? row.tone : 'info'}>
            <span>{row.label}</span>
            <strong>{rowValue(row)}</strong>
            <small>{rowSource(row)}</small>
          </div>
        ))}
      </div>

      {action ? (
        <button
          type="button"
          className="statusBottleneckInspector__route"
          data-action-id={action.id}
          data-destination-kind={action.target.kind}
          data-disabled={disabled ? 'true' : 'false'}
          disabled={disabled}
          aria-disabled={disabled ? 'true' : undefined}
          title={action.disabled ? action.disabledReason ?? action.detail : action.detail}
          onClick={() => {
            if (!disabled && slip?.routeAction) onAction?.(slip.routeAction);
            else if (!disabled && action) onAction?.(action);
          }}
        >
          <span>Route</span>
          <strong>{action.label}</strong>
          <small>{action.destinationLabel}</small>
        </button>
      ) : null}
    </aside>
  );
}
