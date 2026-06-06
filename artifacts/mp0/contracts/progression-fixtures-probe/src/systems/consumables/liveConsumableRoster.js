import { buildLiveEconomyCatalog } from '../economy/liveEconomyCatalog.js';
const CANONICAL_ROSTER = {
    cons_healing_pellet_t1: { itemId: 'cons_healing_pellet_t1', domain: 'combat', family: 'healing' },
    cons_ironblood_pellet_t1: { itemId: 'cons_ironblood_pellet_t1', domain: 'combat', family: 'defense' },
    cons_ironblood_pellet_t2: { itemId: 'cons_ironblood_pellet_t2', domain: 'combat', family: 'defense' },
    cons_windstep_powder_t1: { itemId: 'cons_windstep_powder_t1', domain: 'combat', family: 'evasion' },
    cons_windstep_powder_t2: { itemId: 'cons_windstep_powder_t2', domain: 'combat', family: 'evasion' },
    cons_ward_salt_t1: { itemId: 'cons_ward_salt_t1', domain: 'combat', family: 'ward' },
    cons_ward_salt_t2: { itemId: 'cons_ward_salt_t2', domain: 'combat', family: 'ward' },
    cons_anti_venom_pellet_t1: { itemId: 'cons_anti_venom_pellet_t1', domain: 'combat', family: 'utility' },
    cons_focus_tonic_t1: { itemId: 'cons_focus_tonic_t1', domain: 'combat', family: 'utility' },
    cons_mastery_tonic_t1: { itemId: 'cons_mastery_tonic_t1', domain: 'combat', family: 'utility' },
    cons_qi_elixir_t1: { itemId: 'cons_qi_elixir_t1', domain: 'cultivation', family: 'circulation' },
    cons_qi_elixir_t2: { itemId: 'cons_qi_elixir_t2', domain: 'cultivation', family: 'circulation' },
    cons_meridian_warmth_draft_t1: { itemId: 'cons_meridian_warmth_draft_t1', domain: 'cultivation', family: 'warmth' },
    cons_quiet_breath_tea_t1: { itemId: 'cons_quiet_breath_tea_t1', domain: 'cultivation', family: 'doctrine' },
    cons_purity_elixir_t1: { itemId: 'cons_purity_elixir_t1', domain: 'cultivation', family: 'breakthrough' },
    cons_tribulation_buffer_t1: { itemId: 'cons_tribulation_buffer_t1', domain: 'cultivation', family: 'breakthrough' },
};
export function buildLiveConsumableRoster(content) {
    const catalog = buildLiveEconomyCatalog(content);
    const shopItemIds = new Set(content.apothecary_shops.flatMap((shop) => shop.stock.map((entry) => entry.itemId)));
    const brewItemIds = new Set(content.alchemy_recipes.flatMap((recipe) => Object.keys(recipe.outputs ?? {})));
    return Object.values(CANONICAL_ROSTER).flatMap((entry) => {
        const item = content.items.find((candidate) => candidate.id === entry.itemId);
        if (!item)
            return [];
        const runtimeStatus = catalog.itemStatusById[entry.itemId] ?? 'unknown';
        const status = runtimeStatus === 'visible_live' || runtimeStatus === 'visible_live_blocked'
            ? 'live'
            : runtimeStatus === 'migration_refund_only' || runtimeStatus === 'hidden_deferred'
                ? 'deferred'
                : 'hidden';
        const isShop = shopItemIds.has(entry.itemId);
        const isBrew = brewItemIds.has(entry.itemId);
        const availability = status !== 'live'
            ? 'hidden'
            : isShop && isBrew
                ? 'shop_and_brew'
                : isShop
                    ? 'shop'
                    : isBrew
                        ? 'brew'
                        : 'hidden';
        return [{
                ...entry,
                status,
                availability,
                usage: item.usage ?? (entry.domain === 'cultivation' ? 'cultivate_only' : 'combat_only'),
            }];
    }).sort((a, b) => a.itemId.localeCompare(b.itemId));
}
export function getLiveConsumableRoster(content) {
    return buildLiveConsumableRoster(content);
}
export function getLiveConsumableRosterEntry(content, itemId) {
    return buildLiveConsumableRoster(content).find((entry) => entry.itemId === itemId) ?? null;
}
