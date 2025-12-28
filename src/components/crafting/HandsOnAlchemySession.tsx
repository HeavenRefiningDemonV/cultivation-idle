import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CraftSession, CraftStep } from '../../systems/crafting/craftingTypes';
import { getItemDef } from '../../stores/contentStore';
import { useCraftSessionStore } from '../../stores/craftSessionStore';
import { useUIStore } from '../../stores/uiStore';

interface HandsOnAlchemySessionProps {
  session: CraftSession;
  now: number;
}

interface HeatZoneInfo {
  label: string;
  className: string;
}

const MAX_HEAT = 1200;

function getHeatZone(heat: number): HeatZoneInfo {
  if (heat < 200) return { label: 'Ember', className: 'alchemyDialZone--ember' };
  if (heat < 450) return { label: 'Steady Flame', className: 'alchemyDialZone--steady' };
  if (heat < 700) return { label: 'Roaring Flame', className: 'alchemyDialZone--roaring' };
  if (heat < 950) return { label: 'Spirit Surge', className: 'alchemyDialZone--surge' };
  return { label: 'Scorch', className: 'alchemyDialZone--scorch' };
}

function isWithinBand(heat: number, target: number, tolerance: number): boolean {
  return Math.abs(heat - target) <= tolerance;
}

function computeBand(step: CraftStep | undefined, previousBand: { target: number; tolerance: number } | null) {
  if (step?.type === 'HEAT_TO' || step?.type === 'TEMPER') {
    return { target: step.targetHeat, tolerance: step.tolerance ?? 20 };
  }
  if (previousBand) return previousBand;
  return { target: 400, tolerance: 25 };
}

function formatTimeMs(ms: number | undefined): string {
  if (ms === undefined) return '--';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function deterministicWindow(stepId: string, seed: number, duration: number) {
  const base = Math.abs(
    stepId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), seed % 997) % 1000,
  ) / 1000;
  const centerPct = 0.45 + base * 0.25; // roughly middle area
  const widthPct = 0.18;
  const center = duration * centerPct;
  const half = (duration * widthPct) / 2;
  const start = Math.max(0, center - half);
  const end = Math.min(duration, center + half);
  return { start, end };
}

function computeStability(impurities: number, mistakes: number) {
  return Math.max(0, Math.min(100, 100 - impurities * 6 - mistakes * 4));
}

export function HandsOnAlchemySession({ session, now }: HandsOnAlchemySessionProps) {
  const setHeatSetting = useCraftSessionStore((state) => state.setHeatSetting);
  const addImpurities = useCraftSessionStore((state) => state.addImpurities);
  const recordScoreParts = useCraftSessionStore((state) => state.recordScoreParts);
  const incrementOrderMistake = useCraftSessionStore((state) => state.incrementOrderMistake);
  const advanceStep = useCraftSessionStore((state) => state.advanceStep);
  const setStepStartedNow = useCraftSessionStore((state) => state.setStepStartedNow);
  const markBackgroundResolving = useCraftSessionStore((state) => state.markBackgroundResolving);
  const completeHandsOnSession = useCraftSessionStore((state) => state.completeHandsOnSession);
  const abortSession = useCraftSessionStore((state) => state.abortSession);
  const claimSession = useCraftSessionStore((state) => state.claimActiveSession);
  const addNotification = useUIStore((state) => state.addNotification);

  const heatSetting = session.cursor.heatSetting ?? 300;
  const heatRef = useRef(heatSetting);
  const holdSamples = useRef({ samples: 0, inBand: 0 });
  const holdCompleted = useRef(false);
  const lastBandRef = useRef<{ target: number; tolerance: number } | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  useEffect(() => {
    heatRef.current = heatSetting;
  }, [heatSetting]);

  const currentStep = session.script.steps[session.cursor.stepIndex];
  const previousHeatBand = useMemo(() => {
    const stepsBefore = session.script.steps.slice(0, session.cursor.stepIndex + 1);
    const lastHeat = [...stepsBefore].reverse().find((step) => step.type === 'HEAT_TO' || step.type === 'TEMPER');
    if (lastHeat && (lastHeat.type === 'HEAT_TO' || lastHeat.type === 'TEMPER')) {
      return { target: lastHeat.targetHeat, tolerance: lastHeat.tolerance ?? 20 };
    }
    return null;
  }, [session.script.steps, session.cursor.stepIndex]);

  const targetBand = computeBand(currentStep, previousHeatBand ?? lastBandRef.current);
  useEffect(() => {
    lastBandRef.current = targetBand;
  }, [targetBand.target, targetBand.tolerance]);

  useEffect(() => {
    holdSamples.current = { samples: 0, inBand: 0 };
    holdCompleted.current = false;
    if (!session.cursor.stepStartedAt) {
      setStepStartedNow(now);
    }
  }, [session.sessionId, session.cursor.stepIndex, session.cursor.stepStartedAt, now, setStepStartedNow]);

  const stepEndsAt = session.cursor.stepEndsAt;

  useEffect(() => {
    if (currentStep?.type !== 'HOLD_HEAT') return;
    const interval = window.setInterval(() => {
      holdSamples.current.samples += 1;
      if (isWithinBand(heatRef.current, targetBand.target, targetBand.tolerance)) {
        holdSamples.current.inBand += 1;
      }
      if (stepEndsAt && Date.now() >= stepEndsAt && !holdCompleted.current) {
        holdCompleted.current = true;
        const ratio = holdSamples.current.samples > 0
          ? holdSamples.current.inBand / holdSamples.current.samples
          : 0;
        recordScoreParts({ stability: Math.round(ratio * 100) });
        if (ratio < 0.5) {
          addImpurities(1);
        }
        const stamp = Date.now();
        advanceStep(stamp);
        setStepStartedNow(stamp);
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [currentStep?.type, targetBand.target, targetBand.tolerance, stepEndsAt, addImpurities, recordScoreParts, advanceStep, setStepStartedNow]);

  useEffect(() => {
    if (currentStep?.type === 'HOLD_HEAT' && stepEndsAt && now >= stepEndsAt && !holdCompleted.current) {
      holdCompleted.current = true;
      const ratio = holdSamples.current.samples > 0 ? holdSamples.current.inBand / holdSamples.current.samples : 0;
      recordScoreParts({ stability: Math.round(ratio * 100) });
      if (ratio < 0.5) {
        addImpurities(1);
      }
      advanceStep(now);
      setStepStartedNow(now);
    }
  }, [now, currentStep?.type, stepEndsAt, addImpurities, recordScoreParts, advanceStep, setStepStartedNow]);

  const allIngredients = useMemo(
    () => session.script.steps.filter((step): step is Extract<CraftStep, { type: 'ADD_INGREDIENT' }> => step.type === 'ADD_INGREDIENT'),
    [session.script.steps],
  );

  const timeline = session.script.steps.map((step, index) => ({
    id: step.id,
    label: step.uiLabel ?? step.type,
    status: index < session.cursor.stepIndex ? 'done' : index === session.cursor.stepIndex ? 'active' : 'pending',
  }));

  const stability = computeStability(session.cursor.impurities ?? 0, session.cursor.orderMistakes ?? 0);
  const backgroundEta = session.cursor.backgroundResolveAt ?? null;

  const handleHeatLock = () => {
    const success = isWithinBand(heatSetting, targetBand.target, targetBand.tolerance);
    const errorScore = Math.max(0, 100 - Math.min(80, Math.abs(heatSetting - targetBand.target)));
    recordScoreParts({ heat: errorScore });
    if (!success) {
      addImpurities(1);
    }
    const stamp = Date.now();
    advanceStep(stamp);
    setStepStartedNow(stamp);
    setLocalStatus(success ? 'Flame locked within band.' : 'Off target. Impurities increased.');
  };

  const handleIngredient = (itemId: string) => {
    if (currentStep?.type !== 'ADD_INGREDIENT') return;
    if (itemId === currentStep.itemId) {
      const mistakes = session.cursor.orderMistakes ?? 0;
      const orderScore = Math.max(40, 100 - mistakes * 10);
      recordScoreParts({ order: orderScore });
      const stamp = Date.now();
      advanceStep(stamp);
      setStepStartedNow(stamp);
      setLocalStatus('Ingredient added in order.');
    } else {
      incrementOrderMistake();
      addImpurities(1);
      setLocalStatus('Wrong ingredient order. Stability lowered.');
    }
  };

  const handleSeal = () => {
    if (currentStep?.type !== 'SEAL_LID' || !session.cursor.stepStartedAt) return;
    const elapsed = now - session.cursor.stepStartedAt;
    const windowInfo = deterministicWindow(currentStep.id, session.seed, currentStep.windowMs);
    const success = elapsed >= windowInfo.start && elapsed <= windowInfo.end;
    recordScoreParts({ qte: success ? 100 : 60 });
    if (!success) addImpurities(1);
    const stamp = Date.now();
    advanceStep(stamp);
    setStepStartedNow(stamp);
    addNotification('success', success ? 'Sealed perfectly.' : 'Seal timing was rough.', 2500);
  };

  const handleComplete = () => {
    const result = completeHandsOnSession(Date.now());
    if (result.ok) {
      setLocalStatus('Batch finished. Claim when ready.');
    }
  };

  const currentZone = getHeatZone(heatSetting);
  const timeRemaining = stepEndsAt ? Math.max(0, stepEndsAt - now) : undefined;

  const backgroundMessage = backgroundEta
    ? `Session will finish at baseline in ${formatTimeMs(Math.max(0, backgroundEta - now))}.`
    : null;

  const handleClaim = () => {
    const result = claimSession(Date.now());
    if (result.ok) {
      setLocalStatus('Batch claimed.');
    } else {
      setLocalStatus(result.reason === 'not_ready' ? 'Batch not ready yet.' : 'Unable to claim session.');
    }
  };

  return (
    <div className="handsOnSessionCard">
      <div className="alchemyHandsOnLayout">
        <div className="alchemyHandsOnMain">
          <div className="alchemyDial">
            <div className="alchemyDialHeader">
              <div className="alchemyDialLabel">Dan Flame Dial</div>
              <div className={classNames('alchemyDialZoneLabel', currentZone.className)}>{currentZone.label}</div>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_HEAT}
              value={heatSetting}
              onChange={(e) => setHeatSetting(Number(e.target.value))}
            />
            <div className="alchemyDialMeta">
              <div>Heat: {heatSetting}</div>
              <div>
                Target band: {Math.max(0, Math.floor(targetBand.target - targetBand.tolerance))} -
                {Math.floor(targetBand.target + targetBand.tolerance)}
              </div>
            </div>
            <div className="alchemyTargetBand">
              <div
                className="alchemyTargetBandFill"
                style={{
                  left: `${(Math.max(0, targetBand.target - targetBand.tolerance) / MAX_HEAT) * 100}%`,
                  width: `${Math.min(
                    100 - (Math.max(0, targetBand.target - targetBand.tolerance) / MAX_HEAT) * 100,
                    (Math.min(MAX_HEAT, targetBand.tolerance * 2) / MAX_HEAT) * 100,
                  )}%`,
                }}
              />
              <div className="alchemyTargetBandPointer" style={{ left: `${(heatSetting / MAX_HEAT) * 100}%` }} />
            </div>
          </div>

          <div className="alchemyStepPanel">
            <div className="alchemyStepHeader">
              <div className="alchemyStepTitle">Current Step: {currentStep?.uiLabel ?? currentStep?.type}</div>
              <div className="alchemyStepTimer">{timeRemaining ? `${formatTimeMs(timeRemaining)} left` : 'No timer'}</div>
            </div>

            {currentStep?.type === 'HEAT_TO' && (
              <div className="alchemyStepBody">
                <div>Heat to the band, then lock the flame.</div>
                <button
                  type="button"
                  className="worldScreenModuleButton worldScreenModuleButton--active"
                  onClick={handleHeatLock}
                >
                  Lock Flame
                </button>
              </div>
            )}

            {currentStep?.type === 'HOLD_HEAT' && (
              <div className="alchemyStepBody">
                <div>Maintain the heat band until the timer ends.</div>
                <div className="alchemyHoldHint">Stay in band to improve stability.</div>
              </div>
            )}

            {currentStep?.type === 'ADD_INGREDIENT' && (
              <div className="alchemyStepBody">
                <div className="alchemyIngredientTray">
                  {allIngredients.map((entry) => {
                    const def = getItemDef(entry.itemId);
                    const label = def?.name ?? entry.itemId;
                    return (
                      <div
                        key={entry.id}
                        className={classNames('alchemyIngredientChip', {
                          'alchemyIngredientChip--active': entry.itemId === currentStep.itemId,
                        })}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', entry.itemId)}
                        onClick={() => handleIngredient(entry.itemId)}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
                <div
                  className="alchemyIngredientDrop"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData('text/plain');
                    handleIngredient(data);
                  }}
                >
                  Drop the correct ingredient here (or click a chip).
                </div>
              </div>
            )}

            {currentStep?.type === 'SEAL_LID' && (
              <div className="alchemyStepBody">
                <div>Click seal when the ring aligns.</div>
                <div className="alchemyQteBar">
                  <div
                    className="alchemyQteFill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, ((now - (session.cursor.stepStartedAt ?? now)) / (currentStep.windowMs || 1)) * 100),
                      )}%`,
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="worldScreenModuleButton worldScreenModuleButton--active"
                  onClick={handleSeal}
                >
                  Seal Lid
                </button>
              </div>
            )}

            {currentStep?.type === 'FINISH' && (
              <div className="alchemyStepBody">
                <div>Ready to bottle the batch.</div>
                <button
                  type="button"
                  className="worldScreenModuleButton worldScreenModuleButton--active"
                  onClick={handleComplete}
                >
                  Complete batch
                </button>
                <button type="button" className="worldScreenModuleButton" onClick={handleClaim}>
                  Claim now
                </button>
              </div>
            )}
          </div>

          <div className="alchemyStabilityMeter">
            <div className="alchemyStabilityLabel">Stability</div>
            <div className="alchemyStabilityBar">
              <div className="alchemyStabilityFill" style={{ width: `${stability}%` }} />
            </div>
            <div className="alchemyStabilityMeta">Impurities: {session.cursor.impurities ?? 0}</div>
          </div>

          <div className="alchemyLeaveRow">
            <button
              type="button"
              className="worldScreenModuleButton"
              onClick={() => markBackgroundResolving('closed')}
            >
              Leave session
            </button>
            <button
              type="button"
              className="worldScreenModuleButton"
              onClick={() => abortSession()}
            >
              Abort
            </button>
          </div>

          {backgroundMessage && <div className="alchemyBackgroundNotice">{backgroundMessage}</div>}
          {localStatus && <div className="alchemyStatusHint">{localStatus}</div>}
        </div>

        <div className="alchemyHandsOnSidebar">
          <div className="alchemyIngredientList">
            <div className="alchemySidebarTitle">Ingredient Order</div>
            {allIngredients.map((entry, idx) => {
              const def = getItemDef(entry.itemId);
              const label = def?.name ?? entry.itemId;
              return (
                <div key={entry.id} className={classNames('alchemyIngredientRow', {
                  'alchemyIngredientRow--done': idx < session.cursor.stepIndex,
                  'alchemyIngredientRow--active': session.script.steps[session.cursor.stepIndex]?.id === entry.id,
                })}
                >
                  <div>{label}</div>
                  <div className="alchemyIngredientQty">x{entry.qty}</div>
                </div>
              );
            })}
          </div>

          <div className="alchemyTimeline">
            <div className="alchemySidebarTitle">Step timeline</div>
            {timeline.map((entry) => (
              <div key={entry.id} className={classNames('alchemyTimelineItem', `alchemyTimelineItem--${entry.status}`)}>
                {entry.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
