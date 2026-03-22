import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildMeritRoleAudit } from '../../src/systems/economy/meritRoleAudit.js';
import { buildSupportEconomyReadModelFromState } from '../../src/systems/economy/supportEconomyReadModel.js';
import { isLiveBoardBountyKind, LIVE_BOUNTY_BOARD_SLOTS } from '../../src/systems/world/bountyBoardContract.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('support economy contract keeps the live board and Merit role aligned', async () => {
  const validated = await getValidated();
  const meritAudit = buildMeritRoleAudit(validated);
  const liveKinds = new Set(validated.bounties.templates.map((template) => template.kind));

  assert.equal(isLiveBoardBountyKind('TRIAL_CLEAR'), false);
  assert.equal(liveKinds.has('TRIAL_CLEAR'), false);
  assert.deepEqual(LIVE_BOUNTY_BOARD_SLOTS.map((slot) => slot.role), ['support', 'route', 'challenge']);
  assert.deepEqual(meritAudit.violations, []);
  assert.equal(meritAudit.meritUsingSurfaces.every((entry) => entry.id === 'gate_trial_fail_safe'), true);
});

test('support economy read model resolves current reserves against the next gate fail-safe truth', async () => {
  const validated = await getValidated();
  const model = buildSupportEconomyReadModelFromState({
    content: validated,
    cityId: 'city_lotusford',
    currencies: { merit: '9', spiritStones: '10', gold: '1000000' },
  });

  assert.equal(model.nextGateIndex, 4);
  assert.equal(model.targetMeritReserve, '25');
  assert.equal(model.spiritStoneMinimumReserve, '20');
  assert.equal(model.spiritStoneIdealReserve, '40');
  assert.equal(model.meritReserveGap, '16');
  assert.equal(model.spiritStoneMinimumGap, '10');
  assert.equal(model.reserveStatus, 'below_minimum');
  assert.equal(model.nextGateFailSafeCost?.merit, '25');
});
