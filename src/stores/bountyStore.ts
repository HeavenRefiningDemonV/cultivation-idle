import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BountyTemplate } from '../content';
import { useContentStore } from './contentStore';
import { RewardService, type RewardBundle } from '../services/rewards';

export type BountyKind =
  | 'OUTSKIRTS_KILL'
  | 'OUTSKIRTS_BOSS_KILL'
  | 'RUINS_ROOM_CLEAR'
  | 'RUINS_RUN_CLEAR'
  | 'TRIAL_CLEAR';

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
  | { type: 'TRIAL_CLEAR'; cityId: string; amount?: number };

interface BountyStoreState {
  activeByCityId: Record<string, BountyInstance[]>;
  lastRefreshAtByCityId: Record<string, number>;
  generateForCity: (cityId: string, cityIndex: number) => void;
  refresh: (cityId: string, cityIndex: number) => void;
  canRefresh: (cityId: string, now?: number) => boolean;
  nextRefreshAt: (cityId: string) => number | null;
  recordEvent: (event: BountyEvent) => void;
  claim: (cityId: string, instanceId: string) => boolean;
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

function buildBounties(cityId: string, cityIndex: number): BountyInstance[] {
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

  return DIFFICULTIES.map((difficulty) => {
    const template = selectTemplate(templates, difficulty, cityIndex, used) ?? templates[0];
    const target = template.targets?.[difficulty] ?? 1;
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

    generateForCity: (cityId, cityIndex) => {
      const existing = get().activeByCityId[cityId];
      if (existing && existing.length === 3) return;
      const next = buildBounties(cityId, cityIndex);
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
      });
    },

    refresh: (cityId, cityIndex) => {
      if (!get().canRefresh(cityId)) return;
      const next = buildBounties(cityId, cityIndex);
      if (next.length !== 3) return;
      set((state) => {
        state.activeByCityId[cityId] = next;
        state.lastRefreshAtByCityId[cityId] = Date.now();
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
      set((state) => {
        const list = state.activeByCityId[event.cityId];
        if (!list) return;
        list.forEach((bounty) => {
          if (bounty.claimed || bounty.kind !== event.type) return;
          bounty.progress = Math.min(bounty.target, bounty.progress + amount);
        });
      });
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
      });
      return true;
    },

    hardResetBounties: () => {
      set(() => ({
        activeByCityId: {},
        lastRefreshAtByCityId: {},
      }));
    },
  })),
);
