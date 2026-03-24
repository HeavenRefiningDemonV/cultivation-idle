import type { SpiritRoot } from '../../types/index.js';

export type DoctrineSummaryRow = {
  label: string;
  value: string;
  detail?: string;
};

type CultivationDoctrineSummaryProps = {
  pathLabel: string;
  pathSummary: string;
  spiritRootLine: string;
  spiritRootDetail: string;
  heartLawLine: string;
  heartLawDetail: string;
  resonanceLine: string;
  resonanceDetail: string;
  breathLabel: string;
  breathSummary: string;
  focusLabel: string;
  focusSummary: string;
  spiritRoot: SpiritRoot | null;
};

export function CultivationDoctrineSummary({
  pathLabel,
  pathSummary,
  spiritRootLine,
  spiritRootDetail,
  heartLawLine,
  heartLawDetail,
  resonanceLine,
  resonanceDetail,
  breathLabel,
  breathSummary,
  focusLabel,
  focusSummary,
  spiritRoot,
}: CultivationDoctrineSummaryProps) {
  const rows: DoctrineSummaryRow[] = [
    { label: 'Path', value: pathLabel, detail: pathSummary },
    { label: 'Spirit Root', value: spiritRootLine, detail: spiritRootDetail },
    { label: 'Heart Law', value: heartLawLine, detail: heartLawDetail },
    { label: 'Resonance', value: resonanceLine, detail: resonanceDetail },
    { label: 'Breath Mode', value: breathLabel, detail: breathSummary },
    { label: 'Focus Mode', value: focusLabel, detail: focusSummary },
  ];

  return (
    <section className="cultivationDoctrinePanel cultivationCommandCard" aria-label="Doctrine state">
      <div className="cultivationCommandCard__header">
        <div>
          <div className="cultivationCommandCard__eyebrow">Doctrine</div>
          <h2 className="cultivationCommandCard__title">How you cultivate</h2>
        </div>
        <span className="cultivationCommandCard__badge">{spiritRoot ? 'Aligned' : 'Dormant'}</span>
      </div>

      <div className="cultivationDoctrinePanel__rows">
        {rows.map((row) => (
          <div key={row.label} className="cultivationDoctrinePanel__row">
            <div className="cultivationDoctrinePanel__rowTop">
              <span className="cultivationDoctrinePanel__label">{row.label}</span>
              <span className="cultivationDoctrinePanel__value">{row.value}</span>
            </div>
            {row.detail ? <div className="cultivationDoctrinePanel__detail">{row.detail}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
