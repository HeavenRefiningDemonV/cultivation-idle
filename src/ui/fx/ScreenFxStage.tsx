import type { CSSProperties, ReactNode } from 'react';
import { getFxLayerOrder, type FxLayerTier } from './fxLayerContract.js';
import './ScreenFxStage.scss';

export interface ScreenFxStageProps {
  screenKey: string;
  layer?: FxLayerTier;
  active?: boolean;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export function ScreenFxStage({
  screenKey,
  layer = 'ambient',
  active = true,
  className,
  children,
  style,
}: ScreenFxStageProps) {
  if (!active) {
    return null;
  }

  const classNames = ['screenFxStage', `screenFxStage--${layer}`, className].filter(Boolean).join(' ');

  return (
    <div
      aria-hidden="true"
      className={classNames}
      data-fx-screen-key={screenKey}
      data-fx-layer={layer}
      style={{ zIndex: getFxLayerOrder(layer), ...style }}
    >
      {children}
    </div>
  );
}
