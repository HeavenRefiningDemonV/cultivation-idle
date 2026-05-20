import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WorldScreen centralizes inspector fallback breakpoint and keeps wide/narrow inspector paths', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /window\.matchMedia\('\(max-width: 860px\)'\)/);
  assert.match(file, /<WorldOverlayInspector/);
  assert.match(file, /<InspectorDrawer/);
});

test('WorldScreen splits loading wrappers from LoadedWorldScreen so hook order stays safe', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /export function WorldScreen\(\)/);
  assert.match(file, /return <LoadedWorldScreen citiesSorted=\{citiesSorted\} rawContent=\{rawContent\} \/>/);
  assert.match(file, /function LoadedWorldScreen\(\{ citiesSorted, rawContent \}: LoadedWorldScreenProps\)/);
  const wrapperStart = file.indexOf('export function WorldScreen()');
  const loadedStart = file.indexOf('function LoadedWorldScreen');
  const wrapperBlock = file.slice(wrapperStart, loadedStart);
  assert.doesNotMatch(wrapperBlock, /useMemo\(/);
  assert.doesNotMatch(wrapperBlock, /useCallback\(/);
});

test('WorldScreen preserves map-owned page composition with overlay ribbon and inspector layers', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /<CityMapHub/);
  assert.match(file, /<WorldOverlayRibbon/);
  assert.match(file, /<WorldOverlayInspector/);
  assert.match(file, /worldScreenCanvas/);
  assert.match(file, /worldScreenMapLayer/);
  assert.match(file, /worldScreenRibbonLayer/);
  assert.match(file, /worldScreenInspectorLayer/);
});

test('Narrow world drawer reuses overlay inspector with close-only drawer chrome', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /title=\{`\$\{sanitizeLiveCityName\(selectedCity\.name\)\} .* \$\{inspectorLabel\}`\}/);
  assert.match(file, /headerMode="close-only"/);
  assert.match(file, /className="worldOverlayInspector--drawer"/);
});

test('CityMapHub receives module metadata, cues, recommendation, and glint keys', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  const cityMapStart = file.indexOf('<CityMapHub');
  const cityMapEnd = file.indexOf('/>', cityMapStart);
  assert.ok(cityMapStart >= 0 && cityMapEnd > cityMapStart, 'Expected CityMapHub render block');
  const cityMapBlock = file.slice(cityMapStart, cityMapEnd);
  assert.match(cityMapBlock, /moduleMetadataByKey=\{moduleMetadataByKey\}/);
  assert.match(cityMapBlock, /moduleCueByKey=\{moduleCueByKey\}/);
  assert.match(cityMapBlock, /recommendedModuleKey=\{worldCommandSurface\.strongRecommendationModuleKey\}/);
  assert.match(cityMapBlock, /glintModuleKey=\{strongestRecommendationModuleKey\}/);
});

test('WorldOverlayRibbon receives city phase and pressure lines', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  const ribbonStart = file.indexOf('<WorldOverlayRibbon');
  const ribbonEnd = file.indexOf('/>', ribbonStart);
  assert.ok(ribbonStart >= 0 && ribbonEnd > ribbonStart, 'Expected WorldOverlayRibbon render block');
  const ribbonBlock = file.slice(ribbonStart, ribbonEnd);
  assert.match(ribbonBlock, /phaseLine=\{phaseLine\}/);
  assert.match(ribbonBlock, /pressureLine=\{pressureLine\}/);
  assert.match(file, /buildCityPhaseSurfaceFromSnapshot/);
});

test('WorldOverlayInspector receives role, use case, outputs, boundary, state, and route action', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  const inspectorStart = file.indexOf('<WorldOverlayInspector');
  const inspectorEnd = file.indexOf('/>', inspectorStart);
  assert.ok(inspectorStart >= 0 && inspectorEnd > inspectorStart, 'Expected WorldOverlayInspector render block');
  const inspectorBlock = file.slice(inspectorStart, inspectorEnd);
  assert.match(inspectorBlock, /roleTag=\{inspectorRoleTag\}/);
  assert.match(inspectorBlock, /bestUsedWhen=\{inspectorBestUsedWhen\}/);
  assert.match(inspectorBlock, /boundaryLine=\{inspectorBoundaryLine\}/);
  assert.match(inspectorBlock, /outputs=\{inspectorOutputs\}/);
  assert.match(inspectorBlock, /stateLine=\{inspectorStateLine\}/);
  assert.match(inspectorBlock, /openLabel=\{inspectorOpenLabel\}/);
  assert.match(inspectorBlock, /onOpen=\{\(\) => handleRouteToModule\(inspectorModuleKey\)\}/);
});

test('World recommendations derive from Dao Mandate before economic fallback routes', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /const mandateRoutingLens = useMemo\(\(\) =>/);
  assert.match(file, /buildLiveDaoMandateSurfaceV1/);
  assert.match(file, /buildWorldMandateRoutingLensSurface/);
  assert.match(file, /mandatePrimaryModuleKey: mandateRoutingLens\?\.primaryModuleKey/);
  assert.match(file, /mandateSecondaryModuleKeys: mandateRoutingLens\?\.secondaryModuleKeys/);
  assert.match(file, /const allowWorldRecommendationFallback = !mandateRoutingLens\?\.strongestModuleKey/);
  assert.match(file, /economicModuleKeys: allowWorldRecommendationFallback/);
  assert.doesNotMatch(file, /inspectorRunCompassLine/);
  assert.doesNotMatch(file, /useRunCompassSurface/);
});

test('World module route buttons delegate to openWorldModule through handleRouteToModule', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /const handleRouteToModule = useCallback/);
  assert.match(file, /openWorldModule\(\{ cityId: selectedCity\.id, moduleKey, source: 'world-map' \}\)/);
  assert.doesNotMatch(file, /grantRewards\(/);
  assert.doesNotMatch(file, /resolveCombat/);
});

test('World city selector exposes locked requirements without vague progress copy', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /requirementText: requirementText \?\? deriveCityRequirementText\(city\) \?\? LOCK_REQUIREMENT_UNAVAILABLE/);
  assert.doesNotMatch(file, /Progress required/);
});

test('No new inspector consumers were added outside the world proof surface', () => {
  const liveLayout = read('src/components/GameLayout.tsx');
  assert.doesNotMatch(liveLayout, /WorldOverlayInspector/);
  assert.doesNotMatch(liveLayout, /InspectorDrawer/);
});
