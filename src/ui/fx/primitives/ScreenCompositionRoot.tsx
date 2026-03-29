import type { CSSProperties, ReactNode } from 'react';
import type { ScreenCompositionArchetype } from '../types.js';

export interface ScreenCompositionRootProps {
  screenKey: string;
  archetype?: ScreenCompositionArchetype;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function ScreenCompositionRoot({
  screenKey,
  archetype = 'module',
  className,
  style,
  children,
}: ScreenCompositionRootProps) {
  const classNames = ['uiScreenCompositionRoot', 'uiScenicBaseHost', 'screenCompositionRoot', className].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={style}
      data-ui-layer-root="true"
      data-screen-key={screenKey}
      data-screen-archetype={archetype}
    >
      {children}
    </div>
  );
}
