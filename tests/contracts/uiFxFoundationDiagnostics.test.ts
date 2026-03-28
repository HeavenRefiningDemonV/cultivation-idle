import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildFxFoundationDiagnostics,
  readFxFoundationRuntimeSnapshot,
} from '../../src/ui/fx/diagnostics/index.js';
import type { FxQualityContract } from '../../src/ui/fx/fxQualityContract.js';
import type { FxFoundationRuntimeSnapshot } from '../../src/ui/fx/diagnostics/types.js';

function buildQuality(partial: Partial<FxQualityContract>): FxQualityContract {
  return {
    requestedQuality: 'auto',
    resolvedQuality: 'off',
    renderMode: 'off',
    reducedMotion: false,
    allowAtmosphere: true,
    allowHeroFx: true,
    allowContinuousAtmosphere: false,
    allowAnimatedHeroFx: false,
    devicePixelRatioCap: 1.5,
    reasons: [],
    ...partial,
  };
}

function buildSnapshot(partial: Partial<FxFoundationRuntimeSnapshot>): FxFoundationRuntimeSnapshot {
  return {
    localStageCount: 0,
    globalStageCount: 0,
    ambientMountCount: 0,
    heroMountCount: 0,
    animatedMountCount: 0,
    staticFallbackCount: 0,
    offMountCount: 0,
    portalRootPresent: false,
    ...partial,
  };
}

function createSnapshotRoot(markup: string) {
  const count = (needle: string) => (markup.match(new RegExp(needle, 'g')) ?? []).length;
  return {
    querySelectorAll: (selector: string) => {
      const map: Record<string, string> = {
        '[data-fx-stage-kind="local"]': 'data-fx-stage-kind="local"',
        '[data-fx-stage-kind="global"]': 'data-fx-stage-kind="global"',
        '[data-fx-mount-kind="ambient-underlay"]': 'data-fx-mount-kind="ambient-underlay"',
        '[data-fx-mount-kind="hero-slot"]': 'data-fx-mount-kind="hero-slot"',
        '[data-fx-mount-mode="animated"]': 'data-fx-mount-mode="animated"',
        '[data-fx-mount-mode="static"]': 'data-fx-mount-mode="static"',
        '[data-fx-mount-mode="off"]': 'data-fx-mount-mode="off"',
      };
      return new Array(count(map[selector] ?? '__none__'));
    },
    querySelector: (selector: string) => {
      if (selector === '#cultivation-idle-fx-portal-root' && markup.includes('id="cultivation-idle-fx-portal-root"')) {
        return {} as Element;
      }
      return null;
    },
  };
}

void test('fx foundation diagnostics: zero snapshot and off quality resolves off fallback and zero active scenes', () => {
  const diagnostics = buildFxFoundationDiagnostics({
    quality: buildQuality({ resolvedQuality: 'off', renderMode: 'off' }),
    runtimeSnapshot: buildSnapshot({}),
  });

  assert.equal(diagnostics.activeSceneCount, 0);
  assert.equal(diagnostics.fallbackMode, 'off');
});

void test('fx foundation diagnostics: static-only snapshot resolves static fallback', () => {
  const diagnostics = buildFxFoundationDiagnostics({
    quality: buildQuality({ resolvedQuality: 'low', renderMode: 'static' }),
    runtimeSnapshot: buildSnapshot({ staticFallbackCount: 2 }),
  });

  assert.equal(diagnostics.fallbackMode, 'static');
  assert.equal(diagnostics.activeSceneCount, 2);
});

void test('fx foundation diagnostics: animated-only snapshot resolves none fallback', () => {
  const diagnostics = buildFxFoundationDiagnostics({
    quality: buildQuality({ resolvedQuality: 'medium', renderMode: 'full', allowAnimatedHeroFx: true }),
    runtimeSnapshot: buildSnapshot({ animatedMountCount: 2 }),
  });

  assert.equal(diagnostics.fallbackMode, 'none');
});

void test('fx foundation diagnostics: mixed snapshot resolves mixed fallback warning', () => {
  const diagnostics = buildFxFoundationDiagnostics({
    quality: buildQuality({ resolvedQuality: 'medium', renderMode: 'full', allowAnimatedHeroFx: true }),
    runtimeSnapshot: buildSnapshot({ animatedMountCount: 1, staticFallbackCount: 1 }),
  });

  assert.equal(diagnostics.fallbackMode, 'mixed');
  assert.equal(diagnostics.warnings.includes('mixed-fallback-state'), true);
});

void test('fx foundation diagnostics: reduced motion clamped quality sets reducedMotionClampActive', () => {
  const diagnostics = buildFxFoundationDiagnostics({
    quality: buildQuality({
      resolvedQuality: 'low',
      renderMode: 'static',
      reducedMotion: true,
      allowContinuousAtmosphere: false,
      allowAnimatedHeroFx: false,
    }),
    runtimeSnapshot: buildSnapshot({ staticFallbackCount: 1 }),
  });

  assert.equal(diagnostics.reducedMotionClampActive, true);
});

void test('fx foundation diagnostics: orphaned portal root warning works', () => {
  const diagnostics = buildFxFoundationDiagnostics({
    quality: buildQuality({ resolvedQuality: 'off', renderMode: 'off' }),
    runtimeSnapshot: buildSnapshot({ portalRootPresent: true, globalStageCount: 0 }),
  });

  assert.equal(diagnostics.warnings.includes('orphaned-global-portal-root'), true);
});

void test('fx foundation diagnostics: animated mounts while off warning works', () => {
  const diagnostics = buildFxFoundationDiagnostics({
    quality: buildQuality({ resolvedQuality: 'off', renderMode: 'off' }),
    runtimeSnapshot: buildSnapshot({ animatedMountCount: 1 }),
  });

  assert.equal(diagnostics.warnings.includes('animated-mounts-while-off'), true);
});

void test('fx foundation diagnostics: multiple hero mounts warning works', () => {
  const diagnostics = buildFxFoundationDiagnostics({
    quality: buildQuality({ resolvedQuality: 'high', renderMode: 'full', allowAnimatedHeroFx: true }),
    runtimeSnapshot: buildSnapshot({ heroMountCount: 2, animatedMountCount: 2 }),
  });

  assert.equal(diagnostics.warnings.includes('multiple-hero-mounts'), true);
});

void test('fx foundation diagnostics: high scene count warning works', () => {
  const diagnostics = buildFxFoundationDiagnostics({
    quality: buildQuality({ resolvedQuality: 'high', renderMode: 'full', allowAnimatedHeroFx: true }),
    runtimeSnapshot: buildSnapshot({ animatedMountCount: 3, staticFallbackCount: 1 }),
  });

  assert.equal(diagnostics.warnings.includes('high-foundation-scene-count'), true);
});

void test('fx foundation diagnostics: dom snapshot reader counts stage and mount markers', () => {
  const markup = [
    '<div data-fx-stage-kind="local" data-fx-mount-kind="ambient-underlay" data-fx-mount-mode="animated"></div>',
    '<div data-fx-stage-kind="global" data-fx-mount-kind="hero-slot" data-fx-mount-mode="static"></div>',
    '<div data-fx-mount-kind="ambient-underlay" data-fx-mount-mode="off"></div>',
    '<div id="cultivation-idle-fx-portal-root"></div>',
  ].join('');

  const snapshot = readFxFoundationRuntimeSnapshot(createSnapshotRoot(markup) as unknown as ParentNode);
  assert.equal(snapshot.localStageCount, 1);
  assert.equal(snapshot.globalStageCount, 1);
  assert.equal(snapshot.ambientMountCount, 2);
  assert.equal(snapshot.heroMountCount, 1);
  assert.equal(snapshot.animatedMountCount, 1);
  assert.equal(snapshot.staticFallbackCount, 1);
  assert.equal(snapshot.offMountCount, 1);
  assert.equal(snapshot.portalRootPresent, true);
});
