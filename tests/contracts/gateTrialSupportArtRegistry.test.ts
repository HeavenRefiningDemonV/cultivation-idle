import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATE_TRIAL_SUPPORT_ART_FILES,
  GATE_TRIAL_SUPPORT_ART_FALLBACK_FILES,
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

test('P6.3D support-art registry resolves role metadata with authored fallback support assets', () => {
  const resolved = resolveGateTrialSupportArt('checklist_minimum_plate');

  assert.equal(resolved.role, 'checklist_minimum_plate');
  assert.equal(resolved.fileName, 'ui_plate_gate_trial_checklist_minimum_default_m.png');
  assert.equal(typeof resolved.assetUrl, 'string');
  assert.equal(resolved.available, true);
  assert.equal(GATE_TRIAL_SUPPORT_ART_FALLBACK_FILES.checklist_minimum_plate, 'ui_plate_gate_trial_checklist_minimum_default_m.svg');

  const missing = listMissingGateTrialSupportArtFiles();
  assert.equal(Array.isArray(missing), true);
  assert.equal(missing.includes('ui_plate_gate_trial_checklist_minimum_default_m.png'), true);
});

test('P6.3D halo and underglow roles still fail gracefully when no generated PNG is present', () => {
  const halo = resolveGateTrialSupportArt('gate_halo_base');
  const underglow = resolveGateTrialSupportArt('gate_underglow_soft');

  assert.equal(halo.assetUrl === null || typeof halo.assetUrl === 'string', true);
  assert.equal(underglow.assetUrl === null || typeof underglow.assetUrl === 'string', true);
});
