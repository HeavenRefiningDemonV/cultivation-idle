import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { OutskirtsExactShellScaffold } from '../../src/features/world/outskirts/shell/OutskirtsExactShellScaffold.js';

void test('P2 shell prep scaffold composes exact mockup surface through shared shell primitives', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactShellScaffold, { surface }));

  assert.match(html, /outskirts-exact-shell-scaffold/);
  assert.match(html, /outskirts-exact-shell-grid/);
  assert.match(html, /plaqueHeader/);
  assert.match(html, /frameCard/);
  assert.match(html, /Your Setup/);
  assert.match(html, /Expected Rewards/);
  assert.match(html, /Grind Summary/);
});

void test('P2 shell prep scaffold remains detached from live Outskirts route wiring', async () => {
  const livePanel = await readFile(new URL('../../src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', import.meta.url), 'utf8');
  assert.equal(livePanel.includes('OutskirtsExactShellScaffold'), false);
});
