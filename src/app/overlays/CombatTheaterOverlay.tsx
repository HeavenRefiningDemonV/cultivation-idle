import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
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
  const combat = useCombatStore(
    useShallow((state) => ({
      currentEnemy: state.currentEnemy,
      playerHP: state.playerHP,
      playerMaxHP: state.playerMaxHP,
      enemyHP: state.enemyHP,
      enemyMaxHP: state.enemyMaxHP,
      isBoss: state.isBoss,
      enemyMechanics: state.enemyMechanics,
      activeAura: state.activeAura,
      combatShield: state.combatShield,
      techniqueLog: state.techniqueLog,
      inCombat: state.inCombat,
    }))
  );
  const absorptionShield = useGameStore((state) => state.absorptionShield);
  const playerDef = useGameStore((state) => state.stats.def);

  useEffect(() => {
    if (!showCombatMinibar && combatTheaterOpen) {
      closeCombatTheater();
    }
  }, [showCombatMinibar, combatTheaterOpen, closeCombatTheater]);

  const playerHpPct = hpPercent(combat.playerHP, combat.playerMaxHP);
  const enemyHpPct = hpPercent(combat.enemyHP, combat.enemyMaxHP);
  const activityLabel = formatActivityLabel(activity?.type);

  const safety = useMemo(() => {
    if (combat.currentEnemy && combat.inCombat) {
      return computeCombatSafety({
        playerHp: combat.playerHP,
        playerMaxHp: combat.playerMaxHP,
        playerDef,
        absorptionShield,
        combatShieldAmount: combat.combatShield?.amount ?? 0,
        enemyAtk: combat.currentEnemy.atk,
        enemyCritChance: combat.currentEnemy.crit ?? 0,
        enemyCritDmgPct: combat.currentEnemy.critDmg ?? 100,
        enemyIsBoss: combat.isBoss || combat.currentEnemy.isBoss || false,
        enemyAuraDps: combat.activeAura?.damagePerSec ?? 0,
        enemyHasEnrageMechanic: combat.enemyMechanics?.some((m) => m.type === 'enrage') ?? false,
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
    combat.activeAura?.damagePerSec,
    combat.combatShield?.amount,
    combat.currentEnemy,
    combat.enemyMechanics,
    combat.inCombat,
    combat.isBoss,
    combat.playerHP,
    combat.playerMaxHP,
    playerDef,
  ]);

  const latestTechniqueEntries = useMemo(() => {
    return [...combat.techniqueLog]
      .slice(-6)
      .reverse()
      .map((entry, idx) => (
        <li key={`${entry.at}-${idx}`} className="combat-theater__event">
          <span className="combat-theater__event-time">{new Date(entry.at).toLocaleTimeString([], { hour12: false })}</span>
          <span className="combat-theater__event-text">{entry.message}</span>
        </li>
      ));
  }, [combat.techniqueLog]);

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
              <div className="combat-theater__enemy-name">{combat.currentEnemy?.name ?? 'No active enemy'}</div>
              {combat.currentEnemy && (
                <div className="combat-theater__enemy-meta">
                  <span>Lv. {combat.currentEnemy.level}</span>
                  {(combat.isBoss || combat.currentEnemy.isBoss) && <span className="combat-theater__badge">Boss</span>}
                </div>
              )}
            </div>
          </div>

          <div className="combat-theater__bar">
            <div className="combat-theater__bar-label">Player HP</div>
            <div className="combat-theater__bar-track">
              <div className="combat-theater__bar-fill combat-theater__bar-fill--player" style={{ width: `${playerHpPct}%` }} />
              <div className="combat-theater__bar-text">
                {formatNumber(combat.playerHP)} / {formatNumber(combat.playerMaxHP)} ({playerHpPct.toFixed(1)}%)
              </div>
            </div>
          </div>

          <div className="combat-theater__bar">
            <div className="combat-theater__bar-label">Enemy HP</div>
            <div className="combat-theater__bar-track">
              <div className="combat-theater__bar-fill combat-theater__bar-fill--enemy" style={{ width: `${enemyHpPct}%` }} />
              <div className="combat-theater__bar-text">
                {combat.currentEnemy ? (
                  <>
                    <span className="combat-theater__enemy-hp">
                      {formatNumber(combat.enemyHP)} / {formatNumber(combat.enemyMaxHP)} ({enemyHpPct.toFixed(1)}%)
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

