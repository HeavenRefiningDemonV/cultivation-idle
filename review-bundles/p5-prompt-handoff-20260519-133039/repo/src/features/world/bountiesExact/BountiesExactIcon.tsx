import { getBountiesExactAssetSrc } from './bountiesExactAssetRegistry.js';
import type { BountiesExactAssetMap, BountiesExactIconKey } from './bountiesExactTypes.js';

const IMAGE_ICON_MAP: Partial<Record<BountiesExactIconKey, Parameters<typeof getBountiesExactAssetSrc>[0]>> = {
  foundationGate: 'foundationGate',
  herb: 'herb',
  ore: 'ore',
  challengeSword: 'challengeSword',
  claimable: 'taskComplete',
};

export function BountiesExactIcon({
  iconKey,
  assets,
  className,
}: {
  iconKey: BountiesExactIconKey | string;
  assets?: BountiesExactAssetMap;
  className?: string;
}) {
  const imageKey = IMAGE_ICON_MAP[iconKey as BountiesExactIconKey];
  if (imageKey) {
    return <img className={className} src={getBountiesExactAssetSrc(imageKey, assets)} alt="" aria-hidden="true" />;
  }

  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false">
        {iconKey === 'merit' ? (
          <>
            <circle cx="32" cy="32" r="22" />
            <path d="M32 14v36M16 32h32M21 21l22 22M43 21 21 43" />
          </>
        ) : iconKey === 'trackedNotice' ? (
          <>
            <path d="M18 12h28l-4 40H22z" />
            <path d="M25 22h14M24 31h16M26 40h12" />
          </>
        ) : iconKey === 'bestRouteRuins' ? (
          <>
            <path d="M12 50 27 18l9 18 8-11 8 25z" />
            <path d="M20 50h32" />
          </>
        ) : iconKey === 'refresh' ? (
          <>
            <path d="M45 23a16 16 0 0 0-27-5l-5 5" />
            <path d="M13 13v10h10" />
            <path d="M19 41a16 16 0 0 0 27 5l5-5" />
            <path d="M51 51V41H41" />
          </>
        ) : iconKey === 'city' ? (
          <>
            <path d="M14 49h36M18 49V25l14-10 14 10v24" />
            <path d="M24 49V34h16v15M23 27h18" />
          </>
        ) : iconKey === 'spiritStone' ? (
          <>
            <path d="M32 8 48 28 38 56H26L16 28z" />
            <path d="M32 8v48M16 28h32" />
          </>
        ) : iconKey === 'boardTruth' ? (
          <>
            <path d="M18 14h28v36H18z" />
            <path d="M24 24h16M24 32h16M24 40h10" />
          </>
        ) : (
          <>
            <rect x="18" y="18" width="28" height="28" />
            <path d="M24 32h16M32 24v16" />
          </>
        )}
      </svg>
    </span>
  );
}
