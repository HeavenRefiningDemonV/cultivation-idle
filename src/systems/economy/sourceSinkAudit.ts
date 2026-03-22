import { normalizeForgeBlueprint } from '../../content/forge.js';
import type { ApothecaryShopDef, ExpeditionCityYieldDef, OutskirtsDef, RuinDef } from '../../content/types.js';
import type { ValidatedContent } from '../../content/validators.js';
import { getKnownLiveEconomyBlocker, listKnownLiveEconomyBlockers } from './knownLiveEconomyBlockers.js';
import { buildLiveEconomyCatalog, getVisibleAlchemyRecipes, getVisibleForgeBlueprints } from './liveEconomyCatalog.js';
import { getLiveEconomyItemFamily } from './liveEconomyVisibility.js';
import type { LiveEconomyAuditReport, LiveEconomyItemAudit, LiveEconomyRouteRef, LiveReagentPathAudit } from './liveEconomyTypes.js';

const TECHNIQUE_REROLL_SINK_ITEM_ID = 'reagent_soul_ink_t0';

function pushRoute(map: Map<string, LiveEconomyRouteRef[]>, route: LiveEconomyRouteRef) {
  const list = map.get(route.itemId) ?? [];
  list.push(route);
  map.set(route.itemId, list);
}

function collectOutskirtsSources(outskirts: OutskirtsDef[], map: Map<string, LiveEconomyRouteRef[]>) {
  outskirts.forEach((zone) => {
    const common = zone.matPools?.common ?? [];
    const rare = zone.matPools?.rare ?? [];
    [...common, ...rare].forEach((itemId) => pushRoute(map, { kind: 'outskirts', refId: zone.id, itemId }));
  });
}

function collectRuinSources(ruins: RuinDef[], map: Map<string, LiveEconomyRouteRef[]>) {
  ruins.forEach((ruin) => {
    ruin.dropsPerRoom.pool.forEach((entry) => pushRoute(map, { kind: 'ruins_room', refId: ruin.id, itemId: entry.itemId }));
    ruin.finalChestDrops.pool.forEach((entry) => pushRoute(map, { kind: 'ruins_chest', refId: ruin.id, itemId: entry.itemId }));
    (ruin.finalChestDrops.guaranteed ?? []).forEach((entry) => pushRoute(map, { kind: 'ruins_chest', refId: ruin.id, itemId: entry.itemId, detail: 'guaranteed' }));
  });
}

function collectExpeditionSources(cityYields: ExpeditionCityYieldDef[], map: Map<string, LiveEconomyRouteRef[]>) {
  cityYields.forEach((cityYield) => {
    Object.entries(cityYield.yieldsByTag ?? {}).forEach(([tag, yieldDef]) => {
      (yieldDef?.items ?? []).forEach((entry) => pushRoute(map, { kind: 'expedition', refId: `city_${cityYield.cityIndex}:${tag}`, itemId: entry.itemId }));
    });
  });
}

function collectCraftRelevantItemIds(content: Pick<ValidatedContent, 'alchemy_recipes' | 'forge_blueprints'>): string[] {
  const ids = new Set<string>();
  content.alchemy_recipes.forEach((recipe) => {
    Object.keys(recipe.inputs ?? {}).forEach((itemId) => ids.add(itemId));
    Object.keys(recipe.outputs ?? {}).forEach((itemId) => ids.add(itemId));
  });
  content.forge_blueprints.forEach((blueprint) => {
    Object.keys(blueprint.inputs ?? {}).forEach((itemId) => ids.add(itemId));
    Object.keys(blueprint.outputs ?? {}).forEach((itemId) => ids.add(itemId));
    Object.keys(blueprint.cost ?? {}).forEach((itemId) => {
      if (!['gold', 'spiritStones', 'merit'].includes(itemId)) ids.add(itemId);
    });
  });
  return [...ids].sort();
}

function collectApothecarySources(shops: ApothecaryShopDef[], map: Map<string, LiveEconomyRouteRef[]>) {
  shops.forEach((shop) => {
    shop.stock.forEach((entry) => pushRoute(map, { kind: 'apothecary_shop', refId: shop.id, itemId: entry.itemId }));
  });
}

export function buildLiveEconomyAuditReport(content: ValidatedContent): LiveEconomyAuditReport {
  const catalog = buildLiveEconomyCatalog(content);
  const craftRelevantItemIds = collectCraftRelevantItemIds(content);
  const visibleAlchemyRecipes = getVisibleAlchemyRecipes(content);
  const visibleForgeBlueprints = getVisibleForgeBlueprints(content);
  const sourceMap = new Map<string, LiveEconomyRouteRef[]>();
  const sinkMap = new Map<string, LiveEconomyRouteRef[]>();

  collectOutskirtsSources(content.outskirts, sourceMap);
  collectRuinSources(content.ruins, sourceMap);
  collectExpeditionSources(content.expeditions.cityYields, sourceMap);
  collectApothecarySources(content.apothecary_shops, sourceMap);

  visibleAlchemyRecipes.forEach((recipe) => {
    Object.keys(recipe.outputs ?? {}).forEach((itemId) => pushRoute(sourceMap, { kind: 'alchemy_output', refId: recipe.id, itemId }));
    Object.keys(recipe.inputs ?? {}).forEach((itemId) => pushRoute(sinkMap, { kind: 'alchemy_input', refId: recipe.id, itemId }));
  });

  pushRoute(sinkMap, { kind: 'technique_reroll', refId: 'technique_reroll', itemId: TECHNIQUE_REROLL_SINK_ITEM_ID });

  visibleForgeBlueprints.forEach((blueprint) => {
    const normalized = normalizeForgeBlueprint(blueprint);
    if (normalized.output?.itemId) {
      pushRoute(sourceMap, { kind: 'forge_output', refId: blueprint.id, itemId: normalized.output.itemId });
    }
    normalized.costs.items.forEach((cost) => pushRoute(sinkMap, { kind: 'forge_input', refId: blueprint.id, itemId: cost.itemId }));
  });

  const trackedItemIds = new Set<string>();
  content.items.forEach((item) => {
    const status = catalog.itemStatusById[item.id] ?? 'unknown';
    if (status === 'visible_live' || status === 'visible_live_blocked') trackedItemIds.add(item.id);
  });
  sourceMap.forEach((_, itemId) => trackedItemIds.add(itemId));
  sinkMap.forEach((_, itemId) => trackedItemIds.add(itemId));

  const itemAudits: LiveEconomyItemAudit[] = [...trackedItemIds]
    .map((itemId) => {
      const item = content.items.find((entry) => entry.id === itemId);
      const blocker = getKnownLiveEconomyBlocker(itemId);
      const runtimeStatus = catalog.itemStatusById[itemId] ?? 'unknown';
      return {
        itemId,
        runtimeStatus,
        family: item ? getLiveEconomyItemFamily(item) : 'other',
        liveSources: sourceMap.get(itemId) ?? [],
        liveSinks: sinkMap.get(itemId) ?? [],
        isBlocked: Boolean(blocker),
        blockerReason: blocker?.reason,
      };
    })
    .sort((a, b) => a.itemId.localeCompare(b.itemId));

  const reagentPathAudits: LiveReagentPathAudit[] = visibleForgeBlueprints
    .filter((blueprint) => blueprint.service === 'refine')
    .map((blueprint) => {
      const missingDependencyIds = Object.keys(blueprint.inputs ?? {}).filter((itemId) => {
        const item = content.items.find((entry) => entry.id === itemId);
        if (!item || item.category !== 'reagent') return false;
        const sourceCount = (sourceMap.get(itemId) ?? []).length;
        return sourceCount === 0;
      });
      const blocker = getKnownLiveEconomyBlocker(blueprint.id);
      return {
        blueprintId: blueprint.id,
        runtimeStatus: catalog.forgeBlueprintStatusById[blueprint.id] ?? 'unknown',
        missingDependencyIds,
        isBlocked: Boolean(blocker),
        blockerReason: blocker?.reason,
      };
    })
    .filter((entry) => entry.missingDependencyIds.length > 0 || entry.isBlocked)
    .sort((a, b) => a.blueprintId.localeCompare(b.blueprintId));

  const activeBlockerIds = listKnownLiveEconomyBlockers().map((entry) => entry.id).sort();

  return { catalog, itemAudits, reagentPathAudits, activeBlockerIds, craftRelevantItemIds };
}

export function getSinklessLiveMaterials(report: LiveEconomyAuditReport): LiveEconomyItemAudit[] {
  return report.itemAudits.filter((entry) => {
    if (!['material', 'reagent'].includes(entry.family)) return false;
    if (entry.runtimeStatus !== 'visible_live' && entry.runtimeStatus !== 'visible_live_blocked') return false;
    if (!report.craftRelevantItemIds.includes(entry.itemId)) return false;
    return entry.liveSinks.length === 0;
  });
}
