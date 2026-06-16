import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStatusObservatoryFixtureSurface } from '../../src/systems/ui/status/statusObservatoryFixtures.js';
import { resolveObservatoryPresentation } from '../../src/systems/ui/status/statusObservatoryPresentation.js';
import type { StatusObservatorySurfaceV1 } from '../../src/systems/ui/status/statusObservatoryTypes.js';

interface ExpectedRow {
  tone: string;
  dominantRegion: string;
  canopyMode: string;
  decreeStamp: string | null;
  scorchOverlay: boolean;
  ritualGold: boolean;
}

const EXPECTED: Record<string, ExpectedRow> = {
  blocked: { tone: 'inkJade', dominantRegion: 'canopy', canopyMode: 'bottleneck', decreeStamp: null, scorchOverlay: false, ritualGold: false },
  healthy: { tone: 'jadeCalm', dominantRegion: 'vessel', canopyMode: 'maintenance', decreeStamp: null, scorchOverlay: false, ritualGold: false },
  postFailure: { tone: 'cinnabarHeavy', dominantRegion: 'canopy', canopyMode: 'failureDiagnosis', decreeStamp: 'gateTrialFailed', scorchOverlay: true, ritualGold: false },
  prestigePressure: { tone: 'goldRitual', dominantRegion: 'canopy', canopyMode: 'reincarnationEdict', decreeStamp: 'turningOfLife', scorchOverlay: false, ritualGold: true },
  contentCap: { tone: 'mutedCap', dominantRegion: 'vessel', canopyMode: 'capNotice', decreeStamp: null, scorchOverlay: false, ritualGold: false },
};

function buildOrThrow(stateId: string): StatusObservatorySurfaceV1 {
  const surface = buildStatusObservatoryFixtureSurface(stateId);
  assert.ok(surface, `fixture surface for ${stateId} should build`);
  return surface;
}

for (const [stateId, expected] of Object.entries(EXPECTED)) {
  test(`resolveObservatoryPresentation matches the decision table for ${stateId}`, () => {
    const surface = buildOrThrow(stateId);
    // The fixture pipeline must classify to its declared visual state.
    assert.equal(surface.meta.visualState, stateId, `${stateId} fixture should classify to its declared visual state`);
    assert.equal(surface.meta.mode, 'fixture');

    const presentation = resolveObservatoryPresentation(surface);
    assert.equal(presentation.visualState, stateId);
    assert.equal(presentation.tone, expected.tone, `${stateId} tone`);
    assert.equal(presentation.dominantRegion, expected.dominantRegion, `${stateId} dominantRegion`);
    assert.equal(presentation.canopyMode, expected.canopyMode, `${stateId} canopyMode`);
    assert.equal(presentation.decreeStamp, expected.decreeStamp, `${stateId} decreeStamp`);
    assert.equal(presentation.fx.scorchOverlay, expected.scorchOverlay, `${stateId} scorchOverlay`);
    assert.equal(presentation.fx.ritualGold, expected.ritualGold, `${stateId} ritualGold`);
    assert.equal(
      presentation.fx.bridgeBroken,
      surface.rootLawInstrument.bridge.broken,
      `${stateId} bridgeBroken must mirror the surface bridge`,
    );
  });
}

test('resolveObservatoryPresentation is pure (same input twice deep-equals)', () => {
  const surface = buildOrThrow('blocked');
  assert.deepEqual(resolveObservatoryPresentation(surface), resolveObservatoryPresentation(surface));
});

test('resolveObservatoryPresentation never throws on an unknown-state clone', () => {
  const surface = buildOrThrow('healthy');
  const clone: StatusObservatorySurfaceV1 = { ...surface, meta: { ...surface.meta, visualState: 'unknown' } };
  const presentation = resolveObservatoryPresentation(clone);
  assert.equal(presentation.tone, 'inkJade');
  assert.equal(presentation.dominantRegion, 'vessel');
  assert.equal(presentation.canopyMode, 'maintenance');
  assert.deepEqual(presentation.defaultFocus, { kind: 'none' });
});

test('the fixture builder falls through (null) for an unknown id', () => {
  assert.equal(buildStatusObservatoryFixtureSurface('not-a-real-state'), null);
});
