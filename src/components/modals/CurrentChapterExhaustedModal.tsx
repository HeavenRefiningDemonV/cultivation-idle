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
      ornament={<div className="currentChapterExhaustedModal__seal" aria-hidden="true"><span /></div>}
      footer={(
        <div className="currentChapterExhaustedModal__actions">
          <button type="button" className="currentChapterExhaustedModal__action currentChapterExhaustedModal__action--primary uiNoShift" onClick={handleOpenPrestige}>Open Prestige</button>
          <button type="button" className="currentChapterExhaustedModal__action uiNoShift" onClick={handleOpenLifeSummary}>View Life Summary</button>
          <button type="button" className="currentChapterExhaustedModal__action uiNoShift" onClick={handleClose}>Continue This Life</button>
        </div>
      )}
    >
      <section className="currentChapterExhaustedModal__summary">
        <h3>What happened</h3>
        <p className="currentChapterExhaustedModal__lead">
          You have reached <strong>Spirit Severing</strong>, the end of the current authored chapter in this build.
        </p>
      </section>
      <section className="currentChapterExhaustedModal__truthBlock">
        <h3>What this means</h3>
        <p>
          There is no live city 6, post-Severing gate chain, or next authored realm beyond this point right now.
        </p>
      </section>
      <section className="currentChapterExhaustedModal__truthBlock">
        <h3>What you can do next</h3>
        <ul>
          <li>Combat and city progression in this life have reached the authored cap.</li>
          <li>You can reincarnate for Account Points and begin another life path.</li>
          <li>You can review this life’s milestones before deciding.</li>
        </ul>
      </section>
    </RitualModalFrame>
  );
}
