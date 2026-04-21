import React from 'react';
import type { OutskirtsEncounterIdentity, OutskirtsScenicStage as OutskirtsScenicStageModel } from '../types.js';
import { resolveOutskirtsScenicAsset } from '../resolveOutskirtsScenicAsset.js';

export interface OutskirtsScenicStageProps {
  scenic: OutskirtsScenicStageModel;
  identity: OutskirtsEncounterIdentity;
}

export function OutskirtsScenicStage({ scenic, identity }: OutskirtsScenicStageProps) {
  const binding = resolveOutskirtsScenicAsset(scenic);
  return React.createElement(
    'section',
    { className: 'outskirtsScenicStage', 'data-testid': 'outskirts-exact-scenic-stage', 'aria-label': `${identity.displayName} scenic encounter field` },
    React.createElement('div', {
      className: `outskirtsScenicStage__plate ${binding.useApprovedMockupCrop ? 'outskirtsScenicStage__plate--reviewCrop' : 'outskirtsScenicStage__plate--live'}`,
      'data-testid': 'outskirts-exact-scenic-image',
      style: { backgroundImage: `url("${binding.baseImageSrc}")` },
    }),
    React.createElement('span', { className: 'outskirtsScenicStage__mist', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'outskirtsScenicStage__depth', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'outskirtsScenicStage__veil', 'aria-hidden': 'true' }),
  );
}
