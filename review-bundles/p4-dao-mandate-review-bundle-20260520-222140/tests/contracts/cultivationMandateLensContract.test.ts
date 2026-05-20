import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

const cultivationScreenSource = readSource('src/features/cultivation/exact/CultivationExactScreen.tsx');
const cultivationSurfaceSource = readSource('src/features/cultivation/exact/buildCultivationExactSurface.ts');
const cultivationTypesSource = readSource('src/features/cultivation/exact/cultivationExactTypes.ts');
const cultivationOwnerSource = readSource('src/features/cultivation/exact/CultivationExactScreenOwner.tsx');
const cultivationControllerSource = readSource('src/features/cultivation/exact/useCultivationExactActionController.ts');

test('P4 Cultivation renders a compact Dao Mandate threshold lens instead of public Run Compass', () => {
  assert.match(cultivationScreenSource, /MandateSeal/);
  assert.match(cultivationScreenSource, /data-region="dao-mandate-threshold-lens"/);
  assert.match(cultivationScreenSource, /Threshold Mandate/);
  assert.match(cultivationScreenSource, /Breakthrough Proof/);
  assert.match(cultivationScreenSource, /RequirementLedger/);

  assert.doesNotMatch(cultivationScreenSource, /aria-label="Run Compass"/);
  assert.doesNotMatch(cultivationScreenSource, /data-region="run-compass-v2"/);
  assert.doesNotMatch(cultivationScreenSource, /from ['"][^'"]*RunCompass/);
  assert.doesNotMatch(cultivationScreenSource, /<RunCompass/);
  assert.doesNotMatch(cultivationScreenSource, /MandateChamberHero/);
});

test('P4 Cultivation surface exposes Mandate lens and breakthrough proof ledger from Dao Mandate truth', () => {
  assert.match(cultivationTypesSource, /mandateLens/);
  assert.match(cultivationTypesSource, /breakthroughProofLedger/);
  assert.match(cultivationTypesSource, /DaoMandateSurfaceV1/);
  assert.match(cultivationTypesSource, /DaoRequirementLedger/);

  assert.match(cultivationSurfaceSource, /buildLiveDaoMandateSurfaceV1/);
  assert.match(cultivationSurfaceSource, /currentScreen:\s*'cultivation'/);
  assert.match(cultivationSurfaceSource, /applyDaoMandateVisibility/);
  assert.match(cultivationSurfaceSource, /buildCultivationBreakthroughProofLedger/);
  assert.match(cultivationSurfaceSource, /Qi Reservoir/);
  assert.match(cultivationSurfaceSource, /Realm Edge/);
  assert.match(cultivationSurfaceSource, /Gate Proof/);
});

test('P4 Cultivation rerenders on Guidance Oath changes and routes through the Dao Mandate adapter', () => {
  assert.match(cultivationOwnerSource, /guidanceOath/);
  assert.match(cultivationOwnerSource, /mandateMotionMode/);
  assert.match(cultivationOwnerSource, /storyMotionMode/);
  assert.match(cultivationOwnerSource, /onMandateRouteAction=\{actions\.onMandateRouteAction\}/);

  assert.match(cultivationControllerSource, /performDaoMandateRouteAction/);
  assert.match(cultivationControllerSource, /onMandateRouteAction/);
});
