import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/uiStore.js';
import './CurrentChapterExhaustedModal.scss';

export function CurrentChapterExhaustedModal() {
  const open = useUIStore((state) => state.showCurrentChapterExhaustedModal);
  const close = useUIStore((state) => state.closeCurrentChapterExhaustedModal);
  const acknowledge = useUIStore((state) => state.acknowledgeCurrentChapterExhausted);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const openLifeSummaryModal = useUIStore((state) => state.openLifeSummaryModal);

  if (!open) return null;

  const handleClose = () => {
    acknowledge();
    close();
  };

  const handleOpenPrestige = () => {
    acknowledge();
    close();
    setActiveTab('prestige');
  };

  const handleOpenLifeSummary = () => {
    acknowledge();
    close();
    openLifeSummaryModal('current');
  };

  return createPortal(
    <div className="currentChapterExhaustedOverlay" role="presentation" onMouseDown={handleClose}>
      <div className="currentChapterExhaustedModal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Current Chapter Exhausted</h2>
        <p>
          You have reached <strong>Spirit Severing</strong>, the end of the current authored chapter in this build.
        </p>
        <p>
          There is no live city 6, post-Severing gate chain, or next authored realm beyond this point right now.
        </p>
        <div className="currentChapterExhaustedModal__actions">
          <button type="button" onClick={handleOpenPrestige}>Open Prestige</button>
          <button type="button" onClick={handleOpenLifeSummary}>View Life Summary</button>
          <button type="button" onClick={handleClose}>Continue This Life</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
