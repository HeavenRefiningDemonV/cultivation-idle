import type { HeartLawDef } from '../../content/types.js';
import type { SpiritRoot, SpiritRootElement } from '../../types/index.js';
import type { RootResonanceForRisk } from '../breakthrough/breakthroughStabilityResolver.js';

export type RootHeartFitTier = 'resonant' | 'compatible' | 'neutral' | 'strained' | 'opposed';

export interface RootRouteBias {
  id: string;
  label: string;
  detail: string;
}

export interface RootVfxRow {
  id: string;
  label: string;
  detail: string;
  intensity: 'quiet' | 'steady' | 'volatile';
}

export interface RootStyleProfile {
  elementId: SpiritRootElement;
  playstyleLabel: string;
  temperamentTags: string[];
  routeBiases: RootRouteBias[];
  vfxRows: RootVfxRow[];
}

export interface RootHeartFitEffects {
  cultivationSpeedMult: number;
  heartLawXpMult: number;
  rootResonanceGainMult: number;
  turbulenceDeltaPerMinute: number;
  expressionCap: number;
  procChanceCapAddPct: number;
}

export interface RootHeartFitRecoveryRoute {
  variantId: string;
  label: string;
  detail: string;
  unlockResonance: number;
  practiceIds: readonly ('scripture_copying' | 'breath_harmonization')[];
  unlocked: boolean;
}

export interface RootHeartFitResult {
  tier: RootHeartFitTier;
  label: string;
  summary: string;
  style: RootStyleProfile;
  effects: RootHeartFitEffects;
  effectiveExpression: number;
  recoveryRoute: RootHeartFitRecoveryRoute | null;
  hardLocksMismatchRoutes: false;
}

export interface ResolveRootHeartFitInput {
  root: SpiritRoot | null;
  heartLaw: HeartLawDef | null;
  currentRootResonance?: number | null;
  unlockedVariantIds?: readonly string[] | null;
}

const ROOT_STYLE_PROFILES: Readonly<Record<SpiritRootElement, RootStyleProfile>> = Object.freeze({
  wood: {
    elementId: 'wood',
    playstyleLabel: 'Sustaining Growth',
    temperamentTags: ['sustaining', 'restorative', 'patient'],
    routeBiases: [
      { id: 'wood-sustain', label: 'Sustain routes', detail: 'Favors steady recovery, medicine, and long-form support.' },
    ],
    vfxRows: [
      { id: 'vfx-wood-renewal', label: 'Verdant renewal', detail: 'Leaf motes answer recovery and support rows.', intensity: 'steady' },
    ],
  },
  fire: {
    elementId: 'fire',
    playstyleLabel: 'Explosive Volatility',
    temperamentTags: ['explosive', 'volatile', 'harsh'],
    routeBiases: [
      { id: 'fire-burst', label: 'Burst routes', detail: 'Favors opener pressure, explosive attacks, and sharp breakthrough timing.' },
      { id: 'fire-harsh', label: 'Harsh routes', detail: 'Harsh practice converts volatility into usable pressure instead of safety.' },
    ],
    vfxRows: [
      { id: 'vfx-fire-volatility', label: 'Cinnabar flare', detail: 'Flame rows pulse harder when fit is strained or opposed.', intensity: 'volatile' },
    ],
  },
  earth: {
    elementId: 'earth',
    playstyleLabel: 'Braced Foundation',
    temperamentTags: ['bracing', 'bodied', 'patient'],
    routeBiases: [
      { id: 'earth-brace', label: 'Brace routes', detail: 'Favors body tempering, defense floors, and stable gate attempts.' },
    ],
    vfxRows: [
      { id: 'vfx-earth-brace', label: 'Bronze footing', detail: 'Ground seals thicken around stability and defense rows.', intensity: 'steady' },
    ],
  },
  metal: {
    elementId: 'metal',
    playstyleLabel: 'Precise Edge',
    temperamentTags: ['precise', 'forged', 'cutting'],
    routeBiases: [
      { id: 'metal-precision', label: 'Precision routes', detail: 'Favors weapon bond, forge floors, and focused strike windows.' },
    ],
    vfxRows: [
      { id: 'vfx-metal-edge', label: 'Keen edge', detail: 'Metal glints appear around forge and technique fit rows.', intensity: 'steady' },
    ],
  },
  water: {
    elementId: 'water',
    playstyleLabel: 'Flowing Safety',
    temperamentTags: ['flowing', 'safe', 'adaptive'],
    routeBiases: [
      { id: 'water-flow', label: 'Flow routes', detail: 'Favors safety, cooldown smoothing, and patient correction.' },
    ],
    vfxRows: [
      { id: 'vfx-water-flow', label: 'Jade current', detail: 'Water bands smooth around safety and pouch rows.', intensity: 'steady' },
    ],
  },
  wind: {
    elementId: 'wind',
    playstyleLabel: 'Mobile Drift',
    temperamentTags: ['mobile', 'evasive', 'restless'],
    routeBiases: [
      { id: 'wind-mobility', label: 'Mobility routes', detail: 'Favors movement, avoidance, and fast route corrections.' },
    ],
    vfxRows: [
      { id: 'vfx-wind-drift', label: 'Ink drift', detail: 'Wind strokes trail movement and route rows.', intensity: 'quiet' },
    ],
  },
  lightning: {
    elementId: 'lightning',
    playstyleLabel: 'Volatile Interruption',
    temperamentTags: ['interrupting', 'volatile', 'burst'],
    routeBiases: [
      { id: 'lightning-interrupt', label: 'Interruption routes', detail: 'Favors spike windows and unstable initiative.' },
    ],
    vfxRows: [
      { id: 'vfx-lightning-spark', label: 'Jolt script', detail: 'Lightning strokes crackle around burst rows.', intensity: 'volatile' },
    ],
  },
  ice: {
    elementId: 'ice',
    playstyleLabel: 'Still Control',
    temperamentTags: ['still', 'controlling', 'defensive'],
    routeBiases: [
      { id: 'ice-control', label: 'Control routes', detail: 'Favors slowing pressure and defensive timing.' },
    ],
    vfxRows: [
      { id: 'vfx-ice-stillness', label: 'Frost seal', detail: 'Frost lines settle around control rows.', intensity: 'quiet' },
    ],
  },
  light: {
    elementId: 'light',
    playstyleLabel: 'Clear Restoration',
    temperamentTags: ['clear', 'restorative', 'righteous'],
    routeBiases: [
      { id: 'light-clear', label: 'Clarity routes', detail: 'Favors cleanse, recovery, and clean doctrine expression.' },
    ],
    vfxRows: [
      { id: 'vfx-light-radiance', label: 'Clear radiance', detail: 'Soft light marks clarity and recovery rows.', intensity: 'steady' },
    ],
  },
  shadow: {
    elementId: 'shadow',
    playstyleLabel: 'Hidden Counter',
    temperamentTags: ['hidden', 'countering', 'evasive'],
    routeBiases: [
      { id: 'shadow-counter', label: 'Counter routes', detail: 'Favors avoidance, counter-entry, and indirect pressure.' },
    ],
    vfxRows: [
      { id: 'vfx-shadow-thread', label: 'Hidden thread', detail: 'Shadow strokes appear around evasion rows.', intensity: 'quiet' },
    ],
  },
  soul: {
    elementId: 'soul',
    playstyleLabel: 'Lantern Continuity',
    temperamentTags: ['soulful', 'shielding', 'continuous'],
    routeBiases: [
      { id: 'soul-lantern', label: 'Lantern routes', detail: 'Favors spirit shields, support, and long memory.' },
    ],
    vfxRows: [
      { id: 'vfx-soul-lantern', label: 'Soul lantern', detail: 'Lantern light answers sustain rows.', intensity: 'steady' },
    ],
  },
  void: {
    elementId: 'void',
    playstyleLabel: 'Hollow Control',
    temperamentTags: ['hollow', 'controlling', 'piercing'],
    routeBiases: [
      { id: 'void-control', label: 'Control routes', detail: 'Favors defense slipping and late-root control.' },
    ],
    vfxRows: [
      { id: 'vfx-void-ring', label: 'Hollow ring', detail: 'Void rings mark control and armor-pierce rows.', intensity: 'quiet' },
    ],
  },
  time: {
    elementId: 'time',
    playstyleLabel: 'Cadence Control',
    temperamentTags: ['cadenced', 'controlling', 'patient'],
    routeBiases: [
      { id: 'time-cadence', label: 'Cadence routes', detail: 'Favors cooldown smoothing and late-root timing.' },
    ],
    vfxRows: [
      { id: 'vfx-time-cadence', label: 'Moment fold', detail: 'Hourglass strokes mark cadence rows.', intensity: 'quiet' },
    ],
  },
  astral: {
    elementId: 'astral',
    playstyleLabel: 'Star Precision',
    temperamentTags: ['starwise', 'precise', 'late'],
    routeBiases: [
      { id: 'astral-star', label: 'Star routes', detail: 'Favors late-root precision and celestial strike windows.' },
    ],
    vfxRows: [
      { id: 'vfx-astral-star', label: 'Star trace', detail: 'Star points answer precision rows.', intensity: 'steady' },
    ],
  },
});

export const ROOT_HEART_FIT_EFFECTS: Readonly<Record<RootHeartFitTier, RootHeartFitEffects>> = Object.freeze({
  resonant: Object.freeze({
    cultivationSpeedMult: 1.08,
    heartLawXpMult: 1.1,
    rootResonanceGainMult: 1.25,
    turbulenceDeltaPerMinute: -0.04,
    expressionCap: 100,
    procChanceCapAddPct: 1.5,
  }),
  compatible: Object.freeze({
    cultivationSpeedMult: 1.04,
    heartLawXpMult: 1.04,
    rootResonanceGainMult: 1.1,
    turbulenceDeltaPerMinute: -0.01,
    expressionCap: 86,
    procChanceCapAddPct: 0.75,
  }),
  neutral: Object.freeze({
    cultivationSpeedMult: 1,
    heartLawXpMult: 1,
    rootResonanceGainMult: 1,
    turbulenceDeltaPerMinute: 0,
    expressionCap: 75,
    procChanceCapAddPct: 0,
  }),
  strained: Object.freeze({
    cultivationSpeedMult: 0.92,
    heartLawXpMult: 0.9,
    rootResonanceGainMult: 0.75,
    turbulenceDeltaPerMinute: 0.08,
    expressionCap: 58,
    procChanceCapAddPct: -1,
  }),
  opposed: Object.freeze({
    cultivationSpeedMult: 0.84,
    heartLawXpMult: 0.82,
    rootResonanceGainMult: 0.55,
    turbulenceDeltaPerMinute: 0.18,
    expressionCap: 42,
    procChanceCapAddPct: -2,
  }),
});

const RECOVERY_ROUTE_BY_PAIR: Readonly<Record<string, Omit<RootHeartFitRecoveryRoute, 'unlocked'>>> = Object.freeze({
  'fire::heart_quiet_breath_method': Object.freeze({
    variantId: 'fire_banked_ember',
    label: 'Banked Ember',
    detail: 'Scripture Copying and Breath Harmonization bank fire into a safer opener instead of bricking the run.',
    unlockResonance: 58,
    practiceIds: ['scripture_copying', 'breath_harmonization'] as const,
  }),
  'earth::heart_stormstep_diagram': Object.freeze({
    variantId: 'earth_dust_step',
    label: 'Dust Step',
    detail: 'Storm movement can be answered by footing practice and a conversion variant.',
    unlockResonance: 62,
    practiceIds: ['scripture_copying', 'breath_harmonization'] as const,
  }),
  'metal::heart_verdant_pulse_canon': Object.freeze({
    variantId: 'metal_living_blade',
    label: 'Living Blade',
    detail: 'Wood doctrine can be carried through a living edge variant.',
    unlockResonance: 60,
    practiceIds: ['scripture_copying', 'breath_harmonization'] as const,
  }),
  'water::heart_heaven_flame_manual': Object.freeze({
    variantId: 'water_steam_mandate',
    label: 'Steam Mandate',
    detail: 'Heaven Flame can be cooled into stability through a conversion route.',
    unlockResonance: 65,
    practiceIds: ['scripture_copying', 'breath_harmonization'] as const,
  }),
});

const COMPATIBLE_BY_ELEMENT: Readonly<Record<SpiritRootElement, readonly SpiritRootElement[]>> = Object.freeze({
  wood: ['water', 'fire', 'light'],
  fire: ['wood', 'lightning', 'light', 'metal'],
  earth: ['metal', 'water', 'wood'],
  metal: ['earth', 'water', 'void'],
  water: ['wood', 'earth', 'metal', 'time'],
  wind: ['lightning', 'wood', 'shadow'],
  lightning: ['wind', 'fire', 'light'],
  ice: ['water', 'wind', 'time'],
  light: ['fire', 'lightning', 'soul'],
  shadow: ['wind', 'void', 'soul'],
  soul: ['light', 'shadow', 'water'],
  void: ['metal', 'shadow', 'astral'],
  time: ['water', 'ice', 'astral'],
  astral: ['void', 'time', 'light'],
});

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function pairKey(root: SpiritRoot | null, law: HeartLawDef | null): string {
  return `${root?.element ?? 'none'}::${law?.id ?? 'none'}`;
}

function liveAffinities(law: HeartLawDef | null): SpiritRootElement[] {
  const affinities = law?.spiritRootAffinities ?? [];
  return affinities.filter((entry): entry is SpiritRootElement => Object.hasOwn(ROOT_STYLE_PROFILES, entry));
}

function hasAnyAffinity(law: HeartLawDef | null): boolean {
  return (law?.spiritRootAffinities ?? []).includes('any');
}

function resolveRecoveryRoute(input: ResolveRootHeartFitInput): RootHeartFitRecoveryRoute | null {
  const route = RECOVERY_ROUTE_BY_PAIR[pairKey(input.root, input.heartLaw)];
  if (!route) return null;
  const unlocked = Boolean(input.unlockedVariantIds?.includes(route.variantId));
  return { ...route, practiceIds: [...route.practiceIds], unlocked };
}

function resolveTier(input: ResolveRootHeartFitInput, recoveryRoute: RootHeartFitRecoveryRoute | null): RootHeartFitTier {
  const root = input.root;
  const law = input.heartLaw;
  if (!root || !law) return 'neutral';
  if (recoveryRoute?.unlocked) return 'compatible';

  if (pairKey(root, law) === 'fire::heart_quiet_breath_method') return 'opposed';
  if (recoveryRoute) return 'strained';

  const affinities = liveAffinities(law);
  if (affinities.includes(root.element)) return 'resonant';
  if (hasAnyAffinity(law) || affinities.length === 0) return 'neutral';
  if (affinities.some((affinity) => COMPATIBLE_BY_ELEMENT[root.element].includes(affinity))) return 'compatible';
  return 'opposed';
}

function labelForTier(tier: RootHeartFitTier): string {
  switch (tier) {
    case 'resonant': return 'Resonant';
    case 'compatible': return 'Compatible';
    case 'neutral': return 'Neutral';
    case 'strained': return 'Strained';
    case 'opposed': return 'Opposed';
  }
}

function summaryFor(input: ResolveRootHeartFitInput, tier: RootHeartFitTier, style: RootStyleProfile): string {
  const lawName = input.heartLaw?.name ?? 'no selected Heart Law';
  switch (tier) {
    case 'resonant':
      return `${style.playstyleLabel} resonates with ${lawName}.`;
    case 'compatible':
      return `${style.playstyleLabel} can work with ${lawName} through a compatible expression.`;
    case 'strained':
      return `${style.playstyleLabel} strains against ${lawName}; conversion practice keeps the run playable.`;
    case 'opposed':
      return `${style.playstyleLabel} resists ${lawName}; speed and law XP fall until a recovery route is practiced.`;
    case 'neutral':
      return `${style.playstyleLabel} has no strong pressure against ${lawName}.`;
  }
}

export function getRootStyleProfile(element: SpiritRootElement): RootStyleProfile {
  const profile = ROOT_STYLE_PROFILES[element];
  return {
    ...profile,
    temperamentTags: [...profile.temperamentTags],
    routeBiases: profile.routeBiases.map((row) => ({ ...row })),
    vfxRows: profile.vfxRows.map((row) => ({ ...row })),
  };
}

export function resolveRootHeartFit(input: ResolveRootHeartFitInput): RootHeartFitResult {
  const style = input.root ? getRootStyleProfile(input.root.element) : {
    elementId: 'wood' as const,
    playstyleLabel: 'Dormant Root',
    temperamentTags: ['dormant'],
    routeBiases: [{ id: 'dormant-root', label: 'Dormant route', detail: 'Spirit Root has not manifested yet.' }],
    vfxRows: [{ id: 'vfx-dormant-root', label: 'Dormant seal', detail: 'No elemental VFX row is active.', intensity: 'quiet' as const }],
  };
  const recoveryRoute = resolveRecoveryRoute(input);
  const tier = resolveTier(input, recoveryRoute);
  const effects = ROOT_HEART_FIT_EFFECTS[tier];
  const currentRootResonance = clamp(input.currentRootResonance ?? 0, 0, 100);
  const effectiveExpression = clamp(currentRootResonance, 0, effects.expressionCap);

  return {
    tier,
    label: labelForTier(tier),
    summary: summaryFor(input, tier, style),
    style,
    effects: { ...effects },
    effectiveExpression,
    recoveryRoute,
    hardLocksMismatchRoutes: false,
  };
}

export function rootHeartFitTierToRiskResonance(tier: RootHeartFitTier): RootResonanceForRisk {
  switch (tier) {
    case 'resonant':
      return 'exact';
    case 'compatible':
      return 'soft';
    case 'strained':
    case 'opposed':
      return 'mismatch';
    case 'neutral':
      return 'neutral';
  }
}

export function describeRootHeartFitEffect(value: number): string {
  if (value > 1) return `+${Math.round((value - 1) * 100)}%`;
  if (value < 1) return `-${Math.round((1 - value) * 100)}%`;
  return '0%';
}

export function displayRootHeartFitTier(tier: RootHeartFitTier): string {
  return titleCase(tier);
}
