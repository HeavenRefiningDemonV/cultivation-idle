import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import './ForgeHeatPullOutQTE.scss';

export type ForgeHeatPullOutResult = {
  timingScore: number;
  grade: 'perfect' | 'good' | 'miss';
  elapsedMs: number;
};

type ForgeHeatPullOutQTEProps = {
  durationMs: number;
  targetPct: number;
  tolerancePct: number;
  onResolve: (result: ForgeHeatPullOutResult) => void;
  ariaLabel?: string;
  disabled?: boolean;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function ForgeHeatPullOutQTE({
  durationMs,
  targetPct,
  tolerancePct,
  onResolve,
  ariaLabel = 'Pull the heated billet from the furnace',
  disabled = false,
}: ForgeHeatPullOutQTEProps) {
  const startRef = useRef<number>(0);
  const resolvedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const [grade, setGrade] = useState<ForgeHeatPullOutResult['grade'] | null>(null);
  const [resolvedKey, setResolvedKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const safeDuration = Math.max(600, durationMs);
  const safeTolerance = Math.max(0.01, tolerancePct);
  const safeTarget = clamp01(targetPct);

  const progressToResult = useCallback(
    (elapsedMs: number) => {
      const progressPct = clamp01(elapsedMs / safeDuration);
      const deltaPct = Math.abs(progressPct - safeTarget);
      const timingScore = clamp01(1 - deltaPct / safeTolerance);
      const resultGrade: ForgeHeatPullOutResult['grade'] =
        deltaPct <= safeTolerance * 0.35 ? 'perfect' : timingScore > 0 ? 'good' : 'miss';
      return { timingScore, grade: resultGrade, elapsedMs };
    },
    [safeDuration, safeTarget, safeTolerance],
  );

  const resolve = useCallback(
    (elapsedMs: number, forcedMiss = false) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      const result = forcedMiss
        ? { timingScore: 0, grade: 'miss' as const, elapsedMs }
        : progressToResult(elapsedMs);
      setGrade(result.grade);
      setResolvedKey((prev) => prev + 1);
      setIsPaused(true);
      onResolve(result);
    },
    [onResolve, progressToResult],
  );

  useEffect(() => {
    resolvedRef.current = false;
    setGrade(null);
    setIsPaused(false);
    startRef.current = performance.now();
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      resolve(safeDuration, true);
    }, safeDuration);
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [resolve, safeDuration, safeTarget, safeTolerance]);

  const handleResolve = () => {
    if (disabled || resolvedRef.current) return;
    const elapsedMs = performance.now() - startRef.current;
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    resolve(elapsedMs);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleResolve();
    }
  };

  const containerStyle = useMemo(
    () =>
      ({
        '--heat-duration': `${safeDuration}ms`,
      }) as React.CSSProperties,
    [safeDuration],
  );

  const containerClass = useMemo(() => {
    if (!grade) return 'forgeHeatPullOutQte';
    return `forgeHeatPullOutQte forgeHeatPullOutQte--${grade}`;
  }, [grade]);

  return (
    <div
      className={containerClass}
      style={containerStyle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      onPointerDown={handleResolve}
      onKeyDown={handleKeyDown}
      data-paused={isPaused ? 'true' : 'false'}
    >
      <div className="forgeHeatPullOutQte__furnace" />
      <div className="forgeHeatPullOutQte__billet" />
      <div className="forgeHeatPullOutQte__prompt">Pull out</div>
      {grade && (
        <div key={`heat-grade-${resolvedKey}`} className={`forgeHeatPullOutQte__grade forgeHeatPullOutQte__grade--${grade}`}>
          {grade}
        </div>
      )}
    </div>
  );
}
