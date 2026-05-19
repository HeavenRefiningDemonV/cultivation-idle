import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
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

  const handleHoldKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!canPrestigeNow) return;
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (holdStartRef.current !== null) return;
    startHold();
  };

  const handleHoldKeyUp = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    cancelHold();
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
      panelClassName={canPrestigeNow ? 'prestigeRitualModalHost__panel' : 'prestigeRitualModalHost__panel prestigeRitualModalHost__panel--sealed'}
      bodyClassName="prestigeRitualBody"
      ornament={<div className="prestigeRitualSeal" aria-hidden="true"><span /></div>}
      footer={(
        <div className="prestigeRitualFooter" data-ui="prestige-ritual-action-lane">
          <div className="prestigeRitualFooter__left">
            <button type="button" className="prestigeRitualCancelButton prestigeRitualCancelButton--tertiary uiNoShift" onClick={handleClose}>Cancel</button>
            <div className="prestigeRitualFooterNote">Hold the decree seal to confirm reincarnation. Releasing early cancels the hold.</div>
          </div>
          <div className="prestigeRitualFooter__right">
            <button
              type="button"
              className={`prestigeRitualConfirmButton${canPrestigeNow ? '' : ' is-locked'} uiNoShift`}
              onPointerDown={handlePointerDown}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              onKeyDown={handleHoldKeyDown}
              onKeyUp={handleHoldKeyUp}
              onBlur={cancelHold}
              disabled={!canPrestigeNow}
              aria-disabled={!canPrestigeNow}
              aria-describedby="prestige-ritual-hold-help"
            >
              <span className="prestigeRitualHoldFill" style={{ transform: `scaleX(${holdProgress})` }} />
              <span className="prestigeRitualHoldLabel">Hold to Reincarnate</span>
            </button>
            <div id="prestige-ritual-hold-help" className="prestigeRitualStatus" role="status" aria-live="polite">
              {ritualStatus ?? 'Press and hold Space or Enter to complete the ritual.'}
            </div>
            {errorMessage && <div className="prestigeRitualError" role="alert">{errorMessage}</div>}
          </div>
        </div>
      )}
      ariaLabel="Confirm Reincarnation Ritual"
    >
      <section className="prestigeRitualSection prestigeRitualSection--summary" data-ui="prestige-ritual-summary">
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

      <section className="prestigeRitualSection prestigeRitualSection--decree" data-ui="prestige-ritual-decree">
        <div className="prestigeRitualSectionTitle">Reincarnation Decree</div>
        <div className="prestigeRitualDecreeGrid">
          <article className="prestigeRitualDecreeCard">
            <div className="prestigeRitualDecreeTitle">Carries Forward</div>
            <ul className="prestigeRitualList">
              {resetPreview.carriesForward.map((line) => (
                <li key={line}>
                  <GameIcon icon="inkCheck" size={12} decorative />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="prestigeRitualDecreeCard is-warning">
            <div className="prestigeRitualDecreeTitle">Resets This Life</div>
            <ul className="prestigeRitualList is-warning">
              {resetPreview.resetsThisLife.map((line) => (
                <li key={line}>
                  <GameIcon icon="inkX" size={12} decorative />
                  <span>{line}</span>
                </li>
              ))}
              <li className="prestigeRitualSellLine" aria-hidden={!sellBeforePrestige}>
                <GameIcon icon="inkSparkles" size={12} decorative />
                <span>{sellBeforePrestige ? 'Inventory will be sold for gold before the reset' : '\u00A0'}</span>
              </li>
            </ul>
          </article>

          <article className="prestigeRitualDecreeCard">
            <div className="prestigeRitualDecreeTitle">Rebuilt Next Life</div>
            <ul className="prestigeRitualList">
              {resetPreview.rebuiltNextLife.map((line) => (
                <li key={line}>
                  <GameIcon icon="inkSparkles" size={12} decorative />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="prestigeRitualSection prestigeRitualSection--breakdown" data-ui="prestige-ritual-breakdown">
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

      <section className="prestigeRitualSection prestigeRitualSection--warning" data-ui="prestige-ritual-warning">
        <div className="prestigeRitualSectionTitle">Final Warning</div>
        <div className="prestigeRitualWarning">This cannot be undone. You will restart from the mortal realm.</div>
        <div className="prestigeRitualWarningHint">Use this when your current chapter push is complete and you want faster progress next life.</div>
      </section>
    </RitualModalFrame>
  );
}
