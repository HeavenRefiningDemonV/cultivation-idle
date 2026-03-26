import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const exists = (path) => fs.existsSync(path);

const PREP_PROFILE_PATH = 'src/features/prep/currentBranchGatePrepProfiles.ts';
const PREP_ASSESSMENT_PATH = 'src/features/prep/currentBranchPrepAssessment.ts';
const PREP_DIAGNOSTICS_PATH = 'src/features/prep/prepRecoveryDiagnostics.ts';
const DUNGEON_SCREEN_PATH = 'src/components/screens/DungeonScreen.tsx';
const INVENTORY_SCREEN_PATH = 'src/components/screens/InventoryScreen.tsx';
const GAME_STORE_PATH = 'src/stores/gameStore.ts';
const TECHNIQUE_STORE_PATH = 'src/stores/techniqueStore.ts';

test('Packet 6.4 guard: required prep helper files exist', () => {
  for (const path of [PREP_PROFILE_PATH, PREP_ASSESSMENT_PATH, PREP_DIAGNOSTICS_PATH]) {
    assert.equal(exists(path), true, `Missing required Packet 6.4 helper file: ${path}`);
  }
});

test('Packet 6.4 guard: authoritative prep-profile exports, gate IDs, and recovery constants remain', () => {
  const source = read(PREP_PROFILE_PATH);

  for (const symbol of [
    'CURRENT_BRANCH_GATE_PREP_PROFILES',
    'CURRENT_BRANCH_PREP_RECOVERY_TARGETS',
    'getCurrentBranchGatePrepProfile',
    'novice_clearing',
    'stone_core_sanctum',
    'nascent_soul_chamber',
  ]) {
    assert.match(source, new RegExp(symbol), `Missing Packet 6.4 prep profile symbol or gate id: ${symbol}`);
  }

  const requiredPatterns = [
    /fullPackageMinutes[\s\S]*?novice_clearing:\s*{\s*minMinutes:\s*15,\s*maxMinutes:\s*25\s*}/,
    /fullPackageMinutes[\s\S]*?stone_core_sanctum:\s*{\s*minMinutes:\s*25,\s*maxMinutes:\s*40\s*}/,
    /fullPackageMinutes[\s\S]*?nascent_soul_chamber:\s*{\s*minMinutes:\s*35,\s*maxMinutes:\s*55\s*}/,
    /antiStallCaps[\s\S]*?maxCommonSupportMinutes:\s*10/,
    /antiStallCaps[\s\S]*?maxTargetedSupportMinutes:\s*25/,
    /antiStallCaps[\s\S]*?maxMajorCorrectionCategories:\s*3/,
  ];

  for (const pattern of requiredPatterns) {
    assert.match(source, pattern, `Missing Packet 6.4 recovery/anti-stall pattern: ${pattern}`);
  }
});

test('Packet 6.4 guard: prep assessment exports and route honesty remain', () => {
  const source = read(PREP_ASSESSMENT_PATH);

  for (const symbol of [
    'buildCurrentBranchPrepSnapshot',
    'assessCurrentBranchGatePrep',
    'getCurrentBranchPrepRoutes',
    'getBiggestPrepShortfall',
  ]) {
    assert.match(source, new RegExp(`export function ${symbol}`), `Missing prep assessment export: ${symbol}`);
  }

  for (const forbidden of ['apothecary', 'forge', 'ruin', 'bounty', 'expedition']) {
    assert.doesNotMatch(
      source.toLowerCase(),
      new RegExp(`routeToken:\s*'${forbidden}'|${forbidden}`),
      `Prep routes regressed to non-live room destination: ${forbidden}`
    );
  }
});

test('Packet 6.4 guard: Gate 1 and Gate 2 build floors remain current-branch-honest', () => {
  const profileSource = read(PREP_PROFILE_PATH);
  const gameStoreSource = read(GAME_STORE_PATH);
  const techniqueStoreSource = read(TECHNIQUE_STORE_PATH);

  const noviceBlock = profileSource.match(/novice_clearing:\s*{[\s\S]*?stone_core_sanctum:/);
  assert.ok(noviceBlock, 'Unable to locate novice_clearing profile block.');
  assert.doesNotMatch(
    noviceBlock[0],
    /selectedPath|unlockedTechniqueCount|techniqueProgress|tier\s*[23]/,
    'Gate 1 regressed to impossible path/technique requirements before guaranteed sequencing.'
  );

  const stoneBlock = profileSource.match(/stone_core_sanctum:\s*{[\s\S]*?nascent_soul_chamber:/);
  assert.ok(stoneBlock, 'Unable to locate stone_core_sanctum profile block.');
  assert.doesNotMatch(
    stoneBlock[0].toLowerCase(),
    /tier\s*2|tier\s*3|mastery|rune|rank\s*floor/,
    'Gate 2 regressed to impossible tier/mastery/rune/rank semantics for this branch.'
  );

  // Structural branch truth check: path selection can happen at Foundation and technique unlocks are tier-based over realms.
  assert.match(gameStoreSource, /showPathSelection/, 'Expected path selection sequencing signal missing in gameStore.');
  assert.match(techniqueStoreSource, /unlockTechniqueByPathAndTier/, 'Expected technique tier unlock surface missing in techniqueStore.');
});

test('Packet 6.4 guard: DungeonScreen still consumes prep assessment surface', () => {
  const source = read(DUNGEON_SCREEN_PATH);
  assert.match(source, /assessCurrentBranchGatePrep/, 'DungeonScreen no longer consumes Packet 6.4 prep assessment.');
  assert.match(source, /minimumChecklist|recommendedChecklist|topFixes|biggestShortfall/, 'DungeonScreen lost prep-floor checklist outputs.');
});

test('Packet 6.4 guard: Inventory prep actionability and no fake medicine-pouch wording regressions', () => {
  const source = read(INVENTORY_SCREEN_PATH);
  assert.match(source, /Next Gate Prep/, 'InventoryScreen lost Packet 6.4 next-gate prep actionability block.');

  const touchedScreens = [
    read(DUNGEON_SCREEN_PATH),
    source,
    read('src/components/screens/StatusScreen.tsx'),
  ].join('\n').toLowerCase();

  assert.doesNotMatch(
    touchedScreens,
    /medicine pouch not configured|medicine-pouch not configured|configure medicine pouch/,
    'Packet 6.4 regressed to fake medicine-pouch surfaced wording on a branch without that system.'
  );
});

test('Packet 6.4 guard: prep recovery diagnostics export surface remains available and readable', () => {
  const source = read(PREP_DIAGNOSTICS_PATH);
  for (const symbol of [
    'recordPrepRecoveryDiagnosticEvent',
    'getPrepRecoveryDiagnosticsSnapshot',
    'resetPrepRecoveryDiagnostics',
  ]) {
    assert.match(source, new RegExp(`export function ${symbol}`), `Missing diagnostics export: ${symbol}`);
  }

  assert.match(source, /totalTracked|openIssues|resolvedIssues|entries/, 'Diagnostics snapshot readability fields regressed.');
});
