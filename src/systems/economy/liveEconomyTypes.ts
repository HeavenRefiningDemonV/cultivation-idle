import type { ValidatedContent } from '../../content/validators.js';
import type { NormalizedForgeBlueprint } from '../../content/forge.js';

export type LiveEconomyRuntimeStatus =
  | 'visible_live'
  | 'hidden_deferred'
  | 'migration_refund_only'
  | 'visible_live_blocked'
  | 'unknown';

export type LiveEconomyEntityKind = 'item' | 'alchemy_recipe' | 'forge_blueprint';

export type LiveEconomyFamily =
  | 'material'
  | 'reagent'
  | 'consumable'
  | 'rune'
  | 'forge_refine'
  | 'forge_temper'
  | 'forge_rune'
  | 'forge_legacy_rune'
  | 'forge_talisman'
  | 'forge_jade_core'
  | 'deferred_alchemy_output'
  | 'currency'
  | 'other';

export type LiveEconomySourceKind =
  | 'outskirts'
  | 'ruins_room'
  | 'ruins_chest'
  | 'expedition'
  | 'apothecary_shop'
  | 'alchemy_output'
  | 'forge_output';

export type LiveEconomySinkKind = 'alchemy_input' | 'forge_input';

export interface LiveEconomyRouteRef {
  kind: LiveEconomySourceKind | LiveEconomySinkKind;
  refId: string;
  itemId: string;
  detail?: string;
}

export interface KnownLiveEconomyBlocker {
  id: string;
  status: 'visible_live_blocked';
  entityKind: LiveEconomyEntityKind;
  reason: string;
  dependencyIds?: string[];
  ownerPacket: '3.1A';
}

export interface LiveEconomyCatalog {
  itemStatusById: Record<string, LiveEconomyRuntimeStatus>;
  alchemyRecipeStatusById: Record<string, LiveEconomyRuntimeStatus>;
  forgeBlueprintStatusById: Record<string, LiveEconomyRuntimeStatus>;
  visibleItemIds: string[];
  hiddenItemIds: string[];
  visibleAlchemyRecipeIds: string[];
  hiddenAlchemyRecipeIds: string[];
  visibleForgeBlueprintIds: string[];
  hiddenForgeBlueprintIds: string[];
}

export interface LiveEconomyItemAudit {
  itemId: string;
  runtimeStatus: LiveEconomyRuntimeStatus;
  family: LiveEconomyFamily;
  liveSources: LiveEconomyRouteRef[];
  liveSinks: LiveEconomyRouteRef[];
  isBlocked: boolean;
  blockerReason?: string;
}

export interface LiveReagentPathAudit {
  blueprintId: string;
  runtimeStatus: LiveEconomyRuntimeStatus;
  missingDependencyIds: string[];
  isBlocked: boolean;
  blockerReason?: string;
}

export interface LiveEconomyAuditReport {
  catalog: LiveEconomyCatalog;
  itemAudits: LiveEconomyItemAudit[];
  reagentPathAudits: LiveReagentPathAudit[];
  activeBlockerIds: string[];
  craftRelevantItemIds: string[];
}

export type AlchemyRecipeDef = ValidatedContent['alchemy_recipes'][number];
export type ForgeBlueprintDef = ValidatedContent['forge_blueprints'][number];
export type ItemDefLike = ValidatedContent['items'][number];
export type NormalizedBlueprint = NormalizedForgeBlueprint;
