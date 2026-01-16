import barShort from '../../assets/menus/bar_short.png';
import { formatNumber } from '../../utils/numbers';
import './VerseProgressMiniBar.scss';

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

type VerseProgressMiniBarProps = {
  chapter: number;
  comprehension: number;
  nextRequirement: number;
  heartLawName: string;
};

export function VerseProgressMiniBar({
  chapter,
  comprehension,
  nextRequirement,
  heartLawName,
}: VerseProgressMiniBarProps) {
  const pct = nextRequirement > 0 ? Math.min(100, (comprehension / nextRequirement) * 100) : 100;
  const verseLabel = ROMAN_NUMERALS[chapter - 1] ?? String(chapter);
  const tooltip = `${heartLawName} • ${formatNumber(comprehension)} / ${formatNumber(nextRequirement)}`;

  return (
    <div className="verseProgressMiniBar" title={tooltip}>
      <img className="verseProgressMiniBarFrame" src={barShort} alt="" aria-hidden="true" />
      <div className="verseProgressMiniBarTrack">
        <div className="verseProgressMiniBarFill" style={{ width: `${pct}%` }} />
        <div className="verseProgressMiniBarLabel">
          Verse {verseLabel} • {Math.round(pct)}%
        </div>
      </div>
    </div>
  );
}
