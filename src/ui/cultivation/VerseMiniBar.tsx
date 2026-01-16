import barShort from '../../assets/menus/bar_short.png';
import './VerseMiniBar.scss';

const roman = ['I', 'II', 'III', 'IV', 'V'];

type VerseMiniBarProps = {
  chapter: number;
  comprehension: number;
  nextRequirement: number;
};

export function VerseMiniBar({ chapter, comprehension, nextRequirement }: VerseMiniBarProps) {
  const pct = nextRequirement > 0 ? Math.min(100, (comprehension / nextRequirement) * 100) : 0;
  const verseLabel = roman[chapter - 1] ?? String(chapter);

  return (
    <div className="verseMiniBar">
      <img className="verseMiniBarFrame" src={barShort} alt="" aria-hidden="true" />
      <div className="verseMiniBarTrack">
        <div className="verseMiniBarFill" style={{ width: `${pct}%` }} />
        <div className="verseMiniBarLabel">
          Verse {verseLabel} • {pct.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
