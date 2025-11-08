import type { OfflineProgressSummary } from '../../systems/offline';

interface OfflineProgressModalProps {
  progress: OfflineProgressSummary;
  onClose: () => void;
}

/**
 * Modal to display offline progress gains when player returns
 * Shows Qi gained and time elapsed
 */
export function OfflineProgressModal({ progress, onClose }: OfflineProgressModalProps) {
  // Format efficiency as percentage
  const efficiencyPercent = (progress.efficiency * 100).toFixed(0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 border-4 border-gold-accent rounded-lg max-w-md w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-pulse">🌙</div>
          <h2 className="text-3xl font-cinzel font-bold text-gold-accent mb-2">
            Welcome Back, Cultivator!
          </h2>
          <p className="text-lg text-slate-300">
            You meditated for <span className="text-qi-blue font-bold">{progress.offlineDuration}</span>
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-2 border-purple-500/50 rounded-lg p-6 mb-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-purple-200 mb-4 text-center font-cinzel">
            Offline Cultivation Progress
          </h3>

          {/* Qi Gained */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-3 border border-qi-blue/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✨</span>
                <span className="text-slate-300 font-semibold">Qi Gained:</span>
              </div>
              <span className="text-qi-blue font-bold text-xl">
                +{progress.qiGained}
              </span>
            </div>
          </div>

          {/* Efficiency Info */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <span className="text-slate-300 font-semibold">Efficiency:</span>
              </div>
              <span className="text-purple-400 font-bold text-lg">
                {efficiencyPercent}%
              </span>
            </div>
          </div>

          {/* Cap Warning */}
          {progress.wasCapped && (
            <div className="mt-4 bg-amber-900/30 border border-amber-600/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏰</span>
                <p className="text-sm text-amber-200">
                  Offline progress capped at 12 hours
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-400 text-center italic">
            💡 <span className="text-purple-300">Tip:</span> Upgrade "Timeless Meditation" in Prestige
            to increase offline efficiency!
          </p>
        </div>

        {/* Claim Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold font-cinzel text-lg py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105"
        >
          Continue Cultivation
        </button>
      </div>
    </div>
  );
}
