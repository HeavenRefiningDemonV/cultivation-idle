import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

void test('Gate Trial Exact G11 DOM audit has required region selectors', () => {
  const source = readFileSync('scripts/release/capturePhase6CombatEvidence.ts', 'utf8');

  for (const selector of [
    '[data-testid="gate-trial-exact-page"]',
    '[data-testid="gate-trial-exact-top-region"]',
    '[data-testid="gate-trial-tactical-strip"]',
    '[data-testid="gate-trial-exact-left-rail"]',
    '[data-testid="gate-trial-minimum-checklist"]',
    '[data-testid="gate-trial-exact-gate-header-slot"]',
    '[data-testid="gate-trial-scenic-stage"]',
    '[data-testid="gate-trial-readiness-seal"]',
    '[data-testid="gate-trial-guardian-plaque"]',
    '[data-testid="gate-trial-exact-right-rail"]',
    '[data-testid="gate-trial-recommended-panel"]',
    '[data-testid="gate-trial-trial-summary"]',
    '[data-testid="gate-trial-readiness-rail"]',
    '[data-testid="gate-trial-primary-cta"]',
  ]) {
    assert.equal(source.includes(selector), true, `missing Gate Trial audit selector ${selector}`);
  }
});

void test('Gate Trial Exact G11 DOM audit has required text markers', () => {
  const source = readFileSync('scripts/release/capturePhase6CombatEvidence.ts', 'utf8');

  for (const marker of [
    'Gate Trial',
    'Foundation Gate',
    'Minimum Checklist',
    'Recommended',
    'Trial Summary',
    'Foundation Gate Readiness',
    'Attempt Gate',
    'VIABLE',
    'Readiness 74 / 100',
    'Gate Guardian',
    'Gate Foundation Pill',
    'Safety Net',
    'Top Fixes',
  ]) {
    assert.equal(source.includes(marker), true, `missing Gate Trial text marker ${marker}`);
  }
});

void test('Gate Trial Exact G11 DOM audit forbids old shell and cross-surface leakage', () => {
  const source = readFileSync('scripts/release/capturePhase6CombatEvidence.ts', 'utf8');

  for (const forbiddenMarker of [
    'Run Compass unavailable.',
    'Best used when you are ready',
    'Minimum Floor',
    'Recommended Floor',
    'Gate Progress',
    'GateTrialWorldLayout',
    'GateTrialAttemptCluster',
    'worldBuildingBody--combat-path',
    'worldBuildingBody--inside-dungeon',
    'CombatTheaterModal',
    'Start Hunt',
    'Hollow Log Den',
    'Expected Rewards',
    'Rare Pity',
    'Final Chest',
  ]) {
    assert.equal(source.includes(forbiddenMarker), true, `missing forbidden marker ${forbiddenMarker}`);
  }

  assert.equal(source.includes("'Ruin',"), false, 'Gate Trial audit must not forbid the bare word Ruin');
  assert.equal(source.includes('"Ruin",'), false, 'Gate Trial audit must not forbid the bare word Ruin');
});

void test('Gate Trial Exact G11 geometry checks exist', () => {
  const capture = readFileSync('scripts/release/capturePhase6CombatEvidence.ts', 'utf8');
  const validate = readFileSync('scripts/release/validatePhase6CombatEvidence.ts', 'utf8');
  const combined = `${capture}\n${validate}`;

  for (const geometryRule of [
    'noVerticalPageScroll',
    'ctaWithinViewport',
    'railAboveCta',
    'summaryRightOfScenic',
    'leftRailLeftOfScenic',
    'rightRailRightOfScenic',
    'centerDominatesWidth',
  ]) {
    assert.equal(combined.includes(geometryRule), true, `missing geometry rule ${geometryRule}`);
  }
});

void test('Gate Trial Exact T1 visual regression gates include layout refit thresholds', () => {
  const validate = readFileSync('scripts/release/validatePhase6CombatEvidence.ts', 'utf8');

  for (const token of [
    'gate_trial_layout_scenic_not_dominant',
    'gate_trial_layout_header_misaligned',
    'gate_trial_layout_right_panel_misaligned',
    'gate_trial_layout_summary_misaligned',
    'gate_trial_layout_rail_misaligned',
    'gate_trial_layout_cta_misaligned',
    'scenic.height >= 680',
    'cta.top >= 1010',
    'rail.top >= 900',
  ]) {
    assert.equal(validate.includes(token), true, `missing T1 runtime geometry gate ${token}`);
  }
});

void test('Gate Trial Exact T2 visual regression gates forbid green CTA ornament blobs', () => {
  const screen = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const forbidden of [
    'gate-trial-primary-cta-ornament-left',
    'gate-trial-primary-cta-ornament-right',
    'gateTrialPrimaryCta__ornament',
    'gateTrialPrimaryCta__ornamentCore',
  ]) {
    assert.equal(screen.includes(forbidden), false, `CTA screen markup must not contain ${forbidden}`);
  }

  const ctaStart = scss.indexOf('.gateTrialPrimaryCta {');
  assert.notEqual(ctaStart, -1, 'CTA SCSS block missing');

  const ctaEnd = scss.indexOf('.gateTrialScenicStage--active', ctaStart);
  const ctaSlice = scss.slice(ctaStart, ctaEnd > ctaStart ? ctaEnd : undefined);

  for (const forbidden of [
    '.gateTrialPrimaryCta__ornament',
    '.gateTrialPrimaryCta__ornamentCore',
    '.gateTrialPrimaryCta__plate::before',
    '.gateTrialPrimaryCta__plate::after',
    'rgba(47, 106, 76',
    'rgba(22, 69, 50',
  ]) {
    assert.equal(ctaSlice.includes(forbidden), false, `CTA SCSS slice must not contain ${forbidden}`);
  }
});

void test('Gate Trial Exact T3 visual regression gates require unified iconography', () => {
  const screen = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  assert.equal(screen.includes('GateTrialExactIcon'), true);
  assert.equal(scss.includes('.gateTrialExactIcon'), true);

  for (const forbidden of [
    '.gateTrialTacticalCell__icon--hp::before',
    '.gateTrialTacticalCell__icon--gate::before',
    '.gateTrialTacticalCell__icon--loadout::before',
    '.gateTrialTacticalCell__icon--aiProfile::before',
    '.gateTrialTacticalCell__icon--healing::before',
    '.gateTrialTacticalCell__icon--bounty::before',
    '.gateTrialTacticalCell__icon--expedition::before',
    'lucide-react',
    'GameIcon',
  ]) {
    assert.equal(`${screen}\n${scss}`.includes(forbidden), false, `T3 must not contain ${forbidden}`);
  }
});

void test('Gate Trial Exact T4 visual regression gates preserve final scenic art truth', () => {
  const registry = readFileSync('src/features/world/gateTrialExact/gateTrialExactAssetRegistry.ts', 'utf8');
  const builder = readFileSync('src/features/world/gateTrialExact/buildGateTrialExactSurface.ts', 'utf8');
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    'GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING',
    'requiresFinalArtBinding',
    'canClaimStrictVisualParity',
    'approved-bound',
    'approvedFoundationGatePlate',
    'foundation-gate-scene-approved-plate.png',
    'forbiddenFinalSubstitutes',
  ]) {
    assert.equal(`${registry}\n${builder}`.includes(required), true, `missing T4 art truth token ${required}`);
  }

  const approvedBlockStart = scss.indexOf('.gateTrialScenicStage--approvedBound .gateTrialScenicStage__approvedPlate');
  const approvedBlockEnd = approvedBlockStart >= 0 ? scss.indexOf('}', approvedBlockStart) : -1;
  const approvedBlock = approvedBlockStart >= 0 && approvedBlockEnd > approvedBlockStart
    ? scss.slice(approvedBlockStart, approvedBlockEnd)
    : '';

  assert.equal(
    approvedBlock.includes("url('../../../assets/world/gateTrial/foundation-gate-scene-approved-plate.png')"),
    true,
    'approved scene must bind the canonical Foundation Gate scenic plate',
  );

  for (const forbidden of [
    'city_gate.png',
    'InsideDungeon.png',
    'entrygate.png',
    'gate.png',
    'cultivator_backshots.png',
  ]) {
    assert.equal(approvedBlock.includes(forbidden), false, `approved scene must not use support substitute ${forbidden}`);
  }
});

void test('Gate Trial Exact G11 report checklist preserves mockup region map', () => {
  const regionMap = readFileSync('docs/release/qa/ui-cutover/gate-trial-exact/p0-freeze/gateTrialExactRegionMap.json', 'utf8');
  const checklist = readFileSync('docs/release/qa/ui-cutover/gate-trial-exact/p0-freeze/gateTrialExactVisualAuditChecklist.md', 'utf8');

  for (const token of [
    '2048',
    '1152',
    'pageTitle',
    'topMacroRoute',
    'tacticalStrip',
    'gateTitlePlaque',
    'minimumChecklist',
    'scenicStage',
    'readinessSeal',
    'recommendedPanel',
    'trialSummary',
    'readinessRail',
    'attemptGateCta',
  ]) {
    assert.equal(regionMap.includes(token), true, `missing region map token ${token}`);
  }

  for (const token of [
    'No visible 80rem × 45rem modal box',
    'No combat-path shell',
    'Seven tactical cells',
    'Foundation Gate',
    'Minimum Checklist',
    'Recommended',
    'Trial Summary',
    'Foundation Gate Readiness',
    'Attempt Gate',
    'Approved scenic plate bound',
  ]) {
    assert.equal(checklist.includes(token), true, `missing checklist token ${token}`);
  }
});

void test('Gate Trial Exact G11 scripts do not call gameplay mutation services', () => {
  const combined = [
    'scripts/release/runGateTrialExactP0Capture.ts',
    'scripts/release/buildGateTrialExactP0Baseline.ts',
    'scripts/release/capturePhase6CombatEvidence.ts',
    'scripts/release/validatePhase6CombatEvidence.ts',
  ].map((file) => readFileSync(file, 'utf8')).join('\n');

  for (const forbidden of [
    'RewardService',
    'recordFailure(',
    'markCleared(',
    'markBypassed(',
    'startCombat(',
    'openCombatPreview',
    'startCombatFromPreview',
    'spendCurrency',
    'grantRewards',
    'gameStore.breakthrough',
  ]) {
    assert.equal(combined.includes(forbidden), false, `G11 capture/audit/report scripts must not reference ${forbidden}`);
  }
});
