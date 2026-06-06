const ROUTE_PURPOSES = {
    forage: {
        expeditionTypeId: 'forage',
        moduleKey: 'apothecary',
        moduleLabel: 'Apothecary',
        ctaLabel: 'Open Apothecary',
    },
    mine: {
        expeditionTypeId: 'mine',
        moduleKey: 'forge',
        moduleLabel: 'Forge',
        ctaLabel: 'Open Forge',
    },
    scout: {
        expeditionTypeId: 'scout',
        moduleKey: 'manualPavilion',
        moduleLabel: 'Manual Pavilion',
        ctaLabel: 'Open Manual Pavilion',
    },
};
export function getLiveExpeditionRoutePurpose(expeditionTypeId) {
    return ROUTE_PURPOSES[expeditionTypeId] ?? null;
}
export function getLiveExpeditionRoutePurposes() {
    return Object.values(ROUTE_PURPOSES);
}
