import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { resolveOutskirtsScenicAsset } from '../../src/features/world/outskirts/resolveOutskirtsScenicAsset.js';

void test('Packet B scenic ownership uses integrated scene-plane structure instead of scenic card shell', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-exact-center-scenic-slot"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-plane"'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-scene-layer-base"'), true);
  assert.equal(html.includes('outskirtsScenicStage'), false);
});

void test('Packet B scene helper supports encounter-driven scenic variation', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ sourceMode: 'stores' }));
  const wolf = resolveOutskirtsScenicAsset({ scenic: surface.scenicStage, selectedEncounterId: 'snarling-wolf' });
  const boar = resolveOutskirtsScenicAsset({ scenic: surface.scenicStage, selectedEncounterId: 'rockjaw-boar' });

  assert.equal(wolf.sceneVariantId, 'snarling-wolf');
  assert.equal(boar.sceneVariantId, 'rockjaw-boar');
  assert.notEqual(wolf.encounterLayerSrc, boar.encounterLayerSrc);
  assert.notEqual(wolf.encounterLayerPosition, boar.encounterLayerPosition);
});

void test('Packet B preserves review/live structural parity for scenic scene-plane ownership', () => {
  const review = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ sourceMode: 'fixture' }));
  const live = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ sourceMode: 'stores' }));

  const reviewHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: review }));
  const liveHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: live }));

  const structureTokens = [
    'data-testid="outskirts-exact-center-scenic-slot"',
    'data-testid="outskirts-exact-scene-plane"',
    'data-testid="outskirts-exact-scene-layer-base"',
  ];
  for (const token of structureTokens) {
    assert.equal(reviewHtml.includes(token), true);
    assert.equal(liveHtml.includes(token), true);
  }
});

void test('Packet B scenic region does not leak visible scenic fallback text', () => {
  const fixture = createOutskirtsMockupFixture();
  const surface = buildOutskirtsMockupSurface(fixture);
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('outskirts-exact-scenic-fallback'), false);
  assert.equal(html.includes(`>${fixture.encounterDescriptor}<`), false);
});

void test('Packet B planning-state purity smoke keeps planning shell-only ownership', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  assert.equal(surface.shell.usePlanningState, true);
  assert.equal(surface.shell.showCombatTheater, false);
  assert.equal(surface.shell.showCombatLog, false);
  assert.equal(surface.primaryAction.singleDominantCta, true);
});

void test('Packet B keeps title and tactical strip intact (no Packet C work)', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-page-title"'), true);
  assert.equal((html.match(/outskirts-tactical-cell-/g) ?? []).length, 7);
});

void test('Packet B scenic stylesheet removes legacy scenic card-shell selector', async () => {
  const scss = await readFile(new URL('../../src/features/world/outskirts/OutskirtsExactMockupScreen.scss', import.meta.url), 'utf8');
  assert.equal(scss.includes('.outskirtsScenicStage'), false);
  assert.equal(scss.includes('.outskirtsScenePlane'), true);
});
