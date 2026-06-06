import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyDaoMandateVisibility,
  buildDaoMandateRecentOmens,
  buildDaoMandateSurfaceFromRunCompassV2,
} from '../../src/systems/ui/daoMandate/index.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

const runDelta = (id: string, timestamp: number, label: string, detail = label) => ({
  id,
  source: 'rewards',
  timestamp,
  tone: 'success' as const,
  label,
  detail,
  memoryLine: `${label}: ${detail}.`,
  rewardSummary: detail,
  readinessDelta: null,
});

test('P7 Recent Omens normalize, dedupe, sort, and keep player-safe copy', () => {
  const omens = buildDaoMandateRecentOmens({
    now: 1_000,
    runDeltas: [
      runDelta('resource:gold', 120, 'Gold reserve shifted', '+10 Gold'),
      runDelta('resource:gold', 130, 'Gold reserve shifted', '+11 Gold'),
    ],
    failureReflections: [{
      reflectionId: 'inner_demon:trial:0:underprepared',
      trialId: 'trial_novices_clearing',
      gateIndex: 0,
      patternKind: 'underprepared_loop',
      diagnosisCode: 'underprepared',
      repeatedCount: 3,
      createdAt: 80,
      lastUpdatedAt: 200,
      resolved: false,
      correctiveRoute: { target: 'apothecary', label: 'Apothecary Healing Prep', reason: 'Stock medicine before retrying.' },
      memoryEligible: true,
    }],
    daoImpressions: [{
      awardId: 'impression:gate-close',
      impressionId: 'gate_close_defeat',
      sourceKind: 'gate_close_defeat',
      sourceEventKey: 'gate:close:1',
      createdAt: 210,
      title: 'Close Gate Trace',
      doctrineFamily: 'trial',
      comprehensionDelta: 1,
      applied: true,
      targetHeartLawId: 'heart_law_test',
      rarityBand: 'clear',
      memoryEligible: true,
      memoryLine: 'A close gate exchange settled into memory.',
    }],
  });

  assert.deepEqual(omens.map((omen) => omen.id), [
    'failure:inner_demon:trial:0:underprepared',
    'dao-impression:impression:gate-close',
    'resource:gold',
  ]);
  assert.match(omens[0].detail, /gate exposed|medicine|Apothecary/i);
  assert.equal(omens.filter((omen) => omen.id === 'resource:gold').length, 1);
  assert.doesNotMatch(JSON.stringify(omens), /Packet|P7|debug|adapter|placeholder|Run Compass/i);
});

test('P7 Recent Omens visibility is controlled by feed settings, not legacy profile names', () => {
  const surface = buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      recentDeltas: [
        runDelta('gate-clear', 300, 'Gate proof resolved', 'The gate opened'),
        runDelta('source-route', 250, 'Source route resolved', 'The herb reserve is ready'),
        runDelta('craft-floor', 200, 'Forge floor settled', 'The weapon floor improved'),
        runDelta('minor-gold', 150, 'Gold reserve shifted', '+3 Gold'),
        runDelta('ap-forecast', 100, 'Reincarnation forecast changed', '+2 AP'),
      ],
    }),
    { guidanceProfile: 'jade' },
  );

  const sealed = applyDaoMandateVisibility(surface, { profile: 'sealed', settings: { recentOmensFeed: 'full' } });
  const elder = applyDaoMandateVisibility(surface, { profile: 'elder', settings: { recentOmensFeed: 'compact' } });
  const jade = applyDaoMandateVisibility(surface, { profile: 'jade', settings: { recentOmensFeed: 'full' } });

  assert.equal(sealed.recentOmens.length, 5);
  assert.equal(elder.recentOmens.length, 3);
  assert.equal(jade.recentOmens.length, 5);
  assert.deepEqual(
    sealed.recentOmens.map((omen) => omen.id),
    jade.recentOmens.map((omen) => omen.id),
  );
});
