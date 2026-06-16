import { memo } from 'react';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import type { StatusObservatoryDrawerRequest } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { deepEqualProps } from './fx/memoProps.js';

/* Artifact ledgers() corner chop: ONLY the Recent Changes fold carries one, and it
   is a bordered cinnabar square (NOT a wax disc). How Calculated carries no chop.
   The fold heading + entry count + aria-expanded remain the truth. */

interface StatusFoldedLedgerRailProps {
  surface: StatusObservatorySurfaceV1['ledgerRail'];
  noLoss: StatusObservatorySurfaceV1['noLoss'];
  activeDrawer?: StatusObservatoryDrawerRequest | null;
  onOpenDrawer?: (drawer: StatusObservatoryDrawerRequest) => void;
}

/* Artifact Recent Changes fold lists EVERY change row (it caps at five in the
   fixture); slice as a safety bound only so the fold never overflows the band. */
function visibleChanges(rows: StatusObservatorySurfaceV1['ledgerRail']['recentChanges']['rows']) {
  return rows.slice(0, 5);
}

export const StatusFoldedLedgerRail = memo(StatusFoldedLedgerRailBase, deepEqualProps);

function StatusFoldedLedgerRailBase({
  surface,
  activeDrawer = null,
  onOpenDrawer,
}: StatusFoldedLedgerRailProps) {
  const recent = surface.recentChanges;
  const details = surface.details;
  const changeRows = visibleChanges(recent.rows);
  const calcRows = details.rows.slice(0, 5);

  return (
    <footer
      className="statusObservatoryLedgerRail statusFoldedLedgerRail"
      data-testid="status-ledger-details"
      data-surface-testid={surface.rootTestId}
      data-s7-instrument="folded-ledger-rail"
      aria-label={surface.title}
    >
      <article className="statusFoldedLedgerRail__fold statusFoldedLedgerRail__fold--changes" data-ledger-fold="recent-changes">
        <button
          type="button"
          className="statusFoldedLedgerRail__foldButton"
          aria-haspopup="dialog"
          aria-expanded={activeDrawer?.kind === 'recentChanges'}
          aria-controls="status-observatory-drawer"
          onClick={() => onOpenDrawer?.({ kind: 'recentChanges' })}
        >
          <span className="statusFoldedLedgerRail__foldHead">
            <span className="statusFoldedLedgerRail__foldTitle">{recent.title}</span>
            <span className="statusFoldedLedgerRail__count" aria-hidden="true">{recent.rows.length}</span>
          </span>
          {changeRows.length ? (
            changeRows.map((row) => (
              <span key={row.id} className="statusFoldedLedgerRail__change" data-tone={row.tone}>
                <i className="statusFoldedLedgerRail__dot" aria-hidden="true" />
                <span className="statusFoldedLedgerRail__changeText">{row.label}</span>
              </span>
            ))
          ) : (
            <span className="statusFoldedLedgerRail__change">
              <i className="statusFoldedLedgerRail__dot" aria-hidden="true" />
              <span className="statusFoldedLedgerRail__changeText">{recent.emptyState.label}</span>
            </span>
          )}
        </button>
        <span className="statusFoldedLedgerRail__chopSquare" aria-hidden="true">記</span>
      </article>

      <article className="statusFoldedLedgerRail__fold statusFoldedLedgerRail__fold--calc" data-ledger-fold="how-calculated">
        <button
          type="button"
          className="statusFoldedLedgerRail__foldButton"
          aria-haspopup="dialog"
          aria-expanded={activeDrawer?.kind === 'calculation'}
          aria-controls="status-observatory-drawer"
          onClick={() => onOpenDrawer?.({ kind: 'calculation' })}
        >
          <span className="statusFoldedLedgerRail__foldHead">
            <span className="statusFoldedLedgerRail__foldTitle">{details.title}</span>
          </span>
          {calcRows.map((row) => (
            <span key={row.id} className="statusFoldedLedgerRail__calc">
              <span className="statusFoldedLedgerRail__calcLabel">{row.label}</span>
              <span className="statusFoldedLedgerRail__calcLink">View formula ›</span>
            </span>
          ))}
        </button>
      </article>

    </footer>
  );
}
