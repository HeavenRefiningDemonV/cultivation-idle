import { useUIStore } from '../../stores/uiStore';

export function OfflineProgressModal() {
  const { offlineProgressSummary, hideOfflineProgress } = useUIStore((state) => ({
    offlineProgressSummary: state.offlineProgressSummary,
    hideOfflineProgress: state.hideOfflineProgress,
  }));

  if (!offlineProgressSummary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-300">Welcome Back</h2>
            <p className="text-slate-400 text-sm">Your cultivation continued while you were away.</p>
          </div>
          <button
            onClick={hideOfflineProgress}
            className="text-slate-400 hover:text-white transition"
            aria-label="Close offline progress"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-sm text-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-400">Time offline</span>
            <span className="font-semibold text-white">{offlineProgressSummary.offlineDuration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Qi gained</span>
            <span className="font-semibold text-emerald-300">{offlineProgressSummary.qiGained}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Efficiency</span>
            <span className="font-semibold text-white">
              {(offlineProgressSummary.efficiency * 100).toFixed(0)}%
            </span>
          </div>
          {offlineProgressSummary.wasCapped && (
            <div className="text-amber-300 text-xs bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
              Offline gains capped at 12 hours. Increase your limit to earn more while away.
            </div>
          )}
        </div>

        <button
          onClick={hideOfflineProgress}
          className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition"
        >
          Continue Cultivating
        </button>
      </div>
    </div>
  );
}
