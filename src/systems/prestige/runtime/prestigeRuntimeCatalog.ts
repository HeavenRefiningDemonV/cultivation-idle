import type { PrestigeUpgradeDef, ValidatedContent } from '../../../content/index.js';
import { adaptProgressionAuthoredContent, buildProgressionContract } from '../../progression/contract/index.js';

export type PrestigeNodeRuntimeStatus =
  | 'visible_live'
  | 'hidden_unsupported'
  | 'deferred'
  | 'unknown';

export type PrestigeRuntimeConsumer =
  | 'qi_multiplier'
  | 'combat_multiplier'
  | 'offline_efficiency'
  | 'heart_law_unlock'
  | 'extra_technique_slot';

export interface PrestigeRuntimeNode {
  upgrade: PrestigeUpgradeDef;
  status: PrestigeNodeRuntimeStatus;
  contractStatus: 'live' | 'deferred' | 'unknown';
  consumers: PrestigeRuntimeConsumer[];
}

export interface PrestigeRuntimeCatalog {
  nodes: PrestigeRuntimeNode[];
  nodeById: Record<string, PrestigeRuntimeNode>;
  visibleLiveNodes: PrestigeRuntimeNode[];
  hiddenUnsupportedNodes: PrestigeRuntimeNode[];
  deferredNodes: PrestigeRuntimeNode[];
  unknownNodes: PrestigeRuntimeNode[];
  visibleLiveNodeIds: string[];
  hiddenNodeIds: string[];
  legacyResidueNodeIds: string[];
}

const SUPPORTED_STAT_CONSUMERS: Record<string, PrestigeRuntimeConsumer> = {
  idleQiMult: 'qi_multiplier',
  combatMult: 'combat_multiplier',
  offlineEfficiencyAdd: 'offline_efficiency',
};

const SUPPORTED_UNLOCKS = new Set(['tier1', 'tier2', 'tier3']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getNumericEffect = (effect: unknown, key: string): number | null => {
  if (!isRecord(effect)) return null;
  return typeof effect[key] === 'number' ? (effect[key] as number) : null;
};

const getRuntimeConsumers = (upgrade: PrestigeUpgradeDef): PrestigeRuntimeConsumer[] => {
  const consumers = new Set<PrestigeRuntimeConsumer>();

  if (upgrade.stat && SUPPORTED_STAT_CONSUMERS[upgrade.stat]) {
    consumers.add(SUPPORTED_STAT_CONSUMERS[upgrade.stat]);
  }

  if (Array.isArray(upgrade.unlocks) && upgrade.unlocks.some((unlockId) => SUPPORTED_UNLOCKS.has(unlockId))) {
    consumers.add('heart_law_unlock');
  }

  if (getNumericEffect(upgrade.effect, 'extraTechniqueSlots') || getNumericEffect(upgrade.effectPerLevel, 'extraTechniqueSlots')) {
    consumers.add('extra_technique_slot');
  }

  return Array.from(consumers);
};

const classifyRuntimeStatus = (
  upgrade: PrestigeUpgradeDef,
  contractStatus: 'live' | 'deferred' | 'unknown',
): PrestigeRuntimeNode => {
  const consumers = getRuntimeConsumers(upgrade);
  if (consumers.length > 0) {
    return {
      upgrade,
      status: 'visible_live',
      contractStatus,
      consumers,
    };
  }

  if (contractStatus === 'deferred') {
    return {
      upgrade,
      status: 'deferred',
      contractStatus,
      consumers,
    };
  }

  return {
    upgrade,
    status: contractStatus === 'unknown' ? 'unknown' : 'hidden_unsupported',
    contractStatus,
    consumers,
  };
};

export const getPrestigeRuntimeCatalog = (
  content: ValidatedContent | null | undefined,
): PrestigeRuntimeCatalog => {
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

  const contract = buildProgressionContract(adaptProgressionAuthoredContent(content));
  const nodes = upgrades.map((upgrade) =>
    classifyRuntimeStatus(upgrade, contract.prestigeHooks.classifyNode(upgrade.id)),
  );

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

export const getVisiblePrestigeUpgrades = (
  content: ValidatedContent | null | undefined,
): PrestigeUpgradeDef[] => getPrestigeRuntimeCatalog(content).visibleLiveNodes.map((node) => node.upgrade);

export const getHiddenPrestigeUpgrades = (
  content: ValidatedContent | null | undefined,
): PrestigeUpgradeDef[] =>
  getPrestigeRuntimeCatalog(content)
    .nodes
    .filter((node) => node.status !== 'visible_live')
    .map((node) => node.upgrade);

export const getDeferredPrestigeUpgrades = (
  content: ValidatedContent | null | undefined,
): PrestigeUpgradeDef[] => getPrestigeRuntimeCatalog(content).deferredNodes.map((node) => node.upgrade);

export const getPrestigeNodeRuntimeStatus = (
  nodeId: string,
  content: ValidatedContent | null | undefined,
): PrestigeNodeRuntimeStatus => getPrestigeRuntimeCatalog(content).nodeById[nodeId]?.status ?? 'unknown';

export const isPrestigeNodeVisible = (
  nodeId: string,
  content: ValidatedContent | null | undefined,
): boolean => getPrestigeNodeRuntimeStatus(nodeId, content) === 'visible_live';

export const canPurchasePrestigeNode = (
  nodeId: string,
  content: ValidatedContent | null | undefined,
): { ok: true } | { ok: false; reason: string } => {
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

export const getPurchasedVisiblePrestigeNodeIds = (
  purchases: Record<string, number> | undefined,
  content: ValidatedContent | null | undefined,
): string[] => {
  const visibleIds = new Set(getPrestigeRuntimeCatalog(content).visibleLiveNodeIds);
  return Object.entries(purchases ?? {})
    .filter(([nodeId, level]) => visibleIds.has(nodeId) && level > 0)
    .map(([nodeId]) => nodeId);
};
