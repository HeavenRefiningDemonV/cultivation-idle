import type { StatusLedgerFactRow } from '../../../systems/ui/status/statusLedgerTypes.js';
import { SafeStatusIcon } from './StatusLedgerRows.js';

export function StatusMetricStrip({ metrics }: { metrics: StatusLedgerFactRow[] }) {
  return (
    <section className="statusLedgerMetrics" data-testid="status-ledger-metrics" aria-label="Core status metrics">
      {metrics.map((metric) => (
        <article
          key={metric.id}
          className={`statusLedgerMetric statusLedgerMetric--${metric.tone}`}
          title={metric.detail}
        >
          <span className="statusLedgerMetric__icon" aria-hidden="true">
            <SafeStatusIcon icon={metric.icon} size={19} />
          </span>
          <span className="statusLedgerMetric__copy">
            <span className="statusLedgerMetric__label">{metric.label}</span>
            <strong className="statusLedgerMetric__value">{metric.value ?? metric.detail}</strong>
          </span>
        </article>
      ))}
    </section>
  );
}

