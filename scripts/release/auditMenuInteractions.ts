import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type ElementRole =
  | 'button'
  | 'select'
  | 'input'
  | 'tab'
  | 'CTA'
  | 'close button'
  | 'route chip'
  | 'toggle'
  | 'submit'
  | 'modal action'
  | 'handler'
  | 'world route'
  | 'tab route';

type SurfaceType =
  | 'main_tab'
  | 'world_modal'
  | 'exact_screen'
  | 'modal'
  | 'drawer'
  | 'global_overlay'
  | 'legacy_or_deferred';

type MatrixStatus =
  | 'working'
  | 'fixed'
  | 'blocked'
  | 'deferred_unreachable'
  | 'needs_manual_review';

type MatrixRow = {
  surfaceId: string;
  surfaceType: SurfaceType;
  file: string;
  component: string;
  elementLabel: string;
  elementRole: ElementRole;
  handlerName: string;
  storeOrServiceTouched: string;
  expectedBehavior: string;
  expectedUIFeedback: string;
  disabledStateExpected: string;
  keyboardPathExpected: string;
  testCoverageFile: string;
  status: MatrixStatus;
  notes: string;
};

type Finding = {
  severity: 'blocker' | 'warning' | 'info';
  code: string;
  file: string;
  line: number;
  message: string;
  excerpt: string;
};

const ROOT = process.cwd();
const SOURCE_ROOTS = ['src/components', 'src/features', 'src/app', 'src/ui', 'src/systems/ui', 'src/systems/world', 'src/stores'];
const REPORT_PATH = 'docs/release/menu-interaction-static-audit.json';
const MATRIX_PATH = 'docs/release/all-menu-function-matrix.json';
const VALID_TABS = new Set(['cultivation', 'status', 'adventure', 'inventory', 'techniques', 'prestige', 'settings']);
const LIVE_WORLD_KEYS = new Set(['manualPavilion', 'apothecary', 'forge', 'bounties', 'expeditions', 'outskirts', 'gateTrial', 'ruins']);
const DEFERRED_WORLD_KEYS = new Set(['alchemy', 'talismanStudio']);

function toPosix(relativeOrAbsolutePath: string): string {
  return relativeOrAbsolutePath.replaceAll(path.sep, '/');
}

function walkFiles(dir: string, files: string[] = []): string[] {
  const absolute = path.resolve(ROOT, dir);
  if (!statSync(absolute, { throwIfNoEntry: false })?.isDirectory()) return files;
  for (const entry of readdirSync(absolute)) {
    const full = path.join(absolute, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      walkFiles(path.relative(ROOT, full), files);
      continue;
    }
    if (/\.(tsx?|jsx?)$/.test(entry) && !entry.endsWith('.d.ts')) {
      files.push(toPosix(path.relative(ROOT, full)));
    }
  }
  return files;
}

function inferSurfaceId(file: string): string {
  const normalized = file.toLowerCase();
  const exact = [
    ['gateTrialExact', 'gate_trial_exact'],
    ['ruinsExact', 'ruins_exact'],
    ['outskirts', 'outskirts'],
    ['apothecary', 'apothecary'],
    ['forgeExact', 'forge_exact'],
    ['bountiesExact', 'bounties_exact'],
    ['expeditionsExact', 'expeditions_exact'],
    ['prestigeLedgerExact', 'prestige_ledger_exact'],
  ] as const;
  for (const [needle, id] of exact) {
    if (file.includes(needle)) return id;
  }
  if (normalized.includes('worldbuildingmodal')) return 'world_building_modal';
  if (normalized.includes('worldscreen') || normalized.includes('citymaphub')) return 'world';
  if (normalized.includes('cultivate')) return 'cultivation';
  if (normalized.includes('status')) return 'status';
  if (normalized.includes('inventory') || normalized.includes('equipmentdrawer')) return 'inventory';
  if (normalized.includes('technique')) return 'techniques';
  if (normalized.includes('prestige')) return 'prestige';
  if (normalized.includes('settings')) return 'settings';
  if (normalized.includes('modal')) return 'modal';
  if (normalized.includes('drawer')) return 'drawer';
  if (normalized.includes('bottomtab') || normalized.includes('header') || normalized.includes('overlay')) return 'app_shell';
  return path.basename(file).replace(/\.(tsx?|jsx?)$/, '');
}

function inferSurfaceType(file: string, surfaceId: string): SurfaceType {
  if (['cultivation', 'status', 'world', 'inventory', 'techniques', 'prestige', 'settings'].includes(surfaceId)) return 'main_tab';
  if (surfaceId === 'world_building_modal') return 'world_modal';
  if (surfaceId.endsWith('_exact')) return 'exact_screen';
  if (file.includes('/modals/') || file.toLowerCase().includes('modal')) return 'modal';
  if (file.toLowerCase().includes('drawer')) return 'drawer';
  if (file.includes('/app/overlays/') || file.toLowerCase().includes('overlay') || file.toLowerCase().includes('toast')) return 'global_overlay';
  if (/AdventureScreen|AlchemyPanel|TalismanPanel|ForgeWorkshop|BountyBoardPanel|ExpeditionBoardPanel/.test(file)) return 'legacy_or_deferred';
  return 'exact_screen';
}

function inferComponent(file: string, lines: string[], lineIndex: number): string {
  for (let i = lineIndex; i >= 0; i -= 1) {
    const line = lines[i] ?? '';
    const functionMatch = line.match(/(?:export\s+)?function\s+([A-Z][A-Za-z0-9_]*)/);
    if (functionMatch) return functionMatch[1];
    const constMatch = line.match(/(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/);
    if (constMatch) return constMatch[1];
  }
  return path.basename(file).replace(/\.(tsx?|jsx?)$/, '') || 'UnknownComponent';
}

function inferRole(line: string): ElementRole {
  if (/<select\b/.test(line) || /onChange=/.test(line) && /Select|selector|duration/i.test(line)) return 'select';
  if (/<input\b/.test(line)) {
    if (/type=["']checkbox["']|type=["']range["']|aria-checked|toggle/i.test(line)) return 'toggle';
    return 'input';
  }
  if (/role=["']tab["']/.test(line)) return 'tab';
  if (/role=["']button["']/.test(line)) return 'button';
  if (/openWorldBuildingModal|openWorldModule/.test(line)) return 'world route';
  if (/setActiveTab/.test(line)) return 'tab route';
  if (/onSubmit=/.test(line)) return 'submit';
  if (/close|dismiss/i.test(line) && /button|onClick/.test(line)) return 'close button';
  if (/primary|cta|Primary|CTA/.test(line)) return 'CTA';
  if (/chip|route/i.test(line) && /button|onClick/.test(line)) return 'route chip';
  if (/onClick=|onChange=/.test(line)) return 'handler';
  return 'button';
}

function inferLabel(line: string, previousLine = '', nextLine = ''): string {
  const aria = line.match(/aria-label=["']([^"']+)["']/)?.[1];
  if (aria) return aria;
  const title = line.match(/title=["']([^"']+)["']/)?.[1];
  if (title) return title;
  const dataTestId = line.match(/data-testid=["']([^"']+)["']/)?.[1];
  if (dataTestId) return dataTestId;
  const literal = `${line} ${nextLine}`.match(/>\s*([A-Z][^<{}`]{1,80})\s*</)?.[1]?.trim();
  if (literal) return literal.replace(/\s+/g, ' ');
  const actionName = line.match(/on(?:Click|Change|Submit)=\{?([A-Za-z0-9_.]+)\}?/)?.[1];
  if (actionName) return actionName;
  const route = line.match(/buildingKey:\s*['"]([^'"]+)['"]/)?.[1] ?? line.match(/setActiveTab\(['"]([^'"]+)['"]\)/)?.[1];
  if (route) return route;
  return previousLine.trim().slice(0, 80) || line.trim().slice(0, 80) || 'Unnamed interaction';
}

function inferHandler(line: string): string {
  return (
    line.match(/onClick=\{?([A-Za-z0-9_.]+)\}?/)?.[1] ??
    line.match(/onChange=\{?([A-Za-z0-9_.]+)\}?/)?.[1] ??
    line.match(/onSubmit=\{?([A-Za-z0-9_.]+)\}?/)?.[1] ??
    line.match(/(openWorldBuildingModal|openWorldModule|setActiveTab|closeWorldBuildingModal|addNotification|setSettings|start[A-Za-z0-9_]+|stop[A-Za-z0-9_]+)/)?.[1] ??
    'inline_or_declarative'
  );
}

function inferStoreOrService(line: string, file: string): string {
  const touched = new Set<string>();
  for (const token of [
    'useUIStore',
    'useActivityStore',
    'useCombatStore',
    'useInventoryStore',
    'useEquipmentStore',
    'useTechniqueStore',
    'useTrialStore',
    'useRuinsStore',
    'useOutskirtsStore',
    'useExpeditionStore',
    'useBountyStore',
    'RewardService',
    'SaveService',
  ]) {
    if (line.includes(token) || file.toLowerCase().includes(token.replace(/^use|Store$/g, '').toLowerCase())) touched.add(token);
  }
  if (/openWorldBuildingModal|setActiveTab|closeWorldBuildingModal/.test(line)) touched.add('useUIStore');
  return touched.size > 0 ? [...touched].join(', ') : 'component local state or delegated controller';
}

function disabledReasonNearby(lines: string[], lineIndex: number): boolean {
  const windowText = lines.slice(Math.max(0, lineIndex - 4), Math.min(lines.length, lineIndex + 5)).join('\n');
  return /disabledReason|blockedReason|reason|title=|aria-describedby|tooltip|Cannot|Requires|Need |Unavailable|not available/i.test(windowText);
}

function expectedBehaviorFor(role: ElementRole, line: string): string {
  const tab = line.match(/setActiveTab\(['"]([^'"]+)['"]\)/)?.[1];
  if (tab) return `Navigate to the ${tab} tab.`;
  const building = line.match(/buildingKey:\s*['"]([^'"]+)['"]/)?.[1];
  if (building) return `Open the ${building} world module through the world-building modal.`;
  if (role === 'toggle') return 'Toggle the setting/state and immediately reflect the new value.';
  if (role === 'select') return 'Select an option and update the visible state.';
  if (role === 'input') return 'Update the query/value and refresh the visible results.';
  if (role === 'close button') return 'Close the modal, drawer, or overlay and restore the prior surface.';
  return 'Invoke the named handler and produce visible state, route, modal, or notification feedback.';
}

function keyboardPathFor(role: ElementRole): string {
  if (role === 'input' || role === 'select') return 'Tab to control, edit/change value, Enter/Space where native.';
  if (role === 'close button') return 'Tab to close button or press Escape when modal policy allows.';
  return 'Tab to control, activate with Enter or Space.';
}

function testCoverageFor(surfaceId: string, file: string): string {
  if (surfaceId === 'gate_trial_exact') return 'tests/contracts/allMenuRouteTargetsContract.test.ts; tests/contracts/GateTrialExactWorldModal.fixture.test.ts';
  if (surfaceId === 'ruins_exact') return 'tests/contracts/allMenuRouteTargetsContract.test.ts; tests/contracts/ruinsExactReviewModeContract.test.ts';
  if (file.includes('WorldBuildingModal')) return 'tests/contracts/worldBuildingModalCoherenceContract.test.ts';
  if (surfaceId === 'settings') return 'tests/e2e/menu-interactions.spec.ts';
  return 'docs/release/all-menu-function-audit.md';
}

function statusFor(file: string, line: string): MatrixStatus {
  if (/AdventureScreen|AlchemyPanel|TalismanPanel/.test(file)) return 'deferred_unreachable';
  if (file.includes('gateTrialExact') || file.includes('ruinsExact/useRuinsExactActionController') || file.includes('WorldBuildingModal') || file.includes('openWorldModule')) return 'fixed';
  if (/disabled/.test(line) && !/disabledReason|blockedReason|reason|aria-describedby|title=/.test(line)) return 'needs_manual_review';
  return 'needs_manual_review';
}

function isInteractionLine(line: string): boolean {
  if (/^\s*}\s*,\s*\[/.test(line)) return false;
  return /<button\b|role=["']button["']|onClick=|onChange=|onSubmit=|openWorldBuildingModal|openWorldModule|setActiveTab|closeWorldBuildingModal|ExactActionController/.test(line);
}

function analyzeFile(file: string, rows: MatrixRow[], findings: Finding[]) {
  const source = readFileSync(path.resolve(ROOT, file), 'utf8');
  const lines = source.split(/\r?\n/);
  const surfaceId = inferSurfaceId(file);
  const surfaceType = inferSurfaceType(file, surfaceId);
  const hasGlobalSetActiveTabBinding = /const\s+setActiveTab\s*=\s*useUIStore\(\([^)]*\)\s*=>\s*[^)]*\.setActiveTab\)/.test(source);
  const hasLocalSetActiveTabState = /const\s*\[[^\]]*,\s*setActiveTab\]\s*=\s*useState/.test(source);

  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    if (!isInteractionLine(line)) return;

    const role = inferRole(line);
    const component = inferComponent(file, lines, lineIndex);
    const label = inferLabel(line, lines[lineIndex - 1], lines[lineIndex + 1]);
    const disabledExpected = /disabled/.test(line)
      ? disabledReasonNearby(lines, lineIndex)
        ? 'Disabled state includes a nearby or programmatic reason.'
        : 'Disabled state needs manual review for a player-facing reason.'
      : 'Enabled only when handler can perform work; otherwise disabled with reason.';

    rows.push({
      surfaceId,
      surfaceType,
      file,
      component,
      elementLabel: label,
      elementRole: role,
      handlerName: inferHandler(line),
      storeOrServiceTouched: inferStoreOrService(line, file),
      expectedBehavior: expectedBehaviorFor(role, line),
      expectedUIFeedback: role === 'world route' || role === 'tab route' ? 'Target tab/module becomes visible.' : 'Visible state, notification, modal, or disabled reason changes.',
      disabledStateExpected: disabledExpected,
      keyboardPathExpected: keyboardPathFor(role),
      testCoverageFile: testCoverageFor(surfaceId, file),
      status: statusFor(file, line),
      notes: `Static inventory line ${lineNumber}; verify dynamically for final release signoff.`,
    });

    const tabTarget = line.match(/setActiveTab\(['"]([^'"]+)['"]\)/)?.[1];
    const isGlobalSetActiveTab =
      line.includes('useUIStore.getState().setActiveTab') ||
      (hasGlobalSetActiveTabBinding && !hasLocalSetActiveTabState);
    if (tabTarget && isGlobalSetActiveTab && !VALID_TABS.has(tabTarget)) {
      findings.push({
        severity: 'blocker',
        code: 'invalid_tab_target',
        file,
        line: lineNumber,
        message: `setActiveTab target "${tabTarget}" is not in the GameTab union.`,
        excerpt: line.trim(),
      });
    }

    const buildingTarget = line.match(/buildingKey:\s*['"]([^'"]+)['"]/)?.[1];
    if (buildingTarget && !LIVE_WORLD_KEYS.has(buildingTarget)) {
      findings.push({
        severity: DEFERRED_WORLD_KEYS.has(buildingTarget) ? 'warning' : 'blocker',
        code: DEFERRED_WORLD_KEYS.has(buildingTarget) ? 'deferred_world_module_route' : 'unknown_world_module_route',
        file,
        line: lineNumber,
        message: `World module route targets "${buildingTarget}", which is not a live world modal key.`,
        excerpt: line.trim(),
      });
    }

    if (/<button\b/.test(line) && /disabled/.test(line) && !disabledReasonNearby(lines, lineIndex)) {
      findings.push({
        severity: 'warning',
        code: 'disabled_button_reason_review',
        file,
        line: lineNumber,
        message: 'Disabled button does not have an obvious nearby player-facing reason in static scan.',
        excerpt: line.trim(),
      });
    }

    if (/fixture/i.test(line) && !/forceFixture|ExactMode|mode === 'fixture'|fixture mode|fixture preview/i.test(line)) {
      findings.push({
        severity: 'warning',
        code: 'fixture_text_review',
        file,
        line: lineNumber,
        message: 'Fixture wording appears near an interaction; confirm it is not live player-facing text.',
        excerpt: line.trim(),
      });
    }
  });

  lines.forEach((line, lineIndex) => {
    if (!file.includes('/stores/') && /\b(city|trial|heart_law|manual|item|enemy|realm)_[a-z0-9_]+/.test(line) && /return|label|title|button|aria-label|<p|<span|<div/.test(line)) {
      findings.push({
        severity: 'warning',
        code: 'raw_internal_id_review',
        file,
        line: lineIndex + 1,
        message: 'Potential raw internal ID near render text; confirm formatter/sanitizer covers it.',
        excerpt: line.trim().slice(0, 180),
      });
    }
  });
}

const rows: MatrixRow[] = [];
const findings: Finding[] = [];
const files = [...new Set(SOURCE_ROOTS.flatMap((root) => walkFiles(root)))].sort();

for (const file of files) {
  analyzeFile(file, rows, findings);
}

const blockers = findings.filter((finding) => finding.severity === 'blocker');
const warnings = findings.filter((finding) => finding.severity === 'warning');
const generatedAt = new Date().toISOString();
const report = {
  generatedAt,
  sourceRoots: SOURCE_ROOTS,
  summary: {
    filesScanned: files.length,
    interactionsInventoried: rows.length,
    blockers: blockers.length,
    warnings: warnings.length,
  },
  blockers,
  warnings,
  findings,
  rows,
};

mkdirSync(path.dirname(path.resolve(ROOT, REPORT_PATH)), { recursive: true });
writeFileSync(path.resolve(ROOT, REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(path.resolve(ROOT, MATRIX_PATH), `${JSON.stringify({ generatedAt, rows }, null, 2)}\n`);

console.log(`[MenuInteractionAudit] scanned ${files.length} files; inventoried ${rows.length} interactions.`);
console.log(`[MenuInteractionAudit] blockers=${blockers.length}; warnings=${warnings.length}.`);
console.log(`[MenuInteractionAudit] wrote ${REPORT_PATH}`);
console.log(`[MenuInteractionAudit] wrote ${MATRIX_PATH}`);

if (blockers.length > 0) {
  blockers.forEach((finding) => {
    console.error(`[${finding.code}] ${finding.file}:${finding.line} ${finding.message}`);
  });
  process.exit(1);
}
