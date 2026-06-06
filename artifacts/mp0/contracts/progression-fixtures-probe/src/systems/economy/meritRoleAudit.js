export const CHANGE_HEART_LAW_COST = { gold: '100' };
export const LIVE_ALLOWED_MERIT_SINK_IDS = ['gate_trial_fail_safe'];
function normalizeCost(cost) {
    if (!cost)
        return {};
    return {
        ...(cost.gold ? { gold: cost.gold } : {}),
        ...(cost.spiritStones ? { spiritStones: cost.spiritStones } : {}),
        ...(cost.merit ? { merit: cost.merit } : {}),
    };
}
export function getVisibleCurrencySpendSurfaces(content) {
    const failSafeSurfaces = (content?.trials ?? []).map((trial, index) => ({
        id: 'gate_trial_fail_safe',
        label: `Gate Trial fail-safe (${trial.id ?? `city_${index}`})`,
        visible: true,
        live: true,
        costs: normalizeCost(trial.failSafe?.cost ?? null),
    }));
    return [
        ...failSafeSurfaces,
        {
            id: 'heart_law_change',
            label: 'Heart Law change modal',
            visible: true,
            live: true,
            costs: { ...CHANGE_HEART_LAW_COST },
        },
    ];
}
export function buildMeritRoleAudit(content) {
    const surfaces = getVisibleCurrencySpendSurfaces(content);
    const meritUsingSurfaces = surfaces.filter((surface) => Boolean(surface.costs.merit));
    const violations = meritUsingSurfaces.filter((surface) => !LIVE_ALLOWED_MERIT_SINK_IDS.includes(surface.id));
    return {
        surfaces,
        meritUsingSurfaces,
        violations,
    };
}
