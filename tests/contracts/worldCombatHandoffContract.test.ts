import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildWorldModuleCardSurface } from '../../src/systems/world/moduleCardRegistry.js';
import { buildWorldCombatHandoffSurface } from '../../src/systems/world/worldCombatHandoff.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function loadValidatedContent(): Promise<ValidatedContent> {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

void test('world-combat handoff adapter stays in parity with world module card copy for the combat trio', async () => {
  const content = await loadValidatedContent();
  const cityId = content.cities[0]?.id;
  assert.ok(cityId, 'expected at least one city in validated content');

  (['outskirts', 'ruins', 'gateTrial'] as const).forEach((moduleKey) => {
    const handoff = buildWorldCombatHandoffSurface({ content, cityId: cityId!, moduleKey });
    const card = buildWorldModuleCardSurface({ content, cityId: cityId!, moduleKey });

    assert.equal(handoff.moduleName, card.label, `${moduleKey} module label drifted`);
    assert.equal(handoff.roleTag, card.roleTag, `${moduleKey} role tag drifted`);
    assert.equal(handoff.bestUsedWhen, card.bestUsedWhen, `${moduleKey} best-used-when drifted`);
    assert.equal(handoff.openLabel, card.ctaLabel, `${moduleKey} CTA drifted`);
  });
});

void test('world-combat handoff adapter rejects deferred and unknown module targets', async () => {
  const content = await loadValidatedContent();
  const cityId = content.cities[0]?.id;
  assert.ok(cityId, 'expected at least one city in validated content');

  assert.throws(
    () => buildWorldCombatHandoffSurface({ content, cityId: cityId!, moduleKey: 'alchemy' as never }),
    /deferred module target/i,
  );
  assert.throws(
    () => buildWorldCombatHandoffSurface({ content, cityId: cityId!, moduleKey: 'fake_world_module' as never }),
    /unknown\/non-live module target/i,
  );
});
