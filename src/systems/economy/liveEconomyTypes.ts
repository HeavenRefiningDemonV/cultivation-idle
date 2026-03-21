import type {
  AlchemyRecipesConfig,
  ApothecaryShopDef,
  CityDef,
  ExpeditionsContent,
  ForgeBlueprintsConfig,
  ItemDef,
  OutskirtsDef,
  RunesConfig,
  RuinDef,
} from '../../content/types.js';
import type { NormalizedForgeBlueprint } from '../../content/forge.js';

export type LiveEconomyRuntimeStatus =
  | 'visible_live'
  | 'hidden_deferred'
  | 'migration_refund_only'
  | 'visible_live_blocked'
  | 'unknown';

export type LiveEconomyEntityKind = 'item' | 'alchemy_recipe' | 'forge_blueprint';

export type LiveEconomySourceKind = 'outskirts' | 'ruins' | 'expedition' | 'apothecary_shop' | 'alchemy_output' | 'forge_output';
export type LiveEconomySinkKind = 'alchemy_input' | 'forge_input';

export interface LiveEconomyFlowRef {
  kind: LiveEconomySourceKind | LiveEconomySinkKind;
  sourceId: string;
  itemId: string;
  qty?: number;
  detail?: string;
}

export interface LiveEconomyItemAuditEntry {
  itemId: string;
  runtimeStatus: LiveEconomyRuntimeStatus;
  family: string;
  role: string;
  liveSources: LiveEconomyFlowRef[];
  liveSinks: LiveEconomyFlowRef[];
  blocked: boolean;
  blockerReason?: string;
}

export interface LiveEconomyReagentPathIssue {
  blueprintId: string;
  missingInputItemId: string;
  runtimeStatus: LiveEconomyRuntimeStatus;
  blocked: boolean;
  blockerReason?: string;
}

export interface LiveEconomyAuditReport {
  items: LiveEconomyItemAuditEntry[];
  reagentPathIssues: LiveEconomyReagentPathIssue[];
  blockedItemIds: string[];
  blockedBlueprintIds: string[];
}

export interface LiveEconomyContentSnapshot {
  cities: CityDef[];
  items: ItemDef[];
  alchemy_recipes: AlchemyRecipesConfig['recipes'];
  forge_blueprints: ForgeBlueprintsConfig['blueprints'];
  apothecary_shops: ApothecaryShopDef[];
  outskirts: OutskirtsDef[];
  ruins: RuinDef[];
  expeditions: ExpeditionsContent;
  runes?: RunesConfig['runes'];
}

export interface LiveEconomyCatalog {
  itemStatuses: Record<string, LiveEconomyRuntimeStatus>;
  alchemyRecipeStatuses: Record<string, LiveEconomyRuntimeStatus>;
  forgeBlueprintStatuses: Record<string, LiveEconomyRuntimeStatus>;
  visibleItemIds: string[];
  visibleAlchemyRecipeIds: string[];
  visibleForgeBlueprintIds: string[];
  hiddenItemIds: string[];
  hiddenAlchemyRecipeIds: string[];
  hiddenForgeBlueprintIds: string[];
  blockedItemIds: string[];
  blockedForgeBlueprintIds: string[];
}

export interface LiveEconomyVisibilityDecision {
  status: LiveEconomyRuntimeStatus;
  reason: string;
}

export interface NormalizedForgeBlueprintWithStatus extends NormalizedForgeBlueprint {
  runtimeStatus: LiveEconomyRuntimeStatus;
}
