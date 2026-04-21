import React from 'react';
import type { OutskirtsEncounterIdentity, OutskirtsScenicStage as OutskirtsScenicStageModel } from '../types.js';

export interface OutskirtsScenicStageProps {
  scenic: OutskirtsScenicStageModel;
  identity: OutskirtsEncounterIdentity;
}

export function OutskirtsScenicStage({ scenic, identity }: OutskirtsScenicStageProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsScenicStage', 'data-testid': 'outskirts-exact-scenic-stage' },
    scenic.scenicImageSrc
      ? React.createElement('img', {
          className: 'outskirtsScenicStage__image',
          src: scenic.scenicImageSrc,
          alt: `${identity.displayName} scenic field`,
          loading: 'lazy',
        })
      : React.createElement('div', { className: 'outskirtsScenicStage__fallback', 'data-testid': 'outskirts-exact-scenic-fallback' }, scenic.environmentDescriptor),
    React.createElement('span', { className: 'outskirtsScenicStage__veil', 'aria-hidden': 'true' }),
  );
}
