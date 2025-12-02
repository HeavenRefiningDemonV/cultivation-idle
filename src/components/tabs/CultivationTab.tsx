import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { D, formatNumber, greaterThanOrEqualTo, divide } from '../../utils/numbers';
import type { FocusMode } from '../../types';
import { REALMS, FOCUS_MODE_MODIFIERS } from '../../constants';
import styles from './CultivationTab.module.css';

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
    <svg width={size} height={size} className={styles.progressRing}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className={styles.progressTrack}
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
    <div className={styles.root}>
      {/* TOP SECTION - Realm Progress */}
      <div className={`${styles.panel} ${styles.topPanel}`}>
        <div className={styles.topContent}>
          {/* Progress Ring */}
          <div className={styles.progressWrapper}>
            <ProgressRing progress={progressPercent} size={220} strokeWidth={14} />
            <div className={styles.progressOverlay}>
              <div className={styles.progressValue}>{progressPercent.toFixed(1)}%</div>
              <div className={styles.progressLabel}>Progress</div>
            </div>
          </div>

          {/* Realm Info */}
          <div className={styles.realmInfo}>
            <h2 className={styles.realmTitle}>{realm.name}</h2>
            <p className={styles.realmSubtitle}>
              Substage {realm.substage + 1} / {currentRealmDef?.substages || 10}
            </p>
            <div className={styles.realmMajor}>{currentRealmDef?.majorRealm || 'Mortal Realm'}</div>
            <div className={styles.realmStats}>
              <div className={styles.statLabel}>Total Breakthroughs:</div>
              <div className={styles.statHighlight}>{totalAuras}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION - Qi Statistics */}
      <div className={styles.statGrid}>
        <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
          <div className={styles.statCardLabel}>Current Qi</div>
          <div className={styles.statCardValue}>{formatNumber(qi)}</div>
        </motion.div>

        <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
          <div className={styles.statCardLabel}>Qi per Second</div>
          <div className={styles.statCardValue}>{formatNumber(qiPerSecond)}</div>
        </motion.div>

        <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
          <div className={styles.statCardLabel}>Time to Breakthrough</div>
          <div className={styles.statCardValueAlt}>{formatTime(secondsToBreakthrough)}</div>
        </motion.div>
      </div>

      {/* FOCUS MODE SELECTOR */}
      <div className={`${styles.panel} ${styles.focusPanel}`}>
        <h3 className={styles.sectionTitle}>Cultivation Focus</h3>
        <div className={styles.focusGrid}>
          {(['balanced', 'body', 'spirit'] as FocusMode[]).map((mode) => {
            const isActive = focusMode === mode;
            const modifiers = FOCUS_MODE_MODIFIERS[mode];
            const projectedQiPerSecond = calculateQiWithFocusMode(qiPerSecond, focusMode, mode);

            return (
              <motion.button
                key={mode}
                onClick={() => setFocusMode(mode)}
                className={`${styles.focusCard} ${isActive ? styles.focusCardActive : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={styles.focusTitle}>{mode === 'balanced' ? 'Balanced' : `${mode} Focus`}</div>
                <div className={styles.focusStats}>
                  <div className={styles.focusQi}>
                    Qi/s: <span className={styles.focusQiValue}>{formatNumber(projectedQiPerSecond)}</span>
                  </div>
                  <div className={styles.focusModifiers}>
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
        className={`${styles.panel} ${styles.breakthroughPanel}`}
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
        <div className={styles.breakthroughContent}>
          <div className={styles.breakthroughInfo}>
            <div className={styles.breakthroughLabel}>Breakthrough Requirement</div>
            <div className={styles.breakthroughValue}>
              {formatNumber(qi)} / {formatNumber(qiRequired)}
            </div>
          </div>

          <motion.button
            onClick={handleBreakthrough}
            disabled={!canBreakthrough}
            className={`${styles.breakthroughButton} ${
              canBreakthrough ? styles.breakthroughReady : styles.breakthroughDisabled
            }`}
            whileHover={canBreakthrough ? { scale: 1.05 } : {}}
            whileTap={canBreakthrough ? { scale: 0.95 } : {}}
          >
            {canBreakthrough ? '✨ Breakthrough! ✨' : 'Insufficient Qi'}
          </motion.button>
        </div>
      </motion.div>

      {/* UPGRADES SECTION */}
      <div className={`${styles.panel} ${styles.upgradePanel}`}>
        <h3 className={styles.sectionTitle}>Cultivation Upgrades</h3>
        <div className={styles.upgradeGrid}>
          {/* Idle Efficiency */}
          <motion.div className={`${styles.upgradeCard} ${styles.idleCard}`} whileHover={{ scale: 1.02 }}>
            <div className={`${styles.upgradeTitle} ${styles.idleTitle}`}>⚡ Idle Efficiency</div>
            <div className={styles.upgradeDescription}>Increases Qi generation by 10%</div>
            <div className={styles.upgradeTier}>
              Current Tier: <span className={styles.upgradeTierValue}>{upgradeTiers.idle}</span>
            </div>
            <button
              onClick={() => handleUpgrade('idle')}
              disabled={!canAffordIdle}
              className={`${styles.upgradeButton} ${
                canAffordIdle ? styles.upgradeButtonActive : styles.upgradeButtonDisabled
              }`}
            >
              Cost: {formatNumber(idleCost)} Qi
            </button>
          </motion.div>

          {/* Damage Boost */}
          <motion.div className={`${styles.upgradeCard} ${styles.damageCard}`} whileHover={{ scale: 1.02 }}>
            <div className={`${styles.upgradeTitle} ${styles.damageTitle}`}>⚔️ Damage Boost</div>
            <div className={styles.upgradeDescription}>Increases attack power by 5%</div>
            <div className={styles.upgradeTier}>
              Current Tier: <span className={styles.upgradeTierValue}>{upgradeTiers.damage}</span>
            </div>
            <button
              onClick={() => handleUpgrade('damage')}
              disabled={!canAffordDamage}
              className={`${styles.upgradeButton} ${
                canAffordDamage ? styles.upgradeButtonActive : styles.upgradeButtonDisabled
              }`}
            >
              Cost: {formatNumber(damageCost)} Qi
            </button>
          </motion.div>

          {/* HP Boost */}
          <motion.div className={`${styles.upgradeCard} ${styles.hpCard}`} whileHover={{ scale: 1.02 }}>
            <div className={`${styles.upgradeTitle} ${styles.hpTitle}`}>❤️ HP Boost</div>
            <div className={styles.upgradeDescription}>Increases max HP by 5%</div>
            <div className={styles.upgradeTier}>
              Current Tier: <span className={styles.upgradeTierValue}>{upgradeTiers.hp}</span>
            </div>
            <button
              onClick={() => handleUpgrade('hp')}
              disabled={!canAffordHp}
              className={`${styles.upgradeButton} ${
                canAffordHp ? styles.upgradeButtonActive : styles.upgradeButtonDisabled
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
