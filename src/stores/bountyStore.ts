import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BountyTemplate } from '../content/index.js';
import { useContentStore } from './contentStore';
import { RewardService, type RewardBundle } from '../services/rewards/index.js';
import { useUIStore } from './uiStore';
import { resolveBountyDestination } from '../utils/bountyRouting';

export type BountyKind =
  | 'OUTSKIRTS_KILL'
  | 'OUTSKIRTS_BOSS_KILL'
  | 'RUINS_ROOM_CLEAR'
  | 'RUINS_RUN_CLEAR'
  | 'TRIAL_CLEAR'
  | 'CRAFT_COMPLETE'
  | 'EXPEDITION_COMPLETE';

export type BountyDifficulty = 'easy' | 'medium' | 'hard';

export interface BountyInstance {
  instanceId: string;
  cityId: string;
  cityIndex: number;
  templateId: string;
  difficulty: BountyDifficulty;
  kind: BountyKind;
  title: string;
  description: string;
  progress: number;
  target: number;
  claimed: boolean;
  rewards: RewardBundle;
  createdAt: number;
}

export type BountyEvent =
  | { type: 'OUTSKIRTS_KILL'; cityId: string; amount?: number }
  | { type: 'OUTSKIRTS_BOSS_KILL'; cityId: string; amount?: number }
  | { type: 'RUINS_ROOM_CLEAR'; cityId: string; amount?: number }
  | { type: 'RUINS_RUN_CLEAR'; cityId: string; amount?: number }
  | { type: 'TRIAL_CLEAR'; cityId: string; amount?: number }
  | { type: 'CRAFT_COMPLETE'; cityId: string; amount: number }
  | { type: 'EXPEDITION_COMPLETE'; cityId: string; amount: number };

interface BountyStoreState {
  activeByCityId: Record<string, BountyInstance[]>;
  lastRefreshAtByCityId: Record<string, number>;
  trackedByCityId: Record<string, string | null>;
  generateForCity: (cityId: string, cityIndex: number) => void;
  refresh: (cityId: string, cityIndex: number) => void;
  canRefresh: (cityId: string, now?: number) => boolean;
  nextRefreshAt: (cityId: string) => number | null;
  recordEvent: (event: BountyEvent) => void;
  claim: (cityId: string, instanceId: string) => boolean;
  getTrackedBounty: (cityId: string) => BountyInstance | null;
  setTrackedBounty: (cityId: string, bountyId: string | null) => void;
  hardResetBounties: () => void;
}

const DIFFICULTIES: BountyDifficulty[] = ['easy', 'medium', 'hard'];

function createUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function rollRange([min, max]: [number, number]): number {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function buildEventTargetLookup(): Record<BountyKind, Record<BountyDifficulty, [number, number]>> {
  return {
    OUTSKIRTS_KILL: {
      easy: [10, 15],
      medium: [20, 30],
      hard: [35, 50],
    },
    OUTSKIRTS_BOSS_KILL: {
      easy: [1, 1],
      medium: [1, 1],
      hard: [1, 2],
    },
    RUINS_ROOM_CLEAR: {
      easy: [3, 5],
      medium: [6, 8],
      hard: [9, 12],
    },
    RUINS_RUN_CLEAR: {
      easy: [1, 1],
      medium: [1, 2],
      hard: [2, 3],
    },
    TRIAL_CLEAR: {
      easy: [1, 1],
      medium: [1, 1],
      hard: [1, 1],
    },
    CRAFT_COMPLETE: {
      easy: [1, 2],
      medium: [2, 4],
      hard: [4, 6],
    },
    EXPEDITION_COMPLETE: {
      easy: [1, 2],
      medium: [2, 3],
      hard: [3, 5],
    },
  };
}

const EVENT_TARGET_LOOKUP = buildEventTargetLookup();

function buildRewardBundle(range: { gold: [number, number]; merit: [number, number]; spiritStones: [number, number] }): RewardBundle {
  const gold = rollRange(range.gold);
  const merit = rollRange(range.merit);
  const spiritStones = rollRange(range.spiritStones);

  const currencies: RewardBundle['currencies'] = {};
  if (gold > 0) currencies.gold = gold.toString();
  if (merit > 0) currencies.merit = merit.toString();
  if (spiritStones > 0) currencies.spiritStones = spiritStones.toString();

  return { currencies };
}

function findRewardTierForCity(
  cityIndex: number,
  rewardTiers: Record<string, { [k in BountyDifficulty]: { gold: [number, number]; merit: [number, number]; spiritStones: [number, number] } }>,
) {
  const entries = Object.entries(rewardTiers)
    .map(([key, value]) => ({ index: Number(key), value }))
    .filter((entry) => Number.isFinite(entry.index))
    .sort((a, b) => a.index - b.index);

  if (entries.length === 0) return null;
  const exact = entries.find((entry) => entry.index === cityIndex);
  if (exact) return exact.value;

  const lower = entries.filter((entry) => entry.index <= cityIndex);
  if (lower.length > 0) return lower[lower.length - 1].value;

  return entries[0].value;
}

function selectTemplate(
  templates: BountyTemplate[],
  difficulty: BountyDifficulty,
  cityIndex: number,
  used: Set<string>,
): BountyTemplate | null {
  const eligible = templates.filter(
    (template) =>
      template.difficulties?.includes(difficulty) &&
      (template.minCityIndex ?? 0) <= cityIndex &&
      !used.has(template.id),
  );

  const pool = eligible.length > 0 ? eligible : templates.filter(
    (template) => template.difficulties?.includes(difficulty) && (template.minCityIndex ?? 0) <= cityIndex,
  );

  if (pool.length === 0) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  used.add(pick.id);
  return pick;
}

function buildBounties(cityId: string, cityIndex: number, cityModules: string[]): BountyInstance[] {
  const bountyConfig = useContentStore.getState().raw?.bounties;
  if (!bountyConfig) return [];
  const templates = bountyConfig.templates ?? [];
  if (!Array.isArray(templates) || templates.length === 0) return [];

  const rewardByCity = bountyConfig.rewardTiersByCityIndex
    ? findRewardTierForCity(cityIndex, bountyConfig.rewardTiersByCityIndex)
    : null;
  if (!rewardByCity) return [];

  const used = new Set<string>();
  const createdAt = Date.now();

  const validTemplates = templates.filter((template) => {
    const destination = resolveBountyDestination({ cityId, bountyKind: template.kind, cityModules });
    return destination.kind !== 'unavailable';
  });

  if (validTemplates.length === 0) return [];

  return DIFFICULTIES.map((difficulty) => {
    const template = selectTemplate(validTemplates, difficulty, cityIndex, used) ?? validTemplates[0];
    const fallbackTargets = EVENT_TARGET_LOOKUP[template.kind as BountyKind]?.[difficulty] ?? [1, 1];
    const target = template.targets?.[difficulty] ?? rollRange(fallbackTargets);
    const description = template.desc?.replace(/\{target\}/g, target.toString()) ?? '';
    const rewards = buildRewardBundle(rewardByCity[difficulty]);

    return {
      instanceId: createUuid(),
      cityId,
      cityIndex,
      templateId: template.id,
      difficulty,
      kind: template.kind as BountyKind,
      title: template.name,
      description,
      progress: 0,
      target,
      claimed: false,
      rewards,
      createdAt,
    };
  });
}

export const useBountyStore = create<BountyStoreState>()(
  immer((set, get) => ({
    activeByCityId: {},
    lastRefreshAtByCityId: {},
    trackedByCityId: {},

    generateForCity: (cityId, cityIndex) => {
      const city = useContentStore.getState().maps.citiesById[cityId];
      const cityModules = city?.modules ?? [];
      const existing = get().activeByCityId[cityId];
      if (existing && existing.length === 3) return;
      const next = buildBounties(cityId, cityIndex, cityModules);
      if (next.length !== 3) {
        if (existing && existing.length > 3) {
          set((state) => {
            state.activeByCityId[cityId] = existing.slice(0, 3);
          });
        }
        return;
      }
      set((state) => {
        state.activeByCityId[cityId] = next;
        state.lastRefreshAtByCityId[cityId] = Date.now();
        if (!(cityId in state.trackedByCityId)) {
          state.trackedByCityId[cityId] = null;
        }
      });
    },

    refresh: (cityId, cityIndex) => {
      if (!get().canRefresh(cityId)) return;
      const city = useContentStore.getState().maps.citiesById[cityId];
      const cityModules = city?.modules ?? [];
      const next = buildBounties(cityId, cityIndex, cityModules);
      if (next.length !== 3) return;
      set((state) => {
        state.activeByCityId[cityId] = next;
        state.lastRefreshAtByCityId[cityId] = Date.now();
        const tracked = state.trackedByCityId[cityId];
        if (tracked && !next.find((entry) => entry.instanceId === tracked)) {
          state.trackedByCityId[cityId] = null;
        }
      });
    },

    canRefresh: (cityId, now = Date.now()) => {
      const bountyConfig = useContentStore.getState().raw?.bounties;
      const cooldownSeconds = bountyConfig?.refreshCooldownSeconds ?? 0;
      if (cooldownSeconds <= 0) return true;
      const last = get().lastRefreshAtByCityId[cityId];
      if (!last) return true;
      return now >= last + cooldownSeconds * 1000;
    },

    nextRefreshAt: (cityId) => {
      const bountyConfig = useContentStore.getState().raw?.bounties;
      const cooldownSeconds = bountyConfig?.refreshCooldownSeconds ?? 0;
      if (cooldownSeconds <= 0) return null;
      const last = get().lastRefreshAtByCityId[cityId];
      if (!last) return null;
      return last + cooldownSeconds * 1000;
    },

    recordEvent: (event) => {
      const amount = Math.max(1, Math.floor(event.amount ?? 1));
      const updates: Array<{ name: string; delta: number; progress: number; target: number }> = [];
      set((state) => {
        const list = state.activeByCityId[event.cityId];
        if (!list) return;
        list.forEach((bounty) => {
          if (bounty.claimed || bounty.kind !== event.type) return;
          const nextProgress = Math.min(bounty.target, bounty.progress + amount);
          const delta = nextProgress - bounty.progress;
          if (delta <= 0) return;
          bounty.progress = nextProgress;
          updates.push({ name: bounty.title, delta, progress: nextProgress, target: bounty.target });
        });
      });

      if (updates.length > 0) {
        const ui = useUIStore.getState();
        updates.forEach((entry) => {
          ui.addNotification('info', `Bounty progress: ${entry.name} +${entry.delta} (${entry.progress}/${entry.target})`, {
            durationMs: 1600,
          });
        });
      }
    },

    claim: (cityId, instanceId) => {
      const bounty = get().activeByCityId[cityId]?.find((entry) => entry.instanceId === instanceId);
      if (!bounty || bounty.claimed || bounty.progress < bounty.target) return false;
      RewardService.grantRewards(bounty.rewards, `bounty:${bounty.templateId}`);
      set((state) => {
        const list = state.activeByCityId[cityId];
        if (!list) return;
        const entry = list.find((item) => item.instanceId === instanceId);
        if (entry) {
          entry.claimed = true;
        }
        if (state.trackedByCityId[cityId] === instanceId) {
          state.trackedByCityId[cityId] = null;
        }
      });
      return true;
    },

    getTrackedBounty: (cityId) => {
      const trackedId = get().trackedByCityId[cityId];
      if (!trackedId) return null;
      return get().activeByCityId[cityId]?.find((bounty) => bounty.instanceId === trackedId) ?? null;
    },

    setTrackedBounty: (cityId, bountyId) => {
      if (bountyId === null) {
        set((state) => {
          state.trackedByCityId[cityId] = null;
        });
        return;
      }

      const exists = get().activeByCityId[cityId]?.some((entry) => entry.instanceId === bountyId);
      set((state) => {
        state.trackedByCityId[cityId] = exists ? bountyId : null;
      });
    },

    hardResetBounties: () => {
      set(() => ({
        activeByCityId: {},
        lastRefreshAtByCityId: {},
        trackedByCityId: {},
      }));
    },
  })),
);
