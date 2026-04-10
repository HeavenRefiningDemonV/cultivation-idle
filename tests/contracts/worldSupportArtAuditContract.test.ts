import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('world support-art README documents all ten world support roles and screenshot gate', () => {
  const readme = read('src/assets/ui/chrome/world_labels/README.md');

  const requiredRoles = [
    'building label plaque',
    'district / area label',
    'selected-building emphasis plate',
    'current-city identity plate',
    'city-arrival banner',
    'world route-hint plaque/chip support',
    'overlay/mask map→inspector integration',
    'soft fog mask',
    'selected-building glint',
    'recommended-building / route-swash',
  ];

  requiredRoles.forEach((role) => {
    assert.match(readme, new RegExp(role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  assert.match(readme, /Screenshot evidence gate/);
  assert.match(readme, /do not create new art requests/i);
});

test('world support-art manifest maps every audited role to generated assets or explicit code-only ownership', () => {
  const manifest = read('src/assets/ui/chrome/world_labels/index.ts');

  assert.match(manifest, /export type WorldSupportArtRole/);
  assert.match(manifest, /WORLD_SUPPORT_ART_FILES/);
  assert.match(manifest, /WORLD_SUPPORT_ART_ROLE_MAP/);
  assert.match(manifest, /overlay_mask_map_to_inspector: 'code_only'/);
  assert.match(manifest, /soft_fog_mask: 'code_only'/);
  assert.match(manifest, /selected_building_glint: 'code_only'/);
  assert.match(manifest, /recommended_route_swash: 'code_only'/);
});
