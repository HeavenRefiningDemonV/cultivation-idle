import './VerseMiniBar.scss';

const roman = ['I', 'II', 'III', 'IV', 'V'];

type VerseMiniBarProps = {
  chapter: number;
  comprehension: number;
  requirement: number;
  className?: string;
  title?: string;
};

export function VerseMiniBar({ chapter, comprehension, requirement, className, title }: VerseMiniBarProps) {
  const rawPct = requirement > 0 ? (comprehension / requirement) * 100 : 100;
  const pct = Math.min(100, Math.max(0, rawPct));
  const verseLabel = roman[chapter - 1] ?? String(chapter);
  const containerClassName = `verseMiniBar${className ? ` ${className}` : ''}`;
  const ariaLabel = `Verse ${verseLabel} progress: ${pct.toFixed(1)} percent`;

  return (
    <div className={containerClassName} role="img" aria-label={ariaLabel} title={title}>
      <div className="verseMiniBar__frame" aria-hidden="true" />
      <div className="verseMiniBar__track" aria-hidden="true">
        <div className="verseMiniBar__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="verseMiniBar__label" aria-hidden="true">
        <span className="verseMiniBar__labelText">Verse {verseLabel}</span>
        <span className="verseMiniBar__labelPct">{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}
