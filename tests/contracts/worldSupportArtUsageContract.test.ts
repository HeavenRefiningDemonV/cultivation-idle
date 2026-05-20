import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-07 world support-art usage wires only approved light integrations', () => {
  const worldOverlayRibbon = read('src/ui/world/WorldOverlayRibbon.tsx');
  const cityArrivalBanner = read('src/components/system/CityArrivalBanner.tsx');
  const worldRouteChip = read('src/ui/world/WorldRouteChip.tsx');
  const manifest = read('src/assets/ui/chrome/world_labels/index.ts');

  assert.match(manifest, /WORLD_SUPPORT_ART_ASSET_URLS/);
  assert.match(worldOverlayRibbon, /WORLD_SUPPORT_ART_ASSET_URLS\.currentCityPlate/);
  assert.match(cityArrivalBanner, /WORLD_SUPPORT_ART_ASSET_URLS\.cityArrivalBanner/);
  assert.match(worldRouteChip, /WORLD_SUPPORT_ART_ASSET_URLS\.routeHintPlaque/);
});

test('WR-07 support-art gap report exists and keeps screenshot gate explicit', () => {
  const report = read('docs/ui/world-recovery/WR-07-support-art-gap-report.md');
  assert.match(report, /screenshot/i);
  assert.match(report, /No production art request is opened in WR-07/i);
  assert.match(report, /deferred to WR-08/i);
});
