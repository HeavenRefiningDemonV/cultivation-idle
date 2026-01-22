import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { ApBreakdown } from '../../stores/prestigeStore';

interface PrestigeRitualModalProps {
  open: boolean;
  apGain: number;
  breakdown: ApBreakdown;
  canPrestigeNow: boolean;
  lockReason: string;
  currentRealm: string;
  sellBeforePrestige: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => boolean;
}

const HOLD_DURATION_MS = 1400;

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(','))).filter(
    (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'),
  );
};

export function PrestigeRitualModal({
  open,
  apGain,
  breakdown,
  canPrestigeNow,
  lockReason,
  currentRealm,
  sellBeforePrestige,
  errorMessage,
  onClose,
  onConfirm,
}: PrestigeRitualModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const holdFrameRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [ritualStatus, setRitualStatus] = useState<string | null>(null);

  const breakdownRows = useMemo(() => breakdown.rows ?? [], [breakdown.rows]);

  const stopHold = () => {
    if (holdFrameRef.current) {
      cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    holdStartRef.current = null;
    setHoldProgress(0);
  };

  const handleClose = () => {
    stopHold();
    setRitualStatus(null);
    onClose();
  };

  const completeHold = () => {
    const result = onConfirm();
    if (result) {
      setRitualStatus('Ritual begins…');
      window.setTimeout(() => {
        handleClose();
      }, 500);
    } else {
      stopHold();
    }
  };

  const startHold = () => {
    if (!canPrestigeNow) return;
    setRitualStatus(null);
    const start = performance.now();
    holdStartRef.current = start;

    const step = (now: number) => {
      if (holdStartRef.current === null) return;
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
      setHoldProgress(progress);
      if (progress >= 1) {
        holdStartRef.current = null;
        completeHold();
        return;
      }
      holdFrameRef.current = requestAnimationFrame(step);
    };

    holdFrameRef.current = requestAnimationFrame(step);
  };

  const cancelHold = () => {
    if (holdStartRef.current === null) return;
    stopHold();
  };

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusables = getFocusableElements(dialog);
    const target = focusables[0] ?? dialog;
    requestAnimationFrame(() => target?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) {
      setHoldProgress(0);
      setRitualStatus(null);
    }
    return () => stopHold();
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      handleClose();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = getFocusableElements(dialogRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === dialogRef.current) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!canPrestigeNow) return;
    event.preventDefault();
    startHold();
  };

  const hintLabel = canPrestigeNow ? 'Eligible' : 'Sealed';

  return createPortal(
    <div className="prestigeRitualOverlay" role="presentation" onMouseDown={handleClose}>
      <div
        className={`prestigeRitualModal${canPrestigeNow ? '' : ' is-sealed'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="prestigeRitualHeader">
          <div>
            <h2 className="prestigeRitualTitle" id={titleId}>
              Confirm Reincarnation Ritual
            </h2>
            <p className="prestigeRitualSubtitle">This ritual resets your cultivation journey, but grants Ascension Points.</p>
          </div>
          <button type="button" className="prestigeRitualClose" onClick={handleClose} aria-label="Close ritual">
            ✕
          </button>
        </header>

        <div className="prestigeRitualBody">
          <div className="prestigeRitualScroll">
            <section className="prestigeRitualSection">
              <div className="prestigeRitualSectionTitle">Ritual Summary</div>
              <div className="prestigeRitualSummaryGrid">
                <div>
                  <div className="prestigeRitualLabel">Current realm</div>
                  <div className="prestigeRitualValue">{currentRealm}</div>
                </div>
                <div>
                  <div className="prestigeRitualLabel">Status</div>
                  <div className={`prestigeRitualValue${canPrestigeNow ? '' : ' is-muted'}`}>{hintLabel}</div>
                  {!canPrestigeNow && <div className="prestigeRitualHint">{lockReason}</div>}
                </div>
                <div>
                  <div className="prestigeRitualLabel">Potential AP gain</div>
                  <div className="prestigeRitualValue is-accent">+{apGain} AP</div>
                  <div className="prestigeRitualHint">AP is used to unlock permanent decrees.</div>
                </div>
              </div>
            </section>

            <section className="prestigeRitualSection">
              <div className="prestigeRitualSectionTitle">What You Keep</div>
              <ul className="prestigeRitualList">
                <li>✓ Keep all Ascension Points</li>
                <li>✓ Keep all AP upgrades</li>
                <li>✓ Keep spirit root floor level</li>
              </ul>
            </section>

            <section className="prestigeRitualSection">
              <div className="prestigeRitualSectionTitle">What Resets</div>
              <ul className="prestigeRitualList is-warning">
                <li>✗ Reset cultivation progress</li>
                <li>✗ Reset inventory &amp; gold</li>
                {sellBeforePrestige && <li>• Inventory will be sold for gold before the reset</li>}
              </ul>
            </section>

            <section className="prestigeRitualSection">
              <div className="prestigeRitualSectionTitle">AP Breakdown</div>
              <div className="prestigeRitualBreakdownSummary">Total potential gain: +{breakdown.potentialGain} AP</div>
              {breakdown.potentialGain === 0 && (
                <div className="prestigeRitualHint">No AP gain yet — progress further in this life.</div>
              )}
              <div className="prestigeRitualBreakdownRows">
                {breakdownRows.map((row) => (
                  <div key={row.key} className="prestigeRitualBreakdownRow">
                    <div>
                      <div className="prestigeRitualRowLabel">{row.label}</div>
                      {row.hint && <div className="prestigeRitualRowHint">{row.hint}</div>}
                    </div>
                    <div className="prestigeRitualRowValue">{row.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="prestigeRitualSection">
              <div className="prestigeRitualSectionTitle">Final Warning</div>
              <div className="prestigeRitualWarning">
                This cannot be undone. You will restart from the mortal realm.
              </div>
            </section>
          </div>

          <footer className="prestigeRitualFooter">
            <div className="prestigeRitualFooterNote">Hold the seal to confirm the ritual.</div>
            <button
              type="button"
              className={`prestigeRitualConfirmButton${canPrestigeNow ? '' : ' is-locked'}`}
              onPointerDown={handlePointerDown}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              disabled={!canPrestigeNow}
              aria-disabled={!canPrestigeNow}
            >
              <span className="prestigeRitualHoldFill" style={{ transform: `scaleX(${holdProgress})` }} />
              <span className="prestigeRitualHoldLabel">Hold to Reincarnate</span>
            </button>
            {ritualStatus && <div className="prestigeRitualStatus">{ritualStatus}</div>}
            {errorMessage && <div className="prestigeRitualError">{errorMessage}</div>}
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}
