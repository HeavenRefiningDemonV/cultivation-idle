import {
  buildCurrentLifeSummarySurface,
  buildLastCompletedLifeSummarySurface,
  type LifeSummarySurface,
} from '../../features/prestige/lifeSummarySurface.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { RitualModalFrame } from '../../ui/shell/index.js';
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

  const title = mode === 'current' ? 'Current Life Summary' : 'Last Completed Life Summary';
  const capturedAtLabel = surface && mode === 'last_completed'
    ? new Date(surface.capturedAt).toLocaleString()
    : null;

  return (
    <RitualModalFrame
      open={open}
      onClose={close}
      title={title}
      subtitle={mode === 'current' ? 'Review this life before the ritual.' : 'Archive record from your previous completed life.'}
      variant="summary"
      size="lg"
      className="lifeSummaryModal"
      bodyClassName="lifeSummaryModal__body"
      ornament={<div className="lifeSummaryModal__seal" aria-hidden="true"><span /></div>}
      footer={(
        <div className="lifeSummaryModal__actionLane" data-ui="life-summary-action-lane">
          <p className="lifeSummaryModal__status" role="status" aria-live="polite">
            {mode === 'current' ? 'Review complete? Open Prestige when ready to reincarnate.' : 'Archive review only — return to Prestige when ready.'}
          </p>
          <div className="lifeSummaryModal__actions">
            <button type="button" className="lifeSummaryModal__action lifeSummaryModal__action--tertiary uiNoShift" onClick={close}>Close</button>
            <button type="button" className="lifeSummaryModal__action lifeSummaryModal__action--primary uiNoShift" onClick={handleOpenPrestige}>Open Prestige</button>
          </div>
        </div>
      )}
      ariaLabel={title}
    >
      <section className="lifeSummaryModal__modeStrip" data-ui="life-summary-mode-strip">
        <span className="lifeSummaryModal__modeBadge">{mode === 'current' ? 'Current Review' : 'Last Completed Archive'}</span>
        {capturedAtLabel ? <span className="lifeSummaryModal__capturedAt">Captured: {capturedAtLabel}</span> : <span className="lifeSummaryModal__capturedAt">&nbsp;</span>}
      </section>

      <section className="lifeSummaryModal__meta" data-ui="life-summary-meta-strip">
        {surface ? (
          <>
            <div className="lifeSummaryModal__metaItem">
              <div className="lifeSummaryModal__metaLabel">Advisor</div>
              <div className="lifeSummaryModal__metaValue">{surface.advisorLabel}</div>
            </div>
            <div className="lifeSummaryModal__metaItem">
              <div className="lifeSummaryModal__metaLabel">AP Forecast</div>
              <div className="lifeSummaryModal__metaValue">+{surface.apForecastGain}</div>
            </div>
            <div className="lifeSummaryModal__metaItem">
              <div className="lifeSummaryModal__metaLabel">AP After Ritual</div>
              <div className="lifeSummaryModal__metaValue">{surface.apAfterRitual}</div>
            </div>
          </>
        ) : (
          <span>No completed life snapshot is available yet.</span>
        )}
      </section>

      {surface ? (
        <section className="lifeSummaryModal__blocks" data-ui="life-summary-blocks">
          {surface.blocks.map((block) => (
            <article key={block.key} className="lifeSummaryModal__block">
              <h3>{block.title}</h3>
              <ul>
                {block.lines.map((line, index) => (<li key={`${block.key}-${index}`}>{line}</li>))}
              </ul>
            </article>
          ))}
        </section>
      ) : (
        <section className="lifeSummaryModal__empty">Finish one Reincarnation to unlock the last completed life summary.</section>
      )}
    </RitualModalFrame>
  );
}
