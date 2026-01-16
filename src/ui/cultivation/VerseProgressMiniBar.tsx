import { useEffect, useRef, useState } from 'react';
import barShort from '../../assets/menus/bar_short.png';
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
  const tooltip = `${heartLawName} • Next verse at 100% comprehension`;
  const [isFlashing, setIsFlashing] = useState(false);
  const lastComprehensionRef = useRef(comprehension);
  const lastFlashAtRef = useRef(0);

  useEffect(() => {
    const diff = comprehension - lastComprehensionRef.current;
    const now = Date.now();
    let timeoutId: number | undefined;
    if (diff >= 0.5 && now - lastFlashAtRef.current > 500) {
      setIsFlashing(true);
      lastFlashAtRef.current = now;
      timeoutId = window.setTimeout(() => setIsFlashing(false), 250);
    }
    lastComprehensionRef.current = comprehension;
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [comprehension]);

  return (
    <div className={`verseProgressMiniBar ${isFlashing ? 'verseProgressMiniBar--flash' : ''}`} title={tooltip}>
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
