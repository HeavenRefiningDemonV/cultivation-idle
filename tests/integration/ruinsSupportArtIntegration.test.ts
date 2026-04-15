import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('ruins panel consumes location plaque support-art and anchor underplate A', () => {
  const panel = read('src/components/screens/world/buildings/RuinsBuildingPanel.tsx');
  assert.match(panel, /resolveRuinsSupportArt\('locationPlaque'\)/);
  assert.match(panel, /resolveRuinsSupportArt\('anchorRewardPlateA'\)/);
  assert.match(panel, /data-support-role=\{locationPlaqueSupportArt\.role\}/);
});

test('ruins summary card keeps deterministic text DOM-first with optional anchor underplate', () => {
  const card = read('src/ui/world/RuinsSummaryCard.tsx');
  assert.match(card, /ruinsSummaryCard__anchorRewardPlate/);
  assert.match(card, /Deterministic value preview/);
  assert.match(card, /anchorRewardPlateArtUrl\?: string \| null/);
});
