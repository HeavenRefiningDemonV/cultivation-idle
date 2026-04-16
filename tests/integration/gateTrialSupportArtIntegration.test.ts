import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3D world-facing Gate Trial mounts additive support-kit surfaces while preserving DOM truth owners', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');

  assert.match(panel, /resolveGateTrialSupportArt\('checklist_minimum_plate'\)/);
  assert.match(panel, /resolveGateTrialSupportArt\('readiness_band_companion'\)/);
  assert.match(panel, /resolveGateTrialSupportArt\('failsafe_frame'\)/);
  assert.match(panel, /resolveGateTrialSupportArt\('attempt_primary_plate'\)/);
  assert.match(panel, /resolveGateTrialSupportArt\('gate_halo_base'\)/);

  assert.match(panel, /GateTrialReadinessCard/);
  assert.match(panel, /GateTrialChecklist/);
  assert.match(panel, /GateTrialSafetyNetCard/);
  assert.match(panel, /GateTrialTopFixes/);
  assert.match(panel, /GateTrialAttemptCluster/);
});

test('P6.3D support-kit wiring remains fallback-safe and does not require assets for coherence', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');
  const registry = read('src/assets/ui/chrome/gate_trial_support/index.ts');

  assert.match(panel, /listMissingGateTrialSupportArtFiles\(\)/);
  assert.match(panel, /assetUrl/);
  assert.match(registry, /assetUrl: string \| null/);
  assert.match(registry, /available: boolean/);
  assert.match(registry, /\?\? null/);
});
