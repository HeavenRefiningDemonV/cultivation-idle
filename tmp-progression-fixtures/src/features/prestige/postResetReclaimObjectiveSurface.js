const hasPurchased = (purchasesById, id) => (purchasesById[id] ?? 0) > 0;
const buildRetainedAdvantages = (purchasesById) => {
    const advantages = [];
    if (hasPurchased(purchasesById, 'ap_idle_qi_mult')) {
        advantages.push('Idle Qi decree remains live for faster early cultivation.');
    }
    if (hasPurchased(purchasesById, 'ap_combat_mult')) {
        advantages.push('Combat decree remains live for faster gate recovery.');
    }
    if (hasPurchased(purchasesById, 'ap_offline_efficiency')) {
        advantages.push('Offline efficiency decree improves background cultivation.');
    }
    if (Object.keys(purchasesById).some((id) => id.includes('mastery_retention') && (purchasesById[id] ?? 0) > 0)) {
        advantages.push('Latent mastery memory survived; relearn techniques before expecting full use.');
    }
    return advantages.length > 0 ? advantages : ['AP and purchased live decrees remain in the reincarnation ledger.'];
};
export function buildPostResetReclaimObjectiveSurface(args) {
    const createdAt = args.createdAt ?? Date.now();
    const preview = args.sourceSummary.nextLifeFocus;
    const firstActions = [
        {
            id: 'choose_next_life_identity',
            label: 'Choose path and Heart Law',
            detail: 'Life setup remains first; reclaim guidance should not override path and doctrine choice.',
            route: { kind: 'tab', tabId: 'cultivation', anchor: 'life_setup' },
        },
        {
            id: preview.id,
            label: preview.label,
            detail: preview.detail,
            route: preview.route,
        },
        {
            id: 'reclaim_first_threshold',
            label: 'Reclaim the first threshold',
            detail: 'Push toward the first gate with retained decrees, then restock preparation before retrying old walls.',
            route: { kind: 'tab', tabId: 'cultivation', anchor: 'threshold' },
        },
    ];
    return {
        version: 1,
        id: `reclaim_life_${args.sourceSummary.lifeOrdinal}_${createdAt}`,
        sourceLifeOrdinal: args.sourceSummary.lifeOrdinal,
        createdAt,
        headline: `Previous Life ${args.sourceSummary.lifeOrdinal} sealed`,
        detail: args.sourceSummary.headline,
        retainedAdvantages: buildRetainedAdvantages(args.purchasesById),
        firstActions,
        dismissible: true,
        dismissAfterMilestone: 'first_gate_resolved',
    };
}
