import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildStatusDashboardSurface,
  type StatusDashboardSurfaceV1,
} from '../../src/systems/ui/status/statusDashboardSurface.js';
import { useActivityStore } from '../../src/stores/activityStore.js';

const FORBIDDEN_FILLER = [
  'Waiting',
  'Stay the course',
  'No additional action needed right now.',
  'No stronger corrective route is surfaced right now.',
  'Reason 1',
  'Reason 2',
];

function flattenText(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((entry) => flattenText(entry));
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((entry) => flattenText(entry));
  }
  return [];
}

function assertNoFiller(surface: StatusDashboardSurfaceV1) {
  const text = flattenText(surface);
  for (const forbidden of FORBIDDEN_FILLER) {
    assert.equal(
      text.some((entry) => entry.includes(forbidden)),
      false,
      `status dashboard surface must not expose filler copy: ${forbidden}`,
    );
  }
}

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('status dashboard surface exposes live current work and no filler rows', () => {
  useActivityStore.getState().hardResetActivity();
  const idleSurface = buildStatusDashboardSurface();

  assert.equal(idleSurface.meta.rootTestId, 'status-dashboard');
  assert.equal(idleSurface.meta.mode, 'live');
  assert.ok(idleSurface.currentWork.foregroundActivity.label.length > 0);
  assertNoFiller(idleSurface);

  useActivityStore.getState().startActivity('trial', { cityId: 'city_test', sourceId: 'trial_test' }, 'surface-test');
  const trialSurface = buildStatusDashboardSurface();

  assert.equal(trialSurface.currentWork.foregroundActivity.label, 'Gate Trial');
  assert.match(trialSurface.currentWork.foregroundActivity.detail, /trial/i);
  assertNoFiller(trialSurface);

  useActivityStore.getState().hardResetActivity();
});

test('status dashboard milestone and requirement rows are typed, routeable, and not mockup rails', () => {
  const surface = buildStatusDashboardSurface();
  const railLabels = surface.milestone.nodes.map((node) => node.label);

  assert.notDeepEqual(railLabels, [
    'Current Gate Trial',
    'Foundation Establishment',
    'Path Expansion',
    "Novice's Peak",
  ]);
  assert.ok(surface.milestone.nodes.length >= 2);
  assert.ok(surface.milestone.nodes.every((node) => node.id && node.icon && node.state));

  for (const row of surface.requirements.rows) {
    assert.ok(row.kind);
    assert.ok(row.icon);
    if (row.tone !== 'success') {
      assert.ok(
        row.action || row.disabledReason,
        `requirement ${row.id} needs a route action or disabled reason`,
      );
    }
  }

  assertNoFiller(surface);
});

test('status dashboard uses row-owned requirement actions and typed icons in the Status screen', () => {
  const file = read('src/components/screens/StatusScreen.tsx');

  assert.doesNotMatch(file, /requirementIcon\(index\)/);
  assert.doesNotMatch(file, /bestNextActions\[index\]/);
  assert.doesNotMatch(file, /Reason \$\{index \+ 1\}/);
  assert.doesNotMatch(file, /Current Gate Trial', 'Foundation Establishment', 'Path Expansion'/);
});

test('bottom nav promotes ink plaque as the global nav variant while preserving aria-current navigation semantics', () => {
  const bottomTabBar = read('src/components/BottomTabBar.tsx');
  const bottomNavDock = read('src/ui/shell/BottomNavDock.tsx');
  const bottomNavScss = read('src/ui/shell/BottomNavDock.scss');
  const gameLayout = read('src/components/GameLayout.tsx');

  assert.match(bottomTabBar, /bottomNavDock--inkPlaque/);
  assert.doesNotMatch(bottomTabBar, /activeTab === 'status'\s*\?/);
  assert.match(bottomNavDock, /<nav/);
  assert.match(bottomNavDock, /aria-label="Primary navigation"/);
  assert.match(bottomNavDock, /aria-current=\{item\.active \? 'page' : undefined\}/);
  assert.match(bottomNavScss, /\.bottomNavDock--inkPlaque/);
  assert.doesNotMatch(gameLayout, /!suppressPavilionChrome && <BottomTabBar/);
});
