import fs from 'node:fs';
import path from 'node:path';
import { PHASE6_COMBAT_EVIDENCE_TARGETS, type Phase6CombatEvidenceTarget } from '../../src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.js';
import { PHASE6_COMBAT_CAPTURE_SLOT_FILES } from '../../src/dev/phase6CombatAudit/phase6CombatSurfaceIds.js';

interface Phase6CombatEvidenceFinding {
  surfaceId: string;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

interface Phase6CombatEvidenceAuditReport {
  schemaVersion: 'phase-6-combat-evidence-audit.v1';
  generatedAt: string;
  overallPass: boolean;
  targetCount: number;
  findings: Phase6CombatEvidenceFinding[];
}

function parseArgs(argv: string[]) {
  const json = argv.includes('--json');
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  const surfaceArg = argv.find((arg) => arg.startsWith('--surface='));
  const surfacesArg = argv.find((arg) => arg.startsWith('--surfaces='));
  const surfaceCsv = surfacesArg ? surfacesArg.slice('--surfaces='.length) : surfaceArg ? surfaceArg.slice('--surface='.length) : '';
  const surfaceIds = surfaceCsv
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return {
    json,
    rootDir: rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd(),
    surfaceIds: surfaceIds.length > 0 ? [...new Set(surfaceIds)] : null,
  };
}

function resolveAuditTargets(surfaceIds: string[] | null): readonly Phase6CombatEvidenceTarget[] {
  if (!surfaceIds) return PHASE6_COMBAT_EVIDENCE_TARGETS;
  const targetById = new Map(PHASE6_COMBAT_EVIDENCE_TARGETS.map((target) => [target.id, target]));
  const unknown = surfaceIds.filter((surfaceId) => !targetById.has(surfaceId));
  if (unknown.length > 0) {
    throw new Error(`Unknown phase-6-combat surface id(s): ${unknown.join(', ')}`);
  }
  return surfaceIds.map((surfaceId) => targetById.get(surfaceId)!);
}

function validateRouteShape(target: Phase6CombatEvidenceTarget, findings: Phase6CombatEvidenceFinding[]) {
  (['high', 'low', 'reduced'] as const).forEach((fx) => {
    const route = target.captureRoutes[fx];
    if (!route.includes(`surface=${target.id}`) || !route.includes(`fx=${fx}`) || !route.includes('uiAudit=phase-6-combat')) {
      findings.push({
        surfaceId: target.id,
        severity: 'error',
        code: 'capture_route_invalid',
        message: `Capture route for fx=${fx} is invalid: ${route}`,
      });
    }
  });
}

function validateRuinsDomAudit(folderPath: string, slotFile: string, findings: Phase6CombatEvidenceFinding[]) {
  const domPath = path.join(folderPath, slotFile.replace('.png', '.dom.json'));
  if (!fs.existsSync(domPath)) return;
  const audit = JSON.parse(fs.readFileSync(domPath, 'utf8')) as any;
  const requiredMarkers = ['spiritLeaf', 'beastMaterials', 'guaranteedAnchor', 'coreFragment', 'rarePity', 'autoRepeatOff', 'route', 'cta', 'summary'];
  for (const marker of requiredMarkers) {
    if (!audit?.textMarkers?.[marker]) {
      findings.push({ surfaceId: 'ruins', severity: 'error', code: 'ruins_truth_marker_missing', message: `Ruins dom audit missing text marker: ${marker} (${path.basename(domPath)})` });
    }
  }
  if ((audit?.forbiddenOldShellMarkers?.length ?? 0) > 0) {
    findings.push({ surfaceId: 'ruins', severity: 'error', code: 'ruins_old_shell_marker', message: `Ruins dom audit found forbidden old-shell markers: ${audit.forbiddenOldShellMarkers.join(', ')}` });
  }
}

export function auditPhase6CombatEvidence(rootDir: string, surfaceIds: string[] | null = null): Phase6CombatEvidenceAuditReport {
  const findings: Phase6CombatEvidenceFinding[] = [];
  const targets = resolveAuditTargets(surfaceIds);

  for (const target of targets) {
    validateRouteShape(target, findings);
    const folderPath = path.resolve(rootDir, target.evidenceFolder);
    if (!fs.existsSync(folderPath)) {
      findings.push({
        surfaceId: target.id,
        severity: 'error',
        code: 'evidence_folder_missing',
        message: `Evidence folder is missing: ${target.evidenceFolder}`,
      });
      continue;
    }

    const readmePath = path.join(folderPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      findings.push({
        surfaceId: target.id,
        severity: 'error',
        code: 'readme_missing',
        message: `README.md is missing for ${target.evidenceFolder}`,
      });
    }
    if (target.id === 'ruins' && fs.existsSync(readmePath)) {
      const text = fs.readFileSync(readmePath, 'utf8');
      if (!text.includes('Ruins Exact')) {
        findings.push({ surfaceId: target.id, severity: 'error', code: 'ruins_readme_not_exact', message: '02-ruins README must describe Ruins Exact evidence target.' });
      }
    }

    for (const slotFile of PHASE6_COMBAT_CAPTURE_SLOT_FILES) {
      const slotPath = path.join(folderPath, slotFile);
      if (!fs.existsSync(slotPath)) {
        findings.push({
          surfaceId: target.id,
          severity: 'error',
          code: 'required_slot_missing',
          message: `Missing required evidence file ${path.posix.join(target.evidenceFolder, slotFile)}`,
        });
      }
      if (target.id === 'ruins') {
        validateRuinsDomAudit(folderPath, slotFile, findings);
      }
    }
  }

  return {
    schemaVersion: 'phase-6-combat-evidence-audit.v1',
    generatedAt: new Date().toISOString(),
    overallPass: findings.length === 0,
    targetCount: targets.length,
    findings,
  };
}

function renderHumanReport(report: Phase6CombatEvidenceAuditReport): string {
  const lines = [
    '=== Phase 6 Combat Evidence Audit ===',
    `generatedAt: ${report.generatedAt}`,
    `overallPass: ${report.overallPass ? 'PASS' : 'FAIL'}`,
    `targetCount: ${report.targetCount}`,
    `findings: ${report.findings.length}`,
    '',
  ];

  if (report.findings.length === 0) {
    lines.push('All required Phase 6 combat evidence files are present and valid.');
    return lines.join('\n');
  }

  lines.push('Findings:');
  report.findings.forEach((finding) => {
    lines.push(`- [${finding.severity}] ${finding.surfaceId} :: ${finding.code} :: ${finding.message}`);
  });
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { json, rootDir, surfaceIds } = parseArgs(process.argv.slice(2));
  const report = auditPhase6CombatEvidence(rootDir, surfaceIds);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderHumanReport(report));
  }

  if (!report.overallPass) {
    process.exitCode = 1;
  }
}
