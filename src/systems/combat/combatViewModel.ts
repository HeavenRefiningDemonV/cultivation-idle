import type {
  CombatEvent,
  CombatLogEntry,
  CombatState,
  CombatTechniqueLogEntry,
} from '../../types/index.js';
import { PERF_LABELS, time } from '../../services/performance/index.js';

const EMPTY_LOGS: readonly CombatLogEntry[] = Object.freeze([]);
const EMPTY_TECHNIQUE_LOGS: readonly CombatTechniqueLogEntry[] = Object.freeze([]);
const EMPTY_EVENTS: readonly CombatEvent[] = Object.freeze([]);

function toNumber(value: string | number | null | undefined): number {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value ?? '');
  return Number.isFinite(numeric) ? numeric : 0;
}

function pct(current: string | number | null | undefined, max: string | number | null | undefined): number {
  const currentValue = toNumber(current);
  const maxValue = toNumber(max);
  if (maxValue <= 0) return 0;
  return Math.max(0, Math.min(100, (currentValue / maxValue) * 100));
}

function tail<T>(list: readonly T[], count: number): readonly T[] {
  if (list.length === 0) return [];
  return list.length <= count ? list : list.slice(-count);
}

export type CombatViewModel = {
  inCombat: boolean;
  contextType: string | null;
  activityType: string | null;
  player: {
    hp: string;
    maxHp: string;
    hpPct: number;
  };
  enemy: {
    id: string | null;
    name: string | null;
    hp: string;
    maxHp: string;
    hpPct: number;
    isBoss: boolean;
  };
  resources: {
    qiPct: number;
    intentPct: number;
    qiLabel: string;
    intentLabel: string;
  };
  shield: {
    amount: number;
    expiresAt: number | null;
  } | null;
  currentAura: {
    damagePerSec: number;
    description?: string;
  } | null;
  recentLogs: readonly CombatLogEntry[];
  recentTechniqueLogs: readonly CombatTechniqueLogEntry[];
  recentEvents: readonly CombatEvent[];
  activeResult: 'none' | 'victory' | 'defeat';
  combatSessionVersion: number;
  combatViewVersion: number;
  combatResultVersion: number;
};

export function buildCombatViewModel(
  combat: Pick<
    CombatState,
    | 'inCombat'
    | 'combatContext'
    | 'currentEnemy'
    | 'playerHP'
    | 'playerMaxHP'
    | 'enemyHP'
    | 'enemyMaxHP'
    | 'combatResources'
    | 'combatShield'
    | 'activeAura'
    | 'combatLog'
    | 'techniqueLog'
    | 'events'
    | 'isBoss'
    | 'combatResolved'
    | 'combatSessionVersion'
    | 'combatViewVersion'
    | 'combatResultVersion'
  >,
  activityType: string | null,
  options: { logCount?: number; techniqueLogCount?: number; eventCount?: number } = {},
): CombatViewModel {
  return time(PERF_LABELS.combatViewModelBuild, () => {
    const logCount = options.logCount ?? 3;
    const techniqueLogCount = options.techniqueLogCount ?? 3;
    const eventCount = options.eventCount ?? 8;
    const recentLogs = tail(combat.combatLog, logCount);
    const recentTechniqueLogs = tail(combat.techniqueLog, techniqueLogCount);
    const recentEvents = tail(combat.events, eventCount);
    const resources = combat.combatResources;
    const playerHpPct = pct(combat.playerHP, combat.playerMaxHP);
    const enemyHpPct = pct(combat.enemyHP, combat.enemyMaxHP);
    const activeResult = combat.combatResolved
      ? playerHpPct <= 0 ? 'defeat' : 'victory'
      : 'none';

    return {
      inCombat: combat.inCombat,
      contextType: combat.combatContext?.type ?? null,
      activityType,
      player: {
        hp: combat.playerHP,
        maxHp: combat.playerMaxHP,
        hpPct: playerHpPct,
      },
      enemy: {
        id: combat.currentEnemy?.id ?? null,
        name: combat.currentEnemy?.name ?? null,
        hp: combat.enemyHP,
        maxHp: combat.enemyMaxHP,
        hpPct: enemyHpPct,
        isBoss: Boolean(combat.isBoss || combat.currentEnemy?.isBoss),
      },
      resources: {
        qiPct: resources.maxQi > 0 ? Math.max(0, Math.min(100, (resources.qi / resources.maxQi) * 100)) : 0,
        intentPct: resources.maxIntent > 0 ? Math.max(0, Math.min(100, (resources.intent / resources.maxIntent) * 100)) : 0,
        qiLabel: `${resources.qi.toFixed(1)} / ${resources.maxQi.toFixed(0)}`,
        intentLabel: `${resources.intent.toFixed(1)} / ${resources.maxIntent.toFixed(0)}`,
      },
      shield: combat.combatShield
        ? { amount: combat.combatShield.amount, expiresAt: combat.combatShield.expiresAt }
        : null,
      currentAura: combat.activeAura
        ? { ...combat.activeAura }
        : null,
      recentLogs: recentLogs.length === 0 ? EMPTY_LOGS : recentLogs,
      recentTechniqueLogs: recentTechniqueLogs.length === 0 ? EMPTY_TECHNIQUE_LOGS : recentTechniqueLogs,
      recentEvents: recentEvents.length === 0 ? EMPTY_EVENTS : recentEvents,
      activeResult,
      combatSessionVersion: combat.combatSessionVersion,
      combatViewVersion: combat.combatViewVersion,
      combatResultVersion: combat.combatResultVersion,
    };
  });
}
