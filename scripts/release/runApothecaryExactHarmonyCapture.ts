import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Browser } from '@playwright/test';

import { APOTHECARY_EXACT_REGIONS } from '../../src/features/apothecary/exact/apothecaryExactPresentation.js';

const OUT_ROOT = 'docs/release/qa/ui-cutover/apothecary-exact/p1-harmony';
const HOST = '127.0.0.1';
const PORT = 5173;
const APP_ORIGIN = `http://${HOST}:${PORT}`;
const FIXTURE_URL = `${APP_ORIGIN}/?apothecaryExactMode=fixture`;

const REGION_TEST_IDS = {
  header: 'apothecary-exact-header',
  cityChip: 'apothecary-exact-city-chip',
  prepStrip: 'apothecary-exact-prep-strip',
  prescription: 'apothecary-exact-prescription',
  warnings: 'apothecary-exact-warnings',
  buyLane: 'apothecary-exact-buy-lane',
  brewLane: 'apothecary-exact-brew-lane',
  pouchCard: 'apothecary-exact-pouch-card',
  pouchObject: 'apothecary-exact-pouch-object',
  bottomActions: 'apothecary-exact-bottom-actions',
  primaryCta: 'apothecary-exact-primary-cta',
  returnGate: 'apothecary-exact-return-gate',
  attemptFit: 'apothecary-exact-attempt-fit',
} as const;

type RegionKey = keyof typeof REGION_TEST_IDS;

interface RegionTarget {
  testId: string;
  target: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tolerance: number;
}

interface RectRecord {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RegionAudit {
  testId: string;
  exists: boolean;
  rect: RectRecord | null;
  target: RegionTarget['target'];
  tolerance: number;
  withinTolerance: boolean;
  overflow: {
    x: boolean;
    y: boolean;
    scrollWidth: number;
    clientWidth: number;
    scrollHeight: number;
    clientHeight: number;
  } | null;
}

interface HarmonyDomAudit {
  schemaVersion: 'apothecary-exact-harmony-dom-audit.v1';
  generatedAt: string;
  viewport: { width: number; height: number };
  rootTestId: 'apothecary-exact-page';
  rootExists: boolean;
  rootMode: string | null;
  found: Record<RegionKey, boolean>;
  regions: Record<RegionKey, RegionAudit>;
  rows: {
    prepCells: number;
    prescriptionRows: number;
    warningChips: number;
    buyRows: number;
    brewRows: number;
  };
  textMarkers: {
    title: boolean;
    cityChip: boolean;
    prescription: boolean;
    cta: boolean;
    noLegacyTabs: boolean;
    noContextStrip: boolean;
  };
  warningLabels: string[];
  atmosphere: {
    exists: boolean;
    opacity: number | null;
    pointerEvents: string | null;
    zIndex: number | null;
    backgroundUsesRoomPlate: boolean;
    zIndexBelowPanels: boolean;
  };
  collisions: {
    prepPrescription: boolean;
    prescriptionWarnings: boolean;
    warningsLowerPanels: boolean;
    buyBottomActions: boolean;
    brewPrimaryCta: boolean;
    pouchObjectPouchText: boolean;
    primaryCtaAttemptFit: boolean;
    primaryCtaReturnGate: boolean;
    laneIconCopy: number;
    laneCopyButton: number;
  };
  clipping: {
    prescriptionY: boolean;
    buyLaneY: boolean;
    brewLaneY: boolean;
    pouchCardY: boolean;
    attemptFitY: boolean;
    primaryCtaTextOutside: boolean;
  };
  typography: {
    ctaLineCount: number;
    ctaText: string | null;
    sourceIngredientsLineCount: number;
    maxLaneStrongLineCount: number;
  };
  buttons: {
    disabledStateMismatches: string[];
    actionableMissingAriaLabels: string[];
  };
  forbidden: {
    flattenedMockup: boolean;
    heavyRoomPlateElement: boolean;
    oldPrescriptionFrame: boolean;
    oldPrimaryCtaImage: boolean;
    laneInlineRasterBackgrounds: number;
    debugOverlayText: string[];
    emojiIconText: boolean;
  };
}

interface CaptureRecord {
  schemaVersion: 'apothecary-exact-harmony-capture.v1';
  generatedAt: string;
  ok: boolean;
  url: string;
  usedExistingServer: boolean;
  screenshotPath: string;
  domAuditPath: string;
  stderr: string;
  stdout: string;
}

function isMainModule(): boolean {
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '');
}

function buildAuditTargets(): Record<RegionKey, RegionTarget> {
  return Object.fromEntries(
    Object.entries(REGION_TEST_IDS).map(([key, testId]) => [
      key,
      {
        testId,
        target: APOTHECARY_EXACT_REGIONS[key as RegionKey],
        tolerance: 6,
      },
    ]),
  ) as Record<RegionKey, RegionTarget>;
}

async function isServerReady(): Promise<boolean> {
  try {
    const response = await fetch(APP_ORIGIN);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs: number): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerReady()) return;
    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  }
  throw new Error(`Timed out waiting for Vite at ${APP_ORIGIN}.`);
}

function startDevServer(rootDir: string): ChildProcessWithoutNullStreams {
  const viteBin = path.resolve(rootDir, 'node_modules/vite/bin/vite.js');
  return spawn(process.execPath, [viteBin, '--host', HOST, '--port', String(PORT), '--strictPort'], {
    cwd: rootDir,
    env: { ...process.env, BROWSER: 'none' },
  });
}

async function launchBrowser(): Promise<{ browser: Browser; stderr: string }> {
  try {
    return { browser: await chromium.launch({ channel: 'msedge' }), stderr: '' };
  } catch (edgeError) {
    try {
      const browser = await chromium.launch();
      const edgeMessage = edgeError instanceof Error ? edgeError.message : String(edgeError);
      return { browser, stderr: `Unable to launch msedge channel; used bundled Chromium. Edge error: ${edgeMessage}` };
    } catch (chromiumError) {
      const edgeMessage = edgeError instanceof Error ? edgeError.message : String(edgeError);
      const chromiumMessage = chromiumError instanceof Error ? chromiumError.message : String(chromiumError);
      throw new Error(`Unable to launch Playwright browser. Edge: ${edgeMessage}; Chromium: ${chromiumMessage}`);
    }
  }
}

async function captureDomAudit(browser: Browser, screenshotPath: string, targets: Record<RegionKey, RegionTarget>): Promise<HarmonyDomAudit> {
  const page = await browser.newPage({ viewport: { width: 2048, height: 1152 }, deviceScaleFactor: 1 });
  await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
  await page.getByTestId('apothecary-exact-plane').waitFor({ state: 'visible', timeout: 30_000 });
  await page.screenshot({ path: screenshotPath, fullPage: false });

  return page.evaluate((auditTargets): HarmonyDomAudit => {
    const round = (value: number) => Math.round(value * 100) / 100;
    const rectFor = (element: Element | null): RectRecord | null => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: round(rect.x), y: round(rect.y), w: round(rect.width), h: round(rect.height) };
    };
    const within = (rect: RectRecord | null, target: RegionTarget['target'], tolerance: number): boolean => Boolean(rect)
      && Math.abs((rect?.x ?? 0) - target.x) <= tolerance
      && Math.abs((rect?.y ?? 0) - target.y) <= tolerance
      && Math.abs((rect?.w ?? 0) - target.w) <= tolerance
      && Math.abs((rect?.h ?? 0) - target.h) <= tolerance;
    const overlaps = (a: RectRecord | null, b: RectRecord | null): boolean => Boolean(a && b)
      && (a?.x ?? 0) < (b?.x ?? 0) + (b?.w ?? 0)
      && (a?.x ?? 0) + (a?.w ?? 0) > (b?.x ?? 0)
      && (a?.y ?? 0) < (b?.y ?? 0) + (b?.h ?? 0)
      && (a?.y ?? 0) + (a?.h ?? 0) > (b?.y ?? 0);
    const lineCountFor = (element: Element | null): number => element ? element.getClientRects().length : 0;
    const parseZ = (element: Element | null): number | null => {
      if (!element) return null;
      const parsed = Number.parseInt(window.getComputedStyle(element).zIndex, 10);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const regions = {} as Record<RegionKey, RegionAudit>;
    for (const [key, entry] of Object.entries(auditTargets) as Array<[RegionKey, RegionTarget]>) {
      const element = document.querySelector(`[data-testid="${entry.testId}"]`);
      const rect = rectFor(element);
      regions[key] = {
        testId: entry.testId,
        exists: Boolean(element),
        rect,
        target: entry.target,
        tolerance: entry.tolerance,
        withinTolerance: within(rect, entry.target, entry.tolerance),
        overflow: element ? {
          x: element.scrollWidth > element.clientWidth + 1,
          y: element.scrollHeight > element.clientHeight + 1,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        } : null,
      };
    }

    const root = document.querySelector('[data-testid="apothecary-exact-page"]');
    const bodyText = document.body.innerText || '';
    const atmosphere = document.querySelector('[data-testid="apothecary-exact-room-atmosphere"]');
    const atmosphereStyle = atmosphere ? window.getComputedStyle(atmosphere) : null;
    const panelZValues = [
      parseZ(document.querySelector('[data-testid="apothecary-exact-prescription"]')),
      parseZ(document.querySelector('[data-testid="apothecary-exact-buy-lane"]')),
      parseZ(document.querySelector('[data-testid="apothecary-exact-brew-lane"]')),
      parseZ(document.querySelector('[data-testid="apothecary-exact-pouch-card"]')),
      parseZ(document.querySelector('[data-testid="apothecary-exact-primary-cta"]')),
    ].filter((value): value is number => value !== null);
    const atmosphereZ = parseZ(atmosphere);
    const ctaText = document.querySelector('.apothecaryExactButton--primary span');
    const ctaTextRect = rectFor(ctaText);
    const ctaRegionRect = regions.primaryCta.rect;
    const lowerPanelRects = [regions.buyLane.rect, regions.brewLane.rect, regions.pouchCard.rect];
    const laneRows = Array.from(document.querySelectorAll('.apothecaryExactLaneRow'));
    const laneIconCopy = laneRows.filter((row) => overlaps(rectFor(row.querySelector('.apothecaryExactIcon')), rectFor(row.querySelector('.apothecaryExactLaneRow__copy')))).length;
    const laneCopyButton = laneRows.filter((row) => overlaps(rectFor(row.querySelector('.apothecaryExactLaneRow__copy')), rectFor(row.querySelector('button')))).length;
    const laneStrongCounts = laneRows.map((row) => lineCountFor(row.querySelector('.apothecaryExactLaneRow__copy strong')));
    const buttons = Array.from(document.querySelectorAll('[data-testid="apothecary-exact-page"] button'));

    return {
      schemaVersion: 'apothecary-exact-harmony-dom-audit.v1',
      generatedAt: new Date().toISOString(),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      rootTestId: 'apothecary-exact-page',
      rootExists: Boolean(root),
      rootMode: root ? root.getAttribute('data-mode') : null,
      found: Object.fromEntries(Object.entries(regions).map(([key, value]) => [key, value.exists])) as Record<RegionKey, boolean>,
      regions,
      rows: {
        prepCells: document.querySelectorAll('.apothecaryExactPrepCell').length,
        prescriptionRows: document.querySelectorAll('.apothecaryExactPrescription__row').length,
        warningChips: document.querySelectorAll('.apothecaryExactWarningChip').length,
        buyRows: document.querySelectorAll('.apothecaryExactBuyLane .apothecaryExactLaneRow').length,
        brewRows: document.querySelectorAll('.apothecaryExactBrewLane .apothecaryExactLaneRow').length,
      },
      textMarkers: {
        title: bodyText.includes('Apothecary'),
        cityChip: bodyText.includes('Pinewind Hamlet'),
        prescription: bodyText.includes('Prescription for Foundation Gate'),
        cta: bodyText.includes('Prepare Foundation Package'),
        noLegacyTabs: !bodyText.includes('Buy Remedies') && !bodyText.includes('Pouch tab'),
        noContextStrip: !bodyText.includes('Run Compass') && !bodyText.includes('City Services'),
      },
      warningLabels: Array.from(document.querySelectorAll('.apothecaryExactWarningChip--visible span:last-child')).map((element) => element.textContent || ''),
      atmosphere: {
        exists: Boolean(atmosphere),
        opacity: atmosphereStyle ? Number.parseFloat(atmosphereStyle.opacity) : null,
        pointerEvents: atmosphereStyle?.pointerEvents ?? null,
        zIndex: atmosphereZ,
        backgroundUsesRoomPlate: Boolean(atmosphereStyle?.backgroundImage.includes('apothecary_room_scenic_plate')),
        zIndexBelowPanels: atmosphereZ !== null && panelZValues.every((value) => atmosphereZ < value),
      },
      collisions: {
        prepPrescription: overlaps(regions.prepStrip.rect, regions.prescription.rect),
        prescriptionWarnings: overlaps(regions.prescription.rect, regions.warnings.rect),
        warningsLowerPanels: lowerPanelRects.some((rect) => overlaps(regions.warnings.rect, rect)),
        buyBottomActions: overlaps(regions.buyLane.rect, regions.bottomActions.rect),
        brewPrimaryCta: overlaps(regions.brewLane.rect, regions.primaryCta.rect),
        pouchObjectPouchText: overlaps(regions.pouchObject.rect, rectFor(document.querySelector('.apothecaryExactPouchLines'))),
        primaryCtaAttemptFit: overlaps(regions.primaryCta.rect, regions.attemptFit.rect),
        primaryCtaReturnGate: overlaps(regions.primaryCta.rect, regions.returnGate.rect),
        laneIconCopy,
        laneCopyButton,
      },
      clipping: {
        prescriptionY: regions.prescription.overflow?.y ?? true,
        buyLaneY: regions.buyLane.overflow?.y ?? true,
        brewLaneY: regions.brewLane.overflow?.y ?? true,
        pouchCardY: regions.pouchCard.overflow?.y ?? true,
        attemptFitY: regions.attemptFit.overflow?.y ?? true,
        primaryCtaTextOutside: Boolean(ctaTextRect && ctaRegionRect && (
          ctaTextRect.x < ctaRegionRect.x
          || ctaTextRect.y < ctaRegionRect.y
          || ctaTextRect.x + ctaTextRect.w > ctaRegionRect.x + ctaRegionRect.w
          || ctaTextRect.y + ctaTextRect.h > ctaRegionRect.y + ctaRegionRect.h
        )),
      },
      typography: {
        ctaLineCount: lineCountFor(ctaText),
        ctaText: ctaText ? ctaText.textContent : null,
        sourceIngredientsLineCount: lineCountFor(Array.from(document.querySelectorAll('.apothecaryExactBottomActions button')).find((element) => (element.textContent || '').trim() === 'Source Ingredients') ?? null),
        maxLaneStrongLineCount: laneStrongCounts.length > 0 ? Math.max(...laneStrongCounts) : 0,
      },
      buttons: {
        disabledStateMismatches: buttons
          .filter((button) => button.getAttribute('data-enabled') === 'false' && !button.hasAttribute('disabled'))
          .map((button) => button.getAttribute('data-action-id') ?? button.textContent ?? 'unknown'),
        actionableMissingAriaLabels: buttons
          .filter((button) => !button.hasAttribute('disabled') && !(button.getAttribute('aria-label') || '').trim())
          .map((button) => button.getAttribute('data-action-id') ?? button.textContent ?? 'unknown'),
      },
      forbidden: {
        flattenedMockup: Array.from(document.querySelectorAll('img')).some((image) => (image.getAttribute('src') || '').includes('apothecary mockup')),
        heavyRoomPlateElement: Boolean(document.querySelector('.apothecaryExactRoomPlate')),
        oldPrescriptionFrame: Boolean(document.querySelector('.apothecaryExactPrescription__frame')),
        oldPrimaryCtaImage: Boolean(document.querySelector('.apothecaryExactButton--primary img')),
        laneInlineRasterBackgrounds: Array.from(document.querySelectorAll('.apothecaryExactLaneRow')).filter((element) => (element.getAttribute('style') || '').includes('background-image')).length,
        debugOverlayText: ['FPS', 'GPU', 'CPU', 'LAT', 'To exit full screen'].filter((token) => bodyText.includes(token)),
        emojiIconText: /[\u{1F300}-\u{1FAFF}]/u.test(bodyText),
      },
    };
  }, targets);
}

export async function runApothecaryExactHarmonyCapture(rootDir = process.cwd()): Promise<CaptureRecord> {
  const outRoot = path.resolve(rootDir, OUT_ROOT);
  fs.mkdirSync(outRoot, { recursive: true });

  const screenshotPath = path.join(outRoot, '01-fixture.png');
  const domAuditPath = path.join(outRoot, '01-fixture.dom.json');
  const serverAlreadyRunning = await isServerReady();
  const devServer = serverAlreadyRunning ? null : startDevServer(rootDir);
  let stdout = '';
  let stderr = '';
  devServer?.stdout.on('data', (chunk) => {
    stdout += String(chunk);
  });
  devServer?.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });

  let browser: Browser | null = null;
  try {
    if (!serverAlreadyRunning) {
      await waitForServer(120_000);
    }
    const launch = await launchBrowser();
    browser = launch.browser;
    if (launch.stderr) stderr += `${stderr ? '\n' : ''}${launch.stderr}`;
    const audit = await captureDomAudit(browser, screenshotPath, buildAuditTargets());
    fs.writeFileSync(domAuditPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  } catch (error) {
    stderr += `${stderr ? '\n' : ''}${error instanceof Error ? error.message : String(error)}`;
  } finally {
    await browser?.close();
    if (devServer) {
      devServer.kill('SIGTERM');
    }
  }

  return {
    schemaVersion: 'apothecary-exact-harmony-capture.v1',
    generatedAt: new Date().toISOString(),
    ok: fs.existsSync(screenshotPath) && fs.existsSync(domAuditPath),
    url: FIXTURE_URL,
    usedExistingServer: serverAlreadyRunning,
    screenshotPath: path.relative(rootDir, screenshotPath),
    domAuditPath: path.relative(rootDir, domAuditPath),
    stderr,
    stdout,
  };
}

if (isMainModule()) {
  runApothecaryExactHarmonyCapture()
    .then((report) => {
      const outPath = path.resolve(process.cwd(), OUT_ROOT, 'apothecaryExactHarmonyCaptureAttempt.json');
      fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      if (report.stdout) process.stdout.write(report.stdout);
      if (report.stderr) process.stderr.write(report.stderr);
      console.log(JSON.stringify(report, null, 2));
      if (!report.ok) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error('[apothecary-exact-harmony-capture] failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
