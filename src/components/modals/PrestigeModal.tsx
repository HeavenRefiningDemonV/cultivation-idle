import { usePrestigeStore } from '../../stores/prestigeStore';
import { useUIStore } from '../../stores/uiStore';
import { formatNumber } from '../../utils/numbers';
import { REALMS } from '../../constants';

/**
 * Prestige/Rebirth Modal
 * Shows current run stats, AP gain, and available upgrades
 */
export function PrestigeModal() {
  const hidePrestige = useUIStore((state) => state.hidePrestige);
  const prestigeStore = usePrestigeStore();

  const {
    canPrestige,
    calculateAPGain,
    performPrestige,
    highestRealmReached,
    totalQiEarned,
    bossesDefeated,
    totalAP,
    lifetimeAP,
    prestigeCount,
    upgrades,
    purchaseUpgrade,
  } = prestigeStore;

  const apGain = calculateAPGain();
  const canRebirth = canPrestige();
  const realmName = REALMS[highestRealmReached]?.name || 'Qi Condensation';

  const handleRebirth = () => {
    if (!canRebirth) return;

    if (confirm(`Are you sure you want to rebirth?\n\nYou will gain ${apGain} AP and restart from the beginning.\n\nAll progress except AP and upgrades will be lost.`)) {
      performPrestige();
      hidePrestige();
    }
  };

  // Sort upgrades by cost for display
  const upgradeList = Object.values(upgrades).sort((a, b) => a.cost - b.cost);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 border-4 border-gold-accent rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-blue-900 p-6 border-b-4 border-gold-accent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-cinzel font-bold text-gold-accent mb-2">
                🔄 Rebirth System
              </h2>
              <p className="text-slate-300">
                Reset your progress to gain Ascension Points for permanent upgrades
              </p>
            </div>
            <button
              onClick={hidePrestige}
              className="text-4xl text-slate-400 hover:text-white transition-colors leading-none"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Run Stats */}
          <div className="bg-slate-800/50 border-2 border-slate-700 rounded-lg p-6">
            <h3 className="text-2xl font-cinzel font-bold text-gold-accent mb-4">
              Current Run Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Highest Realm</div>
                <div className="text-xl font-bold text-qi-blue">{realmName}</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Total Qi Earned</div>
                <div className="text-xl font-bold text-qi-blue">{formatNumber(totalQiEarned)}</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Bosses Defeated</div>
                <div className="text-xl font-bold text-red-400">{bossesDefeated}</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Total Rebirths</div>
                <div className="text-xl font-bold text-purple-400">{prestigeCount}</div>
              </div>
            </div>
          </div>

          {/* AP Info */}
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-2 border-purple-500 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-cinzel font-bold text-purple-200">
                  Ascension Points
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Spend AP on permanent upgrades that persist through rebirths
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Available AP</div>
                <div className="text-3xl font-bold text-purple-300">{totalAP}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <div className="text-xs text-slate-400">AP on Rebirth</div>
                <div className="text-2xl font-bold text-green-400">+{apGain}</div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <div className="text-xs text-slate-400">Lifetime AP</div>
                <div className="text-2xl font-bold text-purple-300">{lifetimeAP}</div>
              </div>
            </div>

            {!canRebirth && (
              <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-3">
                <p className="text-sm text-amber-200">
                  ⚠️ You must reach <span className="font-bold">Foundation Realm</span> to rebirth
                </p>
              </div>
            )}
          </div>

          {/* Prestige Upgrades */}
          <div className="bg-slate-800/50 border-2 border-slate-700 rounded-lg p-6">
            <h3 className="text-2xl font-cinzel font-bold text-gold-accent mb-4">
              Prestige Shop
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {upgradeList.map((upgrade) => {
                const canAfford = totalAP >= upgrade.cost;
                const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;
                const isLocked = upgrade.id === 'dual_path';

                return (
                  <div
                    key={upgrade.id}
                    className={`bg-slate-900/50 border-2 rounded-lg p-4 transition-all ${
                      isMaxed
                        ? 'border-green-600/50 opacity-75'
                        : canAfford && !isLocked
                        ? 'border-purple-500/50 hover:border-purple-400'
                        : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg text-white">
                            {upgrade.name}
                          </h4>
                          {isLocked && (
                            <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">
                              LOCKED
                            </span>
                          )}
                          {isMaxed && (
                            <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded">
                              MAXED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">
                          {upgrade.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-500">
                            Level: <span className="text-white font-bold">{upgrade.currentLevel}</span>
                            <span className="text-slate-600"> / {upgrade.maxLevel}</span>
                          </span>
                          {upgrade.effect.type === 'multiplier' && (
                            <span className="text-blue-400">
                              Current: +{((upgrade.effect.valuePerLevel || 0) * upgrade.currentLevel * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => purchaseUpgrade(upgrade.id)}
                        disabled={!canAfford || isMaxed || isLocked}
                        className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
                          canAfford && !isMaxed && !isLocked
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:scale-105'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isMaxed ? 'MAX' : isLocked ? 'LOCKED' : `${upgrade.cost} AP`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={hidePrestige}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold font-cinzel text-lg py-4 px-6 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleRebirth}
              disabled={!canRebirth}
              className={`flex-1 font-bold font-cinzel text-lg py-4 px-6 rounded-lg transition-all ${
                canRebirth
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-purple-500/50 hover:scale-105'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              {canRebirth ? `🔄 Rebirth (+${apGain} AP)` : '🔒 Reach Foundation to Rebirth'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
