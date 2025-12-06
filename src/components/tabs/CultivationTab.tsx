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
    <svg width={size} height={size} className={'cultivation-tab__progress-ring'}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className={'cultivation-tab__progress-track'}
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
    <div className={'cultivation-tab'}>
      {/* TOP SECTION - Realm Progress */}
      <div className={`${'cultivation-tab__panel'} ${'cultivation-tab__top-panel'}`}>
        <div className={'cultivation-tab__top-content'}>
          {/* Progress Ring */}
          <div className={'cultivation-tab__progress-wrapper'}>
            <ProgressRing progress={progressPercent} size={220} strokeWidth={14} />
            <div className={'cultivation-tab__progress-overlay'}>
              <div className={'cultivation-tab__progress-value'}>{progressPercent.toFixed(1)}%</div>
              <div className={'cultivation-tab__progress-label'}>Progress</div>
            </div>
          </div>

          {/* Realm Info */}
          <div className={'cultivation-tab__realm-info'}>
            <h2 className={'cultivation-tab__realm-title'}>{realm.name}</h2>
            <p className={'cultivation-tab__realm-subtitle'}>
              Substage {realm.substage + 1} / {currentRealmDef?.substages || 10}
            </p>
            <div className={'cultivation-tab__realm-major'}>{currentRealmDef?.majorRealm || 'Mortal Realm'}</div>
            <div className={'cultivation-tab__realm-stats'}>
              <div className={'cultivation-tab__stat-label'}>Total Breakthroughs:</div>
              <div className={'cultivation-tab__stat-highlight'}>{totalAuras}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION - Qi Statistics */}
      <div className={'cultivation-tab__stat-grid'}>
        <motion.div className={'cultivation-tab__stat-card'} whileHover={{ scale: 1.02 }}>
          <div className={'cultivation-tab__stat-card-label'}>Current Qi</div>
          <div className={'cultivation-tab__stat-card-value'}>{formatNumber(qi)}</div>
        </motion.div>

        <motion.div className={'cultivation-tab__stat-card'} whileHover={{ scale: 1.02 }}>
          <div className={'cultivation-tab__stat-card-label'}>Qi per Second</div>
          <div className={'cultivation-tab__stat-card-value'}>{formatNumber(qiPerSecond)}</div>
        </motion.div>

        <motion.div className={'cultivation-tab__stat-card'} whileHover={{ scale: 1.02 }}>
          <div className={'cultivation-tab__stat-card-label'}>Time to Breakthrough</div>
          <div className={'cultivation-tab__stat-card-value-alt'}>{formatTime(secondsToBreakthrough)}</div>
        </motion.div>
      </div>

      {/* FOCUS MODE SELECTOR */}
      <div className={`${'cultivation-tab__panel'} ${'cultivation-tab__focus-panel'}`}>
        <h3 className={'cultivation-tab__section-title'}>Cultivation Focus</h3>
        <div className={'cultivation-tab__focus-grid'}>
          {(['balanced', 'body', 'spirit'] as FocusMode[]).map((mode) => {
            const isActive = focusMode === mode;
            const modifiers = FOCUS_MODE_MODIFIERS[mode];
            const projectedQiPerSecond = calculateQiWithFocusMode(qiPerSecond, focusMode, mode);

            return (
              <motion.button
                key={mode}
                onClick={() => setFocusMode(mode)}
                className={`${'cultivation-tab__focus-card'} ${isActive ? 'cultivation-tab__focus-card-active' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={'cultivation-tab__focus-title'}>{mode === 'balanced' ? 'Balanced' : `${mode} Focus`}</div>
                <div className={'cultivation-tab__focus-stats'}>
                  <div className={'cultivation-tab__focus-qi'}>
                    Qi/s: <span className={'cultivation-tab__focus-qi-value'}>{formatNumber(projectedQiPerSecond)}</span>
                  </div>
                  <div className={'cultivation-tab__focus-modifiers'}>
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
        className={`${'cultivation-tab__panel'} ${'cultivation-tab__breakthrough-panel'}`}
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
        <div className={'cultivation-tab__breakthrough-content'}>
          <div className={'cultivation-tab__breakthrough-info'}>
            <div className={'cultivation-tab__breakthrough-label'}>Breakthrough Requirement</div>
            <div className={'cultivation-tab__breakthrough-value'}>
              {formatNumber(qi)} / {formatNumber(qiRequired)}
            </div>
          </div>

          <motion.button
            onClick={handleBreakthrough}
            disabled={!canBreakthrough}
            className={`${'cultivation-tab__breakthrough-button'} ${
              canBreakthrough ? 'cultivation-tab__breakthrough-ready' : 'cultivation-tab__breakthrough-disabled'
            }`}
            whileHover={canBreakthrough ? { scale: 1.05 } : {}}
            whileTap={canBreakthrough ? { scale: 0.95 } : {}}
          >
            {canBreakthrough ? '✨ Breakthrough! ✨' : 'Insufficient Qi'}
          </motion.button>
        </div>
      </motion.div>

      {/* UPGRADES SECTION */}
      <div className={`${'cultivation-tab__panel'} ${'cultivation-tab__upgrade-panel'}`}>
        <h3 className={'cultivation-tab__section-title'}>Cultivation Upgrades</h3>
        <div className={'cultivation-tab__upgrade-grid'}>
          {/* Idle Efficiency */}
          <motion.div className={`${'cultivation-tab__upgrade-card'} ${'cultivation-tab__idle-card'}`} whileHover={{ scale: 1.02 }}>
            <div className={`${'cultivation-tab__upgrade-title'} ${'cultivation-tab__idle-title'}`}>⚡ Idle Efficiency</div>
            <div className={'cultivation-tab__upgrade-description'}>Increases Qi generation by 10%</div>
            <div className={'cultivation-tab__upgrade-tier'}>
              Current Tier: <span className={'cultivation-tab__upgrade-tier-value'}>{upgradeTiers.idle}</span>
            </div>
            <button
              onClick={() => handleUpgrade('idle')}
              disabled={!canAffordIdle}
              className={`${'cultivation-tab__upgrade-button'} ${
                canAffordIdle ? 'cultivation-tab__upgrade-button-active' : 'cultivation-tab__upgrade-button-disabled'
              }`}
            >
              Cost: {formatNumber(idleCost)} Qi
            </button>
          </motion.div>

          {/* Damage Boost */}
          <motion.div className={`${'cultivation-tab__upgrade-card'} ${'cultivation-tab__damage-card'}`} whileHover={{ scale: 1.02 }}>
            <div className={`${'cultivation-tab__upgrade-title'} ${'cultivation-tab__damage-title'}`}>⚔️ Damage Boost</div>
            <div className={'cultivation-tab__upgrade-description'}>Increases attack power by 5%</div>
            <div className={'cultivation-tab__upgrade-tier'}>
              Current Tier: <span className={'cultivation-tab__upgrade-tier-value'}>{upgradeTiers.damage}</span>
            </div>
            <button
              onClick={() => handleUpgrade('damage')}
              disabled={!canAffordDamage}
              className={`${'cultivation-tab__upgrade-button'} ${
                canAffordDamage ? 'cultivation-tab__upgrade-button-active' : 'cultivation-tab__upgrade-button-disabled'
              }`}
            >
              Cost: {formatNumber(damageCost)} Qi
            </button>
          </motion.div>

          {/* HP Boost */}
          <motion.div className={`${'cultivation-tab__upgrade-card'} ${'cultivation-tab__hp-card'}`} whileHover={{ scale: 1.02 }}>
            <div className={`${'cultivation-tab__upgrade-title'} ${'cultivation-tab__hp-title'}`}>❤️ HP Boost</div>
            <div className={'cultivation-tab__upgrade-description'}>Increases max HP by 5%</div>
            <div className={'cultivation-tab__upgrade-tier'}>
              Current Tier: <span className={'cultivation-tab__upgrade-tier-value'}>{upgradeTiers.hp}</span>
            </div>
            <button
              onClick={() => handleUpgrade('hp')}
              disabled={!canAffordHp}
              className={`${'cultivation-tab__upgrade-button'} ${
                canAffordHp ? 'cultivation-tab__upgrade-button-active' : 'cultivation-tab__upgrade-button-disabled'
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
