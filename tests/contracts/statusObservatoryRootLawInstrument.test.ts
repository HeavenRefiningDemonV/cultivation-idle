import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { buildStatusObservatorySurface } from '../../src/systems/ui/status/statusObservatorySurface.js';
import { usePrestigeStore } from '../../src/stores/prestigeStore.js';
import { primeStatusObservatoryScenario } from './statusObservatoryTestUtils.js';

const repoRoot = process.cwd();

const expectedRootNotches = [
  ['wood', 'Wood Root'],
  ['fire', 'Fire Root'],
  ['earth', 'Earth Root'],
  ['metal', 'Metal Root'],
  ['water', 'Water Root'],
  ['wind', 'Wind Root'],
  ['lightning', 'Lightning Root'],
  ['ice', 'Ice Root'],
  ['light', 'Light Root'],
  ['shadow', 'Shadow Root'],
  ['soul', 'Soul Root'],
  ['void', 'Void Root'],
  ['time', 'Time Root'],
  ['astral', 'Astral Root'],
] as const;

function absPath(relPath: string): string {
  return path.join(repoRoot, relPath);
}

function read(relPath: string): string {
  return readFileSync(absPath(relPath), 'utf8');
}

function exists(relPath: string): boolean {
  return existsSync(absPath(relPath));
}

test('S5 file family exists and replaces the inline root law placeholder', () => {
  for (const relPath of [
    'src/ui/status/observatory/StatusRootLawCoupledInstrument.tsx',
    'src/ui/status/observatory/StatusSpiritRootAstrolabe.tsx',
    'src/ui/status/observatory/StatusHeartLawSeal.tsx',
  ]) {
    assert.equal(exists(relPath), true, `${relPath} should exist for S5`);
  }

  const shell = read('src/ui/status/observatory/StatusLivingStateObservatory.tsx');
  const index = read('src/ui/status/observatory/index.ts');

  assert.match(shell, /StatusRootLawCoupledInstrument/);
  assert.match(shell, /<StatusRootLawCoupledInstrument\s+surface=\{surface\.rootLawInstrument\}/);
  assert.doesNotMatch(shell, /function RootLawInstrument\s*\(/);
  assert.doesNotMatch(shell, /data-s2-placeholder="root-law"/);
  assert.match(index, /StatusRootLawCoupledInstrument/);
  assert.match(index, /StatusSpiritRootAstrolabe/);
  assert.match(index, /StatusHeartLawSeal/);
});

test('S5 surface exposes a complete fourteen-root astrolabe and compact law seal data', async () => {
  await primeStatusObservatoryScenario();
  usePrestigeStore.setState({ spiritRoot: { element: 'void', grade: 2, purity: 66 } });
  const ledger = buildStatusDashboardSurface(5150).statusLedger;
  const surface = buildStatusObservatorySurface(ledger).rootLawInstrument;
  const astrolabe = surface.astrolabe as typeof surface.astrolabe & {
    notches?: Array<{ id: string; label: string; angleDeg: number; active: boolean; ariaLabel: string }>;
    activeRootId?: string;
    purityLabel?: string | null;
    gradeLabel?: string;
    proc?: { name: string; statusLabel: string; cooldownLabel: string | null } | null;
    runValidityLabel?: string | null;
  };
  const heartLawSeal = surface.heartLawSeal as typeof surface.heartLawSeal & {
    chapterBeads?: Array<{ id: string; label: string; active: boolean; filled: boolean }>;
    daoHeartStateLabel?: string | null;
  };

  assert.equal(surface.rootTestId, 'status-root-law-instrument');
  assert.equal(surface.title, 'Root / Law Coupled Instrument');
  assert.ok(Array.isArray(astrolabe.notches), 'astrolabe.notches should be present');
  assert.equal(astrolabe.notches?.length, 14);
  assert.deepEqual(
    astrolabe.notches?.map((notch) => [notch.id, notch.label]),
    expectedRootNotches,
  );
  assert.equal(astrolabe.notches?.filter((notch) => notch.active).length, 1);
  assert.equal(astrolabe.activeRootId, surface.astrolabe.spiritRoot.element);
  assert.equal((astrolabe.gradeLabel ?? '').trim().length > 0, true);
  assert.equal((astrolabe.purityLabel ?? '').trim().length > 0, true);
  assert.equal(surface.astrolabe.expressionCapLabel?.includes('/'), true);
  assert.equal((astrolabe.proc?.name ?? '').trim().length > 0, true);
  assert.equal((astrolabe.proc?.statusLabel ?? '').trim().length > 0, true);
  assert.equal((astrolabe.runValidityLabel ?? '').trim().length > 0, true);

  assert.equal((heartLawSeal.heartLawLabel ?? '').trim().length > 0, true);
  assert.equal((heartLawSeal.chapterLabel ?? '').trim().length > 0, true);
  assert.ok(Array.isArray(heartLawSeal.chapterBeads), 'heartLawSeal.chapterBeads should be present');
  assert.ok((heartLawSeal.chapterBeads?.length ?? 0) >= 5, 'chapter beads should show a fixed seal rail');
  assert.equal((heartLawSeal.daoHeartStateLabel ?? '').trim().length > 0, true);
  assert.equal((heartLawSeal.clarityLabel ?? '').trim().length > 0, true);
  assert.equal((heartLawSeal.turbulenceLabel ?? '').trim().length > 0, true);
});

test('S5 route actions continue through existing Status action surfaces', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(6161).statusLedger;
  const surface = buildStatusObservatorySurface(ledger).rootLawInstrument;

  assert.ok(
    surface.astrolabe.routeActions.some((action) => action.label === 'Observe Spirit Root' && action.target.kind === 'status_observation'),
    'Astrolabe should expose the existing Observe Spirit Root route action.',
  );
  assert.equal(surface.heartLawSeal.routeAction?.label, 'Open Dao Heart Sanctuary');
  assert.equal(surface.heartLawSeal.routeAction?.target.kind, 'dao_heart_sanctuary');
});

test('S5 bridge and renderer expose clean strained and broken states without row or table relapse', () => {
  const instrument = read('src/ui/status/observatory/StatusRootLawCoupledInstrument.tsx');
  const astrolabe = read('src/ui/status/observatory/StatusSpiritRootAstrolabe.tsx');
  const seal = read('src/ui/status/observatory/StatusHeartLawSeal.tsx');
  const scss = read('src/ui/status/observatory/StatusLivingStateObservatory.scss');
  const combined = `${instrument}\n${astrolabe}\n${seal}`;

  assert.match(instrument, /data-testid="status-root-law-instrument"/);
  assert.match(instrument, /data-s5-instrument="root-law-coupled"/);
  assert.match(instrument, /data-bridge-state=\{surface\.bridge\.state\}/);
  assert.match(instrument, /data-bridge-broken=\{surface\.bridge\.broken \? 'true' : 'false'\}/);
  assert.match(instrument, /data-fit-tier=\{surface\.bridge\.fitTier\}/);
  assert.match(instrument, /StatusSpiritRootAstrolabe/);
  assert.match(instrument, /StatusHeartLawSeal/);
  assert.match(instrument, /onAction\(action\)/);

  for (const state of ['aligned', 'compatible', 'strained', 'opposed', 'unknown']) {
    assert.match(scss, new RegExp(`data-bridge-state="${state}"`), `${state} bridge state should be styled`);
  }
  assert.match(scss, /statusRootLawBridge__crack/);
  assert.match(scss, /statusSpiritRootAstrolabe__notch/);
  assert.match(scss, /statusHeartLawSeal__bead/);

  assert.doesNotMatch(combined, /<table|<tr|<td|role=['"]table['"]/);
  assert.doesNotMatch(combined, /<ul|<ol/);
  assert.doesNotMatch(combined, /tabs\.map\([^)]*rows|tab\.rows\.map|spiritRootObservation\.tabs/);
  assert.doesNotMatch(combined, /StatusLedgerCard|StatusLedgerRows|StatusCurrentStatePanel/);
});

test('S5 visual components remain pure after S8 public cutover', () => {
  const sources = [
    read('src/ui/status/observatory/StatusRootLawCoupledInstrument.tsx'),
    read('src/ui/status/observatory/StatusSpiritRootAstrolabe.tsx'),
    read('src/ui/status/observatory/StatusHeartLawSeal.tsx'),
  ];
  const shell = read('src/ui/status/observatory/StatusLivingStateObservatory.tsx');
  const publicPage = read('src/ui/status/ledger/StatusLedgerPage.tsx');

  assert.match(shell, /STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED = true/);
  assert.match(publicPage, /StatusLivingStateObservatory/);
  assert.match(publicPage, /buildStatusObservatorySurface/);
  assert.match(publicPage, /StatusLegacyLedgerPage|StatusLedgerFallbackPage/);

  for (const source of sources) {
    assert.doesNotMatch(source, /from ['"].*stores\//, 'S5 visual components must not import stores');
    assert.doesNotMatch(source, /\.getState\s*\(/, 'S5 visual components must not read stores');
    assert.doesNotMatch(source, /RewardService|grantRewards|spendCurrency/, 'S5 visual components must not mutate rewards');
    assert.doesNotMatch(source, /CombatStore|useCombatStore|resolveCombat|combat resolution/i, 'S5 visual components must not own combat');
    assert.doesNotMatch(source, /PrestigeResetService|performPrestigeReset|usePrestigeStore/, 'S5 visual components must not own prestige');
    assert.doesNotMatch(source, /breakthrough\s*\(|attemptBreakthrough|resolveBreakthrough/, 'S5 visual components must not trigger breakthrough');
    assert.doesNotMatch(source, /performStatusRouteTarget|openSpiritRootObservation|openDaoHeartModal/, 'S5 visual components should forward actions instead of mutating route owners');
  }
});
