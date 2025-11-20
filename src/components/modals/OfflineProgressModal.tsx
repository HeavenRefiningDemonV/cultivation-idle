import { useUIStore } from '../../stores/uiStore';

export function OfflineProgressModal() {
  const offlineProgressSummary = useUIStore((state) => state.offlineProgressSummary);
  const hideOfflineProgress = useUIStore((state) => state.hideOfflineProgress);

  if (!offlineProgressSummary) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-cyan-500/40 max-w-md w-full p-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
          <p className="text-slate-300 text-sm">Your cultivation continued while you were away.</p>
        </div>

        <div className="space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex justify-between text-slate-200">
            <span>Time Offline</span>
            <span className="font-semibold text-cyan-400">{offlineProgressSummary.offlineDuration}</span>
          </div>
          <div className="flex justify-between text-slate-200">
            <span>Qi Gained</span>
            <span className="font-semibold text-green-400">{offlineProgressSummary.qiGained}</span>
          </div>
          <div className="flex justify-between text-slate-200 text-sm">
            <span>Efficiency</span>
            <span>{Math.round(offlineProgressSummary.efficiency * 100)}%</span>
          </div>
          {offlineProgressSummary.wasCapped && (
            <div className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/40 rounded-md p-2">
              Offline time capped at 12 hours.
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={hideOfflineProgress}
            className="px-5 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-500 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
