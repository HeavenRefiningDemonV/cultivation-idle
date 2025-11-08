import { useState } from 'react';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useGameStore } from '../../stores/gameStore';

export function PrestigeScreen() {
  const {
    totalAP,
    lifetimeAP,
    prestigeCount,
    prestigeRuns,
    upgrades,
    calculateAPGain,
    canPrestige,
    performPrestige,
    purchaseUpgrade,
  } = usePrestigeStore();

  const realm = useGameStore((state) => state.realm);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const apGain = calculateAPGain();
  const canPrestigeNow = canPrestige();

  const handlePrestige = () => {
    if (canPrestigeNow) {
      setShowConfirmation(true);
    }
  };

  const confirmPrestige = () => {
    performPrestige();
    setShowConfirmation(false);
  };

  const realmNames = [
    'Qi Refining',
    'Foundation Establishment',
    'Core Formation',
    'Nascent Soul',
    'Soul Formation',
    'Void Tribulation',
    'Mahayana',
    'True Immortal',
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 40% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%), radial-gradient(circle at 60% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">
            Reincarnation
          </h1>
          <p className="text-slate-400">
            Restart your cultivation journey with powerful blessings
          </p>
        </div>

        {/* AP Display */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500/50 rounded-lg p-6 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold text-purple-300">{totalAP}</div>
            <div className="text-xl text-purple-200">Ascension Points Available</div>
            <div className="text-sm text-purple-400">
              {lifetimeAP} Total Earned • {prestigeCount} Reincarnations
            </div>
          </div>
        </div>

        {/* Current Run & Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-4">
            <h3 className="text-lg font-cinzel font-semibold text-gold-accent mb-3">
              Current Run
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Realm:</span>
                <span className="font-semibold text-white">
                  {realmNames[realm?.index || 0] || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Potential AP Gain:</span>
                <span className="font-bold text-purple-400 text-lg">+{apGain} AP</span>
              </div>
            </div>
          </div>

          <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-4">
            <h3 className="text-lg font-cinzel font-semibold text-gold-accent mb-3">
              Reincarnation Benefits
            </h3>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>✓ Keep all Ascension Points</li>
              <li>✓ Keep all AP upgrades</li>
              <li>✓ Keep spirit root floor level</li>
              <li>✓ Unlock new content faster</li>
              <li>✗ Reset cultivation progress</li>
              <li>✗ Reset inventory & gold</li>
            </ul>
          </div>
        </div>

        {/* Prestige Button */}
        <div className="flex justify-center">
          <button
            onClick={handlePrestige}
            disabled={!canPrestigeNow}
            className={`px-8 py-4 rounded-lg font-bold text-xl transition-all ${
              canPrestigeNow
                ? 'bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {canPrestigeNow
              ? `Reincarnate (+${apGain} AP)`
              : 'Reach Core Formation to Reincarnate'}
          </button>
        </div>

        {/* Ascension Shop */}
        <div className="space-y-4">
          <h2 className="text-3xl font-cinzel font-semibold text-gold-accent">
            Ascension Shop
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(upgrades).map((upgrade) => {
              const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;
              const canAfford = totalAP >= upgrade.cost;
              const isLocked = upgrade.id === 'dual_path';

              return (
                <div
                  key={upgrade.id}
                  className={`bg-ink-dark/50 rounded-lg border-2 p-4 transition-all backdrop-blur-sm ${
                    isMaxed
                      ? 'border-green-500/50 bg-green-900/20'
                      : isLocked
                      ? 'border-slate-600 opacity-50'
                      : canAfford
                      ? 'border-purple-500/50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20'
                      : 'border-slate-600'
                  }`}
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {upgrade.name}
                      </h3>
                      {isMaxed && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold">
                          MAX
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-xs bg-slate-600 text-white px-2 py-1 rounded font-bold">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{upgrade.description}</p>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Level</span>
                      <span className="font-semibold text-white">
                        {upgrade.currentLevel} / {upgrade.maxLevel}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                        style={{
                          width: `${(upgrade.currentLevel / upgrade.maxLevel) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {upgrade.currentLevel > 0 && (
                    <div className="mb-3 text-sm">
                      <div className="text-green-400 font-semibold">Current Effect:</div>
                      <div className="text-green-300">
                        {upgrade.effect.type === 'multiplier' &&
                        upgrade.effect.valuePerLevel
                          ? `+${(
                              upgrade.effect.valuePerLevel *
                              upgrade.currentLevel *
                              100
                            ).toFixed(0)}% ${upgrade.effect.stat}`
                          : upgrade.effect.type === 'flat_bonus' && upgrade.effect.value
                          ? `+${upgrade.effect.value * upgrade.currentLevel} ${
                              upgrade.effect.stat
                            }`
                          : 'Unlocked'}
                      </div>
                    </div>
                  )}

                  {!isMaxed && !isLocked && (
                    <div className="space-y-2">
                      <div className="text-center text-sm">
                        <span className="text-slate-400">Cost: </span>
                        <span
                          className={`font-bold text-lg ${
                            canAfford ? 'text-purple-400' : 'text-red-400'
                          }`}
                        >
                          {upgrade.cost} AP
                        </span>
                      </div>
                      <button
                        onClick={() => purchaseUpgrade(upgrade.id)}
                        disabled={!canAfford}
                        className={`w-full font-semibold py-2 rounded transition-colors ${
                          canAfford
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Purchase
                      </button>
                    </div>
                  )}

                  {isLocked && (
                    <div className="text-center text-sm text-slate-500">
                      Unlock condition not met
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prestige History */}
        {prestigeRuns.length > 0 && (
          <details className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-4 backdrop-blur-sm">
            <summary className="font-semibold text-gold-accent cursor-pointer">
              Reincarnation History ({prestigeRuns.length} runs)
            </summary>
            <div className="mt-3 space-y-2">
              {prestigeRuns
                .slice()
                .reverse()
                .map((run) => (
                  <div
                    key={run.runNumber}
                    className="flex justify-between items-center text-sm border-b border-slate-700 pb-2"
                  >
                    <div>
                      <span className="font-semibold text-white">Run #{run.runNumber}</span>
                      <span className="text-slate-400 ml-2">
                        {realmNames[run.realmReached]}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-400 font-semibold">
                        +{run.apGained} AP
                      </span>
                      <span className="text-slate-400 ml-2">
                        {Math.floor(run.timeSpent / 60)}m
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </details>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border-4 border-red-500 rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-red-400 mb-4">
                Confirm Reincarnation
              </h2>
              <p className="text-slate-300 mb-6">
                Are you sure you want to reincarnate? This will reset your cultivation
                progress, but you'll gain{' '}
                <strong className="text-purple-400">{apGain} AP</strong> to purchase
                permanent upgrades.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPrestige}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Reincarnate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
