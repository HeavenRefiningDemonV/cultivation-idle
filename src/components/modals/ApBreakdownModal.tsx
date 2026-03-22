import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { GameIcon } from '../../ui/icons/index.js';
import type { ApBreakdown } from '../../stores/prestigeStore.js';

interface ApBreakdownModalProps {
  open: boolean;
  breakdown: ApBreakdown;
  isSealed: boolean;
  onClose: () => void;
}

export function ApBreakdownModal({ open, breakdown, isSealed, onClose }: ApBreakdownModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

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
    requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  };

  return createPortal(
    <div className="prestigeBreakdownOverlay" role="presentation" onMouseDown={onClose}>
      <div
        className="prestigeBreakdownModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="prestigeBreakdownHeader">
          <div>
            <h2 className="prestigeBreakdownTitle" id={titleId}>
              Ascension Points Breakdown
            </h2>
            <p className="prestigeBreakdownSubtitle">Track what you have now and what the ritual will grant.</p>
          </div>
          <button type="button" className="prestigeBreakdownClose" onClick={onClose} aria-label="Close breakdown">
            <GameIcon icon="inkX" size={14} decorative />
          </button>
        </header>

        <div className="prestigeBreakdownContent">
          <div className="prestigeBreakdownSummary">
            <div>
              <div className="prestigeBreakdownLabel">Available now</div>
              <div className="prestigeBreakdownValue">{breakdown.availableNow}</div>
            </div>
            <div>
              <div className="prestigeBreakdownLabel">Total earned</div>
              <div className="prestigeBreakdownValue">{breakdown.totalEarned}</div>
            </div>
            <div>
              <div className="prestigeBreakdownLabel">Reincarnations</div>
              <div className="prestigeBreakdownValue">{breakdown.reincarnations}</div>
            </div>
          </div>

          <div className="prestigeBreakdownPotential">
            <div className="prestigeBreakdownPotentialLabel">Potential gain on reincarnation</div>
            <div className="prestigeBreakdownPotentialValue">+{breakdown.potentialGain} AP</div>
            {breakdown.potentialGain === 0 && (
              <div className="prestigeBreakdownHint">No AP gain yet — progress further in this life.</div>
            )}
            {isSealed && (
              <div className="prestigeBreakdownHint">Reincarnation sealed until Foundation Establishment.</div>
            )}
          </div>

          <div className="prestigeBreakdownRows">
            {breakdown.rows.map((row) => (
              <div key={row.key} className="prestigeBreakdownRow">
                <div>
                  <div className="prestigeBreakdownRowLabel">{row.label}</div>
                  {row.hint && <div className="prestigeBreakdownRowHint">{row.hint}</div>}
                </div>
                <div className="prestigeBreakdownRowValue">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
