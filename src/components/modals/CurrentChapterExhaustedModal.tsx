import { useUIStore } from '../../stores/uiStore.js';
import { RitualModalFrame } from '../../ui/shell/index.js';
import './CurrentChapterExhaustedModal.scss';

export function CurrentChapterExhaustedModal() {
  const open = useUIStore((state) => state.showCurrentChapterExhaustedModal);
  const close = useUIStore((state) => state.closeCurrentChapterExhaustedModal);
  const acknowledge = useUIStore((state) => state.acknowledgeCurrentChapterExhausted);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const openLifeSummaryModal = useUIStore((state) => state.openLifeSummaryModal);

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

  return (
    <RitualModalFrame
      open={open}
      onClose={handleClose}
      title="Current Chapter Exhausted"
      variant="chapterEnd"
      size="md"
      className="currentChapterExhaustedModal"
      bodyClassName="currentChapterExhaustedModal__body"
      footer={(
        <div className="currentChapterExhaustedModal__actions">
          <button type="button" className="currentChapterExhaustedModal__action uiNoShift" onClick={handleOpenPrestige}>Open Prestige</button>
          <button type="button" className="currentChapterExhaustedModal__action uiNoShift" onClick={handleOpenLifeSummary}>View Life Summary</button>
          <button type="button" className="currentChapterExhaustedModal__action uiNoShift" onClick={handleClose}>Continue This Life</button>
        </div>
      )}
    >
      <p>
        You have reached <strong>Spirit Severing</strong>, the end of the current authored chapter in this build.
      </p>
      <p>
        There is no live city 6, post-Severing gate chain, or next authored realm beyond this point right now.
      </p>
    </RitualModalFrame>
  );
}
