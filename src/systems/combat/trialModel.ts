import type { CombatEvent, EnemyMechanic, TrialAttemptSummary } from '../../types/index.js';
import { D } from '../../utils/numbers.js';
import { hpPercent } from './minibarModel.js';
import { clampNumber, computeEffectiveHp, computeRollingDps } from './theaterModel.js';

interface BuildSummaryInput {
  trialId: string;
  events: CombatEvent[];
  startedAt?: number | null;
  endedAt: number;
  enemyHp: string;
  enemyMaxHp: string;
  playerMaxHp: string;
  absorptionShield: string;
  combatShieldAmount: number;
  enemyMechanics?: EnemyMechanic[];
}

function pickMaxHit(events: CombatEvent[]) {
  let max: { amount: number; label: string } | null = null;

  events.forEach((event) => {
    if (event.type !== 'HIT' || event.source !== 'enemy') return;
    const amount = D(event.amount).toNumber();
    if (!Number.isFinite(amount)) return;

    if (!max || amount > max.amount) {
      let label = 'Boss hit';
      if (event.kind === 'boss_ultimate') label = 'Boss ultimate';
      else if (event.kind === 'aura') label = 'Aura tick';
      else if (event.kind === 'technique' && event.techniqueId) label = `Skill ${event.techniqueId}`;
      if (event.isCrit) label = `${label} (crit)`;
      max = { amount, label };
    }
  });

  return max ?? { amount: 0, label: 'Hit' };
}

export function buildTrialDefeatSummary(input: BuildSummaryInput): TrialAttemptSummary {
  const {
    trialId,
    events,
    startedAt,
    endedAt,
    enemyHp,
    enemyMaxHp,
    playerMaxHp,
    absorptionShield,
    combatShieldAmount,
    enemyMechanics,
  } = input;

  const attemptStart = startedAt ?? endedAt;
  const windowMs = Math.max(endedAt - attemptStart, 1000);
  const windowEvents = events.filter((event) => event.at >= attemptStart);
  const dpsMetrics = computeRollingDps(windowEvents, endedAt, windowMs);
  const effectiveHp = computeEffectiveHp(playerMaxHp, absorptionShield, combatShieldAmount);
  const maxHit = pickMaxHit(windowEvents);

  const bossHpPct = hpPercent(enemyHp, enemyMaxHp);
  const durationSec = clampNumber((endedAt - attemptStart) / 1000, 0, Number.POSITIVE_INFINITY);
  const timeToDieSec = dpsMetrics.enemyDps > 0 ? effectiveHp / dpsMetrics.enemyDps : Number.POSITIVE_INFINITY;
  const spikeRatio = effectiveHp > 0 ? maxHit.amount / effectiveHp : 0;

  const suggestions: string[] = [];

  if (spikeRatio >= 0.6) {
    suggestions.push('Reduce spike damage (more HP/defense/shields).');
  }

  if (Number.isFinite(timeToDieSec) && timeToDieSec <= 6) {
    suggestions.push('Need more sustain (regen/shields) to survive longer.');
  }

  if (bossHpPct >= 40 && durationSec >= 10) {
    suggestions.push('Need more DPS or burst to push boss phases.');
  }

  if (enemyMechanics?.some((m) => m.type === 'aura')) {
    suggestions.push('Boss aura pressure noted: bring sustain or mitigation.');
  }

  if (enemyMechanics?.some((m) => m.type === 'shield')) {
    suggestions.push('Break shield phases faster with burst damage.');
  }

  const requiredEhpFor10s = dpsMetrics.enemyDps * 10;
  if (requiredEhpFor10s > 0 && effectiveHp > 0) {
    const pctMore = (requiredEhpFor10s / effectiveHp - 1) * 100;
    if (pctMore > 0 && Number.isFinite(pctMore)) {
      suggestions.push(`Need about +${pctMore.toFixed(0)}% survivability (HP/shields).`);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Review build for more burst and survival tools.');
  }

  return {
    trialId,
    startedAt: attemptStart,
    endedAt,
    durationSec,
    bossHpPct,
    maxHit: maxHit.amount,
    maxHitLabel: maxHit.label,
    suggestions: suggestions.slice(0, 4),
  };
}
