import assert from 'node:assert/strict';
import test from 'node:test';

import {
  makeSeatFixture,
  makeSeatRawFixture,
  CULTIVATION_SEAT_FIXTURES,
  getSeatFixture,
} from '../../src/systems/ui/cultivation/cultivationSeatFixtures.js';
import { buildCultivationSeatSurface } from '../../src/systems/ui/cultivation/cultivationSeatSurface.js';

void test('M.II.3 — the surface carries the meta discipline (rootTestId, schema, visualState) and is deterministic', () => {
  const raw = makeSeatRawFixture();
  const a = buildCultivationSeatSurface({ raw, mode: 'fixture', nowMs: 1000 });
  const b = buildCultivationSeatSurface({ raw, mode: 'fixture', nowMs: 1000 });
  assert.deepEqual(a, b, 'pure builder: same input ⇒ identical surface (no recompute drift)');
  assert.equal(a.meta.rootTestId, 'cultivation-seat-root');
  assert.equal(a.meta.schemaVersion, 'cultivation-seat-v1');
  assert.ok(['seclusion', 'cultivating', 'combatHeld', 'peakReady', 'peakBlocked', 'unknown'].includes(a.meta.visualState));
});

void test('M.II.3-C — the three lives yield three distinct identities (path glyph + accent token, never hex)', () => {
  const heaven = makeSeatFixture({ game: { ...makeSeatRawFixture().game, selectedPath: 'heaven' } });
  const earth = makeSeatFixture({ game: { ...makeSeatRawFixture().game, selectedPath: 'earth' } });
  const martial = makeSeatFixture({ game: { ...makeSeatRawFixture().game, selectedPath: 'martial' } });
  assert.equal(new Set([heaven.identity.pathGlyph, earth.identity.pathGlyph, martial.identity.pathGlyph]).size, 3);
  assert.equal(new Set([heaven.identity.accentTokenId, earth.identity.accentTokenId, martial.identity.accentTokenId]).size, 3);
  for (const s of [heaven, earth, martial]) {
    assert.match(s.identity.accentTokenId, /^path\.(heaven|earth|martial)\.accent$/);
    assert.doesNotMatch(s.identity.accentTokenId, /#/, 'token id, never hex (R-7)');
  }
});

void test('M.II.3 R-1 — the Focus Dial shows the six canonical D2 axes + Balanced and NEVER a "Body" spoke', () => {
  const surface = makeSeatFixture();
  const ids = surface.focus.axes.map((a) => a.id);
  assert.deepEqual(ids, ['qiPool', 'qiPurity', 'meridianOpenness', 'spiritualSense', 'soulStrength', 'daoComprehension', 'balanced']);
  assert.equal(surface.focus.axes.some((a) => a.label === 'Body'), false, 'Body is Tier-0, never a Focus target');
  assert.equal(surface.focus.axes.length, 7);
  // R-1 lossy mapping is recorded in debugNotes
  assert.ok(surface.meta.debugNotes.some((n) => /focus/i.test(n)));
});

void test('M.II.3 R-2 — the Heart check binds Turbulence; the safety band is a separate read', () => {
  const fractured = CULTIVATION_SEAT_FIXTURES.earthPeakBlockedFractured();
  const gate = fractured.breakthrough.gateReadiness;
  assert.ok(gate, 'gate readiness present at the Peak');
  assert.equal(gate?.heartFractured, true);
  assert.equal(gate?.verdict, 'held');
  const mind = gate?.checks.find((c) => c.id === 'mind');
  assert.match(mind?.value ?? '', /Turbulence/, 'the Heart check reads Turbulence (not stability)');
  assert.equal(mind?.state, 'blocked');
  // the band is its own field (the stability roll), not the turbulence value
  assert.ok(['serene', 'steady', 'perilous', 'dire', 'guaranteed'].includes(gate?.safetyBand ?? ''));

  const ready = CULTIVATION_SEAT_FIXTURES.heavenPeakReady();
  assert.equal(ready.breakthrough.gateReadiness?.heartFractured, false);
  assert.equal(ready.breakthrough.gateReadiness?.verdict, 'ready');
  assert.equal(ready.breakthrough.gateReadiness?.canCommit, true);
});

void test('M.II.3 R-3 — pity is live (bound from the failSafe), not invented', () => {
  const ready = CULTIVATION_SEAT_FIXTURES.heavenPeakReady();
  assert.ok(ready.breakthrough.gateReadiness?.pity, 'pity present when a fail-safe exists');
  assert.equal(typeof ready.breakthrough.gateReadiness?.pity?.banked, 'number');
  assert.equal(typeof ready.breakthrough.gateReadiness?.pity?.toGuarantee, 'number');
  // when no fail-safe context exists, pity is null (never fabricated)
  const noPity = makeSeatFixture({ game: { ...makeSeatRawFixture().game, substage: 9 }, pity: null });
  assert.equal(noPity.breakthrough.gateReadiness?.pity, null);
});

void test('M.II.3 R-4/R-8 — the live slice has six realms (R7 sealed); the ceremony is not on this surface', () => {
  const surface = makeSeatFixture();
  assert.equal(surface.ascent.realmsTotalLive, 6);
  assert.equal(surface.breakthrough.ceremonyActive, false, 'the ceremony is delegated to the F2 RitualCeremonyShell');
});

void test('M.II.3 §F — the idle ledger never shows a tax, penalty, or decay term', () => {
  for (const id of Object.keys(CULTIVATION_SEAT_FIXTURES)) {
    const surface = getSeatFixture(id);
    assert.ok(surface);
    const ledgerText = JSON.stringify(surface?.scrolls.ledger ?? {}) + JSON.stringify(surface?.idle ?? {});
    assert.doesNotMatch(ledgerText, /\btax(ed|es)?\b|\bpenalt|\bdecay/i, `idle ledger is never taxed (${id})`);
  }
});

void test('M.II.3 — the per-path instrument is discriminated by path', () => {
  const heaven = makeSeatFixture({ game: { ...makeSeatRawFixture().game, selectedPath: 'heaven' } });
  const martial = makeSeatFixture({ game: { ...makeSeatRawFixture().game, selectedPath: 'martial' } });
  assert.equal(heaven.instrument.kind, 'heaven');
  assert.equal(martial.instrument.kind, 'martial');
  if (heaven.instrument.kind === 'heaven') assert.equal(typeof heaven.instrument.foresightHorizon, 'number');
  if (martial.instrument.kind === 'martial') assert.equal(typeof martial.instrument.bondDepthPct, 'number');
});

void test('M.II.3 — combat held pauses the idle read and the motion', () => {
  const held = CULTIVATION_SEAT_FIXTURES.martialCombatHeld();
  assert.equal(held.meta.visualState, 'combatHeld');
  assert.equal(held.idle.qiPerSec, '—');
  assert.equal(held.idle.combatHeld, true);
  assert.equal(held.meta.motionHints.qiFlow, 'held');
  assert.equal(held.meta.motionHints.cultivationRate, null);
});

void test('M.II.3 — no path selected resolves to the fallback identity (never crashes)', () => {
  const fallback = CULTIVATION_SEAT_FIXTURES.noPathFallback();
  assert.equal(fallback.meta.mode, 'fallback');
  assert.ok(fallback.meta.debugNotes.some((n) => /no selectedPath/i.test(n)));
});
