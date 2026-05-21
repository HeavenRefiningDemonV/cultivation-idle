import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const PLAYER_FACING_ROOTS = [
  'src/components/screens/StatusScreen.tsx',
  'src/components/screens/SettingsScreen.tsx',
  'src/components/screens/PrestigeScreen.tsx',
  'src/components/modals/OfflineProgressModal.tsx',
  'src/components/modals/LifeSummaryModal.tsx',
  'src/components/modals/WorldBuildingModal.tsx',
  'src/features/world/gateTrialExact',
  'src/features/combatAftermath',
  'src/features/breakthroughRitual',
  'src/features/apothecary/exact',
  'src/features/professions/forgeExact',
  'src/features/world/manualPavilionExact',
  'src/features/pavilion',
  'src/features/techniquesExact',
  'src/features/world/bountiesExact',
  'src/features/world/expeditionsExact',
  'src/ui/daoMandate',
  'src/ui/status',
  'src/systems/ui/daoMandate',
  'src/systems/ui/status/statusTroubleshootingSurface.ts',
  'src/systems/ui/world/worldCommandSurface.ts',
];

const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;

const FORBIDDEN_PUBLIC_LABELS = [
  /\bRun Compass\b/i,
  /Follow Run Compass/i,
  /Biggest Shortfall/i,
  /Best Next Actions?/i,
  /Mission Requirements/i,
  /\bMissions\b/i,
  /\bMission\b/i,
  /Prestige Advisor/i,
  /ModuleRoleBanner/i,
  /Top Fixes?/i,
];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function walk(path: string): string[] {
  if (!existsSync(path)) return [];
  const stats = statSync(path);
  if (stats.isFile()) return SOURCE_FILE_PATTERN.test(path) ? [path] : [];
  return readdirSync(path)
    .flatMap((entry) => walk(join(path, entry)));
}

function quotedText(source: string): string {
  return source.match(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g)?.join('\n') ?? '';
}

test('P8 active player-facing source does not expose old guide authority labels', () => {
  const offenders: string[] = [];
  const files = PLAYER_FACING_ROOTS.flatMap(walk);

  for (const filePath of files) {
    const publicStrings = quotedText(readFileSync(filePath, 'utf8'));
    for (const pattern of FORBIDDEN_PUBLIC_LABELS) {
      if (pattern.test(publicStrings)) {
        offenders.push(`${normalizePath(filePath)} :: ${pattern}`);
      }
    }
  }

  assert.deepEqual(offenders, []);
});

test('P8 legacy ModuleRoleBanner compatibility code is not mounted by active screens', () => {
  const offenders: string[] = [];
  for (const filePath of walk('src')) {
    const normalized = normalizePath(filePath);
    if (
      normalized === 'src/ui/world/ModuleRoleBanner.tsx' ||
      normalized === 'src/systems/world/moduleRoleBannerSurface.ts'
    ) {
      continue;
    }
    const source = readFileSync(filePath, 'utf8');
    if (/ModuleRoleBanner|moduleRoleBannerSurface/.test(source)) offenders.push(normalized);
  }

  assert.deepEqual(offenders, []);
});
