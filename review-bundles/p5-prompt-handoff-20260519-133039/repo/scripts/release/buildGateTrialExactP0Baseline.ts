import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditPhase6CombatEvidence } from './validatePhase6CombatEvidence.js';
import { PHASE6_COMBAT_CAPTURE_SLOT_FILES } from '../../src/dev/phase6CombatAudit/phase6CombatSurfaceIds.js';

const OUT_ROOT = 'docs/release/qa/ui-cutover/gate-trial-exact/p0-freeze';
const RAW_EVIDENCE_FOLDER = 'docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial';
const CAPTURE_ATTEMPT_PATH = `${OUT_ROOT}/gateTrialExactP0CaptureAttempt.json`;

interface CaptureAttemptRecord {
  schemaVersion: 'gate-trial-exact-p0-capture-attempt.v1';
  generatedAt: string;
  command: string;
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

interface GateTrialExactP0BaselineReport {
  schemaVersion: 'gate-trial-exact-p0-baseline.v1';
  generatedAt: string;
  packetId: 'G11';
  packetObjective: string;
  dependencies: string[];
  exactFileTouchpoints: string[];
  currentPrimaryOwnerFiles: string[];
  currentSupportingTouchpoints: string[];
  mockupRegionContract: {
    viewport: '2048x1152';
    requiredRegions: string[];
    requiredTextMarkers: string[];
    forbiddenLegacyMarkers: string[];
    geometryRules: string[];
  };
  evidenceCoverageStatus: {
    canonicalRawFolder: string;
    requiredSlots: string[];
    presentSlots: string[];
    missingSlots: string[];
    requiredDomAudits: string[];
    presentDomAudits: string[];
    missingDomAudits: string[];
    auditPass: boolean;
    auditFindings: string[];
    screenshotsCapturedInThisRun: boolean;
    screenshotCaptureStatus: 'captured' | 'pending';
    finalScenicArtStatus: 'approved-bound' | 'deferred' | 'unknown';
    strictVisualParityBlockedByDeferredArt: boolean;
    captureAttempt: {
      attempted: boolean;
      generatedAt: string | null;
      command: string | null;
      ok: boolean | null;
      failureReason: string | null;
    };
  };
  regenerationCommands: {
    capture: string;
    audit: string;
    report: string;
    typecheck: string;
    iconCheck: string;
  };
  manualQaCases: string[];
  noGoRules: string[];
}

function parseArgs(argv: string[]) {
  const json = argv.includes('--json');
  const write = argv.includes('--write');
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  const rootDir = rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd();
  return { json, write, rootDir };
}

function readCaptureAttempt(rootDir: string): CaptureAttemptRecord | null {
  const attemptPath = path.resolve(rootDir, CAPTURE_ATTEMPT_PATH);
  if (!fs.existsSync(attemptPath)) return null;
  const parsed = JSON.parse(fs.readFileSync(attemptPath, 'utf8')) as CaptureAttemptRecord;
  if (parsed?.schemaVersion !== 'gate-trial-exact-p0-capture-attempt.v1') return null;
  return parsed;
}

function firstMeaningfulLine(value: string): string | null {
  const lines = value
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return lines.find((entry) => entry.includes('[phase6-combat-capture] failed:'))
    ?? lines.find((entry) => entry.includes('[gate-trial-exact-p0-capture] capture failed.'))
    ?? lines.find((entry) => entry.includes('is not recognized as an internal or external command'))
    ?? lines.find((entry) => entry.includes('Playwright is required'))
    ?? lines.find((entry) => !entry.startsWith('(node:') && !entry.startsWith('--import '))
    ?? lines[0]
    ?? null;
}

function computeEvidenceCoverage(rootDir: string) {
  const folderPath = path.resolve(rootDir, RAW_EVIDENCE_FOLDER);
  const requiredSlots = [...PHASE6_COMBAT_CAPTURE_SLOT_FILES];
  const requiredDomAudits = requiredSlots.map((slot) => slot.replace('.png', '.dom.json'));
  const presentSlots = requiredSlots.filter((slot) => fs.existsSync(path.join(folderPath, slot)));
  const presentDomAudits = requiredDomAudits.filter((dom) => fs.existsSync(path.join(folderPath, dom)));
  return {
    requiredSlots,
    presentSlots,
    missingSlots: requiredSlots.filter((slot) => !presentSlots.includes(slot)),
    requiredDomAudits,
    presentDomAudits,
    missingDomAudits: requiredDomAudits.filter((dom) => !presentDomAudits.includes(dom)),
  };
}

function readFinalScenicArtStatus(rootDir: string): {
  finalScenicArtStatus: 'approved-bound' | 'deferred' | 'unknown';
  strictVisualParityBlockedByDeferredArt: boolean;
} {
  const folderPath = path.resolve(rootDir, RAW_EVIDENCE_FOLDER);
  let sawAudit = false;
  let sawApproved = false;
  let sawDeferred = false;
  let sawUnapproved = false;

  for (const slot of PHASE6_COMBAT_CAPTURE_SLOT_FILES) {
    const domPath = path.join(folderPath, slot.replace('.png', '.dom.json'));
    if (!fs.existsSync(domPath)) continue;
    try {
      const audit = JSON.parse(fs.readFileSync(domPath, 'utf8')) as any;
      sawAudit = true;
      if (audit?.artStatus?.dataArtStatus === 'approved-bound') sawApproved = true;
      if (audit?.artStatus?.dataArtStatus === 'deferred') sawDeferred = true;
      if (audit?.artStatus?.dataFinalArtRequired === 'true') sawDeferred = true;
      if (audit?.artStatus?.dataApprovedPlateBound !== 'true') sawUnapproved = true;
    } catch {
      sawUnapproved = true;
    }
  }

  const finalScenicArtStatus = sawDeferred ? 'deferred' : sawApproved ? 'approved-bound' : 'unknown';
  return {
    finalScenicArtStatus: sawAudit ? finalScenicArtStatus : 'unknown',
    strictVisualParityBlockedByDeferredArt: !sawAudit || sawDeferred || sawUnapproved,
  };
}

export function buildGateTrialExactP0Baseline(rootDir: string): GateTrialExactP0BaselineReport {
  const coverage = computeEvidenceCoverage(rootDir);
  const audit = auditPhase6CombatEvidence(rootDir, ['gate-trial']);
  const attempt = readCaptureAttempt(rootDir);
  const screenshotsCapturedInThisRun = Boolean(attempt?.ok);
  const screenshotCaptureStatus = coverage.missingSlots.length === 0 ? 'captured' : 'pending';
  const failureReason = attempt && !attempt.ok
    ? firstMeaningfulLine(attempt.stderr) ?? firstMeaningfulLine(attempt.stdout) ?? 'Capture failed without stderr details.'
    : null;
  const scenicArt = readFinalScenicArtStatus(rootDir);

  return {
    schemaVersion: 'gate-trial-exact-p0-baseline.v1',
    generatedAt: new Date().toISOString(),
    packetId: 'G11',
    packetObjective: 'add screenshot capture, DOM audit, evidence validation, and baseline reporting for Gate Trial Exact visual regression gates',
    dependencies: [
      'G0-B fixture surface',
      'G2-R screen-owned fixture route activation',
      'G3 top parity',
      'G4 side rails',
      'G5 central scene',
      'G6 bottom rail/CTA',
      'G7 live surface',
      'G8 action controller',
      'G9 active theater',
      'G10 result transitions',
    ],
    exactFileTouchpoints: [
      'src/features/world/gateTrialExact/GateTrialExactScreen.ts',
      'src/features/world/gateTrialExact/GateTrialExactScreen.scss',
      'src/features/world/gateTrialExact/buildGateTrialExactSurface.ts',
      'src/features/world/gateTrialExact/GateTrialScreenOwner.tsx',
      'src/features/world/gateTrialExact/useGateTrialExactActionController.ts',
      'src/systems/ui/world/worldBuildingModalEntrySurface.ts',
      'src/components/modals/WorldBuildingModal.tsx',
      'src/components/modals/WorldBuildingModal.scss',
    ],
    currentPrimaryOwnerFiles: [
      'src/features/world/gateTrialExact/GateTrialScreenOwner.tsx',
      'src/features/world/gateTrialExact/GateTrialExactScreen.ts',
      'src/features/world/gateTrialExact/buildGateTrialExactSurface.ts',
    ],
    currentSupportingTouchpoints: [
      'src/features/world/gateTrialExact/gateTrialExactTypes.ts',
      'src/features/world/gateTrialExact/gateTrialExactPresentation.ts',
      'src/features/world/gateTrialExact/gateTrialExactAssetRegistry.ts',
      'src/features/world/gateTrialExact/useGateTrialExactActionController.ts',
      'src/dev/phase6CombatAudit/Phase6CombatAuditHarness.tsx',
      'scripts/release/capturePhase6CombatEvidence.ts',
      'scripts/release/validatePhase6CombatEvidence.ts',
    ],
    mockupRegionContract: {
      viewport: '2048x1152',
      requiredRegions: [
        'top title/tactical strip',
        'left Minimum Checklist',
        'central Foundation Gate scene',
        'Foundation Gate plaque',
        'VIABLE readiness seal',
        'guardian reward plaque',
        'right Recommended panel',
        'Trial Summary dock',
        'Foundation Gate Readiness rail',
        'Attempt Gate CTA',
      ],
      requiredTextMarkers: [
        'Gate Trial',
        'Foundation Gate',
        'Minimum Checklist',
        'Recommended',
        'Trial Summary',
        'Foundation Gate Readiness',
        'Attempt Gate',
        'VIABLE',
        'Readiness 74 / 100',
        'Gate Guardian',
        'Gate Foundation Pill',
        'Safety Net',
        'Top Fixes',
      ],
      forbiddenLegacyMarkers: [
        'Run Compass unavailable.',
        'Best used when you are ready',
        'Minimum Floor',
        'Recommended Floor',
        'Gate Progress',
        'GateTrialWorldLayout',
        'GateTrialAttemptCluster',
        'worldBuildingBody--combat-path',
        'worldBuildingBody--inside-dungeon',
      ],
      geometryRules: [
        'leftRailLeftOfScenic',
        'rightRailRightOfScenic',
        'summaryRightOfScenic',
        'railAboveCta',
        'ctaWithinViewport',
        'centerDominatesWidth',
        'noVerticalPageScroll',
      ],
    },
    evidenceCoverageStatus: {
      canonicalRawFolder: RAW_EVIDENCE_FOLDER,
      requiredSlots: coverage.requiredSlots,
      presentSlots: coverage.presentSlots,
      missingSlots: coverage.missingSlots,
      requiredDomAudits: coverage.requiredDomAudits,
      presentDomAudits: coverage.presentDomAudits,
      missingDomAudits: coverage.missingDomAudits,
      auditPass: audit.overallPass,
      auditFindings: audit.findings.map((finding) => `[${finding.severity}] ${finding.code}: ${finding.message}`),
      screenshotsCapturedInThisRun,
      screenshotCaptureStatus,
      finalScenicArtStatus: scenicArt.finalScenicArtStatus,
      strictVisualParityBlockedByDeferredArt: scenicArt.strictVisualParityBlockedByDeferredArt,
      captureAttempt: {
        attempted: Boolean(attempt),
        generatedAt: attempt?.generatedAt ?? null,
        command: attempt?.command ?? null,
        ok: attempt ? attempt.ok : null,
        failureReason,
      },
    },
    regenerationCommands: {
      capture: 'npm run release:gate-trial-exact-p0:capture',
      audit: 'npm run release:gate-trial-exact-p0:audit',
      report: 'npm run release:gate-trial-exact-p0:report',
      typecheck: 'npm run typecheck',
      iconCheck: 'npm run check:icons',
    },
    manualQaCases: [
      '01-base.png fixture planning state at 2048x1152',
      '02-interaction.png live active attempt with central active theater',
      '03-truth-states.png defeat/fail-safe/result truth state',
      '04-high-fx.png fixture high FX',
      '05-low-fx.png fixture low FX',
      '06-reduced-motion.png fixture reduced motion',
    ],
    noGoRules: [
      'No legacy GateTrialWorldLayout visible.',
      'No combat-path shell for Gate Trial Exact fixture.',
      'No external CombatTheaterModal in exact flow.',
      'No Outskirts hunt copy.',
      'No Ruins chamber-route copy except intentional "Complete one Ruin support run".',
      'No CTA clipping.',
      'No page scroll in 2048x1152 fixture capture.',
      'No final visual parity claim while scenic art is deferred.',
    ],
  };
}

function toHumanReport(report: GateTrialExactP0BaselineReport): string {
  const lines: string[] = [
    '=== Gate Trial Exact P0 Baseline ===',
    `generatedAt: ${report.generatedAt}`,
    `packetId: ${report.packetId}`,
    `captureStatus: ${report.evidenceCoverageStatus.screenshotCaptureStatus}`,
    `auditPass: ${report.evidenceCoverageStatus.auditPass ? 'PASS' : 'FAIL'}`,
    `finalScenicArtStatus: ${report.evidenceCoverageStatus.finalScenicArtStatus}`,
    `strictVisualParityBlockedByDeferredArt: ${report.evidenceCoverageStatus.strictVisualParityBlockedByDeferredArt ? 'true' : 'false'}`,
    '',
    'Missing screenshot slots:',
    ...(report.evidenceCoverageStatus.missingSlots.length > 0 ? report.evidenceCoverageStatus.missingSlots.map((slot) => `- ${slot}`) : ['- none']),
    '',
    'Missing DOM audits:',
    ...(report.evidenceCoverageStatus.missingDomAudits.length > 0 ? report.evidenceCoverageStatus.missingDomAudits.map((slot) => `- ${slot}`) : ['- none']),
    '',
    'Audit findings:',
    ...(report.evidenceCoverageStatus.auditFindings.length > 0 ? report.evidenceCoverageStatus.auditFindings.map((finding) => `- ${finding}`) : ['- none']),
  ];
  return lines.join('\n');
}

function isMainModule(): boolean {
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '');
}

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  const report = buildGateTrialExactP0Baseline(args.rootDir);

  if (args.write) {
    const outPath = path.resolve(args.rootDir, OUT_ROOT, 'gateTrialExactP0Baseline.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(toHumanReport(report));
  }
}
