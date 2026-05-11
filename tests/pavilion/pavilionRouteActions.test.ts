import assert from 'node:assert/strict';
import test from 'node:test';

import {
  executePavilionRouteAction,
  resolvePavilionRouteButton,
} from '../../src/features/pavilion/pavilionRouteActions.js';

test('route actions navigate or return disabled reasons without crashing', () => {
  const calls: string[] = [];
  const deps = {
    currentCityId: 'city_pinewind_hamlet',
    cityModules: ['gateTrial', 'apothecary', 'forge', 'manualPavilion'],
    setActiveTab: (tab: string) => calls.push(`tab:${tab}`),
    openWorldBuildingModal: (args: { cityId: string; buildingKey: string }) => calls.push(`module:${args.cityId}:${args.buildingKey}`),
    focusSearch: () => calls.push('focus:search'),
    selectEntry: (entryId: string) => calls.push(`entry:${entryId}`),
  };

  executePavilionRouteAction(resolvePavilionRouteButton('Route to Cultivation', deps), deps);
  executePavilionRouteAction(resolvePavilionRouteButton('Route to World', deps), deps);
  executePavilionRouteAction(resolvePavilionRouteButton('Route to Gate Trial', deps), deps);
  executePavilionRouteAction(resolvePavilionRouteButton('Route to Apothecary', deps), deps);
  executePavilionRouteAction(resolvePavilionRouteButton('Route to Forge', deps), deps);
  executePavilionRouteAction(resolvePavilionRouteButton('Route to Techniques', deps), deps);
  executePavilionRouteAction(resolvePavilionRouteButton('Route to Prestige', deps), deps);
  executePavilionRouteAction(resolvePavilionRouteButton('Search the Records', deps), deps);

  assert.deepEqual(calls, [
    'tab:cultivation',
    'tab:adventure',
    'tab:adventure',
    'module:city_pinewind_hamlet:gateTrial',
    'tab:adventure',
    'module:city_pinewind_hamlet:apothecary',
    'tab:adventure',
    'module:city_pinewind_hamlet:forge',
    'tab:techniques',
    'tab:prestige',
    'focus:search',
  ]);

  const unavailable = resolvePavilionRouteButton('Route to Ruins', {
    ...deps,
    cityModules: ['gateTrial'],
  });
  assert.equal(unavailable.enabled, false);
  assert.match(unavailable.disabledReason ?? '', /unavailable/i);
  assert.doesNotThrow(() => executePavilionRouteAction(unavailable, deps));
});
