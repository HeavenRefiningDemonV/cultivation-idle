import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTechniqueStore } from '../../stores/techniqueStore';
import { useUIStore } from '../../stores/uiStore';
import { getAvailablePerks } from '../../data/pathPerks';
import type { CultivationPath } from '../../types';
import styles from './PathSelectionModal.module.css';

interface PathSelectionModalProps {
  onClose: () => void;
}

const PATH_THEMES: Record<CultivationPath, { banner: string; border: string; icon: string; name: string; theme: string; description: string; bonuses: string[]; playstyle: string }> = {
  heaven: {
    banner: styles.themeHeaven,
    border: styles.borderHeaven,
    icon: '☁️',
    name: 'Heaven Path',
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
  earth: {
    banner: styles.themeEarth,
    border: styles.borderEarth,
    icon: '⛰️',
    name: 'Earth Path',
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
  martial: {
    banner: styles.themeMartial,
    border: styles.borderMartial,
    icon: '⚔️',
    name: 'Martial Path',
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
};

export function PathSelectionModal({ onClose }: PathSelectionModalProps) {
  const { selectPath, realm, pathPerks } = useGameStore();
  const { unlockTechnique, techniques } = useTechniqueStore();
  const { showPerkSelection, hidePathSelection } = useUIStore();
  const [hoveredPath, setHoveredPath] = useState<CultivationPath | null>(null);

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
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h1 className={styles.title}>Choose Your Cultivation Path</h1>
          <p className={styles.lead}>This choice is permanent and defines your cultivation journey</p>
          <p className={styles.subtitle}>Each path grants unique bonuses and playstyle characteristics</p>
        </div>

        <div className={styles.grid}>
          {(Object.keys(PATH_THEMES) as Array<CultivationPath>).map((pathId) => {
            const path = PATH_THEMES[pathId];
            const isHovered = hoveredPath === pathId;
            return (
              <div
                key={pathId}
                onMouseEnter={() => setHoveredPath(pathId)}
                onMouseLeave={() => setHoveredPath(null)}
                className={`${styles.card} ${path.border} ${isHovered ? styles.cardActive : ''}`}
                onClick={() => handleSelectPath(pathId)}
              >
                <div className={styles.icon}>{path.icon}</div>

                <div className={`${styles.banner} ${path.banner}`}>
                  <h2 className={styles.pathTitle}>{path.name}</h2>
                  <p className={styles.pathSubtitle}>{path.theme}</p>
                </div>

                <p className={styles.description}>{path.description}</p>

                <div className={styles.bonusBlock}>
                  <h3 className={styles.bonusTitle}>Path Bonuses:</h3>
                  <div className={styles.bonusList}>
                    {path.bonuses.map((bonus, idx) => (
                      <div key={bonus + idx}>{bonus.includes('-') ? '⚠' : '✓'} {bonus}</div>
                    ))}
                  </div>
                </div>

                <div className={styles.playstyleBlock}>
                  <h3 className={styles.playstyleTitle}>Playstyle:</h3>
                  <p className={styles.playstyleText}>{path.playstyle}</p>
                </div>

                <button className={styles.chooseButton}>Choose {path.name}</button>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <p>💡 Tip: All paths are viable! Choose based on your preferred playstyle.</p>
          <p className={styles.footerSmall}>You cannot change your path after selection</p>
        </div>
      </div>
    </div>
  );
}
