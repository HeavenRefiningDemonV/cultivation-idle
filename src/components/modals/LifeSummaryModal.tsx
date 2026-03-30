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

  return (
    <RitualModalFrame
      open={open}
      onClose={close}
      title={title}
      variant="summary"
      size="lg"
      className="lifeSummaryModal"
      bodyClassName="lifeSummaryModal__body"
      footer={(
        <div className="lifeSummaryModal__actions">
          <button type="button" className="lifeSummaryModal__action uiNoShift" onClick={handleOpenPrestige}>Open Prestige</button>
          <button type="button" className="lifeSummaryModal__action uiNoShift" onClick={close}>Close</button>
        </div>
      )}
      ariaLabel={title}
    >
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
    </RitualModalFrame>
  );
}
