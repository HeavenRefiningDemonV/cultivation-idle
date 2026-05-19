import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDefaultSection4DiagnosisFixtures,
  validateSection4Semantics,
} from '../../src/systems/readiness/index.js';
import { buildTechniqueTaxonomyFromDefinitions } from '../../src/systems/builds/index.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('packet 4.14 live Section 4 semantic validator passes on current authored content', async () => {
  const content = await getValidatedEconomicContent();

  const issues = validateSection4Semantics({
    content: { techniques: content.techniques },
  });

  assert.deepEqual(issues, []);
});

test('packet 4.14 validator reports the locked issue categories for broken inputs', async () => {
  const content = await getValidatedEconomicContent();
  const fixtures = buildDefaultSection4DiagnosisFixtures();
  const taxonomyByTechniqueId: Record<string, ReturnType<typeof buildTechniqueTaxonomyFromDefinitions>[string] | null> =
    { ...buildTechniqueTaxonomyFromDefinitions(content.techniques) };
  const firstTechniqueId = content.techniques[0]?.id ?? 'missing';
  taxonomyByTechniqueId[firstTechniqueId] = null;

  const issues = validateSection4Semantics({
    content: { techniques: content.techniques },
    taxonomyByTechniqueId,
    gateFloors: [],
    diagnosisFixtures: fixtures.map((fixture, index) =>
      index === 0
        ? {
            ...fixture,
            expectedPrimary: fixture.expectedPrimary === 'underbuilt' ? 'close' : 'underbuilt',
          }
        : fixture,
    ),
    archetypes: [
      {
        id: 'broken_arch',
        path: 'heaven',
        label: 'Broken',
        summary: 'Broken',
        primaryFamilies: ['heal'],
        secondaryFamilies: [],
        preferredSupportFlags: ['boss'],
      },
    ],
  });

  assert.deepEqual(
    issues.map((issue) => issue.category),
    [
      'MISSING_TECHNIQUE_TAXONOMY',
      'MISSING_GATE_BUILD_FLOOR',
      'MISSING_GATE_BUILD_FLOOR',
      'MISSING_GATE_BUILD_FLOOR',
      'MISSING_GATE_BUILD_FLOOR',
      'MISSING_GATE_BUILD_FLOOR',
      'UNREACHABLE_FAILURE_DIAGNOSIS',
      'UNBUILDABLE_ARCHETYPE',
    ],
  );
});
