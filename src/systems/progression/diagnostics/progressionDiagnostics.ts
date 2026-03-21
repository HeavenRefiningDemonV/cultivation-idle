import type { MajorRealmId, ProgressionContract } from '../contract/index.js';
import { normalizeGateItemAlias } from '../contract/index.js';
import type { DiagnosticsInputs, DriftIssue } from './driftTypes.js';

export const DRIFT_OWNER_PACKET: Record<DriftIssue['category'], string> = {
  PATH_TRUTH_SPLIT: '1.2',
  GATE_NAMESPACE_SPLIT: '1.3',
  TRIAL_ENTRY_CONTRADICTION: '1.3',
  CITY_UNLOCK_UNBOUND: '1.5',
  PARTIAL_PRESTIGE_RESET: '1.7',
  OFFLINE_PIPELINE_SPLIT: '1.8',
  LIVE_DEFERRED_LEAK: '1.8',
  UNKNOWN_REALM_REFERENCE: '1.5',
  ORPHAN_GATE_ITEM: '1.3',
  HIDDEN_PRESTIGE_RUNTIME_CONSUMER: '1.6',
  MIGRATION_ALIAS_PRESENT: '1.3',
  CONTENT_CAP_BREACH: '1.1',
  WORLD_CITY_SCHEMA_DRIFT: '2.1',
  WORLD_CITY_PACKAGE_COMPLETENESS_DRIFT: '2.7',
  ACTIVITY_REWARD_PARITY_DRIFT: '3.2',
};

const ownerFor = (category: DriftIssue['category']): string => DRIFT_OWNER_PACKET[category];

const issue = (input: Omit<DriftIssue, 'suggestedOwnerPacket'>): DriftIssue => ({
  ...input,
  suggestedOwnerPacket: ownerFor(input.category),
});

export const collectProgressionDiagnostics = (contract: ProgressionContract, inputs: DiagnosticsInputs): DriftIssue[] => {
  const issues: DriftIssue[] = [];
  const runtimeEntries = Object.entries(inputs.runtimeFileTextByPath ?? {});
  const canonicalRealms = new Set(Object.keys(contract.majorRealms));
  const canonicalGateItems = new Set(contract.gateTransitions.map((t) => t.gateItemId));

  const pathMentions = runtimeEntries.filter(([, text]) => text.includes('selectedPath') && text.includes('lifePath'));
  if (pathMentions.length > 0) {
    issues.push(
      issue({
        id: 'path-truth-split',
        category: 'PATH_TRUTH_SPLIT',
        severity: 'warning',
        summary: 'Runtime references canonical selectedPath and legacy lifePath together, indicating split path truth surfaces.',
        evidence: pathMentions.map(([path]) => ({ path, detail: 'Contains selectedPath and lifePath tokens.' })),
        fixStrategySummary: 'Move path-truth reads behind one contract-aware resolver centered on canonical selectedPath.',
        autoFixable: false,
      }),
    );
  }

  const legacyGateMentions = runtimeEntries.filter(([, text]) =>
    ['foundation_pill', 'core_catalyst', 'core_stabilizer', 'soul_condensate'].some((legacy) => text.includes(legacy)),
  );
  if (legacyGateMentions.length > 0) {
    issues.push(
      issue({
        id: 'gate-namespace-split',
        category: 'GATE_NAMESPACE_SPLIT',
        severity: 'warning',
        summary: 'Legacy gate item IDs are still referenced in runtime-adjacent files.',
        evidence: legacyGateMentions.map(([path]) => ({ path, detail: 'Contains legacy gate item IDs without gate_ prefix.' })),
        fixStrategySummary: 'Switch runtime gate item callsites to canonical IDs via contract adapter APIs.',
        autoFixable: false,
      }),
    );
  }

  const offlineMentions = runtimeEntries.filter(([, text]) => text.includes('offline'));
  if (offlineMentions.length > 1) {
    issues.push(
      issue({
        id: 'offline-pipeline-split',
        category: 'OFFLINE_PIPELINE_SPLIT',
        severity: 'warning',
        summary: 'Multiple offline pipeline surfaces detected in runtime files.',
        evidence: offlineMentions.map(([path]) => ({ path, detail: 'Contains offline processing logic references.' })),
        fixStrategySummary: 'Route offline operations through the single packet-1.8 offline pipeline entry point.',
        autoFixable: false,
      }),
    );
  }

  const trialIds = new Set(contract.gateTransitions.map((t) => t.trialId));
  for (const transition of contract.gateTransitions) {
    if (!trialIds.has(transition.trialId)) {
      issues.push(
        issue({
          id: `trial-entry-${transition.id}`,
          category: 'TRIAL_ENTRY_CONTRADICTION',
          severity: 'error',
          summary: `Transition ${transition.id} does not resolve to a trial entry.`,
          evidence: [{ path: 'contract', detail: `Missing trial ${transition.trialId}.` }],
          fixStrategySummary: 'Ensure each transition has one authored trial mapping.',
          autoFixable: false,
        }),
      );
    }
  }

  inputs.authoredContent.cities.forEach((city) => {
    if (!canonicalRealms.has(city.unlockMajorRealm)) {
      issues.push(
        issue({
          id: `city-unbound-${city.id}`,
          category: 'CITY_UNLOCK_UNBOUND',
          severity: 'error',
          summary: `City ${city.id} unlock realm is not in canonical realms.`,
          evidence: [{ path: 'content/cities', detail: `unlockMajorRealm=${city.unlockMajorRealm}` }],
          fixStrategySummary: 'Normalize unlock realms to canonical contract IDs.',
          autoFixable: true,
        }),
      );
    }
  });

  inputs.authoredContent.trials.forEach((trial) => {
    if (trial.fromMajorRealm && !canonicalRealms.has(trial.fromMajorRealm)) {
      issues.push(
        issue({
          id: `unknown-realm-from-${trial.id}`,
          category: 'UNKNOWN_REALM_REFERENCE',
          severity: 'error',
          summary: `Trial ${trial.id} has unknown fromMajorRealm ${trial.fromMajorRealm}.`,
          evidence: [{ path: 'content/trials', detail: trial.fromMajorRealm }],
          fixStrategySummary: 'Map realm aliases or update authored realm IDs to canonical IDs.',
          autoFixable: true,
        }),
      );
    }
    if (trial.toMajorRealm && !canonicalRealms.has(trial.toMajorRealm)) {
      issues.push(
        issue({
          id: `unknown-realm-to-${trial.id}`,
          category: 'UNKNOWN_REALM_REFERENCE',
          severity: 'error',
          summary: `Trial ${trial.id} has unknown toMajorRealm ${trial.toMajorRealm}.`,
          evidence: [{ path: 'content/trials', detail: trial.toMajorRealm }],
          fixStrategySummary: 'Map realm aliases or update authored realm IDs to canonical IDs.',
          autoFixable: true,
        }),
      );
    }
  });

  inputs.authoredContent.items.forEach((itemId) => {
    if (itemId.startsWith('gate_') && !canonicalGateItems.has(itemId as never)) {
      issues.push(
        issue({
          id: `orphan-gate-item-${itemId}`,
          category: 'ORPHAN_GATE_ITEM',
          severity: 'warning',
          summary: `Gate item ${itemId} is present but not used by any canonical transition.`,
          evidence: [{ path: 'content/items', detail: itemId }],
          fixStrategySummary: 'Either map item to transition or mark it deferred.',
          autoFixable: false,
        }),
      );
    }
  });

  inputs.authoredContent.trials.forEach((trial) => {
    const normalized = normalizeGateItemAlias(trial.gateItemId);
    if (!trial.gateItemId.startsWith('gate_') && normalized) {
      issues.push(
        issue({
          id: `migration-alias-${trial.id}`,
          category: 'MIGRATION_ALIAS_PRESENT',
          severity: 'info',
          summary: `Trial ${trial.id} still uses legacy gate item alias ${trial.gateItemId}.`,
          evidence: [{ path: 'content/trials', detail: `normalized -> ${normalized}` }],
          fixStrategySummary: 'Packet 1.3 should normalize gate aliases to canonical gate_* ids while keeping legacy inputs limited to migration compatibility coverage.',
          autoFixable: true,
        }),
      );
    }
  });

  if ((contract.contentCap.realmId as MajorRealmId) !== 'spirit_severing') {
    issues.push(
      issue({
        id: 'content-cap-breach',
        category: 'CONTENT_CAP_BREACH',
        severity: 'error',
        summary: 'Contract content cap is not spirit_severing for this semester slice.',
        evidence: [{ path: 'contract/contentCap', detail: contract.contentCap.realmId }],
        fixStrategySummary: 'Pin current semester cap to spirit_severing until next slice packet lands.',
        autoFixable: true,
      }),
    );
  }

  const prestigeRuntimeMentions = runtimeEntries.filter(([, text]) => text.includes('getQiMultiplier') || text.includes('spiritRoot'));
  if (prestigeRuntimeMentions.length > 0) {
    issues.push(
      issue({
        id: 'hidden-prestige-runtime-consumer',
        category: 'HIDDEN_PRESTIGE_RUNTIME_CONSUMER',
        severity: 'warning',
        summary: 'Runtime modules consume prestige effects directly outside contract hooks.',
        evidence: prestigeRuntimeMentions.map(([path]) => ({ path, detail: 'Direct prestige multiplier/spiritRoot usage found.' })),
        fixStrategySummary: 'Packet 1.6 should keep prestige runtime reads limited to the visible live tree and refund hidden purchases that no longer belong to shipped runtime flows.',
        autoFixable: false,
      }),
    );
  }

  const resetMentions = runtimeEntries.filter(([, text]) => text.includes('reset') && text.includes('prestige'));
  if (resetMentions.length > 1) {
    issues.push(
      issue({
        id: 'partial-prestige-reset',
        category: 'PARTIAL_PRESTIGE_RESET',
        severity: 'warning',
        summary: 'Reset + prestige semantics appear distributed across multiple modules.',
        evidence: resetMentions.map(([path]) => ({ path, detail: 'Contains reset and prestige terms.' })),
        fixStrategySummary: 'Packet 1.7 should centralize reset classification and orchestration.',
        autoFixable: false,
      }),
    );
  }

  const liveDeferredLeak = runtimeEntries.filter(([, text]) => text.includes('stretch') || text.includes('deferred'));
  if (liveDeferredLeak.length > 0) {
    issues.push(
      issue({
        id: 'live-deferred-leak',
        category: 'LIVE_DEFERRED_LEAK',
        severity: 'info',
        summary: 'Deferred/stretch content markers are visible in runtime-adjacent surfaces.',
        evidence: liveDeferredLeak.map(([path]) => ({ path, detail: 'Contains stretch/deferred markers.' })),
        fixStrategySummary: 'Keep deferred systems isolated from live progression pathways until activated.',
        autoFixable: false,
      }),
    );
  }

  return issues;
};
