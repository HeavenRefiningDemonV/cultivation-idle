import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getAvailablePerks } from '../../data/pathPerks';
import type { PathPerk } from '../../data/pathPerks';
import styles from './PerkSelectionModal.module.css';

interface PerkSelectionModalProps {
  onClose: () => void;
  realmIndex: number;
}

export function PerkSelectionModal({ onClose, realmIndex }: PerkSelectionModalProps) {
  const { selectedPath, selectPerk, pathPerks: currentPerks } = useGameStore();
  const [hoveredPerk, setHoveredPerk] = useState<string | null>(null);

  if (!selectedPath) {
    onClose();
    return null;
  }

  // Get available perks for this path and realm
  const availablePerks = getAvailablePerks(selectedPath, realmIndex).filter(
    (perk) => !currentPerks.includes(perk.id)
  );

  // Handle perk selection
  const handleSelectPerk = (perk: PathPerk) => {
    selectPerk(perk.id);
    onClose();
  };

  // Path-specific colors
  const getPathColor = () => {
    switch (selectedPath) {
      case 'heaven':
        return {
          highlight: styles.pathHeaven,
          text: styles.pathTextHeaven,
        };
      case 'earth':
        return {
          highlight: styles.pathEarth,
          text: styles.pathTextEarth,
        };
      case 'martial':
        return {
          highlight: styles.pathMartial,
          text: styles.pathTextMartial,
        };
      default:
        return {
          highlight: styles.pathNeutral,
          text: styles.pathTextNeutral,
        };
    }
  };

  const pathColors = getPathColor();

  // Format stat name for display
  const formatStatName = (stat: string): string => {
    switch (stat) {
      case 'qiMultiplier':
        return 'Qi Generation';
      case 'hpMultiplier':
        return 'Maximum HP';
      case 'atkMultiplier':
        return 'Attack Damage';
      case 'defMultiplier':
        return 'Defense';
      case 'regenMultiplier':
        return 'HP Regeneration';
      case 'crit':
        return 'Critical Hit Chance';
      case 'critDmg':
        return 'Critical Damage';
      case 'dodge':
        return 'Dodge Chance';
      default:
        return stat;
    }
  };

  // Format stat value for display
  const formatStatValue = (stat: string, value: number): string => {
    switch (stat) {
      case 'qiMultiplier':
      case 'hpMultiplier':
      case 'atkMultiplier':
      case 'defMultiplier':
      case 'regenMultiplier':
        return `+${(value * 100).toFixed(0)}%`;
      case 'crit':
      case 'dodge':
        return `+${value.toFixed(0)}%`;
      case 'critDmg':
        return `+${value.toFixed(0)}%`;
      default:
        return `+${value}`;
    }
  };

  if (availablePerks.length === 0) {
    return (
      <div className={styles.overlay}>
        <div className={styles.emptyModal}>
          <div className={styles.header}>
            <h1 className={styles.emptyTitle}>No Perks Available</h1>
            <p className={styles.emptyText}>
              You have already selected all available perks for this realm.
            </p>
            <button onClick={onClose} className={styles.buttonPrimary}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h1 className={styles.title}>Choose Your Path Perk</h1>
          <p className={styles.subtitle}>
            {selectedPath} Path • Realm {realmIndex}
          </p>
          <p className={styles.helperText}>
            Select one perk to enhance your cultivation journey
          </p>
        </div>

        <div className={styles.grid}>
          {availablePerks.map((perk) => (
            <div
              key={perk.id}
              onMouseEnter={() => setHoveredPerk(perk.id)}
              onMouseLeave={() => setHoveredPerk(null)}
              className={`${styles.perkCard} ${
                hoveredPerk === perk.id ? `${styles.perkCardActive} ${pathColors.highlight}` : ''
              }`}
              onClick={() => handleSelectPerk(perk)}
            >
              <div className={styles.iconRow}>
                <div className={hoveredPerk === perk.id ? styles.pathTextNeutral : ''}>
                  {selectedPath === 'heaven' && '☁️'}
                  {selectedPath === 'earth' && '⛰️'}
                  {selectedPath === 'martial' && '⚔️'}
                </div>
              </div>

              <div className={`${styles.perkName} ${pathColors.highlight}`}>
                <h2 className={styles.perkTitle}>{perk.name}</h2>
              </div>

              <p className={styles.perkDescription}>{perk.description}</p>

              <div className={styles.effectBox}>
                <h3 className={styles.effectTitle}>Effect:</h3>
                <div className={styles.effectContent}>
                  <span>{formatStatName(perk.effect.stat)}</span>
                  <span className={`${styles.effectValue} ${pathColors.text}`}>
                    {formatStatValue(perk.effect.stat, perk.effect.value)}
                  </span>
                </div>
              </div>

              <button className={`${styles.selectButton} ${pathColors.highlight}`}>
                Choose This Perk
              </button>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p>💡 Tip: Choose perks that complement your playstyle!</p>
          <p className={styles.footerSmall}>
            Perks are permanent for this run and stack with your path bonuses
          </p>
        </div>
      </div>
    </div>
  );
}
