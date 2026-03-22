import { normalizeForgeBlueprint } from '../../content/forge.js';
import type { ValidatedContent } from '../../content/validators.js';
import type { ForgeBlueprintDef } from '../economy/liveEconomyTypes.js';
import {
  getLiveForgeFamily,
  getLiveForgeRuntimeStatus,
  isCanonicalLiveForgeBlueprintId,
  LIVE_FORGE_BLUEPRINT_IDS,
  type LiveForgeFamily,
  type LiveForgeRuntimeStatus,
} from './forgeBlueprintFamilies.js';

export interface LiveForgeCatalogEntry {
  blueprintId: string;
  cityId: string | null;
  cityIndex: number | null;
  status: LiveForgeRuntimeStatus;
  family: LiveForgeFamily;
  familyLabel: 'Refine' | 'Temper' | 'Runes' | 'Hidden';
  canonicalSemesterLadder: boolean;
  blueprint: ForgeBlueprintDef;
  normalized: ReturnType<typeof normalizeForgeBlueprint>;
}

export interface LiveForgeCatalog {
  entriesById: Record<string, LiveForgeCatalogEntry>;
  visibleBlueprintIds: string[];
  hiddenBlueprintIds: string[];
  visibleFamilies: Array<'Refine' | 'Temper' | 'Runes'>;
}

function familyLabel(family: LiveForgeFamily): LiveForgeCatalogEntry['familyLabel'] {
  if (family === 'refine') return 'Refine';
  if (family === 'temper') return 'Temper';
  if (family === 'runes') return 'Runes';
  return 'Hidden';
}

export function buildLiveForgeCatalog(content: Pick<ValidatedContent, 'forge_blueprints' | 'cities'>): LiveForgeCatalog {
  const cityIndexById = Object.fromEntries((content.cities ?? []).map((city) => [city.id, city.index]));
  const entriesById = Object.fromEntries(content.forge_blueprints.map((blueprint) => {
    const normalized = normalizeForgeBlueprint(blueprint);
    const cityId = normalized.cityId ?? null;
    const family = getLiveForgeFamily(blueprint);
    const entry: LiveForgeCatalogEntry = {
      blueprintId: blueprint.id,
      cityId,
      cityIndex: cityId ? cityIndexById[cityId] ?? null : null,
      status: getLiveForgeRuntimeStatus(blueprint),
      family,
      familyLabel: familyLabel(family),
      canonicalSemesterLadder: isCanonicalLiveForgeBlueprintId(blueprint.id),
      blueprint,
      normalized,
    };
    return [blueprint.id, entry];
  }));

  const visibleBlueprintIds = LIVE_FORGE_BLUEPRINT_IDS.filter((id) => entriesById[id]?.status === 'visible_live');
  const hiddenBlueprintIds = Object.values(entriesById)
    .filter((entry) => entry.status !== 'visible_live')
    .map((entry) => entry.blueprintId)
    .sort();

  return {
    entriesById,
    visibleBlueprintIds,
    hiddenBlueprintIds,
    visibleFamilies: ['Refine', 'Temper', 'Runes'],
  };
}

export function getVisibleLiveForgeBlueprints(content: Pick<ValidatedContent, 'forge_blueprints' | 'cities'>): ForgeBlueprintDef[] {
  const catalog = buildLiveForgeCatalog(content);
  return catalog.visibleBlueprintIds
    .map((id) => catalog.entriesById[id]?.blueprint)
    .filter((entry): entry is ForgeBlueprintDef => Boolean(entry));
}

export function getVisibleNormalizedLiveForgeBlueprints(content: Pick<ValidatedContent, 'forge_blueprints' | 'cities'>) {
  return getVisibleLiveForgeBlueprints(content).map((blueprint) => normalizeForgeBlueprint(blueprint));
}

export function getVisibleLiveForgeBlueprintsForCity(
  content: Pick<ValidatedContent, 'forge_blueprints' | 'cities'>,
  cityId?: string | null,
): ForgeBlueprintDef[] {
  if (!cityId) return getVisibleLiveForgeBlueprints(content);
  return getVisibleLiveForgeBlueprints(content).filter((blueprint) => normalizeForgeBlueprint(blueprint).cityId === cityId);
}

export function getLiveForgeBlueprintById(
  content: Pick<ValidatedContent, 'forge_blueprints' | 'cities'> | null | undefined,
  blueprintId: string,
): ForgeBlueprintDef | undefined {
  if (!content) return undefined;
  const entry = buildLiveForgeCatalog(content).entriesById[blueprintId];
  return entry?.status === 'visible_live' ? entry.blueprint : undefined;
}
