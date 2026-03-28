import { createScenario } from './createScenario.js';
import { createGateEdgeScenario } from './createGateEdgeScenario.js';
export const createPrestigeReadyScenario = ({ contract }, overrides) => createScenario({
    ...createGateEdgeScenario({ contract }),
    kind: 'prestige_ready',
    description: 'Near first meaningful prestige threshold for reset-contract tests.',
    pathState: { selectedPath: 'heaven', lifePathAlias: null },
    realmState: {
        currentRealm: 'foundation_establishment',
        enteredRealms: ['qi_condensation', 'foundation_establishment'],
    },
    cityState: {
        currentCityId: 'city_stonecrag_town',
        unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
        selectedModuleByCity: {
            city_pinewind_hamlet: 'outskirts',
            city_stonecrag_town: 'outskirts',
        },
    },
    prestigeState: { ready: true, projectedAP: 30 },
    notes: ['Packet 1.7 will activate runtime reset assertions against this scenario.'],
}, overrides);
