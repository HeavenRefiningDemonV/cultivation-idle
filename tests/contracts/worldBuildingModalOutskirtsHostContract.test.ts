import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('WorldBuildingModal Outskirts host uses stretch screen-owned sizing', async () => {
  const source = await fs.readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');

  assert.match(source, /panelClassName=\{`worldBuildingModal worldBuildingModal--\$\{entrySurface\.backgroundVariant\} worldBuildingModal--\$\{entrySurface\.shellFamily\} worldBuildingModal--\$\{entrySurface\.shellMode\}`\}/);
  assert.match(source, /className=\{`worldBuildingBody worldBuildingBody--\$\{entrySurface\.backgroundVariant\} worldBuildingBody--\$\{entrySurface\.shellFamily\} worldBuildingBody--\$\{entrySurface\.shellMode\}`\}/);
  assert.match(source, /entrySurface\.showContextStrip \? \(/);
  assert.match(source, /entrySurface\.showShellClose \? \(/);

  const scss = await fs.readFile('src/components/modals/WorldBuildingModal.scss', 'utf8');
  assert.match(scss, /\.worldBuildingOverlay--outskirts-scenic/);
  assert.match(scss, /\.worldBuildingModal--outskirts-exact/);
  assert.match(scss, /\.worldBuildingModal--outskirts-scenic::after/);
  assert.match(scss, /\.worldBuildingBody--outskirts-exact/);

  assert.match(scss, /\.worldBuildingOverlay--outskirts-scenic\s*\{[\s\S]*align-items:\s*stretch;[\s\S]*justify-content:\s*stretch;[\s\S]*padding:\s*clamp\(8px, 1\.2vh, 16px\) clamp\(10px, 1\.2vw, 20px\);/);
  assert.match(scss, /\.worldBuildingModal--outskirts-exact\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*max-width:\s*none;[\s\S]*max-height:\s*none;/);
  assert.match(scss, /\.worldBuildingBody--outskirts-exact,[\s\S]*\.worldBuildingBody--outskirts-scenic,[\s\S]*\.worldBuildingBody--screen-owned\s*\{[\s\S]*height:\s*100%;[\s\S]*min-height:\s*0;[\s\S]*overflow:\s*hidden;/);
});

void test('World routing stays World -> WorldBuildingModal -> OutskirtsBuildingPanel', async () => {
  const source = await fs.readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  assert.match(source, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);
  assert.match(source, /case 'gateTrial':\s*content = <GateTrialBuildingPanel cityId=\{storeCityId\} \/>/);
  assert.match(source, /case 'ruins':\s*content = <RuinsBuildingPanel cityId=\{storeCityId\} \/>/);
});
