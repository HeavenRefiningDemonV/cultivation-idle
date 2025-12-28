import { useEffect, useMemo, useState } from 'react';
import { COMBAT_ACTIVITY_TYPES } from '../../types/activity';
import { useActivityStore } from '../../stores/activityStore';
import type { ActiveActivity } from '../../stores/activityStore';
import { DEFENSE_CONSTANT_K, ENEMY_ATTACK_COOLDOWN, PLAYER_ATTACK_COOLDOWN, useCombatStore } from '../../stores/combatStore';
import { useGameStore } from '../../stores/gameStore';
import { useRuinsStore } from '../../stores/ruinsStore';
import { useUIStore } from '../../stores/uiStore';
import { computeCombatSafety, formatSeconds, getCooldownProgress, getNextActionTimerMs, hpPercent } from '../../systems/combat/minibarModel';
import { formatNumber } from '../../utils/numbers';
import './CombatMinibar.scss';

type AiProfileSetting = 'balanced' | 'survivor' | 'burst' | 'farmer';

const AI_PROFILE_COPY: Record<string, string> = {
  balanced: 'Even mix of offense/defense.',
  survivor: 'Prioritize shields/heals when threatened.',
  burst: 'Favor burst damage, especially on bosses.',
  farmer: 'Favor faster clears and AoE, accepts more risk.',
};

type LogEntry =
  | { kind: 'combat'; text: string; timestamp: number }
  | { kind: 'technique'; text: string; timestamp: number };

function truncateText(text: string, limit = 52): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}

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

function SafetyBadge({
  tier,
  reasons,
}: {
  tier: 'safe' | 'risky' | 'deadly';
  reasons: string[];
}) {
  const [open, setOpen] = useState(false);
  const label = tier === 'safe' ? 'Safe' : tier === 'risky' ? 'Risky' : 'Deadly';

  const toggleOpen = () => setOpen((prev) => !prev);
  const handleMouseEnter = () => setOpen(true);
  const handleMouseLeave = () => setOpen(false);

  return (
    <div
      className={`combat-minibar__safety combat-minibar__safety--${tier}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={toggleOpen}
    >
      <span className="combat-minibar__safety-label">{label}</span>
      <span className="combat-minibar__safety-indicator" aria-hidden="true">
        ⚡
      </span>
      {open && (
        <div className="combat-minibar__safety-tooltip">
          <div className="combat-minibar__safety-tooltip-title">Safety factors</div>
          <ul>
            {reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LastEventChip({ text }: { text: string }) {
  return <div className="combat-minibar__chip">{text || '—'}</div>;
}

function CombatMinibarContent({
  activity,
  combatActivityActive,
}: {
  activity: ActiveActivity | null;
  combatActivityActive: boolean;
}) {
  const inCombat = useCombatStore((state) => state.inCombat);
  const currentEnemy = useCombatStore((state) => state.currentEnemy);
  const playerHP = useCombatStore((state) => state.playerHP);
  const playerMaxHP = useCombatStore((state) => state.playerMaxHP);
  const enemyHP = useCombatStore((state) => state.enemyHP);
  const enemyMaxHP = useCombatStore((state) => state.enemyMaxHP);
  const lastAttackTime = useCombatStore((state) => state.lastAttackTime);
  const lastEnemyAttackTime = useCombatStore((state) => state.lastEnemyAttackTime);
  const isBoss = useCombatStore((state) => state.isBoss);
  const combatLog = useCombatStore((state) => state.combatLog);
  const techniqueLog = useCombatStore((state) => state.techniqueLog);
  const combatShield = useCombatStore((state) => state.combatShield);
  const enemyMechanics = useCombatStore((state) => state.enemyMechanics);
  const activeAura = useCombatStore((state) => state.activeAura);
  const absorptionShield = useGameStore((state) => state.absorptionShield);
  const playerDef = useGameStore((state) => state.stats.def);
  const combatMinibarExpanded = useUIStore((state) => state.settings.combatMinibarExpanded);
  const aiProfile = useUIStore((state) => state.settings.combatAIProfile);
  const combatTheaterOpen = useUIStore((state) => state.combatTheaterOpen);
  const toggleCombatTheater = useUIStore((state) => state.toggleCombatTheater);
  const closeCombatTheater = useUIStore((state) => state.closeCombatTheater);
  const toggleCombatMinibarExpanded = useUIStore((state) => state.toggleCombatMinibarExpanded);
  const setSettings = useUIStore((state) => state.setSettings);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(handle);
  }, []);

  const playerHpPct = hpPercent(playerHP, playerMaxHP);
  const enemyHpPct = hpPercent(enemyHP, enemyMaxHP);

  const playerRemainMs = getNextActionTimerMs(now, lastAttackTime, PLAYER_ATTACK_COOLDOWN);
  const enemyRemainMs = getNextActionTimerMs(now, lastEnemyAttackTime, ENEMY_ATTACK_COOLDOWN);
  const playerProgress = getCooldownProgress(now, lastAttackTime, PLAYER_ATTACK_COOLDOWN);
  const enemyProgress = getCooldownProgress(now, lastEnemyAttackTime, ENEMY_ATTACK_COOLDOWN);

  const handleProfileChange = (value: AiProfileSetting) => {
    setSettings({ combatAIProfile: value });
  };

  const lastLogEntry: LogEntry | null = useMemo(() => {
    const combatEntry = combatLog[combatLog.length - 1];
    const techEntry = techniqueLog[techniqueLog.length - 1];
    const combatIsLong = combatEntry ? combatEntry.text.length > 60 : false;

    const combatLogEntry: LogEntry | null = combatEntry
      ? { kind: 'combat', text: combatEntry.text, timestamp: combatEntry.timestamp }
      : null;
    const techLog: LogEntry | null = techEntry
      ? { kind: 'technique', text: techEntry.message, timestamp: techEntry.at }
      : null;

    if (techLog && (!combatLogEntry || techLog.timestamp >= combatLogEntry.timestamp || combatIsLong)) {
      return techLog;
    }
    return combatLogEntry;
  }, [combatLog, techniqueLog]);

  const activityLabel = formatActivityLabel(activity?.type);

  const safety = useMemo(() => {
    if (currentEnemy && (inCombat || combatActivityActive)) {
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
    combatActivityActive,
    combatShield?.amount,
    currentEnemy,
    enemyMechanics,
    inCombat,
    isBoss,
    playerHP,
    playerMaxHP,
    playerDef,
  ]);

  const stopActivity = () => {
    const confirmed = window.confirm('Stop combat activity? This will end your current run/fight loop.');
    if (!confirmed) return;

    if (activity?.type === 'ruins') {
      useRuinsStore.getState().stopRun();
    } else {
      useActivityStore.getState().stopActivity('combat-minibar-stop');
      useCombatStore.getState().exitCombat();
    }

    closeCombatTheater();
  };

  const expandedContent = (
    <div className="combat-minibar__content">
      <div className="combat-minibar__header">
        <div className="combat-minibar__activity">{activityLabel}</div>
        <div className="combat-minibar__header-actions">
          <div className="combat-minibar__ai-control">
            <label className="combat-minibar__ai-label" title={AI_PROFILE_COPY[aiProfile] ?? ''}>
              AI profile
            </label>
            <select
              className="combat-minibar__ai-select"
              value={aiProfile}
              onChange={(e) => handleProfileChange(e.target.value as AiProfileSetting)}
            >
              <option value="balanced">Balanced</option>
              <option value="survivor">Survivor</option>
              <option value="burst">Burst</option>
              <option value="farmer">Farmer</option>
            </select>
          </div>
          <SafetyBadge tier={safety.tier} reasons={safety.reasons} />
          <button className="button-standard" onClick={toggleCombatTheater}>
            {combatTheaterOpen ? 'Close Theater' : 'Open Theater'}
          </button>
          <button className="button-standard button-standard--danger" onClick={stopActivity}>
            Stop
          </button>
        </div>
      </div>

      <div className="combat-minibar__bars">
        <div className="combat-minibar__bar-row">
          <div className="combat-minibar__bar-label">Player HP</div>
          <div className="combat-minibar__bar-track">
            <div className="combat-minibar__bar-fill combat-minibar__bar-fill--player" style={{ width: `${playerHpPct}%` }} />
            <div className="combat-minibar__bar-text">
              {formatNumber(playerHP)} / {formatNumber(playerMaxHP)} ({playerHpPct.toFixed(1)}%)
            </div>
          </div>
        </div>
        <div className="combat-minibar__bar-row">
          <div className="combat-minibar__bar-label">Enemy HP</div>
          <div className="combat-minibar__bar-track">
            <div className="combat-minibar__bar-fill combat-minibar__bar-fill--enemy" style={{ width: `${enemyHpPct}%` }} />
            <div className="combat-minibar__bar-text">
              {currentEnemy ? (
                <>
                  <span className="combat-minibar__enemy-name">{currentEnemy.name}</span>
                  <span className="combat-minibar__enemy-level">Lv. {currentEnemy.level}</span>
                  {(isBoss || currentEnemy.isBoss) && <span className="combat-minibar__enemy-boss">Boss</span>}
                  <span className="combat-minibar__enemy-hp">
                    {formatNumber(enemyHP)} / {formatNumber(enemyMaxHP)} ({enemyHpPct.toFixed(1)}%)
                  </span>
                </>
              ) : (
                <span>Waiting for next fight…</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="combat-minibar__timers">
        <div className="combat-minibar__timer">
          <div className="combat-minibar__timer-label">Player action</div>
          <div className="combat-minibar__timer-progress">
            <div className="combat-minibar__timer-fill" style={{ width: `${playerProgress * 100}%` }} />
          </div>
          <div className="combat-minibar__timer-text">
            {playerRemainMs <= 0 ? 'Ready' : `in ${formatSeconds(playerRemainMs)}`}
          </div>
        </div>
        <div className="combat-minibar__timer">
          <div className="combat-minibar__timer-label">Enemy action</div>
          <div className="combat-minibar__timer-progress">
            <div className="combat-minibar__timer-fill combat-minibar__timer-fill--enemy" style={{ width: `${enemyProgress * 100}%` }} />
          </div>
          <div className="combat-minibar__timer-text">
            {enemyRemainMs <= 0 ? 'Ready' : `in ${formatSeconds(enemyRemainMs)}`}
          </div>
        </div>
      </div>

      <div className="combat-minibar__footer">
        <div className="combat-minibar__last-event">
          <span className="combat-minibar__last-event-label">Last event</span>
          <LastEventChip text={truncateText(lastLogEntry?.text ?? '')} />
        </div>
      </div>
    </div>
  );

  if (!combatMinibarExpanded) {
    return (
      <div className="combat-minibar combat-minibar--collapsed" onClick={toggleCombatMinibarExpanded}>
        <div className="combat-minibar__collapsed-label">{activityLabel}</div>
        <div className="combat-minibar__collapsed-hp">HP {playerHpPct.toFixed(0)}%</div>
        <SafetyBadge tier={safety.tier} reasons={safety.reasons} />
        <div className="combat-minibar__collapsed-hint">Tap to expand</div>
      </div>
    );
  }

  return <div className="combat-minibar">{expandedContent}</div>;
}

export function CombatMinibar() {
  const activity = useActivityStore((state) => state.active);
  const showCombatMinibar = useUIStore((state) => state.settings.showCombatMinibar);
  const inCombat = useCombatStore((state) => state.inCombat);

  const combatActivityActive = activity ? COMBAT_ACTIVITY_TYPES.includes(activity.type) : false;
  const shouldShow = showCombatMinibar && (combatActivityActive || inCombat);

  if (!shouldShow) {
    return null;
  }

  return <CombatMinibarContent activity={activity} combatActivityActive={combatActivityActive} />;
}
