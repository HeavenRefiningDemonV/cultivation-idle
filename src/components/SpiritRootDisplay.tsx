import { usePrestigeStore } from '../stores/prestigeStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { formatNumber, D } from '../utils/numbers';
import type { SpiritRootElement, SpiritRootQuality } from '../types';

/**
 * Quality names for display (0-4)
 */
const QUALITY_NAMES: Record<SpiritRootQuality, string> = {
  0: 'Mortal',
  1: 'Earth',
  2: 'Heaven',
  3: 'Mystic',
  4: 'Divine',
};

/**
 * Quality colors (Tailwind classes)
 */
const QUALITY_COLORS: Record<SpiritRootQuality, string> = {
  0: 'text-gray-400',
  1: 'text-green-500',
  2: 'text-blue-500',
  3: 'text-purple-500',
  4: 'text-orange-500',
};

/**
 * Quality multipliers (0-4)
 */
const QUALITY_MULTIPLIERS: Record<SpiritRootQuality, number> = {
  0: 1.0,
  1: 1.25,
  2: 1.5,
  3: 2.0,
  4: 3.0,
};

/**
 * Element colors (background gradients)
 */
const ELEMENT_COLORS: Record<SpiritRootElement, string> = {
  fire: 'from-red-600 to-orange-500',
  water: 'from-blue-600 to-cyan-500',
  earth: 'from-yellow-700 to-amber-600',
  metal: 'from-gray-500 to-slate-600',
  wood: 'from-green-600 to-emerald-700',
};

/**
 * Element bonuses (from ELEMENT_BONUSES constant)
 */
const ELEMENT_BONUS_DESCRIPTIONS: Record<SpiritRootElement, string> = {
  fire: '+20% ATK, -10% DEF',
  water: '+20% HP, +10% Dodge',
  earth: '+30% DEF, -10% Crit Rate',
  metal: '+20% Crit Rate, +10% ATK',
  wood: '+10% HP Regen, +10% Qi/s',
};

/**
 * Spirit Root Display Component
 * Shows the player's spirit root quality, element, and bonuses
 */
export function SpiritRootDisplay() {
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const rerollSpiritRoot = usePrestigeStore((state) => state.rerollSpiritRoot);
  const getSpiritRootMultiplier = usePrestigeStore((state) => state.getSpiritRootMultiplier);

  const gold = useInventoryStore((state) => state.gold);

  // If no spirit root exists yet, show placeholder
  if (!spiritRoot) {
    return (
      <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6 backdrop-blur-sm">
        <h3 className="font-cinzel text-xl font-bold text-gold-accent mb-4 flex items-center gap-2">
          <span>🌟</span>
          <span>Spirit Root</span>
        </h3>
        <p className="text-slate-400 text-sm text-center py-4">
          Your spirit root is being awakened...
        </p>
      </div>
    );
  }

  // Calculate multiplier
  const totalMult = getSpiritRootMultiplier();

  // Calculate reroll cost: 1000 * 2^quality
  const rerollCost = 1000 * Math.pow(2, spiritRoot.quality);
  const canAfford = D(gold).gte(rerollCost);

  // Handle reroll
  const handleReroll = () => {
    const success = rerollSpiritRoot();
    if (!success) {
      console.log('[SpiritRoot] Reroll failed - not enough gold');
    }
  };

  return (
    <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6 backdrop-blur-sm">
      {/* Header */}
      <h3 className="font-cinzel text-xl font-bold text-gold-accent mb-4 flex items-center gap-2">
        <span>🌟</span>
        <span>Spirit Root</span>
      </h3>

      {/* Spirit Root Display Card */}
      <div className={`bg-gradient-to-r ${ELEMENT_COLORS[spiritRoot.element]} rounded-lg p-4 mb-4 shadow-lg`}>
        <div className="text-center space-y-2">
          {/* Quality */}
          <div className={`text-3xl font-bold ${QUALITY_COLORS[spiritRoot.quality]} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
            {QUALITY_NAMES[spiritRoot.quality]}
          </div>

          {/* Element */}
          <div className="text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] capitalize">
            {spiritRoot.element} Element
          </div>

          {/* Multiplier */}
          <div className="text-lg text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {QUALITY_MULTIPLIERS[spiritRoot.quality]}x All Stats
          </div>
        </div>
      </div>

      {/* Bonuses Section */}
      <div className="bg-slate-800/50 border-2 border-slate-700/50 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-slate-300 mb-3 text-sm">Bonuses:</h4>
        <div className="space-y-2 text-sm">
          {/* Quality Multiplier */}
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Quality Multiplier:</span>
            <span className="text-gold-accent font-bold text-lg">{totalMult.toFixed(2)}x</span>
          </div>

          {/* Element Bonus */}
          <div className="pt-2 border-t border-slate-700">
            <span className="text-slate-400">Element Bonus:</span>
            <div className="text-cyan-400 font-semibold mt-1">
              {ELEMENT_BONUS_DESCRIPTIONS[spiritRoot.element]}
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-4">
        <p className="text-xs text-amber-200/80 leading-relaxed">
          <span className="font-semibold">About Spirit Roots:</span> Your spirit root determines
          your cultivation potential. Higher quality provides greater stat multipliers
          that apply to all your stats. Each element grants unique bonuses to specific abilities.
          Upgrade Root Purification in the Prestige Shop to start with better roots!
        </p>
      </div>

      {/* Reroll Button */}
      <button
        onClick={handleReroll}
        disabled={!canAfford}
        className={`w-full font-bold py-3 px-4 rounded-lg transition-all font-cinzel ${
          canAfford
            ? 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105 shadow-lg hover:shadow-purple-500/50'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
        }`}
        title={!canAfford ? `Need ${formatNumber(rerollCost.toString())} gold` : 'Reroll your spirit root'}
      >
        {canAfford
          ? `🔄 Reroll Spirit Root (${formatNumber(rerollCost.toString())}g)`
          : `🔒 Not Enough Gold (${formatNumber(rerollCost.toString())}g)`
        }
      </button>

      {/* Warning text */}
      {!canAfford && (
        <p className="text-sm text-red-400 text-center mt-2">
          Need {formatNumber(D(rerollCost).minus(gold).toString())} more gold
        </p>
      )}
    </div>
  );
}
