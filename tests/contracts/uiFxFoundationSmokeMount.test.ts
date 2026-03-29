import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  buildFxFoundationDiagnostics,
  readFxFoundationRuntimeSnapshot,
} from '../../src/ui/fx/diagnostics/index.js';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

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
      void selector;
      return null;
    },
  };
}

void test('fx foundation smoke mount: provider bridge source preserves provider mount contract', () => {
  const source = read('src/app/fx/AppFxProviderBridge.tsx');
  assert.match(source, /FxQualityProvider/);
  assert.match(source, /useUiFxSettings/);
  assert.match(source, /<FxQualityProvider \{\.\.\.providerProps\}>\{children\}<\/FxQualityProvider>/);
});

void test('fx foundation smoke mount: static path diagnostics are sane for primitive mount markers', () => {
  const markup = '<div data-fx-stage-kind="local" data-fx-mount-kind="ambient-underlay" data-fx-mount-mode="static"></div>';
  const snapshot = readFxFoundationRuntimeSnapshot(createSnapshotRoot(markup) as unknown as ParentNode);
  const diagnostics = buildFxFoundationDiagnostics({
    quality: {
      requestedQuality: 'low',
      resolvedQuality: 'low',
      renderMode: 'static',
      reducedMotion: false,
      allowAtmosphere: true,
      allowHeroFx: true,
      allowContinuousAtmosphere: false,
      allowAnimatedHeroFx: false,
      devicePixelRatioCap: 1,
      reasons: ['low-quality-static'],
    },
    runtimeSnapshot: snapshot,
  });

  assert.equal(snapshot.localStageCount, 1);
  assert.equal(snapshot.staticFallbackCount, 1);
  assert.equal(diagnostics.fallbackMode, 'static');
});

void test('fx foundation smoke mount: off path diagnostics are sane for off mount markers', () => {
  const markup = '<div data-fx-mount-kind="ambient-underlay" data-fx-mount-mode="off"></div>';
  const snapshot = readFxFoundationRuntimeSnapshot(createSnapshotRoot(markup) as unknown as ParentNode);
  const diagnostics = buildFxFoundationDiagnostics({
    quality: {
      requestedQuality: 'high',
      resolvedQuality: 'off',
      renderMode: 'off',
      reducedMotion: false,
      allowAtmosphere: true,
      allowHeroFx: true,
      allowContinuousAtmosphere: false,
      allowAnimatedHeroFx: false,
      devicePixelRatioCap: 1,
      reasons: ['disabled'],
    },
    runtimeSnapshot: snapshot,
  });

  assert.equal(snapshot.offMountCount, 1);
  assert.equal(diagnostics.fallbackMode, 'off');
});

void test('fx foundation smoke mount: status pilot reference safety remains source-bounded', () => {
  const statusSource = read('src/components/screens/StatusScreen.tsx');
  const pilotSpecExists = fs.existsSync(path.join(root, 'src/ui/fx/pixi/scenes/statusPilotSpec.ts'));

  if (pilotSpecExists) {
    assert.match(statusSource, /AmbientUnderlayMount/);
    assert.match(statusSource, /statusPilotSpec|StatusPilotAmbientScene/);
  } else {
    assert.doesNotMatch(statusSource, /src\/ui\/fx\/diagnostics/);
  }
});
