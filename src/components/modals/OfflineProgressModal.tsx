import type { OfflineProgressSummary } from '../../systems/offline';

interface OfflineProgressModalProps {
  summary: OfflineProgressSummary;
  onClose: () => void;
}

export function OfflineProgressModal({ summary, onClose }: OfflineProgressModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="bg-slate-900 border border-cyan-700 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-cyan-300">Welcome Back</h2>
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors"
            onClick={onClose}
            aria-label="Close offline progress"
          >
            ✕
          </button>
        </div>

        <p className="text-slate-300 mb-4">
          While you were away for <span className="text-cyan-200 font-semibold">{summary.offlineDuration}</span>,
          your cultivation continued.
        </p>

        <div className="bg-slate-800/60 rounded-lg p-4 space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Qi Gained</span>
            <span className="text-cyan-200 font-semibold">{summary.qiGained}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Efficiency</span>
            <span>{Math.round(summary.efficiency * 100)}%</span>
          </div>
          {summary.wasCapped && (
            <div className="text-amber-300 text-sm">Offline gains capped at 12 hours.</div>
          )}
        </div>

        <button
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-colors"
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
