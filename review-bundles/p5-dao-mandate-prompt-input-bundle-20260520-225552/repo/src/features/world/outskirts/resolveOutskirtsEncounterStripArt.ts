import type { OutskirtsEncounterNodeState } from './types.js';
import { OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC } from './outskirtsMockupPresentation.js';
import { OUTSKIRTS_ASSETS } from './outskirtsAssetRegistry.js';

interface ResolveOutskirtsEncounterStripArtArgs {
  id: string;
  state: OutskirtsEncounterNodeState;
  sourceMode: 'fixture' | 'stores';
}

export interface OutskirtsEncounterStripArtBindings {
  imageSrc: string | null;
  imagePosition: string;
  silhouetteImageSrc: string | null;
  completionMark: boolean;
  medallionVariant: 'wolf-jade' | 'quiet-field';
}

const SCENIC_CROP_POSITION: Record<string, string> = {
  'quiet-glade': '17% 74%',
  'rockjaw-boar': '35% 76%',
  'snarling-wolf': '51% 74%',
  venomcoil: '68% 74%',
  'shade-stalker': '82% 74%',
  'mire-serpent': '92% 74%',
};

const FUTURE_SILHOUETTE_SRC: Record<string, string> = {
  venomcoil: OUTSKIRTS_ASSETS.stripArt.slimeEnemy,
  'shade-stalker': OUTSKIRTS_ASSETS.stripArt.forestRabbitEnemy,
  'mire-serpent': OUTSKIRTS_ASSETS.stripArt.spiritDeerEnemy,
};

const COMPLETED_ART_SRC: Record<string, string> = {
  'quiet-glade': OUTSKIRTS_ASSETS.stripArt.cityOutskirtsBackdrop,
  'rockjaw-boar': OUTSKIRTS_ASSETS.stripArt.boarEnemy,
};

const CURRENT_ART_SRC: Record<string, string> = {
  'snarling-wolf': OUTSKIRTS_ASSETS.stripArt.wolfEnemy,
};

export function resolveOutskirtsEncounterStripArt({
  id,
  state,
  sourceMode,
}: ResolveOutskirtsEncounterStripArtArgs): OutskirtsEncounterStripArtBindings {
  const scenicCropSrc = sourceMode === 'fixture' ? OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC : OUTSKIRTS_ASSETS.stripArt.cityOutskirtsBackdrop;
  if (state === 'completed') {
    return {
      imageSrc: COMPLETED_ART_SRC[id] ?? scenicCropSrc,
      imagePosition: SCENIC_CROP_POSITION[id] ?? '50% 74%',
      silhouetteImageSrc: null,
      completionMark: true,
      medallionVariant: 'quiet-field',
    };
  }

  if (state === 'current') {
    return {
      imageSrc: CURRENT_ART_SRC[id] ?? OUTSKIRTS_ASSETS.stripArt.wolfEnemy,
      imagePosition: '50% 68%',
      silhouetteImageSrc: null,
      completionMark: false,
      medallionVariant: 'wolf-jade',
    };
  }

  return {
    imageSrc: scenicCropSrc,
    imagePosition: SCENIC_CROP_POSITION[id] ?? '78% 74%',
    silhouetteImageSrc: FUTURE_SILHOUETTE_SRC[id] ?? OUTSKIRTS_ASSETS.stripArt.slimeEnemy,
    completionMark: false,
    medallionVariant: 'quiet-field',
  };
}
