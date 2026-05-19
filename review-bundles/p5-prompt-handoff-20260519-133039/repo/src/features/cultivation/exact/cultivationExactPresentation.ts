import type { CultivationExactSurfaceV1 } from './cultivationExactTypes.js';

export const CULTIVATION_EXACT_SURFACE_ID = 'cultivation-exact' as const;
export const CULTIVATION_EXACT_SURFACE_VERSION = 'lotus-meditation-terrace.v1' as const;
export const CULTIVATION_EXACT_ROOT_TEST_ID = 'cultivation-exact-page' as const;

export function isCultivationExactQueryModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const mode = new URLSearchParams(window.location.search).get('cultivationExactMode');
  return mode === 'fixture' || mode === 'live';
}

export const CULTIVATION_EXACT_REGION_ORDER = [
  'top-ribbon',
  'left-milestone-seals',
  'center-altar',
  'right-doctrine-rail',
  'breakthrough-seal',
  'qi-rail',
  'command-deck',
] as const;

export const CULTIVATION_EXACT_FIXTURE_COPY = {
  realm: 'Qi Condensation',
  stage: 'Stage 7',
  qi: '5.5M',
  qiRequirement: '24.4M',
  rate: '292.25 / s',
  stability: '0%',
  foreground: 'Cultivating',
  nextMilestone: 'Push Qi',
  needTitle: 'Qi Cap',
  action: 'Continue Cultivation',
  path: 'Heaven',
  spiritRoot: 'Fire / Rare',
  heartLaw: 'Ember Thread Sutra',
  verse: 'Chapter 1',
  breathFocus: 'Balanced',
} as const;

export function createCultivationExactShellFlags(): CultivationExactSurfaceV1['shell'] {
  return {
    preserveHeroArt: true,
    showLegacySidePanels: false,
    singleDominantQiBar: true,
    singlePrimaryAction: true,
    useMockupAsSingleBitmap: false,
  };
}

export function createCultivationExactVisualFlags(): CultivationExactSurfaceV1['centerAltar']['visualFlags'] {
  return {
    usesExistingCbgFull: true,
    replacesHeroArt: false,
    coversCultivatorFace: false,
    coversDantian: false,
  };
}
