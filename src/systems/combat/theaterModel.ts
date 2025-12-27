import { CombatEvent } from '../../types';
import { D } from '../../utils/numbers';

export interface RollingDpsMetrics {
  windowMs: number;
  playerDamage: number;
  enemyDamage: number;
  playerHits: number;
  enemyHits: number;
  playerDps: number;
  enemyDps: number;
  avgPlayerHit: number;
  avgEnemyHit: number;
  lastEventAt: number | null;
}

export function computeRollingDps(
  events: CombatEvent[],
  now: number,
  windowMs: number = 10000,
): RollingDpsMetrics {
  const windowStart = now - windowMs;
  let playerDamage = D(0);
  let enemyDamage = D(0);
  let playerHits = 0;
  let enemyHits = 0;
  let lastEventAt: number | null = null;

  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.at < windowStart) {
      break;
    }

    if (event.type === 'HIT') {
      const amount = D(event.amount);
      if (event.source === 'player') {
        playerDamage = playerDamage.plus(amount);
        playerHits += 1;
      } else if (event.source === 'enemy') {
        enemyDamage = enemyDamage.plus(amount);
        enemyHits += 1;
      }
      lastEventAt = lastEventAt ?? event.at;
    }
  }

  const windowSec = windowMs / 1000;
  const playerDamageNum = playerDamage.toNumber();
  const enemyDamageNum = enemyDamage.toNumber();

  return {
    windowMs,
    playerDamage: playerDamageNum,
    enemyDamage: enemyDamageNum,
    playerHits,
    enemyHits,
    playerDps: windowSec > 0 ? playerDamageNum / windowSec : 0,
    enemyDps: windowSec > 0 ? enemyDamageNum / windowSec : 0,
    avgPlayerHit: playerHits > 0 ? playerDamageNum / playerHits : 0,
    avgEnemyHit: enemyHits > 0 ? enemyDamageNum / enemyHits : 0,
    lastEventAt,
  };
}

export function computeEffectiveHp(
  playerHp: string,
  absorptionShield: string,
  combatShieldAmount: number,
): number {
  const hp = D(playerHp);
  const absorption = D(absorptionShield);
  const combatShield = D(combatShieldAmount);
  return hp.plus(absorption).plus(combatShield).toNumber();
}

export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function safeDurationSeconds(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '0.0s';
  return `${(ms / 1000).toFixed(1)}s`;
}

export function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  const ratio = numerator / denominator;
  if (!Number.isFinite(ratio)) return 0;
  return ratio;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}
