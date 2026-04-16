import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATE_TRIAL_SUPPORT_ART_FILES,
  listMissingGateTrialSupportArtFiles,
  resolveGateTrialSupportArt,
} from '../../src/assets/ui/chrome/gate_trial_support/index.js';

test('P6.3D gate trial support-art registry stays bounded to approved role set', () => {
  assert.deepEqual(Object.keys(GATE_TRIAL_SUPPORT_ART_FILES), [
    'checklist_minimum_plate',
    'checklist_recommended_plate',
    'readiness_band_companion',
    'readiness_band_companion_alt',
    'failsafe_frame',
    'seal_accent',
    'seal_accent_alt',
    'attempt_primary_plate',
    'attempt_secondary_plate',
    'gate_halo_base',
    'gate_halo_base_alt',
    'gate_underglow_soft',
    'readiness_glow_soft',
  ]);
});

test('P6.3D support-art registry resolves role metadata and fails gracefully when assets are absent', () => {
  const resolved = resolveGateTrialSupportArt('checklist_minimum_plate');

  assert.equal(resolved.role, 'checklist_minimum_plate');
  assert.equal(resolved.fileName, 'ui_plate_gate_trial_checklist_minimum_default_m.png');
  assert.equal(typeof resolved.available, 'boolean');
  assert.equal(resolved.assetUrl === null || typeof resolved.assetUrl === 'string', true);

  const missing = listMissingGateTrialSupportArtFiles();
  assert.equal(Array.isArray(missing), true);
  assert.equal(missing.includes('ui_plate_gate_trial_checklist_minimum_default_m.png') || resolved.available, true);
});
