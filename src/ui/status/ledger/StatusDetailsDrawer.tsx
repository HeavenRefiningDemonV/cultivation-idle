import type {
  StatusLedgerActionSurface,
  StatusLedgerSurfaceV1,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import { StatusFactRows } from './StatusLedgerRows.js';

interface StatusDetailsDrawerProps {
  details: StatusLedgerSurfaceV1['details'];
  recentChanges: StatusLedgerSurfaceV1['recentChanges'];
  onAction: (action: StatusLedgerActionSurface) => void;
}

export function StatusDetailsDrawer({ details, recentChanges, onAction }: StatusDetailsDrawerProps) {
  const recentRows = recentChanges.rows.length > 0 ? recentChanges.rows : [recentChanges.emptyState];

  return (
    <details className="statusLedgerDetails" data-testid="status-ledger-details">
      <summary>
        <span>{details.title}</span>
        <small>{details.summary}</small>
      </summary>
      <div className="statusLedgerDetails__body">
        <section className="statusLedgerDetails__calculation" aria-label={details.title}>
          <StatusFactRows rows={details.rows} onAction={onAction} compact />
        </section>
        <section
          className="statusLedgerRecentChanges"
          data-testid="status-ledger-recent-changes"
          aria-label={recentChanges.title}
        >
          <h3>{recentChanges.title}</h3>
          <StatusFactRows rows={recentRows} onAction={onAction} compact />
        </section>
      </div>
    </details>
  );
}

