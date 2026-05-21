import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDaoReincarnationCounsel,
  type DaoMandateRoute,
} from '../../src/systems/ui/daoMandate/index.js';

const prestigeRoute: DaoMandateRoute = {
  id: 'open-prestige',
  label: 'Review Reincarnation',
  actionLabel: 'Open Reincarnation',
  detail: 'Review the reincarnation ledger.',
  destinationLabel: 'Prestige',
  target: { kind: 'tab', tab: 'prestige' },
  blocked: false,
  blockedReason: null,
  expectedDeltaLabel: 'Reincarnation counsel can be reviewed.',
  source: 'prestige',
  priority: 5,
};

test('P7 reincarnation counsel maps advisor states to honest Mandate states', () => {
  assert.equal(buildDaoReincarnationCounsel({
    advisorState: 'too_early',
    route: prestigeRoute,
    potentialApGain: 0,
  })?.state, 'too_early');
  assert.equal(buildDaoReincarnationCounsel({
    advisorState: 'viable',
    route: prestigeRoute,
    potentialApGain: 5,
  })?.state, 'viable');
  assert.equal(buildDaoReincarnationCounsel({
    advisorState: 'recommended',
    route: prestigeRoute,
    potentialApGain: 12,
  })?.state, 'recommended');
  assert.equal(buildDaoReincarnationCounsel({
    advisorState: 'chapter_exhausted',
    route: prestigeRoute,
    potentialApGain: 18,
  })?.state, 'cap_recommended');
  assert.equal(buildDaoReincarnationCounsel({
    advisorState: 'blocked',
    route: { ...prestigeRoute, blocked: true, blockedReason: 'Reach Core Formation first.' },
    potentialApGain: 0,
  })?.state, 'blocked');
});

test('P7 reincarnation counsel avoids inactive-effect promises', () => {
  const counsel = buildDaoReincarnationCounsel({
    advisorState: 'chapter_exhausted',
    route: prestigeRoute,
    potentialApGain: 18,
    forecastLine: '+18 AP forecast from resolved gates.',
  });

  assert.ok(counsel);
  assert.match(counsel.detail, /authored|chapter|reincarnation|loop/i);
  assert.equal(counsel.route?.target?.kind, 'tab');
  assert.doesNotMatch(JSON.stringify(counsel), /inactive|unsupported_hidden|deferred|maximum efficiency|Packet|P7|debug/i);
});
