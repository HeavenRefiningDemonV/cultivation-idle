import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getAvailablePerks } from '../../data/pathPerks';
import type { PathPerk } from '../../data/pathPerks';

interface PerkSelectionModalProps {
  onClose: () => void;
  realmIndex: number;
}

export function PerkSelectionModal({ onClose, realmIndex }: PerkSelectionModalProps) {
  const { selectedPath, selectPerk, pathPerks: currentPerks } = useGameStore();
  const [selectedPerkId, setSelectedPerkId] = useState<string | null>(null);
  const [hoveredPerk, setHoveredPerk] = useState<string | null>(null);

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
          gradient: 'from-blue-400 to-purple-500',
          border: 'border-blue-500',
          text: 'text-blue-400',
          glow: 'shadow-blue-500/50',
        };
      case 'earth':
        return {
          gradient: 'from-green-600 to-yellow-700',
          border: 'border-green-600',
          text: 'text-green-400',
          glow: 'shadow-green-600/50',
        };
      case 'martial':
        return {
          gradient: 'from-red-500 to-orange-600',
          border: 'border-red-500',
          text: 'text-red-400',
          glow: 'shadow-red-500/50',
        };
      default:
        return {
          gradient: 'from-gray-400 to-gray-600',
          border: 'border-gray-500',
          text: 'text-gray-400',
          glow: 'shadow-gray-500/50',
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
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-slate-900 border-4 border-gold-accent rounded-lg max-w-md w-full p-8">
          <div className="text-center">
            <h1 className="font-cinzel text-2xl font-bold text-gold-accent mb-4">
              No Perks Available
            </h1>
            <p className="text-slate-300 mb-6">
              You have already selected all available perks for this realm.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-gold-accent to-yellow-600 text-ink-dark font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border-4 border-gold-accent rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto p-8">
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-3">
            Choose Your Path Perk
          </h1>
          <p className="text-lg text-slate-300 capitalize">
            {selectedPath} Path • Realm {realmIndex}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Select one perk to enhance your cultivation journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePerks.map((perk) => (
            <div
              key={perk.id}
              onMouseEnter={() => setHoveredPerk(perk.id)}
              onMouseLeave={() => setHoveredPerk(null)}
              className={`bg-slate-800/50 border-4 rounded-lg p-6 cursor-pointer transition-all transform backdrop-blur-sm ${
                hoveredPerk === perk.id
                  ? `${pathColors.border} scale-105 shadow-2xl ${pathColors.glow}`
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onClick={() => handleSelectPerk(perk)}
            >
              {/* Perk Icon */}
              <div className="text-center mb-4">
                <div
                  className={`inline-block text-6xl ${
                    hoveredPerk === perk.id ? 'animate-bounce' : ''
                  }`}
                >
                  {selectedPath === 'heaven' && '☁️'}
                  {selectedPath === 'earth' && '⛰️'}
                  {selectedPath === 'martial' && '⚔️'}
                </div>
              </div>

              {/* Perk Name */}
              <div
                className={`bg-gradient-to-r ${pathColors.gradient} text-white text-center py-3 px-4 rounded-lg mb-4`}
              >
                <h2 className="text-xl font-bold font-cinzel">{perk.name}</h2>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 mb-4 leading-relaxed min-h-[3rem]">
                {perk.description}
              </p>

              {/* Effect Details */}
              <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-purple-300 mb-2">
                  Effect:
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-purple-200">
                    {formatStatName(perk.effect.stat)}
                  </span>
                  <span className={`text-lg font-bold ${pathColors.text}`}>
                    {formatStatValue(perk.effect.stat, perk.effect.value)}
                  </span>
                </div>
              </div>

              {/* Select Button */}
              <button
                className={`w-full bg-gradient-to-r ${pathColors.gradient} text-white font-bold py-3 px-4 rounded-lg transition-all hover:shadow-lg`}
              >
                Choose This Perk
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 italic">
            💡 Tip: Choose perks that complement your playstyle!
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Perks are permanent for this run and stack with your path bonuses
          </p>
        </div>
      </div>
    </div>
  );
}
