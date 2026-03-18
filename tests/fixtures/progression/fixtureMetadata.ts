import type { FixturePacketId } from './fixtureTypes.js';

export const FIXTURE_CONSUMER_PACKET_MAP: Record<Exclude<FixturePacketId, '0.3B'>, string[]> = {
  '1.1': ['fresh-save', 'cap-reached', 'legacy-over-cap'],
  '1.2': ['fresh-save', 'legacy-path-conflict'],
  '1.3': ['gate-edge-pre-first', 'legacy-gate-alias'],
  '1.4': ['gate-edge-pre-first', 'gate-edge-post-first', 'legacy-trial-mismatch'],
  '1.5': ['gate-edge-post-first', 'cap-reached'],
  '1.6': ['prestige-ready', 'legacy-hidden-prestige'],
  '1.7': ['prestige-ready', 'legacy-partial-reset-residue'],
  '1.8': ['prestige-ready', 'legacy-offline-split'],
};
