import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { ApBreakdown } from '../../stores/prestigeStore.js';
import { GameIcon } from '../../ui/icons/index.js';
import type { PrestigeResetPreviewBuckets } from '../../features/prestige/prestigeAdvisorSurface.js';
import { RitualModalFrame } from '../../ui/shell/index.js';
import './PrestigeRitualModal.scss';

interface PrestigeRitualModalProps {
  open: boolean;
  apGain: number;
  breakdown: ApBreakdown;
  advisorLabel: 'Too Early' | 'Viable' | 'Recommended';
  advisorDetail: string;
  resetPreview: PrestigeResetPreviewBuckets;
  canPrestigeNow: boolean;
  currentRealm: string;
  sellBeforePrestige: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => boolean;
}

const HOLD_DURATION_MS = 1400;

export function PrestigeRitualModal({
  open,
  apGain,
  breakdown,
  advisorLabel,
  advisorDetail,
  resetPreview,
  canPrestigeNow,
  currentRealm,
  sellBeforePrestige,
  errorMessage,
  onClose,
  onConfirm,
}: PrestigeRitualModalProps) {
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
    if (!open) {
      setHoldProgress(0);
      setRitualStatus(null);
    }
    return () => stopHold();
  }, [open]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!canPrestigeNow) return;
    event.preventDefault();
    startHold();
  };

  return (
    <RitualModalFrame
      open={open}
      onClose={handleClose}
      title="Confirm Reincarnation Ritual"
      subtitle="This ritual resets your cultivation journey, but grants Ascension Points."
      variant="ritual"
      size="lg"
      className="prestigeRitualModalHost"
      panelClassName={canPrestigeNow ? undefined : 'prestigeRitualModalHost__panel--sealed'}
      bodyClassName="prestigeRitualBody"
      footer={(
        <div className="prestigeRitualFooter">
          <div className="prestigeRitualFooterNote">Hold the seal to confirm the ritual.</div>
          <button
            type="button"
            className={`prestigeRitualConfirmButton${canPrestigeNow ? '' : ' is-locked'} uiNoShift`}
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
        </div>
      )}
      ariaLabel="Confirm Reincarnation Ritual"
    >
      <section className="prestigeRitualSection">
        <div className="prestigeRitualSectionTitle">Ritual Summary</div>
        <div className="prestigeRitualSummaryGrid">
          <div>
            <div className="prestigeRitualLabel">Current realm</div>
            <div className="prestigeRitualValue">{currentRealm}</div>
          </div>
          <div>
            <div className="prestigeRitualLabel">Status</div>
            <div className={`prestigeRitualValue${canPrestigeNow ? '' : ' is-muted'}`}>{advisorLabel}</div>
            <div className="prestigeRitualHint">{advisorDetail}</div>
          </div>
          <div>
            <div className="prestigeRitualLabel">Potential AP gain</div>
            <div className="prestigeRitualValue is-accent">+{apGain} AP</div>
            <div className="prestigeRitualHint">AP is used to unlock permanent decrees.</div>
          </div>
        </div>
      </section>

      <section className="prestigeRitualSection">
        <div className="prestigeRitualSectionTitle">Carries Forward</div>
        <ul className="prestigeRitualList">
          {resetPreview.carriesForward.map((line) => (
            <li key={line}>
              <GameIcon icon="inkCheck" size={12} decorative />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="prestigeRitualSection">
        <div className="prestigeRitualSectionTitle">Resets This Life</div>
        <ul className="prestigeRitualList is-warning">
          {resetPreview.resetsThisLife.map((line) => (
            <li key={line}>
              <GameIcon icon="inkX" size={12} decorative />
              <span>{line}</span>
            </li>
          ))}
          {sellBeforePrestige && (
            <li>
              <GameIcon icon="inkSparkles" size={12} decorative />
              <span>Inventory will be sold for gold before the reset</span>
            </li>
          )}
        </ul>
      </section>

      <section className="prestigeRitualSection">
        <div className="prestigeRitualSectionTitle">Rebuilt Next Life</div>
        <ul className="prestigeRitualList">
          {resetPreview.rebuiltNextLife.map((line) => (
            <li key={line}>
              <GameIcon icon="inkSparkles" size={12} decorative />
              <span>{line}</span>
            </li>
          ))}
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
    </RitualModalFrame>
  );
}
