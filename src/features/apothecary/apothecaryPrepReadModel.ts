import type { ApothecaryShopDef, ValidatedContent } from '../../content/index.js';
import { getConsumableSpec } from '../../systems/consumables/consumableCatalog.js';
import type { MedicinePouchSlotKey, MedicinePouchSlotState } from '../../types/index.js';
import { APOTHECARY_STOCK_FLOORS } from './apothecaryStockFloors.js';

export const APOTHECARY_PURPOSE_SENTENCE = 'Use Apothecary to convert gold and reagents into immediate readiness.';

export type ApothecaryWarningCode =
  | 'healing_stock_below_floor'
  | 'no_current_city_specialty_stock'
  | 'breakthrough_prep_missing'
  | 'medicine_pouch_not_configured';

export type ApothecaryRouteIntentKind = 'buy' | 'brew' | 'source_missing_mats';

export interface ApothecaryRouteIntent {
  kind: ApothecaryRouteIntentKind;
  label: string;
  note: string;
  targetTab: 'buy' | 'brew';
}

export interface ApothecaryStockWarning {
  code: ApothecaryWarningCode;
  title: string;
  detail: string;
  targetTab: 'buy' | 'brew' | 'pouch';
}

export interface ApothecaryRecommendedPackageEntry {
  key: 'healing' | 'specialty' | 'breakthrough';
  label: string;
  itemId: string;
  itemName: string;
  targetQty: number;
  ownedQty: number;
  missingQty: number;
  routeIntent: ApothecaryRouteIntent;
}

export interface ApothecaryPouchSummary {
  totalSlots: number;
  filledSlots: number;
  enabledSlots: number;
  stockedSlots: number;
  emptyEnabledSlots: number;
  configured: boolean;
  stocked: boolean;
  readyLabel: string;
  triggerSummary: string;
  slotStatuses: Array<{
    slotKey: MedicinePouchSlotKey;
    equippedItemId: string | null;
    itemName: string;
    enabled: boolean;
    stocked: boolean;
    trigger: string;
  }>;
}

export interface ApothecaryBuySummary {
  stockCount: number;
  limitedCount: number;
  availableTodayCount: number;
  bundleCount: number;
}

export interface ApothecaryBrewSummary {
  recipeCount: number;
  queuedCount: number;
  readyCount: number;
  brewingCount: number;
  nextReadyName: string | null;
}

export interface ApothecaryPrepReadModel {
  purposeSentence: string;
  cityName: string;
  specialtyLineLabel: string;
  specialtyItemNames: string[];
  stockWarnings: ApothecaryStockWarning[];
  recommendedPackage: ApothecaryRecommendedPackageEntry[];
  pouchSummary: ApothecaryPouchSummary;
  buySummary: ApothecaryBuySummary;
  brewSummary: ApothecaryBrewSummary;
}

export interface ApothecaryPrepReadModelInput {
  content: ValidatedContent | null;
  shop: ApothecaryShopDef | null;
  inventoryItems: Record<string, number>;
  pouchSlots: Record<MedicinePouchSlotKey, MedicinePouchSlotState>;
  purchasedTodayByStockId?: Record<string, number>;
  brewQueue?: Array<{ recipeId: string; qty: number; startedAt: number; endsAt: number }>;
  now?: number;
  bundleCount?: number;
}

const WARNING_FLOORS = {
  healing: APOTHECARY_STOCK_FLOORS.healing.targetQty,
  specialty: APOTHECARY_STOCK_FLOORS.specialty.targetQty,
  breakthrough: APOTHECARY_STOCK_FLOORS.cultivation.targetQty,
} as const;

function formatItemName(content: ValidatedContent | null, itemId: string): string {
  return content?.items.find((item) => item.id === itemId)?.name ?? itemId;
}

function getShopStockEntryId(entry: ApothecaryShopDef['stock'][number], index: number): string {
  return entry.id ?? `${entry.itemId}_${index}`;
}

function filterVisibleRecipesForCity(content: ValidatedContent | null, cityId: string | null) {
  if (!content || !cityId) return [] as ValidatedContent['alchemy_recipes'];
  const targetIndex = content.cities.findIndex((city) => city.id === cityId);
  if (targetIndex < 0) return [] as ValidatedContent['alchemy_recipes'];

  return content.alchemy_recipes.filter((recipe) => {
    const unlockIndex = content.cities.findIndex((city) => city.id === recipe.unlocksAtCityId);
    if (unlockIndex < 0 || unlockIndex > targetIndex) return false;
    return true;
  });
}

function getRecipeByOutputItemId(content: ValidatedContent | null, cityId: string | null, itemId: string) {
  return filterVisibleRecipesForCity(content, cityId).find((recipe) => Object.keys(recipe.outputs ?? {}).includes(itemId)) ?? null;
}

function getConsumableCandidates(options: {
  content: ValidatedContent | null;
  cityId: string | null;
  shop: ApothecaryShopDef | null;
}) {
  const { content, cityId, shop } = options;
  const soldItemIds = new Set((shop?.stock ?? []).map((entry) => entry.itemId));
  const recipeOutputs = filterVisibleRecipesForCity(content, cityId)
    .map((recipe) => Object.keys(recipe.outputs ?? {})[0])
    .filter((itemId): itemId is string => Boolean(itemId));

  const uniqueIds = [...new Set([...soldItemIds, ...recipeOutputs])];
  return uniqueIds
    .map((itemId) => {
      const spec = getConsumableSpec(itemId);
      const item = content?.items.find((entry) => entry.id === itemId) ?? null;
      const usage = spec?.usage ?? item?.usage;
      const recommendedSlot = spec?.recommendedSlot ?? (itemId.includes('healing') ? 'healing' : 'specialty');
      if (!usage) return null;
      return {
        itemId,
        itemName: formatItemName(content, itemId),
        usage,
        recommendedSlot,
        sold: soldItemIds.has(itemId),
        recipe: getRecipeByOutputItemId(content, cityId, itemId),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function resolveSpecialtyItemIds(options: {
  content: ValidatedContent | null;
  cityId: string | null;
  shop: ApothecaryShopDef | null;
}) {
  const { content, cityId, shop } = options;
  const sold = (shop?.stock ?? [])
    .map((entry) => entry.itemId)
    .filter((itemId) => {
      const spec = getConsumableSpec(itemId);
      return spec ? spec.recommendedSlot !== 'healing' : itemId !== 'cons_healing_pellet_t1';
    });
  const brewed = filterVisibleRecipesForCity(content, cityId)
    .map((recipe) => Object.keys(recipe.outputs ?? {})[0])
    .filter((itemId): itemId is string => Boolean(itemId))
    .filter((itemId) => {
      const spec = getConsumableSpec(itemId);
      return spec ? spec.recommendedSlot !== 'healing' : itemId !== 'cons_healing_pellet_t1';
    });

  return [...new Set([...sold, ...brewed])];
}

function buildPouchSummary(
  content: ValidatedContent | null,
  pouchSlots: Record<MedicinePouchSlotKey, MedicinePouchSlotState>,
  inventoryItems: Record<string, number>,
): ApothecaryPouchSummary {
  const slotOrder: MedicinePouchSlotKey[] = ['healing', 'utility', 'specialty'];
  const slotStatuses = slotOrder.map((slotKey) => {
    const slot = pouchSlots[slotKey];
    const equippedItemId = slot?.equippedItemId ?? null;
    const stocked = Boolean(equippedItemId && (inventoryItems[equippedItemId] ?? 0) > 0);
    const trigger =
      slot.trigger === 'manual'
        ? 'Manual'
        : slot.trigger === 'hpBelowPct'
          ? `HP < ${slot.thresholdPct}%`
          : slot.trigger === 'qiBelowPct'
            ? `Qi < ${slot.thresholdPct}%`
            : slot.trigger === 'intentBelowPct'
              ? `Intent < ${slot.thresholdPct}%`
              : slot.trigger === 'fightStart'
                ? 'Fight start'
                : 'Boss start';

    return {
      slotKey,
      equippedItemId,
      itemName: equippedItemId ? formatItemName(content, equippedItemId) : 'Empty',
      enabled: slot?.enabled ?? false,
      stocked,
      trigger,
    };
  });

  const totalSlots = slotStatuses.length;
  const filledSlots = slotStatuses.filter((slot) => Boolean(slot.equippedItemId)).length;
  const enabledSlots = slotStatuses.filter((slot) => slot.enabled).length;
  const stockedSlots = slotStatuses.filter((slot) => slot.enabled && slot.stocked).length;
  const emptyEnabledSlots = slotStatuses.filter((slot) => slot.enabled && !slot.equippedItemId).length;
  const configured = filledSlots > 0;
  const stocked = stockedSlots > 0;
  const autoTriggerCount = slotStatuses.filter((slot) => slot.enabled && slot.trigger !== 'Manual').length;
  const readyLabel =
    !configured
      ? 'Unconfigured'
      : stocked
        ? `${stockedSlots}/${totalSlots} ready`
        : 'Configured, but out of stock';

  return {
    totalSlots,
    filledSlots,
    enabledSlots,
    stockedSlots,
    emptyEnabledSlots,
    configured,
    stocked,
    readyLabel,
    triggerSummary: `${autoTriggerCount} auto trigger${autoTriggerCount === 1 ? '' : 's'} • ${filledSlots} slot${filledSlots === 1 ? '' : 's'} filled`,
    slotStatuses,
  };
}

function resolveRouteIntent(options: {
  content: ValidatedContent | null;
  cityId: string | null;
  shop: ApothecaryShopDef | null;
  inventoryItems: Record<string, number>;
  itemId: string;
  missingQty: number;
}): ApothecaryRouteIntent {
  const { content, cityId, shop, inventoryItems, itemId, missingQty } = options;
  const stockEntry = (shop?.stock ?? []).find((entry) => entry.itemId === itemId) ?? null;
  if (stockEntry) {
    return {
      kind: 'buy',
      label: 'Buy now',
      note: missingQty > 0 ? `Buy ${missingQty} more from today’s stock.` : 'Shelf stock can top you off instantly.',
      targetTab: 'buy',
    };
  }

  const recipe = getRecipeByOutputItemId(content, cityId, itemId);
  if (!recipe) {
    return {
      kind: 'source_missing_mats',
      label: 'Source mats',
      note: 'This item is not currently on the live shelf or brew roster.',
      targetTab: 'brew',
    };
  }

  const singleBatchMissingInputs = Object.entries(recipe.inputs ?? {})
    .map(([inputItemId, qty]) => {
      const needed = Math.max(0, Math.ceil(Number(qty)) - (inventoryItems[inputItemId] ?? 0));
      return { inputItemId, needed };
    })
    .filter((entry) => entry.needed > 0);
  const reserveMissingInputs = Object.entries(recipe.inputs ?? {})
    .map(([inputItemId, qty]) => {
      const needed = Math.max(0, Math.ceil(Number(qty) * Math.max(1, missingQty || 1)) - (inventoryItems[inputItemId] ?? 0));
      return { inputItemId, needed };
    })
    .filter((entry) => entry.needed > 0);

  if (singleBatchMissingInputs.length === 0) {
    return {
      kind: 'brew',
      label: 'Brew now',
      note: 'You already have the reagents to brew this reserve more efficiently.',
      targetTab: 'brew',
    };
  }

  return {
    kind: 'source_missing_mats',
    label: 'Source mats',
    note: `Missing ${reserveMissingInputs
      .slice(0, 2)
      .map((entry) => `${formatItemName(content, entry.inputItemId)} ×${entry.needed}`)
      .join(', ')}.`,
    targetTab: 'brew',
  };
}

function buildRecommendedPackage(options: {
  content: ValidatedContent | null;
  cityId: string | null;
  shop: ApothecaryShopDef | null;
  inventoryItems: Record<string, number>;
}): ApothecaryRecommendedPackageEntry[] {
  const { content, cityId, shop, inventoryItems } = options;
  const candidates = getConsumableCandidates({ content, cityId, shop });

  const healing = candidates.find((entry) => entry.recommendedSlot === 'healing') ?? null;
  const specialty =
    candidates.find((entry) => entry.usage !== 'cultivate_only' && entry.recommendedSlot !== 'healing') ?? null;
  const breakthrough =
    candidates.find(
      (entry) =>
        entry.usage === 'cultivate_only' &&
        entry.itemId !== specialty?.itemId &&
        entry.recipe &&
        !entry.sold,
    ) ??
    candidates.find((entry) => entry.usage === 'cultivate_only' && entry.itemId !== specialty?.itemId) ??
    null;

  const entries: ApothecaryRecommendedPackageEntry[] = [];

  if (healing) {
    const ownedQty = inventoryItems[healing.itemId] ?? 0;
    const missingQty = Math.max(0, WARNING_FLOORS.healing - ownedQty);
    entries.push({
      key: 'healing',
      label: 'Healing reserve',
      itemId: healing.itemId,
      itemName: healing.itemName,
      targetQty: WARNING_FLOORS.healing,
      ownedQty,
      missingQty,
      routeIntent: resolveRouteIntent({ content, cityId, shop, inventoryItems, itemId: healing.itemId, missingQty }),
    });
  }

  if (specialty) {
    const ownedQty = inventoryItems[specialty.itemId] ?? 0;
    const missingQty = Math.max(0, WARNING_FLOORS.specialty - ownedQty);
    entries.push({
      key: 'specialty',
      label: 'City specialty line',
      itemId: specialty.itemId,
      itemName: specialty.itemName,
      targetQty: WARNING_FLOORS.specialty,
      ownedQty,
      missingQty,
      routeIntent: resolveRouteIntent({ content, cityId, shop, inventoryItems, itemId: specialty.itemId, missingQty }),
    });
  }

  if (breakthrough) {
    const ownedQty = inventoryItems[breakthrough.itemId] ?? 0;
    const missingQty = Math.max(0, WARNING_FLOORS.breakthrough - ownedQty);
    entries.push({
      key: 'breakthrough',
      label: 'Breakthrough prep',
      itemId: breakthrough.itemId,
      itemName: breakthrough.itemName,
      targetQty: WARNING_FLOORS.breakthrough,
      ownedQty,
      missingQty,
      routeIntent: resolveRouteIntent({ content, cityId, shop, inventoryItems, itemId: breakthrough.itemId, missingQty }),
    });
  }

  return entries;
}

function buildStockWarnings(options: {
  content: ValidatedContent | null;
  cityName: string;
  shop: ApothecaryShopDef | null;
  inventoryItems: Record<string, number>;
  pouchSummary: ApothecaryPouchSummary;
  recommendedPackage: ApothecaryRecommendedPackageEntry[];
  specialtyItemIds: string[];
}) {
  const { cityName, inventoryItems, pouchSummary, recommendedPackage, specialtyItemIds } = options;
  const warnings: ApothecaryStockWarning[] = [];
  const healingEntry = recommendedPackage.find((entry) => entry.key === 'healing');
  if (healingEntry && healingEntry.ownedQty < WARNING_FLOORS.healing) {
    warnings.push({
      code: 'healing_stock_below_floor',
      title: 'Healing stock below floor',
      detail: `${healingEntry.itemName} is below the ${WARNING_FLOORS.healing}-use reserve for this room.`,
      targetTab: 'buy',
    });
  }

  const specialtyOwned = specialtyItemIds.reduce((sum, itemId) => sum + (inventoryItems[itemId] ?? 0), 0);
  if (specialtyItemIds.length > 0 && specialtyOwned <= 0) {
    warnings.push({
      code: 'no_current_city_specialty_stock',
      title: 'No current-city specialty stock',
      detail: `${cityName} specialty prep is empty. Restock before pushing this city’s encounters.`,
      targetTab: 'buy',
    });
  }

  const breakthroughEntry = recommendedPackage.find((entry) => entry.key === 'breakthrough');
  if (breakthroughEntry && breakthroughEntry.ownedQty < WARNING_FLOORS.breakthrough) {
    warnings.push({
      code: 'breakthrough_prep_missing',
      title: 'Breakthrough prep missing',
      detail: `${breakthroughEntry.itemName} is below the ${WARNING_FLOORS.breakthrough}-use prep reserve.`,
      targetTab: breakthroughEntry.routeIntent.targetTab,
    });
  }

  if (!pouchSummary.configured || !pouchSummary.stocked) {
    warnings.push({
      code: 'medicine_pouch_not_configured',
      title: 'Medicine pouch not configured',
      detail: pouchSummary.configured
        ? 'Equipped pouch items are out of stock. Refill or change your loadout.'
        : 'Equip at least one stocked consumable so your pouch can cover emergencies.',
      targetTab: 'pouch',
    });
  }

  return warnings;
}

export function buildApothecaryPrepReadModel(input: ApothecaryPrepReadModelInput): ApothecaryPrepReadModel {
  const {
    content,
    shop,
    inventoryItems,
    pouchSlots,
    purchasedTodayByStockId = {},
    brewQueue = [],
    now = Date.now(),
    bundleCount = 0,
  } = input;
  const cityName = content?.cities.find((city) => city.id === shop?.cityId)?.name ?? 'This city';
  const specialtyItemIds = resolveSpecialtyItemIds({ content, cityId: shop?.cityId ?? null, shop });
  const specialtyItemNames = specialtyItemIds.map((itemId) => formatItemName(content, itemId));
  const pouchSummary = buildPouchSummary(content, pouchSlots, inventoryItems);
  const recommendedPackage = buildRecommendedPackage({
    content,
    cityId: shop?.cityId ?? null,
    shop,
    inventoryItems,
  });
  const stockWarnings = buildStockWarnings({
    content,
    cityName,
    shop,
    inventoryItems,
    pouchSummary,
    recommendedPackage,
    specialtyItemIds,
  });

  const availableTodayCount = (shop?.stock ?? []).filter((entry, index) => {
    if (entry.dailyLimit == null) return true;
    const stockId = getShopStockEntryId(entry, index);
    const purchased = purchasedTodayByStockId[stockId] ?? 0;
    return purchased < entry.dailyLimit;
  }).length;

  const recipeCount = filterVisibleRecipesForCity(content, shop?.cityId ?? null).length;
  const readyQueue = brewQueue.filter((job) => now >= job.endsAt);
  const brewingQueue = brewQueue.filter((job) => now >= job.startedAt && now < job.endsAt);
  const nextReady = [...brewQueue].sort((a, b) => a.endsAt - b.endsAt)[0] ?? null;
  const nextReadyRecipe = nextReady ? filterVisibleRecipesForCity(content, shop?.cityId ?? null).find((recipe) => recipe.id === nextReady.recipeId) ?? null : null;
  const nextReadyItemId = nextReadyRecipe ? Object.keys(nextReadyRecipe.outputs ?? {})[0] : null;
  const nextReadyName = nextReadyItemId ? formatItemName(content, nextReadyItemId) : nextReady?.recipeId ?? null;

  return {
    purposeSentence: APOTHECARY_PURPOSE_SENTENCE,
    cityName,
    specialtyLineLabel: `${cityName} specialty line`,
    specialtyItemNames,
    stockWarnings,
    recommendedPackage,
    pouchSummary,
    buySummary: {
      stockCount: shop?.stock.length ?? 0,
      limitedCount: (shop?.stock ?? []).filter((entry) => entry.dailyLimit != null).length,
      availableTodayCount,
      bundleCount,
    },
    brewSummary: {
      recipeCount,
      queuedCount: brewQueue.length,
      readyCount: readyQueue.length,
      brewingCount: brewingQueue.length,
      nextReadyName,
    },
  };
}
