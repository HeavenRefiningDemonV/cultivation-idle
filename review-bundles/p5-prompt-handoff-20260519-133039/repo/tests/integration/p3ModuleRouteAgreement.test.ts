import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('P3 module role banner is wired through shared route owners', () => {
  const modal = readFileSync('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  const banner = readFileSync('src/ui/world/ModuleRoleBanner.tsx', 'utf8');
  const techniquesOwner = readFileSync('src/features/techniquesExact/TechniquesScreenOwner.tsx', 'utf8');

  assert.match(modal, /buildLiveModuleRoleBannerSurface/);
  assert.match(modal, /ModuleRoleBanner/);
  assert.match(modal, /openWorldModule\(\{ cityId: target\.cityId, moduleKey: target\.moduleKey/);
  assert.match(modal, /setActiveTab\(target\.tab\)/);
  assert.match(techniquesOwner, /buildLiveModuleRoleBannerSurface\('techniques'/);
  assert.match(techniquesOwner, /openWorldModule\(\{ cityId: target\.cityId, moduleKey: target\.moduleKey/);
  assert.doesNotMatch(banner, /RewardService|grantRewards|CombatStore|resolveFight|addItem|addCurrency/);
});
