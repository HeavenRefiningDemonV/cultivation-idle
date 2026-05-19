import type {
  ExpeditionsExactAssetDescriptor,
  ExpeditionsExactAssetKey,
  ExpeditionsExactAssetMap,
} from './expeditionsExactTypes.js';

const paperUnderlaySrc = new URL(
  '../../../assets/background/citystates/city_bounties_expeditions.png',
  import.meta.url,
).href;
const hourglassSrc = new URL('../../../assets/icons/hourglass_empty.png', import.meta.url).href;
const hourglassProgressSrc = new URL('../../../assets/icons/hourglass_progress.png', import.meta.url).href;
const herbSrc = new URL('../../../assets/icons/herbbundle.png', import.meta.url).href;
const oreSrc = new URL('../../../assets/icons/metalchunk.png', import.meta.url).href;
const taskCompleteSrc = new URL('../../../assets/icons/task_complete.png', import.meta.url).href;
const sourceExpeditionSrc = new URL(
  '../../../assets/apothecaryExact/sources/source_expedition.png',
  import.meta.url,
).href;

function asset(
  key: ExpeditionsExactAssetKey,
  src: string,
  sourcePath: string,
  role: string,
): ExpeditionsExactAssetDescriptor {
  return {
    key,
    src,
    role,
    sourcePath,
    status: 'ready',
  };
}

export const EXPEDITIONS_EXACT_ASSETS: ExpeditionsExactAssetMap = {
  paperUnderlay: asset(
    'paperUnderlay',
    paperUnderlaySrc,
    'src/assets/background/citystates/city_bounties_expeditions.png',
    'faint route-desk city ink wash',
  ),
  hourglass: asset('hourglass', hourglassSrc, 'src/assets/icons/hourglass_empty.png', 'idle expedition hourglass'),
  hourglassProgress: asset(
    'hourglassProgress',
    hourglassProgressSrc,
    'src/assets/icons/hourglass_progress.png',
    'active expedition hourglass',
  ),
  herb: asset('herb', herbSrc, 'src/assets/icons/herbbundle.png', 'forage herb icon'),
  ore: asset('ore', oreSrc, 'src/assets/icons/metalchunk.png', 'mine ore icon'),
  taskComplete: asset('taskComplete', taskCompleteSrc, 'src/assets/icons/task_complete.png', 'claim-ready seal icon'),
  sourceExpedition: asset(
    'sourceExpedition',
    sourceExpeditionSrc,
    'src/assets/apothecaryExact/sources/source_expedition.png',
    'expedition ledger source art',
  ),
};

export function getExpeditionsExactAssetSrc(
  key: ExpeditionsExactAssetKey,
  assets: ExpeditionsExactAssetMap = EXPEDITIONS_EXACT_ASSETS,
): string {
  return assets[key]?.src ?? '';
}
