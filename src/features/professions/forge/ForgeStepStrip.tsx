import classNames from 'classnames';

const STEPS = ['Select', 'Prepare', 'Forge', 'Claim'] as const;

export interface ForgeStepStripProps {
  currentStep: number;
}

export function ForgeStepStrip({ currentStep }: ForgeStepStripProps) {
  return (
    <div className="forgeStepStrip" role="list" aria-label="Forge progress">
      {STEPS.map((label, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        return (
          <div
            key={label}
            className={classNames('forgeStepStrip__segment', {
              'forgeStepStrip__segment--active': isActive,
              'forgeStepStrip__segment--complete': isComplete,
            })}
            role="listitem"
            aria-current={isActive ? 'step' : undefined}
          >
            <span className="forgeStepStrip__label">{label}</span>
            {isComplete && <span className="forgeStepStrip__check" aria-hidden="true">✓</span>}
          </div>
        );
      })}
    </div>
  );
}
