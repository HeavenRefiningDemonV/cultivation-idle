import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

function addGateTrialLayoutRefitFinding(
  findings: Phase6CombatEvidenceFinding[],
  code: string,
  message: string,
) {
  findings.push({
    surfaceId: 'gate-trial',
    severity: 'error',
    code,
    message,
  });
}

function validateGateTrialDomAudit(folderPath: string, slotFile: string, findings: Phase6CombatEvidenceFinding[]) {
  const domPath = path.join(folderPath, slotFile.replace('.png', '.dom.json'));
  if (!fs.existsSync(domPath)) {
    findings.push({
      surfaceId: 'gate-trial',
      severity: 'error',
      code: 'gate_trial_dom_audit_missing',
      message: `Gate Trial DOM audit is missing: ${path.basename(domPath)}`,
    });
    return;
  }

  let audit: any;
  try {
    audit = JSON.parse(fs.readFileSync(domPath, 'utf8'));
  } catch (error) {
    findings.push({
      surfaceId: 'gate-trial',
      severity: 'error',
      code: 'gate_trial_dom_audit_invalid',
      message: `Gate Trial DOM audit could not be parsed: ${path.basename(domPath)} (${error instanceof Error ? error.message : String(error)})`,
    });
    return;
  }

  if (audit?.schemaVersion !== 'gate-trial-exact-dom-audit.v1') {
    findings.push({
      surfaceId: 'gate-trial',
      severity: 'error',
      code: 'gate_trial_dom_audit_invalid',
      message: `Gate Trial DOM audit schema is invalid: ${path.basename(domPath)}`,
    });
  }

  const forbiddenOldShellMarkers = audit?.forbiddenOldShellMarkers ?? [];
  if (forbiddenOldShellMarkers.length > 0) {
    findings.push({
      surfaceId: 'gate-trial',
      severity: 'error',
      code: 'gate_trial_old_shell_marker',
      message: `Gate Trial DOM audit found old-shell markers in ${path.basename(domPath)}: ${forbiddenOldShellMarkers.join(', ')}`,
    });
  }

  const forbiddenCrossSurfaceMarkers = audit?.forbiddenCrossSurfaceMarkers ?? [];
  if (forbiddenCrossSurfaceMarkers.length > 0) {
    findings.push({
      surfaceId: 'gate-trial',
      severity: 'error',
      code: 'gate_trial_cross_surface_marker',
      message: `Gate Trial DOM audit found cross-surface markers in ${path.basename(domPath)}: ${forbiddenCrossSurfaceMarkers.join(', ')}`,
    });
  }

  if (audit?.artStatus?.dataFinalArtRequired === 'true') {
    findings.push({
      surfaceId: 'gate-trial',
      severity: 'warning',
      code: 'gate_trial_final_art_deferred',
      message: `Gate Trial final scenic art is still deferred in ${path.basename(domPath)}; do not claim full visual parity.`,
    });
  }

  if (slotFile === '01-base.png') {
    if (audit?.viewport?.width !== 2048 || audit?.viewport?.height !== 1152) {
      findings.push({
        surfaceId: 'gate-trial',
        severity: 'error',
        code: 'gate_trial_viewport_invalid',
        message: `Gate Trial base viewport must be 2048x1152, got ${audit?.viewport?.width ?? 'unknown'}x${audit?.viewport?.height ?? 'unknown'}.`,
      });
    }

    const requiredRegions = [
      'exactPage',
      'topRegion',
      'tacticalStrip',
      'leftRail',
      'minimumChecklist',
      'gateHeader',
      'scenicStage',
      'readinessSeal',
      'guardianPlaque',
      'rightRail',
      'recommendedPanel',
      'trialSummary',
      'readinessRail',
      'primaryCta',
    ];
    for (const region of requiredRegions) {
      if (!audit?.found?.[region]) {
        findings.push({
          surfaceId: 'gate-trial',
          severity: 'error',
          code: 'gate_trial_region_missing',
          message: `Gate Trial base DOM audit missing required region: ${region}`,
        });
      }
    }

    const requiredTextMarkers = [
      'gateTrialTitle',
      'foundationGate',
      'minimumChecklist',
      'recommended',
      'trialSummary',
      'foundationGateReadiness',
      'attemptGate',
      'viable',
      'gateGuardian',
      'gateFoundationPill',
    ];
    for (const marker of requiredTextMarkers) {
      if (!audit?.textMarkers?.[marker]) {
        findings.push({
          surfaceId: 'gate-trial',
          severity: 'error',
          code: 'gate_trial_text_marker_missing',
          message: `Gate Trial base DOM audit missing required text marker: ${marker}`,
        });
      }
    }

    if (!audit?.geometry?.noVerticalPageScroll) {
      findings.push({
        surfaceId: 'gate-trial',
        severity: 'error',
        code: 'gate_trial_scroll_detected',
        message: 'Gate Trial base capture has vertical page scroll at 2048x1152.',
      });
    }
    if (!audit?.geometry?.ctaWithinViewport) {
      findings.push({
        surfaceId: 'gate-trial',
        severity: 'error',
        code: 'gate_trial_cta_clipped',
        message: 'Gate Trial base CTA is clipped or outside the 2048x1152 viewport.',
      });
    }

    for (const rule of ['railAboveCta', 'summaryRightOfScenic', 'leftRailLeftOfScenic', 'rightRailRightOfScenic', 'centerDominatesWidth']) {
      if (!audit?.geometry?.[rule]) {
        findings.push({
          surfaceId: 'gate-trial',
          severity: 'error',
          code: 'gate_trial_geometry_invalid',
          message: `Gate Trial base geometry rule failed: ${rule}`,
        });
      }
    }

    const viewportHeight = audit?.viewport?.height ?? 0;
    const viewportWidth = audit?.viewport?.width ?? 0;
    const rects = audit?.rects ?? {};

    if (viewportWidth === 2048 && viewportHeight === 1152) {
      const scenic = rects.scenic;
      const right = rects.recommendedPanel;
      const summary = rects.summary;
      const rail = rects.readinessRail;
      const cta = rects.cta;
      const gateHeader = rects.gateHeader;

      if (!(scenic && scenic.top >= 165 && scenic.top <= 215 && scenic.height >= 680 && scenic.bottom >= 850)) {
        addGateTrialLayoutRefitFinding(
          findings,
          'gate_trial_layout_scenic_not_dominant',
          `Gate Trial scenic stage is not using the target central vertical band: ${JSON.stringify(scenic)}`,
        );
      }

      if (!(gateHeader && gateHeader.top >= 130 && gateHeader.top <= 185)) {
        addGateTrialLayoutRefitFinding(
          findings,
          'gate_trial_layout_header_misaligned',
          `Gate Trial Foundation Gate plaque is not near the target vertical band: ${JSON.stringify(gateHeader)}`,
        );
      }

      if (!(right && right.top >= 175 && right.top <= 230 && right.height >= 570)) {
        addGateTrialLayoutRefitFinding(
          findings,
          'gate_trial_layout_right_panel_misaligned',
          `Gate Trial recommended panel is not near the target vertical band: ${JSON.stringify(right)}`,
        );
      }

      if (!(summary && summary.top >= 800 && summary.top <= 875 && summary.height >= 190 && summary.bottom <= 1095)) {
        addGateTrialLayoutRefitFinding(
          findings,
          'gate_trial_layout_summary_misaligned',
          `Gate Trial summary dock is not near the target lower-right band: ${JSON.stringify(summary)}`,
        );
      }

      if (!(rail && rail.top >= 900 && rail.top <= 980 && rail.bottom <= 1065)) {
        addGateTrialLayoutRefitFinding(
          findings,
          'gate_trial_layout_rail_misaligned',
          `Gate Trial readiness rail is not near the target lower band: ${JSON.stringify(rail)}`,
        );
      }

      if (!(cta && cta.top >= 1010 && cta.top <= 1080 && cta.bottom <= 1138)) {
        addGateTrialLayoutRefitFinding(
          findings,
          'gate_trial_layout_cta_misaligned',
          `Gate Trial CTA is not near the target bottom band: ${JSON.stringify(cta)}`,
        );
      }
    }
  }

  if (slotFile === '02-interaction.png') {
    for (const region of ['activeTheater', 'exactPage', 'leftRail', 'rightRail', 'trialSummary', 'readinessRail', 'primaryCta']) {
      if (!audit?.found?.[region]) {
        findings.push({
          surfaceId: 'gate-trial',
          severity: 'error',
          code: 'gate_trial_region_missing',
          message: `Gate Trial interaction DOM audit missing required region: ${region}`,
        });
      }
    }
    if (!audit?.textMarkers?.stopAttempt) {
      findings.push({
        surfaceId: 'gate-trial',
        severity: 'error',
        code: 'gate_trial_text_marker_missing',
        message: 'Gate Trial interaction DOM audit missing Stop Attempt marker.',
      });
    }
  }

  if (slotFile === '03-truth-states.png') {
    const hasTruthState =
      audit?.found?.resultTransition === true
      || audit?.textMarkers?.gateRejected === true
      || audit?.textMarkers?.safetyNetReady === true
      || audit?.textMarkers?.safetyNetSecured === true
      || audit?.textMarkers?.gateOpened === true;
    if (!hasTruthState) {
      findings.push({
        surfaceId: 'gate-trial',
        severity: 'error',
        code: 'gate_trial_text_marker_missing',
        message: 'Gate Trial truth-state DOM audit must show a result transition or result-state marker.',
      });
    }
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
      if (target.id === 'gate-trial') {
        validateGateTrialDomAudit(folderPath, slotFile, findings);
      }
    }
  }

  return {
    schemaVersion: 'phase-6-combat-evidence-audit.v1',
    generatedAt: new Date().toISOString(),
    overallPass: !findings.some((finding) => finding.severity === 'error'),
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

function isMainModule(): boolean {
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '');
}

if (isMainModule()) {
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
