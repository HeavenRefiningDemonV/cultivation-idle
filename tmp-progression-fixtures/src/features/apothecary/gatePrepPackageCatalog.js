export const GATE_PREP_PACKAGE_CATALOG = [
    {
        transitionId: 'qi_condensation_to_foundation',
        cityId: 'city_pinewind_hamlet',
        label: 'Qi Condensation → Foundation',
        directCore: [
            { itemId: 'cons_healing_pellet_t1', qty: 20 },
            { itemId: 'cons_ironblood_pellet_t1', qty: 8 },
            { itemId: 'cons_qi_elixir_t1', qty: 8 },
        ],
        supplementLanes: [],
    },
    {
        transitionId: 'foundation_to_core_formation',
        cityId: 'city_stonecrag_town',
        label: 'Foundation → Core Formation',
        directCore: [
            { itemId: 'cons_healing_pellet_t1', qty: 20 },
            { itemId: 'cons_windstep_powder_t1', qty: 4 },
            { itemId: 'cons_ward_salt_t1', qty: 4 },
            { itemId: 'cons_meridian_warmth_draft_t1', qty: 4 },
        ],
        supplementLanes: [],
    },
    {
        transitionId: 'core_formation_to_nascent_soul',
        cityId: 'city_spirit_cavern_city',
        label: 'Core Formation → Nascent Soul',
        directCore: [
            { itemId: 'cons_healing_pellet_t1', qty: 25 },
            { itemId: 'cons_focus_tonic_t1', qty: 4 },
            { itemId: 'cons_qi_elixir_t2', qty: 4 },
        ],
        supplementLanes: [
            {
                key: 'defensive_specialty',
                label: 'Defensive specialty support',
                qty: 4,
                optionItemIds: ['cons_focus_tonic_t1', 'cons_ward_salt_t1'],
            },
        ],
    },
    {
        transitionId: 'nascent_soul_to_soul_formation',
        cityId: 'city_lotusford',
        label: 'Nascent Soul → Soul Formation',
        directCore: [
            { itemId: 'cons_healing_pellet_t1', qty: 30 },
            { itemId: 'cons_anti_venom_pellet_t1', qty: 6 },
            { itemId: 'cons_quiet_breath_tea_t1', qty: 4 },
        ],
        supplementLanes: [
            {
                key: 'combat_specialty',
                label: 'Defensive or offensive specialty',
                qty: 5,
                optionItemIds: ['cons_anti_venom_pellet_t1', 'cons_focus_tonic_t1', 'cons_ward_salt_t1'],
            },
            {
                key: 'breakthrough_support',
                label: 'Breakthrough support',
                qty: 1,
                optionItemIds: ['cons_purity_elixir_t1'],
            },
        ],
    },
    {
        transitionId: 'soul_formation_to_spirit_severing',
        cityId: 'city_ironpeak_bastion',
        label: 'Soul Formation → Spirit Severing',
        directCore: [
            { itemId: 'cons_healing_pellet_t1', qty: 30 },
            { itemId: 'cons_ironblood_pellet_t2', qty: 6 },
            { itemId: 'cons_windstep_powder_t2', qty: 6 },
            { itemId: 'cons_ward_salt_t2', qty: 6 },
            { itemId: 'cons_mastery_tonic_t1', qty: 3 },
        ],
        supplementLanes: [
            {
                key: 'quiet_breath_or_purity',
                label: 'Quiet Breath or Purity support',
                qty: 1,
                optionItemIds: ['cons_quiet_breath_tea_t1', 'cons_purity_elixir_t1'],
            },
        ],
    },
];
export function getGatePrepPackageForCity(cityId) {
    if (!cityId)
        return null;
    return GATE_PREP_PACKAGE_CATALOG.find((entry) => entry.cityId === cityId) ?? null;
}
