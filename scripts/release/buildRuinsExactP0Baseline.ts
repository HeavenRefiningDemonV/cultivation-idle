import fs from 'node:fs';
import path from 'node:path';
import { buildPhase6CombatPreflightReport } from './buildPhase6CombatPreflightReport.js';
import { auditPhase6CombatEvidence } from './validatePhase6CombatEvidence.js';
import { PHASE6_COMBAT_CAPTURE_SLOT_FILES } from '../../src/dev/phase6CombatAudit/phase6CombatSurfaceIds.js';

const OUT_ROOT = 'docs/release/qa/ui-cutover/ruins-exact/p0-freeze';
const RAW_EVIDENCE_FOLDER = 'docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins';
const CAPTURE_ATTEMPT_PATH = `${OUT_ROOT}/ruinsExactP0CaptureAttempt.json`;

interface CaptureAttemptRecord {
  schemaVersion: 'ruins-exact-p0-capture-attempt.v1';
  generatedAt: string;
  command: string;
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

interface RuinsExactP0BaselineReport {
  schemaVersion: 'ruins-exact-p0-baseline.v1';
  generatedAt: string;
  packetId: 'P0';
  packetObjective: string;
  whyNow: string;
  dependencies: string[];
  exactFileTouchpoints: string[];
  currentPrimaryOwnerFiles: string[];
  currentSupportingTouchpoints: string[];
  currentVisibleTruthSurfaces: string[];
  mustPreserveRules: string[];
  noGoRules: string[];
  knownCopyAndCtaDrift: string[];
  knownParityAndOwnerAmbiguities: string[];
  knownRenderedRegressionsVsExactMockupTarget: string[];
  evidenceCoverageStatus: {
    canonicalRawFolder: string;
    requiredSlots: string[];
    presentSlots: string[];
    missingSlots: string[];
    auditPass: boolean;
    auditFindings: string[];
    screenshotsCapturedInThisRun: boolean;
    screenshotCaptureStatus: 'captured' | 'pending';
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
  };
  developerRuleNote: string;
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
  const parsed = JSON.parse(fs.readFileSync(attemptPath, 'utf-8')) as CaptureAttemptRecord;
  if (parsed?.schemaVersion !== 'ruins-exact-p0-capture-attempt.v1') return null;
  return parsed;
}

function firstMeaningfulLine(value: string): string | null {
  const lines = value
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const preferred =
    lines.find((entry) => entry.includes('[phase6-combat-capture] failed:'))
    ?? lines.find((entry) => entry.includes('[ruins-exact-p0-capture] capture failed.'))
    ?? lines.find((entry) => !entry.startsWith('(node:') && !entry.startsWith('--import '))
    ?? lines[0];

  return preferred ?? null;
}

function buildRuinsExactP0Baseline(rootDir: string): RuinsExactP0BaselineReport {
  const phase6 = buildPhase6CombatPreflightReport(rootDir);
  const coverage = phase6.screenshotCoverage.find((entry) => entry.surfaceId === 'ruins');
  if (!coverage) {
    throw new Error('Ruins screenshot coverage was not found in phase-6 preflight report builder output.');
  }

  const audit = auditPhase6CombatEvidence(rootDir, ['ruins']);
  const attempt = readCaptureAttempt(rootDir);
  const screenshotsCapturedInThisRun = Boolean(attempt?.ok);
  const screenshotCaptureStatus = coverage.missingSlots.length === 0 ? 'captured' : 'pending';
  const failureReason = attempt && !attempt.ok
    ? firstMeaningfulLine(attempt.stderr) ?? firstMeaningfulLine(attempt.stdout) ?? 'Capture failed without stderr details.'
    : null;

  return {
    schemaVersion: 'ruins-exact-p0-baseline.v1',
    generatedAt: new Date().toISOString(),
    packetId: 'P0',
    packetObjective: 'freeze current live Ruins baseline and lock approved exact mockup target before visual/shell packets begin',
    whyNow: 'later packets will replace combat-path presentation with full-screen exact Ruins composition, so current truth must be recorded first',
    dependencies: [
      'scripts/release/capturePhase6CombatEvidence.ts',
      'scripts/release/validatePhase6CombatEvidence.ts',
      'scripts/release/buildPhase6CombatPreflightReport.ts',
      'src/dev/phase6CombatAudit/Phase6CombatAuditHarness.tsx',
      'src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.ts',
      'src/dev/phase6CombatAudit/phase6CombatSurfaceIds.ts',
      'docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/README.md',
    ],
    exactFileTouchpoints: [
      'src/components/screens/world/buildings/RuinsBuildingPanel.tsx',
      'src/ui/world/RuinsSummaryCard.tsx',
      'src/ui/world/TrackedBountyProgressLine.tsx',
      'src/ui/status/RunCompassCompact.tsx',
      'src/ui/world/combat/CombatModuleTopLane.tsx',
      'src/ui/world/combat/combatModuleTopLaneModel.ts',
      'src/components/screens/world/buildings/CombatStyles.scss',
      'src/components/modals/WorldBuildingModal.tsx',
      'src/systems/world/moduleCardRegistry.ts',
      'src/systems/economy/activityRewardReadModel.ts',
      'src/ui/world/buildRuinsInformationHierarchySurface.ts',
      'src/ui/world/buildRuinsActionStripState.ts',
      'src/ui/world/buildRuinsSupportContextSurface.ts',
      'src/ui/world/buildRuinsFxProfile.ts',
    ],
    currentPrimaryOwnerFiles: [
      'src/components/modals/WorldBuildingModal.tsx',
      'src/components/screens/world/buildings/RuinsBuildingPanel.tsx',
      'src/ui/world/RuinsSummaryCard.tsx',
      'src/ui/world/combat/CombatModuleTopLane.tsx',
    ],
    currentSupportingTouchpoints: [
      'src/ui/status/RunCompassCompact.tsx',
      'src/ui/world/TrackedBountyProgressLine.tsx',
      'src/ui/world/combat/combatModuleTopLaneModel.ts',
      'src/systems/world/moduleCardRegistry.ts',
      'src/systems/economy/activityRewardReadModel.ts',
      'src/ui/world/buildRuinsInformationHierarchySurface.ts',
      'src/ui/world/buildRuinsActionStripState.ts',
      'src/ui/world/buildRuinsSupportContextSurface.ts',
      'src/ui/world/buildRuinsFxProfile.ts',
    ],
    currentVisibleTruthSurfaces: [
      'RunCompassCompact appears in top lane as compact routing truth.',
      'Ruins role tag / best-used / boundary lines are shown in RuinsSummaryCard and sourced from activityRewardReadModel constants.',
      'TrackedBountyProgressLine appears when tracked bounty overlaps RUINS_CLEAR or RUINS_BOSS.',
      'AI posture hint affordance appears via RuinsSummaryCard recommendation line and secondary posture line.',
      'HP bars and active enemy interaction truth are shown via InkHealthBar and enemy name in active fight state.',
      'CTA semantics are Start/Stop from buildRuinsActionStripState primaryActionLabel.',
      'Support/utility surfaces include route hints, bounty reward summary, combat options controls, and utility tray context blocks.',
    ],
    mustPreserveRules: [
      'Preserve current Ruins role, best-used-when, and boundary copy lines exactly.',
      'Preserve current combat interaction truth surfaces (HP bars, active enemy, combat state affordances).',
      'Preserve tracked bounty and AI hint affordances as explicit truth surfaces during exact rebuild.',
      'Preserve canonical evidence slot model and canonical raw screenshot folder.',
    ],
    noGoRules: [
      'Do not redesign or refactor current Ruins visuals in P0.',
      'Do not change Ruins reward, readiness, combat, or routing semantics in P0.',
      'Do not start exact-mockup page implementation or shell convergence packets in P0.',
      'Do not treat current combat-shell composition as future design authority; it is baseline evidence only.',
    ],
    knownCopyAndCtaDrift: [
      'World card CTA is "Open Ruins" while panel primary CTA reads "Start" (plus stateful "Stop").',
    ],
    knownParityAndOwnerAmbiguities: [
      'Current Ruins screen is composed inside WorldBuildingModal and InkCombatShell-oriented ownership, creating owner ambiguity for later exact scenic ownership.',
      'Combat options and support context are represented in multiple nearby blocks (top-lane/context/action strip), producing deliberate but duplicated truth surfaces in current baseline.',
      'Existing phase-6 audit notes route continuity through RunCompass and module routing, but composition ownership remains shell-centric in the current state.',
    ],
    knownRenderedRegressionsVsExactMockupTarget: [
      'Current rendered Ruins is combat-shell-driven rather than a full exact scenic 16:9 page composition.',
      'Current surface does not render a centered area plaque matching the approved exact mockup structure.',
      'Current layout does not match the approved left setup card / right rewards card / lower encounter-chain arrangement.',
      'Current summary + utility tray + action strip architecture differs materially from approved exact mockup hierarchy.',
      'Current scenic ownership is fight-stage/theater-centric instead of page page-centric.',
    ],
    evidenceCoverageStatus: {
      canonicalRawFolder: RAW_EVIDENCE_FOLDER,
      requiredSlots: [...PHASE6_COMBAT_CAPTURE_SLOT_FILES],
      presentSlots: [...coverage.presentSlots],
      missingSlots: [...coverage.missingSlots],
      auditPass: audit.overallPass,
      auditFindings: audit.findings.map((finding) => `[${finding.severity}] ${finding.code}: ${finding.message}`),
      screenshotsCapturedInThisRun,
      screenshotCaptureStatus,
      captureAttempt: {
        attempted: Boolean(attempt),
        generatedAt: attempt?.generatedAt ?? null,
        command: attempt?.command ?? null,
        ok: attempt ? attempt.ok : null,
        failureReason,
      },
    },
    regenerationCommands: {
      capture: 'npm run release:ruins-exact-p0:capture',
      audit: 'npm run release:ruins-exact-p0:audit',
      report: 'npm run release:ruins-exact-p0:report',
      typecheck: 'npm run typecheck',
    },
    developerRuleNote:
      'Ruins implementation is now exact-mockup-driven and may not inherit generalized combat-shell assumptions without explicit approval. The current combat-shell Ruins screen is evidence-only baseline material until exact replacement is approved.',
  };
}

function toMarkdown(report: RuinsExactP0BaselineReport): string {
  const lines: string[] = [];
  lines.push('# Ruins Exact Mockup — P0 Freeze Baseline');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Packet: ${report.packetId}`);
  lines.push(`- Objective: ${report.packetObjective}`);
  lines.push(`- Why now: ${report.whyNow}`);
  lines.push('');
  lines.push('## Developer rule note');
  lines.push(`- ${report.developerRuleNote}`);
  lines.push('');
  lines.push('## Dependencies');
  report.dependencies.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Exact file touchpoints');
  report.exactFileTouchpoints.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Current primary owner files');
  report.currentPrimaryOwnerFiles.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Current supporting touchpoints');
  report.currentSupportingTouchpoints.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Current visible truth surfaces');
  report.currentVisibleTruthSurfaces.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Must preserve rules for later packets');
  report.mustPreserveRules.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## No-go rules for later packets');
  report.noGoRules.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Known copy / CTA drift');
  report.knownCopyAndCtaDrift.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Known parity / owner ambiguity');
  report.knownParityAndOwnerAmbiguities.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Known rendered regressions vs approved exact mockup target');
  report.knownRenderedRegressionsVsExactMockupTarget.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Evidence coverage status');
  lines.push(`- Canonical raw folder: ${report.evidenceCoverageStatus.canonicalRawFolder}`);
  lines.push(`- Required slots: ${report.evidenceCoverageStatus.requiredSlots.join(', ')}`);
  lines.push(`- Present slots: ${report.evidenceCoverageStatus.presentSlots.join(', ') || '(none)'}`);
  lines.push(`- Missing slots: ${report.evidenceCoverageStatus.missingSlots.join(', ') || '(none)'}`);
  lines.push(`- Audit pass: ${report.evidenceCoverageStatus.auditPass ? 'PASS' : 'FAIL'}`);
  lines.push(`- Screenshot capture status: ${report.evidenceCoverageStatus.screenshotCaptureStatus}`);
  lines.push(`- Screenshots captured in this run: ${report.evidenceCoverageStatus.screenshotsCapturedInThisRun ? 'yes' : 'no'}`);
  if (report.evidenceCoverageStatus.captureAttempt.attempted) {
    lines.push(`- Capture attempted at: ${report.evidenceCoverageStatus.captureAttempt.generatedAt}`);
    lines.push(`- Capture command: ${report.evidenceCoverageStatus.captureAttempt.command}`);
    lines.push(`- Capture command success: ${report.evidenceCoverageStatus.captureAttempt.ok ? 'yes' : 'no'}`);
    if (report.evidenceCoverageStatus.captureAttempt.failureReason) {
      lines.push(`- Capture failure reason: ${report.evidenceCoverageStatus.captureAttempt.failureReason}`);
    }
  } else {
    lines.push('- Capture attempted this run: no attempt record found.');
  }
  if (report.evidenceCoverageStatus.auditFindings.length > 0) {
    lines.push('- Audit findings:');
    report.evidenceCoverageStatus.auditFindings.forEach((finding) => lines.push(`  - ${finding}`));
  }
  lines.push('');
  lines.push('## Commands to regenerate evidence and baseline');
  lines.push(`- ${report.regenerationCommands.typecheck}`);
  lines.push(`- ${report.regenerationCommands.capture}`);
  lines.push(`- ${report.regenerationCommands.audit}`);
  lines.push(`- ${report.regenerationCommands.report}`);
  lines.push('');
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { json, write, rootDir } = parseArgs(process.argv.slice(2));
  const report = buildRuinsExactP0Baseline(rootDir);
  if (write) {
    const outRoot = path.resolve(rootDir, OUT_ROOT);
    fs.mkdirSync(outRoot, { recursive: true });
    fs.writeFileSync(path.join(outRoot, 'ruinsExactP0Baseline.json'), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(outRoot, 'ruinsExactP0Baseline.md'), `${toMarkdown(report)}\n`);
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(toMarkdown(report));
  }
}
