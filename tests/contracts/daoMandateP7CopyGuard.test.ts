import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDaoMandateFailureCoaching,
  buildDaoMandateLessons,
  buildDaoMandateRecentOmens,
  buildDaoOfflineMandateReturnSurface,
  buildDaoReincarnationCounsel,
  buildDaoMandateSurfaceFromRunCompassV2,
} from '../../src/systems/ui/daoMandate/index.js';
import {
  buildLifeSummaryMandateMemoryBlock,
  buildLifeSummaryNextLifeFocusLines,
} from '../../src/features/prestige/lifeSummarySurface.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

const FORBIDDEN_PLAYER_COPY =
  /Packet|P7|TODO|placeholder|deferred|not wired|owner not wired|implementation|debug|fixture|stub|mock|source map adapter|Run Compass|Biggest Shortfall|Best Next Actions|Mission Requirements/i;

test('P7 generated Mandate copy does not leak implementation or old guide labels', () => {
  const base = buildDaoMandateSurfaceFromRunCompassV2(makeRunCompassV2Fixture(), { guidanceProfile: 'jade' });
  const failureRecords = [{
    reflectionId: 'copy-guard-reflection',
    trialId: 'trial_novices_clearing',
    gateIndex: 0,
    patternKind: 'underprepared_loop' as const,
    diagnosisCode: 'underprepared',
    repeatedCount: 3,
    createdAt: 10,
    lastUpdatedAt: 20,
    resolved: false,
    correctiveRoute: { target: 'apothecary' as const, label: 'Apothecary Healing Prep', reason: 'Stock medicine before retrying.' },
    memoryEligible: true,
  }];
  const offlineReturn = buildDaoOfflineMandateReturnSurface({
    summary: {
      offlineSeconds: 60,
      offlineDuration: '1m',
      efficiency: 1,
      wasCapped: false,
      parts: [{ kind: 'qi_gained', label: 'Qi gained', value: '+5 Qi' }],
    },
    currentMandate: base,
  });

  const generated = {
    omens: buildDaoMandateRecentOmens({
      now: 30,
      failureReflections: failureRecords,
      offlineReturn,
    }),
    failure: buildDaoMandateFailureCoaching({
      surface: { ...base, obstruction: { ...base.obstruction, kind: 'gate_recent_failure', source: 'failure_reflection' } },
      failureReflections: failureRecords,
      settings: { failureCoaching: 'full_reflection', guidanceOath: 'jade' },
    }),
    lessons: buildDaoMandateLessons({
      surface: { ...base, recentOmens: [] },
      settings: { jadeSlipLessons: 'repeat_until_learned', guidanceOath: 'jade' },
    }),
    offlineReturn,
    prestige: buildDaoReincarnationCounsel({
      advisorState: 'chapter_exhausted',
      route: base.prestige?.route ?? base.primaryRoute,
      forecastLine: '+2 AP forecast',
    }),
    lifeSummary: [
      buildLifeSummaryMandateMemoryBlock({
        gateProofLine: 'First gate proved stable.',
        reflectionLine: 'The gate exposed a medicine reserve gap.',
        daoImpressionLine: 'A Dao Impression settled into memory.',
        offlineLine: 'Offline settlement supported the next route.',
      }),
      buildLifeSummaryNextLifeFocusLines({
        focusLabel: 'Next-life focus',
        focusDetail: 'Prepare medicine before the next gate.',
      }),
    ],
  };

  assert.doesNotMatch(JSON.stringify(generated), FORBIDDEN_PLAYER_COPY);
});
