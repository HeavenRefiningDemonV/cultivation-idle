import { useEffect, useState } from 'react';
import { Droplet, Flame, Hexagon, Info, Leaf, Mountain, Sparkles } from 'lucide-react';
import { usePrestigeStore } from '../stores/prestigeStore.js';
import { useInventoryStore } from '../stores/inventoryStore.js';
import { formatNumber, D } from '../utils/numbers.js';
import type { SpiritRootElement, SpiritRootGrade } from '../types/index.js';
import { GameIcon } from '../ui/icons/index.js';
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
 * Element colors (background gradients)
 */
const ELEMENT_COLORS: Record<SpiritRootElement, string> = {
  fire: 'spiritRootDisplayElementFire',
  water: 'spiritRootDisplayElementWater',
  earth: 'spiritRootDisplayElementEarth',
  metal: 'spiritRootDisplayElementMetal',
  wood: 'spiritRootDisplayElementWood',
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

const ELEMENT_ICONS: Record<SpiritRootElement, React.ReactNode> = {
  fire: <Flame aria-hidden />,
  water: <Droplet aria-hidden />,
  earth: <Mountain aria-hidden />,
  metal: <Hexagon aria-hidden />,
  wood: <Leaf aria-hidden />,
};

/**
 * Spirit Root Display Component
 * Shows the player's spirit root quality, element, purity, and bonuses
 */
type SpiritRootDisplayProps = {
  variant?: 'altar' | 'summary';
};

export function SpiritRootDisplay({ variant = 'altar' }: SpiritRootDisplayProps) {
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const rerollSpiritRoot = usePrestigeStore((state) => state.rerollSpiritRoot);
  const getQualityMultiplier = usePrestigeStore((state) => state.getSpiritRootQualityMultiplier);
  const getPurityMultiplier = usePrestigeStore((state) => state.getSpiritRootPurityMultiplier);
  const getTotalMultiplier = usePrestigeStore((state) => state.getSpiritRootTotalMultiplier);
  const rerollCost = usePrestigeStore((state) => state.getSpiritRootRerollCost());

  const gold = useInventoryStore((state) => state.gold);
  const [justRerolled, setJustRerolled] = useState(false);

  useEffect(() => {
    if (!justRerolled) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setJustRerolled(false), 420);
    return () => window.clearTimeout(timeout);
  }, [justRerolled]);

  if (variant === 'summary') {
    return (
      <div className="spiritRootSummary">
        <div className="spiritRootSummaryCrest">Spirit Root</div>
        <div className="spiritRootSummaryRow">
          <span className="spiritRootSummaryLabel">Element</span>
          <span className="spiritRootSummaryValue">{spiritRoot ? `${spiritRoot.element[0].toUpperCase()}${spiritRoot.element.slice(1)}` : 'Dormant'}</span>
        </div>
        <div className="spiritRootSummaryRow">
          <span className="spiritRootSummaryLabel">Grade</span>
          <span className="spiritRootSummaryValue">{spiritRoot ? QUALITY_NAMES[spiritRoot.grade] : 'Dormant'}</span>
        </div>
        <div className="spiritRootSummaryRow">
          <span className="spiritRootSummaryLabel">Purity</span>
          <span className="spiritRootSummaryValue">{spiritRoot ? `${Math.round(spiritRoot.purity)}%` : '0%'}</span>
        </div>
        <div className="spiritRootSummaryRow">
          <span className="spiritRootSummaryLabel">Total Multiplier</span>
          <span className="spiritRootSummaryValue">{getTotalMultiplier().toFixed(2)}x</span>
        </div>
      </div>
    );
  }

  // If no spirit root exists yet, show placeholder
  if (!spiritRoot) {
    return (
      <div className="spiritAltarRoot" data-element="none" data-grade="0">
        <div className="spiritAltarHeader">
          <div className="spiritAltarTitle">
            <Sparkles className="spiritAltarTitleIcon" aria-hidden />
            <h3>Spirit Root</h3>
          </div>
          <div className="spiritAltarGradeSeal spiritAltarGradeSeal--0">Dormant</div>
        </div>
        <div className="spiritAltarPlaceholder">Your spirit root is being awakened...</div>
      </div>
    );
  }

  // Calculate multipliers
  const qualityMult = getQualityMultiplier();
  const purityMult = getPurityMultiplier();
  const totalMult = getTotalMultiplier();
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const purityPercent = Math.min(100, Math.max(0, spiritRoot.purity));
  const ringOffset = ringCircumference * (1 - purityPercent / 100);

  const canAfford = D(gold).gte(rerollCost);

  // Handle reroll
  const handleReroll = () => {
    const success = rerollSpiritRoot();
    if (!success) {
      console.log('[SpiritRoot] Reroll failed - not enough gold');
      return;
    }
    setJustRerolled(true);
  };

  return (
    <div
      className={`spiritAltarRoot ${justRerolled ? 'is-rerolled' : ''}`}
      data-element={spiritRoot.element}
      data-grade={spiritRoot.grade}
    >
      <div className="spiritAltarHeader">
        <div className="spiritAltarTitle">
          <Sparkles className="spiritAltarTitleIcon" aria-hidden />
          <h3>Spirit Root</h3>
        </div>
        <div className={`spiritAltarGradeSeal spiritAltarGradeSeal--${spiritRoot.grade}`}>
          {QUALITY_NAMES[spiritRoot.grade]}
        </div>
      </div>

      <div className="spiritAltarCrest">
        <div className="spiritAltarCrestRing" aria-hidden>
          <svg className="spiritAltarPurityRing" viewBox="0 0 120 120">
            <circle className="spiritAltarPurityRingBase" cx="60" cy="60" r={ringRadius} />
            <circle
              className="spiritAltarPurityRingProg"
              cx="60"
              cy="60"
              r={ringRadius}
              style={{
                strokeDasharray: `${ringCircumference}`,
                strokeDashoffset: `${ringOffset}`,
              }}
            />
          </svg>
        </div>

        <div className="spiritAltarMotes" aria-hidden>
          <span className="spiritAltarMote spiritAltarMote--1" />
          <span className="spiritAltarMote spiritAltarMote--2" />
          <span className="spiritAltarMote spiritAltarMote--3" />
        </div>

        <div className={`spiritAltarGlyph ${ELEMENT_COLORS[spiritRoot.element]}`} aria-hidden>
          {ELEMENT_ICONS[spiritRoot.element]}
        </div>

        <div className="spiritAltarCrestText">
          <div className="spiritAltarElementName">{spiritRoot.element} Element</div>
          <div className="spiritAltarPurityValue">{spiritRoot.purity}% Purity</div>
        </div>
      </div>

      <div className="spiritAltarChips">
        <div className="spiritAltarChip">
          <div className="spiritAltarChipLabel">Quality</div>
          <div className="spiritAltarChipValue">{qualityMult.toFixed(2)}x</div>
        </div>
        <div className="spiritAltarChip">
          <div className="spiritAltarChipLabel">Purity</div>
          <div className="spiritAltarChipValue">{purityMult.toFixed(2)}x</div>
        </div>
        <div className="spiritAltarChip spiritAltarChip--total">
          <div className="spiritAltarChipLabel">Total</div>
          <div className="spiritAltarChipValue">{totalMult.toFixed(2)}x</div>
        </div>
      </div>

      <div className="spiritAltarElementBonus">
        <div className="spiritAltarElementBonusLabel">Element Bonus</div>
        <div className="spiritAltarElementBonusValue">
          {ELEMENT_BONUS_DESCRIPTIONS[spiritRoot.element]}
        </div>
      </div>

      <details className="spiritAltarAbout">
        <summary className="spiritAltarAboutSummary">
          <Info className="spiritAltarAboutIcon" aria-hidden />
          About Spirit Roots
        </summary>
        <div className="spiritAltarAboutBody">
          Your spirit root determines your cultivation potential. Higher quality and purity provide greater stat
          multipliers that apply to all your stats. Each element grants unique bonuses to specific abilities.
        </div>
      </details>

      <div className="spiritAltarFooter">
        <button
          onClick={handleReroll}
          disabled={!canAfford}
          className="button-standard spiritAltarRerollButton"
          title={!canAfford ? `Need ${formatNumber(rerollCost.toString())} gold` : 'Reroll your spirit root'}
        >
          <span className="spiritAltarRerollButtonContent">
            <GameIcon icon={canAfford ? 'inkRefresh' : 'inkLock'} size={14} decorative />
            <span>
              {canAfford ? 'Reroll Spirit Root' : 'Not Enough Gold'} ({formatNumber(rerollCost.toString())}g)
            </span>
          </span>
        </button>

        {!canAfford && (
          <div className="spiritAltarWarning">
            Need {formatNumber(D(rerollCost).minus(gold).toString())} more gold
          </div>
        )}
      </div>
    </div>
  );
}
