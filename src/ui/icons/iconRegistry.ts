import ancientSeedPng from '../../assets/icons/ancientseed.png';
import artifactBundlePng from '../../assets/icons/artifactbundle.png';
import artifactShardPng from '../../assets/icons/artifactshard.png';
import beastBloodPng from '../../assets/icons/beastblood.png';
import bookEarthPng from '../../assets/icons/book_earth.png';
import bookHeavenPng from '../../assets/icons/book_heaven.png';
import bookMartialPng from '../../assets/icons/book_martial.png';
import dustBluePng from '../../assets/icons/dust_blue.png';
import dustBrownPng from '../../assets/icons/dust_brown.png';
import dustGrayPng from '../../assets/icons/dust_gray.png';
import dustGreenPng from '../../assets/icons/dust_green.png';
import dustPurplePng from '../../assets/icons/dust_purple.png';
import foundationPillPng from '../../assets/icons/foundationpill.png';
import herbBundlePng from '../../assets/icons/herbbundle.png';
import hourglassEmptyPng from '../../assets/icons/hourglass_empty.png';
import hourglassProgressPng from '../../assets/icons/hourglass_progress.png';
import jadeSwordPng from '../../assets/icons/jadesword.png';
import metalChunkPng from '../../assets/icons/metalchunk.png';
import placeholderRingLargePng from '../../assets/icons/placeholder_ring_large.png';
import placeholderRingSmallPng from '../../assets/icons/placeholder_ring_small.png';
import prayerBeadsPng from '../../assets/icons/prayerbeads.png';
import rustySwordPng from '../../assets/icons/rustysword.png';
import spiritGrassPng from '../../assets/icons/spiritgrass.png';
import taskCompletePng from '../../assets/icons/task_complete.png';

export type IconMeta = {
  src: string;
  scale: number;
  translateY?: number;
};

export const ICONS = {
  ancientSeed: { src: ancientSeedPng, scale: 1.2 },
  artifactBundle: { src: artifactBundlePng, scale: 1.25 },
  artifactShard: { src: artifactShardPng, scale: 1 },
  beastBlood: { src: beastBloodPng, scale: 1 },
  bookEarth: { src: bookEarthPng, scale: 1 },
  bookHeaven: { src: bookHeavenPng, scale: 1 },
  bookMartial: { src: bookMartialPng, scale: 1 },
  dustBlue: { src: dustBluePng, scale: 1.55, translateY: -8 },
  dustBrown: { src: dustBrownPng, scale: 1.55, translateY: -8 },
  dustGray: { src: dustGrayPng, scale: 1.55, translateY: -8 },
  dustGreen: { src: dustGreenPng, scale: 1.55, translateY: -8 },
  dustPurple: { src: dustPurplePng, scale: 1.55, translateY: -8 },
  foundationPill: { src: foundationPillPng, scale: 1 },
  herbBundle: { src: herbBundlePng, scale: 1.25 },
  hourglassEmpty: { src: hourglassEmptyPng, scale: 1.15 },
  hourglassProgress: { src: hourglassProgressPng, scale: 1.15 },
  jadeSword: { src: jadeSwordPng, scale: 1 },
  metalChunk: { src: metalChunkPng, scale: 1.05 },
  placeholderRingLarge: { src: placeholderRingLargePng, scale: 1 },
  placeholderRingSmall: { src: placeholderRingSmallPng, scale: 1 },
  prayerBeads: { src: prayerBeadsPng, scale: 1 },
  rustySword: { src: rustySwordPng, scale: 1.1 },
  spiritGrass: { src: spiritGrassPng, scale: 1 },
  taskComplete: { src: taskCompletePng, scale: 1 },
} satisfies Record<string, IconMeta>;

export type IconId = keyof typeof ICONS;

export const getIconMeta = (id: IconId) => ICONS[id];
