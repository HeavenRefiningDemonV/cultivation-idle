import type { GateTrialChecklistLine } from '../../systems/readiness/section5Adapters.js';

export function GateTrialChecklist(props: {
  title: string;
  lines: GateTrialChecklistLine[];
}) {
  const { title, lines } = props;
  return (
    <section className="gateTrialChecklist">
      <h4 className="gateTrialChecklist__title">{title}</h4>
      <div className="gateTrialChecklist__rows">
        {lines.map((line) => (
          <div key={line.key} className="gateTrialChecklist__row">
            <span className={`gateTrialChecklist__state gateTrialChecklist__state--${line.state}`}>{line.state === 'met' ? 'Met' : line.state === 'close' ? 'Close' : 'Open'}</span>
            <div className="gateTrialChecklist__body">
              <div className="gateTrialChecklist__label">{line.label}</div>
              <div className="gateTrialChecklist__detail">{line.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
