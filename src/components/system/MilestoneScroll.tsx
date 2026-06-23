import { useState } from 'react';
import type {
  OnboardingMilestoneActionSurface,
  OnboardingMilestoneSurface,
} from '../../systems/onboarding/onboardingMilestoneSurface.js';
import './MilestoneScroll.scss';

interface MilestoneScrollProps {
  surface: OnboardingMilestoneSurface;
  onAction: (action: OnboardingMilestoneActionSurface) => void;
  onOpenLedger: () => void;
  /** the active route — lets the card relocate off a screen whose own bottom chrome it would occlude
   *  (E1: the Cultivation Seat's diegetic breath-line sits where this card's default bottom anchor is). */
  route?: string;
}

export function MilestoneScroll({ surface, onAction, onOpenLedger, route }: MilestoneScrollProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (surface.state !== 'active' || !surface.primaryAction) return null;

  const detailsId = `milestone-scroll-details-${surface.milestoneId ?? 'current'}`;
  const hasDetails = surface.details.length > 0 || Boolean(surface.rewardPreview);

  return (
    <section className="milestoneScroll" aria-live="polite" data-testid="milestone-scroll" data-route={route}>
      <div className="milestoneScroll__seal" aria-hidden />
      <div className="milestoneScroll__main">
        <div className="milestoneScroll__meta">
          <span>{surface.eyebrow}</span>
          {surface.phaseLabel ? <span>{surface.phaseLabel}</span> : null}
        </div>
        <h2 className="milestoneScroll__title">{surface.title}</h2>
        <p className="milestoneScroll__why">{surface.why}</p>
        {surface.route.blocked && surface.route.reason ? (
          <p className="milestoneScroll__blocked">{surface.route.reason}</p>
        ) : null}
        {hasDetails ? (
          <div className="milestoneScroll__details">
            <button
              type="button"
              className="milestoneScroll__linkButton"
              aria-expanded={detailsOpen}
              aria-controls={detailsId}
              onClick={() => setDetailsOpen((current) => !current)}
            >
              How calculated
            </button>
            {detailsOpen ? (
              <div className="milestoneScroll__detailPanel" id={detailsId}>
                {surface.rewardPreview ? (
                  <div className="milestoneScroll__detailRow">
                    <span>Reward preview</span>
                    <p>{surface.rewardPreview}</p>
                  </div>
                ) : null}
                {surface.details.map((detail) => (
                  <div className="milestoneScroll__detailRow" key={detail.label}>
                    <span>{detail.label}</span>
                    <p>{detail.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="milestoneScroll__actions">
        <button
          type="button"
          className="milestoneScroll__primary"
          disabled={surface.primaryAction.disabled}
          onClick={() => onAction(surface.primaryAction as OnboardingMilestoneActionSurface)}
        >
          {surface.primaryAction.label}
        </button>
        {surface.fallbackAction ? (
          <button
            type="button"
            className="milestoneScroll__secondary"
            onClick={() => onAction(surface.fallbackAction as OnboardingMilestoneActionSurface)}
          >
            {surface.fallbackAction.label}
          </button>
        ) : null}
        <button type="button" className="milestoneScroll__secondary" onClick={onOpenLedger}>
          Tutorial Ledger
        </button>
      </div>
    </section>
  );
}
