import type { OutskirtsCityMockupPresentation } from './types.js';

/**
 * UI-only manifest for exact-mockup sequencing and labels.
 * This file does not define combat, loot, or authored gameplay rules.
 */
export const OUTSKIRTS_MOCKUP_PRESENTATION_BY_CITY: Readonly<Record<string, OutskirtsCityMockupPresentation>> = {
  city_pinewind_hamlet: {
    cityId: 'city_pinewind_hamlet',
    screenTitle: 'Outskirts Hunt Plan',
    selectorLabel: 'Pinewind Outskirts',
    subtitle: 'Plan your next low-risk field cycle before committing.',
    selectedEncounterId: 'quiet-glade',
    scenicPlateAsset: 'outskirts/pinewind/scenic-plate',
    grindSummaryLabel: 'Grind Summary',
    defaultRoleLine: 'Gold & Common Mats',
    zoneLabel: 'Field Band — Pinewind Perimeter',
    encounterNodes: [
      {
        id: 'quiet-glade',
        displayName: 'Quiet Glade',
        displayLevel: 'Lv. 8',
        defaultState: 'current',
        thumbnailAssetKey: 'outskirts/pinewind/quiet-glade/thumb',
        scenicBindingKey: 'outskirts/pinewind/quiet-glade/scenic',
        encounterAssetKey: 'enemy/boar-field-scout',
      },
      {
        id: 'rockjaw-boar',
        displayName: 'Rockjaw Boar',
        displayLevel: 'Lv. 9',
        defaultState: 'future',
        thumbnailAssetKey: 'outskirts/pinewind/rockjaw-boar/thumb',
        scenicBindingKey: 'outskirts/pinewind/rockjaw-boar/scenic',
        encounterAssetKey: 'enemy/rockjaw-boar',
      },
      {
        id: 'snarling-wolf',
        displayName: 'Snarling Wolf',
        displayLevel: 'Lv. 10',
        defaultState: 'future',
        thumbnailAssetKey: 'outskirts/pinewind/snarling-wolf/thumb',
        scenicBindingKey: 'outskirts/pinewind/snarling-wolf/scenic',
        encounterAssetKey: 'enemy/snarling-wolf',
      },
      {
        id: 'venomcoil',
        displayName: 'Venomcoil',
        displayLevel: 'Lv. 11',
        defaultState: 'future',
        thumbnailAssetKey: 'outskirts/pinewind/venomcoil/thumb',
        scenicBindingKey: 'outskirts/pinewind/venomcoil/scenic',
        encounterAssetKey: 'enemy/venomcoil',
      },
      {
        id: 'shade-stalker',
        displayName: 'Shade Stalker',
        displayLevel: 'Lv. 12',
        defaultState: 'future',
        thumbnailAssetKey: 'outskirts/pinewind/shade-stalker/thumb',
        scenicBindingKey: 'outskirts/pinewind/shade-stalker/scenic',
        encounterAssetKey: 'enemy/shade-stalker',
      },
      {
        id: 'mire-serpent',
        displayName: 'Mire Serpent',
        displayLevel: 'Lv. 13',
        defaultState: 'future',
        thumbnailAssetKey: 'outskirts/pinewind/mire-serpent/thumb',
        scenicBindingKey: 'outskirts/pinewind/mire-serpent/scenic',
        encounterAssetKey: 'enemy/mire-serpent',
      },
    ],
  },
};

export const FALLBACK_OUTSKIRTS_MOCKUP_CITY_ID = 'city_pinewind_hamlet';

export function getOutskirtsMockupPresentation(cityId: string): OutskirtsCityMockupPresentation {
  return OUTSKIRTS_MOCKUP_PRESENTATION_BY_CITY[cityId]
    ?? OUTSKIRTS_MOCKUP_PRESENTATION_BY_CITY[FALLBACK_OUTSKIRTS_MOCKUP_CITY_ID];
}
