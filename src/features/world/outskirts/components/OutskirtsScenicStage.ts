import React from 'react';
import type { OutskirtsMockupEncounterHero } from '../types.js';

export interface OutskirtsScenicStageProps {
  encounter: OutskirtsMockupEncounterHero;
}

export function OutskirtsScenicStage({ encounter }: OutskirtsScenicStageProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsScenicStage', 'data-testid': 'outskirts-exact-scenic-stage' },
    encounter.scenicImageSrc
      ? React.createElement('img', {
          className: 'outskirtsScenicStage__image',
          src: encounter.scenicImageSrc,
          alt: `${encounter.encounterDisplayName} scenic field`,
          loading: 'lazy',
        })
      : React.createElement('div', { className: 'outskirtsScenicStage__fallback', 'data-testid': 'outskirts-exact-scenic-fallback' }, encounter.descriptor),
    React.createElement('span', { className: 'outskirtsScenicStage__veil', 'aria-hidden': 'true' }),
  );
}
