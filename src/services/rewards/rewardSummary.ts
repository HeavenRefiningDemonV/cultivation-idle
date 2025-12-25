import { getItemDef } from '../../stores/contentStore';
import { normalizeItemList } from '../../utils/itemList';
import { D } from '../../utils/numbers';
import type { GrantRewardsResult, RewardBundle, RewardCurrencyBundle } from './types';

const allowedGrades = ['mortal', 'earth', 'heaven', 'mystic'] as const;
const allowedRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

function normalizeCurrency(amount: string | undefined): string {
  if (!amount) return '0';
  const trimmed = amount.trim();
  if (!trimmed) return '0';
  try {
    const value = D(trimmed);
    if (!value.isFinite() || value.isNegative()) return '0';
    return value.toString();
  } catch {
    return '0';
  }
}

function nameForItem(itemId: string): string {
  const def = getItemDef(itemId);
  return def?.name ?? itemId;
}

function normalizeCurrencies(bundle?: RewardCurrencyBundle): RewardCurrencyBundle {
  const normalized: RewardCurrencyBundle = {};
  if (!bundle) return normalized;

  (Object.keys(bundle) as Array<keyof RewardCurrencyBundle>).forEach((key) => {
    const value = normalizeCurrency(bundle[key]);
    if (value !== '0') {
      normalized[key] = value;
    }
  });

  return normalized;
}

function normalizeGrade(input?: string): (typeof allowedGrades)[number] {
  const value = (input ?? '').toLowerCase();
  return allowedGrades.includes(value as (typeof allowedGrades)[number])
    ? (value as (typeof allowedGrades)[number])
    : 'mortal';
}

function normalizeRarity(input?: string): (typeof allowedRarities)[number] {
  const value = (input ?? '').toLowerCase();
  return allowedRarities.includes(value as (typeof allowedRarities)[number])
    ? (value as (typeof allowedRarities)[number])
    : 'common';
}

export function buildRewardSummary(result: GrantRewardsResult): string {
  const parts: string[] = [];

  const currencies = normalizeCurrencies(result.appliedCurrencies);
  if (currencies.gold) parts.push(`+${currencies.gold} Gold`);
  if (currencies.spiritStones) parts.push(`+${currencies.spiritStones} Spirit Stones`);
  if (currencies.merit) parts.push(`+${currencies.merit} Merit`);

  for (const item of normalizeItemList(result.appliedItems)) {
    if (!item?.itemId || item.qty <= 0) continue;
    parts.push(`+${item.qty} ${nameForItem(item.itemId)}`);
  }

  if (result.droppedItems.length > 0) {
    const dropped = normalizeItemList(result.droppedItems)
      .filter((item) => item && item.itemId && item.qty > 0)
      .map((item) => `${item.qty} ${nameForItem(item.itemId)}`)
      .join(', ');
    if (dropped) parts.push(`(Dropped: ${dropped})`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'No rewards.';
}

export function normalizeRewardBundle(bundle: RewardBundle): RewardBundle {
  const normalized: RewardBundle = {};

  const currencies = normalizeCurrencies(bundle.currencies);
  if (Object.keys(currencies).length > 0) {
    normalized.currencies = currencies;
  }

  const items = normalizeItemList(bundle.items);
  if (items.length > 0) {
    normalized.items = items;
  }

  if (Array.isArray(bundle.techniqueFragments) && bundle.techniqueFragments.length > 0) {
    normalized.techniqueFragments = bundle.techniqueFragments
      .filter((fragment) => fragment && fragment.techId && fragment.qty > 0)
      .map((fragment) => ({ ...fragment, qty: Math.floor(fragment.qty) }));
  }

  if (Array.isArray(bundle.manuals) && bundle.manuals.length > 0) {
    const manuals = bundle.manuals
      .filter((manual) => manual && manual.manualId && manual.techId)
      .map((manual) => ({
        manualId: manual.manualId,
        techId: manual.techId,
        grade: normalizeGrade(manual.grade),
        rarity: normalizeRarity(manual.rarity),
        qty: Math.max(1, Math.floor(manual.qty ?? 0)),
      }))
      .filter((manual) => manual.qty > 0);

    if (manuals.length > 0) {
      normalized.manuals = manuals;
    }
  }

  if (typeof bundle.comprehension === 'number' && Number.isFinite(bundle.comprehension)) {
    normalized.comprehension = bundle.comprehension;
  }

  return normalized;
}
