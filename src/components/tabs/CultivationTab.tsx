import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { D, formatNumber, greaterThanOrEqualTo, divide } from '../../utils/numbers';
import type { FocusMode } from '../../types';
import { REALMS, FOCUS_MODE_MODIFIERS } from '../../constants';

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
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-slate-700"
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* TOP SECTION - Realm Progress */}
      <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <ProgressRing progress={progressPercent} size={220} strokeWidth={14} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-4xl font-bold text-cyan-400">
                {progressPercent.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400 mt-1">
                Progress
              </div>
            </div>
          </div>

          {/* Realm Info */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">
              {realm.name}
            </h2>
            <p className="text-lg text-slate-300 mb-4">
              Substage {realm.substage + 1} / {currentRealmDef?.substages || 10}
            </p>
            <div className="text-slate-400 mb-4">
              {currentRealmDef?.majorRealm || 'Mortal Realm'}
            </div>
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div className="text-sm text-slate-400">
                Total Breakthroughs:
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {totalAuras}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION - Qi Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-sm text-slate-400 uppercase tracking-wide mb-2">
            Current Qi
          </div>
          <div className="text-3xl font-bold text-cyan-400">
            {formatNumber(qi)}
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-sm text-slate-400 uppercase tracking-wide mb-2">
            Qi per Second
          </div>
          <div className="text-3xl font-bold text-cyan-400">
            {formatNumber(qiPerSecond)}
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-sm text-slate-400 uppercase tracking-wide mb-2">
            Time to Breakthrough
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {formatTime(secondsToBreakthrough)}
          </div>
        </motion.div>
      </div>

      {/* FOCUS MODE SELECTOR */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Cultivation Focus
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['balanced', 'body', 'spirit'] as FocusMode[]).map((mode) => {
            const isActive = focusMode === mode;
            const modifiers = FOCUS_MODE_MODIFIERS[mode];
            const projectedQiPerSecond = calculateQiWithFocusMode(qiPerSecond, focusMode, mode);

            return (
              <motion.button
                key={mode}
                onClick={() => setFocusMode(mode)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20'
                      : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-lg font-bold text-white mb-2 capitalize">
                  {mode === 'balanced' ? 'Balanced' : `${mode} Focus`}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-slate-300">
                    Qi/s: <span className="text-cyan-400 font-semibold">
                      {formatNumber(projectedQiPerSecond)}
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs">
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
        className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"
        animate={canBreakthrough ? {
          boxShadow: [
            '0 0 20px rgba(6, 182, 212, 0.3)',
            '0 0 40px rgba(6, 182, 212, 0.5)',
            '0 0 20px rgba(6, 182, 212, 0.3)',
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-2">
              Breakthrough Requirement
            </div>
            <div className="text-lg text-slate-300">
              {formatNumber(qi)} / {formatNumber(qiRequired)}
            </div>
          </div>

          <motion.button
            onClick={handleBreakthrough}
            disabled={!canBreakthrough}
            className={`
              px-12 py-4 rounded-lg text-xl font-bold transition-all
              ${
                canBreakthrough
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }
            `}
            whileHover={canBreakthrough ? { scale: 1.05 } : {}}
            whileTap={canBreakthrough ? { scale: 0.95 } : {}}
          >
            {canBreakthrough ? '✨ Breakthrough! ✨' : 'Insufficient Qi'}
          </motion.button>
        </div>
      </motion.div>

      {/* UPGRADES SECTION */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Cultivation Upgrades
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Idle Efficiency */}
          <motion.div
            className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-lg font-bold text-cyan-400 mb-2">
              ⚡ Idle Efficiency
            </div>
            <div className="text-sm text-slate-300 mb-3">
              Increases Qi generation by 10%
            </div>
            <div className="text-xs text-slate-400 mb-3">
              Current Tier: <span className="text-white font-semibold">{upgradeTiers.idle}</span>
            </div>
            <button
              onClick={() => handleUpgrade('idle')}
              disabled={!canAffordIdle}
              className={`
                w-full py-2 px-4 rounded-lg font-semibold transition-all
                ${
                  canAffordIdle
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Cost: {formatNumber(idleCost)} Qi
            </button>
          </motion.div>

          {/* Damage Boost */}
          <motion.div
            className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-lg font-bold text-red-400 mb-2">
              ⚔️ Damage Boost
            </div>
            <div className="text-sm text-slate-300 mb-3">
              Increases attack power by 5%
            </div>
            <div className="text-xs text-slate-400 mb-3">
              Current Tier: <span className="text-white font-semibold">{upgradeTiers.damage}</span>
            </div>
            <button
              onClick={() => handleUpgrade('damage')}
              disabled={!canAffordDamage}
              className={`
                w-full py-2 px-4 rounded-lg font-semibold transition-all
                ${
                  canAffordDamage
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Cost: {formatNumber(damageCost)} Qi
            </button>
          </motion.div>

          {/* HP Boost */}
          <motion.div
            className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-lg font-bold text-green-400 mb-2">
              ❤️ HP Boost
            </div>
            <div className="text-sm text-slate-300 mb-3">
              Increases max HP by 5%
            </div>
            <div className="text-xs text-slate-400 mb-3">
              Current Tier: <span className="text-white font-semibold">{upgradeTiers.hp}</span>
            </div>
            <button
              onClick={() => handleUpgrade('hp')}
              disabled={!canAffordHp}
              className={`
                w-full py-2 px-4 rounded-lg font-semibold transition-all
                ${
                  canAffordHp
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Cost: {formatNumber(hpCost)} Qi
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
