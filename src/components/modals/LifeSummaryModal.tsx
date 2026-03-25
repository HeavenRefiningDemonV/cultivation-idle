import { useMemo } from 'react';
import {
  buildCurrentLifeSummary,
  buildLifeSummaryFromSnapshot,
  ensureSixBlocks,
} from '../../features/prestige/lifeSummarySurface';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useUIStore } from '../../stores/uiStore';

export function LifeSummaryModal() {
  const show = useUIStore((state) => state.showLifeSummaryModal);
  const mode = useUIStore((state) => state.lifeSummaryMode);
  const close = useUIStore((state) => state.closeLifeSummaryModal);
  const lastLifeSummary = usePrestigeStore((state) => state.lastLifeSummary);
  const apForecast = usePrestigeStore((state) => state.calculateAPGain());
  const canPrestige = usePrestigeStore((state) => state.canPrestige());
  const runStartTime = usePrestigeStore((state) => state.runStartTime);
  const upgrades = usePrestigeStore((state) => state.upgrades);

  const viewModel = useMemo(() => {
    if (mode === 'last_completed' && lastLifeSummary) {
      return buildLifeSummaryFromSnapshot(lastLifeSummary, mode);
    }
    return buildCurrentLifeSummary({ apForecast, canPrestige, runStartTime, upgrades });
  }, [mode, lastLifeSummary, apForecast, canPrestige, runStartTime, upgrades]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-purple-500/40 bg-slate-900 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-purple-300">
              {mode === 'last_completed' ? 'Last Completed Life Summary' : 'Current Life Summary'}
            </h2>
            <p className="text-sm text-slate-300">
              Prestige Readiness: <span className="font-semibold">{viewModel.advisorLabel}</span> •
              Forecast: <span className="font-semibold">+{viewModel.apForecast} AP</span>
            </p>
          </div>
          <button
            onClick={close}
            className="rounded bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ensureSixBlocks(viewModel.blocks).map((block) => (
            <section key={block.title} className="rounded border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-gold-accent">{block.title}</h3>
              <ul className="space-y-1 text-sm text-slate-200">
                {block.lines.map((line, index) => (
                  <li key={`${block.title}_${index}`}>• {line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={close}
            className="rounded bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500"
          >
            Back to Game
          </button>
        </div>
      </div>
    </div>
  );
}
