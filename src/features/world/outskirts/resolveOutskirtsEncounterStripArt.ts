import type { OutskirtsEncounterNodeState } from './types.js';
import { OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC } from './outskirtsMockupPresentation.js';

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
  venomcoil: '/assets/enemies/slime.png',
  'shade-stalker': '/assets/enemies/forestrabbit.png',
  'mire-serpent': '/assets/enemies/spiritdeer.png',
};

const COMPLETED_ART_SRC: Record<string, string> = {
  'quiet-glade': '/assets/background/citystates/city_outskirts.png',
  'rockjaw-boar': '/assets/enemies/widboar.png',
};

const CURRENT_ART_SRC: Record<string, string> = {
  'snarling-wolf': '/assets/enemies/wolfpup.png',
};

export function resolveOutskirtsEncounterStripArt({
  id,
  state,
  sourceMode,
}: ResolveOutskirtsEncounterStripArtArgs): OutskirtsEncounterStripArtBindings {
  const scenicCropSrc = sourceMode === 'fixture' ? OUTSKIRTS_APPROVED_SCENIC_MOCKUP_SRC : '/assets/background/citystates/city_outskirts.png';
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
      imageSrc: CURRENT_ART_SRC[id] ?? '/assets/enemies/wolfpup.png',
      imagePosition: '50% 68%',
      silhouetteImageSrc: null,
      completionMark: false,
      medallionVariant: 'wolf-jade',
    };
  }

  return {
    imageSrc: scenicCropSrc,
    imagePosition: SCENIC_CROP_POSITION[id] ?? '78% 74%',
    silhouetteImageSrc: FUTURE_SILHOUETTE_SRC[id] ?? '/assets/enemies/slime.png',
    completionMark: false,
    medallionVariant: 'quiet-field',
  };
}
