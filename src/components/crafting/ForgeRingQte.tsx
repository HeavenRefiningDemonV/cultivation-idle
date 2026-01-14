import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import './ForgeRingQte.scss';

export type ForgeRingQteRating = 'miss' | 'good' | 'perfect';

export type ForgeRingQteResult = {
  hitsLanded: number;
  hitsRequired: number;
  timingScore: number;
  breakdown: ForgeRingQteRating[];
};

export type ForgeRingQteProps = {
  hitsRequired: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  shrinkMs?: number;
  goodWindowMs?: number;
  perfectWindowMs?: number;
  onHit?: (rating: ForgeRingQteRating) => void;
  onComplete: (result: ForgeRingQteResult) => void;
  disabled?: boolean;
  ariaLabel?: string;
  target?: { xPct: number; yPct: number };
  renderTarget?: (target: { xPct: number; yPct: number }) => React.ReactNode;
};

const SCORE_BY_RATING: Record<ForgeRingQteRating, number> = {
  miss: 0,
  good: 0.6,
  perfect: 1,
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const getDefaultsForDifficulty = (difficulty: ForgeRingQteProps['difficulty']) => {
  switch (difficulty) {
    case 'hard':
      return { shrinkMs: 650, goodWindowMs: 180, perfectWindowMs: 90 };
    case 'medium':
      return { shrinkMs: 750, goodWindowMs: 220, perfectWindowMs: 110 };
    case 'easy':
    default:
      return { shrinkMs: 880, goodWindowMs: 260, perfectWindowMs: 130 };
  }
};

export function ForgeRingQte({
  hitsRequired,
  difficulty = 'easy',
  shrinkMs,
  goodWindowMs,
  perfectWindowMs,
  onHit,
  onComplete,
  disabled = false,
  ariaLabel = 'Ring timing quick-time event',
  target,
  renderTarget,
}: ForgeRingQteProps) {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<number>(0);
  const resolvedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const ratingTimeoutRef = useRef<number | null>(null);
  const scoresRef = useRef<number[]>([]);
  const ratingsRef = useRef<ForgeRingQteRating[]>([]);
  const landedRef = useRef(0);

  const [hitIndex, setHitIndex] = useState(0);
  const [rating, setRating] = useState<ForgeRingQteRating | null>(null);
  const [ratingKey, setRatingKey] = useState(0);

  const defaults = useMemo(() => getDefaultsForDifficulty(difficulty), [difficulty]);
  const durationMs = shrinkMs ?? defaults.shrinkMs;
  const goodWindow = goodWindowMs ?? defaults.goodWindowMs;
  const perfectWindow = perfectWindowMs ?? defaults.perfectWindowMs;

  const targetPosition = useMemo(() => target ?? { xPct: 50, yPct: 50 }, [target]);

  const clearTimers = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (ratingTimeoutRef.current) {
      window.clearTimeout(ratingTimeoutRef.current);
      ratingTimeoutRef.current = null;
    }
  };

  const evaluateRating = (elapsedMs: number): ForgeRingQteRating => {
    const midpoint = durationMs / 2;
    const delta = Math.abs(elapsedMs - midpoint);
    if (delta <= perfectWindow / 2) return 'perfect';
    if (delta <= goodWindow / 2) return 'good';
    return 'miss';
  };

  const finalizeHit = useCallback(
    (elapsedMs: number) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      const nextRating = evaluateRating(elapsedMs);
      const score = SCORE_BY_RATING[nextRating];
      scoresRef.current.push(score);
      ratingsRef.current.push(nextRating);
      if (score > 0) {
        landedRef.current += 1;
      }
      onHit?.(nextRating);
      setRating(nextRating);
      setRatingKey((prev) => prev + 1);
      if (ratingTimeoutRef.current) {
        window.clearTimeout(ratingTimeoutRef.current);
      }
      ratingTimeoutRef.current = window.setTimeout(() => {
        setRating(null);
      }, 300);

      if (hitIndex + 1 >= hitsRequired) {
        const totalScore = scoresRef.current.reduce((sum, value) => sum + value, 0);
        const timingScore = hitsRequired > 0 ? clamp01(totalScore / hitsRequired) : 0;
        onComplete({
          hitsLanded: landedRef.current,
          hitsRequired,
          timingScore,
          breakdown: ratingsRef.current,
        });
        return;
      }
      setHitIndex((prev) => prev + 1);
    },
    [hitIndex, hitsRequired, onComplete, onHit, durationMs, goodWindow, perfectWindow],
  );

  const tick = useCallback(() => {
    if (!ringRef.current) return;
    const elapsed = Math.min(durationMs, performance.now() - startRef.current);
    const progress = clamp01(elapsed / durationMs);
    const scale = 1.6 + (0.35 - 1.6) * progress;
    ringRef.current.style.transform = `scale(${scale})`;
    if (progress < 1) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [durationMs]);

  const beginHit = useCallback(() => {
    if (disabled) return;
    resolvedRef.current = false;
    startRef.current = performance.now();
    if (ringRef.current) {
      ringRef.current.style.transform = 'scale(1.6)';
    }
    rafRef.current = requestAnimationFrame(tick);
    timeoutRef.current = window.setTimeout(() => {
      finalizeHit(durationMs);
    }, durationMs);
  }, [disabled, durationMs, finalizeHit, tick]);

  useEffect(() => {
    if (disabled) return;
    beginHit();
    return () => {
      clearTimers();
    };
  }, [beginHit, disabled, hitIndex]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const handleResolve = () => {
    if (disabled || resolvedRef.current) return;
    const elapsed = performance.now() - startRef.current;
    clearTimers();
    finalizeHit(elapsed);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleResolve();
    }
  };

  const containerStyle = target
    ? {
        left: `${targetPosition.xPct}%`,
        top: `${targetPosition.yPct}%`,
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
      }
    : undefined;

  return (
    <div
      className="forgeRingQte"
      style={containerStyle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      onPointerDown={handleResolve}
      onKeyDown={handleKeyDown}
    >
      {renderTarget ? renderTarget(targetPosition) : <div className="forgeRingQte__target" />}
      <div ref={ringRef} className="forgeRingQte__ring" />
      {rating && (
        <div key={ratingKey} className={`forgeRingQte__rating forgeRingQte__rating--${rating}`}>
          {rating}
        </div>
      )}
    </div>
  );
}
