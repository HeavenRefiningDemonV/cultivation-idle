import type { NormalizedForgeBlueprint } from '../../content/forge.js';
import type { ForgeFloorReadModel } from './forgeFloorReadModel.js';
import {
  LIVE_FORGE_SURFACE_TABS,
  getForgeSurfaceTabForBlueprint,
  type LiveForgeSurfaceTab,
} from './forgeModePolicy.js';

export const LIVE_FORGE_SURFACE_HEADLINE = 'Use Forge to raise the permanent floor of this life.';

const TAB_COPY: Record<LiveForgeSurfaceTab, string> = {
  refine: 'Raise guaranteed weapon and accessory levels so the next gate is safer.',
  temper: 'Add permanent affix power to your equipped gear with the semester temper ladder.',
  runes: 'Craft canonical runes that strengthen your technique loadout without legacy drift.',
};

export interface ForgeSurfaceModel {
  headline: string;
  activeTab: LiveForgeSurfaceTab;
  tabCopy: string;
  tabs: Array<{
    id: LiveForgeSurfaceTab;
    label: string;
    count: number;
    blueprints: NormalizedForgeBlueprint[];
  }>;
  activeBlueprints: NormalizedForgeBlueprint[];
  floor: ForgeFloorReadModel;
}

export function buildForgeSurfaceModel(args: {
  blueprints: NormalizedForgeBlueprint[];
  activeTab: LiveForgeSurfaceTab;
  query?: string;
  floor: ForgeFloorReadModel;
}): ForgeSurfaceModel {
  const lowered = args.query?.trim().toLowerCase() ?? '';
  const filterMatches = (blueprint: NormalizedForgeBlueprint): boolean => {
    if (!lowered) return true;
    const haystack = [blueprint.name ?? '', blueprint.id, blueprint.output?.itemId ?? '', blueprint.service ?? '']
      .join(' ')
      .toLowerCase();
    return haystack.includes(lowered);
  };

  const tabs = LIVE_FORGE_SURFACE_TABS.map((tab) => {
    const blueprints = args.blueprints.filter((blueprint) => getForgeSurfaceTabForBlueprint(blueprint) === tab.id && filterMatches(blueprint));
    return {
      id: tab.id,
      label: tab.label,
      count: blueprints.length,
      blueprints,
    };
  });

  const activeBlueprints = tabs.find((tab) => tab.id === args.activeTab)?.blueprints ?? [];

  return {
    headline: LIVE_FORGE_SURFACE_HEADLINE,
    activeTab: args.activeTab,
    tabCopy: TAB_COPY[args.activeTab],
    tabs,
    activeBlueprints,
    floor: args.floor,
  };
}
