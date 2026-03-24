import assert from 'node:assert/strict';
import test from 'node:test';

import { getBountyDestinationCtaLabel } from '../../src/utils/bountyRouting.js';

test('bounty destination CTA labels are module-aware and safe fallback stays on board', () => {
  assert.equal(getBountyDestinationCtaLabel({ kind: 'module', cityId: 'city', moduleKey: 'outskirts' }), 'Open Outskirts');
  assert.equal(getBountyDestinationCtaLabel({ kind: 'module', cityId: 'city', moduleKey: 'expeditions' }), 'Open Expeditions');
  assert.equal(getBountyDestinationCtaLabel({ kind: 'unavailable', cityId: 'city', reason: 'Unavailable' }), 'View Bounties');
});
