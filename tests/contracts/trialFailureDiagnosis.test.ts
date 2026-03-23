import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDefaultSection4DiagnosisFixtures,
  diagnoseTrialFailure,
  isTrialFailureClose,
} from '../../src/systems/readiness/index.js';

test('packet 4.14 diagnosis fixtures resolve to their locked primary/secondary codes', () => {
  const fixtures = buildDefaultSection4DiagnosisFixtures();

  assert.equal(fixtures.length >= 6, true);

  fixtures.forEach((fixture) => {
    const result = diagnoseTrialFailure(fixture.input);
    assert.equal(result.primary, fixture.expectedPrimary, fixture.name);
    assert.equal(result.secondary, fixture.expectedSecondary ?? null, fixture.name);
    assert.equal(result.reasons.length > 0, true, `${fixture.name} reasons`);
    assert.equal(result.topFixes.length > 0, true, `${fixture.name} fixes`);
  });
});

test('packet 4.14 close remains impossible until all minimum floors are met', () => {
  const closeFixture = buildDefaultSection4DiagnosisFixtures().find(
    (fixture) => fixture.name === 'close',
  );
  assert.ok(closeFixture);

  assert.equal(isTrialFailureClose(closeFixture.input), true);

  const notClose = {
    ...closeFixture.input,
    readiness: {
      ...closeFixture.input.readiness,
      build: {
        ...closeFixture.input.readiness.build,
        band: 'below_minimum' as const,
        minimumMet: false,
        recommendedMet: false,
      },
      overallBand: 'below_minimum' as const,
      shortfalls: [
        {
          code: 'build_slots' as const,
          severity: 'high' as const,
          label: 'Build slots below gate floor',
          reason: 'The current build has not filled the gate-required technique slots yet.',
          currentValue: 0,
          minimumTarget: 1,
          recommendedTarget: 1,
        },
      ],
    },
  };

  assert.equal(isTrialFailureClose(notClose), false);
  assert.notEqual(diagnoseTrialFailure(notClose).primary, 'close');
});
