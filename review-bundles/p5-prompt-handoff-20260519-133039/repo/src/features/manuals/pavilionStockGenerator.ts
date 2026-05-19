import { useContentStore } from "../../stores/contentStore.js";
import {
  applyPavilionCorrectionPass,
  type PavilionCorrectionCandidate,
  type PavilionGenerationContext,
} from "../../systems/manuals/index.js";
import { nextSeed, randFloat } from "../../utils/rng.js";
import type {
  ManualGrade,
  ManualRarity,
  PavilionStockSlot,
  PavilionStockState,
} from "./pavilionStockTypes.js";

type RarityWeights = Partial<Record<ManualRarity, number>>;

const FILLER_RARITY_WEIGHTS: RarityWeights = { common: 80, uncommon: 20 };

function stringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function pickWeighted<T>(
  seed: number,
  entries: Array<{ value: T; weight: number }>,
): { pick: T; seed: number } {
  let next = seed;
  const totalWeight = entries.reduce(
    (sum, entry) => sum + Math.max(entry.weight, 0),
    0,
  );
  if (totalWeight <= 0) {
    return { pick: entries[0].value, seed: nextSeed(next) };
  }
  const roll = randFloat(next);
  next = roll.seed;
  let cursor = roll.value * totalWeight;
  for (const entry of entries) {
    cursor -= Math.max(entry.weight, 0);
    if (cursor <= 0) {
      return { pick: entry.value, seed: next };
    }
  }
  return { pick: entries[entries.length - 1].value, seed: nextSeed(next) };
}

function normalizeRarityWeights(
  weights?: Record<string, number> | null,
): RarityWeights {
  const normalized: RarityWeights = {};
  (
    ["common", "uncommon", "rare", "epic", "legendary"] as ManualRarity[]
  ).forEach((rarity) => {
    const value = weights?.[rarity];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      normalized[rarity] = value;
    }
  });
  return normalized;
}

function applyCityModifiers(
  weights: RarityWeights,
  cityId: string,
  cityIndex: number,
): RarityWeights {
  const economy = useContentStore.getState().raw?.economy?.manualSystem;
  const cityTierModifiers =
    (economy as any)?.pavilions?.cityTierModifiers ?? {};
  const modifiers = (cityTierModifiers?.[cityId] ??
    cityTierModifiers?.[`city_${cityIndex + 1}`]) as
    | { legendaryWeightMultiplier?: number; featuredEpicCap?: number }
    | undefined;
  const updated: RarityWeights = { ...weights };
  if (modifiers?.legendaryWeightMultiplier !== undefined) {
    const multiplier = Number(modifiers.legendaryWeightMultiplier);
    updated.legendary = Math.max(0, (updated.legendary ?? 0) * multiplier);
  }
  if (
    modifiers?.featuredEpicCap !== undefined &&
    modifiers.featuredEpicCap !== null
  ) {
    updated.epic = Math.min(
      updated.epic ?? 0,
      Number(modifiers.featuredEpicCap),
    );
  }
  return updated;
}

function applyFeaturedPityUpdate(
  rarity: ManualRarity,
  pity: { featuredEpic: number; featuredLegendary: number },
): { featuredEpic: number; featuredLegendary: number } {
  const nextPity = { ...pity };
  if (rarity === "legendary") {
    nextPity.featuredEpic = 0;
    nextPity.featuredLegendary = 0;
    return nextPity;
  }
  if (rarity === "epic") {
    nextPity.featuredEpic = 0;
    nextPity.featuredLegendary += 1;
    return nextPity;
  }
  nextPity.featuredEpic += 1;
  nextPity.featuredLegendary += 1;
  return nextPity;
}

function rollRarity(
  seed: number,
  weights: RarityWeights,
  pity: { featuredEpic: number; featuredLegendary: number },
  pityRules: {
    featuredEpicPityToGuarantee: number;
    featuredLegendaryPityToGuarantee: number;
  },
  isFeatured: boolean,
): {
  rarity: ManualRarity;
  pity: { featuredEpic: number; featuredLegendary: number };
  seed: number;
} {
  let nextSeedValue = seed;
  let nextPity = { ...pity };
  if (isFeatured) {
    if (
      nextPity.featuredLegendary >=
      pityRules.featuredLegendaryPityToGuarantee - 1
    ) {
      nextPity = applyFeaturedPityUpdate("legendary", nextPity);
      return { rarity: "legendary", pity: nextPity, seed: nextSeedValue };
    }
    if (nextPity.featuredEpic >= pityRules.featuredEpicPityToGuarantee - 1) {
      nextPity = applyFeaturedPityUpdate("epic", nextPity);
      return { rarity: "epic", pity: nextPity, seed: nextSeedValue };
    }
  }

  const entries = Object.entries(weights).map(([rarity, weight]) => ({
    value: rarity as ManualRarity,
    weight: weight ?? 0,
  }));
  const result =
    entries.length > 0
      ? pickWeighted(nextSeedValue, entries)
      : { pick: "common" as ManualRarity, seed: nextSeed(nextSeedValue) };
  nextSeedValue = result.seed;
  const rarity = result.pick;

  if (isFeatured) {
    nextPity = applyFeaturedPityUpdate(rarity, nextPity);
  }

  return { rarity, pity: nextPity, seed: nextSeedValue };
}

function simulateFeaturedPity(
  starting: { featuredEpic: number; featuredLegendary: number },
  rarities: ManualRarity[],
  pityRules: {
    featuredEpicPityToGuarantee: number;
    featuredLegendaryPityToGuarantee: number;
  },
): { featuredEpic: number; featuredLegendary: number } {
  void pityRules; // included for parity with roll logic and future expansion
  let state = { ...starting };
  rarities.forEach((rarity) => {
    state = applyFeaturedPityUpdate(rarity, state);
  });
  return state;
}

function buildTechniqueCandidates(
  pavilionId: string,
): PavilionCorrectionCandidate[] {
  const pavilion = useContentStore.getState().maps.pavilionsById[pavilionId];
  const techniques = useContentStore.getState().maps.techniquesById;
  if (!pavilion) return [];
  const entries: PavilionCorrectionCandidate[] = [];
  Object.values(pavilion.poolByPath ?? {}).forEach((pool) => {
    pool?.forEach((entry: any) => {
      if (!entry) return;
      if (typeof entry === "string") {
        const technique = techniques[entry];
        entries.push({
          techniqueId: entry,
          rarity: technique?.rarity as ManualRarity | undefined,
          weight: 1,
        });
        return;
      }
      if (typeof entry.techId === "string") {
        const technique = techniques[entry.techId];
        const rarity =
          (entry.rarity as ManualRarity | undefined) ??
          (technique?.rarity as ManualRarity | undefined);
        const weight = Number(entry.weight ?? 1);
        entries.push({
          techniqueId: entry.techId,
          rarity,
          weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
        });
      }
    });
  });
  return entries;
}

function pickTechnique(
  seed: number,
  candidates: PavilionCorrectionCandidate[],
  rarity: ManualRarity | null,
  used: Set<string>,
  allowDuplicates: boolean,
): { techniqueId: string; seed: number } {
  let next = seed;
  const pool =
    candidates.length > 0
      ? candidates
      : [{ techniqueId: "missing", weight: 1 } as PavilionCorrectionCandidate];
  const rarityPool = rarity
    ? pool.filter((entry) => !entry.rarity || entry.rarity === rarity)
    : pool;
  const uniquePool = rarityPool.filter((entry) => !used.has(entry.techniqueId));
  const finalPool =
    allowDuplicates || uniquePool.length === 0 ? rarityPool : uniquePool;
  const chosenPool = finalPool.length > 0 ? finalPool : pool;
  const pick = pickWeighted(
    next,
    chosenPool.map((entry) => ({
      value: entry.techniqueId,
      weight: entry.weight,
    })),
  );
  next = pick.seed;
  return { techniqueId: pick.pick, seed: next };
}

function getVisibleSlotCount(cityIndex: number): number {
  if (cityIndex <= 0) return 10;
  if (cityIndex === 1) return 14;
  if (cityIndex === 2) return 16;
  if (cityIndex === 3) return 20;
  return 24;
}

function clampCityIndex(prices?: Array<unknown>, cityIndex?: number): number {
  if (!Array.isArray(prices) || prices.length === 0) return 0;
  const idx =
    typeof cityIndex === "number" && Number.isFinite(cityIndex) ? cityIndex : 0;
  return Math.min(Math.max(idx, 0), prices.length - 1);
}

function determineGrade(pavilionId: string, cityIndex: number): ManualGrade {
  const pavilion = useContentStore.getState().maps.pavilionsById[pavilionId];
  const economy = useContentStore.getState().raw?.economy?.manualSystem;
  const gradeFromPavilion =
    (pavilion?.gradeSold as ManualGrade | undefined) ?? null;
  if (gradeFromPavilion) return gradeFromPavilion;
  const prices = (economy as any)?.pavilions?.manualPricesByCityIndex as
    | Array<{ grade?: ManualGrade }>
    | undefined;
  const entry = prices?.[clampCityIndex(prices, cityIndex)];
  return (entry?.grade as ManualGrade) ?? "mortal";
}

function getPriceForRarity(
  cityIndex: number,
  rarity: ManualRarity,
): {
  price: Partial<Record<"gold" | "spiritStones" | "merit", string>>;
  notSold?: boolean;
} {
  const economy = useContentStore.getState().raw?.economy?.manualSystem;
  const prices = (economy as any)?.pavilions?.manualPricesByCityIndex as
    | Array<{
        grade?: ManualGrade;
        prices?: Record<
          ManualRarity | "ultimate",
          {
            gold?: number;
            spiritStones?: number;
            merit?: number;
            notSold?: boolean;
          }
        >;
      }>
    | undefined;
  const entry = prices?.[clampCityIndex(prices, cityIndex)];
  const rarityPrices = entry?.prices?.[rarity] ?? null;
  if (!rarityPrices || rarityPrices.notSold) {
    return { price: {}, notSold: !!rarityPrices?.notSold };
  }
  const result: Partial<Record<"gold" | "spiritStones" | "merit", string>> = {};
  (["gold", "spiritStones", "merit"] as const).forEach((key) => {
    const value = rarityPrices[key];
    if (value !== undefined && value !== null) {
      result[key] = value.toString();
    }
  });
  return { price: result };
}

function buildSlotPlan(
  visibleSlots: number,
): Array<{ slotIndex: number; shelf: PavilionStockSlot["shelf"] }> {
  const economy = useContentStore.getState().raw?.economy?.manualSystem;
  const slotTypes = (economy as any)?.pavilions?.slotTypes ?? {};
  const mapping: Record<number, PavilionStockSlot["shelf"]> = {};
  Object.entries(slotTypes).forEach(([slotTypeKey, slotConfig]) => {
    const shelf: PavilionStockSlot["shelf"] =
      slotTypeKey === "featured"
        ? "featured"
        : slotTypeKey === "rareSlot"
          ? "rare"
          : slotTypeKey === "advanced"
            ? "advanced"
            : "common";
    const slots = (slotConfig as { slots?: number[] })?.slots ?? [];
    slots.forEach((idx) => {
      mapping[idx] = shelf;
    });
  });

  return Array.from({ length: visibleSlots }, (_, i) => {
    const slotIndex = i + 1;
    const shelf = slotIndex in mapping ? mapping[slotIndex] : "filler";
    return { slotIndex, shelf };
  });
}

function summarizeHistory(
  slots: PavilionStockSlot[],
  generatedAt: number,
): PavilionStockState["history"][number] {
  const featured = slots.find((slot) => slot.shelf === "featured");
  const rares = slots
    .filter((slot) => slot.shelf === "rare")
    .map((slot) => ({
      techniqueId: slot.techniqueId,
      rarity: slot.rarity,
      grade: slot.grade,
    }));
  return {
    at: generatedAt,
    featured: featured
      ? {
          techniqueId: featured.techniqueId,
          rarity: featured.rarity,
          grade: featured.grade,
        }
      : undefined,
    rares: rares.length > 0 ? rares : undefined,
  };
}

function generateStock(
  pavilionId: string,
  now: number,
  previous?: PavilionStockState,
  context?: PavilionGenerationContext,
): PavilionStockState {
  const content = useContentStore.getState();
  const pavilion = content.maps.pavilionsById[pavilionId];
  const economy = content.raw?.economy?.manualSystem;
  const freeRefreshHours = Number(
    (economy as any)?.pavilions?.refresh?.freeRefreshHours ?? 6,
  );
  const pityRules = {
    featuredEpicPityToGuarantee: Number(
      (economy as any)?.pavilions?.refresh?.pity?.featuredEpicPityToGuarantee ??
        10,
    ),
    featuredLegendaryPityToGuarantee: Number(
      (economy as any)?.pavilions?.refresh?.pity
        ?.featuredLegendaryPityToGuarantee ?? 30,
    ),
  };

  if (!content.isLoaded || !pavilion) {
    const cityId = pavilion?.cityId ?? "unknown_city";
    const cityIndex = pavilion?.cityIndex ?? 0;
    return (
      previous ?? {
        pavilionId,
        cityId,
        cityIndex,
        generatedAt: now,
        nextRefreshAt: now + freeRefreshHours * 60 * 60 * 1000,
        rngSeed: stringToSeed(`${pavilionId}:${now}`),
        slots: [],
        pity: { featuredEpic: 0, featuredLegendary: 0 },
        history: [],
      }
    );
  }

  const cityId = pavilion.cityId ?? "unknown_city";
  const cityIndex = pavilion.cityIndex ?? 0;
  const coreSlots = Number((economy as any)?.pavilions?.stockSlots ?? 10);
  const visibleSlots = Math.max(coreSlots, getVisibleSlotCount(cityIndex));
  const plan = buildSlotPlan(visibleSlots);

  const grade = determineGrade(pavilionId, cityIndex);
  const candidates = buildTechniqueCandidates(pavilionId);
  const usedCore = new Set<string>();
  const usedAll = new Set<string>();

  let seed = previous
    ? nextSeed(previous.rngSeed)
    : stringToSeed(`${pavilionId}:${now}`);
  let pity = previous?.pity ?? { featuredEpic: 0, featuredLegendary: 0 };
  const slots: PavilionStockSlot[] = [];

  plan.forEach((slotPlan, idx) => {
    const isCore = idx < coreSlots;
    const slotTypeWeights =
      slotPlan.shelf === "filler"
        ? FILLER_RARITY_WEIGHTS
        : normalizeRarityWeights(
            ((economy as any)?.pavilions?.slotTypes?.[
              slotPlan.shelf === "rare" ? "rareSlot" : slotPlan.shelf
            ]?.weights as Record<string, number>) ?? {},
          );
    const adjustedWeights =
      slotPlan.shelf === "featured" || slotPlan.shelf === "rare"
        ? applyCityModifiers(slotTypeWeights, cityId, cityIndex)
        : slotTypeWeights;
    const rarityResult = rollRarity(
      seed,
      adjustedWeights,
      pity,
      pityRules,
      slotPlan.shelf === "featured",
    );
    seed = rarityResult.seed;
    pity = rarityResult.pity;
    const allowDuplicates = slotPlan.shelf === "filler";
    const pick = pickTechnique(
      seed,
      candidates,
      rarityResult.rarity,
      isCore ? usedCore : usedAll,
      allowDuplicates,
    );
    seed = pick.seed;
    usedAll.add(pick.techniqueId);
    if (isCore) {
      usedCore.add(pick.techniqueId);
    }
    const { price, notSold } = getPriceForRarity(
      cityIndex,
      rarityResult.rarity,
    );
    slots.push({
      slotIndex: slotPlan.slotIndex,
      shelf: slotPlan.shelf,
      techniqueId: pick.techniqueId,
      grade,
      rarity: rarityResult.rarity,
      price,
      notSold,
      sold: false,
    });
  });

  const corrected = applyPavilionCorrectionPass({
    pavilionId,
    slots,
    candidates,
    context,
  });
  const historyEntry = summarizeHistory(
    corrected.slots.filter((slot) => slot.slotIndex <= coreSlots),
    now,
  );
  const history = previous ? [...(previous.history ?? [])] : [];
  history.push(historyEntry);
  while (history.length > 3) history.shift();

  return {
    pavilionId,
    cityId,
    cityIndex,
    generatedAt: now,
    nextRefreshAt: now + freeRefreshHours * 60 * 60 * 1000,
    rngSeed: seed,
    slots: corrected.slots,
    pity,
    history,
  };
}

export function buildInitialStock(
  pavilionId: string,
  now: number,
  context?: PavilionGenerationContext,
): PavilionStockState {
  return generateStock(pavilionId, now, undefined, context);
}

export function refreshStock(
  prev: PavilionStockState,
  now: number,
  context?: PavilionGenerationContext,
): PavilionStockState {
  return generateStock(prev.pavilionId, now, prev, context);
}

function runPitySanityChecks() {
  const rules = {
    featuredEpicPityToGuarantee: 10,
    featuredLegendaryPityToGuarantee: 30,
  };
  const base = { featuredEpic: 0, featuredLegendary: 0 };
  const afterThreeCommons = simulateFeaturedPity(
    base,
    ["common", "common", "common"],
    rules,
  );
  const afterEpic = simulateFeaturedPity(base, ["epic"], rules);
  const afterLegendary = simulateFeaturedPity(
    { featuredEpic: 5, featuredLegendary: 5 },
    ["legendary"],
    rules,
  );
  const epicGuarantee = rollRarity(
    0,
    { common: 1 },
    {
      featuredEpic: rules.featuredEpicPityToGuarantee - 1,
      featuredLegendary: 0,
    },
    rules,
    true,
  );
  const legendaryGuarantee = rollRarity(
    0,
    { common: 1 },
    {
      featuredEpic: rules.featuredEpicPityToGuarantee,
      featuredLegendary: rules.featuredLegendaryPityToGuarantee - 1,
    },
    rules,
    true,
  );

  const issues: string[] = [];
  if (
    afterThreeCommons.featuredEpic !== 3 ||
    afterThreeCommons.featuredLegendary !== 3
  ) {
    issues.push("Featured pity should increment on non-epic/legendary rolls.");
  }
  if (afterEpic.featuredEpic !== 0 || afterEpic.featuredLegendary !== 1) {
    issues.push("Epic pity should reset epic counter and increment legendary.");
  }
  if (
    afterLegendary.featuredEpic !== 0 ||
    afterLegendary.featuredLegendary !== 0
  ) {
    issues.push("Legendary pity should reset both counters.");
  }
  if (epicGuarantee.rarity !== "epic") {
    issues.push("Epic pity guarantee did not trigger.");
  }
  if (legendaryGuarantee.rarity !== "legendary") {
    issues.push("Legendary pity guarantee did not trigger.");
  }

  if (issues.length && typeof console !== "undefined") {
    console.warn("[Pavilion Pity Sanity]", issues.join(" "));
  }
}

if (import.meta.env?.DEV) {
  runPitySanityChecks();
}
