import { usePrestigeStore } from '../stores/prestigeStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { formatNumber, D } from '../utils/numbers';
import type { SpiritRootElement, SpiritRootGrade } from '../types';
import styles from './SpiritRootDisplay.module.css';

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
  1: styles.quality1,
  2: styles.quality2,
  3: styles.quality3,
  4: styles.quality4,
  5: styles.quality5,
};

/**
 * Element colors (background gradients)
 */
const ELEMENT_COLORS: Record<SpiritRootElement, string> = {
  fire: styles.elementFire,
  water: styles.elementWater,
  earth: styles.elementEarth,
  metal: styles.elementMetal,
  wood: styles.elementWood,
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
      <div className={styles.root}>
        <h3 className={styles.header}>
          <span>🌟</span>
          <span>Spirit Root</span>
        </h3>
        <p className={styles.placeholderText}>
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
    <div className={styles.root}>
      <h3 className={styles.header}>
        <span>🌟</span>
        <span>Spirit Root</span>
      </h3>

      <div className={`${styles.spiritCard} ${ELEMENT_COLORS[spiritRoot.element]}`}>
        <div className={styles.spiritContent}>
          <div className={`${styles.qualityText} ${QUALITY_COLORS[spiritRoot.grade]}`}>
            {QUALITY_NAMES[spiritRoot.grade]}
          </div>

          <div className={styles.elementLabel}>{spiritRoot.element} Element</div>

          <div className={styles.purityText}>{spiritRoot.purity}% Purity</div>
        </div>
      </div>

      <div className={styles.bonusCard}>
        <h4 className={styles.bonusHeader}>Bonuses:</h4>
        <div className={styles.bonusList}>
          <div className={styles.bonusRow}>
            <span className={styles.bonusLabel}>Quality Multiplier:</span>
            <span className={styles.bonusValueGreen}>{qualityMult.toFixed(2)}x</span>
          </div>

          <div className={styles.bonusRow}>
            <span className={styles.bonusLabel}>Purity Multiplier:</span>
            <span className={styles.bonusValueBlue}>{purityMult.toFixed(2)}x</span>
          </div>

          <div className={`${styles.bonusRow} ${styles.bonusTotal}`}>
            <span className={styles.bonusHeader}>Total Multiplier:</span>
            <span className={styles.bonusTotalValue}>{totalMult.toFixed(2)}x</span>
          </div>

          <div className={styles.elementBonus}>
            <span>Element Bonus:</span>
            <div>{ELEMENT_BONUS_DESCRIPTIONS[spiritRoot.element]}</div>
          </div>
        </div>
      </div>

      <div className={styles.infoBox}>
        <span className={styles.infoHighlight}>About Spirit Roots:</span> Your spirit root determines
        your cultivation potential. Higher quality and purity provide greater stat multipliers that apply to all
        your stats. Each element grants unique bonuses to specific abilities.
      </div>

      <button
        onClick={handleReroll}
        disabled={!canAfford}
        className={styles.rerollButton}
        title={!canAfford ? `Need ${formatNumber(rerollCost.toString())} gold` : 'Reroll your spirit root'}
      >
        {canAfford
          ? `🔄 Reroll Spirit Root (${formatNumber(rerollCost.toString())}g)`
          : `🔒 Not Enough Gold (${formatNumber(rerollCost.toString())}g)`}
      </button>

      {!canAfford && (
        <p className={styles.warningText}>
          Need {formatNumber(D(rerollCost).minus(gold).toString())} more gold
        </p>
      )}
    </div>
  );
}
