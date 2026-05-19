import React from 'react';
import type { OutskirtsEncounterIdentity, OutskirtsScenicStage as OutskirtsScenicStageModel } from '../types.js';
import { resolveOutskirtsScenicAsset } from '../resolveOutskirtsScenicAsset.js';

export interface OutskirtsScenicStageProps {
  scenic: OutskirtsScenicStageModel;
  identity: OutskirtsEncounterIdentity;
}

export function OutskirtsScenicStage({ scenic, identity }: OutskirtsScenicStageProps) {
  const bindings = resolveOutskirtsScenicAsset({ scenic, selectedEncounterId: identity.selectedEncounterId });
  const baseStyle = bindings.sceneBaseSrc
    ? { backgroundImage: `url('${bindings.sceneBaseSrc}')`, backgroundPosition: bindings.sceneBasePosition }
    : undefined;
  const encounterStyle = bindings.encounterLayerSrc
    ? {
        backgroundImage: `url('${bindings.encounterLayerSrc}')`,
        backgroundPosition: bindings.encounterLayerPosition,
        transform: `translate(-50%, -50%) scale(${bindings.encounterLayerScale})`,
      }
    : undefined;

  return React.createElement(
    'section',
    {
      className: `outskirtsScenePlane outskirtsScenePlane--${bindings.maskVariant}`,
      'data-testid': 'outskirts-exact-scene-plane',
      'data-scene-variant': bindings.sceneVariantId,
      role: 'img',
      'aria-label': `${identity.displayName} scenic field`,
      'aria-description': scenic.environmentDescriptor,
    },
    React.createElement('div', { className: 'outskirtsScenePlane__base', 'data-testid': 'outskirts-exact-scene-layer-base', style: baseStyle, 'aria-hidden': 'true' }),
    bindings.encounterLayerSrc
      ? React.createElement('div', { className: 'outskirtsScenePlane__encounter', 'data-testid': 'outskirts-exact-scene-layer-encounter', style: encounterStyle, 'aria-hidden': 'true' })
      : null,
    bindings.showAtmosphere ? React.createElement('span', { className: 'outskirtsScenePlane__atmosphere', 'aria-hidden': 'true' }) : null,
    bindings.showForegroundMist ? React.createElement('span', { className: 'outskirtsScenePlane__mist', 'aria-hidden': 'true' }) : null,
    bindings.showEdgeFade ? React.createElement('span', { className: 'outskirtsScenePlane__edgeFade', 'aria-hidden': 'true' }) : null,
  );
}
