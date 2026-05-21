import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDaoOfflineMandateReturnSurface,
  buildDaoMandateSurfaceFromRunCompassV2,
} from '../../src/systems/ui/daoMandate/index.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

const currentMandate = buildDaoMandateSurfaceFromRunCompassV2(makeRunCompassV2Fixture(), { guidanceProfile: 'elder' });

test('P7 offline return handles unavailable, progressed, unchanged, and capped states truthfully', () => {
  const unavailable = buildDaoOfflineMandateReturnSurface({ summary: null, currentMandate });
  assert.equal(unavailable.state, 'unavailable');

  const progressed = buildDaoOfflineMandateReturnSurface({
    currentMandate,
    summary: {
      offlineSeconds: 3600,
      rawOfflineSeconds: 3600,
      maxOfflineSeconds: 43_200,
      offlineDuration: '1h',
      efficiency: 0.5,
      wasCapped: false,
      parts: [{ kind: 'qi_gained', label: 'Qi gained', value: '120' }],
    },
  });
  assert.equal(progressed.state, 'progressed');
  assert.match(progressed.detail, /Qi|Mandate|Gate Trial/i);

  const unchanged = buildDaoOfflineMandateReturnSurface({
    currentMandate,
    summary: {
      offlineSeconds: 600,
      rawOfflineSeconds: 600,
      offlineDuration: '10m',
      efficiency: 0.5,
      wasCapped: false,
      parts: [],
    },
  });
  assert.equal(unchanged.state, 'unchanged');

  const capped = buildDaoOfflineMandateReturnSurface({
    currentMandate,
    summary: {
      offlineSeconds: 43_200,
      rawOfflineSeconds: 86_400,
      maxOfflineSeconds: 43_200,
      offlineDuration: '12h',
      efficiency: 0.5,
      wasCapped: true,
      parts: [{ kind: 'expeditions', label: 'Expeditions ready', value: '1' }],
    },
  });
  assert.equal(capped.state, 'capped');
  assert.doesNotMatch(JSON.stringify([progressed, unchanged, capped]), /combat progressed|Packet|P7|debug|adapter/i);
  assert.match(capped.evidence.join(' '), /Combat never progresses offline/i);
});
