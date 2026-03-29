import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  FX_PORTAL_ROOT_ID,
  getFxLayerOrder,
  type FxLayerTier,
} from './fxLayerContract.js';
import './FxStagePortal.scss';

export interface FxStagePortalProps {
  screenKey: string;
  layer?: FxLayerTier;
  active?: boolean;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

interface PortalTargetState {
  element: HTMLElement;
  createdByComponent: boolean;
}

const resolvePortalTarget = (): PortalTargetState | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const existing = document.getElementById(FX_PORTAL_ROOT_ID);
  if (existing) {
    return {
      element: existing,
      createdByComponent: false,
    };
  }

  const created = document.createElement('div');
  created.id = FX_PORTAL_ROOT_ID;
  created.className = 'fxStagePortalRoot';
  document.body.appendChild(created);

  return {
    element: created,
    createdByComponent: true,
  };
};

export function FxStagePortal({
  screenKey,
  layer = 'ambient',
  active = true,
  className,
  children,
  style,
}: FxStagePortalProps) {
  const [target, setTarget] = useState<PortalTargetState | null>(null);

  useEffect(() => {
    if (!active) {
      setTarget(null);
      return;
    }

    const portalTarget = resolvePortalTarget();
    setTarget(portalTarget);

    return () => {
      if (!portalTarget?.createdByComponent) {
        return;
      }

      const element = portalTarget.element;
      if (element.childElementCount === 0) {
        element.remove();
      }
    };
  }, [active]);

  if (!active) {
    return null;
  }

  const classNames = ['fxStagePortal', `fxStagePortal--${layer}`, className].filter(Boolean).join(' ');

  const portalContent = (
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

  if (!target?.element) {
    if (typeof document === 'undefined') {
      return portalContent;
    }

    return null;
  }

  return createPortal(portalContent, target.element);
}
