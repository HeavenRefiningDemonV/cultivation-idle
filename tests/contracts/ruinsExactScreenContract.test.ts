import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.2I exact-screen contract keeps deterministic trio and ruin identity DOM-first', () => {
  const card = read('src/ui/world/RuinsSummaryCard.tsx');
  const panel = read('src/components/screens/world/buildings/RuinsBuildingPanel.tsx');

  assert.match(card, /Deterministic value preview/);
  assert.match(card, /anchorLine/);
  assert.match(card, /leadMaterialsLine/);
  assert.match(card, /rarePityLine/);
  assert.match(panel, /ruinsSummarySurface\.ruinName/);
  assert.match(panel, /ruinsSummarySurface\.roomCountLine/);
  assert.match(panel, /anchorRewardPlateArtUrl/);
});

test('P6.2I keeps support-art additive instead of replacing summary copy', () => {
  const card = read('src/ui/world/RuinsSummaryCard.tsx');

  assert.match(card, /anchorRewardPlateArtUrl\?: string \| null/);
  assert.match(card, /anchorGlowOverlayUrl\?: string \| null/);
  assert.match(card, /\{anchorLine\}/);
  assert.match(card, /\{leadMaterialsLine\}/);
  assert.match(card, /\{rarePityLine\}/);
});
