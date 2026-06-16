import type { StatusLedgerActionSurface, StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';

export interface StatusFocusLensProps {
  testId?: string;
  className?: string;
  eyebrow: string;
  title: string;
  valueLabel: string;
  value: string;
  consequenceLabel: string;
  consequence: string;
  routeLabel: string;
  action: StatusLedgerActionSurface | null;
  sourcesLabel: string;
  sources: readonly string[];
  tone: StatusLedgerTone;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

function routeButtonText(action: StatusLedgerActionSurface): string {
  return action.destinationLabel ? `${action.label} / ${action.destinationLabel}` : action.label;
}

export function StatusFocusLens({
  testId,
  className = '',
  eyebrow,
  title,
  value,
  consequence,
  routeLabel,
  action,
  sourcesLabel,
  sources,
  tone,
  onAction,
}: StatusFocusLensProps) {
  const disabled = !action || action.disabled || !onAction;
  const sourceLabels = sources.length > 0 ? sources : ['Status Analysis'];

  return (
    <aside
      className={`statusFocusLens ${className}`.trim()}
      data-testid={testId}
      data-tone={tone}
      aria-live="polite"
    >
      {/* Artifact focus card stamps a cinnabar 檢視 ("examine") wax chop top-right. */}
      <InkWaxSeal className="statusFocusLens__seal" chars="檢視" size={38} rotation={6} variant="cinnabar" />
      <div className="statusFocusLens__title">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {/* Artifact board slip: bold value line + a single prose paragraph, no
          "VALUE"/"CONSEQUENCE" eyebrow labels. */}
      {value ? <strong className="statusFocusLens__value">{value}</strong> : null}
      {consequence ? <p className="statusFocusLens__consequence">{consequence}</p> : null}
      {action ? (
        <button
          type="button"
          className="statusFocusLens__route"
          data-tone={action.tone}
          disabled={disabled}
          aria-disabled={disabled ? 'true' : undefined}
          title={action.disabled ? action.disabledReason ?? action.detail : action.detail}
          onClick={() => {
            if (!disabled && onAction) onAction(action);
          }}
        >
          <span className="statusFocusLens__routeLead">{routeLabel}:</span>
          <strong>{routeButtonText(action)}</strong>
        </button>
      ) : null}
      {/* Sources kept for the expanded overlay + a11y; hidden on the board slip. */}
      <div className="statusFocusLens__sources" aria-label={sourcesLabel}>
        <span>{sourcesLabel}</span>
        <div>
          {sourceLabels.map((source) => (
            <i key={source}>{source}</i>
          ))}
        </div>
      </div>
    </aside>
  );
}
