import { useState, type CSSProperties } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTechniqueStore } from '../../stores/techniqueStore';
import { useUIStore } from '../../stores/uiStore';
import { getAvailablePerks } from '../../data/pathPerks';
import type { CultivationPath } from '../../types';
import './PathSelectionModal.scss';

interface PathSelectionModalProps {
  onClose: () => void;
}

const paths: Array<{
  id: CultivationPath;
  name: string;
  gradient: string;
  accent: string;
  icon: string;
  theme: string;
  description: string;
  bonuses: string[];
  playstyle: string;
}> = [
  {
    id: 'heaven',
    name: 'Heaven Path',
    gradient: 'linear-gradient(90deg, #60a5fa, #a855f7)',
    accent: '#60a5fa',
    icon: '☁️',
    theme: 'Spiritual Cultivation',
    description:
      'Masters of Qi and spiritual energy. Heaven cultivators focus on pure energy accumulation and efficient breakthroughs.',
    bonuses: [
      '+50% Idle Qi Generation',
      '+30% Attack Power',
      '+10% Critical Hit Chance',
      '+5% Dodge Chance',
      '-20% HP (Glass Cannon)',
      '-10% Defense',
    ],
    playstyle: 'Ideal for fast progression. Highest Qi generation with strong offense but lower defenses.',
  },
  {
    id: 'earth',
    name: 'Earth Path',
    gradient: 'linear-gradient(90deg, #22c55e, #f59e0b)',
    accent: '#22c55e',
    icon: '⛰️',
    theme: 'Body Cultivation',
    description:
      'Masters of physical endurance and defense. Earth cultivators temper their bodies to withstand immense punishment.',
    bonuses: [
      '+50% Maximum HP',
      '+40% Defense',
      'Normal Qi Generation',
      'Highest Survivability',
      '-10% Attack Power',
    ],
    playstyle: 'Ideal for survival-focused play. Best for difficult dungeons and bosses. Slow but steady.',
  },
  {
    id: 'martial',
    name: 'Martial Path',
    gradient: 'linear-gradient(90deg, #ef4444, #f97316)',
    accent: '#ef4444',
    icon: '⚔️',
    theme: 'Combat Cultivation',
    description:
      'Masters of battle and techniques. Martial cultivators hone their combat prowess to devastating levels.',
    bonuses: [
      '+50% Attack Damage',
      '+30% Critical Damage',
      '+20% Qi Generation',
      '+20% HP',
      'Balanced Combat Style',
    ],
    playstyle: 'Ideal for combat-focused play. Highest damage output and fastest enemy kills. Well-rounded stats.',
  },
];

export function PathSelectionModal({ onClose }: PathSelectionModalProps) {
  const { selectPath, realm, pathPerks } = useGameStore();
  const { unlockTechnique, techniques } = useTechniqueStore();
  const { showPerkSelection, hidePathSelection } = useUIStore();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const handleSelectPath = (pathId: CultivationPath) => {
    selectPath(pathId);

    const tier1Technique = Object.values(techniques).find((tech) => tech.path === pathId && tech.tier === 1);

    if (tier1Technique) {
      unlockTechnique(tier1Technique.id);
      console.log(`[PathSelection] Auto-unlocked tier 1 technique: ${tier1Technique.name}`);
    }

    const availablePerks = getAvailablePerks(pathId, realm.index);
    const hasRealmPerk = availablePerks.some((perk) => pathPerks.includes(perk.id));

    if (!hasRealmPerk && availablePerks.length > 0) {
      showPerkSelection(realm.index);
    }

    hidePathSelection();
    onClose();
  };

  return (
    <div className={'pathSelectionModalOverlay'}>
      <div className={'pathSelectionModalModal'}>
        <div className={'pathSelectionModalHeader'}>
          <h1 className={'pathSelectionModalTitle'}>Choose Your Cultivation Path</h1>
          <p className={'pathSelectionModalSubtitle'}>This choice is permanent and defines your cultivation journey</p>
          <p className={'pathSelectionModalHelperText'}>Each path grants unique bonuses and playstyle characteristics</p>
        </div>

        <div className={'pathSelectionModalGrid'}>
          {paths.map((path) => {
            const isActive = hoveredPath === path.id;
            const cardStyle: CSSProperties = {
              borderColor: isActive ? path.accent : undefined,
              boxShadow: isActive ? `0 12px 30px ${path.accent}55` : undefined,
            };

            return (
              <div
                key={path.id}
                onMouseEnter={() => setHoveredPath(path.id)}
                onMouseLeave={() => setHoveredPath(null)}
                className={`${'pathSelectionModalCard'} ${isActive ? 'pathSelectionModalCardActive' : ''}`}
                style={cardStyle}
                onClick={() => handleSelectPath(path.id)}
              >
                <div className={'pathSelectionModalIcon'}>{path.icon}</div>

                <div className={'pathSelectionModalGradientHeader'} style={{ background: path.gradient }}>
                  <h2 className={'pathSelectionModalPathName'}>{path.name}</h2>
                  <p className={'pathSelectionModalPathTheme'}>{path.theme}</p>
                </div>

                <p className={'pathSelectionModalDescription'}>{path.description}</p>

                <div className={'pathSelectionModalBonusBox'}>
                  <h3 className={'pathSelectionModalBonusTitle'}>Path Bonuses:</h3>
                  <ul className={'pathSelectionModalBonusList'}>
                    {path.bonuses.map((bonus, idx) => (
                      <li key={idx}>
                        {bonus.includes('-') ? '⚠' : '✓'} {bonus}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={'pathSelectionModalPlaystyleBox'}>
                  <h3 className={'pathSelectionModalBonusTitle'}>Playstyle:</h3>
                  <p className={'pathSelectionModalPathTheme'}>{path.playstyle}</p>
                </div>

                <button className={'pathSelectionModalSelectButton'} style={{ background: path.gradient }}>
                  Choose {path.name}
                </button>
              </div>
            );
          })}
        </div>

        <div className={'pathSelectionModalFooter'}>
          <p className={'pathSelectionModalFooterTip'}>💡 Tip: All paths are viable! Choose based on your preferred playstyle.</p>
          <p className={'pathSelectionModalFooterNote'}>You cannot change your path after selection</p>
        </div>
      </div>
    </div>
  );
}
