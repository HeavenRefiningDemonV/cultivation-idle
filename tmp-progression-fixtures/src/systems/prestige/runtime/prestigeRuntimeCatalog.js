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
