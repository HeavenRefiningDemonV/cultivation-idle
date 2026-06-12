import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { StatusHeartLawSeal } from './StatusHeartLawSeal.js';
import { StatusSpiritRootAstrolabe } from './StatusSpiritRootAstrolabe.js';

export interface StatusRootLawCoupledInstrumentProps {
  surface: StatusObservatorySurfaceV1['rootLawInstrument'];
  onAction?: (action: StatusLedgerActionSurface) => void;
}

function bridgeMarkerCount(state: StatusObservatorySurfaceV1['rootLawInstrument']['bridge']['state']): number {
  if (state === 'opposed') return 3;
  if (state === 'strained') return 2;
  return 0;
}

export function StatusRootLawCoupledInstrument({
  surface,
  onAction,
}: StatusRootLawCoupledInstrumentProps) {
  const markerCount = bridgeMarkerCount(surface.bridge.state);
  const forwardAction = (action: StatusLedgerActionSurface) => {
    if (!action.disabled && onAction) onAction(action);
  };

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryRootLaw statusRootLawCoupledInstrument"
      data-testid="status-root-law-instrument"
      data-surface-testid={surface.rootTestId}
      data-s5-instrument="root-law-coupled"
      data-bridge-state={surface.bridge.state}
      data-bridge-broken={surface.bridge.broken ? 'true' : 'false'}
      data-fit-tier={surface.bridge.fitTier}
      aria-label={surface.bridge.ariaLabel}
    >
      <div className="statusObservatoryInstrument__header statusRootLawCoupledInstrument__header">
        <span className="statusObservatoryInstrument__sigil" aria-hidden="true" />
        <div>
          <h2>{surface.title}</h2>
          <p>{surface.bridge.label}</p>
        </div>
      </div>

      <div className="statusRootLawCoupledInstrument__body">
        <StatusSpiritRootAstrolabe surface={surface.astrolabe} onAction={forwardAction} />

        <div
          className="statusRootLawBridge"
          data-bridge-state={surface.bridge.state}
          data-bridge-broken={surface.bridge.broken ? 'true' : 'false'}
          data-fit-tier={surface.bridge.fitTier}
          data-tone={surface.bridge.tone}
          aria-label={surface.bridge.ariaLabel}
        >
          <div className="statusRootLawBridge__cord" aria-hidden="true">
            <span className="statusRootLawBridge__knot statusRootLawBridge__knot--root" />
            <span className="statusRootLawBridge__line" />
            <span className="statusRootLawBridge__knot statusRootLawBridge__knot--law" />
            {Array.from({ length: markerCount }, (_, index) => (
              <span
                key={index}
                className={`statusRootLawBridge__crack statusRootLawBridge__crack--${index + 1}`}
              />
            ))}
          </div>
          <span className="statusRootLawBridge__label">Root / Law Fit</span>
          <strong>{surface.bridge.label}</strong>
          <p>{surface.bridge.detail}</p>
        </div>

        <StatusHeartLawSeal
          surface={surface.heartLawSeal}
          onAction={forwardAction}
          distress={surface.bridge.fitTier === 'opposed'}
        />
      </div>
    </section>
  );
}
