import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { OnboardingLedgerSurface } from '../../systems/onboarding/onboardingLedger.js';
import './TutorialLedgerDrawer.scss';

interface TutorialLedgerDrawerProps {
  open: boolean;
  surface: OnboardingLedgerSurface;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function TutorialLedgerDrawer({ open, surface, onClose }: TutorialLedgerDrawerProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const closeButton = panelRef.current?.querySelector<HTMLButtonElement>('[data-ledger-close]');
    closeButton?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="tutorialLedgerDrawer" role="presentation">
      <button type="button" className="tutorialLedgerDrawer__scrim" aria-label="Close Tutorial Ledger" onClick={onClose} />
      <section
        className="tutorialLedgerDrawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-ledger-title"
        ref={panelRef}
        onKeyDown={handleKeyDown}
      >
        <header className="tutorialLedgerDrawer__header">
          <div>
            <p className="tutorialLedgerDrawer__eyebrow">Guidance Archive</p>
            <h2 id="tutorial-ledger-title">{surface.title}</h2>
          </div>
          <button type="button" className="tutorialLedgerDrawer__close" data-ledger-close onClick={onClose}>
            Close
          </button>
        </header>

        {surface.state === 'empty' ? (
          <p className="tutorialLedgerDrawer__empty">{surface.emptyMessage}</p>
        ) : (
          <ol className="tutorialLedgerDrawer__entries">
            {surface.entries.map((entry) => (
              <li className="tutorialLedgerDrawer__entry" key={`${entry.replayId}:${entry.cardId}`}>
                <div className="tutorialLedgerDrawer__entryMeta">
                  <span>{entry.phaseLabel}</span>
                  <span>{entry.milestoneLabel}</span>
                </div>
                <h3>{entry.title}</h3>
                <p>{entry.body}</p>
                {entry.moreDetail ? <p className="tutorialLedgerDrawer__detail">{entry.moreDetail}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
