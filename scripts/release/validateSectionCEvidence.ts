import fs from 'node:fs';
import path from 'node:path';
import { SECTION_C_EVIDENCE_TARGETS, type SectionCEvidenceTarget } from '../../src/dev/sectionCAudit/sectionCEvidenceManifest.js';

interface SectionCEvidenceFinding {
  surfaceId: string;
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

interface SectionCEvidenceAuditReport {
  schemaVersion: 'section-c-evidence-audit.v1';
  generatedAt: string;
  overallPass: boolean;
  targetCount: number;
  findings: SectionCEvidenceFinding[];
}

const REQUIRED_BASE_SLOTS = ['01-base.png', '04-high-fx.png', '05-low-fx.png', '06-reduced-motion.png'] as const;

function parseArgs(argv: string[]) {
  const json = argv.includes('--json');
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  const rootDir = rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd();
  return { json, rootDir };
}

function readTextIfExists(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function hasExplicitNa(readmeText: string, slot: '02-interaction.png' | '03-truth-states.png'): boolean {
  const escapedSlot = slot.replace('.', '\\.');
  const slotPattern = new RegExp('`' + escapedSlot + '`\\s+—\\s+\\*\\*N\\/A', 'i');
  return slotPattern.test(readmeText);
}

function validateRouteShape(target: SectionCEvidenceTarget, findings: SectionCEvidenceFinding[]) {
  (['high', 'low', 'reduced'] as const).forEach((fx) => {
    const route = target.captureRoutes[fx];
    if (!route.includes(`surface=${target.id}`) || !route.includes(`fx=${fx}`) || !route.includes('uiAudit=section-c')) {
      findings.push({
        surfaceId: target.id,
        severity: 'error',
        code: 'capture_route_invalid',
        message: `Capture route for fx=${fx} is invalid: ${route}`,
      });
    }
  });
}

export function auditSectionCEvidence(rootDir: string): SectionCEvidenceAuditReport {
  const findings: SectionCEvidenceFinding[] = [];

  for (const target of SECTION_C_EVIDENCE_TARGETS) {
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
    const readmeText = readTextIfExists(readmePath);
    if (!readmeText) {
      findings.push({
        surfaceId: target.id,
        severity: 'error',
        code: 'readme_missing',
        message: `README.md is missing for ${target.evidenceFolder}`,
      });
      continue;
    }

    for (const requiredFile of REQUIRED_BASE_SLOTS) {
      const requiredPath = path.join(folderPath, requiredFile);
      if (!fs.existsSync(requiredPath)) {
        findings.push({
          surfaceId: target.id,
          severity: 'error',
          code: 'required_slot_missing',
          message: `Missing required evidence file ${path.posix.join(target.evidenceFolder, requiredFile)}`,
        });
      }
    }

    const interactionPath = path.join(folderPath, '02-interaction.png');
    if (target.interactionRequired) {
      if (!fs.existsSync(interactionPath)) {
        findings.push({
          surfaceId: target.id,
          severity: 'error',
          code: 'interaction_slot_missing',
          message: `Missing required interaction evidence ${path.posix.join(target.evidenceFolder, '02-interaction.png')}`,
        });
      }
    } else if (!fs.existsSync(interactionPath) && !hasExplicitNa(readmeText, '02-interaction.png')) {
      findings.push({
        surfaceId: target.id,
        severity: 'error',
        code: 'interaction_na_not_documented',
        message: '02-interaction.png is optional here, but README does not explicitly mark it as N/A.',
      });
    }

    const truthPath = path.join(folderPath, '03-truth-states.png');
    if (target.truthStatesRequired) {
      if (!fs.existsSync(truthPath)) {
        findings.push({
          surfaceId: target.id,
          severity: 'error',
          code: 'truth_slot_missing',
          message: `Missing required truth-state evidence ${path.posix.join(target.evidenceFolder, '03-truth-states.png')}`,
        });
      }
    } else if (!fs.existsSync(truthPath) && !hasExplicitNa(readmeText, '03-truth-states.png')) {
      findings.push({
        surfaceId: target.id,
        severity: 'error',
        code: 'truth_na_not_documented',
        message: '03-truth-states.png is optional here, but README does not explicitly mark it as N/A.',
      });
    }
  }

  return {
    schemaVersion: 'section-c-evidence-audit.v1',
    generatedAt: new Date().toISOString(),
    overallPass: findings.length === 0,
    targetCount: SECTION_C_EVIDENCE_TARGETS.length,
    findings,
  };
}

function renderHumanReport(report: SectionCEvidenceAuditReport): string {
  const header = [
    '=== Section C Evidence Audit ===',
    `generatedAt: ${report.generatedAt}`,
    `overallPass: ${report.overallPass ? 'PASS' : 'FAIL'}`,
    `targetCount: ${report.targetCount}`,
    `findings: ${report.findings.length}`,
    '',
  ];

  if (report.findings.length === 0) {
    header.push('All required Section C evidence files are present and valid.');
    return header.join('\n');
  }

  const grouped = report.findings.map((finding) =>
    `- [${finding.severity}] ${finding.surfaceId} :: ${finding.code} :: ${finding.message}`,
  );

  return [...header, 'Findings:', ...grouped].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { json, rootDir } = parseArgs(process.argv.slice(2));
  const report = auditSectionCEvidence(rootDir);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderHumanReport(report));
  }

  if (!report.overallPass) {
    process.exitCode = 1;
  }
}
