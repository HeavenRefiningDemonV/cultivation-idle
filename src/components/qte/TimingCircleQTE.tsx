import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import './TimingCircleQTE.scss';

export type TimingCircleGrade = 'perfect' | 'good' | 'miss';

export type TimingCircleResult = {
  score: number;
  hit: boolean;
  elapsedMs: number;
  grade: TimingCircleGrade;
};

export type TimingCircleQTEProps = {
  durationMs: number;
  tolerance: number;
  sizePx?: number;
  disabled?: boolean;
  label?: string;
  onResolve: (result: TimingCircleResult) => void;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const computeScore = (elapsedMs: number, durationMs: number, tolerance: number): number => {
  const midpoint = durationMs / 2;
  const delta = Math.abs(elapsedMs - midpoint);
  const window = Math.max(1, durationMs * tolerance);
  return clamp01(1 - delta / window);
};

const computeGrade = (score: number): TimingCircleGrade => {
  if (score >= 0.85) return 'perfect';
  if (score > 0) return 'good';
  return 'miss';
};

export function TimingCircleQTE({
  durationMs,
  tolerance,
  sizePx = 96,
  disabled = false,
  label,
  onResolve,
}: TimingCircleQTEProps) {
  const startRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);
  const resolveTimeoutRef = useRef<number | null>(null);
  const clearLabelTimeoutRef = useRef<number | null>(null);
  const [result, setResult] = useState<TimingCircleResult | null>(null);
  const [showGrade, setShowGrade] = useState(false);

  const inlineStyle = useMemo(
    () =>
      ({
        '--qte-size': `${sizePx}px`,
        '--qte-duration': `${durationMs}ms`,
      }) as CSSProperties,
    [durationMs, sizePx],
  );

  const finishResolve = useCallback(
    (elapsedMs: number, forcedMiss = false) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      const rawScore = forcedMiss ? 0 : computeScore(elapsedMs, durationMs, tolerance);
      const score = clamp01(rawScore);
      const grade = computeGrade(score);
      const nextResult: TimingCircleResult = {
        score,
        hit: score > 0,
        elapsedMs,
        grade,
      };
      setResult(nextResult);
      setShowGrade(true);
      onResolve(nextResult);
      if (clearLabelTimeoutRef.current) {
        window.clearTimeout(clearLabelTimeoutRef.current);
      }
      clearLabelTimeoutRef.current = window.setTimeout(() => {
        setShowGrade(false);
      }, 300);
    },
    [durationMs, onResolve, tolerance],
  );

  const handleResolve = useCallback(() => {
    if (disabled) return;
    if (startRef.current === null) return;
    const elapsedMs = performance.now() - startRef.current;
    finishResolve(elapsedMs);
  }, [disabled, finishResolve]);

  useEffect(() => {
    if (disabled) return;
    resolvedRef.current = false;
    setResult(null);
    setShowGrade(false);
    startRef.current = performance.now();
    resolveTimeoutRef.current = window.setTimeout(() => {
      if (startRef.current === null) return;
      const elapsedMs = performance.now() - startRef.current;
      finishResolve(elapsedMs, true);
    }, durationMs);

    return () => {
      if (resolveTimeoutRef.current) {
        window.clearTimeout(resolveTimeoutRef.current);
      }
      if (clearLabelTimeoutRef.current) {
        window.clearTimeout(clearLabelTimeoutRef.current);
      }
    };
  }, [disabled, durationMs, finishResolve]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleResolve();
      }
    },
    [handleResolve],
  );

  const statusClass = result ? `timing-circle-qte--${result.grade}` : '';
  const disabledClass = disabled ? 'timing-circle-qte--disabled' : '';
  const resolvedClass = result ? 'timing-circle-qte--resolved' : '';
  const combinedClass = `timing-circle-qte ${statusClass} ${disabledClass} ${resolvedClass}`;

  return (
    <div
      className={combinedClass}
      style={inlineStyle}
      role="button"
      aria-label={label ?? 'Timing circle quick-time event'}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={handleResolve}
      onKeyDown={handleKeyDown}
    >
      <div className="timing-circle-qte__target" />
      <div className="timing-circle-qte__approach" />
      {label && <div className="timing-circle-qte__label">{label}</div>}
      {result && showGrade && <div className="timing-circle-qte__grade">{result.grade}</div>}
    </div>
  );
}
