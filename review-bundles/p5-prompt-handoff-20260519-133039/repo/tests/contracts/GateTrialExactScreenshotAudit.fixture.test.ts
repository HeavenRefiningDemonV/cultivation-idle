import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

void test('Gate Trial Exact G11 package scripts exist without removing existing capture scripts', () => {
  const packageJson = readFileSync('package.json', 'utf8');

  for (const required of [
    'release:gate-trial-exact-p0:capture',
    'release:gate-trial-exact-p0:audit',
    'release:gate-trial-exact-p0:report',
    'release:gate-trial-exact-p0:report:json',
    'release:outskirts-exact-p0:capture',
    'release:ruins-exact-p0:capture',
    'release:phase6-combat-capture',
    'release:phase6-combat-evidence-audit',
  ]) {
    assert.equal(packageJson.includes(required), true, `missing package script ${required}`);
  }
});

void test('Gate Trial Exact G11 capture wrapper uses existing Phase 6 capture', () => {
  const source = readFileSync('scripts/release/runGateTrialExactP0Capture.ts', 'utf8');

  for (const required of [
    'gate-trial-exact-p0-capture-attempt.v1',
    'release:phase6-combat-capture',
    '--surface=gate-trial',
    '--gate-trial-exact-mode=fixture',
    '--width=2048',
    '--height=1152',
    'gateTrialExactP0CaptureAttempt.json',
  ]) {
    assert.equal(source.includes(required), true, `missing capture wrapper token ${required}`);
  }
});

void test('Gate Trial Exact G11 Phase 6 capture supports exact mode and DOM audit', () => {
  const source = readFileSync('scripts/release/capturePhase6CombatEvidence.ts', 'utf8');

  for (const required of [
    'gateTrialExactMode',
    '--gate-trial-exact-mode=',
    'gate-trial-exact-dom-audit.v1',
    'gate-trial-exact-page',
    'gate-trial-scenic-stage',
    'gate-trial-primary-cta',
    'forbiddenOldShellMarkers',
    'forbiddenCrossSurfaceMarkers',
    'data-art-status',
    'data-final-art-required',
    'data-approved-plate-bound',
    'data-strict-visual-parity-blocked',
    'strictVisualParityBlocked',
    'ctaWithinViewport',
    'noVerticalPageScroll',
    'centerDominatesWidth',
  ]) {
    assert.equal(source.includes(required), true, `missing capture audit token ${required}`);
  }
});

void test('Gate Trial Exact G11 Phase 6 audit validates exact evidence', () => {
  const source = readFileSync('scripts/release/validatePhase6CombatEvidence.ts', 'utf8');

  for (const required of [
    'validateGateTrialDomAudit',
    'gate_trial_dom_audit_missing',
    'gate_trial_region_missing',
    'gate_trial_text_marker_missing',
    'gate_trial_geometry_invalid',
    'gate_trial_old_shell_marker',
    'gate_trial_cross_surface_marker',
    'gate_trial_final_art_deferred',
    'gate-trial',
  ]) {
    assert.equal(source.includes(required), true, `missing evidence audit token ${required}`);
  }
});

void test('Gate Trial Exact G11 harness can prime fixture and live audit states', () => {
  const source = readFileSync('src/dev/phase6CombatAudit/Phase6CombatAuditHarness.tsx', 'utf8');

  for (const required of [
    'parseGateTrialExactModeFromQuery',
    'GateTrialExactMode',
    'gateTrialExactMode',
    'gateTrialExactMode: gateTrialExactMode',
    'primeGateTrialFailureState',
    'primeGateTrial',
    "surface === 'gate-trial'",
  ]) {
    assert.equal(source.includes(required), true, `missing harness token ${required}`);
  }
});

void test('Gate Trial Exact G11 manifest and docs exist', () => {
  const manifest = readFileSync('src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.ts', 'utf8');

  for (const required of [
    "id: 'gate-trial'",
    'Gate Trial Exact',
    'fixture planning state',
    'live active attempt',
    'defeat/fail-safe/result truth',
  ]) {
    assert.equal(manifest.includes(required), true, `missing manifest token ${required}`);
  }

  for (const requiredPath of [
    'docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial/README.md',
    'docs/release/qa/ui-cutover/gate-trial-exact/p0-freeze/README.md',
    'docs/release/qa/ui-cutover/gate-trial-exact/p0-freeze/gateTrialExactVisualAuditChecklist.md',
    'docs/release/qa/ui-cutover/gate-trial-exact/p0-freeze/gateTrialExactRegionMap.json',
  ]) {
    assert.equal(existsSync(requiredPath), true, `missing G11 doc ${requiredPath}`);
  }
});

void test('Gate Trial Exact G11 report builder exists', () => {
  const source = readFileSync('scripts/release/buildGateTrialExactP0Baseline.ts', 'utf8');

  for (const required of [
    'gate-trial-exact-p0-baseline.v1',
    'G11',
    'buildGateTrialExactP0Baseline',
    'docs/release/qa/ui-cutover/gate-trial-exact/p0-freeze',
    'docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial',
    'auditPhase6CombatEvidence',
    'gate-trial',
    'strictVisualParityBlockedByDeferredArt',
  ]) {
    assert.equal(source.includes(required), true, `missing report builder token ${required}`);
  }
});
