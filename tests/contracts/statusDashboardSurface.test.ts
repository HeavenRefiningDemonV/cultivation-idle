import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildStatusDashboardSurface,
  type StatusDashboardSurfaceV1,
} from '../../src/systems/ui/status/statusDashboardSurface.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';

type RuntimeStatusV2Surface = {
  meta: {
    rootTestId: string;
  };
  projection: {
    projectionVersion: number;
    currentOmen: {
      title: string;
      detail: string;
      allowDirectRoute: boolean;
      route?: unknown;
    };
    proofSeals: unknown[];
    pressureBadges: unknown[];
    recentOmens: unknown[];
    reflections: unknown[];
    sourceThreads: unknown[];
  };
  hero: {
    realmName: string;
    stageText: string;
    pathLabel: string;
    heartLawLabel: string;
    spiritRootLabel: string;
    cityLabel: string;
  };
  metrics: unknown[];
  cards: {
    currentOmen: { title: string };
    gateProof: { title: string; seals: unknown[] };
    lifeIdentity: { title: string; rows: unknown[] };
    preparationHealth: { title: string; badges: unknown[] };
    currentWork: { title: string; rows: Array<{ label: string; detail: string }> };
    recentOmens: { title: string; rows: unknown[]; reflections: unknown[] };
  };
  drawers: {
    proofDetails: unknown[];
    sourceThreads: unknown[];
    reflections: unknown[];
  };
};

type SurfaceWithStatusV2 = StatusDashboardSurfaceV1 & {
  statusV2?: RuntimeStatusV2Surface;
};

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

function assertNoForbiddenStatusV2Copy(statusV2: RuntimeStatusV2Surface) {
  const text = flattenText({
    meta: statusV2.meta,
    hero: statusV2.hero,
    metrics: statusV2.metrics,
    cards: statusV2.cards,
  });
  for (const forbidden of [
    'Primary Route',
    'Best Next Action',
    'Biggest Shortfall',
    'Run Compass',
    'Guidance Oath',
    'Open Apothecary',
    'Open Forge',
    'Tune Techniques',
    'Raise Forge Floor',
    'Cultivate Qi',
    'Mandate points elsewhere',
  ]) {
    assert.equal(
      text.some((entry) => entry.includes(forbidden)),
      false,
      `Status V2 surface must not expose forbidden copy: ${forbidden}`,
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

test('status dashboard surface includes Status V2 projection, cards, and bounded first-layer rows', () => {
  const surface = buildStatusDashboardSurface() as SurfaceWithStatusV2;
  const statusV2 = surface.statusV2;

  assert.ok(surface.statusLedger, 'buildStatusDashboardSurface should expose Packet B Status Ledger data.');
  assert.equal(surface.statusLedger.meta.rootTestId, 'status-ledger');
  assert.ok(statusV2, 'buildStatusDashboardSurface should expose a Status V2 section.');
  assert.equal(statusV2.meta.rootTestId, 'status-v2-root');
  assert.equal(statusV2.projection.projectionVersion, 1);
  assert.ok(statusV2.projection.currentOmen.title.length > 0);
  assert.ok(statusV2.projection.currentOmen.detail.length <= 160);
  assert.equal(statusV2.projection.proofSeals.length <= 4, true);
  assert.equal(statusV2.projection.pressureBadges.length <= 4, true);
  assert.equal(statusV2.projection.recentOmens.length <= 3, true);

  assert.ok(statusV2.hero.realmName.length > 0);
  assert.ok(statusV2.hero.stageText.length > 0);
  assert.ok(statusV2.hero.pathLabel.length > 0);
  assert.ok(statusV2.hero.heartLawLabel.length > 0);
  assert.ok(statusV2.hero.spiritRootLabel.length > 0);
  assert.ok(statusV2.hero.cityLabel.length > 0);
  assert.ok(statusV2.metrics.length >= 4);

  assert.ok(statusV2.cards.currentOmen.title.length > 0);
  assert.ok(statusV2.cards.gateProof.title.length > 0);
  assert.ok(statusV2.cards.lifeIdentity.title.length > 0);
  assert.ok(statusV2.cards.preparationHealth.title.length > 0);
  assert.ok(statusV2.cards.currentWork.title.length > 0);
  assert.ok(statusV2.cards.recentOmens.title.length > 0);
  assert.equal(statusV2.cards.gateProof.seals.length <= 4, true);
  assert.equal(statusV2.cards.preparationHealth.badges.length <= 4, true);
  assert.equal(statusV2.cards.lifeIdentity.rows.length <= 6, true);
  assert.equal(statusV2.cards.currentWork.rows.length <= 4, true);
  assert.equal(statusV2.cards.recentOmens.rows.length <= 3, true);

  assert.deepEqual(statusV2.drawers.proofDetails, statusV2.projection.proofSeals);
  assert.deepEqual(statusV2.drawers.sourceThreads, statusV2.projection.sourceThreads);
  assert.deepEqual(statusV2.drawers.reflections, statusV2.projection.reflections);

  if (!statusV2.projection.currentOmen.allowDirectRoute) {
    assert.equal(statusV2.projection.currentOmen.route, undefined);
  }

  assertNoForbiddenStatusV2Copy(statusV2);
});

test('status dashboard surface reads trial progress without creating store entries', () => {
  useTrialStore.getState().hardResetTrials();
  assert.deepEqual(useTrialStore.getState().progressByTrialId, {});

  buildStatusDashboardSurface();

  assert.deepEqual(
    useTrialStore.getState().progressByTrialId,
    {},
    'Status display builders should not initialize TrialStore progress during render.',
  );
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
