import { getExpeditionsExactAssetSrc } from './expeditionsExactAssetRegistry.js';
import type { ExpeditionsExactAssetMap, ExpeditionsExactIconKey } from './expeditionsExactTypes.js';

const IMAGE_ICON_MAP: Partial<Record<ExpeditionsExactIconKey, Parameters<typeof getExpeditionsExactAssetSrc>[0]>> = {
  hourglass: 'hourglass',
  hourglassProgress: 'hourglassProgress',
  herb: 'herb',
  forage: 'herb',
  ore: 'ore',
  mine: 'ore',
  token: 'taskComplete',
};

export function ExpeditionsExactIcon({
  iconKey,
  assets,
  className,
}: {
  iconKey: ExpeditionsExactIconKey | string;
  assets?: ExpeditionsExactAssetMap;
  className?: string;
}) {
  const imageKey = IMAGE_ICON_MAP[iconKey as ExpeditionsExactIconKey];
  if (imageKey) {
    return <img className={className} src={getExpeditionsExactAssetSrc(imageKey, assets)} alt="" aria-hidden="true" />;
  }

  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false">
        {iconKey === 'lock' ? (
          <>
            <rect x="18" y="28" width="28" height="22" rx="3" />
            <path d="M23 28v-7a9 9 0 0 1 18 0v7" />
          </>
        ) : iconKey === 'scout' || iconKey === 'paper' ? (
          <>
            <path d="M18 12h25l5 8v32H18z" />
            <path d="M42 12v9h7M25 28h15M25 37h12" />
          </>
        ) : iconKey === 'pouch' ? (
          <>
            <path d="M22 24h20l5 24H17z" />
            <path d="M25 24c0-9 14-9 14 0M22 32h20" />
          </>
        ) : iconKey === 'elixir' ? (
          <>
            <path d="M27 10h10M30 10v15L20 48c-1 4 2 7 6 7h12c4 0 7-3 6-7L34 25V10" />
            <path d="M24 43h16" />
          </>
        ) : iconKey === 'coin' ? (
          <>
            <circle cx="32" cy="32" r="20" />
            <circle cx="32" cy="32" r="11" />
          </>
        ) : iconKey === 'ingot' ? (
          <>
            <path d="M16 42 24 24h16l8 18z" />
            <path d="M24 24l8 18 8-18" />
          </>
        ) : iconKey === 'fragment' ? (
          <>
            <path d="M34 8 50 30 34 56 18 34z" />
            <path d="M34 8v48M18 34l32-4" />
          </>
        ) : (
          <>
            <circle cx="32" cy="32" r="18" />
            <path d="M32 14v36M14 32h36" />
          </>
        )}
      </svg>
    </span>
  );
}
