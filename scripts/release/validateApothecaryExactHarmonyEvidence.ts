import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_ROOT = 'docs/release/qa/ui-cutover/apothecary-exact/p1-harmony';

interface Finding {
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

interface AuditReport {
  schemaVersion: 'apothecary-exact-harmony-audit.v1';
  generatedAt: string;
  overallPass: boolean;
  findings: Finding[];
}

interface RectRecord {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RegionAudit {
  exists?: boolean;
  rect?: RectRecord | null;
  withinTolerance?: boolean;
  overflow?: {
    x: boolean;
    y: boolean;
  } | null;
}

interface HarmonyDomAudit {
  schemaVersion?: string;
  viewport?: { width?: number; height?: number };
  rootExists?: boolean;
  rootMode?: string | null;
  found?: Record<string, boolean>;
  regions?: Record<string, RegionAudit>;
  rows?: {
    prepCells?: number;
    prescriptionRows?: number;
    warningChips?: number;
    buyRows?: number;
    brewRows?: number;
  };
  textMarkers?: Record<string, boolean>;
  warningLabels?: string[];
  atmosphere?: {
    exists?: boolean;
    opacity?: number | null;
    pointerEvents?: string | null;
    zIndex?: number | null;
    backgroundUsesRoomPlate?: boolean;
    zIndexBelowPanels?: boolean;
  };
  collisions?: Record<string, boolean | number>;
  clipping?: Record<string, boolean>;
  typography?: {
    ctaLineCount?: number;
    ctaText?: string | null;
    sourceIngredientsLineCount?: number;
    maxLaneStrongLineCount?: number;
  };
  buttons?: {
    disabledStateMismatches?: string[];
    actionableMissingAriaLabels?: string[];
  };
  forbidden?: {
    flattenedMockup?: boolean;
    heavyRoomPlateElement?: boolean;
    oldPrescriptionFrame?: boolean;
    oldPrimaryCtaImage?: boolean;
    laneInlineRasterBackgrounds?: number;
    debugOverlayText?: string[];
    emojiIconText?: boolean;
  };
}

function isMainModule(): boolean {
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '');
}

function readPngSize(filePath: string): { width: number; height: number } | null {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24) return null;
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function pushError(findings: Finding[], code: string, message: string): void {
  findings.push({ severity: 'error', code, message });
}

function pushWarning(findings: Finding[], code: string, message: string): void {
  findings.push({ severity: 'warning', code, message });
}

export function auditApothecaryExactHarmonyEvidence(rootDir = process.cwd()): AuditReport {
  const findings: Finding[] = [];
  const outRoot = path.resolve(rootDir, OUT_ROOT);
  const screenshotPath = path.join(outRoot, '01-fixture.png');
  const domAuditPath = path.join(outRoot, '01-fixture.dom.json');
  const captureAttemptPath = path.join(outRoot, 'apothecaryExactHarmonyCaptureAttempt.json');

  const pngSize = readPngSize(screenshotPath);
  if (!pngSize) {
    pushError(findings, 'screenshot_missing_or_invalid', `Missing or invalid fixture screenshot: ${path.relative(rootDir, screenshotPath)}`);
  } else if (pngSize.width !== 2048 || pngSize.height !== 1152) {
    pushError(findings, 'screenshot_size_invalid', `Harmony fixture screenshot must be 2048x1152, got ${pngSize.width}x${pngSize.height}.`);
  }

  if (!fs.existsSync(domAuditPath)) {
    pushError(findings, 'dom_audit_missing', `Missing harmony DOM audit: ${path.relative(rootDir, domAuditPath)}`);
  } else {
    const audit = JSON.parse(fs.readFileSync(domAuditPath, 'utf8')) as HarmonyDomAudit;
    if (audit.schemaVersion !== 'apothecary-exact-harmony-dom-audit.v1') {
      pushError(findings, 'dom_audit_schema_invalid', `Harmony DOM audit schema is invalid: ${String(audit.schemaVersion ?? 'missing')}.`);
    }
    if (audit.viewport?.width !== 2048 || audit.viewport?.height !== 1152) {
      pushError(findings, 'dom_viewport_invalid', `DOM viewport must be 2048x1152, got ${JSON.stringify(audit.viewport ?? null)}.`);
    }
    if (audit.rootExists !== true || audit.rootMode !== 'fixture') {
      pushError(findings, 'fixture_mode_not_forced', `Capture must force fixture mode, got rootExists=${String(audit.rootExists)} mode=${String(audit.rootMode ?? 'missing')}.`);
    }

    for (const region of ['header', 'cityChip', 'prepStrip', 'prescription', 'warnings', 'buyLane', 'brewLane', 'pouchCard', 'pouchObject', 'bottomActions', 'primaryCta', 'returnGate', 'attemptFit']) {
      if (audit.found?.[region] !== true) {
        pushError(findings, 'region_missing', `DOM audit missing required region: ${region}`);
      }
      if (audit.regions?.[region] && audit.regions[region].withinTolerance !== true) {
        pushError(findings, 'region_bounds_invalid', `${region} bounds must match harmony target within tolerance: ${JSON.stringify(audit.regions[region])}`);
      }
    }

    if (audit.rows?.prepCells !== 7 || audit.rows?.prescriptionRows !== 4 || audit.rows?.buyRows !== 3 || audit.rows?.brewRows !== 3) {
      pushError(findings, 'fixture_row_counts_invalid', `Fixture row counts are invalid: ${JSON.stringify(audit.rows ?? {})}`);
    }

    const expectedWarnings = ['Healing below floor', 'No city specialty stock', 'Medicine pouch underfilled'];
    if (JSON.stringify(audit.warningLabels ?? []) !== JSON.stringify(expectedWarnings)) {
      pushError(findings, 'warning_labels_invalid', `Fixture warning labels are invalid: ${JSON.stringify(audit.warningLabels ?? [])}`);
    }

    for (const marker of ['title', 'cityChip', 'prescription', 'cta', 'noLegacyTabs', 'noContextStrip']) {
      if (audit.textMarkers?.[marker] !== true) {
        pushError(findings, 'fixture_text_marker_invalid', `Fixture text marker failed: ${marker}`);
      }
    }

    if (audit.atmosphere?.exists !== true) {
      pushError(findings, 'room_atmosphere_missing', 'Harmony capture must include the approved room atmosphere layer.');
    }
    if (typeof audit.atmosphere?.opacity !== 'number' || audit.atmosphere.opacity > 0.18) {
      pushError(findings, 'room_atmosphere_opacity_invalid', `Room atmosphere opacity must be <= 0.18, got ${String(audit.atmosphere?.opacity ?? 'missing')}.`);
    }
    if (audit.atmosphere?.pointerEvents !== 'none') {
      pushError(findings, 'room_atmosphere_pointer_events_invalid', `Room atmosphere pointer-events must be none, got ${String(audit.atmosphere?.pointerEvents ?? 'missing')}.`);
    }
    if (audit.atmosphere?.backgroundUsesRoomPlate !== true) {
      pushError(findings, 'room_atmosphere_asset_missing', 'Room atmosphere must use the approved room.scenicPlate asset.');
    }
    if (audit.atmosphere?.zIndexBelowPanels !== true) {
      pushError(findings, 'room_atmosphere_layering_invalid', `Room atmosphere must sit below panels: ${JSON.stringify(audit.atmosphere ?? {})}`);
    }

    for (const collision of ['prepPrescription', 'prescriptionWarnings', 'warningsLowerPanels', 'buyBottomActions', 'brewPrimaryCta', 'pouchObjectPouchText', 'primaryCtaAttemptFit', 'primaryCtaReturnGate']) {
      if (audit.collisions?.[collision] === true) {
        pushError(findings, 'region_collision_detected', `Harmony collision detected: ${collision}`);
      }
    }
    if ((audit.collisions?.laneIconCopy ?? 1) !== 0 || (audit.collisions?.laneCopyButton ?? 1) !== 0) {
      pushError(findings, 'lane_row_collision_detected', `Lane row icon/copy/button collisions detected: ${JSON.stringify(audit.collisions ?? {})}`);
    }

    for (const clip of ['prescriptionY', 'buyLaneY', 'brewLaneY', 'pouchCardY', 'attemptFitY', 'primaryCtaTextOutside']) {
      if (audit.clipping?.[clip] === true) {
        pushError(findings, 'fixture_clipping_detected', `Harmony clipping detected: ${clip}`);
      }
    }

    if (audit.typography?.ctaLineCount !== 1) {
      pushError(findings, 'cta_text_wrapped', `CTA text must remain one line: ${JSON.stringify(audit.typography ?? {})}`);
    }
    if ((audit.typography?.sourceIngredientsLineCount ?? 1) > 2) {
      pushError(findings, 'secondary_action_wrapped_too_much', `Source Ingredients may wrap at most two lines: ${JSON.stringify(audit.typography ?? {})}`);
    }
    if ((audit.typography?.maxLaneStrongLineCount ?? 0) > 2) {
      pushError(findings, 'lane_label_wrapped_too_much', `Lane labels may wrap at most two lines: ${JSON.stringify(audit.typography ?? {})}`);
    }

    if ((audit.buttons?.disabledStateMismatches ?? []).length > 0) {
      pushError(findings, 'disabled_button_state_mismatch', `Buttons with data-enabled=false must be disabled: ${(audit.buttons?.disabledStateMismatches ?? []).join(', ')}`);
    }
    if ((audit.buttons?.actionableMissingAriaLabels ?? []).length > 0) {
      pushError(findings, 'action_button_aria_missing', `Actionable buttons must have aria-labels: ${(audit.buttons?.actionableMissingAriaLabels ?? []).join(', ')}`);
    }

    if (
      audit.forbidden?.flattenedMockup
      || audit.forbidden?.heavyRoomPlateElement
      || audit.forbidden?.oldPrescriptionFrame
      || audit.forbidden?.oldPrimaryCtaImage
      || (audit.forbidden?.laneInlineRasterBackgrounds ?? 0) > 0
      || audit.forbidden?.emojiIconText
    ) {
      pushError(findings, 'forbidden_runtime_artifact', `Forbidden runtime artifact detected: ${JSON.stringify(audit.forbidden ?? {})}`);
    }
    if ((audit.forbidden?.debugOverlayText ?? []).length > 0) {
      pushError(findings, 'forbidden_overlay_text', `Capture DOM contains forbidden overlay/debug text: ${(audit.forbidden?.debugOverlayText ?? []).join(', ')}`);
    }
  }

  if (!fs.existsSync(captureAttemptPath)) {
    pushWarning(findings, 'capture_attempt_missing', `Capture attempt record is missing: ${path.relative(rootDir, captureAttemptPath)}`);
  } else {
    const attempt = JSON.parse(fs.readFileSync(captureAttemptPath, 'utf8')) as { ok?: boolean; stderr?: string };
    if (attempt.ok !== true) {
      pushError(findings, 'capture_attempt_failed', `Capture attempt failed: ${attempt.stderr ?? 'unknown error'}`);
    }
  }

  return {
    schemaVersion: 'apothecary-exact-harmony-audit.v1',
    generatedAt: new Date().toISOString(),
    overallPass: !findings.some((finding) => finding.severity === 'error'),
    findings,
  };
}

function renderHumanReport(report: AuditReport): string {
  const lines = [
    '=== Apothecary Exact Harmony Evidence Audit ===',
    `generatedAt: ${report.generatedAt}`,
    `overallPass: ${report.overallPass ? 'PASS' : 'FAIL'}`,
    `findings: ${report.findings.length}`,
    '',
  ];
  if (report.findings.length === 0) {
    lines.push('All Apothecary Exact harmony evidence files are present and valid.');
  } else {
    report.findings.forEach((finding) => lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`));
  }
  return lines.join('\n');
}

if (isMainModule()) {
  const json = process.argv.includes('--json');
  const report = auditApothecaryExactHarmonyEvidence();
  const outRoot = path.resolve(process.cwd(), OUT_ROOT);
  fs.mkdirSync(outRoot, { recursive: true });
  fs.writeFileSync(path.join(outRoot, 'apothecaryExactHarmonyAuditReport.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderHumanReport(report));
  }
  if (!report.overallPass) {
    process.exitCode = 1;
  }
}
