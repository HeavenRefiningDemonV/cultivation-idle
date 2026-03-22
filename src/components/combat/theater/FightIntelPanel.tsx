import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useCombatStore, DEFENSE_CONSTANT_K, ENEMY_ATTACK_COOLDOWN } from '../../../stores/combatStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { computeCombatSafety } from '../../../systems/combat/minibarModel.js';
import {
  clampNumber,
  computeEffectiveHp,
  computeRollingDps,
  safeDurationSeconds,
} from '../../../systems/combat/theaterModel.js';
import { formatNumber, D } from '../../../utils/numbers.js';

const DPS_WINDOW_MS = 10000;

export function FightIntelPanel() {
  const {
    events,
    enemyHP,
    playerHP,
    playerMaxHP,
    combatShield,
    activeAura,
    enemyMechanics,
    currentEnemy,
    isBoss,
  } = useCombatStore(
    useShallow((state) => ({
      events: state.events,
      enemyHP: state.enemyHP,
      playerHP: state.playerHP,
      playerMaxHP: state.playerMaxHP,
      combatShield: state.combatShield,
      activeAura: state.activeAura,
      enemyMechanics: state.enemyMechanics,
      currentEnemy: state.currentEnemy,
      isBoss: state.isBoss,
    })),
  );

  const absorptionShield = useGameStore((state) => state.absorptionShield);
  const playerDef = useGameStore((state) => state.stats.def);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const rolling = useMemo(() => computeRollingDps(events, now, DPS_WINDOW_MS), [events, now]);

  const enemyHpNum = Math.max(0, D(enemyHP).toNumber());
  const effectiveHp = computeEffectiveHp(playerHP, absorptionShield, combatShield?.amount ?? 0);
  const enemyDps = rolling.enemyDps + (activeAura?.damagePerSec ?? 0);

  const avgPlayerHit = rolling.avgPlayerHit;
  const playerDps = rolling.playerDps;
  const ttk = playerDps > 0 ? clampNumber(enemyHpNum / playerDps, 0, Number.POSITIVE_INFINITY) : null;
  const timeToDie = enemyDps > 0 ? clampNumber(effectiveHp / enemyDps, 0, Number.POSITIVE_INFINITY) : null;
  const hitsToKill = avgPlayerHit > 0 ? clampNumber(enemyHpNum / avgPlayerHit, 0, Number.POSITIVE_INFINITY) : null;

  const safety = useMemo(() => {
    if (currentEnemy) {
      return computeCombatSafety({
        playerHp: playerHP,
        playerMaxHp: playerMaxHP,
        playerDef,
        absorptionShield,
        combatShieldAmount: combatShield?.amount ?? 0,
        enemyAtk: currentEnemy.atk,
        enemyCritChance: currentEnemy.crit ?? 0,
        enemyCritDmgPct: currentEnemy.critDmg ?? 100,
        enemyIsBoss: isBoss || currentEnemy.isBoss || false,
        enemyAuraDps: activeAura?.damagePerSec ?? 0,
        enemyHasEnrageMechanic: enemyMechanics?.some((m) => m.type === 'enrage') ?? false,
        enemyEnrageMultiplier: undefined,
        defenseConstantK: DEFENSE_CONSTANT_K,
        enemyAttackCooldownMs: ENEMY_ATTACK_COOLDOWN,
      });
    }

    return { tier: 'safe' as const, reasons: ['No active enemy (between fights).'] };
  }, [
    absorptionShield,
    activeAura?.damagePerSec,
    combatShield?.amount,
    currentEnemy,
    enemyMechanics,
    isBoss,
    playerHP,
    playerMaxHP,
    playerDef,
  ]);

  const safetyReasons = safety.reasons.slice(0, 3);

  return (
    <details className="combat-theater__intel" data-open-label="Fight Intel">
      <summary>Fight Intel (Details)</summary>
      <div className="combat-theater__intel-grid">
        <div className="combat-theater__intel-block">
          <div className="combat-theater__intel-title">Damage (last {DPS_WINDOW_MS / 1000}s)</div>
          <div className="combat-theater__intel-row">
            <span>Player DPS</span>
            <span>{formatNumber(playerDps)}</span>
          </div>
          <div className="combat-theater__intel-row">
            <span>Enemy DPS</span>
            <span>{formatNumber(enemyDps)}</span>
          </div>
          <div className="combat-theater__intel-row">
            <span>Avg player hit</span>
            <span>{formatNumber(avgPlayerHit)}</span>
          </div>
          <div className="combat-theater__intel-row">
            <span>Avg enemy hit</span>
            <span>{formatNumber(rolling.avgEnemyHit)}</span>
          </div>
        </div>

        <div className="combat-theater__intel-block">
          <div className="combat-theater__intel-title">Estimates</div>
          <div className="combat-theater__intel-row">
            <span>TTK (est.)</span>
            <span>{ttk != null && Number.isFinite(ttk) ? safeDurationSeconds(ttk * 1000) : '—'}</span>
          </div>
          <div className="combat-theater__intel-row">
            <span>Time to die</span>
            <span>
              {timeToDie != null && Number.isFinite(timeToDie)
                ? safeDurationSeconds(timeToDie * 1000)
                : '—'}
            </span>
          </div>
          <div className="combat-theater__intel-row">
            <span>Hits to kill</span>
            <span>{hitsToKill != null && Number.isFinite(hitsToKill) ? hitsToKill.toFixed(1) : '—'}</span>
          </div>
          <div className="combat-theater__intel-row">
            <span>Effective HP</span>
            <span>{formatNumber(effectiveHp)}</span>
          </div>
        </div>

        <div className="combat-theater__intel-block">
          <div className="combat-theater__intel-title">Safety</div>
          <div className={`combat-theater__safety-pill combat-theater__safety-pill--${safety.tier}`}>
            {safety.tier === 'safe' ? 'Safe' : safety.tier === 'risky' ? 'Risky' : 'Deadly'}
          </div>
          <ul className="combat-theater__intel-reasons">
            {safetyReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
