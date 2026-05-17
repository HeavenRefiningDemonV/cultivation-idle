import { getItemDef } from '../../stores/contentStore.js';
import { normalizeItemList } from '../../utils/itemList.js';
import { D } from '../../utils/numbers.js';
import type { GrantRewardsResult, RewardBundle, RewardCurrencyBundle } from './types.js';

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

  for (const fragment of result.appliedTechniqueFragments ?? []) {
    if (!fragment?.techId || fragment.qty <= 0) continue;
    parts.push(`+${fragment.qty} technique fragments: ${fragment.techId}`);
  }

  for (const manual of result.appliedManuals ?? []) {
    if (!manual?.techId || manual.qty <= 0) continue;
    parts.push(`+${manual.qty} manual: ${manual.techId}`);
  }

  if (result.appliedComprehension?.applied) {
    parts.push(`+${result.appliedComprehension.amount} Comprehension`);
  } else if (result.appliedComprehension?.skippedReason === 'no_selected_heart_law') {
    parts.push('(Comprehension skipped: no Heart Law selected)');
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
      .filter((manual) => {
        if (!manual || !manual.manualId || !manual.techId) return false;
        if (typeof manual.qty !== 'number' || !Number.isFinite(manual.qty)) return false;
        return Math.floor(manual.qty) > 0;
      })
      .map((manual) => ({
        manualId: manual.manualId,
        techId: manual.techId,
        grade: normalizeGrade(manual.grade),
        rarity: normalizeRarity(manual.rarity),
        qty: Math.floor(manual.qty),
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
