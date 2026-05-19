import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('WorldBuildingModal Ruins host uses stretch screen-owned sizing and Ruins-specific ambience', async () => {
  const modalSource = await fs.readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  const surfaceSource = await fs.readFile('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');
  const scss = await fs.readFile('src/components/modals/WorldBuildingModal.scss', 'utf8');

  assert.match(modalSource, /panelClassName=\{`worldBuildingModal worldBuildingModal--\$\{entrySurface\.backgroundVariant\} worldBuildingModal--\$\{entrySurface\.shellFamily\} worldBuildingModal--\$\{entrySurface\.shellMode\}`\}/);
  assert.match(modalSource, /className=\{`worldBuildingBody worldBuildingBody--\$\{entrySurface\.backgroundVariant\} worldBuildingBody--\$\{entrySurface\.shellFamily\} worldBuildingBody--\$\{entrySurface\.shellMode\}`\}/);

  assert.match(surfaceSource, /'ruins-exact'/);
  assert.match(surfaceSource, /'ruins-scenic'/);
  assert.match(surfaceSource, /case 'ruins':/);
  assert.match(surfaceSource, /backgroundVariant\s*=\s*'ruins-exact'/);
  assert.match(surfaceSource, /shellFamily\s*=\s*'ruins-scenic'/);
  assert.match(surfaceSource, /shellMode\s*=\s*'screen-owned'/);

  assert.match(scss, /\.worldBuildingOverlay--ruins-scenic/);
  assert.match(scss, /\.worldBuildingModal--ruins-exact/);
  assert.match(scss, /city_ruins\.png/);
  assert.match(scss, /\.worldBuildingModal--ruins-scenic::after/);
  assert.match(scss, /\.worldBuildingBody--ruins-exact/);
  assert.match(scss, /\.worldBuildingBody--ruins-scenic/);

  assert.match(scss, /\.worldBuildingOverlay--ruins-scenic\s*\{[\s\S]*align-items:\s*stretch;[\s\S]*justify-content:\s*stretch;[\s\S]*padding:\s*clamp\(8px, 1\.2vh, 16px\) clamp\(10px, 1\.2vw, 20px\);/);
  assert.match(scss, /\.worldBuildingModal--ruins-exact\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*max-width:\s*none;[\s\S]*max-height:\s*none;/);
});
