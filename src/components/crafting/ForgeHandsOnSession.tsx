import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CraftSession,
  CraftStep,
  ForgeHandsOnBonus,
  ForgeSessionOutcome,
  ForgeStepResult,
} from '../../systems/crafting/craftingTypes';
import { computeForgeOutcome } from '../../systems/crafting/forgeOutcome';
import { useCraftSessionStore } from '../../stores/craftSessionStore';
import { useUIStore } from '../../stores/uiStore';
import { GameEvents } from '../../services/events/GameEvents';
import { ForgeWorkbenchScene } from './ForgeWorkbenchScene';
import { TimingCircleQTE } from '../qte/TimingCircleQTE';
import { ForgeRingQte, type ForgeRingQteRating } from './ForgeRingQte';

interface ForgeHandsOnSessionProps {
  session: CraftSession;
  now: number;
  blueprintName?: string;
  bonus?: ForgeHandsOnBonus;
  onOutcome?: (outcome: ForgeSessionOutcome) => void;
}

interface HeatSampleState {
  min: number;
  max: number;
  inBandMs: number;
  lastSample: number;
  completed: boolean;
}

const MAX_HEAT = 1200;

const defaultHeatSample = (now: number, heat: number): HeatSampleState => ({
  min: heat,
  max: heat,
  inBandMs: 0,
  lastSample: now,
  completed: false,
});

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return '--';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function clampHeat(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_HEAT, Math.floor(value)));
}

function HeatGauge({
  heat,
  targetMin,
  targetMax,
  onChange,
}: {
  heat: number;
  targetMin: number;
  targetMax: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="forgeDial">
      <div className="forgeDialHeader">
        <div className="forgeDialTitle">Forge Heat</div>
        <div className="forgeDialZone">{heat < 350 ? 'Warm' : heat < 700 ? 'Working' : 'Surge'}</div>
      </div>
      <input
        type="range"
        min={0}
        max={MAX_HEAT}
        value={heat}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="forgeDialMeta">
        <div>Heat: {heat}</div>
        <div>
          Target: {Math.floor(targetMin)} - {Math.floor(targetMax)}
        </div>
      </div>
      <div className="forgeTargetBar">
        <div
          className="forgeTargetFill"
          style={{
            left: `${(Math.max(0, targetMin) / MAX_HEAT) * 100}%`,
            width: `${(Math.max(0, targetMax - targetMin) / MAX_HEAT) * 100}%`,
          }}
        />
        <div className="forgeTargetPointer" style={{ left: `${(heat / MAX_HEAT) * 100}%` }} />
      </div>
    </div>
  );
}

function ForgeStepHeatMaterial({
  step,
  heat,
  timeRemaining,
  onHeatChange,
  onComplete,
}: {
  step: Extract<CraftStep, { type: 'HEAT_MATERIAL' }>;
  heat: number;
  timeRemaining: number | undefined;
  onHeatChange: (value: number) => void;
  onComplete: () => void;
}) {
  return (
    <div className="forgeStepCard">
      <div className="forgeStepTitle">{step.uiLabel ?? 'Heat material'}</div>
      <div className="forgeStepBody">
        <div>Raise the material into the target band, then hold it steady.</div>
        <HeatGauge heat={heat} targetMin={step.targetMin} targetMax={step.targetMax} onChange={onHeatChange} />
        <div className="forgeStepMeta">{timeRemaining !== undefined ? `${formatMs(timeRemaining)} left` : 'No timer'}</div>
        <button
          type="button"
          className="worldScreenModuleButton worldScreenModuleButton--active"
          onClick={onComplete}
        >
          Lock heat
        </button>
      </div>
    </div>
  );
}

function ForgeStepHeatTo({
  step,
  heat,
  onHeatChange,
  onComplete,
}: {
  step: Extract<CraftStep, { type: 'HEAT_TO' }>;
  heat: number;
  onHeatChange: (value: number) => void;
  onComplete: () => void;
}) {
  const targetMin = Math.max(0, step.targetHeat - step.tolerance);
  const targetMax = Math.max(targetMin, step.targetHeat + step.tolerance);
  return (
    <div className="forgeStepCard">
      <div className="forgeStepTitle">{step.uiLabel ?? 'Heat forge'}</div>
      <div className="forgeStepBody">
        <div>Heat to the target band, then lock it in.</div>
        <HeatGauge heat={heat} targetMin={targetMin} targetMax={targetMax} onChange={onHeatChange} />
        <button
          type="button"
          className="worldScreenModuleButton worldScreenModuleButton--active"
          onClick={onComplete}
        >
          Lock heat
        </button>
      </div>
    </div>
  );
}

function ForgeStepTemper({
  step,
  heat,
  timeRemaining,
  onHeatChange,
  onComplete,
}: {
  step: Extract<CraftStep, { type: 'TEMPER' }>;
  heat: number;
  timeRemaining: number | undefined;
  onHeatChange: (value: number) => void;
  onComplete: () => void;
}) {
  const targetMin = step.targetMin ?? step.targetHeat - 25;
  const targetMax = step.targetMax ?? step.targetHeat + 25;
  return (
    <div className="forgeStepCard">
      <div className="forgeStepTitle">{step.uiLabel ?? 'Temper'}</div>
      <div className="forgeStepBody">
        <div>Temper within the highlighted band and finish when stable.</div>
        <HeatGauge heat={heat} targetMin={targetMin} targetMax={targetMax} onChange={onHeatChange} />
        <div className="forgeStepMeta">{timeRemaining !== undefined ? `${formatMs(timeRemaining)} left` : 'No timer'}</div>
        <button
          type="button"
          className="worldScreenModuleButton worldScreenModuleButton--active"
          onClick={onComplete}
        >
          Finish temper
        </button>
      </div>
    </div>
  );
}

function ForgeStepQuench({
  step,
  elapsed,
  selectedMedium,
  onSelectMedium,
  onQuench,
}: {
  step: Extract<CraftStep, { type: 'QUENCH' }>;
  elapsed: number;
  selectedMedium: 'water' | 'oil' | 'brine';
  onSelectMedium: (medium: 'water' | 'oil' | 'brine') => void;
  onQuench: () => void;
}) {
  const totalWindow = step.timingWindow ? Math.max(step.timingWindow.goodMax, step.timingWindow.perfectMax) : 0;
  const progress = totalWindow ? Math.min(1, elapsed / totalWindow) : 0;
  return (
    <div className="forgeStepCard">
      <div className="forgeStepTitle">{step.uiLabel ?? 'Quench'}</div>
      <div className="forgeStepBody">
        <div>Select the medium and quench at the right moment.</div>
        <div className="forgeMediumRow">
          {step.mediumOptions.map((medium) => (
            <button
              key={medium}
              type="button"
              className={classNames('forgeMediumChip', { 'forgeMediumChip--active': selectedMedium === medium })}
              onClick={() => onSelectMedium(medium)}
            >
              {medium}
            </button>
          ))}
        </div>
        <div className="forgeQuenchBar">
          <div className="forgeQuenchFill" style={{ width: `${progress * 100}%` }} />
          {step.timingWindow && (
            <div
              className="forgeQuenchGood"
              style={{
                left: `${(step.timingWindow.goodMin / totalWindow) * 100}%`,
                width: `${((step.timingWindow.goodMax - step.timingWindow.goodMin) / totalWindow) * 100}%`,
              }}
            />
          )}
          {step.timingWindow && (
            <div
              className="forgeQuenchPerfect"
              style={{
                left: `${(step.timingWindow.perfectMin / totalWindow) * 100}%`,
                width: `${((step.timingWindow.perfectMax - step.timingWindow.perfectMin) / totalWindow) * 100}%`,
              }}
            />
          )}
        </div>
        <div className="forgeStepMeta">{totalWindow ? `${formatMs(totalWindow - elapsed)} window` : 'Timing by feel'}</div>
        <button
          type="button"
          className="worldScreenModuleButton worldScreenModuleButton--active"
          onClick={onQuench}
        >
          Quench now
        </button>
      </div>
    </div>
  );
}

function ForgeStepAlloyMix({ step, onSelect }: { step: Extract<CraftStep, { type: 'ALLOY_MIX' }>; onSelect: (id: string) => void }) {
  return (
    <div className="forgeStepCard">
      <div className="forgeStepTitle">{step.uiLabel ?? 'Mix alloys'}</div>
      <div className="forgeStepBody">
        <div>Choose how to fold the alloys.</div>
        <div className="forgeMediumRow">
          {step.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="forgeMediumChip"
              onClick={() => onSelect(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ForgeStepCastShape({ step, onConfirm }: { step: Extract<CraftStep, { type: 'CAST_OR_SHAPE' }>; onConfirm: () => void }) {
  return (
    <div className="forgeStepCard">
      <div className="forgeStepTitle">{step.uiLabel ?? 'Cast or Shape'}</div>
      <div className="forgeStepBody">
        <div>{step.variant === 'cast' ? 'Pour carefully to fill the mold.' : 'Shape the billet with steady pressure.'}</div>
        <button type="button" className="worldScreenModuleButton worldScreenModuleButton--active" onClick={onConfirm}>
          Confirm {step.variant}
        </button>
      </div>
    </div>
  );
}

export function ForgeHandsOnSession({ session, now, blueprintName, bonus, onOutcome }: ForgeHandsOnSessionProps) {
  const setHeatSetting = useCraftSessionStore((state) => state.setHeatSetting);
  const setStepStartedNow = useCraftSessionStore((state) => state.setStepStartedNow);
  const advanceStep = useCraftSessionStore((state) => state.advanceStep);
  const recordForgeStepResult = useCraftSessionStore((state) => state.recordForgeStepResult);
  const markBackgroundResolving = useCraftSessionStore((state) => state.markBackgroundResolving);
  const abortSession = useCraftSessionStore((state) => state.abortSession);
  const completeHandsOnSession = useCraftSessionStore((state) => state.completeHandsOnSession);
  const addNotification = useUIStore((state) => state.addNotification);

  const heatSetting = session.cursor.heatSetting ?? 300;
  const heatRef = useRef(heatSetting);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [selectedMedium, setSelectedMedium] = useState<'water' | 'oil' | 'brine'>('water');
  const [hammerState, setHammerState] = useState<{ attempts: number; timingSum: number; impactKey: number; impactScore: number }>({
    attempts: 0,
    timingSum: 0,
    impactKey: 0,
    impactScore: 0,
  });
  const [engraveState, setEngraveState] = useState<{ attempts: number; impactKey: number; impactScore: number }>({
    attempts: 0,
    impactKey: 0,
    impactScore: 0,
  });
  const [formationState, setFormationState] = useState<{ attempts: number; impactKey: number; impactScore: number }>({
    attempts: 0,
    impactKey: 0,
    impactScore: 0,
  });
  const heatSample = useRef<HeatSampleState>(defaultHeatSample(now, heatSetting));

  const performances = session.cursor.forgeStepResults ?? [];

  useEffect(() => {
    heatRef.current = heatSetting;
  }, [heatSetting]);

  const currentStep = session.script.steps[session.cursor.stepIndex];
  const stepEndsAt = session.cursor.stepEndsAt;

  useEffect(() => {
    if (!session.cursor.stepStartedAt) {
      setStepStartedNow(now);
    }
  }, [session.cursor.stepStartedAt, session.cursor.stepIndex, session.sessionId, now, setStepStartedNow]);

  useEffect(() => {
    heatSample.current = defaultHeatSample(now, heatSetting);
    setHammerState({ attempts: 0, timingSum: 0, impactKey: 0, impactScore: 0 });
    setEngraveState({ attempts: 0, impactKey: 0, impactScore: 0 });
    setFormationState({ attempts: 0, impactKey: 0, impactScore: 0 });
    const existing = performances.find((entry) => entry.stepId === currentStep?.id);
    if (existing && currentStep?.type === 'QUENCH' && 'medium' in existing) {
      setSelectedMedium(existing.medium);
    } else if (currentStep?.type === 'QUENCH' && currentStep.medium) {
      setSelectedMedium(currentStep.medium);
    }
  }, [currentStep?.id, heatSetting, now, performances, currentStep]);

  useEffect(() => {
    if (!currentStep || (currentStep.type !== 'HEAT_MATERIAL' && currentStep.type !== 'TEMPER')) return;
    const targetMin = currentStep.type === 'HEAT_MATERIAL' ? currentStep.targetMin : currentStep.targetMin ?? currentStep.targetHeat - 20;
    const targetMax = currentStep.type === 'HEAT_MATERIAL' ? currentStep.targetMax : currentStep.targetMax ?? currentStep.targetHeat + 20;

    const interval = window.setInterval(() => {
      const stamp = Date.now();
      const delta = Math.max(0, stamp - (heatSample.current.lastSample || stamp));
      heatSample.current.lastSample = stamp;
      heatSample.current.min = Math.min(heatSample.current.min, heatRef.current);
      heatSample.current.max = Math.max(heatSample.current.max, heatRef.current);
      if (heatRef.current >= targetMin && heatRef.current <= targetMax) {
        heatSample.current.inBandMs += delta;
      }
      if (stepEndsAt && stamp >= stepEndsAt && !heatSample.current.completed) {
        finalizeHeat(stamp);
      }
    }, 200);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.id, currentStep?.type, stepEndsAt]);

  const finalizeHeat = (stamp: number) => {
    if (!currentStep || (currentStep.type !== 'HEAT_MATERIAL' && currentStep.type !== 'TEMPER')) return;
    if (heatSample.current.completed) return;
    heatSample.current.completed = true;
    recordForgeStepResult({
      stepId: currentStep.id,
      type: currentStep.type,
      achievedMin: heatSample.current.min,
      achievedMax: heatSample.current.max,
      holdMs: heatSample.current.inBandMs,
    });
    const nextStamp = stamp || Date.now();
    advanceStep(nextStamp);
    setStepStartedNow(nextStamp);
    setLocalStatus('Heat captured for this step.');
    if (currentStep.type === 'HEAT_MATERIAL') {
      GameEvents.emit({ type: 'forge/metal_heat', payload: {} });
    } else {
      GameEvents.emit({ type: 'forge/temper', payload: {} });
    }
  };

  const resolveHammerStrike = (result: { score: number }) => {
    if (!currentStep || currentStep.type !== 'HAMMER_PATTERN') return;
    const nextAttempts = hammerState.attempts + 1;
    const nextTimingSum = hammerState.timingSum + result.score;
    GameEvents.emit({
      type: 'forge/hammer_strike',
      payload: { intensity: result.score > 0.75 ? 'heavy' : 'light' },
    });
    const nextImpactKey = hammerState.impactKey + 1;
    setHammerState({
      attempts: nextAttempts,
      timingSum: nextTimingSum,
      impactKey: nextImpactKey,
      impactScore: result.score,
    });
    if (nextAttempts >= currentStep.hits) {
      const stamp = Date.now();
      GameEvents.emit({ type: 'forge/hammer_complete', payload: {} });
      recordForgeStepResult({
        stepId: currentStep.id,
        type: 'HAMMER_PATTERN',
        hitsLanded: nextAttempts,
        hitsRequired: currentStep.hits,
        timingScore: nextAttempts > 0 ? nextTimingSum / nextAttempts : 0,
      });
      advanceStep(stamp);
      setStepStartedNow(stamp);
      setLocalStatus('Pattern forged.');
    }
  };

  const handleEngraveHit = (rating: ForgeRingQteRating) => {
    setEngraveState((prev) => ({
      attempts: prev.attempts + 1,
      impactKey: prev.impactKey + 1,
      impactScore: rating === 'perfect' ? 1 : rating === 'good' ? 0.6 : 0,
    }));
    if (rating !== 'miss') {
      GameEvents.emit({ type: 'forge/rune_engrave', payload: {} });
    }
  };

  const handleEngraveComplete = (result: { hitsLanded: number; hitsRequired: number; timingScore: number }) => {
    if (!currentStep || currentStep.type !== 'ENGRAVE_RUNE') return;
    setEngraveState((prev) => ({
      ...prev,
      impactKey: prev.impactKey + 1,
      impactScore: result.timingScore,
    }));
    const success = result.hitsLanded >= result.hitsRequired && result.timingScore >= 0.55;
    const stamp = Date.now();
    recordForgeStepResult({
      stepId: currentStep.id,
      type: 'ENGRAVE_RUNE',
      hitsLanded: result.hitsLanded,
      hitsRequired: result.hitsRequired,
      timingScore: result.timingScore,
      patternId: currentStep.patternId,
      success,
      precision: result.timingScore,
      optional: currentStep.optional,
    });
    advanceStep(stamp);
    setStepStartedNow(stamp);
    GameEvents.emit({ type: 'forge/rune_fuse', payload: {} });
    setLocalStatus(success ? 'Rune engraved.' : 'Engraving completed.');
  };

  const handleEngraveSkip = () => {
    if (!currentStep || currentStep.type !== 'ENGRAVE_RUNE') return;
    const hitsRequired = Math.max(1, Math.floor(currentStep.hits ?? 5));
    setEngraveState((prev) => ({
      ...prev,
      impactKey: prev.impactKey + 1,
      impactScore: 0,
    }));
    const stamp = Date.now();
    recordForgeStepResult({
      stepId: currentStep.id,
      type: 'ENGRAVE_RUNE',
      hitsLanded: 0,
      hitsRequired,
      timingScore: 0,
      patternId: currentStep.patternId,
      success: false,
      precision: 0,
      optional: true,
    });
    advanceStep(stamp);
    setStepStartedNow(stamp);
    setLocalStatus('Engraving skipped.');
  };

  const handleFormationHit = (rating: ForgeRingQteRating) => {
    setFormationState((prev) => ({
      attempts: prev.attempts + 1,
      impactKey: prev.impactKey + 1,
      impactScore: rating === 'perfect' ? 1 : rating === 'good' ? 0.6 : 0,
    }));
  };

  const handleFormationComplete = (result: { hitsLanded: number; hitsRequired: number; timingScore: number }) => {
    if (!currentStep || currentStep.type !== 'LAY_FORMATION') return;
    setFormationState((prev) => ({
      ...prev,
      impactKey: prev.impactKey + 1,
      impactScore: result.timingScore,
    }));
    const stamp = Date.now();
    recordForgeStepResult({
      stepId: currentStep.id,
      type: 'LAY_FORMATION',
      hitsLanded: result.hitsLanded,
      hitsRequired: result.hitsRequired,
      timingScore: result.timingScore,
      patternId: currentStep.patternId,
    });
    advanceStep(stamp);
    setStepStartedNow(stamp);
    GameEvents.emit({ type: 'forge/rune_fuse', payload: {} });
    setLocalStatus('Formation set.');
  };

  const handleQuench = () => {
    if (!currentStep || currentStep.type !== 'QUENCH') return;
    const stamp = Date.now();
    const elapsed = session.cursor.stepStartedAt ? stamp - session.cursor.stepStartedAt : 0;
    recordForgeStepResult({ stepId: currentStep.id, type: 'QUENCH', medium: selectedMedium, timingMs: elapsed });
    advanceStep(stamp);
    setStepStartedNow(stamp);
    GameEvents.emit({ type: 'forge/quench', payload: {} });
    setLocalStatus('Quenched. Moving on.');
  };

  const handleHeatToComplete = () => {
    if (!currentStep || currentStep.type !== 'HEAT_TO') return;
    const stamp = Date.now();
    advanceStep(stamp);
    setStepStartedNow(stamp);
    GameEvents.emit({ type: 'forge/metal_heat', payload: {} });
    setLocalStatus('Heat locked in.');
  };

  const handleTemperComplete = () => {
    const stamp = Date.now();
    finalizeHeat(stamp);
  };

  const handleAlloyChoice = (id: string) => {
    if (!currentStep || currentStep.type !== 'ALLOY_MIX') return;
    recordForgeStepResult({ stepId: currentStep.id, type: 'ALLOY_MIX', choiceId: id });
    const stamp = Date.now();
    advanceStep(stamp);
    setStepStartedNow(stamp);
    GameEvents.emit({ type: 'forge/rune_fuse', payload: {} });
    setLocalStatus('Alloys combined.');
  };

  const handleCastConfirm = () => {
    if (!currentStep || currentStep.type !== 'CAST_OR_SHAPE') return;
    const stamp = Date.now();
    recordForgeStepResult({ stepId: currentStep.id, type: 'CAST_OR_SHAPE', variant: currentStep.variant, success: true, precision: 0.75 });
    advanceStep(stamp);
    setStepStartedNow(stamp);
  };

  const handleComplete = () => {
    const result = completeHandsOnSession(Date.now());
    if (result.ok && result.result && 'scoreOverall' in result.result) {
      onOutcome?.(result.result as ForgeSessionOutcome);
      addNotification('success', 'Forge session complete.', 2500);
      GameEvents.emit({ type: 'forge/grind', payload: {} });
    } else {
      setLocalStatus('Unable to complete right now.');
    }
  };

  const elapsedForStep = useMemo(() => {
    if (!session.cursor.stepStartedAt) return 0;
    return Math.max(0, now - session.cursor.stepStartedAt);
  }, [now, session.cursor.stepStartedAt]);

  const timeRemaining = stepEndsAt ? Math.max(0, stepEndsAt - now) : undefined;

  const timeline = session.script.steps.map((step, idx) => ({
    id: step.id,
    label: step.uiLabel ?? step.type,
    status: idx < session.cursor.stepIndex ? 'done' : idx === session.cursor.stepIndex ? 'active' : 'pending',
  }));

  const liveOutcome = useMemo(
    () =>
      computeForgeOutcome({
        script: session.script,
        performances: performances,
        handsOnBonus: bonus,
        seed: session.seed,
      }),
    [session.script, performances, bonus, session.seed],
  );

  return (
    <div className="handsOnSessionCard forgeHandsOnLayout">
      <div className="forgeHandsOnMain">
        <div className="forgeSessionHeader">
          <div>
            <div className="forgeSessionTitle">Hands-on: {blueprintName ?? session.sourceId}</div>
            <div className="forgeSessionSub">Interactive forging steps. Leaving switches to baseline resolve.</div>
          </div>
          <div className="forgeSessionMeta">Step {session.cursor.stepIndex + 1}/{session.script.steps.length}</div>
        </div>

        <ForgeWorkbenchScene stepType={currentStep?.type} heatSetting={heatSetting}>
          {currentStep?.type === 'HAMMER_PATTERN' && (
            <div className="forgeWorkbenchScene__anvilSlot">
              <TimingCircleQTE
                key={`${currentStep.id}-${hammerState.attempts}`}
                durationMs={currentStep.shrinkMs}
                tolerance={currentStep.tolerance}
                sizePx={96}
                label="Strike"
                onResolve={(result) => resolveHammerStrike(result)}
              />
              {hammerState.impactKey > 0 && (
                <div
                  key={`impact-${hammerState.impactKey}`}
                  className={`forgeWorkbenchScene__impact forgeWorkbenchScene__impact--${hammerState.impactScore > 0 ? 'hit' : 'miss'}`}
                />
              )}
              {hammerState.impactKey > 0 && hammerState.impactScore > 0 && (
                <div key={`sparks-${hammerState.impactKey}`} className="forgeWorkbenchScene__sparks" />
              )}
              {hammerState.impactKey > 0 && (
                <div key={`shake-${hammerState.impactKey}`} className="forgeWorkbenchScene__workpieceShake" />
              )}
            </div>
          )}
          {currentStep?.type === 'ENGRAVE_RUNE' && (
            <div className="forgeWorkbenchScene__anvilSlot forgeWorkbenchScene__anvilSlot--engrave">
              <ForgeRingQte
                hitsRequired={Math.max(1, Math.floor(currentStep.hits ?? 5))}
                difficulty={currentStep.difficulty >= 3 ? 'hard' : currentStep.difficulty === 2 ? 'medium' : 'easy'}
                shrinkMs={currentStep.shrinkMs ?? 820}
                onHit={(rating) => handleEngraveHit(rating)}
                onComplete={(result) => handleEngraveComplete(result)}
                ariaLabel="Engrave rune"
              />
              {engraveState.impactKey > 0 && (
                <div
                  key={`engrave-impact-${engraveState.impactKey}`}
                  className={`forgeWorkbenchScene__impact forgeWorkbenchScene__impact--${engraveState.impactScore > 0 ? 'hit' : 'miss'}`}
                />
              )}
              {engraveState.impactKey > 0 && engraveState.impactScore > 0 && (
                <div key={`engrave-sparks-${engraveState.impactKey}`} className="forgeWorkbenchScene__sparks" />
              )}
              {engraveState.impactKey > 0 && (
                <div key={`engrave-shake-${engraveState.impactKey}`} className="forgeWorkbenchScene__workpieceShake" />
              )}
            </div>
          )}
          {currentStep?.type === 'LAY_FORMATION' && (
            <div className="forgeWorkbenchScene__anvilSlot forgeWorkbenchScene__anvilSlot--formation">
              <ForgeRingQte
                hitsRequired={Math.max(1, Math.floor(currentStep.hits ?? 4))}
                difficulty={currentStep.difficulty >= 3 ? 'hard' : currentStep.difficulty === 2 ? 'medium' : 'easy'}
                onHit={(rating) => handleFormationHit(rating)}
                onComplete={(result) => handleFormationComplete(result)}
                ariaLabel="Lay formation"
              />
              {formationState.impactKey > 0 && (
                <div
                  key={`formation-impact-${formationState.impactKey}`}
                  className={`forgeWorkbenchScene__impact forgeWorkbenchScene__impact--${formationState.impactScore > 0 ? 'hit' : 'miss'}`}
                />
              )}
              {formationState.impactKey > 0 && formationState.impactScore > 0 && (
                <div key={`formation-sparks-${formationState.impactKey}`} className="forgeWorkbenchScene__sparks" />
              )}
              {formationState.impactKey > 0 && (
                <div key={`formation-shake-${formationState.impactKey}`} className="forgeWorkbenchScene__workpieceShake" />
              )}
            </div>
          )}
        </ForgeWorkbenchScene>

        <div className="forgeHandsOnStepBlock">
          {currentStep?.type === 'HEAT_TO' && (
            <ForgeStepHeatTo
              step={currentStep}
              heat={heatSetting}
              onHeatChange={(value) => {
                setHeatSetting(clampHeat(value));
                GameEvents.emit({ type: 'forge/bellows_pump', payload: {} });
              }}
              onComplete={handleHeatToComplete}
            />
          )}
          {currentStep?.type === 'HEAT_MATERIAL' && (
            <ForgeStepHeatMaterial
              step={currentStep}
              heat={heatSetting}
              timeRemaining={timeRemaining}
              onHeatChange={(value) => {
                setHeatSetting(clampHeat(value));
                GameEvents.emit({ type: 'forge/bellows_pump', payload: {} });
              }}
              onComplete={() => finalizeHeat(Date.now())}
            />
          )}

          {currentStep?.type === 'HAMMER_PATTERN' && (
            <div className="forgeStepCard">
              <div className="forgeStepTitle">{currentStep.uiLabel ?? 'Hammer pattern'}</div>
              <div className="forgeStepBody">
                <div>Click when the ring meets the circle.</div>
                <div className="forgeStepMeta">
                  Strikes: {Math.min(hammerState.attempts, currentStep.hits)} / {currentStep.hits}
                </div>
              </div>
            </div>
          )}

          {currentStep?.type === 'QUENCH' && (
            <ForgeStepQuench
              step={currentStep}
              elapsed={elapsedForStep}
              selectedMedium={selectedMedium}
              onSelectMedium={setSelectedMedium}
              onQuench={handleQuench}
            />
          )}

          {currentStep?.type === 'TEMPER' && (
            <ForgeStepTemper
              step={currentStep}
              heat={heatSetting}
              timeRemaining={timeRemaining}
              onHeatChange={(value) => {
                setHeatSetting(clampHeat(value));
                GameEvents.emit({ type: 'forge/bellows_pump', payload: {} });
              }}
              onComplete={handleTemperComplete}
            />
          )}

          {currentStep?.type === 'ALLOY_MIX' && <ForgeStepAlloyMix step={currentStep} onSelect={handleAlloyChoice} />}

          {currentStep?.type === 'CAST_OR_SHAPE' && <ForgeStepCastShape step={currentStep} onConfirm={handleCastConfirm} />}

          {currentStep?.type === 'ENGRAVE_RUNE' && (
            <div className="forgeStepCard">
              <div className="forgeStepTitle">{currentStep.uiLabel ?? 'Engrave rune'}</div>
              <div className="forgeStepBody">
                <div>Engrave the rune: hit clean strokes.</div>
                <div className="forgeStepMeta">
                  Strokes: {Math.min(engraveState.attempts, Math.max(1, Math.floor(currentStep.hits ?? 5)))} /{' '}
                  {Math.max(1, Math.floor(currentStep.hits ?? 5))}
                </div>
                {currentStep.optional && (
                  <button type="button" className="worldScreenModuleButton" onClick={handleEngraveSkip}>
                    Skip engraving
                  </button>
                )}
              </div>
            </div>
          )}
          {currentStep?.type === 'LAY_FORMATION' && (
            <div className="forgeStepCard">
              <div className="forgeStepTitle">{currentStep.uiLabel ?? 'Lay formation'}</div>
              <div className="forgeStepBody">
                <div>Lay the formation: place each node in rhythm.</div>
                <div className="forgeStepMeta">
                  Strokes: {Math.min(formationState.attempts, Math.max(1, Math.floor(currentStep.hits ?? 4)))} /{' '}
                  {Math.max(1, Math.floor(currentStep.hits ?? 4))}
                </div>
              </div>
            </div>
          )}

          {currentStep?.type === 'FINISH' && (
            <div className="forgeStepCard">
              <div className="forgeStepTitle">Finish forging</div>
              <div className="forgeStepBody">
                <div>Complete the batch and claim results.</div>
                <button
                  type="button"
                  className="worldScreenModuleButton worldScreenModuleButton--active"
                  onClick={handleComplete}
                >
                  Complete forging
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="forgeQualityMeter">
          <div className="forgeQualityTitle">Quality &amp; Process</div>
          <div className="forgeQualityRows">
            <div className="forgeQualityRow">
              <div>Heat</div>
              <div className="forgeQualityBar">
                <div className="forgeQualityFill" style={{ width: `${Math.round(liveOutcome.heatScore * 100)}%` }} />
              </div>
              <div className="forgeQualityValue">{Math.round(liveOutcome.heatScore * 100)}%</div>
            </div>
            <div className="forgeQualityRow">
              <div>Hammer</div>
              <div className="forgeQualityBar">
                <div className="forgeQualityFill" style={{ width: `${Math.round(liveOutcome.hammerScore * 100)}%` }} />
              </div>
              <div className="forgeQualityValue">{Math.round(liveOutcome.hammerScore * 100)}%</div>
            </div>
            <div className="forgeQualityRow">
              <div>Quench</div>
              <div className="forgeQualityBar">
                <div className="forgeQualityFill" style={{ width: `${Math.round(liveOutcome.quenchScore * 100)}%` }} />
              </div>
              <div className="forgeQualityValue">{Math.round(liveOutcome.quenchScore * 100)}%</div>
            </div>
            <div className="forgeQualityRow">
              <div>Temper</div>
              <div className="forgeQualityBar">
                <div className="forgeQualityFill" style={{ width: `${Math.round(liveOutcome.temperScore * 100)}%` }} />
              </div>
              <div className="forgeQualityValue">{Math.round(liveOutcome.temperScore * 100)}%</div>
            </div>
          </div>
        </div>

        <div className="forgeHandsOnActions">
          <button type="button" className="worldScreenModuleButton" onClick={() => markBackgroundResolving('closed')}>
            Leave session
          </button>
          <button type="button" className="worldScreenModuleButton" onClick={() => abortSession()}>
            Abort
          </button>
        </div>
        {localStatus && <div className="forgeStatus forgeStatus--success">{localStatus}</div>}
      </div>

      <div className="forgeHandsOnSidebar">
        <div className="forgeTimeline">
          <div className="forgeTimelineTitle">Steps</div>
          <div className="forgeTimelineList">
            {timeline.map((item) => (
              <div key={item.id} className={classNames('forgeTimelineItem', `forgeTimelineItem--${item.status}`)}>
                <div className="forgeTimelineLabel">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="forgeOutcomePreview">
          <div className="forgeOutcomeTitle">Live preview</div>
          <div className="forgeOutcomeRow">Overall: {Math.round(liveOutcome.scoreOverall * 100)}%</div>
          <div className="forgeOutcomeRow">Time bonus: +{Math.round(liveOutcome.timeReductionPctApplied)}%</div>
          <div className="forgeOutcomeRow">Quality proc: +{Math.round(liveOutcome.qualityProcChanceBonusPct)}%</div>
        </div>
      </div>
    </div>
  );
}
