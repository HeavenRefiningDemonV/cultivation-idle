import assert from 'node:assert/strict';
import test from 'node:test';
import { runLiveSurfaceVisualAudit } from '../../../src/services/diagnostics/release/liveSurfaceVisualAudit.js';
import { LIVE_SURFACE_VISUAL_MANIFEST } from '../../../src/services/diagnostics/release/liveSurfaceVisualManifest.js';

void test('live surface visual audit is stable and passes for tracked semester surfaces', () => {
  const report = runLiveSurfaceVisualAudit();

  assert.equal(report.schemaVersion, '7.5d-live-surface-visual-audit');
  assert.equal(report.overallPass, true);
  assert.deepEqual(report.findings, []);

  assert.equal(report.trackedStyleFiles.length, LIVE_SURFACE_VISUAL_MANIFEST.trackedStyleFiles.length);
  assert.equal(report.trackedIconFiles.length, LIVE_SURFACE_VISUAL_MANIFEST.trackedIconFiles.length);
  assert.equal(report.trackedSurfaces.length > 0, true);
});
