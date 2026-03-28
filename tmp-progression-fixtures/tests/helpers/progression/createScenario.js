const mergeDeep = (base, overrides) => {
    if (!overrides)
        return base;
    const result = { ...base };
    for (const [key, value] of Object.entries(overrides)) {
        if (value == null) {
            result[key] = value;
            continue;
        }
        const baseValue = result[key];
        if (typeof value === 'object' &&
            !Array.isArray(value) &&
            typeof baseValue === 'object' &&
            baseValue != null &&
            !Array.isArray(baseValue)) {
            result[key] = mergeDeep(baseValue, value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
};
export const createScenario = (base, overrides) => {
    const scenario = mergeDeep(base, overrides);
    const resolvedTransitionIds = Object.keys(scenario.gateState.resolutionByTransitionId);
    return {
        ...scenario,
        gateState: {
            ...scenario.gateState,
            resolvedTransitionIds,
        },
    };
};
