import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { LifePath } from '../../types';

const PATHS: { id: LifePath; label: string; desc: string }[] = [
  { id: 'heaven', label: 'Heaven', desc: 'Focus on techniques of the heavens and spiritual insight.' },
  { id: 'earth', label: 'Earth', desc: 'Steady and defensive methods rooted in the earth.' },
  { id: 'martial', label: 'Martial', desc: 'Physical mastery and weapon-oriented techniques.' },
];

export function MeditationHallPanel() {
  const lifePath = useGameStore((state) => state.lifePath);
  const setLifePath = useGameStore((state) => state.setLifePath);
  const canChangeLifePath = useGameStore((state) => state.canChangeLifePath);

  const title = useMemo(() => {
    if (lifePath) return `Chosen Path: ${lifePath.toUpperCase()}`;
    return 'Choose your Path';
  }, [lifePath]);

  return (
    <div className={'worldScreenPlaceholder'}>
      <div className={'worldScreenPlaceholderHeader'}>
        <div className={'worldScreenPlaceholderTitle'}>{title}</div>
        <div className={'worldScreenPlaceholderKey'}>meditationHall</div>
      </div>
      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine'}>
          Choose one path for this life. This determines which manuals you can buy and which techniques you can equip later.
        </div>
        {PATHS.map((path) => (
          <div key={path.id} className={'worldScreenPlaceholderLine'}>
            <div className={'worldScreenPlaceholderTitle'}>{path.label}</div>
            <div className={'worldScreenPlaceholderLine'}>{path.desc}</div>
            <button
              className={`worldScreenModuleButton ${lifePath === path.id ? 'worldScreenModuleButton--active' : ''}`}
              disabled={!canChangeLifePath() && lifePath !== path.id}
              onClick={() => setLifePath(path.id)}
            >
              {lifePath === path.id ? 'Selected' : 'Choose'}
            </button>
          </div>
        ))}
        {!canChangeLifePath() && lifePath && (
          <div className={'worldScreenInlineError'}>Path can only be changed at the start of a life.</div>
        )}
      </div>
    </div>
  );
}
