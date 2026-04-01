import barShort from '../../assets/menus/bar_short.png';
import './VerseMiniBar.scss';

const roman = ['I', 'II', 'III', 'IV', 'V'];

type VerseMiniBarProps = {
  chapter: number;
  comprehension: number;
  requirement: number;
  className?: string;
  title?: string;
  placeholderLabel?: string;
  placeholderValue?: string;
  isComplete?: boolean;
  compact?: boolean;
};

export function VerseMiniBar({
  chapter,
  comprehension,
  requirement,
  className,
  title,
  placeholderLabel,
  placeholderValue,
  isComplete = false,
  compact = false,
}: VerseMiniBarProps) {
  const showPlaceholder = Boolean(placeholderLabel);
  const rawPct = requirement > 0 ? (comprehension / requirement) * 100 : isComplete ? 100 : 0;
  const pct = Math.min(100, Math.max(0, rawPct));
  const verseLabel = roman[chapter - 1] ?? String(chapter);
  const containerClassName = `verseMiniBar${className ? ` ${className}` : ''}${showPlaceholder ? ' verseMiniBar--placeholder' : ''}${isComplete ? ' verseMiniBar--complete' : ''}${compact ? ' verseMiniBar--compact' : ''}`;
  const ariaLabel = showPlaceholder
    ? `${placeholderLabel}: ${placeholderValue ?? ''}`.trim()
    : `Verse ${verseLabel} progress: ${pct.toFixed(1)} percent`;
  const progressText = showPlaceholder
    ? (placeholderValue ?? 'Heart Law needed to begin verse progress.')
    : isComplete
      ? 'All verses comprehended'
      : `${comprehension.toFixed(1)} / ${requirement.toFixed(1)}`;

  return (
    <div className={containerClassName} role="img" aria-label={ariaLabel} title={title} data-ui="verse-bar">
      <img className="verseMiniBar__frame" src={barShort} alt="" aria-hidden="true" />
      <div className="verseMiniBar__track" aria-hidden="true">
        <div className="verseMiniBar__trackInner">
          <div className="verseMiniBar__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="verseMiniBar__label" aria-hidden="true">
        <span className="verseMiniBar__labelText">{showPlaceholder ? placeholderLabel : `Verse ${verseLabel}`}</span>
        <span className="verseMiniBar__labelValue">{progressText}</span>
      </div>
    </div>
  );
}
