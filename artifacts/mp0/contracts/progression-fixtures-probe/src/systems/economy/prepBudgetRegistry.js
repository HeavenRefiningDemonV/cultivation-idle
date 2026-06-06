import { GATE_PREP_PACKAGE_CATALOG } from '../../features/apothecary/gatePrepPackageCatalog.js';
import { ECONOMIC_TRANSITION_META, } from './economicConstants.js';
function cloneSupplementLane(lane) {
    return {
        key: lane.key,
        label: lane.label,
        qty: lane.qty,
        optionItemIds: [...lane.optionItemIds],
        pathBiasMode: 'as_applicable',
    };
}
function getRecommendedPackageByTransitionId(transitionId) {
    const packageDef = GATE_PREP_PACKAGE_CATALOG.find((entry) => entry.transitionId === transitionId);
    if (!packageDef) {
        throw new Error(`[PrepBudgetRegistry] Missing gate-prep package for ${transitionId}`);
    }
    return {
        directCore: packageDef.directCore.map((line) => ({ ...line })),
        supplementLanes: packageDef.supplementLanes.map(cloneSupplementLane),
    };
}
export const PREP_BUDGET_REGISTRY = [
    {
        ...ECONOMIC_TRANSITION_META.qi_condensation_to_foundation,
        transitionId: 'qi_condensation_to_foundation',
        minimumPrepPackage: {
            forgeFloor: {
                weaponRefine: 2,
                accessoryRefine: 1,
                temperSuccesses: 1,
                runeRecommendation: { minimum: 0, recommendedLow: 0, recommendedHigh: 0, note: 'No rune required yet.' },
            },
            stockPackage: {
                directCore: [
                    { itemId: 'cons_healing_pellet_t1', qty: 10 },
                    { itemId: 'cons_ironblood_pellet_t1', qty: 4 },
                    { itemId: 'cons_qi_elixir_t1', qty: 4 },
                ],
                supplementLanes: [],
            },
            backgroundExpectations: [
                { key: 'expedition_complete', qty: 1 },
                { key: 'ruins_run', qty: 1, note: 'strongly encouraged' },
            ],
            goldSpendRange: { minimum: 4000, recommended: 6000 },
        },
        recommendedPrepPackage: {
            forgeFloor: {
                weaponRefine: 3,
                accessoryRefine: 2,
                temperSuccesses: 1,
                runeRecommendation: { minimum: 0, recommendedLow: 0, recommendedHigh: 0, note: 'No rune required yet.' },
            },
            stockPackage: getRecommendedPackageByTransitionId('qi_condensation_to_foundation'),
            backgroundExpectations: [
                { key: 'ruins_run', qty: 1 },
                { key: 'bounty_claim', qty: 1 },
            ],
            goldSpendRange: { minimum: 9000, recommended: 12000 },
        },
    },
    {
        ...ECONOMIC_TRANSITION_META.foundation_to_core_formation,
        transitionId: 'foundation_to_core_formation',
        minimumPrepPackage: {
            forgeFloor: {
                weaponRefine: 4,
                accessoryRefine: 3,
                temperSuccesses: 1,
                runeRecommendation: { minimum: 0, recommendedLow: 0, recommendedHigh: 0, note: 'No rune required yet.' },
            },
            stockPackage: {
                directCore: [
                    { itemId: 'cons_healing_pellet_t1', qty: 20 },
                    { itemId: 'cons_windstep_powder_t1', qty: 3 },
                    { itemId: 'cons_ward_salt_t1', qty: 3 },
                    { itemId: 'cons_meridian_warmth_draft_t1', qty: 3 },
                ],
                supplementLanes: [],
            },
            backgroundExpectations: [
                { key: 'expedition_complete', qty: 1, note: 'mine expedition' },
                { key: 'ruins_run', qty: 1, note: 'Stonecrag Ruin run' },
            ],
            goldSpendRange: { minimum: 20000, recommended: 28000 },
        },
        recommendedPrepPackage: {
            forgeFloor: {
                weaponRefine: 5,
                accessoryRefine: 4,
                temperSuccesses: 2,
                runeRecommendation: { minimum: 0, recommendedLow: 0, recommendedHigh: 0, note: 'No rune required yet.' },
            },
            stockPackage: getRecommendedPackageByTransitionId('foundation_to_core_formation'),
            backgroundExpectations: [
                { key: 'bounty_claim', qty: 2, note: 'across city 1–2 combined' },
                { key: 'ruins_run', qty: 2, note: 'Stonecrag Ruin runs' },
            ],
            goldSpendRange: { minimum: 45000, recommended: 60000 },
        },
    },
    {
        ...ECONOMIC_TRANSITION_META.core_formation_to_nascent_soul,
        transitionId: 'core_formation_to_nascent_soul',
        minimumPrepPackage: {
            forgeFloor: {
                weaponRefine: 6,
                accessoryRefine: 5,
                temperSuccesses: 2,
                runeRecommendation: { minimum: 0, recommendedLow: 0, recommendedHigh: 1, note: 'Optional, but 1 rune recommended if available.' },
            },
            stockPackage: {
                directCore: [
                    { itemId: 'cons_healing_pellet_t1', qty: 20 },
                    { itemId: 'cons_focus_tonic_t1', qty: 3 },
                    { itemId: 'cons_qi_elixir_t2', qty: 3 },
                ],
                supplementLanes: [
                    {
                        key: 'defensive_specialty',
                        label: 'Defensive specialty support',
                        qty: 3,
                        optionItemIds: ['cons_focus_tonic_t1', 'cons_ward_salt_t1'],
                        pathBiasMode: 'as_applicable',
                    },
                ],
            },
            backgroundExpectations: [
                { key: 'expedition_complete', qty: 1, note: 'scout or mine expedition' },
                { key: 'ruins_run', qty: 1, note: 'Spirit Cavern Ruin run' },
            ],
            goldSpendRange: { minimum: 80000, recommended: 110000 },
        },
        recommendedPrepPackage: {
            forgeFloor: {
                weaponRefine: 7,
                accessoryRefine: 6,
                temperSuccesses: 3,
                runeRecommendation: { minimum: 1, recommendedLow: 1, recommendedHigh: 1, note: '1 rune recommended.' },
            },
            stockPackage: getRecommendedPackageByTransitionId('core_formation_to_nascent_soul'),
            backgroundExpectations: [
                { key: 'ruins_run', qty: 2, note: 'Spirit Cavern Ruin runs' },
                { key: 'expedition_complete', qty: 2, note: 'completed during this city phase' },
            ],
            goldSpendRange: { minimum: 180000, recommended: 240000 },
        },
    },
    {
        ...ECONOMIC_TRANSITION_META.nascent_soul_to_soul_formation,
        transitionId: 'nascent_soul_to_soul_formation',
        minimumPrepPackage: {
            forgeFloor: {
                weaponRefine: 8,
                accessoryRefine: 7,
                temperSuccesses: 3,
                runeRecommendation: { minimum: 1, recommendedLow: 1, recommendedHigh: 1, note: '1 rune recommended.' },
            },
            stockPackage: {
                directCore: [
                    { itemId: 'cons_healing_pellet_t1', qty: 25 },
                    { itemId: 'cons_anti_venom_pellet_t1', qty: 4 },
                    { itemId: 'cons_quiet_breath_tea_t1', qty: 3 },
                ],
                supplementLanes: [
                    {
                        key: 'combat_specialty',
                        label: 'Defensive or offensive specialty',
                        qty: 4,
                        optionItemIds: ['cons_anti_venom_pellet_t1', 'cons_focus_tonic_t1', 'cons_ward_salt_t1'],
                        pathBiasMode: 'as_applicable',
                    },
                ],
            },
            backgroundExpectations: [{ key: 'ruins_run', qty: 2, note: 'Lotusford Ruin runs' }],
            goldSpendRange: { minimum: 300000, recommended: 420000 },
        },
        recommendedPrepPackage: {
            forgeFloor: {
                weaponRefine: 9,
                accessoryRefine: 8,
                temperSuccesses: 4,
                runeRecommendation: { minimum: 2, recommendedLow: 2, recommendedHigh: 2, note: '2 runes recommended.' },
            },
            stockPackage: getRecommendedPackageByTransitionId('nascent_soul_to_soul_formation'),
            backgroundExpectations: [
                { key: 'ruins_run', qty: 3, note: 'Lotusford Ruin runs' },
                { key: 'long_expedition_complete', qty: 1 },
                { key: 'medium_expedition_complete', qty: 1 },
            ],
            goldSpendRange: { minimum: 700000, recommended: 950000 },
        },
    },
    {
        ...ECONOMIC_TRANSITION_META.soul_formation_to_spirit_severing,
        transitionId: 'soul_formation_to_spirit_severing',
        minimumPrepPackage: {
            forgeFloor: {
                weaponRefine: 10,
                accessoryRefine: 9,
                temperSuccesses: 4,
                runeRecommendation: { minimum: 2, recommendedLow: 2, recommendedHigh: 2, note: '2 runes recommended.' },
            },
            stockPackage: {
                directCore: [
                    { itemId: 'cons_healing_pellet_t1', qty: 30 },
                    { itemId: 'cons_ironblood_pellet_t2', qty: 4 },
                    { itemId: 'cons_windstep_powder_t2', qty: 4 },
                    { itemId: 'cons_ward_salt_t2', qty: 4 },
                    { itemId: 'cons_mastery_tonic_t1', qty: 2 },
                ],
                supplementLanes: [],
            },
            backgroundExpectations: [{ key: 'ruins_run', qty: 2, note: 'Ironpeak Ruin runs' }],
            goldSpendRange: { minimum: 1000000, recommended: 1400000 },
        },
        recommendedPrepPackage: {
            forgeFloor: {
                weaponRefine: 10,
                accessoryRefine: 10,
                temperSuccesses: 5,
                runeRecommendation: { minimum: 2, recommendedLow: 2, recommendedHigh: 3, note: '2–3 runes recommended.' },
            },
            stockPackage: getRecommendedPackageByTransitionId('soul_formation_to_spirit_severing'),
            backgroundExpectations: [
                { key: 'ruins_run', qty: 3, note: 'Ironpeak Ruin runs' },
                { key: 'long_expedition_complete', qty: 2, note: 'completed during this city phase' },
            ],
            goldSpendRange: { minimum: 2300000, recommended: 3200000 },
        },
    },
];
export const PREP_BUDGET_REGISTRY_BY_GATE_INDEX = Object.fromEntries(PREP_BUDGET_REGISTRY.map((entry) => [entry.gateIndex, entry]));
export const PREP_BUDGET_REGISTRY_BY_TRANSITION_ID = Object.fromEntries(PREP_BUDGET_REGISTRY.map((entry) => [entry.transitionId, entry]));
export const PREP_BUDGET_REGISTRY_BY_FROM_REALM = Object.fromEntries(PREP_BUDGET_REGISTRY.map((entry) => [entry.fromRealmId, entry]));
export const PREP_BUDGET_REGISTRY_BY_CITY_ID = Object.fromEntries(PREP_BUDGET_REGISTRY.map((entry) => [entry.cityId, entry]));
export function getAllPrepBudgetRegistryEntries() {
    return [...PREP_BUDGET_REGISTRY];
}
export function getPrepBudgetByGateIndex(gateIndex) {
    return PREP_BUDGET_REGISTRY_BY_GATE_INDEX[gateIndex] ?? null;
}
export function getPrepBudgetByTransitionId(transitionId) {
    if (!transitionId)
        return null;
    return PREP_BUDGET_REGISTRY_BY_TRANSITION_ID[transitionId] ?? null;
}
export function getPrepBudgetByCurrentRealmId(realmId) {
    if (!realmId)
        return null;
    return PREP_BUDGET_REGISTRY_BY_FROM_REALM[realmId] ?? null;
}
export function getPrepBudgetByNextCityId(cityId) {
    if (!cityId)
        return null;
    return PREP_BUDGET_REGISTRY_BY_CITY_ID[cityId] ?? null;
}
