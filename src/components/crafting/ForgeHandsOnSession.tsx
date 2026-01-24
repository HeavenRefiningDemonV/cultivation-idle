import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type {
  CraftSession,
  CraftStep,
  ForgeHandsOnBonus,
  ForgeSessionOutcome,
  ForgeStepResult,
} from '../../systems/crafting/craftingTypes';
import { computeForgeOutcome } from '../../systems/crafting/forgeOutcome';
import { useCraftSessionStore } from '../../stores/craftSessionStore';
import { useProfessionStore } from '../../stores/professionStore';
import { useUIStore } from '../../stores/uiStore';
import { GameEvents } from '../../services/events/GameEvents';
import { ForgeWorkbenchScene, type ForgePhaseKind } from './ForgeWorkbenchScene';
import { TimingCircleQTE, type TimingCircleResult } from '../qte/TimingCircleQTE';
import { ForgeRingQte, type ForgeRingQteRating } from './ForgeRingQte';
import { ForgeHeatPullOutQTE, type ForgeHeatPullOutResult } from '../../ui/forge/ForgeHeatPullOutQTE';
import { ForgeHandsOnHudRail } from './ForgeHandsOnHudRail';

interface ForgeHandsOnSessionProps {
  session: CraftSession;
  now: number;
  blueprintName?: string;
  bonus?: ForgeHandsOnBonus;
  onOutcome?: (outcome: ForgeSessionOutcome) => void;
  onOpenDetails?: () => void;
}

interface HeatSampleState {
  min: number;
  max: number;
  inBandMs: number;
  lastSample: number;
  completed: boolean;
}

type ForgePhase = {
  kind: ForgePhaseKind;
  stepIndex: number;
  label: string;
  cycleIndex?: number;
  totalCycles?: number;
};

const MAX_HEAT = 1200;
const DEFAULT_HEAT_DURATION_MS = 2000;

const HEAT_ZONE_TARGETS: Record<string, number> = {
  EMBER: 0.55,
  STEADY: 0.7,
  ROARING: 0.82,
  SURGE: 0.92,
};

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

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const resolveHeatZone = (zone?: string, targetPct?: number): string => {
  if (zone) return zone.toUpperCase();
  if (targetPct === undefined) return 'STEADY';
  if (targetPct <= 0.58) return 'EMBER';
  if (targetPct <= 0.74) return 'STEADY';
  if (targetPct <= 0.86) return 'ROARING';
  return 'SURGE';
};

const resolveHeatTargetPct = (step: Extract<CraftStep, { type: 'HEAT_TO' | 'HEAT_MATERIAL' }>): number => {
  const zoneTarget = step.zone ? HEAT_ZONE_TARGETS[step.zone.toUpperCase()] : undefined;
  if (typeof zoneTarget === 'number') return clamp01(zoneTarget);
  if (step.type === 'HEAT_MATERIAL') {
    const center = (step.targetMin + step.targetMax) / 2;
    return clamp01(center / MAX_HEAT);
  }
  return clamp01(step.targetHeat / MAX_HEAT);
};

const resolveHeatTolerancePct = (
  step: Extract<CraftStep, { type: 'HEAT_TO' | 'HEAT_MATERIAL' }>,
  targetPct: number,
): number => {
  const baseTolerance =
    step.type === 'HEAT_MATERIAL' ? Math.max(1, step.targetMax - step.targetMin) / 2 : Math.max(1, step.tolerance);
  const normalized = baseTolerance / MAX_HEAT;
  const adjusted = normalized * (1.12 - targetPct * 0.35);
  return clamp01(Math.max(0.018, Math.min(0.18, adjusted)));
};

const resolveHeatDuration = (step: Extract<CraftStep, { type: 'HEAT_TO' | 'HEAT_MATERIAL' }>): number => {
  if (typeof step.withinSec === 'number' && Number.isFinite(step.withinSec)) {
    return Math.max(600, Math.floor(step.withinSec * 1000));
  }
  return DEFAULT_HEAT_DURATION_MS;
};

const isHeatStep = (step: CraftStep): boolean => step.type === 'HEAT_TO' || step.type === 'HEAT_MATERIAL';

const isStrikeStep = (step: CraftStep): boolean => step.type === 'HAMMER_PATTERN';

const isSpecialStep = (step: CraftStep): boolean =>
  step.type === 'ENGRAVE_RUNE' || step.type === 'LAY_FORMATION' || (!isHeatStep(step) && !isStrikeStep(step) && step.type !== 'FINISH');

const buildPhaseLabel = (step: CraftStep, heatIndex: number, totalHeats: number, strikeIndex: number, totalStrikes: number): string => {
  if (isHeatStep(step)) {
    return `Heat ${heatIndex}/${Math.max(1, totalHeats)}`;
  }
  if (isStrikeStep(step)) {
    return `Strike ${strikeIndex}/${Math.max(1, totalStrikes)}`;
  }
  if (step.type === 'ENGRAVE_RUNE') return 'Special: Engrave';
  if (step.type === 'LAY_FORMATION') return 'Special: Formation';
  if (step.type === 'FINISH') return 'Finish';
  return `Special: ${step.uiLabel ?? step.type}`;
};

const buildSparkBurst = (grade: 'perfect' | 'good' | 'miss', keyPrefix: string) => {
  if (grade === 'miss') return null;
  const count = grade === 'perfect' ? 8 : 6;
  return (
    <div key={`${keyPrefix}-sparks`} className={`forgeWorkbenchScene__sparkBurst forgeWorkbenchScene__sparkBurst--${grade}`}>
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={`${keyPrefix}-spark-${index}`}
          className="forgeWorkbenchScene__spark"
          style={{ '--spark-angle': `${(360 / count) * index}deg` } as CSSProperties}
        />
      ))}
    </div>
  );
};

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

export function ForgeHandsOnSession({
  session,
  now,
  blueprintName,
  bonus,
  onOutcome,
  onOpenDetails,
}: ForgeHandsOnSessionProps) {
  const setHeatSetting = useCraftSessionStore((state) => state.setHeatSetting);
  const setStepStartedNow = useCraftSessionStore((state) => state.setStepStartedNow);
  const advanceStep = useCraftSessionStore((state) => state.advanceStep);
  const recordForgeStepResult = useCraftSessionStore((state) => state.recordForgeStepResult);
  const markBackgroundResolving = useCraftSessionStore((state) => state.markBackgroundResolving);
  const abortSession = useCraftSessionStore((state) => state.abortSession);
  const completeForgeSession = useProfessionStore((state) => state.completeForgeSession);
  const addNotification = useUIStore((state) => state.addNotification);

  const heatSetting = session.cursor.heatSetting ?? 300;
  const heatRef = useRef(heatSetting);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [selectedMedium, setSelectedMedium] = useState<'water' | 'oil' | 'brine'>('water');
  const [hammerState, setHammerState] = useState<{
    attempts: number;
    timingSum: number;
    impactKey: number;
    impactScore: number;
    impactGrade: 'perfect' | 'good' | 'miss';
  }>({
    attempts: 0,
    timingSum: 0,
    impactKey: 0,
    impactScore: 0,
    impactGrade: 'miss',
  });
  const [engraveState, setEngraveState] = useState<{
    attempts: number;
    impactKey: number;
    impactScore: number;
    impactGrade: 'perfect' | 'good' | 'miss';
  }>({
    attempts: 0,
    impactKey: 0,
    impactScore: 0,
    impactGrade: 'miss',
  });
  const [formationState, setFormationState] = useState<{
    attempts: number;
    impactKey: number;
    impactScore: number;
    impactGrade: 'perfect' | 'good' | 'miss';
  }>({
    attempts: 0,
    impactKey: 0,
    impactScore: 0,
    impactGrade: 'miss',
  });
  const [heatState, setHeatState] = useState<{
    impactKey: number;
    impactScore: number;
    impactGrade: 'perfect' | 'good' | 'miss';
  }>({
    impactKey: 0,
    impactScore: 0,
    impactGrade: 'miss',
  });
  const [workpieceMoving, setWorkpieceMoving] = useState(false);
  const [workpieceCooling, setWorkpieceCooling] = useState(false);
  const coolingRef = useRef<{ startedAt: number; active: boolean }>({ startedAt: 0, active: false });
  const lastStationRef = useRef<'furnace' | 'anvil' | null>(null);
  const moveTimeoutRef = useRef<number | null>(null);
  const heatSample = useRef<HeatSampleState>(defaultHeatSample(now, heatSetting));

  const performances = session.cursor.forgeStepResults ?? [];
  const performanceByStepId = useMemo(() => {
    const map = new Map<string, ForgeStepResult>();
    performances.forEach((entry) => {
      map.set(entry.stepId, entry);
    });
    return map;
  }, [performances]);

  useEffect(() => {
    heatRef.current = heatSetting;
  }, [heatSetting]);

  const currentStep = session.script.steps[session.cursor.stepIndex];
  const phases = useMemo<ForgePhase[]>(() => {
    const totalHeats = session.script.steps.filter((step) => isHeatStep(step)).length;
    const totalStrikes = session.script.steps.filter((step) => isStrikeStep(step)).length;
    let heatIndex = 0;
    let strikeIndex = 0;
    return session.script.steps.map((step, stepIndex) => {
      let kind: ForgePhaseKind = 'SPECIAL';
      if (isHeatStep(step)) {
        kind = 'HEAT';
        heatIndex += 1;
      } else if (isStrikeStep(step)) {
        kind = 'STRIKE';
        strikeIndex += 1;
      } else if (step.type === 'FINISH') {
        kind = 'FINISH';
      } else if (isSpecialStep(step)) {
        kind = 'SPECIAL';
      }
      return {
        kind,
        stepIndex,
        label: buildPhaseLabel(step, heatIndex, totalHeats, strikeIndex, totalStrikes),
        cycleIndex: kind === 'HEAT' ? heatIndex : kind === 'STRIKE' ? strikeIndex : undefined,
        totalCycles: kind === 'HEAT' ? totalHeats : kind === 'STRIKE' ? totalStrikes : undefined,
      };
    });
  }, [session.script.steps]);
  const currentPhase = phases.find((phase) => phase.stepIndex === session.cursor.stepIndex);
  const stepEndsAt = session.cursor.stepEndsAt;

  useEffect(() => {
    if (!session.cursor.stepStartedAt) {
      setStepStartedNow(now);
    }
  }, [session.cursor.stepStartedAt, session.cursor.stepIndex, session.sessionId, now, setStepStartedNow]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!coolingRef.current.active) return;
      if (Date.now() - coolingRef.current.startedAt >= 6000) {
        coolingRef.current.active = false;
        setWorkpieceCooling(false);
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const station = currentPhase?.kind === 'HEAT' ? 'furnace' : 'anvil';
    if (lastStationRef.current && lastStationRef.current !== station) {
      setWorkpieceMoving(true);
      if (moveTimeoutRef.current) {
        window.clearTimeout(moveTimeoutRef.current);
      }
      moveTimeoutRef.current = window.setTimeout(() => {
        setWorkpieceMoving(false);
      }, 380);
    }
    if (currentPhase?.kind === 'HEAT') {
      coolingRef.current.active = false;
      setWorkpieceCooling(false);
    }
    lastStationRef.current = station;
    return () => {
      if (moveTimeoutRef.current) {
        window.clearTimeout(moveTimeoutRef.current);
      }
    };
  }, [currentPhase?.kind]);

  useEffect(() => {
    if (!currentStep || (currentStep.type !== 'HEAT_TO' && currentStep.type !== 'HEAT_MATERIAL')) return;
    GameEvents.emit({ type: 'forge/furnace_ignite', payload: {} });
    GameEvents.emit({ type: 'forge/metal_heat', payload: {} });
  }, [currentStep?.id, currentStep?.type]);

  useEffect(() => {
    heatSample.current = defaultHeatSample(now, heatSetting);
    setHammerState({ attempts: 0, timingSum: 0, impactKey: 0, impactScore: 0, impactGrade: 'miss' });
    setEngraveState({ attempts: 0, impactKey: 0, impactScore: 0, impactGrade: 'miss' });
    setFormationState({ attempts: 0, impactKey: 0, impactScore: 0, impactGrade: 'miss' });
    setHeatState({ impactKey: 0, impactScore: 0, impactGrade: 'miss' });
    const existing = performances.find((entry) => entry.stepId === currentStep?.id);
    if (existing && currentStep?.type === 'QUENCH' && 'medium' in existing) {
      setSelectedMedium(existing.medium);
    } else if (currentStep?.type === 'QUENCH' && currentStep.medium) {
      setSelectedMedium(currentStep.medium);
    }
  }, [currentStep?.id, heatSetting, now, performances, currentStep]);

  useEffect(() => {
    if (!currentStep || currentStep.type !== 'TEMPER') return;
    const targetMin = currentStep.targetMin ?? currentStep.targetHeat - 20;
    const targetMax = currentStep.targetMax ?? currentStep.targetHeat + 20;

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
    if (!currentStep || currentStep.type !== 'TEMPER') return;
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
    GameEvents.emit({ type: 'forge/temper', payload: {} });
  };

  const resolveHammerStrike = (result: TimingCircleResult) => {
    if (!currentStep || currentStep.type !== 'HAMMER_PATTERN') return;
    const nextAttempts = hammerState.attempts + 1;
    const nextTimingSum = hammerState.timingSum + result.score;
    const impactGrade = result.grade;
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
      impactGrade,
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

  const handleHeatResolve = (result: ForgeHeatPullOutResult) => {
    if (!currentStep || (currentStep.type !== 'HEAT_TO' && currentStep.type !== 'HEAT_MATERIAL')) return;
    const targetPct = resolveHeatTargetPct(currentStep);
    const heatZone = resolveHeatZone(currentStep.zone, targetPct);
    setHeatState((prev) => ({
      impactKey: prev.impactKey + 1,
      impactScore: result.timingScore,
      impactGrade: result.grade,
    }));
    coolingRef.current = { startedAt: Date.now(), active: true };
    setWorkpieceCooling(true);
    recordForgeStepResult({
      stepId: currentStep.id,
      type: currentStep.type,
      timingScore: result.timingScore,
      heatZone,
    });
    const stamp = Date.now();
    advanceStep(stamp);
    setStepStartedNow(stamp);
    if (result.grade === 'miss') {
      GameEvents.emit({ type: 'forge/hammer_strike', payload: { intensity: 'light' } });
    } else {
      GameEvents.emit({ type: 'forge/hammer_complete', payload: {} });
    }
    setLocalStatus(result.grade === 'perfect' ? 'Perfect heat pull.' : result.grade === 'good' ? 'Heat pulled cleanly.' : 'Heat missed.');
  };

  const handleEngraveHit = (rating: ForgeRingQteRating) => {
    setEngraveState((prev) => ({
      attempts: prev.attempts + 1,
      impactKey: prev.impactKey + 1,
      impactScore: rating === 'perfect' ? 1 : rating === 'good' ? 0.6 : 0,
      impactGrade: rating,
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
      impactGrade: result.timingScore >= 0.85 ? 'perfect' : result.timingScore > 0 ? 'good' : 'miss',
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
      impactGrade: 'miss',
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
      impactGrade: rating,
    }));
  };

  const handleFormationComplete = (result: { hitsLanded: number; hitsRequired: number; timingScore: number }) => {
    if (!currentStep || currentStep.type !== 'LAY_FORMATION') return;
    setFormationState((prev) => ({
      ...prev,
      impactKey: prev.impactKey + 1,
      impactScore: result.timingScore,
      impactGrade: result.timingScore >= 0.85 ? 'perfect' : result.timingScore > 0 ? 'good' : 'miss',
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
    const result = completeForgeSession({ sessionId: session.sessionId });
    if (result.ok && result.result) {
      const outcome = (result.result as { outcome?: ForgeSessionOutcome }).outcome ?? null;
      if (outcome) {
        onOutcome?.(outcome);
      }
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

  const heatStepConfig = useMemo(() => {
    if (!currentStep || (currentStep.type !== 'HEAT_TO' && currentStep.type !== 'HEAT_MATERIAL')) return null;
    const targetPct = resolveHeatTargetPct(currentStep);
    const tolerancePct = resolveHeatTolerancePct(currentStep, targetPct);
    return {
      durationMs: resolveHeatDuration(currentStep),
      targetPct,
      tolerancePct,
      heatZone: resolveHeatZone(currentStep.zone, targetPct),
    };
  }, [currentStep]);

  const timeline = phases.map((phase) => ({
    id: session.script.steps[phase.stepIndex]?.id ?? `phase-${phase.stepIndex}`,
    label: phase.label,
    status:
      phase.stepIndex < session.cursor.stepIndex
        ? 'done'
        : phase.stepIndex === session.cursor.stepIndex
          ? 'active'
          : 'pending',
  }));

  const qualityBuckets = useMemo(() => {
    const heatSteps = session.script.steps.filter((step) => isHeatStep(step));
    const strikeSteps = session.script.steps.filter((step) => isStrikeStep(step));
    const specialSteps = session.script.steps.filter((step) => isSpecialStep(step));
    const averageScore = (values: number[], fallback: number) => {
      if (!values.length) return fallback;
      return clamp01(values.reduce((sum, value) => sum + value, 0) / values.length);
    };
    const heatScores = heatSteps.map((step) => {
      const perf = performanceByStepId.get(step.id);
      return typeof perf?.timingScore === 'number' ? perf.timingScore : 0.6;
    });
    const strikeScores = strikeSteps.map((step) => {
      const perf = performanceByStepId.get(step.id);
      return typeof perf?.timingScore === 'number' ? perf.timingScore : 0.6;
    });
    const specialScores = specialSteps.map((step) => {
      const perf = performanceByStepId.get(step.id);
      if (typeof perf?.timingScore === 'number') return perf.timingScore;
      if (typeof perf?.precision === 'number') return perf.precision;
      return 0.6;
    });
    return [
      heatSteps.length ? { key: 'heat', label: 'Heat', score: averageScore(heatScores, 0.6) } : null,
      strikeSteps.length ? { key: 'hammer', label: 'Hammer', score: averageScore(strikeScores, 0.6) } : null,
      specialSteps.length ? { key: 'special', label: 'Special', score: averageScore(specialScores, 0.6) } : null,
    ].filter((bucket): bucket is { key: string; label: string; score: number } => Boolean(bucket));
  }, [performanceByStepId, session.script.steps]);

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

  const stepTitle = useMemo(() => {
    if (!currentStep) return 'Prepare';
    if (currentStep.type === 'FINISH') return 'Finish forging';
    return currentStep.uiLabel ?? currentStep.type.replace(/_/g, ' ').toLowerCase();
  }, [currentStep]);

  const stepInstruction = useMemo(() => {
    if (!currentStep) return 'Await the next forging instruction.';
    switch (currentStep.type) {
      case 'HEAT_TO':
      case 'HEAT_MATERIAL':
        return 'Heat the billet and pull it out in the target band.';
      case 'HAMMER_PATTERN':
        return 'Strike when the ring meets the circle for clean hits.';
      case 'QUENCH':
        return 'Quench at the right moment to lock the temper.';
      case 'TEMPER':
        return 'Hold within the temper band until the timer completes.';
      case 'ALLOY_MIX':
        return 'Blend the alloy additives in the right ratio.';
      case 'CAST_OR_SHAPE':
        return 'Choose the shaping method and commit.';
      case 'ENGRAVE_RUNE':
        return 'Engrave steady strokes to fix the rune.';
      case 'LAY_FORMATION':
        return 'Lay formation nodes in order without breaks.';
      case 'FINISH':
        return 'Finalize the batch and claim the results.';
      default:
        return 'Complete the current step.';
    }
  }, [currentStep]);

  const stepMetaLines = useMemo(() => {
    if (!currentStep) return [];
    if ((currentStep.type === 'HEAT_TO' || currentStep.type === 'HEAT_MATERIAL') && heatStepConfig) {
      return [`Target zone: ${heatStepConfig.heatZone}`, `Timing: ${formatMs(heatStepConfig.durationMs)}`];
    }
    if (currentStep.type === 'HAMMER_PATTERN') {
      return [`Strikes: ${Math.min(hammerState.attempts, currentStep.hits)} / ${currentStep.hits}`];
    }
    if (currentStep.type === 'ENGRAVE_RUNE') {
      const total = Math.max(1, Math.floor(currentStep.hits ?? 5));
      return [`Strokes: ${Math.min(engraveState.attempts, total)} / ${total}`];
    }
    if (currentStep.type === 'LAY_FORMATION') {
      const total = Math.max(1, Math.floor(currentStep.hits ?? 4));
      return [`Strokes: ${Math.min(formationState.attempts, total)} / ${total}`];
    }
    if (currentStep.type === 'TEMPER') {
      return [timeRemaining !== undefined ? `Timer: ${formatMs(timeRemaining)}` : 'Timer: --'];
    }
    if (currentStep.type === 'QUENCH') {
      return [`Medium: ${selectedMedium ?? 'Choose'}`];
    }
    return [];
  }, [
    currentStep,
    heatStepConfig,
    hammerState.attempts,
    engraveState.attempts,
    formationState.attempts,
    timeRemaining,
    selectedMedium,
  ]);

  const actionHint = useMemo(() => {
    if (!currentStep) return undefined;
    switch (currentStep.type) {
      case 'HEAT_TO':
      case 'HEAT_MATERIAL':
        return 'Hold to pull when the glow hits the target zone.';
      case 'HAMMER_PATTERN':
        return 'Tap to strike on the beat.';
      case 'QUENCH':
        return 'Tap to quench at the right moment.';
      case 'TEMPER':
        return 'Adjust heat and confirm when stable.';
      case 'ALLOY_MIX':
        return 'Choose the alloy mix.';
      case 'CAST_OR_SHAPE':
        return 'Select a shaping approach.';
      case 'ENGRAVE_RUNE':
        return 'Tap to carve clean strokes.';
      case 'LAY_FORMATION':
        return 'Tap to place the formation nodes.';
      case 'FINISH':
        return 'Complete forging to claim the batch.';
      default:
        return undefined;
    }
  }, [currentStep]);

  const stepControls = useMemo(() => {
    if (!currentStep) return null;
    if (currentStep.type === 'QUENCH') {
      return (
        <ForgeStepQuench
          step={currentStep}
          elapsed={elapsedForStep}
          selectedMedium={selectedMedium}
          onSelectMedium={setSelectedMedium}
          onQuench={handleQuench}
        />
      );
    }
    if (currentStep.type === 'TEMPER') {
      return (
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
      );
    }
    if (currentStep.type === 'ALLOY_MIX') {
      return <ForgeStepAlloyMix step={currentStep} onSelect={handleAlloyChoice} />;
    }
    if (currentStep.type === 'CAST_OR_SHAPE') {
      return <ForgeStepCastShape step={currentStep} onConfirm={handleCastConfirm} />;
    }
    if (currentStep.type === 'FINISH') {
      return (
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
      );
    }
    return null;
  }, [
    currentStep,
    elapsedForStep,
    selectedMedium,
    heatSetting,
    timeRemaining,
    handleQuench,
    handleTemperComplete,
    handleAlloyChoice,
    handleCastConfirm,
    handleComplete,
  ]);

  return (
    <div className="handsOnSessionCard forgeHandsOnSession">
      <div className="forgeHandsOnStage forgeHandsOnStage--overlay">
        <div className="forgeHandsOnStage__content">
          <ForgeWorkbenchScene
            stepType={currentStep?.type}
            phaseKind={currentPhase?.kind}
            heatSetting={heatSetting}
            hideWorkpiece={currentStep?.type === 'HEAT_TO' || currentStep?.type === 'HEAT_MATERIAL'}
            workpieceMoving={workpieceMoving}
            workpieceCooling={workpieceCooling && currentPhase?.kind !== 'HEAT'}
          >
            {(currentStep?.type === 'HEAT_TO' || currentStep?.type === 'HEAT_MATERIAL') && heatStepConfig && (
              <div className="forgeWorkbenchScene__furnaceSlot">
                <ForgeHeatPullOutQTE
                  key={currentStep.id}
                  durationMs={heatStepConfig.durationMs}
                  targetPct={heatStepConfig.targetPct}
                  tolerancePct={heatStepConfig.tolerancePct}
                  onResolve={handleHeatResolve}
                  ariaLabel="Pull the heated billet from the furnace"
                />
                {heatState.impactKey > 0 && (
                  <div
                    key={`heat-impact-${heatState.impactKey}`}
                    className={`forgeWorkbenchScene__impact forgeWorkbenchScene__impact--${heatState.impactGrade}`}
                  />
                )}
                {heatState.impactKey > 0 && buildSparkBurst(heatState.impactGrade, `heat-${heatState.impactKey}`)}
                {heatState.impactKey > 0 && (
                  <div key={`heat-shake-${heatState.impactKey}`} className="forgeWorkbenchScene__workpieceShake" />
                )}
                {heatState.impactKey > 0 && (
                  <div
                    key={`heat-pulse-${heatState.impactKey}`}
                    className={`forgeWorkbenchScene__pulse forgeWorkbenchScene__pulse--${heatState.impactGrade}`}
                  />
                )}
              </div>
            )}
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
                    className={`forgeWorkbenchScene__impact forgeWorkbenchScene__impact--${hammerState.impactGrade}`}
                  />
                )}
                {hammerState.impactKey > 0 && buildSparkBurst(hammerState.impactGrade, `hammer-${hammerState.impactKey}`)}
                {hammerState.impactKey > 0 && (
                  <div key={`shake-${hammerState.impactKey}`} className="forgeWorkbenchScene__workpieceShake" />
                )}
                {hammerState.impactKey > 0 && (
                  <div
                    key={`pulse-${hammerState.impactKey}`}
                    className={`forgeWorkbenchScene__pulse forgeWorkbenchScene__pulse--${hammerState.impactGrade}`}
                  />
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
                    className={`forgeWorkbenchScene__impact forgeWorkbenchScene__impact--${engraveState.impactGrade}`}
                  />
                )}
                {engraveState.impactKey > 0 &&
                  buildSparkBurst(engraveState.impactGrade, `engrave-${engraveState.impactKey}`)}
                {engraveState.impactKey > 0 && (
                  <div key={`engrave-shake-${engraveState.impactKey}`} className="forgeWorkbenchScene__workpieceShake" />
                )}
                {engraveState.impactKey > 0 && (
                  <div
                    key={`engrave-pulse-${engraveState.impactKey}`}
                    className={`forgeWorkbenchScene__pulse forgeWorkbenchScene__pulse--${engraveState.impactGrade}`}
                  />
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
                    className={`forgeWorkbenchScene__impact forgeWorkbenchScene__impact--${formationState.impactGrade}`}
                  />
                )}
                {formationState.impactKey > 0 &&
                  buildSparkBurst(formationState.impactGrade, `formation-${formationState.impactKey}`)}
                {formationState.impactKey > 0 && (
                  <div key={`formation-shake-${formationState.impactKey}`} className="forgeWorkbenchScene__workpieceShake" />
                )}
                {formationState.impactKey > 0 && (
                  <div
                    key={`formation-pulse-${formationState.impactKey}`}
                    className={`forgeWorkbenchScene__pulse forgeWorkbenchScene__pulse--${formationState.impactGrade}`}
                  />
                )}
              </div>
            )}
          </ForgeWorkbenchScene>
        </div>

        <div className="forgeHandsOnHudOverlay">
          <ForgeHandsOnHudRail
            blueprintName={blueprintName ?? session.sourceId}
            stepTitle={stepTitle}
            stepIndex={session.cursor.stepIndex + 1}
            stepCount={session.script.steps.length}
            instruction={stepInstruction}
            metaLines={stepMetaLines}
            actionHint={actionHint}
            meters={qualityBuckets.map((bucket) => ({ id: bucket.key, label: bucket.label, value: bucket.score }))}
            overallScore={liveOutcome.scoreOverall}
            steps={timeline.map((item) => ({ id: item.id, label: item.label, status: item.status }))}
            stepsExpanded={stepsExpanded}
            onToggleSteps={() => setStepsExpanded((prev) => !prev)}
            onOpenDetails={onOpenDetails}
            onLeave={() => markBackgroundResolving('closed')}
            onAbort={() => {
              const confirmed = window.confirm('Abort this hands-on session? Progress will be lost.');
              if (!confirmed) return;
              abortSession();
            }}
            controls={
              <>
                {(currentStep?.type === 'HEAT_TO' || currentStep?.type === 'HEAT_MATERIAL') && heatStepConfig && (
                  <div className="forgeStepCard">
                    <div className="forgeStepTitle">{currentStep.uiLabel ?? 'Heat billet'}</div>
                    <div className="forgeStepBody">
                      <div>Pull the metal out at the target heat.</div>
                      <div className="forgeHandsOnHudRail__metaRow">
                        <div className="forgeHandsOnHudRail__metaGroup">
                          <span className="forgeHandsOnHudRail__metaLabel">Target zone</span>
                          <span className="forgeHandsOnHudRail__chip">{heatStepConfig.heatZone}</span>
                        </div>
                        <div className="forgeHandsOnHudRail__metaGroup">
                          <span className="forgeHandsOnHudRail__metaLabel">Timer</span>
                          <span className="forgeHandsOnHudRail__timer">{formatMs(heatStepConfig.durationMs)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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

                {stepControls}

                {currentStep?.type === 'ENGRAVE_RUNE' && (
                  <div className="forgeStepCard">
                    <div className="forgeStepTitle">{currentStep.uiLabel ?? 'Engrave rune'}</div>
                    <div className="forgeStepBody">
                      <div>Engrave clean strokes.</div>
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
                      <div>Lay nodes in sequence.</div>
                      <div className="forgeStepMeta">
                        Strokes: {Math.min(formationState.attempts, Math.max(1, Math.floor(currentStep.hits ?? 4)))} /{' '}
                        {Math.max(1, Math.floor(currentStep.hits ?? 4))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            }
            statusMessage={localStatus}
          />
        </div>
      </div>
    </div>
  );
}
