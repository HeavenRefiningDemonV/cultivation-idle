import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;

const PUBLIC_NON_STATUS_ROOTS = [
  'src/components/screens/SettingsScreen.tsx',
  'src/components/screens/WorldScreen.tsx',
  'src/components/screens/InventoryScreen.tsx',
  'src/components/modals/WorldBuildingModal.tsx',
  'src/components/modals/OfflineProgressModal.tsx',
  'src/features/cultivation/exact',
  'src/features/world/gateTrialExact',
  'src/features/world/outskirts',
  'src/features/world/ruinsExact',
  'src/features/apothecary/exact',
  'src/features/professions/forgeExact',
  'src/features/world/manualPavilionExact',
  'src/features/pavilion',
  'src/features/techniquesExact',
  'src/features/world/bountiesExact',
  'src/features/world/expeditionsExact',
  'src/ui/world',
  // F2-MODALS — the shared public modals (concrete xianxia vocabulary only; no Omen/Proof/Mandate/Source).
  'src/ui/modals',
  'src/ui/shell/RitualCeremonyShell.tsx',
  'src/systems/ui/modals',
];

const FORBIDDEN_PUBLIC_COMPONENTS = [
  'OmenSeal',
  'ProofSealRow',
  'PressureBadgeRow',
  'ReflectionPlaque',
  'SourceThreadDrawer',
  'LocalMandateLensHeader',
  'ModuleSourceSinkPanel',
  'DaoMandateRouteButton',
];

const FORBIDDEN_PUBLIC_FIELDS = [
  'compactOmen',
  'mandateLens',
  'detailOwnership',
  'mandateSourceSink',
  'buildLiveDaoMandateModuleSourceSinkProjection',
  'buildLocalMandateLensSurface',
  'buildWorldMandateRoutingLensSurface',
  'performDaoMandateRouteAction',
  'useDaoMandateRouteActionHandler',
];

const FORBIDDEN_PUBLIC_COPY = [
  'Current Omen',
  'Gate Proof',
  'Recent Omens',
  'Source Thread',
  'Proof Detail',
  'Preparation Health',
  'Mandate Lens',
  'Module Source-Sink',
  'Threshold Omen',
  'Omen evidence',
  'Proof sealed',
  'Source sealed',
  'Mandate after return',
  'Dao Mandate Interface',
  'Mandate points elsewhere',
  'Current Mandate',
  'proof source handoff',
  'status snapshot only',
  'cultivation compact only',
  'one sparse omen-and-proof model',
];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function walk(relPath: string): string[] {
  const absPath = path.join(repoRoot, relPath);
  if (!existsSync(absPath)) return [];
  const stats = statSync(absPath);
  if (stats.isFile()) return SOURCE_FILE_PATTERN.test(relPath) ? [normalizePath(relPath)] : [];
  return readdirSync(absPath)
    .flatMap((entry) => walk(normalizePath(path.join(relPath, entry))));
}

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

test('non-Status public Dao decommission target has explicit roots and forbidden components', () => {
  const docs = [
    read('AGENTS.md'),
    read('docs/codex-packet-rules.md'),
    read('docs/release/status_v3_dao_decommission_plan.md'),
  ].join('\n');

  for (const component of FORBIDDEN_PUBLIC_COMPONENTS) {
    assert.match(docs, new RegExp(component), `Packet A docs should classify ${component}.`);
  }

  for (const root of ['Cultivation', 'Gate Trial', 'World', 'Forge', 'Apothecary', 'Settings']) {
    assert.match(docs, new RegExp(root, 'i'), `Packet A docs should describe ${root} ownership.`);
  }
});

test('Packet D public non-Status roots remove Dao UI imports, fields, routes, and old copy', () => {
  const offenders: string[] = [];
  for (const root of PUBLIC_NON_STATUS_ROOTS) {
    for (const file of walk(root)) {
      const source = read(file);
      for (const component of FORBIDDEN_PUBLIC_COMPONENTS) {
        if (new RegExp(`\\b${component}\\b`).test(source)) offenders.push(`${file}: ${component}`);
      }
      for (const field of FORBIDDEN_PUBLIC_FIELDS) {
        if (new RegExp(`\\b${field}\\b`).test(source)) offenders.push(`${file}: ${field}`);
      }
      for (const label of FORBIDDEN_PUBLIC_COPY) {
        if (source.includes(label)) offenders.push(`${file}: ${label}`);
      }
    }
  }

  assert.deepEqual(offenders, []);
});
