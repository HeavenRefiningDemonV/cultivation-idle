import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import type { StatusObservatoryDrawerRequest } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';

/* W6-decorative corner chops keyed on the fold name; the fold heading + entry count
   + aria-expanded remain the truth. */
const LEDGER_FOLD_CHOP: Record<string, { chars: string; variant: 'cinnabar' | 'jade' }> = {
  'recent-changes': { chars: '記', variant: 'cinnabar' },
  'how-calculated': { chars: '算', variant: 'jade' },
  'no-loss': { chars: '源', variant: 'jade' },
};

interface StatusFoldedLedgerRailProps {
  surface: StatusObservatorySurfaceV1['ledgerRail'];
  noLoss: StatusObservatorySurfaceV1['noLoss'];
  activeDrawer?: StatusObservatoryDrawerRequest | null;
  onOpenDrawer?: (drawer: StatusObservatoryDrawerRequest) => void;
}

function firstRows(rows: StatusObservatorySurfaceV1['ledgerRail']['recentChanges']['rows']) {
  return rows.slice(0, 2);
}

export function StatusFoldedLedgerRail({
  surface,
  noLoss,
  activeDrawer = null,
  onOpenDrawer,
}: StatusFoldedLedgerRailProps) {
  const recent = surface.recentChanges;
  const details = surface.details;
  const represented = noLoss.families.length - noLoss.missingFamilies.length;
  const visibleRecent = firstRows(recent.rows);

  return (
    <footer
      className="statusObservatoryLedgerRail statusFoldedLedgerRail"
      data-testid="status-ledger-details"
      data-surface-testid={surface.rootTestId}
      data-s7-instrument="folded-ledger-rail"
      aria-label={surface.title}
    >
      <article className="statusFoldedLedgerRail__fold" data-ledger-fold="recent-changes">
        <span className="statusFoldedLedgerRail__crease" aria-hidden="true" />
        <button
          type="button"
          className="statusFoldedLedgerRail__foldButton"
          aria-haspopup="dialog"
          aria-expanded={activeDrawer?.kind === 'recentChanges'}
          aria-controls="status-observatory-drawer"
          onClick={() => onOpenDrawer?.({ kind: 'recentChanges' })}
        >
          <span>{recent.title}</span>
          <strong>{recent.rows.length ? `${recent.rows.length} entries` : recent.emptyState.label}</strong>
          {visibleRecent.map((row) => (
            <small key={row.id} data-tone={row.tone}>{row.label}: {row.value ?? row.detail}</small>
          ))}
        </button>
        <InkWaxSeal
          className="statusFoldedLedgerRail__foldChop"
          chars={LEDGER_FOLD_CHOP['recent-changes'].chars}
          size={28}
          rotation={-5}
          variant={LEDGER_FOLD_CHOP['recent-changes'].variant}
        />
      </article>

      <article className="statusFoldedLedgerRail__fold" data-ledger-fold="how-calculated">
        <span className="statusFoldedLedgerRail__crease" aria-hidden="true" />
        <button
          type="button"
          className="statusFoldedLedgerRail__foldButton"
          aria-haspopup="dialog"
          aria-expanded={activeDrawer?.kind === 'calculation'}
          aria-controls="status-observatory-drawer"
          onClick={() => onOpenDrawer?.({ kind: 'calculation' })}
        >
          <span>{details.title}</span>
          <strong>{details.summary}</strong>
          <small>{details.rows.length} calculation rows available</small>
        </button>
        <InkWaxSeal
          className="statusFoldedLedgerRail__foldChop"
          chars={LEDGER_FOLD_CHOP['how-calculated'].chars}
          size={28}
          rotation={4}
          variant={LEDGER_FOLD_CHOP['how-calculated'].variant}
        />
      </article>

      <article className="statusFoldedLedgerRail__fold" data-ledger-fold="no-loss">
        <span className="statusFoldedLedgerRail__crease" aria-hidden="true" />
        <button
          type="button"
          className="statusFoldedLedgerRail__foldButton"
          aria-haspopup="dialog"
          aria-expanded={activeDrawer?.kind === 'sourceCoverage'}
          aria-controls="status-observatory-drawer"
          onClick={() => onOpenDrawer?.({ kind: 'sourceCoverage' })}
        >
          <span>Source Coverage</span>
          <strong>
            {noLoss.allRepresented
              ? `${represented}/${noLoss.families.length} families anchored`
              : `${noLoss.missingFamilies.length} families missing`}
          </strong>
          <small>{surface.noLossFamilies.length} source families mapped to observatory homes</small>
        </button>
        <InkWaxSeal
          className="statusFoldedLedgerRail__foldChop"
          chars={LEDGER_FOLD_CHOP['no-loss'].chars}
          size={28}
          rotation={-4}
          variant={LEDGER_FOLD_CHOP['no-loss'].variant}
        />
      </article>
    </footer>
  );
}
