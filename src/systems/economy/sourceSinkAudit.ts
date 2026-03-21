import { normalizeForgeBlueprint } from '../../content/forge.js';
import { createLiveEconomyCatalog, listVisibleAlchemyRecipes, listVisibleForgeBlueprints } from './liveEconomyCatalog.js';
import type { LiveEconomyAuditReport, LiveEconomyContentSnapshot, LiveEconomyFlowRef, LiveEconomyItemAuditEntry, LiveEconomyReagentPathIssue } from './liveEconomyTypes.js';

function pushFlow(map: Map<string, LiveEconomyFlowRef[]>, itemId: string, entry: LiveEconomyFlowRef): void {
  const list = map.get(itemId) ?? [];
  list.push(entry);
  map.set(itemId, list);
}

function inferFamily(itemId: string, category?: string): string {
  if (itemId.startsWith('mat_')) return 'material';
  if (itemId.startsWith('reagent_')) return 'reagent';
  if (itemId.startsWith('cons_')) return 'consumable';
  if (itemId.startsWith('rune_')) return 'rune';
  return category ?? 'other';
}

function inferRole(itemId: string, category?: string): string {
  if (itemId === 'mat_technique_fragment') return 'technique_fragment';
  if (itemId.startsWith('frag_manual_')) return 'manual_fragment';
  if (itemId.startsWith('mat_')) return 'craft_material';
  if (itemId.startsWith('reagent_')) return 'craft_reagent';
  if (itemId.startsWith('cons_')) return 'crafted_consumable';
  if (itemId.startsWith('rune_')) return 'forge_output';
  return category ?? 'other';
}

export function buildLiveEconomySourceSinkAudit(content: LiveEconomyContentSnapshot): LiveEconomyAuditReport {
  const catalog = createLiveEconomyCatalog(content);
  const visibleAlchemy = listVisibleAlchemyRecipes(content);
  const visibleForge = listVisibleForgeBlueprints(content);
  const sourceMap = new Map<string, LiveEconomyFlowRef[]>();
  const sinkMap = new Map<string, LiveEconomyFlowRef[]>();

  content.outskirts.forEach((outskirts) => {
    Object.entries(outskirts.matPools ?? {}).forEach(([poolName, itemIds]) => {
      itemIds.forEach((itemId) => {
        pushFlow(sourceMap, itemId, { kind: 'outskirts', sourceId: outskirts.id, itemId, detail: poolName });
      });
    });
  });

  content.ruins.forEach((ruin) => {
    const tables = [
      { sourceId: `${ruin.id}:dropsPerRoom`, table: ruin.dropsPerRoom },
      { sourceId: `${ruin.id}:finalChestDrops`, table: ruin.finalChestDrops },
    ];
    tables.forEach(({ sourceId, table }) => {
      table.pool.forEach((entry) => pushFlow(sourceMap, entry.itemId, { kind: 'ruins', sourceId, itemId: entry.itemId, qty: entry.qtyMax }));
      (table.guaranteed ?? []).forEach((entry) => pushFlow(sourceMap, entry.itemId, { kind: 'ruins', sourceId: `${sourceId}:guaranteed`, itemId: entry.itemId, qty: entry.qty }));
    });
  });

  content.expeditions.cityYields.forEach((cityYield) => {
    Object.entries(cityYield.yieldsByTag ?? {}).forEach(([tag, bundle]) => {
      (bundle.items ?? []).forEach((entry) => {
        pushFlow(sourceMap, entry.itemId, { kind: 'expedition', sourceId: `city_${cityYield.cityIndex}:${tag}`, itemId: entry.itemId, qty: entry.qty });
      });
    });
  });

  content.expeditions.types.forEach((type) => {
    (type.rareDrops ?? []).forEach((entry) => {
      pushFlow(sourceMap, entry.itemId, { kind: 'expedition', sourceId: `${type.id}:rareDrops`, itemId: entry.itemId, qty: entry.qty });
    });
  });

  content.apothecary_shops.forEach((shop) => {
    shop.stock.forEach((entry) => {
      const status = catalog.itemStatuses[entry.itemId];
      if (status === 'visible_live' || status === 'visible_live_blocked') {
        pushFlow(sourceMap, entry.itemId, { kind: 'apothecary_shop', sourceId: shop.id, itemId: entry.itemId, qty: entry.qty ?? 1 });
      }
    });
  });


  [
    { itemId: 'mat_rune_dust', sourceId: 'technique_rank_up' },
    { itemId: 'reagent_soul_ink_t0', sourceId: 'technique_rank_up' },
    { itemId: 'reagent_soul_ink_t1', sourceId: 'technique_rank_up' },
    { itemId: 'reagent_soul_ink_t2', sourceId: 'technique_rank_up' },
    { itemId: 'reagent_soul_ink_t0', sourceId: 'technique_trait_reroll' },
  ].forEach(({ itemId, sourceId }) => {
    pushFlow(sinkMap, itemId, { kind: 'forge_input', sourceId, itemId, qty: 1, detail: 'runtime_system_sink' });
  });

  visibleAlchemy.forEach((recipe) => {
    Object.entries(recipe.outputs ?? {}).forEach(([itemId, qty]) => {
      pushFlow(sourceMap, itemId, { kind: 'alchemy_output', sourceId: recipe.id, itemId, qty });
    });
    Object.entries(recipe.inputs ?? {}).forEach(([itemId, qty]) => {
      pushFlow(sinkMap, itemId, { kind: 'alchemy_input', sourceId: recipe.id, itemId, qty });
    });
  });

  visibleForge.forEach((blueprint) => {
    if (blueprint.output?.itemId) {
      pushFlow(sourceMap, blueprint.output.itemId, { kind: 'forge_output', sourceId: blueprint.id, itemId: blueprint.output.itemId, qty: blueprint.output.qty });
    }
    blueprint.costs.items.forEach((entry) => {
      pushFlow(sinkMap, entry.itemId, { kind: 'forge_input', sourceId: blueprint.id, itemId: entry.itemId, qty: entry.qty });
    });
  });

  const visibleItemIds = new Set(catalog.visibleItemIds);
  const items: LiveEconomyItemAuditEntry[] = content.items
    .filter((item) => visibleItemIds.has(item.id))
    .map((item) => {
      const liveSources = sourceMap.get(item.id) ?? [];
      const liveSinks = sinkMap.get(item.id) ?? [];
      const role = inferRole(item.id, item.category);
      const sinkRelevant = role === 'craft_material' || role === 'craft_reagent';
      const blocked = sinkRelevant && liveSources.length > 0 && liveSinks.length === 0;
      return {
        itemId: item.id,
        runtimeStatus: catalog.itemStatuses[item.id] ?? 'unknown',
        family: inferFamily(item.id, item.category),
        role,
        liveSources,
        liveSinks,
        blocked,
      };
    })
    .sort((a, b) => a.itemId.localeCompare(b.itemId));

  const reagentPathIssues: LiveEconomyReagentPathIssue[] = visibleForge
    .flatMap((blueprint) =>
      blueprint.costs.items
        .filter((entry) => {
          const status = catalog.itemStatuses[entry.itemId];
          return (status === 'visible_live' || status === 'visible_live_blocked') && (sourceMap.get(entry.itemId)?.length ?? 0) === 0;
        })
        .map((entry) => {
          return {
            blueprintId: blueprint.id,
            missingInputItemId: entry.itemId,
            runtimeStatus: catalog.forgeBlueprintStatuses[blueprint.id] ?? 'unknown',
            blocked: false,
          };
        }),
    )
    .sort((a, b) => `${a.blueprintId}:${a.missingInputItemId}`.localeCompare(`${b.blueprintId}:${b.missingInputItemId}`));

  return {
    items,
    reagentPathIssues,
    blockedItemIds: items.filter((entry) => entry.blocked).map((entry) => entry.itemId),
    blockedBlueprintIds: reagentPathIssues.filter((entry) => entry.blocked).map((entry) => entry.blueprintId),
  };
}

export function getRawForgeBlueprintById(content: LiveEconomyContentSnapshot, blueprintId: string) {
  const rawBlueprint = content.forge_blueprints.find((entry) => entry.id === blueprintId);
  return rawBlueprint ? normalizeForgeBlueprint(rawBlueprint) : undefined;
}
