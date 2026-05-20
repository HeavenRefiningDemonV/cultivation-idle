import type { OutskirtsScenicStage } from './types.js';
import { OUTSKIRTS_ASSETS } from './outskirtsAssetRegistry.js';

export interface ResolveOutskirtsScenicAssetArgs {
  scenic: OutskirtsScenicStage;
  selectedEncounterId: string;
}

export interface OutskirtsScenicBindings {
  sceneBaseSrc: string | null;
  sceneBasePosition: string;
  encounterLayerSrc: string | null;
  encounterLayerPosition: string;
  encounterLayerScale: number;
  useApprovedFixtureComposite: boolean;
  showAtmosphere: boolean;
  showForegroundMist: boolean;
  showEdgeFade: boolean;
  maskVariant: 'review' | 'live';
  sceneVariantId: string;
}

const ENCOUNTER_LAYER_BY_ID: Record<string, { src: string | null; position: string; scale: number }> = {
  'quiet-glade': { src: null, position: '50% 72%', scale: 1 },
  'rockjaw-boar': { src: OUTSKIRTS_ASSETS.stripArt.boarEnemy, position: '46% 78%', scale: 0.74 },
  'snarling-wolf': { src: OUTSKIRTS_ASSETS.stripArt.wolfEnemy, position: '50% 78%', scale: 0.9 },
  venomcoil: { src: OUTSKIRTS_ASSETS.stripArt.slimeEnemy, position: '70% 80%', scale: 0.62 },
  'shade-stalker': { src: OUTSKIRTS_ASSETS.stripArt.forestRabbitEnemy, position: '57% 79%', scale: 0.66 },
  'mire-serpent': { src: OUTSKIRTS_ASSETS.stripArt.spiritDeerEnemy, position: '62% 79%', scale: 0.72 },
};

export function resolveOutskirtsScenicAsset({ scenic, selectedEncounterId }: ResolveOutskirtsScenicAssetArgs): OutskirtsScenicBindings {
  const useApprovedFixtureComposite = scenic.useApprovedMockupCrop;
  const sceneBaseSrc = useApprovedFixtureComposite
    ? scenic.reviewFixtureImageSrc ?? scenic.scenicImageSrc
    : scenic.scenicImageSrc ?? scenic.liveFallbackImageSrc;
  const encounterBinding = ENCOUNTER_LAYER_BY_ID[selectedEncounterId] ?? ENCOUNTER_LAYER_BY_ID['snarling-wolf'];
  const shouldRenderEncounterLayer = !useApprovedFixtureComposite && Boolean(encounterBinding?.src);

  return {
    sceneBaseSrc,
    sceneBasePosition: useApprovedFixtureComposite ? '50% 56%' : '50% 58%',
    encounterLayerSrc: shouldRenderEncounterLayer ? encounterBinding.src : null,
    encounterLayerPosition: encounterBinding?.position ?? '50% 78%',
    encounterLayerScale: encounterBinding?.scale ?? 0.86,
    useApprovedFixtureComposite,
    showAtmosphere: true,
    showForegroundMist: true,
    showEdgeFade: true,
    maskVariant: useApprovedFixtureComposite ? 'review' : 'live',
    sceneVariantId: selectedEncounterId,
  };
}
