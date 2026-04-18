import React from 'react';
import cityOutskirtsImage from '../../../assets/background/citystates/city_outskirts.png';
import wolfPupImage from '../../../assets/enemies/wolfpup.png';
import wildBoarImage from '../../../assets/enemies/widboar.png';
import type { OutskirtsMockupSurface } from './types.js';
import { OutskirtsTopTitle } from './components/OutskirtsTopTitle.js';
import { OutskirtsMacroProgressLine } from './components/OutskirtsMacroProgressLine.js';
import { OutskirtsTacticalStrip } from './components/OutskirtsTacticalStrip.js';
import { OutskirtsAreaPlaque } from './components/OutskirtsAreaPlaque.js';
import { OutskirtsSetupCard } from './components/OutskirtsSetupCard.js';
import { OutskirtsExpectedRewardsCard } from './components/OutskirtsExpectedRewardsCard.js';

export interface OutskirtsExactMockupScreenProps {
  surface: OutskirtsMockupSurface;
}

const SCENIC_ASSET_BY_KEY: Record<string, string> = {
  'outskirts/pinewind/scenic-plate': cityOutskirtsImage,
};

const ENCOUNTER_ASSET_BY_KEY: Record<string, string> = {
  'enemy/boar-field-scout': wildBoarImage,
  'enemy/rockjaw-boar': wildBoarImage,
  'enemy/snarling-wolf': wolfPupImage,
  'enemy/venomcoil': wolfPupImage,
  'enemy/shade-stalker': wolfPupImage,
  'enemy/mire-serpent': wolfPupImage,
};

function resolveScenicPlate(assetKey: string): string {
  return SCENIC_ASSET_BY_KEY[assetKey] ?? cityOutskirtsImage;
}

function resolveEncounterAsset(assetKey: string): string {
  return ENCOUNTER_ASSET_BY_KEY[assetKey] ?? wolfPupImage;
}

export function OutskirtsExactMockupScreen({ surface }: OutskirtsExactMockupScreenProps) {
  const scenicPlate = resolveScenicPlate(surface.scenicField.scenicPlateAssetKey);
  const encounterAsset = resolveEncounterAsset(surface.scenicField.encounterAssetKey);

  return React.createElement(
    'article',
    { className: 'outskirtsExactScreen', 'data-testid': 'outskirts-exact-screen' },
    React.createElement(
      'section',
      { className: 'outskirtsExactTop', 'data-testid': 'outskirts-exact-top-region' },
      React.createElement(OutskirtsTopTitle, { title: surface.page.title }),
      React.createElement(OutskirtsMacroProgressLine, { track: surface.macroTrack }),
      React.createElement(OutskirtsTacticalStrip, { strip: surface.tacticalStrip }),
      React.createElement(OutskirtsAreaPlaque, { plaque: surface.selectorPlaque }),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsExactBody', 'data-testid': 'outskirts-exact-lower-scaffold', 'aria-label': 'Outskirts planning surface lower regions' },
      React.createElement(OutskirtsSetupCard, { card: surface.setupCard }),
      React.createElement(
        'section',
        { className: 'outskirtsExactField', 'data-testid': 'outskirts-scenic-field', 'aria-label': 'Scenic encounter field' },
        React.createElement('img', {
          className: 'outskirtsExactField__plate',
          src: scenicPlate,
          alt: `${surface.selectorPlaque.selectorLabel} scenic plate`,
          loading: 'lazy',
        }),
        React.createElement(
          'div',
          { className: 'outskirtsExactField__overlay' },
          React.createElement('img', {
            className: 'outskirtsExactField__enemy outskirtsExactField__enemy--primary',
            src: encounterAsset,
            alt: surface.encounterIdentity.displayName,
            loading: 'lazy',
          }),
          React.createElement('img', {
            className: 'outskirtsExactField__enemy outskirtsExactField__enemy--support',
            src: wolfPupImage,
            alt: '',
            'aria-hidden': 'true',
            loading: 'lazy',
          }),
        ),
        React.createElement(
          'aside',
          { className: 'outskirtsExactField__identity', 'data-testid': 'outskirts-encounter-identity' },
          React.createElement('p', { className: 'outskirtsExactField__zone' }, surface.selectorPlaque.zoneLabel),
          React.createElement('h2', { className: 'outskirtsExactField__name' }, `${surface.encounterIdentity.displayName} ${surface.encounterIdentity.displayLevel}`),
          React.createElement(
            'span',
            {
              className: `outskirtsExactField__chip outskirtsExactField__chip--${surface.encounterIdentity.chipSeverity}`,
            },
            surface.encounterIdentity.chipLabel,
          ),
        ),
      ),
      React.createElement(OutskirtsExpectedRewardsCard, { card: surface.expectedRewardsCard }),
    ),
  );
}
