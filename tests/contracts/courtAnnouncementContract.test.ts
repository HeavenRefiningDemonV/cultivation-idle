import assert from 'node:assert/strict';
import test from 'node:test';

import { courtAnnouncement } from '../../src/ui/court/a11y/courtAnnouncement.js';
import type { CourtStatus, TemperingCourtSurface } from '../../src/systems/meridians/index.js';

/**
 * W10 — locks the Court's polite live-region copy. The focus-trap + roving are DOM
 * behaviour (jsdom-free here), but the announcement is the spoken meaning of each
 * state — pure, so it's the contract: every status has words (no colour/motion-only),
 * and the top alert is appended.
 */
function surfaceOf(
  status: CourtStatus,
  opts: { meridian?: string; intensity?: string; alert?: string } = {},
): TemperingCourtSurface {
  return {
    status,
    intensity: { label: opts.intensity ?? 'Steady' },
    activeMeridian: opts.meridian ? { name: opts.meridian } : null,
    alerts: opts.alert ? [{ tone: 'gold', glyph: '滿', text: opts.alert }] : [],
  } as unknown as TemperingCourtSurface;
}

test('W10 announcement gives every Court status a spoken sentence (no colour/motion-only)', () => {
  assert.match(courtAnnouncement(surfaceOf('active', { meridian: 'Flowing Step', intensity: 'Harsh' })), /^Tempering Flowing Step at Harsh intensity\./);
  assert.equal(courtAnnouncement(surfaceOf('active')), 'Tempering at Steady intensity.');
  assert.equal(courtAnnouncement(surfaceOf('idle')), 'Court idle — ready to temper.');
  assert.equal(courtAnnouncement(surfaceOf('blocked_by_combat')), 'Court closed — in combat.');
  assert.equal(courtAnnouncement(surfaceOf('blocked_by_activity')), 'Court occupied — another activity holds the hall.');
  assert.match(courtAnnouncement(surfaceOf('no_path')), /No path chosen/);
});

test('W10 announcement appends the top alert (capped / bottleneck / breakthrough)', () => {
  const msg = courtAnnouncement(surfaceOf('active', { meridian: 'Weapon Intent', alert: 'Weapon Intent reached its realm cap — overflow now feeds mastery.' }));
  assert.match(msg, /^Tempering Weapon Intent at Steady intensity\./);
  assert.match(msg, /reached its realm cap/);
  // no alert -> no trailing space, just the head
  const plain = courtAnnouncement(surfaceOf('idle'));
  assert.equal(plain.endsWith('.'), true);
  assert.doesNotMatch(plain, /\s$/);
});
