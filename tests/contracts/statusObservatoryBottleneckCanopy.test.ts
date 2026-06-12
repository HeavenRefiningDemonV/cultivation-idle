import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { STATUS_OBSERVATORY_FIXTURE_SEEDS } from '../../src/systems/ui/status/statusObservatoryFixtures.js';
import { buildStatusObservatorySurface } from '../../src/systems/ui/status/statusObservatorySurface.js';
import { primeStatusObservatoryScenario } from './statusObservatoryTestUtils.js';

const repoRoot = process.cwd();

function absPath(relPath: string): string {
  return path.join(repoRoot, relPath);
}

function read(relPath: string): string {
  return readFileSync(absPath(relPath), 'utf8');
}

function exists(relPath: string): boolean {
  return existsSync(absPath(relPath));
}

test('S6 file family exists and replaces the inline Bottleneck Canopy placeholder', () => {
  for (const relPath of [
    'src/ui/status/observatory/StatusBottleneckTalismanCanopy.tsx',
    'src/ui/status/observatory/StatusBottleneckInspector.tsx',
    'src/ui/status/observatory/StatusCausalThreadLayer.tsx',
  ]) {
    assert.equal(exists(relPath), true, `${relPath} should exist for S6.`);
  }

  const shell = read('src/ui/status/observatory/StatusLivingStateObservatory.tsx');
  const index = read('src/ui/status/observatory/index.ts');
  const publicPage = read('src/ui/status/ledger/StatusLedgerPage.tsx');

  assert.match(shell, /StatusBottleneckTalismanCanopy/);
  assert.match(shell, /<StatusBottleneckTalismanCanopy\s+surface=\{surface\.bottleneckCanopy\}/);
  assert.doesNotMatch(shell, /function BottleneckCanopy\s*\(/);
  assert.doesNotMatch(shell, /data-s2-placeholder="bottleneck-canopy"/);
  assert.match(index, /StatusBottleneckTalismanCanopy/);
  assert.match(index, /StatusBottleneckInspector/);
  assert.match(shell, /STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED = true/);
  assert.match(publicPage, /StatusLivingStateObservatory/);
  assert.match(publicPage, /buildStatusObservatorySurface/);
  assert.match(publicPage, /StatusLegacyLedgerPage|StatusLedgerFallbackPage/);
});

test('S6 canopy surface exposes edict, pinned slips, route charms, inspector, safety seal, and culprit threads', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(6060).statusLedger;
  const canopy = buildStatusObservatorySurface(ledger).bottleneckCanopy as typeof buildStatusObservatorySurface extends
    (ledger: never) => infer Surface
    ? Surface extends { bottleneckCanopy: infer Canopy }
      ? Canopy & {
          subtitle?: string;
          talismanSlips: Array<Canopy extends { talismanSlips: Array<infer Slip> } ? Slip & {
            stateLabel?: string | null;
            routeLabel?: string | null;
            geometry?: { x: number; y: number; rotationDeg: number; anchor: string };
          } : never>;
          routeCharms: Array<Canopy extends { routeCharms: Array<infer Charm> } ? Charm & {
            order?: number;
            geometry?: { x: number; y: number };
          } : never>;
          safetySeal: Canopy extends { safetySeal: infer Seal } ? Seal & { tone?: string } : never;
          inspector?: {
            selectedSlipId: string | null;
            title: string;
            detail: string;
            sourceLabel: string;
            routeAction: unknown;
            detailRows: readonly unknown[];
          };
        }
      : never
    : never;

  assert.equal(canopy.rootTestId, 'status-bottleneck-canopy');
  assert.equal(canopy.title, 'Bottleneck Talisman Canopy');
  assert.match(canopy.subtitle ?? '', /node of obstruction|paths to resolution/i);
  assert.equal(canopy.centralEdict.label.trim().length > 0, true);
  assert.equal(canopy.centralEdict.detail.trim().length > 0, true);
  assert.equal(canopy.centralEdict.sourceLabel.trim().length > 0, true);
  assert.match(canopy.centralEdict.visualState, /^(blocked|healthy|postFailure|prestigePressure|contentCap|unknown)$/);

  assert.ok(canopy.talismanSlips.length >= 4, 'canopy should expose several pinned slips, not a single task row.');
  const sourceFamilies = new Set(canopy.talismanSlips.map((slip) => slip.sourceFamily));
  assert.ok(sourceFamilies.has('missionRequirements'), 'mission requirements must remain discoverable through slips.');
  assert.ok(
    sourceFamilies.has('currentState') || sourceFamilies.has('spiritRootObservation') || sourceFamilies.has('namedStats'),
    'slips should include causal sources beyond mission rows.',
  );

  const rotations = new Set<number>();
  for (const slip of canopy.talismanSlips) {
    assert.equal(slip.id.trim().length > 0, true);
    assert.equal(slip.title.trim().length > 0, true);
    assert.equal(slip.detail.trim().length > 0, true);
    assert.equal((slip.priorityLabel ?? slip.stateLabel ?? '').trim().length > 0, true, `${slip.id} needs a priority or state label.`);
    assert.equal(Array.isArray(slip.detailRows), true, `${slip.id} should preserve exact rows for the inspector.`);
    assert.equal((slip.detailRows?.length ?? 0) > 0, true, `${slip.id} should expose at least one exact row.`);
    assert.ok(slip.geometry, `${slip.id} needs deterministic pinned geometry.`);
    assert.equal(Number.isFinite(slip.geometry.x), true, `${slip.id} x should be finite.`);
    assert.equal(Number.isFinite(slip.geometry.y), true, `${slip.id} y should be finite.`);
    assert.equal(Number.isFinite(slip.geometry.rotationDeg), true, `${slip.id} rotation should be finite.`);
    assert.ok(slip.geometry.x >= 0 && slip.geometry.x <= 100, `${slip.id} x should stay within board coordinates.`);
    assert.ok(slip.geometry.y >= 0 && slip.geometry.y <= 100, `${slip.id} y should stay within board coordinates.`);
    rotations.add(slip.geometry.rotationDeg);
  }
  assert.ok(rotations.size >= 3, 'pinned slips should not all share the same rotation.');

  assert.ok(canopy.routeCharms.length >= 1, 'route charms should be populated from existing Status actions.');
  assert.equal(new Set(canopy.routeCharms.map((charm) => charm.action.id)).size, canopy.routeCharms.length);
  for (const charm of canopy.routeCharms) {
    assert.equal(charm.action && typeof charm.action === 'object', true);
    assert.equal(charm.label.trim().length > 0, true);
    assert.equal(Number.isFinite(charm.order), true, `${charm.id} needs deterministic order.`);
    assert.ok(charm.geometry, `${charm.id} needs deterministic charm geometry.`);
  }

  assert.ok(canopy.inspector, 'selected-slip inspector surface should exist.');
  assert.ok(
    canopy.inspector?.selectedSlipId === null ||
      canopy.talismanSlips.some((slip) => slip.id === canopy.inspector?.selectedSlipId),
    'inspector selected slip should point at a real slip.',
  );
  assert.equal((canopy.inspector?.title ?? '').trim().length > 0, true);
  assert.equal((canopy.inspector?.detail ?? '').trim().length > 0, true);
  assert.equal((canopy.inspector?.sourceLabel ?? '').trim().length > 0, true);
  assert.equal((canopy.inspector?.detailRows.length ?? 0) > 0, true);

  assert.equal(canopy.safetySeal.label.trim().length > 0, true);
  assert.equal(canopy.safetySeal.stateLabel.trim().length > 0, true);
  assert.equal(canopy.safetySeal.progressLabel.trim().length > 0, true);
  assert.match(canopy.safetySeal.tone ?? '', /^(success|info|warning|danger|muted|jade|gold)$/);
  assert.equal(canopy.safetySeal.rows.length > 0, true);

  assert.ok(canopy.causalThreads.length >= 3, 'culprit threads should reflect source-derived causes.');
  for (const thread of canopy.causalThreads) {
    assert.equal(thread.toFamily, 'bottleneckCanopy');
    assert.equal(thread.toId, 'central-edict');
    assert.equal(thread.label.trim().length > 0, true);
    assert.equal(thread.detail.trim().length > 0, true);
  }
});

test('S6 renderer exposes board semantics, local selection, onAction-only routes, and no list/table/card relapse', () => {
  const canopy = read('src/ui/status/observatory/StatusBottleneckTalismanCanopy.tsx');
  const inspector = read('src/ui/status/observatory/StatusBottleneckInspector.tsx');
  const threadLayer = read('src/ui/status/observatory/StatusCausalThreadLayer.tsx');
  const scss = read('src/ui/status/observatory/StatusLivingStateObservatory.scss');
  const combined = `${canopy}\n${inspector}\n${threadLayer}`;

  assert.match(canopy, /data-testid="status-bottleneck-canopy"/);
  assert.match(canopy, /data-s6-instrument="bottleneck-talisman-canopy"/);
  assert.match(canopy, /data-testid="status-bottleneck-edict"/);
  assert.match(canopy, /data-testid="status-bottleneck-slip"/);
  assert.match(canopy, /<StatusCausalThreadLayer/);
  assert.match(threadLayer, /data-testid="status-bottleneck-thread"/);
  assert.match(canopy, /data-testid="status-bottleneck-route-charm"/);
  assert.match(canopy, /data-testid="status-bottleneck-safety-seal"/);
  assert.match(canopy, /aria-pressed/);
  assert.match(canopy, /useState|useReducer/);
  assert.match(canopy, /onAction\?\.\(charm\.action\)|onAction\(charm\.action\)/);
  assert.match(inspector, /data-testid="status-bottleneck-inspector"/);
  assert.match(inspector, /aria-live="polite"/);
  assert.match(inspector, /onAction\?\.\(slip\.routeAction\)|onAction\(slip\.routeAction\)/);
  assert.match(scss, /statusBottleneckTalismanCanopy/);
  assert.match(scss, /statusBottleneckTalismanCanopy__edict/);
  assert.match(scss, /statusBottleneckTalismanCanopy__slip/);
  assert.match(scss, /statusBottleneckTalismanCanopy__thread/);
  assert.match(scss, /statusBottleneckTalismanCanopy__routeCharm/);
  assert.match(scss, /statusBottleneckTalismanCanopy__safetySeal/);
  assert.match(scss, /prefers-reduced-motion/);

  assert.doesNotMatch(combined, /from ['"].*stores\//, 'S6 visual components must not import stores.');
  assert.doesNotMatch(combined, /\.getState\s*\(/, 'S6 visual components must not read stores.');
  assert.doesNotMatch(combined, /RewardService|grantRewards|spendCurrency/, 'S6 visual components must not mutate rewards.');
  assert.doesNotMatch(combined, /CombatStore|useCombatStore|resolveCombat/i, 'S6 visual components must not own combat.');
  assert.doesNotMatch(combined, /PrestigeResetService|performPrestigeReset|usePrestigeStore/, 'S6 visual components must not own prestige.');
  assert.doesNotMatch(combined, /breakthrough\s*\(|attemptBreakthrough|resolveBreakthrough/, 'S6 visual components must not trigger breakthrough.');
  assert.doesNotMatch(combined, /performStatusRouteTarget|openDaoHeartModal|openSpiritRootObservation/, 'S6 route UI should forward action surfaces only.');
  assert.doesNotMatch(combined, /<table|<tr|<td|role=['"]table['"]|<ul|<ol/);
  assert.doesNotMatch(combined, /StatusLedgerCard|StatusLedgerRows|StatusCurrentStatePanel/);
});

test('S6 fixtures cover blocked, healthy, post-failure, prestige, and content-cap canopy modes', () => {
  const states = new Set(STATUS_OBSERVATORY_FIXTURE_SEEDS.map((seed) => seed.visualState));

  for (const expected of ['blocked', 'healthy', 'postFailure', 'prestigePressure', 'contentCap']) {
    assert.equal(states.has(expected as never), true, `${expected} fixture seed should exist for S6 coverage.`);
  }

  for (const seed of STATUS_OBSERVATORY_FIXTURE_SEEDS) {
    assert.equal(seed.canopy.centralEdict.trim().length > 0, true, `${seed.id} should have a central edict.`);
    assert.ok(seed.canopy.talismanTitles.length >= 2, `${seed.id} should not render an empty canopy.`);
    assert.ok(seed.canopy.routeCharms.length >= 1, `${seed.id} should expose at least one route charm label.`);
    assert.equal(seed.safety.stateLabel.trim().length > 0, true, `${seed.id} should keep the safety seal visible.`);
    assert.equal(seed.safety.progressLabel.trim().length > 0, true, `${seed.id} should keep safety progress copy visible.`);
  }
});
