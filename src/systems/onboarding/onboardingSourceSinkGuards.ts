import type { LiveWorldModuleKey } from '../../content/types.js';
import type { GameTab } from '../../stores/uiStore.js';
import type {
  OnboardingGateDefeatFact,
  OnboardingRouteTarget,
  OnboardingRuntimeMilestoneId,
} from './onboardingTypes.js';

export type OnboardingSourceSinkGuardId =
  | 'outskirts_gold_needs_pavilion_context'
  | 'pavilion_insufficient_gold_routes_outskirts'
  | 'techniques_empty_routes_manual_study'
  | 'apothecary_no_stock_routes_source'
  | 'forge_missing_material_routes_source'
  | 'ruins_bounties_support_route'
  | 'gate_trial_teaser_not_openable'
  | 'gate_defeat_routes_top_fix'
  | 'foundation_no_first_life_replay';

export type OnboardingSourceSinkGuardSeverity = 'info' | 'blocked' | 'locked';

export interface OnboardingSourceSinkGuardRoute {
  label: string;
  target: OnboardingRouteTarget;
}

export interface OnboardingSourceSinkGuard {
  id: OnboardingSourceSinkGuardId;
  milestoneId: OnboardingRuntimeMilestoneId;
  severity: OnboardingSourceSinkGuardSeverity;
  title: string;
  body: string;
  primaryRoute: OnboardingSourceSinkGuardRoute | null;
  detail?: string;
}

export interface OnboardingBestSourceHint {
  label: string;
  moduleKey: LiveWorldModuleKey;
  reason: string;
  cityId?: string | null;
}

export interface BuildOnboardingSourceSinkGuardsInput {
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
  currentCityId?: string | null;
  availableWorldModules?: readonly LiveWorldModuleKey[];
  teaserWorldModules?: readonly LiveWorldModuleKey[];
  currencies?: { gold?: string | number | null };
  firstManualGoldCost?: number;
  eligibleTechniqueCount?: number;
  manualStudyActive?: boolean;
  medicineStockCount?: number;
  pouchEquippedCount?: number;
  herbStockCount?: number;
  forgeMissingMaterialIds?: readonly string[];
  bestSourceByItemId?: Record<string, OnboardingBestSourceHint | undefined>;
  lastGateDefeat?: OnboardingGateDefeatFact | null;
  firstLifeOnlyComplete?: boolean;
}

const MODULE_LABELS: Record<LiveWorldModuleKey, string> = {
  outskirts: 'Outskirts',
  ruins: 'Ruins',
  gateTrial: 'Gate Trial',
  trainingHall: 'Training Hall',
  manualPavilion: 'Manual Pavilion',
  apothecary: 'Apothecary',
  forge: 'Forge',
  bounties: 'Bounty Board',
  expeditions: 'Expeditions',
};

const TAB_LABELS: Record<GameTab, string> = {
  cultivation: 'Cultivation',
  status: 'Status',
  adventure: 'World',
  inventory: 'Inventory',
  techniques: 'Techniques',
  records: 'Manual Pavilion',
  prestige: 'Prestige',
  settings: 'Settings',
};

function worldRoute(moduleKey: LiveWorldModuleKey, currentCityId?: string | null, label?: string): OnboardingSourceSinkGuardRoute {
  return {
    label: label ?? `Open ${MODULE_LABELS[moduleKey]}`,
    target: { kind: 'world_module', moduleKey, cityId: currentCityId ?? null },
  };
}

function tabRoute(tab: GameTab, label?: string): OnboardingSourceSinkGuardRoute {
  return {
    label: label ?? `Open ${TAB_LABELS[tab]}`,
    target: { kind: 'tab', tab },
  };
}

function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasModule(input: BuildOnboardingSourceSinkGuardsInput, moduleKey: LiveWorldModuleKey): boolean {
  return (input.availableWorldModules ?? []).includes(moduleKey);
}

function hasTeaser(input: BuildOnboardingSourceSinkGuardsInput, moduleKey: LiveWorldModuleKey): boolean {
  return (input.teaserWorldModules ?? []).includes(moduleKey);
}

function routeForDestination(
  destination: string | null | undefined,
  currentCityId?: string | null,
): OnboardingSourceSinkGuardRoute {
  switch (destination) {
    case 'outskirts':
      return worldRoute('outskirts', currentCityId, 'Hunt Outskirts');
    case 'manualPavilion':
    case 'pavilion':
      return worldRoute('manualPavilion', currentCityId, 'Visit Pavilion');
    case 'records':
      return tabRoute('records', 'Open Records');
    case 'techniques':
      return tabRoute('techniques', 'Review Techniques');
    case 'apothecary':
    case 'medicine':
    case 'pouch':
      return worldRoute('apothecary', currentCityId, 'Stock Medicine');
    case 'forge':
      return worldRoute('forge', currentCityId, 'Open Forge');
    case 'ruins':
      return worldRoute('ruins', currentCityId, 'Run Ruins');
    case 'bounties':
      return worldRoute('bounties', currentCityId, 'Track Bounty');
    case 'expeditions':
      return worldRoute('expeditions', currentCityId, 'Send Expedition');
    case 'cultivation':
      return tabRoute('cultivation', 'Open Cultivation');
    case 'status':
      return tabRoute('status', 'Read Status');
    default:
      return tabRoute('status', 'Read Status');
  }
}

function firstForgeSourceRoute(input: BuildOnboardingSourceSinkGuardsInput): OnboardingSourceSinkGuardRoute {
  const missingId = input.forgeMissingMaterialIds?.[0] ?? null;
  const source = missingId ? input.bestSourceByItemId?.[missingId] ?? null : null;
  if (source) {
    return worldRoute(source.moduleKey, source.cityId ?? input.currentCityId ?? null, source.label);
  }
  if (hasModule(input, 'outskirts')) return worldRoute('outskirts', input.currentCityId, 'Hunt Outskirts');
  if (hasModule(input, 'ruins')) return worldRoute('ruins', input.currentCityId, 'Run Ruins');
  if (hasModule(input, 'expeditions')) return worldRoute('expeditions', input.currentCityId, 'Send Expedition');
  return tabRoute('status', 'Read Status');
}

export function buildOnboardingSourceSinkGuards(
  input: BuildOnboardingSourceSinkGuardsInput,
): OnboardingSourceSinkGuard[] {
  const guards: OnboardingSourceSinkGuard[] = [];
  const active = input.activeMilestoneId;

  if (active === 'M3_world_outskirts' && hasModule(input, 'outskirts')) {
    guards.push({
      id: 'outskirts_gold_needs_pavilion_context',
      milestoneId: 'M3_world_outskirts',
      severity: 'info',
      title: 'Gold needs a future use',
      body: 'Outskirts gives gold and common materials. The Pavilion will soon turn that gold into your first manual.',
      primaryRoute: worldRoute('outskirts', input.currentCityId, 'Hunt Outskirts'),
      detail: hasTeaser(input, 'manualPavilion')
        ? 'Manual Pavilion is visible as the next lesson, but it stays sealed until the manual step is ready.'
        : 'The next lesson turns field gains into doctrine.',
    });
  }

  if (active === 'M4_pavilion_satchel') {
    const gold = parseAmount(input.currencies?.gold);
    const firstManualGoldCost = input.firstManualGoldCost ?? 1;
    if (gold < firstManualGoldCost) {
      const shortage = Math.max(0, firstManualGoldCost - gold);
      guards.push({
        id: 'pavilion_insufficient_gold_routes_outskirts',
        milestoneId: 'M4_pavilion_satchel',
        severity: 'blocked',
        title: 'Not enough gold for a manual',
        body: `This manual needs ${shortage} more gold. Hunt Outskirts once, then return to the Pavilion.`,
        primaryRoute: worldRoute('outskirts', input.currentCityId, 'Hunt Outskirts'),
      });
    }
  }

  if (active === 'M5_techniques_loadout' && (input.eligibleTechniqueCount ?? 0) <= 0 && input.manualStudyActive !== true) {
    guards.push({
      id: 'techniques_empty_routes_manual_study',
      milestoneId: 'M5_techniques_loadout',
      severity: 'blocked',
      title: 'No technique is ready to equip',
      body: 'Techniques needs studied knowledge. Finish a manual first, then return to set your loadout.',
      primaryRoute: tabRoute('records', 'Open Records'),
    });
  }

  if (active === 'M6_apothecary_expedition' && (input.pouchEquippedCount ?? 0) <= 0 && (input.medicineStockCount ?? 0) <= 0) {
    const route = (input.herbStockCount ?? 0) > 0 || !hasModule(input, 'expeditions')
      ? worldRoute('apothecary', input.currentCityId, 'Open Apothecary')
      : worldRoute('expeditions', input.currentCityId, 'Send Herb Expedition');
    guards.push({
      id: 'apothecary_no_stock_routes_source',
      milestoneId: 'M6_apothecary_expedition',
      severity: 'blocked',
      title: 'No medicine stocked',
      body: route.target.kind === 'world_module' && route.target.moduleKey === 'expeditions'
        ? 'Medicine needs herbs. Send a herb Expedition, then stock the pouch when supplies return.'
        : 'Preparation keeps harder fights stable. Buy or craft medicine, then place it in the pouch.',
      primaryRoute: route,
    });
  }

  if (active === 'M7_forge' && (input.forgeMissingMaterialIds?.length ?? 0) > 0) {
    const missingId = input.forgeMissingMaterialIds?.[0] ?? 'materials';
    const source = input.bestSourceByItemId?.[missingId] ?? null;
    guards.push({
      id: 'forge_missing_material_routes_source',
      milestoneId: 'M7_forge',
      severity: 'blocked',
      title: 'Forge is missing materials',
      body: source?.reason ?? 'The first weapon floor uses common materials. Outskirts is the first source; Ruins help with targeted shortages later.',
      primaryRoute: firstForgeSourceRoute(input),
      detail: `Missing: ${missingId}`,
    });
  }

  if (active === 'M8_ruins_bounties') {
    guards.push({
      id: 'ruins_bounties_support_route',
      milestoneId: 'M8_ruins_bounties',
      severity: 'info',
      title: 'Choose a support route',
      body: 'Ruins solve targeted shortages. Bounties point you toward useful work and build Merit for the safety net.',
      primaryRoute: hasModule(input, 'ruins')
        ? worldRoute('ruins', input.currentCityId, 'Open Ruins')
        : worldRoute('bounties', input.currentCityId, 'Open Bounty Board'),
    });

    if (hasTeaser(input, 'gateTrial') && !hasModule(input, 'gateTrial')) {
      guards.push({
        id: 'gate_trial_teaser_not_openable',
        milestoneId: 'M8_ruins_bounties',
        severity: 'locked',
        title: 'Gate Trial waits for support',
        body: 'The Gate Trial is visible as the next exam, but it opens after one support route proves your preparation.',
        primaryRoute: hasModule(input, 'ruins')
          ? worldRoute('ruins', input.currentCityId, 'Run Ruins')
          : worldRoute('bounties', input.currentCityId, 'Track Bounty'),
      });
    }
  }

  if (active === 'M9_gate_trial' && input.lastGateDefeat) {
    guards.push({
      id: 'gate_defeat_routes_top_fix',
      milestoneId: 'M9_gate_trial',
      severity: 'blocked',
      title: 'The gate found a gap',
      body: input.lastGateDefeat.topFixReason ?? 'This defeat does not end the lesson. Fix the top gap, then attempt the Gate again.',
      primaryRoute: routeForDestination(input.lastGateDefeat.topFixDestination, input.currentCityId),
      detail: input.lastGateDefeat.diagnosisCode ? `Diagnosis: ${input.lastGateDefeat.diagnosisCode}` : undefined,
    });
  }

  if ((active === 'complete' || input.firstLifeOnlyComplete) && input.firstLifeOnlyComplete) {
    guards.push({
      id: 'foundation_no_first_life_replay',
      milestoneId: 'complete',
      severity: 'info',
      title: 'Foundation established',
      body: 'The first city loop is complete. Future help stays contextual instead of replaying the beginner route.',
      primaryRoute: null,
    });
  }

  return guards;
}
