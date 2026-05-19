import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_ROOT = 'docs/release/qa/ui-cutover/apothecary-exact/p0-freeze';

interface Finding {
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

interface AuditReport {
  schemaVersion: 'apothecary-exact-p0-audit.v1';
  generatedAt: string;
  overallPass: boolean;
  findings: Finding[];
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

export function auditApothecaryExactP0Evidence(rootDir = process.cwd()): AuditReport {
  const findings: Finding[] = [];
  const outRoot = path.resolve(rootDir, OUT_ROOT);
  const screenshotPath = path.join(outRoot, '01-fixture.png');
  const domAuditPath = path.join(outRoot, '01-fixture.dom.json');
  const htmlPath = path.join(outRoot, '01-fixture.html');
  const captureAttemptPath = path.join(outRoot, 'apothecaryExactP0CaptureAttempt.json');

  const pngSize = readPngSize(screenshotPath);
  if (!pngSize) {
    findings.push({
      severity: 'error',
      code: 'screenshot_missing_or_invalid',
      message: `Missing or invalid fixture screenshot: ${path.relative(rootDir, screenshotPath)}`,
    });
  } else if (pngSize.width !== 2048 || pngSize.height !== 1152) {
    findings.push({
      severity: 'error',
      code: 'screenshot_size_invalid',
      message: `Fixture screenshot must be 2048x1152, got ${pngSize.width}x${pngSize.height}.`,
    });
  }

  if (!fs.existsSync(htmlPath)) {
    findings.push({
      severity: 'error',
      code: 'html_capture_missing',
      message: `Missing fixture HTML evidence: ${path.relative(rootDir, htmlPath)}`,
    });
  } else {
    const html = fs.readFileSync(htmlPath, 'utf8');
    for (const token of [
      'data-testid="apothecary-exact-page"',
      'data-testid="apothecary-exact-prescription"',
      'data-testid="apothecary-exact-buy-lane"',
      'data-testid="apothecary-exact-brew-lane"',
      'data-testid="apothecary-exact-pouch-card"',
      'data-testid="apothecary-exact-pouch-object"',
      'data-testid="apothecary-exact-primary-cta"',
      'Prepare Foundation Package',
      'Return to Gate Trial',
      'Attempt Fit',
    ]) {
      if (!html.includes(token)) {
        findings.push({
          severity: 'error',
          code: 'html_marker_missing',
          message: `Fixture HTML is missing marker: ${token}`,
        });
      }
    }
    if (html.includes('apothecary mockup.png')) {
      findings.push({
        severity: 'error',
        code: 'flattened_mockup_used',
        message: 'Fixture HTML references the flattened apothecary mockup screenshot.',
      });
    }
    for (const token of [
      'apothecaryExactRoomPlate',
      'apothecaryExactPrescription__frame',
      'frames.primaryCta',
      'apothecary_room_scenic_plate',
      'prescription_parchment_frame_cropped',
      'gold_cta_plaque_cropped',
      'lane_card_default',
      'lane_card_ready',
      'lane_card_warning',
      'lane_card_disabled',
    ]) {
      if (html.includes(token)) {
        findings.push({
          severity: 'error',
          code: 'heavy_raster_backplate_present',
          message: `Fixture HTML must not render heavy Apothecary raster backplate: ${token}`,
        });
      }
    }
  }

  if (!fs.existsSync(domAuditPath)) {
    findings.push({
      severity: 'error',
      code: 'dom_audit_missing',
      message: `Missing DOM audit evidence: ${path.relative(rootDir, domAuditPath)}`,
    });
  } else {
    const audit = JSON.parse(fs.readFileSync(domAuditPath, 'utf8')) as any;
    if (audit?.schemaVersion !== 'apothecary-exact-dom-audit.v1' && audit?.schemaVersion !== 'apothecary-exact-dom-audit.v2') {
      findings.push({
        severity: 'error',
        code: 'dom_audit_schema_invalid',
        message: 'Apothecary Exact DOM audit schema is invalid.',
      });
    }
    if (audit?.viewport?.width !== 2048 || audit?.viewport?.height !== 1152) {
      findings.push({
        severity: 'error',
        code: 'dom_viewport_invalid',
        message: `DOM viewport must be 2048x1152, got ${JSON.stringify(audit?.viewport ?? null)}.`,
      });
    }
    if (audit?.rootMode !== 'fixture') {
      findings.push({
        severity: 'error',
        code: 'fixture_mode_not_forced',
        message: `Capture must force fixture mode, got ${String(audit?.rootMode ?? 'missing')}.`,
      });
    }
    for (const region of ['header', 'cityChip', 'prepStrip', 'prescription', 'warnings', 'buyLane', 'brewLane', 'pouchCard', 'pouchObject', 'bottomActions', 'primaryCta', 'returnGate', 'attemptFit']) {
      if (!audit?.found?.[region]) {
        findings.push({
          severity: 'error',
          code: 'region_missing',
          message: `DOM audit missing required region: ${region}`,
        });
      }
      if (audit?.regions?.[region] && audit.regions[region].withinTolerance !== true) {
        findings.push({
          severity: 'error',
          code: 'region_bounds_invalid',
          message: `${region} bounds must match canonical target within tolerance: ${JSON.stringify(audit.regions[region])}`,
        });
      }
    }
    if (audit?.rows?.prepCells !== 7 || audit?.rows?.prescriptionRows !== 4 || audit?.rows?.buyRows !== 3 || audit?.rows?.brewRows !== 3) {
      findings.push({
        severity: 'error',
        code: 'fixture_row_counts_invalid',
        message: `Fixture row counts are invalid: ${JSON.stringify(audit?.rows ?? {})}`,
      });
    }
    const expectedWarnings = ['Healing below floor', 'No city specialty stock', 'Medicine pouch underfilled'];
    if (JSON.stringify(audit?.warningLabels ?? []) !== JSON.stringify(expectedWarnings)) {
      findings.push({
        severity: 'error',
        code: 'warning_labels_invalid',
        message: `Fixture warning labels are invalid: ${JSON.stringify(audit?.warningLabels ?? [])}`,
      });
    }
    for (const marker of ['title', 'cityChip', 'prescription', 'cta', 'noLegacyTabs', 'noContextStrip', 'noLiveIronblood', 'noLiveQiElixir']) {
      if (audit?.textMarkers?.[marker] !== true) {
        findings.push({
          severity: 'error',
          code: 'fixture_text_marker_invalid',
          message: `Fixture text marker failed: ${marker}`,
        });
      }
    }
    if (audit?.overlaps?.prepPrescription) {
      findings.push({
        severity: 'error',
        code: 'prep_prescription_overlap',
        message: 'Preparation strip and prescription region overlap.',
      });
    }
    if (audit?.overlaps?.prescriptionWarnings) {
      findings.push({
        severity: 'error',
        code: 'prescription_warning_overlap',
        message: 'Prescription and warning strip regions overlap.',
      });
    }
    if (audit?.clipping?.brewLaneY || audit?.clipping?.attemptFitY || audit?.clipping?.primaryCtaTextOutside) {
      findings.push({
        severity: 'error',
        code: 'fixture_clipping_detected',
        message: `Fixture clipping detected: ${JSON.stringify(audit?.clipping ?? {})}`,
      });
    }
    if (audit?.wrapping?.ctaLineCount !== 1) {
      findings.push({
        severity: 'error',
        code: 'cta_text_wrapped',
        message: `CTA text must be one line: ${JSON.stringify(audit?.wrapping ?? {})}`,
      });
    }
    if ((audit?.forbiddenOverlayText ?? []).length > 0) {
      findings.push({
        severity: 'error',
        code: 'forbidden_overlay_text',
        message: `Capture DOM contains forbidden overlay/debug text: ${(audit.forbiddenOverlayText as string[]).join(', ')}`,
      });
    }
    if (audit?.forbiddenRuntimeMockup) {
      findings.push({
        severity: 'error',
        code: 'flattened_mockup_used',
        message: 'Fixture DOM references the flattened apothecary mockup screenshot.',
      });
    }
    if (
      audit?.heavyRasterBackplates?.roomPlateImg ||
      audit?.heavyRasterBackplates?.prescriptionFrameImg ||
      audit?.heavyRasterBackplates?.primaryCtaImg ||
      audit?.heavyRasterBackplates?.laneRowsWithInlineBackground > 0
    ) {
      findings.push({
        severity: 'error',
        code: 'heavy_raster_backplate_present',
        message: `Fixture DOM renders old Apothecary raster backplates: ${JSON.stringify(audit?.heavyRasterBackplates ?? {})}`,
      });
    }
    if ((audit?.assetWarnings ?? []).length > 0) {
      findings.push({
        severity: 'error',
        code: 'asset_warning_present',
        message: `Asset warnings present in fixture: ${(audit.assetWarnings as string[]).join('; ')}`,
      });
    }
  }

  if (!fs.existsSync(captureAttemptPath)) {
    findings.push({
      severity: 'warning',
      code: 'capture_attempt_missing',
      message: `Capture attempt record is missing: ${path.relative(rootDir, captureAttemptPath)}`,
    });
  } else {
    const attempt = JSON.parse(fs.readFileSync(captureAttemptPath, 'utf8')) as any;
    if (attempt?.ok !== true) {
      findings.push({
        severity: 'error',
        code: 'capture_attempt_failed',
        message: `Capture attempt failed: ${attempt?.stderr ?? 'unknown error'}`,
      });
    }
  }

  return {
    schemaVersion: 'apothecary-exact-p0-audit.v1',
    generatedAt: new Date().toISOString(),
    overallPass: !findings.some((finding) => finding.severity === 'error'),
    findings,
  };
}

function renderHumanReport(report: AuditReport): string {
  const lines = [
    '=== Apothecary Exact P0 Evidence Audit ===',
    `generatedAt: ${report.generatedAt}`,
    `overallPass: ${report.overallPass ? 'PASS' : 'FAIL'}`,
    `findings: ${report.findings.length}`,
    '',
  ];
  if (report.findings.length === 0) {
    lines.push('All Apothecary Exact fixture evidence files are present and valid.');
  } else {
    report.findings.forEach((finding) => lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`));
  }
  return lines.join('\n');
}

if (isMainModule()) {
  const json = process.argv.includes('--json');
  const report = auditApothecaryExactP0Evidence();
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderHumanReport(report));
  }
  if (!report.overallPass) {
    process.exitCode = 1;
  }
}
