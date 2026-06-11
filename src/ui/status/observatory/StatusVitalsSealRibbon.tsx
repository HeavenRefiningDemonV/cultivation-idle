import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';

interface StatusVitalsSealRibbonProps {
  surface: StatusObservatorySurfaceV1['vitalsRibbon'];
}

export function StatusVitalsSealRibbon({ surface }: StatusVitalsSealRibbonProps) {
  return (
    <section
      className="statusObservatoryVitals statusVitalsRibbon"
      data-testid="status-ledger-metrics"
      data-surface-testid={surface.rootTestId}
      aria-label={surface.title}
    >
      {surface.seals.map((seal) => (
        <div
          key={seal.id}
          className="statusVitalsRibbon__seal"
          data-tone={seal.tone}
          aria-label={seal.ariaLabel}
        >
          <span className="statusVitalsRibbon__icon" data-icon={seal.icon} aria-hidden="true" />
          <span className="statusVitalsRibbon__label">{seal.label}</span>
          <strong className="statusVitalsRibbon__value">{seal.value ?? 'Unavailable'}</strong>
        </div>
      ))}
    </section>
  );
}
