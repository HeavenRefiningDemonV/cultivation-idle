import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../stores/activityStore';
import { useCombatStore, DEFENSE_CONSTANT_K, ENEMY_ATTACK_COOLDOWN } from '../../../stores/combatStore';
import { useGameStore } from '../../../stores/gameStore';
import { useUIStore } from '../../../stores/uiStore';
import { computeCombatSafety, hpPercent } from '../../../systems/combat/minibarModel';
import { formatNumber, D } from '../../../utils/numbers';
import { CombatCanvas } from '../CombatCanvas';
import { TechniqueStrip } from './TechniqueStrip';
import { FightIntelPanel } from './FightIntelPanel';
import { LootTicker } from './LootTicker';
import { StatusEffectRow } from './StatusEffectRow';
import './CombatTheater.scss';

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

export function CombatTheater({ onClose }: { onClose: () => void }) {
  const activity = useActivityStore((state) => state.active);
  const showFloatingNumbers = useUIStore((state) => state.settings.showCombatFloatingNumbers);
  const setSettings = useUIStore((state) => state.setSettings);

  const {
    currentEnemy,
    enemyHP,
    enemyMaxHP,
    isBoss,
    enemyMechanics,
    activeAura,
    combatShield,
    techniqueLog,
    inCombat,
    playerHP,
    playerMaxHP,
  } = useCombatStore(
    useShallow((state) => ({
      currentEnemy: state.currentEnemy,
      enemyHP: state.enemyHP,
      enemyMaxHP: state.enemyMaxHP,
      isBoss: state.isBoss,
      enemyMechanics: state.enemyMechanics,
      activeAura: state.activeAura,
      combatShield: state.combatShield,
      techniqueLog: state.techniqueLog,
      inCombat: state.inCombat,
      playerHP: state.playerHP,
      playerMaxHP: state.playerMaxHP,
    }))
  );

  const absorptionShield = useGameStore((state) => state.absorptionShield);
  const playerDef = useGameStore((state) => state.stats.def);

  const playerHpPct = hpPercent(playerHP, playerMaxHP);
  const enemyHpPct = hpPercent(enemyHP, enemyMaxHP);
  const activityLabel = formatActivityLabel(activity?.type);
  const safety = useMemo(() => {
    if (currentEnemy && (inCombat || activity)) {
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
    activity,
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

  const safetyLabel = safety.tier === 'safe' ? 'Safe' : safety.tier === 'risky' ? 'Risky' : 'Deadly';

  const handleFloatingToggle = (checked: boolean) => {
    setSettings({ showCombatFloatingNumbers: checked });
  };

  return (
    <div className="combat-theater">
      <div className="combat-theater__header">
        <div>
          <div className="combat-theater__title">Combat Theater</div>
          <div className="combat-theater__enemy-line">
            <span className="combat-theater__enemy-name">{currentEnemy?.name ?? 'No active enemy'}</span>
            {currentEnemy && (
              <>
                <span className="combat-theater__enemy-level">Lv. {currentEnemy.level}</span>
                {(isBoss || currentEnemy.isBoss) && <span className="combat-theater__badge">Boss</span>}
              </>
            )}
          </div>
        </div>
        <button className="button-standard" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="combat-theater__stage">
        <div className="combat-theater__stage-header">
          <div className="combat-theater__stage-title">Battle Stage</div>
          <label className="combat-theater__toggle">
            <input
              type="checkbox"
              checked={showFloatingNumbers}
              onChange={(e) => handleFloatingToggle(e.target.checked)}
            />
            Floating numbers
          </label>
        </div>
        <div className="combat-theater__stage-canvas">
          <CombatCanvas
            inCombat={inCombat}
            playerHP={D(playerHP).toNumber()}
            enemyHP={D(enemyHP).toNumber()}
            showFloatingNumbers={showFloatingNumbers}
          />
        </div>
        <div className="combat-theater__subheader">{activityLabel}</div>
      </div>

      <StatusEffectRow />

      <div className="combat-theater__layout">
        <div className="combat-theater__column">
          <TechniqueStrip />
        </div>
        <div className="combat-theater__column combat-theater__column--secondary">
          <FightIntelPanel />
        </div>
      </div>

      <LootTicker />

      <div className="combat-theater__snapshot">
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
                <span>
                  {formatNumber(enemyHP)} / {formatNumber(enemyMaxHP)} ({enemyHpPct.toFixed(1)}%)
                </span>
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
  );
}
