type StoryControlsProps = {
  canSkip: boolean;
  canAdvance: boolean;
  isFinalSlide: boolean;
  finalLabel: string;
  onNext: () => void;
  onSkip: () => void;
  onFinalObjective: () => void;
};

export function StoryControls({
  canSkip,
  canAdvance,
  isFinalSlide,
  finalLabel,
  onNext,
  onSkip,
  onFinalObjective,
}: StoryControlsProps) {
  return (
    <div className="storyControls" aria-label="Story controls">
      <button
        type="button"
        className="storyControls__skip"
        onClick={onSkip}
        disabled={!canSkip}
      >
        Skip
      </button>

      {isFinalSlide ? (
        <button
          type="button"
          className="storyControls__objective"
          onClick={onFinalObjective}
          disabled={!canAdvance}
        >
          {finalLabel}
        </button>
      ) : (
        <button
          type="button"
          className="storyControls__next"
          onClick={onNext}
          disabled={!canAdvance}
        >
          Next
        </button>
      )}
    </div>
  );
}
