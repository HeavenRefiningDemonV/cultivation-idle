import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('ruins panel consumes location plaque support-art with fallback marker', () => {
  const panel = read('src/components/screens/world/buildings/RuinsBuildingPanel.tsx');
  assert.match(panel, /resolveRuinsSupportArt\('locationPlaque'\)/);
  assert.match(panel, /data-support-role=\{locationPlaqueSupportArt\.role\}/);
  assert.match(panel, /data-support-fallback=\{locationPlaqueSupportArt\.usesFallback \? '1' : '0'\}/);
});

test('ruins summary card keeps deterministic text DOM-first with optional anchor underplate', () => {
  const card = read('src/ui/world/RuinsSummaryCard.tsx');
  assert.match(card, /ruinsSummaryCard__anchorRewardPlate/);
  assert.match(card, /Deterministic value preview/);
  assert.match(card, /anchorRewardPlateArtUrl\?: string \| null/);
});
