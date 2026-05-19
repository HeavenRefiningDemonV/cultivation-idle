import type { OnboardingPromptInstance } from '../../systems/ui/onboardingPromptRegistry.js';

interface OnboardingCalloutCardProps {
  prompt: OnboardingPromptInstance;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
}

export function OnboardingCalloutCard({ prompt, onPrimaryAction, onSecondaryAction }: OnboardingCalloutCardProps) {
  return (
    <div className="onboardingCalloutCard" role="status" aria-live="polite" data-testid="onboarding-callout-card">
      {prompt.eyebrow ? <div className="onboardingCalloutCard__eyebrow">{prompt.eyebrow}</div> : null}
      <div className="onboardingCalloutCard__title">{prompt.title}</div>
      {prompt.badgeLabel ? <div className="onboardingCalloutCard__badge">{prompt.badgeLabel}</div> : null}
      <div className="onboardingCalloutCard__body">{prompt.body}</div>
      <div className="onboardingCalloutCard__actions">
        {prompt.primaryAction ? (
          <button type="button" className="worldScreenModuleButton" onClick={onPrimaryAction}>
            {prompt.primaryAction.label}
          </button>
        ) : null}
        <button type="button" className="worldScreenModuleButton worldScreenModuleButton--subtle" onClick={onSecondaryAction}>
          {prompt.secondaryAction?.label ?? 'Continue'}
        </button>
      </div>
    </div>
  );
}
