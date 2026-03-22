import type { NormalizedForgeBlueprint } from '../../content/forge.js';

export type LiveForgeSurfaceTab = 'refine' | 'temper' | 'runes';
export type ForgeModeOption = 'idle' | 'assisted' | 'handsOn';
export type ForgeJobModeOption = 'IDLE' | 'ASSISTED' | 'HANDS_ON';

export const LIVE_FORGE_SURFACE_TABS: ReadonlyArray<{ id: LiveForgeSurfaceTab; label: string }> = [
  { id: 'refine', label: 'Refine' },
  { id: 'temper', label: 'Temper' },
  { id: 'runes', label: 'Runes' },
];

const MODE_TO_JOB: Record<ForgeModeOption, ForgeJobModeOption> = {
  idle: 'IDLE',
  assisted: 'ASSISTED',
  handsOn: 'HANDS_ON',
};

const JOB_TO_MODE: Record<ForgeJobModeOption, ForgeModeOption> = {
  IDLE: 'idle',
  ASSISTED: 'assisted',
  HANDS_ON: 'handsOn',
};

export function getForgeSurfaceTabForBlueprint(blueprint: Pick<NormalizedForgeBlueprint, 'service' | 'type' | 'output'>): LiveForgeSurfaceTab {
  if (blueprint.type === 'service' && blueprint.service === 'refine') return 'refine';
  if (blueprint.type === 'service' && blueprint.service === 'temper') return 'temper';
  return 'runes';
}

export function getAllowedForgeModes(blueprint: Pick<NormalizedForgeBlueprint, 'service' | 'type' | 'stepScript' | 'handsOnBonus' | 'output'>): ForgeModeOption[] {
  if (blueprint.type === 'service' && blueprint.service === 'refine') {
    return ['idle', 'assisted'];
  }

  if (blueprint.type === 'service' && blueprint.service === 'temper') {
    return (blueprint.stepScript?.length ?? 0) > 0 || blueprint.handsOnBonus
      ? ['idle', 'assisted', 'handsOn']
      : ['idle', 'assisted'];
  }

  if (blueprint.type === 'craft' && blueprint.output?.itemId?.startsWith('rune_')) {
    return ['idle', 'assisted', 'handsOn'];
  }

  return ['idle'];
}

export function isForgeModeAllowed(
  blueprint: Pick<NormalizedForgeBlueprint, 'service' | 'type' | 'stepScript' | 'handsOnBonus' | 'output'>,
  mode: ForgeModeOption,
): boolean {
  return getAllowedForgeModes(blueprint).includes(mode);
}

export function getDefaultForgeMode(
  blueprint: Pick<NormalizedForgeBlueprint, 'service' | 'type' | 'stepScript' | 'handsOnBonus' | 'output'>,
): ForgeModeOption {
  return getAllowedForgeModes(blueprint)[0] ?? 'idle';
}

export function toForgeJobMode(mode: ForgeModeOption): ForgeJobModeOption {
  return MODE_TO_JOB[mode];
}

export function fromForgeJobMode(mode: ForgeJobModeOption): ForgeModeOption {
  return JOB_TO_MODE[mode];
}
