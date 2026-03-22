import type { ValidatedContent } from '../../content/validators.js';
import { buildLiveForgeCatalog } from './liveForgeCatalog.js';
import {
  LIVE_REFINE_LADDER_IDS,
  LIVE_TEMPER_LADDER_IDS,
  LIVE_RUNE_CITY_PAIRS,
  LEGACY_RUNE_BLUEPRINT_IDS,
} from './forgeBlueprintFamilies.js';

export interface ForgeLadderAuditReport {
  missingRefineIds: string[];
  missingTemperIds: string[];
  missingRuneIdsByCity: Record<string, string[]>;
  visibleFamilyLabels: string[];
  leakedLegacyRuneIds: string[];
  hiddenDeferredVisibleIds: string[];
  spiritDewSinkIds: string[];
  artifactShardSinkIds: string[];
  lateRefineArtifactShardCounts: Record<string, number>;
}

function inputQty(blueprint: ValidatedContent['forge_blueprints'][number] | undefined, itemId: string): number {
  return Number(blueprint?.inputs?.[itemId] ?? 0);
}

export function buildForgeLadderAudit(content: Pick<ValidatedContent, 'forge_blueprints' | 'cities'>): ForgeLadderAuditReport {
  const catalog = buildLiveForgeCatalog(content);
  const visibleEntries = Object.values(catalog.entriesById).filter((entry) => entry.status === 'visible_live');
  const visibleIds = new Set(visibleEntries.map((entry) => entry.blueprintId));
  const byId = Object.fromEntries(content.forge_blueprints.map((blueprint) => [blueprint.id, blueprint]));

  return {
    missingRefineIds: LIVE_REFINE_LADDER_IDS.filter((id) => !visibleIds.has(id)),
    missingTemperIds: LIVE_TEMPER_LADDER_IDS.filter((id) => !visibleIds.has(id)),
    missingRuneIdsByCity: Object.fromEntries(
      Object.entries(LIVE_RUNE_CITY_PAIRS).map(([cityId, ids]) => [cityId, ids.filter((id) => !visibleIds.has(id))]),
    ),
    visibleFamilyLabels: Array.from(new Set(visibleEntries.map((entry) => entry.familyLabel))).sort(),
    leakedLegacyRuneIds: LEGACY_RUNE_BLUEPRINT_IDS.filter((id) => visibleIds.has(id)),
    hiddenDeferredVisibleIds: Object.values(catalog.entriesById)
      .filter((entry) => entry.status !== 'visible_live' && visibleIds.has(entry.blueprintId))
      .map((entry) => entry.blueprintId),
    spiritDewSinkIds: visibleEntries.filter((entry) => inputQty(entry.blueprint, 'mat_spirit_dew') > 0).map((entry) => entry.blueprintId),
    artifactShardSinkIds: visibleEntries.filter((entry) => inputQty(entry.blueprint, 'mat_artifact_shard') > 0).map((entry) => entry.blueprintId),
    lateRefineArtifactShardCounts: {
      forge_refine_uncommon_t3: inputQty(byId.forge_refine_uncommon_t3, 'mat_artifact_shard'),
      forge_refine_rare_t4: inputQty(byId.forge_refine_rare_t4, 'mat_artifact_shard'),
      forge_refine_legendary_t5: inputQty(byId.forge_refine_legendary_t5, 'mat_artifact_shard'),
    },
  };
}
