import { usePrestigeStore } from '../stores/prestigeStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { formatNumber, D } from '../utils/numbers';
import type { SpiritRootElement, SpiritRootGrade } from '../types';
import './SpiritRootDisplay.scss';

/**
 * Quality names for display
 */
const QUALITY_NAMES: Record<SpiritRootGrade, string> = {
  1: 'Mortal',
  2: 'Common',
  3: 'Uncommon',
  4: 'Rare',
  5: 'Legendary',
};

/**
 * Quality colors mapped to CSS module classes
 */
const QUALITY_COLORS: Record<SpiritRootGrade, string> = {
  1: 'spirit-root__quality--grade1',
  2: 'spirit-root__quality--grade2',
  3: 'spirit-root__quality--grade3',
  4: 'spirit-root__quality--grade4',
  5: 'spirit-root__quality--grade5',
};

/**
 * Element colors (background gradients)
 */
const ELEMENT_COLORS: Record<SpiritRootElement, string> = {
  fire: 'spirit-root--fire',
  water: 'spirit-root--water',
  earth: 'spirit-root--earth',
  metal: 'spirit-root--metal',
  wood: 'spirit-root--wood',
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
 * Shows the player's spirit root quality, element, purity, and bonuses
 */
export function SpiritRootDisplay() {
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const rerollSpiritRoot = usePrestigeStore((state) => state.rerollSpiritRoot);
  const getQualityMultiplier = usePrestigeStore((state) => state.getSpiritRootQualityMultiplier);
  const getPurityMultiplier = usePrestigeStore((state) => state.getSpiritRootPurityMultiplier);
  const getTotalMultiplier = usePrestigeStore((state) => state.getSpiritRootTotalMultiplier);
  const rerollCost = usePrestigeStore((state) => state.getSpiritRootRerollCost());

  const gold = useInventoryStore((state) => state.gold);

  // If no spirit root exists yet, show placeholder
  if (!spiritRoot) {
    return (
      <div className="spirit-root">
        <h3 className="spirit-root__header">
          <span>🌟</span>
          <span>Spirit Root</span>
        </h3>
        <p className="spirit-root__placeholder">
          Your spirit root is being awakened...
        </p>
      </div>
    );
  }

  // Calculate multipliers
  const qualityMult = getQualityMultiplier();
  const purityMult = getPurityMultiplier();
  const totalMult = getTotalMultiplier();

  const canAfford = D(gold).gte(rerollCost);

  // Handle reroll
  const handleReroll = () => {
    const success = rerollSpiritRoot();
    if (!success) {
      console.log('[SpiritRoot] Reroll failed - not enough gold');
    }
  };

  return (
    <div className="spirit-root">
      <h3 className="spirit-root__header">
        <span>🌟</span>
        <span>Spirit Root</span>
      </h3>

      <div className={`spirit-root__card ${ELEMENT_COLORS[spiritRoot.element]}`}>
        <div className="spirit-root__card-content">
          <div className={`spirit-root__quality ${QUALITY_COLORS[spiritRoot.grade]}`}>
            {QUALITY_NAMES[spiritRoot.grade]}
          </div>

          <div className="spirit-root__element-label">{spiritRoot.element} Element</div>

          <div className="spirit-root__purity">{spiritRoot.purity}% Purity</div>
        </div>
      </div>

      <div className="spirit-root__bonus-card">
        <h4 className="spirit-root__bonus-title">Bonuses:</h4>
        <div className="spirit-root__bonus-list">
          <div className="spirit-root__bonus-row">
            <span className="spirit-root__bonus-label">Quality Multiplier:</span>
            <span className="spirit-root__bonus-value--green">{qualityMult.toFixed(2)}x</span>
          </div>

          <div className="spirit-root__bonus-row">
            <span className="spirit-root__bonus-label">Purity Multiplier:</span>
            <span className="spirit-root__bonus-value--blue">{purityMult.toFixed(2)}x</span>
          </div>

          <div className="spirit-root__bonus-row spirit-root__bonus-row--total">
            <span className="spirit-root__bonus-title">Total Multiplier:</span>
            <span className="spirit-root__bonus-total">{totalMult.toFixed(2)}x</span>
          </div>

          <div className="spirit-root__element-bonus">
            <span>Element Bonus:</span>
            <div>{ELEMENT_BONUS_DESCRIPTIONS[spiritRoot.element]}</div>
          </div>
        </div>
      </div>

      <div className="spirit-root__info">
        <span className="spirit-root__info-highlight">About Spirit Roots:</span> Your spirit root determines
        your cultivation potential. Higher quality and purity provide greater stat multipliers that apply to all
        your stats. Each element grants unique bonuses to specific abilities.
      </div>

      <button
        onClick={handleReroll}
        disabled={!canAfford}
        className="spirit-root__reroll"
        title={!canAfford ? `Need ${formatNumber(rerollCost.toString())} gold` : 'Reroll your spirit root'}
      >
        {canAfford
          ? `🔄 Reroll Spirit Root (${formatNumber(rerollCost.toString())}g)`
          : `🔒 Not Enough Gold (${formatNumber(rerollCost.toString())}g)`}
      </button>

      {!canAfford && (
        <p className="spirit-root__warning">
          Need {formatNumber(D(rerollCost).minus(gold).toString())} more gold
        </p>
      )}
    </div>
  );
}
