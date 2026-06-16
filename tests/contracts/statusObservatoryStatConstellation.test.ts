import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import {
  STATUS_OBSERVATORY_STAT_BRANCH_PATHS,
  STATUS_OBSERVATORY_STAT_BRIDGE_GEOMETRY,
  STATUS_OBSERVATORY_STAT_CONTRIBUTION_LABELS,
  STATUS_OBSERVATORY_STAT_LENS_STATE_LABELS,
  STATUS_OBSERVATORY_STAT_NODE_GEOMETRY,
  STATUS_OBSERVATORY_STAT_NODE_STATE_LABELS,
  STATUS_OBSERVATORY_STAT_PATH_LABELS,
} from '../../src/systems/ui/status/statusObservatoryPresentation.js';
import { buildStatusObservatorySurface } from '../../src/systems/ui/status/statusObservatorySurface.js';
import { primeStatusObservatoryScenario } from './statusObservatoryTestUtils.js';

function read(relPath: string): string {
  return readFileSync(path.resolve(relPath), 'utf8');
}

test('Status Ledger and Observatory expose all 28 named stats as constellation nodes', async () => {
  const content = await primeStatusObservatoryScenario();
  const expectedIds = content.cultivator_stats.stats.map((stat) => stat.id).sort();
  const ledger = buildStatusDashboardSurface(9753).statusLedger;
  const surface = buildStatusObservatorySurface(ledger);

  assert.equal(ledger.namedStats.allStats.length, 28);
  assert.equal(surface.statConstellation.nodes.length, 28);
  assert.equal(ledger.namedStats.universal.length, 8);
  assert.equal(ledger.namedStats.heaven.length, 7);
  assert.equal(ledger.namedStats.earth.length, 6);
  assert.equal(ledger.namedStats.martial.length, 7);
  assert.deepEqual(surface.statConstellation.branchCounts, {
    universal: 8,
    heaven: 7,
    earth: 6,
    martial: 7,
  });
  assert.deepEqual(surface.statConstellation.nodes.map((node) => node.id).sort(), expectedIds);
  assert.equal(new Set(surface.statConstellation.nodes.map((node) => node.id)).size, 28);
  assert.equal(surface.statConstellation.selectedLensDefaultStatId === null, false);
  assert.ok(
    surface.statConstellation.selectedLensDefaultStatId &&
      expectedIds.includes(surface.statConstellation.selectedLensDefaultStatId),
    'selected lens stat should point at one of the 28 content stats.',
  );
});

test('Status Observatory classifies lit, off-path, and future stat nodes without failure language', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(8642).statusLedger;
  const surface = buildStatusObservatorySurface(ledger);
  const nodes = new Map(surface.statConstellation.nodes.map((node) => [node.id, node]));

  assert.equal(nodes.get('qi_control')?.path, 'heaven');
  assert.equal(nodes.get('qi_control')?.nodeState, 'lit');
  assert.equal(nodes.get('qi_control')?.unlockState, 'unlocked');
  assert.equal(nodes.get('dao_resonance')?.nodeState, 'lit');
  assert.equal(nodes.get('dao_resonance')?.unlockState, 'unlocked');

  const futureCurrentPath = nodes.get('star_rhythm');
  assert.ok(futureCurrentPath, 'future current-path node should exist.');
  assert.equal(futureCurrentPath.path, 'heaven');
  assert.equal(futureCurrentPath.nodeState, 'unlit_socket');
  assert.equal(futureCurrentPath.unlockState, 'future_current_path');
  assert.notEqual(futureCurrentPath.tone, 'danger');
  assert.doesNotMatch(
    `${futureCurrentPath.label} ${futureCurrentPath.detail} ${futureCurrentPath.lockedReason ?? ''}`,
    /\bred\b|\bfail|\bfailure/i,
  );

  const offPath = nodes.get('weapon_intent');
  assert.ok(offPath, 'off-path node should remain visible.');
  assert.equal(offPath.path, 'martial');
  assert.equal(offPath.visible, true);
  assert.equal(offPath.nodeState, 'lifeless');
  assert.equal(offPath.unlockState, 'off_path_unlocked');
  assert.equal(offPath.contributionState, 'off_path');
  assert.notEqual(offPath.tone, 'danger');

  for (const node of surface.statConstellation.nodes) {
    assert.equal(node.displayName.trim().length > 0, true, `${node.id} displayName should be non-empty.`);
    assert.equal(node.shortLabel.trim().length > 0, true, `${node.id} shortLabel should be non-empty.`);
    assert.equal(node.effectSummary.trim().length > 0, true, `${node.id} effectSummary should be non-empty.`);
    assert.match(node.branchId, /^(universal|heaven|earth|martial)$/);
    assert.match(node.nodeState, /^(lit|foundation|lifeless|unlit_socket|future|inactive)$/);
  }

  assert.ok(
    surface.statConstellation.nodes.filter((node) => node.weakLink).length >= 1,
    'At least one deterministic weak link should be selected.',
  );
  assert.equal(Array.isArray(surface.statConstellation.bridgeSockets), true);
});

test('S3 geometry constants cover all 28 content stats exactly once', async () => {
  const content = await primeStatusObservatoryScenario();
  const expectedIds = content.cultivator_stats.stats.map((stat) => stat.id).sort();
  const geometryIds = Object.keys(STATUS_OBSERVATORY_STAT_NODE_GEOMETRY).sort();
  const contentPathById = new Map(content.cultivator_stats.stats.map((stat) => [stat.id, stat.path]));

  assert.deepEqual(geometryIds, expectedIds);
  assert.equal(geometryIds.length, 28);

  const counts = { universal: 0, heaven: 0, earth: 0, martial: 0 };
  for (const [id, geometry] of Object.entries(STATUS_OBSERVATORY_STAT_NODE_GEOMETRY)) {
    assert.equal(geometry.id, id);
    assert.equal(Number.isFinite(geometry.x), true, `${id} x should be finite`);
    assert.equal(Number.isFinite(geometry.y), true, `${id} y should be finite`);
    assert.ok(geometry.x >= 0 && geometry.x <= 100, `${id} x should stay inside the fixed viewBox`);
    assert.ok(geometry.y >= 0 && geometry.y <= 100, `${id} y should stay inside the fixed viewBox`);
    assert.equal(geometry.branch, contentPathById.get(id), `${id} geometry branch should match content path`);
    counts[geometry.branch] += 1;
  }

  assert.deepEqual(counts, {
    universal: 8,
    heaven: 7,
    earth: 6,
    martial: 7,
  });
});

test('S3 presentation constants preserve branch silhouettes and state language', () => {
  assert.deepEqual(Object.keys(STATUS_OBSERVATORY_STAT_BRANCH_PATHS).sort(), [
    'earth',
    'heaven',
    'martial',
    'universal',
  ]);

  assert.match(STATUS_OBSERVATORY_STAT_BRANCH_PATHS.universal, /^M50 5 C50/);
  assert.match(STATUS_OBSERVATORY_STAT_BRANCH_PATHS.heaven, /^M50 28 C43/);
  assert.match(STATUS_OBSERVATORY_STAT_BRANCH_PATHS.earth, /^M50 62 C42/);
  assert.match(STATUS_OBSERVATORY_STAT_BRANCH_PATHS.martial, /^M58 38 C64/);

  assert.match(STATUS_OBSERVATORY_STAT_PATH_LABELS.universal.detail, /Shared Foundation/);
  assert.match(STATUS_OBSERVATORY_STAT_PATH_LABELS.heaven.detail, /High Sky/);
  assert.match(STATUS_OBSERVATORY_STAT_PATH_LABELS.earth.detail, /Root/);
  assert.match(STATUS_OBSERVATORY_STAT_PATH_LABELS.martial.detail, /Blade/);

  assert.match(STATUS_OBSERVATORY_STAT_NODE_STATE_LABELS.lifeless.label, /Grey \/ Lifeless/);
  assert.match(STATUS_OBSERVATORY_STAT_NODE_STATE_LABELS.unlit_socket.detail, /not a failure/i);
  assert.match(STATUS_OBSERVATORY_STAT_LENS_STATE_LABELS.lit, /Current Path/);
  assert.match(STATUS_OBSERVATORY_STAT_CONTRIBUTION_LABELS.off_path, /dormant/i);

  const bridgeDetails = Object.values(STATUS_OBSERVATORY_STAT_BRIDGE_GEOMETRY)
    .map((socket) => `${socket.label} ${socket.detail}`)
    .join(' ');
  assert.match(bridgeDetails, /Dormant dual-path possibility/i);
  assert.match(bridgeDetails, /not active content/i);
});

test('S3 renderer is an SVG constellation and not a row/table/card relapse', () => {
  const renderer = read('src/ui/status/observatory/StatusStatMeridianConstellation.tsx');
  const lens = read('src/ui/status/observatory/StatusStatBeadLens.tsx');
  const shell = read('src/ui/status/observatory/StatusLivingStateObservatory.tsx');
  const publicPage = read('src/ui/status/ledger/StatusLedgerPage.tsx');

  assert.match(renderer, /<svg/);
  assert.match(renderer, /viewBox="0 0 100 100"/);
  assert.match(renderer, /StatusStatBeadLens/);
  assert.match(renderer, /data-s3-instrument="stat-meridian-constellation"/);
  assert.match(renderer, /data-stat-id/);
  assert.match(renderer, /data-node-state/);
  assert.match(renderer, /data-branch-id/);
  assert.match(renderer, /data-contribution-state/);
  assert.match(renderer, /data-weak-link/);
  assert.match(renderer, /data-bridge-socket-id/);
  assert.match(renderer, /statusStatConstellation__weakThread/);
  assert.match(renderer, /onFocus/);
  assert.match(renderer, /onClick/);

  assert.match(lens, /data-testid="status-stat-bead-lens"/);
  assert.match(lens, /onAction\(action\)/);
  assert.match(lens, /Why it matters now/);
  assert.match(lens, /Current Value/);

  assert.match(shell, /StatusStatMeridianConstellation/);
  assert.doesNotMatch(shell, /function StatConstellation/);
  assert.doesNotMatch(shell, /statusConstellation__branch/);
  assert.doesNotMatch(shell, /branch summary/i);
  assert.match(shell, /STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED = true/);
  assert.match(publicPage, /StatusLivingStateObservatory/);
  assert.match(publicPage, /buildStatusObservatorySurface/);
  assert.match(publicPage, /StatusLegacyLedgerPage|StatusLedgerFallbackPage/);

  for (const source of [renderer, lens]) {
    assert.doesNotMatch(source, /<table|<tr|role=['"]table['"]|<ul|<ol/);
    assert.doesNotMatch(source, /statusConstellation__branch|statusConstellation__map/);
    assert.doesNotMatch(source, /from ['"].*stores\//);
    assert.doesNotMatch(source, /useGameStore|useCombatStore|usePrestigeStore|zustand/);
    assert.doesNotMatch(source, /RewardService|grantRewards|CombatStore|PrestigeResetService/);
  }
});

test('S3 surface exposes weak-link, bridge-socket, and no-hidden-state language to the renderer', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(6420).statusLedger;
  const surface = buildStatusObservatorySurface(ledger).statConstellation;
  const nodeStates = new Set(surface.nodes.map((node) => node.nodeState));
  const legendText = surface.legend.map((entry) => `${entry.label} ${entry.detail}`).join(' ');

  assert.equal(surface.nodes.length, 28);
  assert.equal(surface.nodes.every((node) => node.visible), true);
  assert.equal(nodeStates.has('foundation'), true);
  assert.equal(nodeStates.has('lit'), true);
  assert.equal(nodeStates.has('lifeless'), true);
  assert.equal(nodeStates.has('unlit_socket') || nodeStates.has('future'), true);
  assert.ok(surface.weakLinks.length >= 1, 'fixture should expose at least one weak-link bead');
  assert.ok(surface.bridgeSockets.length >= 1, 'fixture should expose bridge socket source language');
  assert.match(legendText, /Grey \/ lifeless/);
  assert.match(legendText, /Unlit socket/);
  assert.match(legendText, /not a failure/i);
  assert.match(legendText, /Bridge socket/);
  assert.match(legendText, /Dormant dual-path possibility/);
});
