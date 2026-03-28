export const renderProgressionContractReport = (contract, diagnostics) => {
    const lines = [];
    lines.push('=== Progression Contract Report ===');
    lines.push(`Slice: ${contract.semesterSlice.id} - ${contract.semesterSlice.label}`);
    lines.push(`Live major realms: ${contract.semesterSlice.liveMajorRealms.join(', ')}`);
    lines.push('');
    lines.push('Transitions:');
    contract.gateTransitions.forEach((t) => {
        lines.push(`- ${t.id}: ${t.trialId} | ${t.gateItemId}`);
    });
    lines.push('');
    lines.push('City unlocks:');
    contract.cityUnlocks.forEach((unlock) => lines.push(`- ${unlock.cityId} @ ${unlock.unlockOnRealmEntry}`));
    lines.push(`Content cap realm: ${contract.contentCap.realmId}`);
    lines.push(`Deferred systems: ${contract.deferredSystems.join(', ')}`);
    lines.push('');
    lines.push('Diagnostics:');
    if (diagnostics.length === 0) {
        lines.push('- none');
        return lines.join('\n');
    }
    const grouped = diagnostics.reduce((acc, issue) => {
        const key = `${issue.severity}:${issue.category}`;
        if (!acc[key])
            acc[key] = [];
        acc[key].push(issue);
        return acc;
    }, {});
    Object.entries(grouped).forEach(([group, issues]) => {
        lines.push(`- ${group}`);
        issues.forEach((entry) => {
            lines.push(`  • ${entry.summary} (owner packet ${entry.suggestedOwnerPacket})`);
        });
    });
    return lines.join('\n');
};
