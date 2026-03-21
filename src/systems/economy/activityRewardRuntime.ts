import type { EconomyConfig, OutskirtsDef, OutskirtsDropsConfig, RuinDropTable } from '../../content/types.js';
import { applyLootBonuses, type RewardBundle, type RewardItemBundle } from '../../services/rewards/index.js';

export type RewardRng = () => number;

const defaultRng: RewardRng = () => Math.random();

const randomIntInclusive = (minRaw: number, maxRaw: number, rng: RewardRng): number => {
  const low = Math.min(minRaw, maxRaw);
  const high = Math.max(minRaw, maxRaw);
  return Math.floor(rng() * (high - low + 1)) + low;
};

const randomFromList = <T>(list: readonly T[], rng: RewardRng): T | null => {
  if (!Array.isArray(list) || list.length === 0) return null;
  const index = Math.floor(rng() * list.length);
  return list[index] ?? null;
};

const pickWeighted = <T extends { weight: number }>(pool: readonly T[], rng: RewardRng): T | null => {
  const valid = pool.filter((entry) => typeof entry.weight === 'number' && entry.weight > 0);
  if (valid.length === 0) return null;
  const total = valid.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;
  for (const entry of valid) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return valid[valid.length - 1] ?? null;
};

const collapseItems = (items: RewardItemBundle[]): RewardItemBundle[] => {
  const merged = new Map<string, number>();
  items.forEach((item) => {
    if (!item?.itemId || item.qty <= 0) return;
    merged.set(item.itemId, (merged.get(item.itemId) ?? 0) + item.qty);
  });
  return [...merged.entries()].map(([itemId, qty]) => ({ itemId, qty }));
};

const valueByIndex = <T>(source: Record<number, T> | T[] | undefined, index: number, fallback: T): T => {
  if (Array.isArray(source)) return source[index] ?? source[source.length - 1] ?? fallback;
  if (source && typeof source === 'object') return source[index] ?? Object.values(source)[Object.values(source).length - 1] ?? fallback;
  return fallback;
};

export const mergeRewardBundles = (...bundles: Array<RewardBundle | null | undefined>): RewardBundle => {
  const merged: RewardBundle = { currencies: {}, items: [], techniqueFragments: [], manuals: [] };
  bundles.forEach((bundle) => {
    if (!bundle) return;
    Object.entries(bundle.currencies ?? {}).forEach(([key, value]) => {
      const current = BigInt(String(merged.currencies?.[key as keyof typeof merged.currencies] ?? '0'));
      const next = BigInt(String(value ?? '0'));
      merged.currencies = { ...merged.currencies, [key]: (current + next).toString() } as RewardBundle['currencies'];
    });
    if (bundle.items) merged.items!.push(...bundle.items.map((entry) => ({ ...entry })));
    if (bundle.techniqueFragments) merged.techniqueFragments!.push(...bundle.techniqueFragments.map((entry) => ({ ...entry })));
    if (bundle.manuals) merged.manuals!.push(...bundle.manuals.map((entry) => ({ ...entry })));
  });
  if (merged.items && merged.items.length > 0) merged.items = collapseItems(merged.items);
  if (!merged.items?.length) delete merged.items;
  if (!merged.techniqueFragments?.length) delete merged.techniqueFragments;
  if (!merged.manuals?.length) delete merged.manuals;
  if (merged.currencies && Object.keys(merged.currencies).length === 0) delete merged.currencies;
  return merged;
};

export function buildOutskirtsRewardBundle(params: {
  outskirtsDef: OutskirtsDef;
  dropsConfig: OutskirtsDropsConfig | undefined;
  cityIndex: number;
  isBoss: boolean;
  rng?: RewardRng;
}): RewardBundle {
  const { outskirtsDef, dropsConfig, cityIndex, isBoss } = params;
  const rng = params.rng ?? defaultRng;
  const idx = Math.max(0, cityIndex ?? 0);
  const drops = dropsConfig ?? {};

  const mobGoldRange = valueByIndex<[number, number]>(drops.mobGoldByCityIndex, idx, [2, 6]);
  const mobCommonChance = drops.mobCommonMatChance ?? 0.35;
  const mobDoubleChance = drops.mobDoubleMatChance ?? 0.1;
  const mobRareChance = drops.mobRareMatChance ?? 0.02;
  const mobManualScrapsChance = valueByIndex(drops.mobManualScrapsChanceByCityIndex, idx, 0);
  const mobManualScrapsRange = valueByIndex<[number, number]>(drops.mobManualScrapsRangeByCityIndex, idx, [0, 0]);

  const bossGoldRange = valueByIndex<[number, number]>(drops.bossGoldByCityIndex, idx, [20, 40]);
  const bossMatCountRange = valueByIndex<[number, number]>(drops.bossMatCountRangeByCityIndex, idx, [2, 4]);
  const bossRareChance = valueByIndex(drops.bossRareMatChanceByCityIndex, idx, 0.1);
  const bossSpiritChance = valueByIndex(drops.bossSpiritStoneChanceByCityIndex, idx, 0);
  const bossSpiritRange = valueByIndex<[number, number]>(drops.bossSpiritStoneRangeByCityIndex, idx, [0, 0]);

  const items: RewardItemBundle[] = [];
  const currencies: NonNullable<RewardBundle['currencies']> = {};

  if (isBoss) {
    currencies.gold = randomIntInclusive(bossGoldRange[0], bossGoldRange[1], rng).toString();
    const matCount = Math.max(0, randomIntInclusive(bossMatCountRange[0], bossMatCountRange[1], rng));
    for (let i = 0; i < matCount; i += 1) {
      const mat = randomFromList(outskirtsDef.matPools?.common ?? [], rng);
      if (mat) items.push({ itemId: mat, qty: 1 });
    }
    if ((outskirtsDef.matPools?.rare?.length ?? 0) > 0 && rng() < bossRareChance) {
      const rareMat = randomFromList(outskirtsDef.matPools?.rare ?? [], rng);
      if (rareMat) items.push({ itemId: rareMat, qty: 1 });
    }
    if (rng() < bossSpiritChance) {
      const spiritQty = randomIntInclusive(bossSpiritRange[0], bossSpiritRange[1], rng);
      if (spiritQty > 0) currencies.spiritStones = String(spiritQty);
    }
  } else {
    currencies.gold = randomIntInclusive(mobGoldRange[0], mobGoldRange[1], rng).toString();
    if ((outskirtsDef.matPools?.common?.length ?? 0) > 0 && rng() < mobCommonChance) {
      const mat = randomFromList(outskirtsDef.matPools?.common ?? [], rng);
      if (mat) items.push({ itemId: mat, qty: 1 });
      if (rng() < mobDoubleChance) {
        const second = randomFromList(outskirtsDef.matPools?.common ?? [], rng);
        if (second) items.push({ itemId: second, qty: 1 });
      }
    }
    if ((outskirtsDef.matPools?.rare?.length ?? 0) > 0 && rng() < mobRareChance) {
      const rareMat = randomFromList(outskirtsDef.matPools?.rare ?? [], rng);
      if (rareMat) items.push({ itemId: rareMat, qty: 1 });
    }
    if (rng() < mobManualScrapsChance) {
      const scrapQty = randomIntInclusive(mobManualScrapsRange[0], mobManualScrapsRange[1], rng);
      if (scrapQty > 0) items.push({ itemId: 'crate_manual_scraps', qty: scrapQty });
    }
  }

  return applyLootBonuses({ currencies, items: collapseItems(items) }, 'outskirts');
}

export function rollRuinDropTable(table: RuinDropTable, rng: RewardRng = defaultRng): RewardBundle {
  const items: RewardItemBundle[] = [];
  const bundle: RewardBundle = { currencies: {}, items };
  const goldMin = Number.isFinite(table.goldMin) ? (table.goldMin as number) : 0;
  const goldMax = Number.isFinite(table.goldMax) ? (table.goldMax as number) : goldMin;
  if (goldMin > 0 || goldMax > 0) {
    const gold = randomIntInclusive(goldMin, goldMax, rng);
    if (gold > 0) bundle.currencies = { ...bundle.currencies, gold: String(gold) };
  }
  for (let i = 0; i < (table.rolls ?? 0); i += 1) {
    const pick = pickWeighted(table.pool ?? [], rng);
    if (!pick?.itemId) continue;
    const qty = randomIntInclusive(pick.qtyMin, pick.qtyMax, rng);
    if (qty > 0 && !pick.itemId.startsWith('gate_')) items.push({ itemId: pick.itemId, qty });
  }
  (table.guaranteed ?? []).forEach((entry) => {
    if (entry.itemId && entry.qty > 0 && !entry.itemId.startsWith('gate_')) items.push({ itemId: entry.itemId, qty: entry.qty });
  });
  if (items.length > 0) bundle.items = collapseItems(items);
  return bundle;
}

export function buildRuinsFinalChestBonusBundle(params: {
  economy: EconomyConfig | null | undefined;
  cityIndex: number;
  rng?: RewardRng;
}): RewardBundle {
  const rng = params.rng ?? defaultRng;
  const drops = params.economy?.drops?.ruins;
  if (!drops) return {};
  const runeDustRange = valueByIndex<[number, number]>(drops.finalChestRuneDustRangeByCityIndex, params.cityIndex, [0, 0]);
  const artifactRange = valueByIndex<[number, number]>(drops.finalChestArtifactShardsRangeByCityIndex, params.cityIndex, [0, 0]);
  const items: RewardItemBundle[] = [];
  const runeDustQty = Math.max(0, randomIntInclusive(runeDustRange[0], runeDustRange[1], rng));
  const artifactQty = Math.max(0, randomIntInclusive(artifactRange[0], artifactRange[1], rng));
  if (runeDustQty > 0) items.push({ itemId: 'mat_rune_dust', qty: runeDustQty });
  if (artifactQty > 0) items.push({ itemId: 'mat_artifact_shard', qty: artifactQty });
  return items.length > 0 ? { items: collapseItems(items) } : {};
}
