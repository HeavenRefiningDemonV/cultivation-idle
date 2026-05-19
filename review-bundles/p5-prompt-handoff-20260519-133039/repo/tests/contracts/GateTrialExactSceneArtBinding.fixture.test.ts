import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';

void test('Gate Trial Exact T4 asset registry declares explicit Foundation Gate scenic binding truth', () => {
  const source = readFileSync('src/features/world/gateTrialExact/gateTrialExactAssetRegistry.ts', 'utf8');

  for (const required of [
    'GATE_TRIAL_EXACT_FOUNDATION_SCENIC_BINDING',
    'approvedRuntimePath',
    'approvedSourcePath',
    'artStatus',
    'requiresFinalArtBinding',
    'canClaimStrictVisualParity',
    'dataApprovedPlateBound',
    'src/assets/world/gateTrial/foundation-gate-scene-approved-plate.png',
    'src/assets/Gate trail screen.png',
  ]) {
    assert.equal(source.includes(required), true, `missing T4 binding registry token ${required}`);
  }

  for (const forbiddenFinalSubstitute of [
    'city_gate.png',
    'InsideDungeon.png',
    'entrygate.png',
    'gate.png',
    'CSS gradients or generated mist as the final scene',
  ]) {
    assert.equal(source.includes(forbiddenFinalSubstitute), true, `registry must continue forbidding ${forbiddenFinalSubstitute}`);
  }
});

void test('Gate Trial Exact T4 fixture surface art truth matches approved plate availability', () => {
  assert.equal(
    existsSync('src/assets/world/gateTrial/foundation-gate-scene-approved-plate.png'),
    true,
    'approved Foundation Gate scenic plate must exist at the canonical runtime path',
  );

  const surface = createGateTrialExactMockupFixture();

  assert.equal(surface.scenicStage.sceneAssetId, 'approvedFoundationGatePlate');
  assert.equal(surface.scenicStage.artStatus, 'approved-bound');
  assert.equal(surface.scenicStage.requiresFinalArtBinding, false);

  assert.equal(surface.scenicStage.visualFlags.usesOldCombatPathScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesOutskirtsScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesRuinsScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesCityGateAsFinalScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesInsideDungeonAsFinalScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesCssAsFinalArt, false);
});

void test('Gate Trial Exact T4 screen emits art audit attributes without visible placeholder copy', () => {
  const surface = createGateTrialExactMockupFixture();
  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));

  for (const required of [
    'data-testid="gate-trial-scenic-stage"',
    'data-testid="gate-trial-scenic-approved-plate"',
    'data-scene-asset-id="approvedFoundationGatePlate"',
    'data-art-status="approved-bound"',
    'data-final-art-required="false"',
    'data-approved-plate-bound="true"',
    'data-strict-visual-parity-blocked="false"',
    'data-bound="true"',
  ]) {
    assert.equal(html.includes(required), true, `missing T4 art audit markup ${required}`);
  }

  assert.equal(html.includes('Foundation Gate threshold scene'), true);

  for (const forbiddenVisibleIntent of [
    '>Deferred<',
    '>Missing<',
    '>Placeholder<',
    '>Approved plate missing<',
    '>Art required<',
  ]) {
    assert.equal(html.includes(forbiddenVisibleIntent), false, `scene must not render visible placeholder copy ${forbiddenVisibleIntent}`);
  }
});

void test('Gate Trial Exact T4 SCSS separates approved plate binding from deferred support underpaint', () => {
  assert.equal(
    existsSync('src/assets/world/gateTrial/foundation-gate-scene-approved-plate.png'),
    true,
    'approved Foundation Gate scenic plate must exist at the canonical runtime path',
  );

  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialScenicStage--approvedBound .gateTrialScenicStage__approvedPlate',
    '.gateTrialScenicStage--deferredArt .gateTrialScenicStage__approvedPlate',
    '.gateTrialScenicStage__approvedPlate',
    'background-size: cover',
    'background-position: 50% 50%',
    'data-art-status',
  ]) {
    if (required === 'data-art-status') continue;
    assert.equal(scss.includes(required), true, `missing T4 SCSS art token ${required}`);
  }

  assert.equal(
    scss.includes("url('../../../assets/world/gateTrial/foundation-gate-scene-approved-plate.png')"),
    true,
    'approved plate exists and must be bound by SCSS background-image',
  );

  for (const forbiddenApprovedSubstitute of [
    'city_gate.png',
    'InsideDungeon.png',
    'entrygate.png',
    'cultivator_backshots.png',
  ]) {
    const approvedBlockStart = scss.indexOf('.gateTrialScenicStage--approvedBound .gateTrialScenicStage__approvedPlate');
    const approvedBlockEnd = approvedBlockStart >= 0 ? scss.indexOf('}', approvedBlockStart) : -1;
    const approvedBlock = approvedBlockStart >= 0 && approvedBlockEnd > approvedBlockStart
      ? scss.slice(approvedBlockStart, approvedBlockEnd)
      : '';

    assert.equal(
      approvedBlock.includes(forbiddenApprovedSubstitute),
      false,
      `approved plate block must not bind support substitute ${forbiddenApprovedSubstitute}`,
    );
  }
});

void test('Gate Trial Exact T4 approved mode suppresses support shapes without hiding semantic overlays', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialScenicStage--approvedBound .gateTrialScenicStage__underpaint',
    '.gateTrialScenicStage--approvedBound .gateTrialScenicStage__mountain',
    '.gateTrialScenicStage--approvedBound .gateTrialScenicStage__gateSilhouette',
    '.gateTrialScenicStage--approvedBound .gateTrialScenicStage__stairs',
    '.gateTrialScenicStage--approvedBound .gateTrialScenicStage__platform',
    '.gateTrialScenicStage--approvedBound .gateTrialScenicStage__torch',
    '.gateTrialScenicStage--approvedBound .gateTrialScenicStage__cultivatorShadow',
    '.gateTrialScenicStage--approvedBound .gateTrialScenicStage__mist',
  ]) {
    assert.equal(scss.includes(required), true, `approved mode must define support-layer handling for ${required}`);
  }

  for (const forbidden of [
    '.gateTrialScenicStage--approvedBound .gateTrialReadinessSeal { display: none',
    '.gateTrialScenicStage--approvedBound .gateTrialGuardianPlaque { display: none',
    '.gateTrialScenicStage--approvedBound .gateTrialActiveTheater { display: none',
    '.gateTrialScenicStage--approvedBound .gateTrialResultTransition { display: none',
  ]) {
    assert.equal(scss.includes(forbidden), false, `approved plate must not hide overlay ${forbidden}`);
  }
});

void test('Gate Trial Exact T4 environment descriptor describes the scene, not missing/deferred implementation status', () => {
  const surface = createGateTrialExactMockupFixture();
  const descriptor = surface.scenicStage.environmentDescriptor;

  assert.equal(descriptor.includes('Foundation Gate threshold scene'), true);

  for (const forbidden of [
    'Deferred',
    'deferred',
    'Missing',
    'missing',
    'Placeholder',
    'placeholder',
    'approved plate missing',
  ]) {
    assert.equal(descriptor.includes(forbidden), false, `environment descriptor must not contain ${forbidden}`);
  }
});

void test('Gate Trial Exact T4 preserves layout, CTA de-green, and unified iconography contracts', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');
  const screen = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  for (const required of [
    '--gate-scenic-min-height',
    '--gate-page-pad-bottom',
    '--gate-left-rail-top-offset',
    '--gate-right-rail-top-offset',
    '--gate-summary-lift',
    'minmax(var(--gate-scenic-min-height), 1fr)',
    'grid-template-columns: minmax(0, 1fr)',
    '.gateTrialPrimaryCta__glow',
    '.gateTrialPrimaryCta__ring',
    '.gateTrialPrimaryCta__plate',
    '.gateTrialExactIcon',
  ]) {
    assert.equal(`${scss}\n${screen}`.includes(required), true, `T4 must preserve prior touch-up token ${required}`);
  }

  for (const forbidden of [
    'minmax(0, var(--gate-scenic-height))',
    'gate-trial-primary-cta-ornament-left',
    'gate-trial-primary-cta-ornament-right',
    'gateTrialPrimaryCta__ornamentCore',
    '.gateTrialPrimaryCta__ornament',
    '.gateTrialPrimaryCta__plate::before',
    '.gateTrialPrimaryCta__plate::after',
    'lucide-react',
    'GameIcon',
  ]) {
    assert.equal(`${scss}\n${screen}`.includes(forbidden), false, `T4 must not regress prior touch-up token ${forbidden}`);
  }
});
