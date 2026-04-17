import React from 'react';
import cityOutskirtsImage from '../../../assets/background/citystates/city_outskirts.png';
import wolfPupImage from '../../../assets/enemies/wolfpup.png';
import wildBoarImage from '../../../assets/enemies/widboar.png';
import type { OutskirtsMockupSurface } from './types.js';
import { OutskirtsTopTitle } from './components/OutskirtsTopTitle.js';
import { OutskirtsMacroProgressLine } from './components/OutskirtsMacroProgressLine.js';
import { OutskirtsTacticalStrip } from './components/OutskirtsTacticalStrip.js';
import { OutskirtsAreaPlaque } from './components/OutskirtsAreaPlaque.js';

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

function renderStatGrid(fields: Array<{ id: string; label: string; value: string }>) {
  return React.createElement(
    'ul',
    { className: 'outskirtsExactCard__stats' },
    ...fields.map((field) => React.createElement(
      'li',
      { key: field.id, className: 'outskirtsExactCard__stat' },
      React.createElement('span', { className: 'outskirtsExactCard__statLabel' }, field.label),
      React.createElement('span', { className: 'outskirtsExactCard__statValue' }, field.value),
    )),
  );
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
      { className: 'outskirtsExactLower', 'data-testid': 'outskirts-exact-lower-scaffold', 'aria-label': 'Outskirts planning surface lower regions' },
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
      React.createElement(
        'section',
        { className: 'outskirtsExactCards', 'data-testid': 'outskirts-cards-region' },
        React.createElement(
          'article',
          { className: 'outskirtsExactCard', 'data-testid': 'outskirts-setup-card', 'aria-label': 'Setup card' },
          React.createElement('h3', { className: 'outskirtsExactCard__title' }, 'Setup'),
          React.createElement(
            'div',
            { className: 'outskirtsExactCard__rows' },
            React.createElement('p', null, React.createElement('strong', null, 'Loadout: '), surface.setupCard.loadoutSet.text),
            React.createElement('p', null, React.createElement('strong', null, 'AI: '), surface.setupCard.aiProfile.text),
            React.createElement('p', null, React.createElement('strong', null, 'Focus: '), surface.setupCard.attackFocus.text),
            React.createElement('p', null, React.createElement('strong', null, 'Medicine: '), surface.setupCard.medicinePouch.text),
          ),
          React.createElement('h4', { className: 'outskirtsExactCard__sectionTitle' }, 'Offense'),
          renderStatGrid([
            { id: surface.setupCard.offense.atk.id, label: surface.setupCard.offense.atk.label, value: surface.setupCard.offense.atk.value.text },
            { id: surface.setupCard.offense.acc.id, label: surface.setupCard.offense.acc.label, value: surface.setupCard.offense.acc.value.text },
            { id: surface.setupCard.offense.crit.id, label: surface.setupCard.offense.crit.label, value: surface.setupCard.offense.crit.value.text },
          ]),
          React.createElement('h4', { className: 'outskirtsExactCard__sectionTitle' }, 'Defense'),
          renderStatGrid([
            { id: surface.setupCard.defense.hp.id, label: surface.setupCard.defense.hp.label, value: surface.setupCard.defense.hp.value.text },
            { id: surface.setupCard.defense.eva.id, label: surface.setupCard.defense.eva.label, value: surface.setupCard.defense.eva.value.text },
            { id: surface.setupCard.defense.res.id, label: surface.setupCard.defense.res.label, value: surface.setupCard.defense.res.value.text },
          ]),
        ),
        React.createElement(
          'article',
          { className: 'outskirtsExactCard', 'data-testid': 'outskirts-rewards-card', 'aria-label': 'Rewards card' },
          React.createElement('h3', { className: 'outskirtsExactCard__title' }, 'Rewards & Route'),
          React.createElement(
            'ul',
            { className: 'outskirtsExactCard__list' },
            React.createElement('li', null, React.createElement('strong', null, 'Gold: '), surface.rewardsCard.goldRange.text),
            React.createElement('li', null, React.createElement('strong', null, 'Common mats: '), surface.rewardsCard.commonMaterials.text),
            React.createElement('li', null, React.createElement('strong', null, 'Bounty: '), surface.rewardsCard.trackedBountyProgress.text),
            React.createElement('li', null, React.createElement('strong', null, 'Efficiency: '), surface.rewardsCard.estimatedEfficiency.text),
            React.createElement('li', null, React.createElement('strong', null, 'Auto-repeat: '), surface.rewardsCard.autoRepeatState.text),
          ),
        ),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactActionBar', 'data-testid': 'outskirts-action-bar', 'aria-label': 'Encounter strip and primary action' },
        React.createElement(
          'div',
          { className: 'outskirtsExactEncounterStrip', 'data-testid': 'outskirts-encounter-strip' },
          React.createElement('span', { className: 'outskirtsExactEncounterStrip__arrow', 'aria-hidden': 'true' }, surface.encounterStrip.arrows.canMoveLeft ? '←' : '·'),
          React.createElement(
            'ol',
            { className: 'outskirtsExactEncounterStrip__nodes' },
            ...surface.encounterStrip.nodes.map((node) => React.createElement(
              'li',
              {
                key: node.id,
                className: `outskirtsExactEncounterStrip__node outskirtsExactEncounterStrip__node--${node.state}`,
                'data-selected': node.id === surface.encounterStrip.selectedNodeId ? '1' : '0',
              },
              React.createElement('span', { className: 'outskirtsExactEncounterStrip__name' }, node.displayName),
              node.displayLevel ? React.createElement('span', { className: 'outskirtsExactEncounterStrip__level' }, node.displayLevel) : null,
            )),
          ),
          React.createElement('span', { className: 'outskirtsExactEncounterStrip__arrow', 'aria-hidden': 'true' }, surface.encounterStrip.arrows.canMoveRight ? '→' : '·'),
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'outskirtsExactPrimaryAction',
            'data-testid': 'outskirts-primary-action',
            disabled: !surface.primaryAction.enabled,
            title: surface.primaryAction.disabledReason ?? undefined,
          },
          surface.primaryAction.label,
        ),
        React.createElement(
          'aside',
          { className: 'outskirtsExactSummary', 'data-testid': 'outskirts-grind-summary', 'aria-label': 'Grind summary' },
          React.createElement('h3', { className: 'outskirtsExactSummary__title' }, surface.grindSummary.label),
          React.createElement(
            'ul',
            { className: 'outskirtsExactSummary__list' },
            React.createElement('li', null, React.createElement('strong', null, 'Runs: '), surface.grindSummary.runs.text),
            React.createElement('li', null, React.createElement('strong', null, 'Gold/hr: '), surface.grindSummary.goldPerHour.text),
            React.createElement('li', null, React.createElement('strong', null, 'Main drop: '), surface.grindSummary.mainDrop.text),
            React.createElement('li', null, React.createElement('strong', null, 'Area filter: '), surface.grindSummary.areaFilter.text),
          ),
        ),
      ),
    ),
  );
}
