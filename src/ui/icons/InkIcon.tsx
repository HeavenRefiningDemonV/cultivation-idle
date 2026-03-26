import type { CSSProperties } from 'react';
import { DEFAULT_GAME_ICON, GAME_ICON_REGISTRY, type GameIconKey } from './iconRegistry';

interface InkIconProps {
  icon: GameIconKey;
  className?: string;
  style?: CSSProperties;
}

export function InkIcon({ icon, className, style }: InkIconProps) {
  const resolved = GAME_ICON_REGISTRY[icon] ?? GAME_ICON_REGISTRY[DEFAULT_GAME_ICON];

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={resolved.path} />
    </svg>
  );
}
