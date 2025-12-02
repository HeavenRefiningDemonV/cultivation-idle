import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { D, formatNumber, greaterThanOrEqualTo, divide } from '../../utils/numbers';
import type { FocusMode } from '../../types';
import { REALMS, FOCUS_MODE_MODIFIERS } from '../../constants';
import './CultivationTab.scss';

/**
 * Calculate upgrade cost based on tier
 */
function getUpgradeCost(type: 'idle' | 'damage' | 'hp', currentTier: number): string {
  const baseCosts = {
    idle: '100',
    damage: '150',
    hp: '120',
  };

  const baseCost = D(baseCosts[type]);
  const multiplier = Math.pow(1.5, currentTier);

  return baseCost.times(multiplier).toFixed(0);
}

/**
 * Circular progress ring component
 */
function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 12
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className={'cultivationTabProgressRing'}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className={'cultivationTabProgressTrack'}
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Format time duration
 */
function formatTime(seconds: number): string {
  if (seconds === Infinity || seconds < 0) return '∞';

  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)}h`;

  return `${Math.ceil(seconds / 86400)}d`;
}

/**
 * Calculate Qi/s with a different focus mode
 */
function calculateQiWithFocusMode(currentQiPerSecond: string, currentMode: FocusMode, targetMode: FocusMode): string {
  if (currentMode === targetMode) return currentQiPerSecond;

  const currentQi = D(currentQiPerSecond);
  const currentMultiplier = FOCUS_MODE_MODIFIERS[currentMode].qiMultiplier;
  const targetMultiplier = FOCUS_MODE_MODIFIERS[targetMode].qiMultiplier;

  // Remove current multiplier and apply target multiplier
  const baseQi = currentQi.dividedBy(currentMultiplier);
  return baseQi.times(targetMultiplier).toString();
}

/**
 * Cultivation Tab Component
 */
export function CultivationTab() {
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const realm = useGameStore((state) => state.realm);
  const focusMode = useGameStore((state) => state.focusMode);
  const totalAuras = useGameStore((state) => state.totalAuras);
  const upgradeTiers = useGameStore((state) => state.upgradeTiers);

  const setFocusMode = useGameStore((state) => state.setFocusMode);
  const breakthrough = useGameStore((state) => state.breakthrough);
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade);

  // Get current realm definition
  const currentRealmDef = REALMS.find((r) => r.index === realm.index);
  const qiRequired = currentRealmDef?.qiRequirement || '1000';

  // Calculate progress
  const progressPercent = Math.min(
    100,
    parseFloat(divide(qi, qiRequired).times(100).toFixed(2))
  );

  // Calculate time to breakthrough
  const qiNeeded = D(qiRequired).minus(qi);
  const secondsToBreakthrough = qiNeeded.greaterThan(0)
    ? qiNeeded.dividedBy(qiPerSecond).toNumber()
    : 0;

  // Check if can breakthrough
  const canBreakthrough = greaterThanOrEqualTo(qi, qiRequired);

  // Calculate upgrade costs
  const idleCost = getUpgradeCost('idle', upgradeTiers.idle);
  const damageCost = getUpgradeCost('damage', upgradeTiers.damage);
  const hpCost = getUpgradeCost('hp', upgradeTiers.hp);

  // Check if can afford upgrades
  const canAffordIdle = greaterThanOrEqualTo(qi, idleCost);
  const canAffordDamage = greaterThanOrEqualTo(qi, damageCost);
  const canAffordHp = greaterThanOrEqualTo(qi, hpCost);

  // Handle breakthrough
  const handleBreakthrough = () => {
    const success = breakthrough();
    if (success) {
      console.log('[CultivationTab] Breakthrough successful!');
    }
  };

  // Handle upgrade purchase
  const handleUpgrade = (type: 'idle' | 'damage' | 'hp') => {
    const success = purchaseUpgrade(type);
    if (success) {
      console.log(`[CultivationTab] Purchased ${type} upgrade!`);
    }
  };

  return (
    <div className={'cultivationTabRoot'}>
      {/* TOP SECTION - Realm Progress */}
      <div className={`${'cultivationTabPanel'} ${'cultivationTabTopPanel'}`}>
        <div className={'cultivationTabTopContent'}>
          {/* Progress Ring */}
          <div className={'cultivationTabProgressWrapper'}>
            <ProgressRing progress={progressPercent} size={220} strokeWidth={14} />
            <div className={'cultivationTabProgressOverlay'}>
              <div className={'cultivationTabProgressValue'}>{progressPercent.toFixed(1)}%</div>
              <div className={'cultivationTabProgressLabel'}>Progress</div>
            </div>
          </div>

          {/* Realm Info */}
          <div className={'cultivationTabRealmInfo'}>
            <h2 className={'cultivationTabRealmTitle'}>{realm.name}</h2>
            <p className={'cultivationTabRealmSubtitle'}>
              Substage {realm.substage + 1} / {currentRealmDef?.substages || 10}
            </p>
            <div className={'cultivationTabRealmMajor'}>{currentRealmDef?.majorRealm || 'Mortal Realm'}</div>
            <div className={'cultivationTabRealmStats'}>
              <div className={'cultivationTabStatLabel'}>Total Breakthroughs:</div>
              <div className={'cultivationTabStatHighlight'}>{totalAuras}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION - Qi Statistics */}
      <div className={'cultivationTabStatGrid'}>
        <motion.div className={'cultivationTabStatCard'} whileHover={{ scale: 1.02 }}>
          <div className={'cultivationTabStatCardLabel'}>Current Qi</div>
          <div className={'cultivationTabStatCardValue'}>{formatNumber(qi)}</div>
        </motion.div>

        <motion.div className={'cultivationTabStatCard'} whileHover={{ scale: 1.02 }}>
          <div className={'cultivationTabStatCardLabel'}>Qi per Second</div>
          <div className={'cultivationTabStatCardValue'}>{formatNumber(qiPerSecond)}</div>
        </motion.div>

        <motion.div className={'cultivationTabStatCard'} whileHover={{ scale: 1.02 }}>
          <div className={'cultivationTabStatCardLabel'}>Time to Breakthrough</div>
          <div className={'cultivationTabStatCardValueAlt'}>{formatTime(secondsToBreakthrough)}</div>
        </motion.div>
      </div>

      {/* FOCUS MODE SELECTOR */}
      <div className={`${'cultivationTabPanel'} ${'cultivationTabFocusPanel'}`}>
        <h3 className={'cultivationTabSectionTitle'}>Cultivation Focus</h3>
        <div className={'cultivationTabFocusGrid'}>
          {(['balanced', 'body', 'spirit'] as FocusMode[]).map((mode) => {
            const isActive = focusMode === mode;
            const modifiers = FOCUS_MODE_MODIFIERS[mode];
            const projectedQiPerSecond = calculateQiWithFocusMode(qiPerSecond, focusMode, mode);

            return (
              <motion.button
                key={mode}
                onClick={() => setFocusMode(mode)}
                className={`${'cultivationTabFocusCard'} ${isActive ? 'cultivationTabFocusCardActive' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={'cultivationTabFocusTitle'}>{mode === 'balanced' ? 'Balanced' : `${mode} Focus`}</div>
                <div className={'cultivationTabFocusStats'}>
                  <div className={'cultivationTabFocusQi'}>
                    Qi/s: <span className={'cultivationTabFocusQiValue'}>{formatNumber(projectedQiPerSecond)}</span>
                  </div>
                  <div className={'cultivationTabFocusModifiers'}>
                    {modifiers.qiMultiplier !== 1 && (
                      <div>Qi: {modifiers.qiMultiplier > 1 ? '+' : ''}{((modifiers.qiMultiplier - 1) * 100).toFixed(0)}%</div>
                    )}
                    {modifiers.hpMultiplier !== 1 && (
                      <div>HP: {modifiers.hpMultiplier > 1 ? '+' : ''}{((modifiers.hpMultiplier - 1) * 100).toFixed(0)}%</div>
                    )}
                    {modifiers.atkMultiplier !== 1 && (
                      <div>ATK: {modifiers.atkMultiplier > 1 ? '+' : ''}{((modifiers.atkMultiplier - 1) * 100).toFixed(0)}%</div>
                    )}
                    {modifiers.defMultiplier !== 1 && (
                      <div>DEF: {modifiers.defMultiplier > 1 ? '+' : ''}{((modifiers.defMultiplier - 1) * 100).toFixed(0)}%</div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* BREAKTHROUGH BUTTON */}
      <motion.div
        className={`${'cultivationTabPanel'} ${'cultivationTabBreakthroughPanel'}`}
        animate={
          canBreakthrough
            ? {
                boxShadow: [
                  '0 0 20px rgba(6, 182, 212, 0.3)',
                  '0 0 40px rgba(6, 182, 212, 0.5)',
                  '0 0 20px rgba(6, 182, 212, 0.3)',
                ],
              }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className={'cultivationTabBreakthroughContent'}>
          <div className={'cultivationTabBreakthroughInfo'}>
            <div className={'cultivationTabBreakthroughLabel'}>Breakthrough Requirement</div>
            <div className={'cultivationTabBreakthroughValue'}>
              {formatNumber(qi)} / {formatNumber(qiRequired)}
            </div>
          </div>

          <motion.button
            onClick={handleBreakthrough}
            disabled={!canBreakthrough}
            className={`${'cultivationTabBreakthroughButton'} ${
              canBreakthrough ? 'cultivationTabBreakthroughReady' : 'cultivationTabBreakthroughDisabled'
            }`}
            whileHover={canBreakthrough ? { scale: 1.05 } : {}}
            whileTap={canBreakthrough ? { scale: 0.95 } : {}}
          >
            {canBreakthrough ? '✨ Breakthrough! ✨' : 'Insufficient Qi'}
          </motion.button>
        </div>
      </motion.div>

      {/* UPGRADES SECTION */}
      <div className={`${'cultivationTabPanel'} ${'cultivationTabUpgradePanel'}`}>
        <h3 className={'cultivationTabSectionTitle'}>Cultivation Upgrades</h3>
        <div className={'cultivationTabUpgradeGrid'}>
          {/* Idle Efficiency */}
          <motion.div className={`${'cultivationTabUpgradeCard'} ${'cultivationTabIdleCard'}`} whileHover={{ scale: 1.02 }}>
            <div className={`${'cultivationTabUpgradeTitle'} ${'cultivationTabIdleTitle'}`}>⚡ Idle Efficiency</div>
            <div className={'cultivationTabUpgradeDescription'}>Increases Qi generation by 10%</div>
            <div className={'cultivationTabUpgradeTier'}>
              Current Tier: <span className={'cultivationTabUpgradeTierValue'}>{upgradeTiers.idle}</span>
            </div>
            <button
              onClick={() => handleUpgrade('idle')}
              disabled={!canAffordIdle}
              className={`${'cultivationTabUpgradeButton'} ${
                canAffordIdle ? 'cultivationTabUpgradeButtonActive' : 'cultivationTabUpgradeButtonDisabled'
              }`}
            >
              Cost: {formatNumber(idleCost)} Qi
            </button>
          </motion.div>

          {/* Damage Boost */}
          <motion.div className={`${'cultivationTabUpgradeCard'} ${'cultivationTabDamageCard'}`} whileHover={{ scale: 1.02 }}>
            <div className={`${'cultivationTabUpgradeTitle'} ${'cultivationTabDamageTitle'}`}>⚔️ Damage Boost</div>
            <div className={'cultivationTabUpgradeDescription'}>Increases attack power by 5%</div>
            <div className={'cultivationTabUpgradeTier'}>
              Current Tier: <span className={'cultivationTabUpgradeTierValue'}>{upgradeTiers.damage}</span>
            </div>
            <button
              onClick={() => handleUpgrade('damage')}
              disabled={!canAffordDamage}
              className={`${'cultivationTabUpgradeButton'} ${
                canAffordDamage ? 'cultivationTabUpgradeButtonActive' : 'cultivationTabUpgradeButtonDisabled'
              }`}
            >
              Cost: {formatNumber(damageCost)} Qi
            </button>
          </motion.div>

          {/* HP Boost */}
          <motion.div className={`${'cultivationTabUpgradeCard'} ${'cultivationTabHpCard'}`} whileHover={{ scale: 1.02 }}>
            <div className={`${'cultivationTabUpgradeTitle'} ${'cultivationTabHpTitle'}`}>❤️ HP Boost</div>
            <div className={'cultivationTabUpgradeDescription'}>Increases max HP by 5%</div>
            <div className={'cultivationTabUpgradeTier'}>
              Current Tier: <span className={'cultivationTabUpgradeTierValue'}>{upgradeTiers.hp}</span>
            </div>
            <button
              onClick={() => handleUpgrade('hp')}
              disabled={!canAffordHp}
              className={`${'cultivationTabUpgradeButton'} ${
                canAffordHp ? 'cultivationTabUpgradeButtonActive' : 'cultivationTabUpgradeButtonDisabled'
              }`}
            >
              Cost: {formatNumber(hpCost)} Qi
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
