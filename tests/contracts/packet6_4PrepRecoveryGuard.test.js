import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const exists = (path) => fs.existsSync(path);

const PREP_PROFILES_PATH = 'src/features/prep/currentBranchGatePrepProfiles.ts';
const PREP_ASSESSMENT_PATH = 'src/features/prep/currentBranchPrepAssessment.ts';
const PREP_DIAGNOSTICS_PATH = 'src/features/prep/prepRecoveryDiagnostics.ts';
const DUNGEON_SCREEN_PATH = 'src/components/screens/DungeonScreen.tsx';
const INVENTORY_SCREEN_PATH = 'src/components/screens/InventoryScreen.tsx';
const STATUS_SCREEN_PATH = 'src/components/screens/StatusScreen.tsx';
const GAME_STORE_PATH = 'src/stores/gameStore.ts';
const TECHNIQUE_STORE_PATH = 'src/stores/techniqueStore.ts';

test('Packet 6.4 guard: required prep helper files exist', () => {
  for (const path of [PREP_PROFILES_PATH, PREP_ASSESSMENT_PATH, PREP_DIAGNOSTICS_PATH]) {
    assert.equal(exists(path), true, `Missing required Packet 6.4 helper file: ${path}`);
  }
});

test('Packet 6.4 guard: authoritative prep profile exports and gate IDs persist', () => {
  const source = read(PREP_PROFILES_PATH);

  for (const symbol of [
    'CURRENT_BRANCH_GATE_PREP_PROFILES',
    'CURRENT_BRANCH_PREP_RECOVERY_TARGETS',
    'getCurrentBranchGatePrepProfile',
  ]) {
    assert.match(source, new RegExp(symbol), `Missing Packet 6.4 prep profile symbol: ${symbol}`);
  }

  for (const gateId of ['novice_clearing', 'stone_core_sanctum', 'nascent_soul_chamber']) {
    assert.match(source, new RegExp(gateId), `Missing current-branch gate prep id: ${gateId}`);
  }
});

test('Packet 6.4 guard: required recovery windows and anti-stall caps are still machine-readable', () => {
  const source = read(PREP_PROFILES_PATH);

  const requiredPatterns = [
    /fullPackageMinutes[\s\S]*novice_clearing:\s*{\s*minMinutes:\s*15,\s*maxMinutes:\s*25\s*}/,
    /fullPackageMinutes[\s\S]*stone_core_sanctum:\s*{\s*minMinutes:\s*25,\s*maxMinutes:\s*40\s*}/,
    /fullPackageMinutes[\s\S]*nascent_soul_chamber:\s*{\s*minMinutes:\s*35,\s*maxMinutes:\s*55\s*}/,
    /maxCommonSupportMinutes:\s*10/,
    /maxTargetedSupportMinutes:\s*25/,
    /maxMajorCorrectionCategories:\s*3/,
  ];

  for (const pattern of requiredPatterns) {
    assert.match(source, pattern, `Missing required Packet 6.4 recovery target pattern: ${pattern}`);
  }
});

test('Packet 6.4 guard: prep assessment authoritative exports remain present', () => {
  const source = read(PREP_ASSESSMENT_PATH);
  for (const symbol of [
    'buildCurrentBranchPrepSnapshot',
    'assessCurrentBranchGatePrep',
    'getCurrentBranchPrepRoutes',
    'getBiggestPrepShortfall',
  ]) {
    assert.match(source, new RegExp(`export function ${symbol}`), `Missing prep assessment export: ${symbol}`);
  }
});

test('Packet 6.4 guard: prep routes do not regress to fake room destinations', () => {
  const source = read(PREP_ASSESSMENT_PATH);
  for (const forbidden of ['apothecary', 'forge', 'ruin', 'bounty', 'expedition']) {
    assert.doesNotMatch(
      source.toLowerCase(),
      new RegExp(forbidden),
      `Prep route mapping regressed to non-live room destination: ${forbidden}`
    );
  }
});

test('Packet 6.4 guard: Gate 1 remains free of impossible build requirements', () => {
  const source = read(PREP_PROFILES_PATH);
  const noviceBlockMatch = source.match(/novice_clearing:\s*{[\s\S]*?stone_core_sanctum:/);
  assert.ok(noviceBlockMatch, 'Unable to locate novice_clearing prep profile block.');
  const noviceBlock = noviceBlockMatch[0];

  assert.match(noviceBlock, /minimum:\s*{[\s\S]*build:\s*\[\s*\]/, 'Gate 1 minimum build requirements should remain empty for current branch truth.');
  assert.match(noviceBlock, /recommended:\s*{[\s\S]*build:\s*\[\s*\]/, 'Gate 1 recommended build requirements should remain empty for current branch truth.');
  assert.doesNotMatch(noviceBlock, /selectedPath|unlockedTechniqueCount|techniqueProgress|tier/i, 'Gate 1 regressed to impossible path/technique build requirements.');
});

test('Packet 6.4 guard: Gate 2 prep does not require impossible tiered/mastery semantics', () => {
  const profiles = read(PREP_PROFILES_PATH);
  const gameStore = read(GAME_STORE_PATH);
  const techniqueStore = read(TECHNIQUE_STORE_PATH);

  // Branch sequencing signals: path can be missing until Foundation and tier unlocks are conditional.
  assert.match(gameStore, /if \(newRealmIndex >= 1 && !get\(\)\.selectedPath\)/, 'Expected current-branch path-selection timing signal missing from gameStore.');
  assert.match(techniqueStore, /unlockTechniqueByPathAndTier/, 'Technique unlock sequencing helper missing from techniqueStore.');

  const stoneBlockMatch = profiles.match(/stone_core_sanctum:\s*{[\s\S]*?nascent_soul_chamber:/);
  assert.ok(stoneBlockMatch, 'Unable to locate stone_core_sanctum prep profile block.');
  const stoneBlock = stoneBlockMatch[0];

  assert.doesNotMatch(stoneBlock, /tier\s*[:=]\s*[2-9]|mastery|rune|rank/i, 'Gate 2 regressed to impossible higher-tier/mastery/rune/rank requirements.');
  assert.match(stoneBlock, /unlockedTechniqueCount/, 'Gate 2 should continue using honest unlocked technique count signals.');
  assert.match(stoneBlock, /techniqueProgress/, 'Gate 2 should continue using honest technique progress signals.');
});

test('Packet 6.4 guard: DungeonScreen still consumes prep assessment outputs', () => {
  const source = read(DUNGEON_SCREEN_PATH);
  assert.match(source, /assessCurrentBranchGatePrep/, 'DungeonScreen no longer consumes Packet 6.4 prep assessment.');
  assert.match(source, /minimumChecklist/, 'DungeonScreen no longer surfaces prep checklists.');
  assert.match(source, /topFixes/, 'DungeonScreen no longer surfaces prep fix routes.');
  assert.doesNotMatch(source, /Readiness:\s*<\/span>\s*<span[^>]*>\{readiness\.text\}<\/span>\s*<\/div>\s*<div className="text-xs text-slate-400"/s, 'DungeonScreen appears to have regressed to thin readiness-only surfacing.');
});

test('Packet 6.4 guard: Inventory prep actionability surface still exists', () => {
  const source = read(INVENTORY_SCREEN_PATH);
  assert.match(source, /Next Gate Prep/, 'InventoryScreen prep-summary heading removed.');
  assert.match(source, /assessCurrentBranchGatePrep/, 'InventoryScreen no longer uses prep assessment helper.');
});

test('Packet 6.4 guard: touched player copy avoids fake medicine-pouch dependency text', () => {
  const touched = [read(DUNGEON_SCREEN_PATH), read(INVENTORY_SCREEN_PATH), read(STATUS_SCREEN_PATH)].join('\n').toLowerCase();
  assert.doesNotMatch(touched, /medicine pouch not configured/, 'Touched surfaces regressed to fake medicine-pouch wording not backed by this branch.');
});

test('Packet 6.4 guard: prep recovery diagnostics surface still exists', () => {
  const source = read(PREP_DIAGNOSTICS_PATH);
  for (const symbol of [
    'recordPrepRecoveryDiagnosticEvent',
    'getPrepRecoveryDiagnosticsSnapshot',
    'resetPrepRecoveryDiagnostics',
  ]) {
    assert.match(source, new RegExp(`export function ${symbol}`), `Missing prep recovery diagnostics export: ${symbol}`);
  }
  assert.match(source, /totalTracked/, 'Diagnostics snapshot should remain human-readable (missing aggregate keys).');
});
