import type { CombatEvent, CombatLogEntry } from '../../../types/index.js';
import type {
  OutskirtsCombatResultTransition,
  OutskirtsSurfaceValueSource,
} from './types.js';

export const OUTSKIRTS_RESULT_VICTORY_DURATION_MS = 700;
export const OUTSKIRTS_RESULT_DEFEAT_DURATION_MS = 2000;

export const EMPTY_OUTSKIRTS_COMBAT_RESULT_TRANSITION: OutskirtsCombatResultTransition = {
  visible: false,
  kind: 'none',
  outcome: 'none',
  tone: 'neutral',
  title: '',
  subtitle: '',
  detailLine: '',
  countdownLabel: '',
  progressPct: 0,
  durationMs: 0,
  resolvedAtMs: null,
  autoRepeatState: 'none',
  source: 'derived',
};

export interface OutskirtsCombatResultTransitionInput {
  active: boolean;
  sameSourceCombat: boolean;
  hasLiveCombat: boolean;
  combatResolved: boolean;
  combatStartTimeMs: number | null;
  nowMs: number;
  enemyName: string;
  enemyIsBoss: boolean;
  autoRepeatEnabled: boolean;
  stopAtBoss: boolean;
  autoRetryOnDeath: boolean;
  combatEvents: CombatEvent[];
  combatLog: CombatLogEntry[];
  source?: OutskirtsSurfaceValueSource;
}

export interface OutskirtsCombatResultClassification {
  outcome: 'victory' | 'defeat';
  resolvedAtMs: number;
  reason:
    | 'player-defeated-event'
    | 'boss-defeated-event'
    | 'victory-log'
    | 'defeat-log';
}

function toEligibleTimestamp(timestamp: number, combatStartTimeMs: number | null): number | null {
  if (!Number.isFinite(timestamp)) return null;
  if (combatStartTimeMs !== null && timestamp < combatStartTimeMs) return null;
  return timestamp;
}

export function classifyOutskirtsCombatResult(
  input: Pick<
    OutskirtsCombatResultTransitionInput,
    'combatStartTimeMs' | 'combatEvents' | 'combatLog'
  >,
): OutskirtsCombatResultClassification | null {
  let latestVictory: OutskirtsCombatResultClassification | null = null;
  let latestDefeat: OutskirtsCombatResultClassification | null = null;

  for (const event of input.combatEvents) {
    const at = toEligibleTimestamp(event.at, input.combatStartTimeMs);
    if (at === null) continue;
    if (event.type === 'BOSS_DEFEATED') {
      if (!latestVictory || at >= latestVictory.resolvedAtMs) {
        latestVictory = { outcome: 'victory', resolvedAtMs: at, reason: 'boss-defeated-event' };
      }
      continue;
    }
    if (event.type === 'PLAYER_DEFEATED') {
      if (!latestDefeat || at >= latestDefeat.resolvedAtMs) {
        latestDefeat = { outcome: 'defeat', resolvedAtMs: at, reason: 'player-defeated-event' };
      }
    }
  }

  for (const line of input.combatLog) {
    const at = toEligibleTimestamp(line.timestamp, input.combatStartTimeMs);
    if (at === null) continue;
    if (line.type === 'victory') {
      if (!latestVictory || at >= latestVictory.resolvedAtMs) {
        latestVictory = { outcome: 'victory', resolvedAtMs: at, reason: 'victory-log' };
      }
      continue;
    }
    if (line.type === 'defeat') {
      if (!latestDefeat || at >= latestDefeat.resolvedAtMs) {
        latestDefeat = { outcome: 'defeat', resolvedAtMs: at, reason: 'defeat-log' };
      }
    }
  }

  if (!latestVictory && !latestDefeat) return null;
  if (!latestVictory) return latestDefeat;
  if (!latestDefeat) return latestVictory;
  if (latestDefeat.resolvedAtMs >= latestVictory.resolvedAtMs) return latestDefeat;
  return latestVictory;
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function formatOutskirtsResultCountdown(prefix: string, remainingMs: number): string {
  const safeMs = Number.isFinite(remainingMs) ? Math.max(0, remainingMs) : 0;
  if (safeMs <= 0) return `${prefix} 0.0s`;
  const seconds = safeMs / 1000;
  const value = seconds < 10 ? seconds.toFixed(1) : `${Math.round(seconds)}`;
  return `${prefix} ${value}s`;
}

export function buildOutskirtsCombatResultTransition(
  input: OutskirtsCombatResultTransitionInput,
): OutskirtsCombatResultTransition {
  if (!input.active || !input.sameSourceCombat || !input.hasLiveCombat || !input.combatResolved) {
    return EMPTY_OUTSKIRTS_COMBAT_RESULT_TRANSITION;
  }

  const classification = classifyOutskirtsCombatResult(input);
  if (!classification) return EMPTY_OUTSKIRTS_COMBAT_RESULT_TRANSITION;

  const source = input.source ?? 'derived';
  const durationMs = classification.outcome === 'defeat'
    ? OUTSKIRTS_RESULT_DEFEAT_DURATION_MS
    : OUTSKIRTS_RESULT_VICTORY_DURATION_MS;
  const elapsedMs = Math.max(0, input.nowMs - classification.resolvedAtMs);
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const progressPct = clampPct((elapsedMs / durationMs) * 100);

  if (classification.outcome === 'defeat') {
    if (input.autoRetryOnDeath) {
      return {
        visible: true,
        kind: 'defeat-retry',
        outcome: 'defeat',
        tone: 'crimson',
        title: 'Defeated',
        subtitle: 'Recovering at the roadside.',
        detailLine: 'Retrying hunt.',
        countdownLabel: formatOutskirtsResultCountdown('Retry in', remainingMs),
        progressPct,
        durationMs,
        resolvedAtMs: classification.resolvedAtMs,
        autoRepeatState: 'retrying',
        source,
      };
    }

    return {
      visible: true,
      kind: 'defeat-stop',
      outcome: 'defeat',
      tone: 'crimson',
      title: 'Defeated',
      subtitle: 'Recovering at the roadside.',
      detailLine: 'Hunt ending. Adjust setup before returning.',
      countdownLabel: 'Hunt ending.',
      progressPct,
      durationMs,
      resolvedAtMs: classification.resolvedAtMs,
      autoRepeatState: 'ending',
      source,
    };
  }

  if (input.enemyIsBoss && input.stopAtBoss) {
    return {
      visible: true,
      kind: 'boss-stop',
      outcome: 'victory',
      tone: 'gold',
      title: 'Boss Defeated',
      subtitle: 'Chain complete.',
      detailLine: 'Stop-at-boss setting ending hunt.',
      countdownLabel: 'Hunt ending.',
      progressPct,
      durationMs,
      resolvedAtMs: classification.resolvedAtMs,
      autoRepeatState: 'ending',
      source,
    };
  }

  if (input.autoRepeatEnabled) {
    return {
      visible: true,
      kind: 'victory-auto-repeat',
      outcome: 'victory',
      tone: 'jade',
      title: 'Victory',
      subtitle: 'Rewards secured.',
      detailLine: 'Next foe approaching.',
      countdownLabel: formatOutskirtsResultCountdown('Auto-repeat in', remainingMs),
      progressPct,
      durationMs,
      resolvedAtMs: classification.resolvedAtMs,
      autoRepeatState: 'continuing',
      source,
    };
  }

  return {
    visible: true,
    kind: 'victory-stop',
    outcome: 'victory',
    tone: 'gold',
    title: 'Victory',
    subtitle: 'Rewards secured.',
    detailLine: 'Auto-repeat is off.',
    countdownLabel: 'Hunt ending.',
    progressPct,
    durationMs,
    resolvedAtMs: classification.resolvedAtMs,
    autoRepeatState: 'ending',
    source,
  };
}
