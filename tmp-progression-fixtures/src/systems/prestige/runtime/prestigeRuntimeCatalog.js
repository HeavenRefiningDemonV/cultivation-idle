import { getPrestigeNodeRuntimeStatus as classifyPrestigeNodeRuntimeStatus, getPrestigeRuntimeConsumers, } from '../../progression/contract/index.js';
const classifyRuntimeStatus = (upgrade) => {
    const consumers = getPrestigeRuntimeConsumers(upgrade);
    const status = classifyPrestigeNodeRuntimeStatus(upgrade.id, upgrade);
    return {
        upgrade,
        status,
        contractStatus: status === 'deferred' ? 'deferred' : status === 'unknown' ? 'unknown' : 'live',
        consumers,
    };
};
export const getPrestigeRuntimeCatalog = (content) => {
    const upgrades = content?.prestige_store?.upgrades ?? [];
    if (upgrades.length === 0 || !content) {
        return {
            nodes: [],
            nodeById: {},
            visibleLiveNodes: [],
            hiddenUnsupportedNodes: [],
            deferredNodes: [],
            unknownNodes: [],
            visibleLiveNodeIds: [],
            hiddenNodeIds: [],
            legacyResidueNodeIds: [],
        };
    }
    const nodes = upgrades.map((upgrade) => classifyRuntimeStatus(upgrade));
    const visibleLiveNodes = nodes.filter((node) => node.status === 'visible_live');
    const hiddenUnsupportedNodes = nodes.filter((node) => node.status === 'hidden_unsupported');
    const deferredNodes = nodes.filter((node) => node.status === 'deferred');
    const unknownNodes = nodes.filter((node) => node.status === 'unknown');
    const hiddenNodeIds = [...hiddenUnsupportedNodes, ...deferredNodes, ...unknownNodes].map((node) => node.upgrade.id);
    return {
        nodes,
        nodeById: Object.fromEntries(nodes.map((node) => [node.upgrade.id, node])),
        visibleLiveNodes,
        hiddenUnsupportedNodes,
        deferredNodes,
        unknownNodes,
        visibleLiveNodeIds: visibleLiveNodes.map((node) => node.upgrade.id),
        hiddenNodeIds,
        legacyResidueNodeIds: hiddenNodeIds,
    };
};
export const getVisiblePrestigeUpgrades = (content) => getPrestigeRuntimeCatalog(content).visibleLiveNodes.map((node) => node.upgrade);
export const getHiddenPrestigeUpgrades = (content) => getPrestigeRuntimeCatalog(content)
    .nodes
    .filter((node) => node.status !== 'visible_live')
    .map((node) => node.upgrade);
export const getDeferredPrestigeUpgrades = (content) => getPrestigeRuntimeCatalog(content).deferredNodes.map((node) => node.upgrade);
export const getPrestigeNodeRuntimeStatus = (nodeId, content) => getPrestigeRuntimeCatalog(content).nodeById[nodeId]?.status ?? 'unknown';
export const isPrestigeNodeVisible = (nodeId, content) => getPrestigeNodeRuntimeStatus(nodeId, content) === 'visible_live';
export const canPurchasePrestigeNode = (nodeId, content) => {
    const node = getPrestigeRuntimeCatalog(content).nodeById[nodeId];
    if (!node) {
        return { ok: false, reason: 'Upgrade not found' };
    }
    if (node.status === 'visible_live') {
        return { ok: true };
    }
    if (node.status === 'deferred') {
        return { ok: false, reason: 'Upgrade belongs to deferred content' };
    }
    if (node.status === 'hidden_unsupported') {
        return { ok: false, reason: 'Upgrade is not available in the current live prestige tree' };
    }
    return { ok: false, reason: 'Upgrade is not available in the current live prestige tree' };
};
export const getPurchasedVisiblePrestigeNodeIds = (purchases, content) => {
    const visibleIds = new Set(getPrestigeRuntimeCatalog(content).visibleLiveNodeIds);
    return Object.entries(purchases ?? {})
        .filter(([nodeId, level]) => visibleIds.has(nodeId) && level > 0)
        .map(([nodeId]) => nodeId);
};
const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const collectEffectKeys = (upgrade) => {
    const keys = new Set();
    if (typeof upgrade.stat === 'string' && upgrade.stat.trim())
        keys.add(upgrade.stat);
    if (isRecord(upgrade.effect)) {
        Object.keys(upgrade.effect).forEach((key) => keys.add(key));
    }
    if (isRecord(upgrade.effectPerLevel)) {
        Object.keys(upgrade.effectPerLevel).forEach((key) => keys.add(key));
    }
    else if (typeof upgrade.effectPerLevel === 'number' && upgrade.stat) {
        keys.add(upgrade.stat);
    }
    if (Array.isArray(upgrade.unlocks) && upgrade.unlocks.length > 0)
        keys.add('unlocks');
    return Array.from(keys).sort();
};
const toAuditStatus = (status) => {
    if (status === 'visible_live')
        return 'visible_live';
    if (status === 'deferred')
        return 'deferred';
    if (status === 'hidden_unsupported')
        return 'hidden_unsupported';
    return 'unknown_blocked';
};
const reasonForAuditStatus = (node) => {
    if (node.status === 'visible_live') {
        return `Live runtime consumer(s): ${node.consumers.join(', ')}.`;
    }
    if (node.status === 'deferred') {
        return 'Deferred future-slice decree; blocked from live purchasing.';
    }
    if (node.status === 'hidden_unsupported') {
        return 'Content effect has no confirmed runtime consumer in this slice, so it is hidden.';
    }
    return 'Runtime status is unknown; blocked until content or consumer metadata is fixed.';
};
const remediationForAuditStatus = (status) => {
    if (status === 'visible_live')
        return 'none';
    if (status === 'deferred')
        return 'label_deferred';
    if (status === 'hidden_unsupported')
        return 'hide';
    return 'fix_content_key';
};
export function buildPrestigeEffectAuditReport(content, options) {
    const catalog = getPrestigeRuntimeCatalog(content);
    const rows = catalog.nodes.map((node) => {
        const status = toAuditStatus(node.status);
        const purchaseAllowed = status === 'visible_live';
        const displayAllowed = status === 'visible_live' || status === 'deferred';
        return {
            upgradeId: node.upgrade.id,
            upgradeName: node.upgrade.name ?? node.upgrade.id,
            status,
            contentEffectKeys: collectEffectKeys(node.upgrade),
            runtimeConsumers: node.consumers,
            purchaseAllowed,
            displayAllowed,
            reason: reasonForAuditStatus(node),
            remediation: remediationForAuditStatus(status),
        };
    }).sort((left, right) => left.upgradeId.localeCompare(right.upgradeId));
    const blockers = rows
        .filter((row) => row.purchaseAllowed && row.runtimeConsumers.length === 0)
        .map((row) => `${row.upgradeId} is purchasable without a runtime consumer.`);
    const warnings = rows
        .filter((row) => row.status === 'unknown_blocked')
        .map((row) => `${row.upgradeId} is unknown and blocked.`);
    return {
        generatedAt: options?.generatedAt ?? Date.now(),
        rows,
        visibleLiveCount: rows.filter((row) => row.status === 'visible_live').length,
        deferredCount: rows.filter((row) => row.status === 'deferred').length,
        hiddenUnsupportedCount: rows.filter((row) => row.status === 'hidden_unsupported').length,
        unknownBlockedCount: rows.filter((row) => row.status === 'unknown_blocked').length,
        blockers,
        warnings,
    };
}
