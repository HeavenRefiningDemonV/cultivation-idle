import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { getCityArrivalQuickOpenModules } from '../../src/systems/world/cityArrivalContract.js';
import { getLiveExpeditionRoutePurpose } from '../../src/systems/world/expeditionRouteContract.js';
import {
  findLegacySemesterCityNames,
  inspectHiddenWorldModuleSet,
  inspectWorldFacingModuleTarget,
  inspectWorldFacingText,
  isAllowedLiveWorldSurfaceModule,
} from '../../src/systems/world/liveWorldLeakAudit.js';
import { DEFERRED_WORLD_MODULES, LIVE_WORLD_MODULES } from '../../src/systems/world/liveWorldSchema.js';
import { resolveBountyDestination } from '../../src/utils/bountyRouting.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedContentPromise: Promise<ValidatedContent> | null = null;

const loadValidatedContent = async (): Promise<ValidatedContent> => {
  if (!validatedContentPromise) {
    validatedContentPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedContentPromise;
};

test('packet 2.8 audit helper catches legacy city-name leakage', () => {
  assert.deepEqual(findLegacySemesterCityNames('Embermist Craft Orders'), ['Embermist']);
  assert.deepEqual(findLegacySemesterCityNames('Silverkeep and Starsea routes'), ['Silverkeep', 'Starsea']);
  assert.deepEqual(findLegacySemesterCityNames('Spirit Cavern / Lotusford / Ironpeak'), []);

  const dirty = inspectWorldFacingText('Return to Embermist for supplies');
  assert.equal(dirty.ok, false);
  assert.deepEqual(dirty.legacyCityNames, ['Embermist']);
  assert.match(dirty.reasons.join(' | '), /legacy city name leaked/i);

  const clean = inspectWorldFacingText('Spirit Cavern supply loop');
  assert.equal(clean.ok, true);
  assert.deepEqual(clean.legacyCityNames, []);
  assert.deepEqual(clean.reasons, []);
});

test('packet 2.8 audit helper distinguishes safe live modules from deferred and unknown ones', () => {
  LIVE_WORLD_MODULES.forEach((moduleKey) => {
    assert.equal(isAllowedLiveWorldSurfaceModule(moduleKey), true, `${moduleKey} should be a safe live module`);
    assert.equal(inspectWorldFacingModuleTarget(moduleKey).ok, true, `${moduleKey} should inspect cleanly`);
  });

  assert.equal(isAllowedLiveWorldSurfaceModule('alchemy'), false);
  assert.equal(isAllowedLiveWorldSurfaceModule('talismanStudio'), false);
  assert.equal(isAllowedLiveWorldSurfaceModule('totally_fake_module'), false);
  assert.equal(isAllowedLiveWorldSurfaceModule(null), false);
  assert.equal(isAllowedLiveWorldSurfaceModule(undefined), false);

  assert.equal(inspectWorldFacingModuleTarget('alchemy').reason, 'deferred module target');
  assert.equal(inspectWorldFacingModuleTarget('talismanStudio').reason, 'deferred module target');
  assert.equal(inspectWorldFacingModuleTarget('totally_fake_module').reason, 'unknown/non-live module target');
  assert.equal(inspectWorldFacingModuleTarget(null).reason, 'missing module target');
  assert.equal(inspectWorldFacingModuleTarget(undefined).reason, 'missing module target');
});

test('hidden-module-set inspection enforces exact deferred-world alignment', () => {
  const canonical = inspectHiddenWorldModuleSet(['alchemy', 'talismanStudio']);
  assert.equal(canonical.isCanonical, true);
  assert.deepEqual(canonical.missing, []);
  assert.deepEqual(canonical.extra, []);

  const drifted = inspectHiddenWorldModuleSet(['alchemy', 'talismanStudio', 'ruins']);
  assert.equal(drifted.isCanonical, false);
  assert.deepEqual(drifted.missing, []);
  assert.deepEqual(drifted.extra, ['ruins']);
  assert.match(drifted.reasons.join(' | '), /ruins/i);

  assert.deepEqual(new Set(DEFERRED_WORLD_MODULES), new Set(['alchemy', 'talismanStudio']));
});

test('real validated live content is free of legacy city-name leakage and deferred expedition recommendations', async () => {
  const validated = await loadValidatedContent();

  validated.bounties.templates.forEach((template) => {
    assert.deepEqual(findLegacySemesterCityNames(template.name), [], `${template.id} name leaked a legacy semester city`);
    assert.deepEqual(findLegacySemesterCityNames(template.desc), [], `${template.id} desc leaked a legacy semester city`);
  });

  validated.expeditions.types.forEach((type) => {
    assert.notEqual(type.recommendedModuleKey, 'alchemy');
    assert.notEqual(type.recommendedModuleKey, 'talismanStudio');
  });
});

test('real live world-routing helpers only target safe live modules', async () => {
  const validated = await loadValidatedContent();
  const canonicalModules = [...LIVE_WORLD_MODULES];

  [
    'OUTSKIRTS_KILL',
    'OUTSKIRTS_BOSS_KILL',
    'RUINS_ROOM_CLEAR',
    'RUINS_RUN_CLEAR',
    'CRAFT_COMPLETE',
    'EXPEDITION_COMPLETE',
  ].forEach((bountyKind) => {
    const destination = resolveBountyDestination({
      cityId: 'city_pinewind_hamlet',
      bountyKind,
      cityModules: canonicalModules,
    });
    assert.equal(destination.kind, 'module', `${bountyKind} should resolve to a live module`);
    assert.equal(inspectWorldFacingModuleTarget(destination.moduleKey).ok, true);
    assert.notEqual(destination.moduleKey, 'alchemy');
    assert.notEqual(destination.moduleKey, 'talismanStudio');
  });

  ['forage', 'mine', 'scout'].forEach((typeId) => {
    const routePurpose = getLiveExpeditionRoutePurpose(typeId);
    assert.ok(routePurpose, `${typeId} should have a live route purpose`);
    assert.equal(inspectWorldFacingModuleTarget(routePurpose?.moduleKey).ok, true);
    assert.notEqual(routePurpose?.moduleKey, 'alchemy');
    assert.notEqual(routePurpose?.moduleKey, 'talismanStudio');

    const expeditionType = validated.expeditions.types.find((entry) => entry.id === typeId);
    assert.equal(inspectWorldFacingModuleTarget(expeditionType?.recommendedModuleKey).ok, true);
  });

  validated.cities.forEach((city) => {
    getCityArrivalQuickOpenModules(city.modules).forEach((moduleKey) => {
      assert.equal(inspectWorldFacingModuleTarget(moduleKey).ok, true, `${city.id} quick-open leaked ${moduleKey}`);
    });
  });
});
