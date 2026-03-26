import { createPortal } from 'react-dom';
import {
  buildCurrentLifeSummarySurface,
  buildLastCompletedLifeSummarySurface,
  type LifeSummarySurface,
} from '../../features/prestige/lifeSummarySurface.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import './LifeSummaryModal.scss';

function resolveSurface(mode: 'current' | 'last_completed'): LifeSummarySurface | null {
  if (mode === 'current') {
    return buildCurrentLifeSummarySurface();
  }

  const snapshot = usePrestigeStore.getState().lastLifeSummary;
  if (!snapshot) return null;
  return buildLastCompletedLifeSummarySurface(snapshot);
}

export function LifeSummaryModal() {
  const open = useUIStore((state) => state.showLifeSummaryModal);
  const mode = useUIStore((state) => state.lifeSummaryMode);
  const close = useUIStore((state) => state.closeLifeSummaryModal);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  if (!open) return null;
  const surface = resolveSurface(mode);

  const handleOpenPrestige = () => {
    close();
    setActiveTab('prestige');
  };

  return createPortal(
    <div className="lifeSummaryOverlay" role="presentation" onMouseDown={close}>
      <div className="lifeSummaryModal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header className="lifeSummaryModal__header">
          <div>
            <h2>{mode === 'current' ? 'Current Life Summary' : 'Last Completed Life Summary'}</h2>
            <div className="lifeSummaryModal__meta">
              {surface ? (
                <>
                  <span>Advisor: {surface.advisorLabel}</span>
                  <span>AP forecast: +{surface.apForecastGain}</span>
                  <span>AP after ritual: {surface.apAfterRitual}</span>
                </>
              ) : (
                <span>No completed life snapshot is available yet.</span>
              )}
            </div>
          </div>
        </header>

        {surface ? (
          <div className="lifeSummaryModal__blocks">
            {surface.blocks.map((block) => (
              <section key={block.key} className="lifeSummaryModal__block">
                <h3>{block.title}</h3>
                <ul>
                  {block.lines.map((line, index) => (<li key={`${block.key}-${index}`}>{line}</li>))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="lifeSummaryModal__empty">Finish one Reincarnation to unlock the last completed life summary.</div>
        )}

        <div className="lifeSummaryModal__actions">
          <button type="button" onClick={handleOpenPrestige}>Open Prestige</button>
          <button type="button" onClick={close}>Close</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
