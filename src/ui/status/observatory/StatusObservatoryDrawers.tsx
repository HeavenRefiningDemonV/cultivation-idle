import type { StatusLedgerActionSurface, StatusLedgerFactRow } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusMeridianCauseStampSurface,
  StatusMeridianOrganSurface,
  StatusObservatoryDrawerRequest,
  StatusObservatoryNoLossFamilySurface,
  StatusObservatorySurfaceV1,
  StatusWorkWheelSpokeSurface,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import {
  STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS,
  STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS,
} from '../../../systems/ui/status/statusObservatoryPresentation.js';
import { useDialogFocusTrap } from './useDialogFocusTrap.js';

export interface StatusMeridianVesselDrawerProps {
  open: boolean;
  organ: StatusMeridianOrganSurface;
  sharedCauseStamps: readonly StatusMeridianCauseStampSurface[];
  onClose: () => void;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

export interface StatusSupportDrawerProps {
  open: boolean;
  drawer: StatusObservatoryDrawerRequest | null;
  surface: Pick<
    StatusObservatorySurfaceV1,
    'drawers' | 'buildPreparation' | 'workWheel' | 'ledgerRail' | 'noLoss'
  >;
  onClose: () => void;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

export type StatusObservatoryDrawersProps = StatusMeridianVesselDrawerProps | StatusSupportDrawerProps;

const STATUS_SUPPORT_DRAWER_REQUESTS = {
  buildPreparation: { kind: 'buildPreparation' },
  currentWork: { kind: 'currentWork' },
  recentChanges: { kind: 'recentChanges' },
  calculation: { kind: 'calculation' },
  sourceCoverage: { kind: 'sourceCoverage' },
} satisfies Record<StatusObservatoryDrawerRequest['kind'], StatusObservatoryDrawerRequest>;

const STATUS_SUPPORT_DRAWER_TITLES: Record<StatusObservatoryDrawerRequest['kind'], string> = {
  [STATUS_SUPPORT_DRAWER_REQUESTS.buildPreparation.kind]: 'Build & Preparation Ledger',
  [STATUS_SUPPORT_DRAWER_REQUESTS.currentWork.kind]: 'Current Work Ledger',
  [STATUS_SUPPORT_DRAWER_REQUESTS.recentChanges.kind]: 'Recent Changes Ledger',
  [STATUS_SUPPORT_DRAWER_REQUESTS.calculation.kind]: 'How Calculated Ledger',
  [STATUS_SUPPORT_DRAWER_REQUESTS.sourceCoverage.kind]: 'Source Coverage Ledger',
};

function sourceText(row: StatusMeridianOrganSurface['detailRows'][number]): string {
  return row.sourceSystem || 'Status Analysis';
}

function factSourceText(row: StatusLedgerFactRow): string {
  return row.sourceLabel || 'Status Analysis';
}

function drawerTitle(drawer: StatusObservatoryDrawerRequest): string {
  return STATUS_SUPPORT_DRAWER_TITLES[drawer.kind];
}

function drawerDetail(drawer: StatusObservatoryDrawerRequest, surface: StatusSupportDrawerProps['surface']): string {
  if (drawer.kind === 'buildPreparation') return `${surface.buildPreparation.rows.length} exact build and reserve rows.`;
  if (drawer.kind === 'currentWork') return `${surface.workWheel.spokes.length} spokes and ${surface.workWheel.rows.length} exact rows.`;
  if (drawer.kind === 'recentChanges') return `${surface.ledgerRail.recentChanges.rows.length} recent change rows.`;
  if (drawer.kind === 'calculation') return surface.ledgerRail.details.summary;
  return `${surface.noLoss.families.length} Status source families mapped to homes.`;
}

function DrawerAction({
  action,
  onAction,
}: {
  action: StatusLedgerActionSurface | null | undefined;
  onAction?: (action: StatusLedgerActionSurface) => void;
}) {
  if (!action) return null;

  const disabled = action.disabled || !onAction;
  return (
    <button
      type="button"
      className="statusObservatoryDrawer__action"
      data-tone={action.tone}
      disabled={disabled}
      aria-disabled={disabled ? 'true' : undefined}
      title={action.disabled ? action.disabledReason ?? action.detail : action.detail}
      onClick={() => {
        if (!disabled) onAction?.(action);
      }}
    >
      <span>Route</span>
      <strong>{action.label}</strong>
      <small>{action.destinationLabel}</small>
    </button>
  );
}

function EvidenceRow({
  row,
  selected,
  onAction,
}: {
  row: StatusLedgerFactRow;
  selected: boolean;
  onAction?: (action: StatusLedgerActionSurface) => void;
}) {
  return (
    <div
      className="statusObservatoryDrawer__row"
      data-tone={row.tone}
      data-selected-source={selected ? 'true' : 'false'}
    >
      <span>{row.label}</span>
      <strong>{row.value ?? row.detail}</strong>
      <p>{row.detail}</p>
      <small>{factSourceText(row)}</small>
      <DrawerAction action={row.action} onAction={onAction} />
    </div>
  );
}

function WorkSpokeRow({
  spoke,
  selected,
  onAction,
}: {
  spoke: StatusWorkWheelSpokeSurface;
  selected: boolean;
  onAction?: (action: StatusLedgerActionSurface) => void;
}) {
  return (
    <div
      className="statusObservatoryDrawer__row"
      data-tone={spoke.tone}
      data-selected-source={selected ? 'true' : 'false'}
    >
      <span>{spoke.label}</span>
      <strong>{spoke.value ?? spoke.detail}</strong>
      <p>{spoke.detail}</p>
      <small>Current Work</small>
      <DrawerAction action={spoke.route} onAction={onAction} />
    </div>
  );
}

function SourceCoverageRow({ family }: { family: StatusObservatoryNoLossFamilySurface }) {
  return (
    <div
      className="statusObservatoryDrawer__row"
      data-tone={family.represented ? 'success' : 'danger'}
      data-selected-source="false"
    >
      <span>{family.family}</span>
      <strong>{family.represented ? 'Anchored' : 'Missing'}</strong>
      <p>{family.defaultHome} opens exact evidence at {family.exactHome}.</p>
      <small>{family.sourcePath}</small>
    </div>
  );
}

export function StatusMeridianVesselDrawer({
  open,
  organ,
  sharedCauseStamps,
  onClose,
  onAction,
}: StatusMeridianVesselDrawerProps) {
  const dialogRef = useDialogFocusTrap<HTMLElement>(open, onClose);
  if (!open) return null;

  const action = organ.route;
  const disabled = !action || action.disabled || !onAction;
  const state = STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS[organ.state];

  return (
    <aside
      ref={dialogRef}
      className="statusMeridianVesselCompass__drawer"
      data-testid="status-meridian-vessel-drawer"
      data-selected-organ-id={organ.id}
      data-organ-state={organ.state}
      role="dialog"
      aria-modal="true"
      aria-label={`${organ.title} vessel detail`}
    >
      <div className="statusMeridianVesselCompass__drawerHeader">
        <div>
          <span>Expanded Vessel Detail</span>
          <h3>{organ.title}</h3>
          <p>{state.label} - {organ.valueLabel}</p>
        </div>
        <button
          type="button"
          className="statusMeridianVesselCompass__drawerClose"
          aria-label={STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS.drawerCloseLabel}
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="statusMeridianVesselCompass__drawerRows" aria-label="Selected organ exact rows">
        {organ.detailRows.map((row) => (
          <div key={row.id} className="statusMeridianVesselCompass__drawerRow" data-severity={row.severity}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            <p>{row.consequence || row.detail}</p>
            <small>{sourceText(row)}</small>
          </div>
        ))}
      </div>

      <div className="statusMeridianVesselCompass__drawerStamps" aria-label="Shared cause stamps">
        {sharedCauseStamps.map((stamp) => (
          <span key={stamp.id} data-tone={stamp.tone} title={stamp.detail}>
            {stamp.label}: {stamp.value ?? stamp.detail}
          </span>
        ))}
      </div>

      {action ? (
        <button
          type="button"
          className="statusMeridianVesselCompass__drawerRoute"
          data-tone={action.tone}
          disabled={disabled}
          aria-disabled={disabled ? 'true' : undefined}
          title={action.disabled ? action.disabledReason ?? action.detail : action.detail}
          onClick={() => {
            if (!disabled && onAction) onAction(action);
          }}
        >
          <span>Route</span>
          <strong>{action.label}</strong>
        </button>
      ) : null}
    </aside>
  );
}

function StatusSupportDrawer({
  open,
  drawer,
  surface,
  onClose,
  onAction,
}: StatusSupportDrawerProps) {
  const dialogRef = useDialogFocusTrap<HTMLElement>(open, onClose);
  if (!open || !drawer) return null;

  const selectedSourceId = drawer.sourceId ?? null;
  const buildRows = surface.drawers.buildPreparation.buildRows;
  const reserveRows = surface.drawers.buildPreparation.reserveRows;
  const currentRows = surface.drawers.currentWork.rows;
  const currentSpokes = surface.drawers.currentWork.spokes;
  const recent = surface.drawers.recentChanges;
  const calculation = surface.drawers.calculation;

  return (
    <aside
      ref={dialogRef}
      id="status-observatory-drawer"
      className="statusObservatoryDrawer"
      data-testid="status-observatory-drawer"
      data-drawer-kind={drawer.kind}
      data-selected-source-id={selectedSourceId ?? 'none'}
      role="dialog"
      aria-modal="true"
      aria-label={drawerTitle(drawer)}
    >
      <div className="statusObservatoryDrawer__header">
        <div>
          <span>Expanded Ledger Detail</span>
          <h3>{drawerTitle(drawer)}</h3>
          <p>{drawerDetail(drawer, surface)}</p>
        </div>
        <button
          type="button"
          className="statusObservatoryDrawer__close"
          aria-label={`Close ${drawerTitle(drawer)}`}
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {drawer.kind === 'buildPreparation' ? (
        <div className="statusObservatoryDrawer__sections" aria-label="Exact build and reserve rows">
          <section className="statusObservatoryDrawer__section">
            <h4>Build Floors</h4>
            <div className="statusObservatoryDrawer__rows">
              {buildRows.map((row) => (
                <EvidenceRow key={row.id} row={row} selected={row.id === selectedSourceId} onAction={onAction} />
              ))}
            </div>
          </section>
          <section className="statusObservatoryDrawer__section">
            <h4>Reserve Jars</h4>
            <div className="statusObservatoryDrawer__rows">
              {reserveRows.map((row) => (
                <EvidenceRow key={row.id} row={row} selected={row.id === selectedSourceId} onAction={onAction} />
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {drawer.kind === 'currentWork' ? (
        <div className="statusObservatoryDrawer__sections" aria-label="Exact current work rows">
          <section className="statusObservatoryDrawer__section">
            <h4>Wheel Spokes</h4>
            <div className="statusObservatoryDrawer__rows">
              {currentSpokes.map((spoke) => (
                <WorkSpokeRow key={spoke.id} spoke={spoke} selected={spoke.id === selectedSourceId} onAction={onAction} />
              ))}
            </div>
          </section>
          <section className="statusObservatoryDrawer__section">
            <h4>Current Work Rows</h4>
            <div className="statusObservatoryDrawer__rows">
              {currentRows.map((row) => (
                <EvidenceRow key={row.id} row={row} selected={row.id === selectedSourceId} onAction={onAction} />
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {drawer.kind === 'recentChanges' ? (
        <div className="statusObservatoryDrawer__rows" aria-label="Recent changes exact rows">
          {recent.rows.length > 0 ? recent.rows.map((row) => (
            <EvidenceRow key={row.id} row={row} selected={row.id === selectedSourceId} onAction={onAction} />
          )) : <EvidenceRow row={recent.emptyState} selected={false} onAction={onAction} />}
        </div>
      ) : null}

      {drawer.kind === 'calculation' ? (
        <div className="statusObservatoryDrawer__sections" aria-label="How calculated exact rows">
          <section className="statusObservatoryDrawer__section">
            <h4>{calculation.title}</h4>
            <p>{calculation.summary}</p>
            <div className="statusObservatoryDrawer__rows">
              {calculation.rows.map((row) => (
                <EvidenceRow key={row.id} row={row} selected={row.id === selectedSourceId} onAction={onAction} />
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {drawer.kind === 'sourceCoverage' ? (
        <div className="statusObservatoryDrawer__rows" aria-label="Source coverage exact rows">
          {surface.noLoss.families.map((family) => (
            <SourceCoverageRow key={family.family} family={family} />
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function isMeridianDrawerProps(props: StatusObservatoryDrawersProps): props is StatusMeridianVesselDrawerProps {
  return 'organ' in props;
}

export function StatusObservatoryDrawers(props: StatusObservatoryDrawersProps) {
  if (isMeridianDrawerProps(props)) {
    return <StatusMeridianVesselDrawer {...props} />;
  }
  return <StatusSupportDrawer {...props} />;
}
