import type {
  ForgeExactButtonSurface,
  ForgeExactMode,
  ForgeExactTab,
  ForgeExactTruthCell,
} from './forgeExactTypes.js';

export const FORGE_EXACT_SURFACE_VERSION = 1 as const;
export const FORGE_EXACT_ROOT_TEST_ID = 'forge-exact-page' as const;
export const FORGE_EXACT_DEFAULT_CITY_ID = 'city_pinewind_hamlet';

export const FORGE_EXACT_DESIGN_PLANE = {
  width: 2048,
  height: 1152,
} as const;

export const FORGE_EXACT_TABS: ReadonlyArray<{ id: ForgeExactTab; label: string }> = [
  { id: 'refine', label: 'Refine' },
  { id: 'temper', label: 'Temper' },
  { id: 'runes', label: 'Runes' },
];

export const FORGE_EXACT_MODES: ReadonlyArray<{ id: ForgeExactMode; label: string }> = [
  { id: 'idle', label: 'Idle' },
  { id: 'assisted', label: 'Assisted' },
  { id: 'handsOn', label: 'Hands-on' },
];

export const FORGE_EXACT_FIXTURE_TRUTH_CELLS: readonly [
  ForgeExactTruthCell,
  ForgeExactTruthCell,
  ForgeExactTruthCell,
  ForgeExactTruthCell,
  ForgeExactTruthCell,
  ForgeExactTruthCell,
  ForgeExactTruthCell,
] = [
  { id: 'next-test', label: 'Next Test', value: 'Foundation Gate', icon: 'bookEarth', status: 'neutral' },
  { id: 'readiness', label: 'Readiness', value: '74 / 100', icon: 'foundationPill', status: 'warning' },
  { id: 'weapon-floor', label: 'Weapon Floor', value: '+2 / +3', icon: 'rustySword', status: 'missing' },
  { id: 'accessory-floor', label: 'Accessory Floor', value: '+1 / +2', icon: 'prayerBeads', status: 'warning' },
  { id: 'temper', label: 'Temper', value: '0 / 1', icon: 'metalChunk', status: 'warning' },
  { id: 'rune-target', label: 'Rune Target', value: 'None', icon: 'artifactShard', status: 'neutral' },
  { id: 'queue', label: 'Queue', value: 'Idle', icon: 'hourglassEmpty', status: 'met' },
];

export function createForgeExactButton(
  id: string,
  label: string,
  intent: ForgeExactButtonSurface['intent'],
  options: Partial<Omit<ForgeExactButtonSurface, 'id' | 'label' | 'intent' | 'enabled' | 'variant'>> & {
    enabled?: boolean;
    variant?: ForgeExactButtonSurface['variant'];
  } = {},
): ForgeExactButtonSurface {
  return {
    id,
    label,
    intent,
    enabled: options.enabled ?? true,
    variant: options.variant ?? 'secondary',
    ...options,
  };
}

export function getForgeExactTabLabel(tab: ForgeExactTab): string {
  return FORGE_EXACT_TABS.find((entry) => entry.id === tab)?.label ?? 'Forge';
}

export function getForgeExactModeLabel(mode: ForgeExactMode): string {
  return FORGE_EXACT_MODES.find((entry) => entry.id === mode)?.label ?? 'Idle';
}
