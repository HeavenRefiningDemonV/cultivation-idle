import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('WorldBuildingModal applies Outskirts-specific shell/background/mode classes and body host modifiers', async () => {
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
});

void test('World routing stays World -> WorldBuildingModal -> OutskirtsBuildingPanel', async () => {
  const source = await fs.readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  assert.match(source, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);
  assert.match(source, /case 'gateTrial':\s*content = <GateTrialBuildingPanel cityId=\{storeCityId\} \/>/);
  assert.match(source, /case 'ruins':\s*content = <RuinsBuildingPanel cityId=\{storeCityId\} \/>/);
});
