import { VerseMiniBar } from './VerseMiniBar.js';
import './VerseProgressMiniBar.scss';

type VerseProgressMiniBarProps = {
  chapter: number;
  comprehension: number;
  nextRequirement: number;
  heartLawName: string;
};

/**
 * Compatibility wrapper around the canonical VerseMiniBar.
 * Packet 5.10d keeps one verse-bar truth and retains this legacy export.
 */
export function VerseProgressMiniBar({
  chapter,
  comprehension,
  nextRequirement,
  heartLawName,
}: VerseProgressMiniBarProps) {
  return (
    <VerseMiniBar
      chapter={chapter}
      comprehension={comprehension}
      requirement={nextRequirement}
      title={`${heartLawName} • Next verse at 100% comprehension`}
      className="verseProgressMiniBar"
      isComplete={nextRequirement <= 0}
    />
  );
}
