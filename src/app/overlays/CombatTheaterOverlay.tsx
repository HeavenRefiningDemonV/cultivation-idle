import { useEffect, useMemo } from 'react';
import { useActivityStore } from '../../stores/activityStore';
import { useCombatStore, DEFENSE_CONSTANT_K, ENEMY_ATTACK_COOLDOWN } from '../../stores/combatStore';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { computeCombatSafety, hpPercent } from '../../systems/combat/minibarModel';
import { formatNumber } from '../../utils/numbers';
import './CombatTheaterOverlay.css';

function formatActivityLabel(type: string | null | undefined): string {
  switch (type) {
    case 'outskirts':
      return 'Outskirts';
    case 'trial':
      return 'Trial';
    case 'ruins':
      return 'Ruins';
    default:
      return 'Combat';
  }
}

export function CombatTheaterOverlay() {
  const activity = useActivityStore((state) => state.active);
  const showCombatMinibar = useUIStore((state) => state.settings.showCombatMinibar);
  const combatTheaterOpen = useUIStore((state) => state.combatTheaterOpen);
  const closeCombatTheater = useUIStore((state) => state.closeCombatTheater);
  const currentEnemy = useCombatStore((state) => state.currentEnemy);
  const playerHP = useCombatStore((state) => state.playerHP);
  const playerMaxHP = useCombatStore((state) => state.playerMaxHP);
  const enemyHP = useCombatStore((state) => state.enemyHP);
  const enemyMaxHP = useCombatStore((state) => state.enemyMaxHP);
  const isBoss = useCombatStore((state) => state.isBoss);
  const enemyMechanics = useCombatStore((state) => state.enemyMechanics);
  const activeAura = useCombatStore((state) => state.activeAura);
  const combatShield = useCombatStore((state) => state.combatShield);
  const techniqueLog = useCombatStore((state) => state.techniqueLog);
  const inCombat = useCombatStore((state) => state.inCombat);
  const absorptionShield = useGameStore((state) => state.absorptionShield);
  const playerDef = useGameStore((state) => state.stats.def);

  useEffect(() => {
    if (!showCombatMinibar && combatTheaterOpen) {
      closeCombatTheater();
    }
  }, [showCombatMinibar, combatTheaterOpen, closeCombatTheater]);

  const playerHpPct = hpPercent(playerHP, playerMaxHP);
  const enemyHpPct = hpPercent(enemyHP, enemyMaxHP);
  const activityLabel = formatActivityLabel(activity?.type);

  const safety = useMemo(() => {
    if (currentEnemy && inCombat) {
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

    return {
      tier: 'safe' as const,
      reasons: ['No active enemy (between fights).'],
    };
  }, [
    absorptionShield,
    activeAura?.damagePerSec,
    combatShield?.amount,
    currentEnemy,
    enemyMechanics,
    inCombat,
    isBoss,
    playerHP,
    playerMaxHP,
    playerDef,
  ]);

  const latestTechniqueEntries = useMemo(() => {
    return [...techniqueLog]
      .slice(-6)
      .reverse()
      .map((entry, idx) => (
        <li key={`${entry.at}-${idx}`} className="combat-theater__event">
          <span className="combat-theater__event-time">{new Date(entry.at).toLocaleTimeString([], { hour12: false })}</span>
          <span className="combat-theater__event-text">{entry.message}</span>
        </li>
      ));
  }, [techniqueLog]);

  if (!showCombatMinibar || !combatTheaterOpen) {
    return null;
  }

  const safetyLabel = safety.tier === 'safe' ? 'Safe' : safety.tier === 'risky' ? 'Risky' : 'Deadly';

  return (
    <div className="combat-theater-overlay">
      <div className="combat-theater">
        <div className="combat-theater__header">
          <div className="combat-theater__title">Combat Theater</div>
          <button className="button-standard" onClick={closeCombatTheater}>
            Close
          </button>
        </div>
        <div className="combat-theater__subheader">{activityLabel}</div>

        <div className="combat-theater__snapshot">
          <div className="combat-theater__enemy-row">
            <div>
              <div className="combat-theater__enemy-name">{currentEnemy?.name ?? 'No active enemy'}</div>
              {currentEnemy && (
                <div className="combat-theater__enemy-meta">
                  <span>Lv. {currentEnemy.level}</span>
                  {(isBoss || currentEnemy.isBoss) && <span className="combat-theater__badge">Boss</span>}
                </div>
              )}
            </div>
          </div>

          <div className="combat-theater__bar">
            <div className="combat-theater__bar-label">Player HP</div>
            <div className="combat-theater__bar-track">
              <div className="combat-theater__bar-fill combat-theater__bar-fill--player" style={{ width: `${playerHpPct}%` }} />
              <div className="combat-theater__bar-text">
                {formatNumber(playerHP)} / {formatNumber(playerMaxHP)} ({playerHpPct.toFixed(1)}%)
              </div>
            </div>
          </div>

          <div className="combat-theater__bar">
            <div className="combat-theater__bar-label">Enemy HP</div>
            <div className="combat-theater__bar-track">
              <div className="combat-theater__bar-fill combat-theater__bar-fill--enemy" style={{ width: `${enemyHpPct}%` }} />
              <div className="combat-theater__bar-text">
                {currentEnemy ? (
                  <>
                    <span className="combat-theater__enemy-hp">
                      {formatNumber(enemyHP)} / {formatNumber(enemyMaxHP)} ({enemyHpPct.toFixed(1)}%)
                    </span>
                  </>
                ) : (
                  <span>Waiting for next fight…</span>
                )}
              </div>
            </div>
          </div>

          <div className={`combat-theater__safety combat-theater__safety--${safety.tier}`}>
            <div className="combat-theater__safety-label">{safetyLabel}</div>
            <ul className="combat-theater__safety-reasons">
              {safety.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="combat-theater__events">
          <div className="combat-theater__events-title">Recent techniques</div>
          {latestTechniqueEntries.length > 0 ? (
            <ul className="combat-theater__events-list">{latestTechniqueEntries}</ul>
          ) : (
            <div className="combat-theater__events-empty">No technique activations yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

