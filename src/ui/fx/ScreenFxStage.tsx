import type { CSSProperties, ReactNode } from 'react';
import { FxStagePortal } from './FxStagePortal.js';
import type { FxLayerTier } from './fxLayerContract.js';
import { useFxQuality } from './pixi/hooks/useFxQuality.js';
import type { FxPortalTarget, FxQualityFloor, ScreenFxRole } from './types.js';
import './ScreenFxStage.scss';

export interface ScreenFxStageProps {
  scene: ReactNode | null;
  role?: ScreenFxRole;
  qualityFloor?: FxQualityFloor;
  disableOnReducedMotion?: boolean;
  className?: string;
  style?: CSSProperties;
  screenKey?: string;
  portalTarget?: FxPortalTarget;
  containToParent?: boolean;
  diagnosticsMountKind?: 'ambient-underlay' | 'hero-slot';
  diagnosticsMountMode?: 'animated' | 'static' | 'off';
  /** @deprecated A.2 alias. Prefer role. */
  layer?: FxLayerTier;
}

const ROLE_CLASS_NAMES: Record<ScreenFxRole, string> = {
  underlay: 'screenFxStage--underlay',
  hero: 'screenFxStage--hero',
  overlay: 'screenFxStage--overlay',
};

const LEGACY_LAYER_TO_ROLE: Record<FxLayerTier, ScreenFxRole> = {
  backdrop: 'underlay',
  ambient: 'underlay',
  heroUnderlay: 'hero',
  heroOverlay: 'overlay',
};

const ROLE_TO_PORTAL_LAYER: Record<ScreenFxRole, FxLayerTier> = {
  underlay: 'ambient',
  hero: 'heroUnderlay',
  overlay: 'heroOverlay',
};

function passesQualityFloor(
  resolvedQuality: 'off' | 'low' | 'medium' | 'high',
  qualityFloor: FxQualityFloor,
): boolean {
  if (resolvedQuality === 'off') return false;

  if (qualityFloor === 'high') {
    return resolvedQuality === 'high';
  }

  if (qualityFloor === 'medium') {
    return resolvedQuality === 'high' || resolvedQuality === 'medium';
  }

  return resolvedQuality === 'high' || resolvedQuality === 'medium' || resolvedQuality === 'low';
}

export function ScreenFxStage({
  scene,
  role,
  qualityFloor = 'low',
  disableOnReducedMotion = false,
  className,
  style,
  screenKey = 'unknown-screen',
  portalTarget = 'local',
  containToParent = true,
  diagnosticsMountKind,
  diagnosticsMountMode,
  layer,
}: ScreenFxStageProps) {
  const quality = useFxQuality();

  if (!scene) {
    return null;
  }

  if (quality.renderMode === 'off') {
    return null;
  }

  if (!passesQualityFloor(quality.resolvedQuality, qualityFloor)) {
    return null;
  }

  if (disableOnReducedMotion && quality.reducedMotion) {
    return null;
  }

  const resolvedRole = role ?? (layer ? LEGACY_LAYER_TO_ROLE[layer] : 'underlay');

  const classNames = [
    'screenFxStage',
    ROLE_CLASS_NAMES[resolvedRole],
    containToParent ? 'screenFxStage--contained' : 'screenFxStage--uncontained',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <div
      aria-hidden="true"
      className={classNames}
      data-fx-screen-key={screenKey}
      data-fx-role={resolvedRole}
      data-fx-portal-target={portalTarget}
      data-fx-stage-kind={portalTarget === 'global' ? 'global' : 'local'}
      data-fx-mount-kind={diagnosticsMountKind}
      data-fx-mount-mode={diagnosticsMountMode}
      data-fx-quality-floor={qualityFloor}
      style={style}
    >
      {scene}
    </div>
  );

  if (portalTarget === 'global') {
    return (
      <FxStagePortal screenKey={screenKey} layer={ROLE_TO_PORTAL_LAYER[resolvedRole]} className="screenFxStagePortalBridge">
        {content}
      </FxStagePortal>
    );
  }

  return content;
}
