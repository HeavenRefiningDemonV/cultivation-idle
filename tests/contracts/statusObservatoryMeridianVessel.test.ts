import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import {
  STATUS_OBSERVATORY_MERIDIAN_ORGAN_GEOMETRY,
  STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS,
} from '../../src/systems/ui/status/statusObservatoryPresentation.js';
import { buildStatusObservatorySurface } from '../../src/systems/ui/status/statusObservatorySurface.js';
import { primeStatusObservatoryScenario } from './statusObservatoryTestUtils.js';

const repoRoot = process.cwd();

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function exists(relPath: string): boolean {
  return existsSync(path.join(repoRoot, relPath));
}

test('S4 surface exposes exactly six meridian organs and one selected focus lens', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(4242).statusLedger;
  const surface = buildStatusObservatorySurface(ledger).meridianVessel;

  assert.equal(surface.rootTestId, 'status-current-state');
  assert.equal(surface.title, 'Meridian Vessel Compass');
  assert.equal(surface.organs.length, 6);
  assert.deepEqual(surface.organs.map((organ) => organ.id), [
    'cultivation',
    'daoHeart',
    'spiritRoot',
    'training',
    'buildPrep',
    'activeWork',
  ]);
  assert.deepEqual(surface.organs.map((organ) => organ.ordinal), [1, 2, 3, 4, 5, 6]);

  const organIds = new Set(surface.organs.map((organ) => organ.id));
  assert.equal(organIds.has(surface.focusLens.selectedOrganId), true);
  assert.equal(surface.focusLens.label.trim().length > 0, true);
  assert.equal(surface.focusLens.value.trim().length > 0, true);
  assert.equal(surface.focusLens.consequence.trim().length > 0, true);

  for (const organ of surface.organs) {
    assert.equal(organ.title.trim().length > 0, true, `${organ.id} title should be non-empty`);
    assert.equal(organ.valueLabel.trim().length > 0, true, `${organ.id} value should be non-empty`);
    assert.equal(organ.consequence.trim().length > 0, true, `${organ.id} consequence should be non-empty`);
    assert.equal(Array.isArray(organ.detailRows), true, `${organ.id} detailRows should remain available`);
    assert.match(organ.state, /^(healthy|attention|danger|locked|unknown)$/);
    assert.equal(organ.ariaLabel.trim().length > 0, true, `${organ.id} aria label should be non-empty`);
  }
});

test('S4 shared causes are compact stamp surfaces while exact rows remain available', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(5252).statusLedger;
  const surface = buildStatusObservatorySurface(ledger).meridianVessel;

  assert.equal(surface.sharedCauseStamps.length, surface.sharedCauseRows.length);
  assert.ok(surface.sharedCauseStamps.length >= 4, 'shared cause stamps should preserve broad pressure signals');

  for (const stamp of surface.sharedCauseStamps) {
    assert.equal(stamp.id.trim().length > 0, true);
    assert.equal(stamp.label.trim().length > 0, true);
    assert.ok(stamp.label.length <= 34, `${stamp.id} stamp label should stay compact`);
    assert.equal(stamp.ariaLabel.includes(stamp.label), true);
    assert.match(stamp.tone, /^(success|info|warning|danger|muted|jade|gold)$/);
  }

  assert.ok(
    surface.sharedCauseRows.some((row) => row.detail.length > 40),
    'exact source rows should remain available for drawer detail',
  );
});

test('S4 presentation geometry covers all six organs exactly once', () => {
  assert.deepEqual(Object.keys(STATUS_OBSERVATORY_MERIDIAN_ORGAN_GEOMETRY).sort(), [
    'activeWork',
    'buildPrep',
    'cultivation',
    'daoHeart',
    'spiritRoot',
    'training',
  ]);

  for (const [id, geometry] of Object.entries(STATUS_OBSERVATORY_MERIDIAN_ORGAN_GEOMETRY)) {
    assert.equal(Number.isFinite(geometry.x), true, `${id} x should be finite`);
    assert.equal(Number.isFinite(geometry.y), true, `${id} y should be finite`);
    assert.equal(Number.isFinite(geometry.lineTargetX), true, `${id} line target x should be finite`);
    assert.equal(Number.isFinite(geometry.lineTargetY), true, `${id} line target y should be finite`);
    assert.ok(geometry.x >= 0 && geometry.x <= 100, `${id} x should stay in viewBox`);
    assert.ok(geometry.y >= 0 && geometry.y <= 100, `${id} y should stay in viewBox`);
  }

  assert.match(STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.healthy.label, /Stable/);
  assert.match(STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.attention.label, /Needs Work/);
  assert.match(STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.danger.label, /At Risk/);
  assert.match(STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS.locked.label, /Locked/);
});

test('S4 renderer uses a vessel instrument, local selection, focus lens, stamps, and drawer skeleton', () => {
  for (const relPath of [
    'src/ui/status/observatory/StatusMeridianVesselCompass.tsx',
    'src/ui/status/observatory/StatusMeridianFocusLens.tsx',
    'src/ui/status/observatory/StatusFocusLens.tsx',
    'src/ui/status/observatory/StatusObservatoryDrawers.tsx',
  ]) {
    assert.equal(exists(relPath), true, `${relPath} should exist for S4`);
  }

  const renderer = read('src/ui/status/observatory/StatusMeridianVesselCompass.tsx');
  const lens = read('src/ui/status/observatory/StatusMeridianFocusLens.tsx');
  const baseLens = read('src/ui/status/observatory/StatusFocusLens.tsx');
  const drawers = read('src/ui/status/observatory/StatusObservatoryDrawers.tsx');
  const shell = read('src/ui/status/observatory/StatusLivingStateObservatory.tsx');
  const scss = read('src/ui/status/observatory/StatusLivingStateObservatory.scss');
  const index = read('src/ui/status/observatory/index.ts');
  const publicPage = read('src/ui/status/ledger/StatusLedgerPage.tsx');

  assert.match(renderer, /data-testid="status-current-state"/);
  assert.match(renderer, /data-s4-instrument="meridian-vessel-compass"/);
  assert.match(renderer, /StatusMeridianFocusLens/);
  assert.match(renderer, /StatusObservatoryDrawers|StatusMeridianVesselDrawer/);
  assert.match(renderer, /useReducer|useState/);
  assert.match(renderer, /onClick/);
  assert.match(renderer, /onFocus|onKeyDown|aria-pressed/);
  assert.match(renderer, /data-organ-id/);
  assert.match(renderer, /data-selected/);
  assert.match(renderer, /statusMeridianVesselCompass__bodyLinework|<svg/);
  assert.match(renderer, /statusMeridianVesselCompass__sharedCauseStamps/);

  assert.match(lens, /data-testid="status-meridian-focus-lens"/);
  assert.match(lens, /aria-live="polite"/);
  assert.match(lens, /onAction\(action\)/);
  assert.match(baseLens, /StatusFocusLens/);
  assert.match(drawers, /data-testid="status-meridian-vessel-drawer"/);
  assert.match(drawers, /data-selected-organ-id/);

  assert.match(shell, /StatusMeridianVesselCompass/);
  assert.doesNotMatch(shell, /function MeridianVessel\s*\(/);
  assert.doesNotMatch(shell, /data-s2-placeholder="meridian-vessel"/);
  assert.match(index, /StatusMeridianVesselCompass/);
  assert.match(index, /StatusMeridianFocusLens/);
  assert.match(index, /StatusFocusLens/);
  assert.match(index, /StatusObservatoryDrawers/);
  assert.doesNotMatch(scss, /statusMeridianVessel__dial/);

  assert.match(shell, /STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED = true/);
  assert.match(publicPage, /StatusLivingStateObservatory/);
  assert.match(publicPage, /buildStatusObservatorySurface/);
  assert.match(publicPage, /StatusLegacyLedgerPage|StatusLedgerFallbackPage/);

  for (const source of [renderer, lens, baseLens, drawers]) {
    assert.doesNotMatch(source, /from ['"].*stores\//, 'S4 visual components must not import stores');
    assert.doesNotMatch(source, /\.getState\s*\(/, 'S4 visual components must not read stores');
    assert.doesNotMatch(source, /RewardService|grantRewards|spendCurrency/, 'S4 visual components must not mutate rewards');
    assert.doesNotMatch(source, /CombatStore|useCombatStore/, 'S4 visual components must not import combat owners');
    assert.doesNotMatch(source, /PrestigeResetService|performPrestigeReset/, 'S4 visual components must not import prestige reset owners');
    assert.doesNotMatch(source, /breakthrough\s*\(/, 'S4 visual components must not trigger breakthrough');
    assert.doesNotMatch(source, /<table|<tr|<td|role=['"]table['"]/, 'S4 default instrument must not become a table');
    assert.doesNotMatch(source, /StatusLedgerCard|StatusLedgerRows|StatusCurrentStatePanel/, 'S4 should not reuse old ledger row/card components');
  }
});
