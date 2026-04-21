import React from 'react';
import type { OutskirtsEncounterIdentity, OutskirtsScenicStage as OutskirtsScenicStageModel } from '../types.js';
import { resolveOutskirtsScenicAsset } from '../resolveOutskirtsScenicAsset.js';

export interface OutskirtsScenicStageProps {
  scenic: OutskirtsScenicStageModel;
  identity: OutskirtsEncounterIdentity;
}

export function OutskirtsScenicStage({ scenic, identity }: OutskirtsScenicStageProps) {
  const bindings = resolveOutskirtsScenicAsset(scenic);
  const scenicStyle = bindings.scenicPlateSrc
    ? { backgroundImage: `url('${bindings.scenicPlateSrc}')`, backgroundPosition: bindings.scenicBackdropPosition }
    : undefined;

  return React.createElement(
    'section',
    {
      className: `outskirtsScenicStage outskirtsScenicStage--${bindings.usesApprovedReviewCrop ? 'review' : 'live'}`,
      'data-testid': 'outskirts-exact-scenic-stage',
      role: 'img',
      'aria-label': `${identity.displayName} scenic field`,
      'aria-description': scenic.environmentDescriptor,
    },
    React.createElement('div', { className: 'outskirtsScenicStage__plate', 'data-testid': 'outskirts-exact-scenic-image', style: scenicStyle, 'aria-hidden': 'true' }),
    bindings.wolfOverlaySrc
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement('img', { src: bindings.wolfOverlaySrc, alt: '', className: 'outskirtsScenicStage__wolf outskirtsScenicStage__wolf--lead', loading: 'eager', 'aria-hidden': 'true' }),
          React.createElement('img', { src: bindings.wolfOverlaySrc, alt: '', className: 'outskirtsScenicStage__wolf outskirtsScenicStage__wolf--pack', loading: 'eager', 'aria-hidden': 'true' }),
        )
      : null,
    React.createElement('span', { className: 'outskirtsScenicStage__mist outskirtsScenicStage__mist--rear', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'outskirtsScenicStage__mist outskirtsScenicStage__mist--front', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'outskirtsScenicStage__veil', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'outskirtsScenicStage__descriptor', 'data-testid': 'outskirts-exact-scenic-fallback', 'aria-hidden': 'true' }),
  );
}
