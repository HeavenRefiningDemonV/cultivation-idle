import { useGameStore } from '../../../stores/gameStore.js';
import type { StatusObservatoryMotionHints } from './statusObservatoryTypes.js';

/**
 * M.I.3 (S0) — assemble the Observatory's read-only motion telemetry from the LIVE game store, at the
 * store/seam boundary (NOT pure — reads the store), mirroring the M.I.1 observatoryConstellationInput
 * seam so the surface builder stays the contract-locked PURE adapter (statusObservatorySurface must not
 * import stores or call .getState). Display-only; NEVER feeds gameplay.
 *
 * qiPerSecond is the RAW gain rate (the motion model log10s it for the qi-flow scalar). cultivationRate
 * is a deterministic, normalized 0..1 hint — log10(qi/s) over QI_RATE_LOG_SPAN — feeding the tick-ring
 * spin (spin = 90 - rate*60). Reads the raw Decimal-string qiPerSecond (full precision), NOT the ledger's
 * abbreviated `formatSafeNumber` display string.
 */
const QI_RATE_LOG_SPAN = 6; // [tune] → D15 — qi/s decades that saturate the spin hint (≈1e6 qi/s ⇒ 1)

export function toObservatoryMotionHints(): StatusObservatoryMotionHints {
  const raw = Number(useGameStore.getState().qiPerSecond);
  const qiPerSecond = Number.isFinite(raw) ? raw : null;
  const cultivationRate =
    qiPerSecond == null
      ? null
      : Math.min(1, Math.max(0, Math.log10(1 + Math.max(0, qiPerSecond)) / QI_RATE_LOG_SPAN));
  return { qiPerSecond, cultivationRate };
}
