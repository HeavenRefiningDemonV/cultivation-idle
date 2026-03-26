import type { EnemyMechanic } from '../../types/index.js';

export interface TrialMechanicRuntimeSnapshot {
  incomingDamageMult: number;
  outgoingDamageMult: number;
}

export function getTrialMechanicRuntimeSnapshot(
  mechanics: EnemyMechanic[] | undefined,
  combatTimeSec: number,
): TrialMechanicRuntimeSnapshot {
  const normalized = Array.isArray(mechanics) ? mechanics : [];

  let incomingDamageMult = 1;
  let outgoingDamageMult = 1;

  for (const mechanic of normalized) {
    if (mechanic.type === 'damageReduction') {
      const pct = typeof mechanic.effect?.pct === 'number' ? mechanic.effect.pct : 0;
      incomingDamageMult *= Math.max(0, 1 - pct);
    }

    if (mechanic.type === 'burstWindow') {
      const everySec = typeof mechanic.trigger?.everySec === 'number' ? mechanic.trigger.everySec : 0;
      const durationSec = typeof mechanic.trigger?.durationSec === 'number' ? mechanic.trigger.durationSec : 0;
      const amp = typeof mechanic.effect?.takesMoreDamagePct === 'number' ? mechanic.effect.takesMoreDamagePct : 0;
      if (everySec > 0 && durationSec > 0 && combatTimeSec % everySec <= durationSec) {
        incomingDamageMult *= 1 + amp;
      }
    }

    if (mechanic.type === 'shatterWindow') {
      const everySec = typeof mechanic.trigger?.everySec === 'number' ? mechanic.trigger.everySec : 0;
      const durationSec = typeof mechanic.trigger?.durationSec === 'number' ? mechanic.trigger.durationSec : 0;
      const amp = typeof mechanic.effect?.defReducedPct === 'number' ? mechanic.effect.defReducedPct : 0;
      if (everySec > 0 && durationSec > 0 && combatTimeSec % everySec <= durationSec) {
        incomingDamageMult *= 1 + amp;
      }
    }

    if (mechanic.type === 'ultimate') {
      const intervalSec = typeof mechanic.trigger?.intervalSec === 'number' ? mechanic.trigger.intervalSec : 0;
      const warnSec = typeof mechanic.trigger?.warnSec === 'number' ? mechanic.trigger.warnSec : 0;
      const damageMult = typeof mechanic.effect?.damageMult === 'number' ? mechanic.effect.damageMult : 1;
      if (intervalSec > 0 && combatTimeSec % intervalSec >= Math.max(0, intervalSec - warnSec)) {
        outgoingDamageMult = Math.max(outgoingDamageMult, damageMult);
      }
    }
  }

  return {
    incomingDamageMult,
    outgoingDamageMult,
  };
}
