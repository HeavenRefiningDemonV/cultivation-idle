import { APOTHECARY_STOCK_FLOORS } from './apothecaryStockFloors.js';
export const APOTHECARY_BUNDLE_CATALOG = {
    city_pinewind_hamlet: {
        cityId: 'city_pinewind_hamlet',
        nameSuffix: 'Readiness Bundle',
        description: 'Instant coverage for basic sustain, body-hardening, and early circulation prep.',
        lines: [
            { itemId: 'cons_healing_pellet_t1', targetQty: APOTHECARY_STOCK_FLOORS.healing.targetQty },
            { itemId: 'cons_ironblood_pellet_t1', targetQty: APOTHECARY_STOCK_FLOORS.specialty.targetQty },
            { itemId: 'cons_qi_elixir_t1', targetQty: APOTHECARY_STOCK_FLOORS.cultivation.targetQty },
        ],
    },
    city_stonecrag_town: {
        cityId: 'city_stonecrag_town',
        nameSuffix: 'Readiness Bundle',
        description: 'Fast buy-side coverage for sustain, mobility, warding, and meridian warmth.',
        lines: [
            { itemId: 'cons_healing_pellet_t1', targetQty: APOTHECARY_STOCK_FLOORS.healing.targetQty },
            { itemId: 'cons_windstep_powder_t1', targetQty: 2 },
            { itemId: 'cons_ward_salt_t1', targetQty: 2 },
            { itemId: 'cons_meridian_warmth_draft_t1', targetQty: APOTHECARY_STOCK_FLOORS.cultivation.targetQty },
        ],
    },
    city_spirit_cavern_city: {
        cityId: 'city_spirit_cavern_city',
        nameSuffix: 'Readiness Bundle',
        description: 'Keeps sustain, intent support, and qi circulation topped off for Core Formation pressure.',
        lines: [
            { itemId: 'cons_healing_pellet_t1', targetQty: APOTHECARY_STOCK_FLOORS.healing.targetQty },
            { itemId: 'cons_focus_tonic_t1', targetQty: APOTHECARY_STOCK_FLOORS.specialty.targetQty },
            { itemId: 'cons_qi_elixir_t2', targetQty: APOTHECARY_STOCK_FLOORS.cultivation.targetQty },
        ],
    },
    city_lotusford: {
        cityId: 'city_lotusford',
        nameSuffix: 'Readiness Bundle',
        description: 'Instant anti-venom, sustain, and breathing prep for Nascent Soul gate pressure.',
        lines: [
            { itemId: 'cons_healing_pellet_t1', targetQty: APOTHECARY_STOCK_FLOORS.healing.targetQty },
            { itemId: 'cons_anti_venom_pellet_t1', targetQty: APOTHECARY_STOCK_FLOORS.specialty.targetQty },
            { itemId: 'cons_quiet_breath_tea_t1', targetQty: APOTHECARY_STOCK_FLOORS.cultivation.targetQty },
        ],
    },
    city_ironpeak_bastion: {
        cityId: 'city_ironpeak_bastion',
        nameSuffix: 'Readiness Bundle',
        description: 'Late-semester shelf coverage for sustain, mastery, and the tier-two combat lines.',
        lines: [
            { itemId: 'cons_healing_pellet_t1', targetQty: APOTHECARY_STOCK_FLOORS.healing.targetQty },
            { itemId: 'cons_mastery_tonic_t1', targetQty: 3 },
            { itemId: 'cons_ironblood_pellet_t2', targetQty: APOTHECARY_STOCK_FLOORS.specialty.targetQty },
            { itemId: 'cons_windstep_powder_t2', targetQty: APOTHECARY_STOCK_FLOORS.specialty.targetQty },
            { itemId: 'cons_ward_salt_t2', targetQty: APOTHECARY_STOCK_FLOORS.specialty.targetQty },
        ],
    },
};
export function getApothecaryBundleCatalogEntry(shop) {
    if (!shop?.cityId)
        return null;
    return APOTHECARY_BUNDLE_CATALOG[shop.cityId] ?? null;
}
