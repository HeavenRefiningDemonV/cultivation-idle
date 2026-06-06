import { useState } from 'react';
import type { OnboardingRouteTarget } from '../../systems/onboarding/onboardingTypes.js';
import type { OnboardingUnlockCeremonySurface } from '../../systems/onboarding/onboardingUnlockCeremony.js';
import './UnlockCeremonyHost.scss';

interface UnlockCeremonyHostProps {
  surface: OnboardingUnlockCeremonySurface | null;
  onAction: (target: OnboardingRouteTarget) => void;
  onDismiss: (surface: OnboardingUnlockCeremonySurface) => void;
}

export function UnlockCeremonyHost({ surface, onAction, onDismiss }: UnlockCeremonyHostProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  if (!surface || surface.state !== 'active') return null;

  const detailId = `unlock-ceremony-detail-${surface.card.cardId}`;

  return (
    <section className="unlockCeremonyHost" aria-live="polite" data-testid="unlock-ceremony">
      <div className="unlockCeremonyCard">
        <div className="unlockCeremonyCard__ribbon" aria-hidden />
        <div className="unlockCeremonyCard__eyebrow">New Lesson</div>
        <h2 className="unlockCeremonyCard__title">{surface.card.title}</h2>
        <p className="unlockCeremonyCard__body">{surface.card.body}</p>
        {surface.card.moreDetail ? (
          <div className="unlockCeremonyCard__details">
            <button
              type="button"
              className="unlockCeremonyCard__linkButton"
              aria-expanded={detailOpen}
              aria-controls={detailId}
              onClick={() => setDetailOpen((current) => !current)}
            >
              Details
            </button>
            {detailOpen ? (
              <p className="unlockCeremonyCard__detailText" id={detailId}>
                {surface.card.moreDetail}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="unlockCeremonyCard__actions">
          <button
            type="button"
            className="unlockCeremonyCard__primary"
            onClick={() => {
              onAction(surface.card.route);
              onDismiss(surface);
            }}
          >
            {surface.card.ctaLabel}
          </button>
          <button type="button" className="unlockCeremonyCard__secondary" onClick={() => onDismiss(surface)}>
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}
