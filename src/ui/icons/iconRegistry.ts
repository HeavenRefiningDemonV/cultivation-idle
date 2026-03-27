import type { IconComponent } from './InkIcon.js';

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
import {
  InkBoltIcon,
  InkBurstIcon,
  InkCheckIcon,
  InkChevronDownIcon,
  InkChevronUpIcon,
  InkHeartIcon,
  InkLockIcon,
  InkRefreshIcon,
  InkShieldIcon,
  InkSparklesIcon,
  InkSwirlIcon,
  InkWarningIcon,
  InkWipIcon,
  InkXIcon,
} from './InkIcon.js';

export type PngIconMeta = {
  kind: 'png';
  src: string;
  scale?: number;
  translateY?: number;
};

export type SvgIconMeta = {
  kind: 'svg';
  Svg: IconComponent;
  scale?: number;
  translateY?: number;
};

export type IconMeta = PngIconMeta | SvgIconMeta;

export const ICONS = {
  ancientSeed: { kind: 'png', src: ancientSeedPng, scale: 1.2 },
  artifactBundle: { kind: 'png', src: artifactBundlePng, scale: 1.25 },
  artifactShard: { kind: 'png', src: artifactShardPng, scale: 1 },
  beastBlood: { kind: 'png', src: beastBloodPng, scale: 1 },
  bookEarth: { kind: 'png', src: bookEarthPng, scale: 1 },
  bookHeaven: { kind: 'png', src: bookHeavenPng, scale: 1 },
  bookMartial: { kind: 'png', src: bookMartialPng, scale: 1 },
  dustBlue: { kind: 'png', src: dustBluePng, scale: 1.55, translateY: -8 },
  dustBrown: { kind: 'png', src: dustBrownPng, scale: 1.55, translateY: -8 },
  dustGray: { kind: 'png', src: dustGrayPng, scale: 1.55, translateY: -8 },
  dustGreen: { kind: 'png', src: dustGreenPng, scale: 1.55, translateY: -8 },
  dustPurple: { kind: 'png', src: dustPurplePng, scale: 1.55, translateY: -8 },
  foundationPill: { kind: 'png', src: foundationPillPng, scale: 1 },
  herbBundle: { kind: 'png', src: herbBundlePng, scale: 1.25 },
  hourglassEmpty: { kind: 'png', src: hourglassEmptyPng, scale: 1.15 },
  hourglassProgress: { kind: 'png', src: hourglassProgressPng, scale: 1.15 },
  jadeSword: { kind: 'png', src: jadeSwordPng, scale: 1 },
  metalChunk: { kind: 'png', src: metalChunkPng, scale: 1.05 },
  placeholderRingLarge: { kind: 'png', src: placeholderRingLargePng, scale: 1 },
  placeholderRingSmall: { kind: 'png', src: placeholderRingSmallPng, scale: 1 },
  prayerBeads: { kind: 'png', src: prayerBeadsPng, scale: 1 },
  rustySword: { kind: 'png', src: rustySwordPng, scale: 1.1 },
  spiritGrass: { kind: 'png', src: spiritGrassPng, scale: 1 },
  taskComplete: { kind: 'png', src: taskCompletePng, scale: 1 },
  inkBolt: { kind: 'svg', Svg: InkBoltIcon, scale: 1 },
  inkBurst: { kind: 'svg', Svg: InkBurstIcon, scale: 1 },
  inkCheck: { kind: 'svg', Svg: InkCheckIcon, scale: 1 },
  inkChevronDown: { kind: 'svg', Svg: InkChevronDownIcon, scale: 1 },
  inkChevronUp: { kind: 'svg', Svg: InkChevronUpIcon, scale: 1 },
  inkHeart: { kind: 'svg', Svg: InkHeartIcon, scale: 1 },
  inkLock: { kind: 'svg', Svg: InkLockIcon, scale: 1 },
  inkRefresh: { kind: 'svg', Svg: InkRefreshIcon, scale: 1 },
  inkShield: { kind: 'svg', Svg: InkShieldIcon, scale: 1 },
  inkSparkles: { kind: 'svg', Svg: InkSparklesIcon, scale: 1 },
  inkSwirl: { kind: 'svg', Svg: InkSwirlIcon, scale: 1 },
  inkWarning: { kind: 'svg', Svg: InkWarningIcon, scale: 1 },
  inkWip: { kind: 'svg', Svg: InkWipIcon, scale: 1 },
  inkX: { kind: 'svg', Svg: InkXIcon, scale: 1 },
} satisfies Record<string, IconMeta>;

export type IconId = keyof typeof ICONS;

export const getIconMeta = (id: IconId) => ICONS[id];
