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
          highlight: 'perkSelectionModalPathHeaven',
          text: 'perkSelectionModalPathTextHeaven',
        };
      case 'earth':
        return {
          highlight: 'perkSelectionModalPathEarth',
          text: 'perkSelectionModalPathTextEarth',
        };
      case 'martial':
        return {
          highlight: 'perkSelectionModalPathMartial',
          text: 'perkSelectionModalPathTextMartial',
        };
      default:
        return {
          highlight: 'perkSelectionModalPathNeutral',
          text: 'perkSelectionModalPathTextNeutral',
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
      <div className={'perkSelectionModalOverlay'}>
        <div className={'perkSelectionModalEmptyModal'}>
          <div className={'perkSelectionModalHeader'}>
            <h1 className={'perkSelectionModalEmptyTitle'}>No Perks Available</h1>
            <p className={'perkSelectionModalEmptyText'}>
              You have already selected all available perks for this realm.
            </p>
            <button onClick={onClose} className={'perkSelectionModalButtonPrimary'}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'perkSelectionModalOverlay'}>
      <div className={'perkSelectionModalModal'}>
        <div className={'perkSelectionModalHeader'}>
          <h1 className={'perkSelectionModalTitle'}>Choose Your Path Perk</h1>
          <p className={'perkSelectionModalSubtitle'}>
            {selectedPath} Path • Realm {realmIndex}
          </p>
          <p className={'perkSelectionModalHelperText'}>
            Select one perk to enhance your cultivation journey
          </p>
        </div>

        <div className={'perkSelectionModalGrid'}>
          {availablePerks.map((perk) => (
            <div
              key={perk.id}
              onMouseEnter={() => setHoveredPerk(perk.id)}
              onMouseLeave={() => setHoveredPerk(null)}
              className={`${'perkSelectionModalPerkCard'} ${
                hoveredPerk === perk.id ? `${'perkSelectionModalPerkCardActive'} ${pathColors.highlight}` : ''
              }`}
              onClick={() => handleSelectPerk(perk)}
            >
              <div className={'perkSelectionModalIconRow'}>
                <div className={hoveredPerk === perk.id ? 'perkSelectionModalPathTextNeutral' : ''}>
                  {selectedPath === 'heaven' && '☁️'}
                  {selectedPath === 'earth' && '⛰️'}
                  {selectedPath === 'martial' && '⚔️'}
                </div>
              </div>

              <div className={`${'perkSelectionModalPerkName'} ${pathColors.highlight}`}>
                <h2 className={'perkSelectionModalPerkTitle'}>{perk.name}</h2>
              </div>

              <p className={'perkSelectionModalPerkDescription'}>{perk.description}</p>

              <div className={'perkSelectionModalEffectBox'}>
                <h3 className={'perkSelectionModalEffectTitle'}>Effect:</h3>
                <div className={'perkSelectionModalEffectContent'}>
                  <span>{formatStatName(perk.effect.stat)}</span>
                  <span className={`${'perkSelectionModalEffectValue'} ${pathColors.text}`}>
                    {formatStatValue(perk.effect.stat, perk.effect.value)}
                  </span>
                </div>
              </div>

              <button className={`${'perkSelectionModalSelectButton'} ${pathColors.highlight}`}>
                Choose This Perk
              </button>
            </div>
          ))}
        </div>

        <div className={'perkSelectionModalFooter'}>
          <p>💡 Tip: Choose perks that complement your playstyle!</p>
          <p className={'perkSelectionModalFooterSmall'}>
            Perks are permanent for this run and stack with your path bonuses
          </p>
        </div>
      </div>
    </div>
  );
}
