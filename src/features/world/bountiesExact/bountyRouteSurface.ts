import type { ValidatedContent } from '../../../content/index.js';
import type { EconomicProblemKind } from '../../../systems/economy/economicProblemKinds.js';
import { getSupportReserveTargetsByCityIndex } from '../../../systems/economy/supportCurrencyTargets.js';
import { p3ModuleRoute, type P3Route } from '../../../systems/world/p3SurfaceTypes.js';

export interface BountyRouteSurfaceV1 {
  version: 1;
  bountyId: string;
  cityId?: string;
  currentBlockerFit: 'primary' | 'secondary' | 'routine' | 'not_now';
  fitTags: BountyFitTag[];
  trackedObjectiveLine: string;
  meritTargetLine?: string;
  claimDelta?: string;
  moduleRoute?: P3Route;
  cityNoticeLine?: string;
  warnings: string[];
  debugNotes: string[];
}

export type BountyFitTag =
  | 'solves_current_blocker'
  | 'supports_safety_net'
  | 'supports_prep_package'
  | 'supports_material_drought'
  | 'routine_income'
  | 'city_recognition'
  | 'not_recommended_now';

export interface CityRecognitionSurfaceV1 {
  version: 1;
  cityId: string;
  state: 'unknown' | 'recognized' | 'gate_challenger' | 'realm_successor';
  title: string;
  noticeLine: string;
  unlockedBenefits: CityRecognitionBenefit[];
  futureBenefits: CityRecognitionBenefit[];
  debugNotes: string[];
}

export interface CityRecognitionBenefit {
  label: string;
  state: 'live' | 'future';
}

interface BuildBountyRouteSurfaceArgs {
  content: ValidatedContent;
  cityId: string;
  bountyId: string;
  currentBlockerKind?: EconomicProblemKind | null;
  currentMerit: string;
}

interface BuildCityRecognitionSurfaceArgs {
  content: ValidatedContent;
  cityId: string;
  gateCleared?: boolean;
  realmIndex: number;
}

export function buildBountyRouteSurface(args: BuildBountyRouteSurfaceArgs): BountyRouteSurfaceV1 {
  const city = args.content.cities.find((entry) => entry.id === args.cityId) ?? null;
  const bounty = args.content.bounties.templates.find((entry) => entry.id === args.bountyId) ?? null;
  const targets = getSupportReserveTargetsByCityIndex(city?.index ?? 0);
  const fitTags: BountyFitTag[] = ['routine_income', 'city_recognition'];
  if (args.currentBlockerKind === 'belowMeritReserve') fitTags.unshift('supports_safety_net', 'solves_current_blocker');
  if (args.currentBlockerKind === 'missingTargetedLocalMaterial') fitTags.unshift('supports_material_drought');
  if (args.currentBlockerKind === 'missingGatePrepPackage') fitTags.unshift('supports_prep_package');
  const currentBlockerFit: BountyRouteSurfaceV1['currentBlockerFit'] = fitTags.includes('solves_current_blocker')
    ? 'primary'
    : fitTags.includes('supports_prep_package') || fitTags.includes('supports_safety_net')
      ? 'secondary'
      : 'routine';

  return {
    version: 1,
    bountyId: args.bountyId,
    cityId: args.cityId,
    currentBlockerFit,
    fitTags: [...new Set(fitTags)],
    trackedObjectiveLine: bounty ? `${bounty.name}: ${bounty.desc}` : 'Bounty objective unavailable.',
    meritTargetLine: `Merit reserve ${args.currentMerit}/${targets.meritIdealReserve} toward Safety Net support.`,
    claimDelta: 'Claiming advances Merit/currency reserve if this bounty is complete.',
    moduleRoute: p3ModuleRoute('bounties', 'Track or claim directed support work.', args.cityId),
    cityNoticeLine: city ? `${city.name} notices directed support before gate pressure.` : undefined,
    warnings: bounty ? [] : ['Bounty template not found.'],
    debugNotes: [`cityIndex=${city?.index ?? 'unknown'}`],
  };
}

export function buildCityRecognitionSurface(args: BuildCityRecognitionSurfaceArgs): CityRecognitionSurfaceV1 {
  const city = args.content.cities.find((entry) => entry.id === args.cityId) ?? null;
  const state: CityRecognitionSurfaceV1['state'] = args.gateCleared
    ? 'gate_challenger'
    : args.realmIndex > (city?.index ?? 0)
      ? 'realm_successor'
      : city
        ? 'recognized'
        : 'unknown';
  return {
    version: 1,
    cityId: args.cityId,
    state,
    title: state === 'gate_challenger' ? 'Gate Challenger' : state === 'realm_successor' ? 'Realm Successor' : 'City Recognition',
    noticeLine: city ? `${city.name} records your current standing as ${state.replace(/_/g, ' ')}.` : 'City recognition unavailable.',
    unlockedBenefits: [],
    futureBenefits: [{ label: 'Recognition benefits are notice-only in P3 unless an existing runtime sink consumes them.', state: 'future' }],
    debugNotes: ['P3 keeps recognition as a notice layer.'],
  };
}

export function buildCityRecognitionMemoryLine(surface: CityRecognitionSurfaceV1): string | null {
  if (surface.state === 'unknown') return null;
  const title = surface.title;
  const standing = surface.state.replace(/_/g, ' ');
  return `${title}: ${surface.cityId} recorded ${standing} standing this life.`;
}
