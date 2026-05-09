import type {
  BountiesExactAssetDescriptor,
  BountiesExactAssetKey,
  BountiesExactAssetMap,
} from './bountiesExactTypes.js';

const paperUnderlaySrc = new URL(
  '../../../assets/background/citystates/city_bounties_expeditions.png',
  import.meta.url,
).href;
const boardTextureSrc = new URL('../../../assets/background/bountyboard.png', import.meta.url).href;
const herbSrc = new URL('../../../assets/icons/herbbundle.png', import.meta.url).href;
const oreSrc = new URL('../../../assets/icons/metalchunk.png', import.meta.url).href;
const foundationGateSrc = new URL('../../../assets/icons/foundationpill.png', import.meta.url).href;
const challengeSwordSrc = new URL('../../../assets/icons/jadesword.png', import.meta.url).href;
const taskCompleteSrc = new URL('../../../assets/icons/task_complete.png', import.meta.url).href;

function asset(
  key: BountiesExactAssetKey,
  src: string,
  sourcePath: string,
  role: string,
): BountiesExactAssetDescriptor {
  return {
    key,
    src,
    role,
    sourcePath,
    status: 'ready',
  };
}

export const BOUNTIES_EXACT_ASSETS: BountiesExactAssetMap = {
  paperUnderlay: asset(
    'paperUnderlay',
    paperUnderlaySrc,
    'src/assets/background/citystates/city_bounties_expeditions.png',
    'faint city ink-wash underlay',
  ),
  boardTexture: asset(
    'boardTexture',
    boardTextureSrc,
    'src/assets/background/bountyboard.png',
    'subtle mounted board texture',
  ),
  herb: asset('herb', herbSrc, 'src/assets/icons/herbbundle.png', 'herb reward medallion'),
  ore: asset('ore', oreSrc, 'src/assets/icons/metalchunk.png', 'ore reward medallion'),
  foundationGate: asset(
    'foundationGate',
    foundationGateSrc,
    'src/assets/icons/foundationpill.png',
    'foundation gate support icon',
  ),
  challengeSword: asset(
    'challengeSword',
    challengeSwordSrc,
    'src/assets/icons/jadesword.png',
    'challenge bounty sword icon',
  ),
  taskComplete: asset('taskComplete', taskCompleteSrc, 'src/assets/icons/task_complete.png', 'claimable task icon'),
};

export function getBountiesExactAssetSrc(
  key: BountiesExactAssetKey,
  assets: BountiesExactAssetMap = BOUNTIES_EXACT_ASSETS,
): string {
  return assets[key]?.src ?? '';
}
