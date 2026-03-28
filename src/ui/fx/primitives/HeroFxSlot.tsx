import type { CSSProperties, ReactNode } from 'react';
import { ScreenFxStage } from '../ScreenFxStage.js';
import { useFxQuality } from '../pixi/hooks/useFxQuality.js';
import { PixiUiStage } from '../pixi/PixiUiStage.js';
import type { FxPortalTarget, FxQualityFloor, HeroSlotAlign, HeroSlotBleed } from '../types.js';
import './HeroFxSlot.scss';

export interface HeroFxSlotProps {
  screenKey: string;
  scene: ReactNode | null;
  qualityFloor?: FxQualityFloor;
  portalTarget?: FxPortalTarget;
  containToParent?: boolean;
  disableOnReducedMotion?: boolean;
  staticFallback?: ReactNode;
  align?: HeroSlotAlign;
  bleed?: HeroSlotBleed;
  className?: string;
  style?: CSSProperties;
}

export function HeroFxSlot({
  screenKey,
  scene,
  qualityFloor = 'medium',
  portalTarget = 'local',
  containToParent = false,
  disableOnReducedMotion = false,
  staticFallback,
  align = 'fill',
  bleed = 'none',
  className,
  style,
}: HeroFxSlotProps) {
  const quality = useFxQuality();

  if (quality.renderMode === 'off' || !quality.allowAnimatedHeroFx) {
    return <>{staticFallback ?? null}</>;
  }

  const wrapperClass = [
    'heroFxSlot',
    `heroFxSlot--align-${align}`,
    `heroFxSlot--bleed-${bleed}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ScreenFxStage
      scene={
        <div
          className={wrapperClass}
          style={style}
          data-hero-fx-slot="true"
          data-screen-key={screenKey}
          data-align={align}
          data-bleed={bleed}
        >
          <PixiUiStage renderMode={quality.renderMode} resolutionCap={quality.devicePixelRatioCap}>
            {scene}
          </PixiUiStage>
        </div>
      }
      role="hero"
      screenKey={screenKey}
      qualityFloor={qualityFloor}
      portalTarget={portalTarget}
      containToParent={containToParent}
      disableOnReducedMotion={disableOnReducedMotion}
    />
  );
}
