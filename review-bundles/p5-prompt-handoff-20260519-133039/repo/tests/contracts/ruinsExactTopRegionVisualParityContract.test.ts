import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuinsTopRegion } from '../../src/features/world/ruinsExact/components/RuinsTopRegion.js';
import { createRuinsExactMockupFixture } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';

void test('ruins top region parity contract keeps required classes and fixture copy', () => {
  const topRegionSource = readFileSync('src/features/world/ruinsExact/components/RuinsTopRegion.ts', 'utf8');
  for (const token of [
    'ruinsTopRegion__titleSeal',
    'ruinsTopRegion__macroFlourish',
    'ruinsTopRegion__settingsButtonInner',
    'ruinsTopRegion__tacticalUnderlineTrack',
    'ruinsTopRegion__tacticalUnderlineFill',
    'ruinsTopRegion__plaqueLabel',
    'ruinsTopRegion__plaqueCaret',
    'ruinsTopRegion__roleChips',
    'ruinsTopRegion__roleChipDot',
  ]) {
    assert.equal(topRegionSource.includes(token), true, `missing top region class token ${token}`);
  }

  const scss = readFileSync('src/features/world/ruinsExact/RuinsExactMockupScreen.scss', 'utf8');
  for (const selector of [
    '.ruinsTopRegion__titleSeal',
    '.ruinsTopRegion__macroFlourish',
    '.ruinsTopRegion__settingsButtonInner',
    '.ruinsTopRegion__tacticalUnderlineTrack',
    '.ruinsTopRegion__tacticalUnderlineFill',
    '.ruinsTopRegion__plaqueLabel',
    '.ruinsTopRegion__plaqueCaret',
    '.ruinsTopRegion__roleChips',
    '.ruinsTopRegion__roleChipDot',
  ]) {
    assert.equal(scss.includes(selector), true, `missing selector ${selector}`);
  }

  for (const guard of ['.ruinsTopRegion__tacticalIcon {', 'width:clamp(16px,1.05vw,20px)', 'height:clamp(16px,1.05vw,20px)', 'object-fit:contain', '.ruinsTopRegion__tacticalIconDock {', 'overflow:hidden', '.ruinsTopRegion__tacticalStrip {', 'height:clamp(54px,5.9vh,66px)', 'min-height:clamp(54px,5.9vh,66px)', 'max-height:clamp(54px,5.9vh,66px)']) {
    assert.equal(scss.includes(guard), true, `missing icon/strip guard ${guard}`);
  }

  for (const hpGuard of ['.ruinsTopRegion__tacticalUnderlineTrack', '.ruinsTopRegion__tacticalUnderlineFill', 'height:4px', 'linear-gradient(90deg, #b8372e 0%, #cc4937 82%, #6e9d72 82%, #6e9d72 100%)']) {
    assert.equal(scss.includes(hpGuard), true, `missing HP underline guard ${hpGuard}`);
  }

  for (const plaqueGuard of ['.ruinsTopRegion__areaPlaque::before', '.ruinsTopRegion__areaPlaque::after', '.ruinsTopRegion__plaqueLabel', '.ruinsTopRegion__plaqueCaret']) {
    assert.equal(scss.includes(plaqueGuard), true, `missing plaque guard ${plaqueGuard}`);
  }

  for (const roleChipGuard of ['.ruinsTopRegion__roleChips', '.ruinsTopRegion__roleChip', '.ruinsTopRegion__roleChipDot']) {
    assert.equal(scss.includes(roleChipGuard), true, `missing role chip guard ${roleChipGuard}`);
  }

  const html = renderToStaticMarkup(React.createElement(RuinsTopRegion, { surface: createRuinsExactMockupFixture() }));
  for (const copyToken of ['Ruins', 'Hollow Log Den', 'Targeted local materials and guaranteed anchor rewards', 'Targeted Mats', 'Deterministic Support', 'HP', 'Depth', 'Loadout', 'AI Profile', 'Healing', 'Bounty', 'Expedition']) {
    assert.equal(html.includes(copyToken), true, `missing copy token ${copyToken}`);
  }
  for (const tacticalId of ['hp', 'depth', 'loadout', 'aiProfile', 'healing', 'bounty', 'expedition']) {
    assert.equal(html.includes(`ruins-tactical-cell-${tacticalId}`), true, `missing tactical test id ${tacticalId}`);
  }
});
