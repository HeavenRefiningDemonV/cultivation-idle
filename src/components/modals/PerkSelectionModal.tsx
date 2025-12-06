import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getAvailablePerks } from '../../data/pathPerks';
import type { PathPerk } from '../../data/pathPerks';
import './PerkSelectionModal.scss';

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
          highlight: 'perk-selection-modal__path-heaven',
          text: 'perk-selection-modal__path-text-heaven',
        };
      case 'earth':
        return {
          highlight: 'perk-selection-modal__path-earth',
          text: 'perk-selection-modal__path-text-earth',
        };
      case 'martial':
        return {
          highlight: 'perk-selection-modal__path-martial',
          text: 'perk-selection-modal__path-text-martial',
        };
      default:
        return {
          highlight: 'perk-selection-modal__path-neutral',
          text: 'perk-selection-modal__path-text-neutral',
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
      <div className={'perk-selection-modal__overlay'}>
        <div className={'perk-selection-modal__empty-modal'}>
          <div className={'perk-selection-modal__header'}>
            <h1 className={'perk-selection-modal__empty-title'}>No Perks Available</h1>
            <p className={'perk-selection-modal__empty-text'}>
              You have already selected all available perks for this realm.
            </p>
            <button onClick={onClose} className={'perk-selection-modal__button-primary'}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'perk-selection-modal__overlay'}>
      <div className={'perk-selection-modal__modal'}>
        <div className={'perk-selection-modal__header'}>
          <h1 className={'perk-selection-modal__title'}>Choose Your Path Perk</h1>
          <p className={'perk-selection-modal__subtitle'}>
            {selectedPath} Path • Realm {realmIndex}
          </p>
          <p className={'perk-selection-modal__helper-text'}>
            Select one perk to enhance your cultivation journey
          </p>
        </div>

        <div className={'perk-selection-modal__grid'}>
          {availablePerks.map((perk) => (
            <div
              key={perk.id}
              onMouseEnter={() => setHoveredPerk(perk.id)}
              onMouseLeave={() => setHoveredPerk(null)}
              className={`${'perk-selection-modal__perk-card'} ${
                hoveredPerk === perk.id ? `${'perk-selection-modal__perk-card-active'} ${pathColors.highlight}` : ''
              }`}
              onClick={() => handleSelectPerk(perk)}
            >
              <div className={'perk-selection-modal__icon-row'}>
                <div className={hoveredPerk === perk.id ? 'perk-selection-modal__path-text-neutral' : ''}>
                  {selectedPath === 'heaven' && '☁️'}
                  {selectedPath === 'earth' && '⛰️'}
                  {selectedPath === 'martial' && '⚔️'}
                </div>
              </div>

              <div className={`${'perk-selection-modal__perk-name'} ${pathColors.highlight}`}>
                <h2 className={'perk-selection-modal__perk-title'}>{perk.name}</h2>
              </div>

              <p className={'perk-selection-modal__perk-description'}>{perk.description}</p>

              <div className={'perk-selection-modal__effect-box'}>
                <h3 className={'perk-selection-modal__effect-title'}>Effect:</h3>
                <div className={'perk-selection-modal__effect-content'}>
                  <span>{formatStatName(perk.effect.stat)}</span>
                  <span className={`${'perk-selection-modal__effect-value'} ${pathColors.text}`}>
                    {formatStatValue(perk.effect.stat, perk.effect.value)}
                  </span>
                </div>
              </div>

              <button className={`${'perk-selection-modal__select-button'} ${pathColors.highlight}`}>
                Choose This Perk
              </button>
            </div>
          ))}
        </div>

        <div className={'perk-selection-modal__footer'}>
          <p>💡 Tip: Choose perks that complement your playstyle!</p>
          <p className={'perk-selection-modal__footer-small'}>
            Perks are permanent for this run and stack with your path bonuses
          </p>
        </div>
      </div>
    </div>
  );
}
