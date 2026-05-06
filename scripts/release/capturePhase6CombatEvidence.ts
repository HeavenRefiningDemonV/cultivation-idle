import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PHASE6_COMBAT_EVIDENCE_TARGETS } from '../../src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.js';
import {
  PHASE6_COMBAT_CAPTURE_SLOT_BY_FILE,
  PHASE6_COMBAT_CAPTURE_SLOT_FILES,
  type Phase6CombatCaptureSlotFile,
} from '../../src/dev/phase6CombatAudit/phase6CombatSurfaceIds.js';

interface CaptureArgs {
  json: boolean;
  baseUrl: string;
  rootDir: string;
  viewportWidth: number;
  viewportHeight: number;
  startupTimeoutMs: number;
  waitAfterLoadMs: number;
  surfaceIds: string[] | null;
  ruinsExactMode: 'fixture' | 'live' | null;
  gateTrialExactMode: 'fixture' | 'live' | null;
}

interface CaptureRecord {
  surfaceId: string;
  slotFile: string;
  outputPath: string;
  route: string;
  domAuditPath?: string;
}

interface CaptureReport {
  schemaVersion: 'phase-6-combat-capture.v1';
  generatedAt: string;
  baseUrl: string;
  capturedCount: number;
  records: CaptureRecord[];
}

function parseArgs(argv: string[]): CaptureArgs {
  const json = argv.includes('--json');
  const baseUrlArg = argv.find((arg) => arg.startsWith('--base-url='));
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  const widthArg = argv.find((arg) => arg.startsWith('--width='));
  const heightArg = argv.find((arg) => arg.startsWith('--height='));
  const startupTimeoutArg = argv.find((arg) => arg.startsWith('--startup-timeout-ms='));
  const waitArg = argv.find((arg) => arg.startsWith('--wait-after-load-ms='));
  const surfaceArg = argv.find((arg) => arg.startsWith('--surface='));
  const surfacesArg = argv.find((arg) => arg.startsWith('--surfaces='));
  const ruinsExactModeArg = argv.find((arg) => arg.startsWith('--ruins-exact-mode='));
  const gateTrialExactModeArg = argv.find((arg) => arg.startsWith('--gate-trial-exact-mode='));
  const surfaceCsv = surfacesArg ? surfacesArg.slice('--surfaces='.length) : surfaceArg ? surfaceArg.slice('--surface='.length) : '';
  const surfaceIds = surfaceCsv
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return {
    json,
    baseUrl: baseUrlArg ? baseUrlArg.slice('--base-url='.length) : 'http://127.0.0.1:4173',
    rootDir: rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd(),
    viewportWidth: widthArg ? Number(widthArg.slice('--width='.length)) : 1920,
    viewportHeight: heightArg ? Number(heightArg.slice('--height='.length)) : 1080,
    startupTimeoutMs: startupTimeoutArg ? Number(startupTimeoutArg.slice('--startup-timeout-ms='.length)) : 60_000,
    waitAfterLoadMs: waitArg ? Number(waitArg.slice('--wait-after-load-ms='.length)) : 700,
    surfaceIds: surfaceIds.length > 0 ? [...new Set(surfaceIds)] : null,
    ruinsExactMode: ruinsExactModeArg?.slice('--ruins-exact-mode='.length) === 'fixture'
      ? 'fixture'
      : ruinsExactModeArg?.slice('--ruins-exact-mode='.length) === 'live'
        ? 'live'
        : null,
    gateTrialExactMode: gateTrialExactModeArg?.slice('--gate-trial-exact-mode='.length) === 'fixture'
      ? 'fixture'
      : gateTrialExactModeArg?.slice('--gate-trial-exact-mode='.length) === 'live'
        ? 'live'
        : null,
  };
}

function resolveCaptureTargets(surfaceIds: string[] | null) {
  if (!surfaceIds) return [...PHASE6_COMBAT_EVIDENCE_TARGETS];
  const targetById = new Map(PHASE6_COMBAT_EVIDENCE_TARGETS.map((target) => [target.id, target]));
  const unknown = surfaceIds.filter((surfaceId) => !targetById.has(surfaceId));
  if (unknown.length > 0) {
    throw new Error(`Unknown phase-6-combat surface id(s): ${unknown.join(', ')}`);
  }
  return surfaceIds.map((surfaceId) => targetById.get(surfaceId)!);
}

function toFxMode(file: Phase6CombatCaptureSlotFile): 'high' | 'low' | 'reduced' {
  if (file === '05-low-fx.png') return 'low';
  if (file === '06-reduced-motion.png') return 'reduced';
  return 'high';
}

function appendCaptureParams(
  route: string,
  slot: string,
  ruinsExactMode: 'fixture' | 'live' | null,
  gateTrialExactMode: 'fixture' | 'live' | null,
): string {
  const url = new URL(route, 'http://localhost');
  url.searchParams.set('slot', slot);
  url.searchParams.set('controls', '0');
  if (url.searchParams.get('surface') === 'ruins' && ruinsExactMode) {
    url.searchParams.set('ruinsExactMode', ruinsExactMode);
  }
  if (url.searchParams.get('surface') === 'gate-trial' && gateTrialExactMode) {
    url.searchParams.set('gateTrialExactMode', gateTrialExactMode);
  }
  return `${url.pathname}${url.search}`;
}

function buildDomAuditInPage(surfaceId: string) {
  const getRect = (selector: string) => {
    const node = document.querySelector(selector) as HTMLElement | null;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
    };
  };

  const text = document.body?.innerText ?? '';
  const haystack = `${text}\n${document.body?.className ?? ''}\n${document.body?.innerHTML ?? ''}`;

  if (surfaceId === 'gate-trial') {
    const exactPage = '[data-testid="gate-trial-exact-page"]';
    const topRegion = '[data-testid="gate-trial-exact-top-region"]';
    const tacticalStrip = '[data-testid="gate-trial-tactical-strip"]';
    const leftRail = '[data-testid="gate-trial-exact-left-rail"]';
    const minimumChecklist = '[data-testid="gate-trial-minimum-checklist"]';
    const gateHeader = '[data-testid="gate-trial-exact-gate-header-slot"]';
    const scenicStage = '[data-testid="gate-trial-scenic-stage"]';
    const readinessSeal = '[data-testid="gate-trial-readiness-seal"]';
    const guardianPlaque = '[data-testid="gate-trial-guardian-plaque"]';
    const rightRail = '[data-testid="gate-trial-exact-right-rail"]';
    const recommendedPanel = '[data-testid="gate-trial-recommended-panel"]';
    const trialSummary = '[data-testid="gate-trial-trial-summary"]';
    const readinessRail = '[data-testid="gate-trial-readiness-rail"]';
    const primaryCta = '[data-testid="gate-trial-primary-cta"]';
    const resultTransition = '[data-testid="gate-trial-result-transition"]';
    const activeTheater = '[data-testid="gate-trial-active-theater"]';
    const scenicNode = document.querySelector(scenicStage) as HTMLElement | null;
    const pageRect = getRect(exactPage);
    const topRegionRect = getRect(topRegion);
    const tacticalStripRect = getRect(tacticalStrip);
    const leftRailRect = getRect(leftRail);
    const scenicRect = getRect(scenicStage);
    const gateHeaderRect = getRect(gateHeader);
    const readinessSealRect = getRect(readinessSeal);
    const guardianPlaqueRect = getRect(guardianPlaque);
    const rightRailRect = getRect(rightRail);
    const recommendedPanelRect = getRect(recommendedPanel);
    const summaryRect = getRect(trialSummary);
    const readinessRailRect = getRect(readinessRail);
    const ctaRect = getRect(primaryCta);

    return {
      schemaVersion: 'gate-trial-exact-dom-audit.v1',
      url: window.location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      bodyClasses: Array.from(document.body?.classList ?? []),
      found: {
        exactPage: !!document.querySelector(exactPage),
        topRegion: !!document.querySelector(topRegion),
        tacticalStrip: !!document.querySelector(tacticalStrip),
        leftRail: !!document.querySelector(leftRail),
        minimumChecklist: !!document.querySelector(minimumChecklist),
        gateHeader: !!document.querySelector(gateHeader),
        scenicStage: !!document.querySelector(scenicStage),
        readinessSeal: !!document.querySelector(readinessSeal),
        guardianPlaque: !!document.querySelector(guardianPlaque),
        rightRail: !!document.querySelector(rightRail),
        recommendedPanel: !!document.querySelector(recommendedPanel),
        trialSummary: !!document.querySelector(trialSummary),
        readinessRail: !!document.querySelector(readinessRail),
        primaryCta: !!document.querySelector(primaryCta),
        resultTransition: !!document.querySelector(resultTransition),
        activeTheater: !!document.querySelector(activeTheater),
      },
      textMarkers: {
        gateTrialTitle: text.includes('Gate Trial'),
        foundationGate: text.includes('Foundation Gate'),
        minimumChecklist: text.includes('Minimum Checklist'),
        recommended: text.includes('Recommended'),
        trialSummary: text.includes('Trial Summary'),
        foundationGateReadiness: text.includes('Foundation Gate Readiness'),
        attemptGate: text.includes('Attempt Gate'),
        stopAttempt: text.includes('Stop Attempt'),
        viable: text.includes('VIABLE'),
        readinessScore: text.includes('Readiness 74 / 100') || text.includes('Readiness 74/100'),
        gateGuardian: text.includes('Gate Guardian'),
        gateFoundationPill: text.includes('Gate Foundation Pill'),
        safetyNet: text.includes('Safety Net'),
        topFixes: text.includes('Top Fixes'),
        gateRejected: text.includes('GATE REJECTED'),
        safetyNetReady: text.includes('SAFETY NET READY'),
        safetyNetSecured: text.includes('SAFETY NET SECURED'),
        gateOpened: text.includes('GATE OPENED'),
      },
      forbiddenOldShellMarkers: [
        'Run Compass unavailable.',
        'Best used when you are ready',
        'Still Check',
        'Minimum Floor',
        'Recommended Floor',
        'Gate Progress',
        'GateTrialWorldLayout',
        'GateTrialAttemptCluster',
        'GateTrialReadinessCard',
        'gateTrialPanel',
        'worldBuildingBody--combat-path',
        'worldBuildingBody--inside-dungeon',
        'CombatTheaterModal',
        'combatPathModule',
      ].filter((token) => haystack.includes(token)),
      forbiddenCrossSurfaceMarkers: [
        'Start Hunt',
        'Hollow Log Den',
        'Expected Rewards',
        'Rare Pity',
        'Final Chest',
        'Exploration Summary',
        'Guaranteed Anchor',
        'Auto-Repeat',
      ].filter((token) => haystack.includes(token)),
      artStatus: {
        dataArtStatus: scenicNode?.getAttribute('data-art-status') ?? null,
        dataFinalArtRequired: scenicNode?.getAttribute('data-final-art-required') ?? null,
        dataApprovedPlateBound: scenicNode?.getAttribute('data-approved-plate-bound') ?? null,
        strictVisualParityBlocked: scenicNode?.getAttribute('data-strict-visual-parity-blocked') ?? null,
      },
      rects: {
        page: pageRect,
        topRegion: topRegionRect,
        tacticalStrip: tacticalStripRect,
        leftRail: leftRailRect,
        scenic: scenicRect,
        gateHeader: gateHeaderRect,
        readinessSeal: readinessSealRect,
        guardianPlaque: guardianPlaqueRect,
        rightRail: rightRailRect,
        recommendedPanel: recommendedPanelRect,
        summary: summaryRect,
        readinessRail: readinessRailRect,
        cta: ctaRect,
      },
      geometry: {
        noVerticalPageScroll: document.documentElement.scrollHeight <= window.innerHeight + 2,
        ctaWithinViewport: !!ctaRect && ctaRect.bottom <= window.innerHeight && ctaRect.top >= 0,
        railAboveCta: !!readinessRailRect && !!ctaRect && readinessRailRect.bottom <= ctaRect.top + 16,
        summaryRightOfScenic: !!summaryRect && !!scenicRect && summaryRect.left > scenicRect.right,
        leftRailLeftOfScenic: !!leftRailRect && !!scenicRect && leftRailRect.right < scenicRect.left,
        rightRailRightOfScenic: !!rightRailRect && !!scenicRect && rightRailRect.left > scenicRect.right,
        centerDominatesWidth: !!scenicRect
          && !!leftRailRect
          && !!rightRailRect
          && scenicRect.width > leftRailRect.width
          && scenicRect.width > rightRailRect.width,
      },
    };
  }

  return {
    schemaVersion: 'ruins-exact-dom-audit.v1',
    url: window.location.href,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    bodyClasses: Array.from(document.body?.classList ?? []),
    found: {
      exactPage: !!document.querySelector('[data-testid="ruins-exact-page"]'),
      leftRail: !!document.querySelector('[data-testid="ruins-exact-left-rail"]'),
      scenicStage: !!document.querySelector('[data-testid="ruins-exact-scenic-stage"]'),
      rightRail: !!document.querySelector('[data-testid="ruins-exact-right-rail"]'),
      route: !!document.querySelector('[data-testid="ruins-exact-room-route-strip"]'),
      cta: !!document.querySelector('[data-testid="ruins-primary-cta"]'),
      summary: !!document.querySelector('[data-testid="ruins-exploration-summary"]'),
    },
    textMarkers: {
      spiritLeaf: text.includes('Spirit Leaf'),
      beastMaterials: text.includes('Beast Materials'),
      guaranteedAnchor: text.includes('Guaranteed Anchor'),
      coreFragment: text.includes('Core Fragment x1'),
      rarePity: text.includes('Rare Pity'),
      autoRepeatOff: text.includes('Auto-Repeat') && text.includes('Off'),
      route: text.includes('Hollow Log Den Route'),
      cta: text.includes('Continue Exploration'),
      summary: text.includes('Exploration Summary'),
    },
    forbiddenOldShellMarkers: ['combatPathModule', 'ruinsPanel', 'RuinsSummaryCard', 'RuinsProgress', 'RuinsCtaZone', 'worldBuildingBody--combat-path', 'worldBuildingBody--inside-dungeon'].filter((token) => text.includes(token) || (document.body?.className.includes(token) ?? false)),
    rects: {
      tacticalStrip: getRect('[data-testid="ruins-tactical-strip"]'),
      leftRail: getRect('[data-testid="ruins-exact-left-rail"]'),
      scenic: getRect('[data-testid="ruins-exact-center-scenic-slot"]'),
      rightRail: getRect('[data-testid="ruins-exact-right-rail"]'),
      route: getRect('[data-testid="ruins-exact-route-slot"]'),
      cta: getRect('[data-testid="ruins-exact-cta-slot"]'),
      summary: getRect('[data-testid="ruins-exact-summary-dock"]'),
    },
  };
}

function renderHumanReport(report: CaptureReport): string {
  const lines = [
    '=== Phase 6 Combat Evidence Capture ===',
    `generatedAt: ${report.generatedAt}`,
    `baseUrl: ${report.baseUrl}`,
    `capturedCount: ${report.capturedCount}`,
    '',
    'Captured files:',
  ];

  for (const record of report.records) {
    lines.push(`- ${record.surfaceId} :: ${record.slotFile} -> ${record.outputPath}`);
  }

  return lines.join('\n');
}

async function waitForServerReady(baseUrl: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // continue polling
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Timed out waiting for dev server at ${baseUrl}`);
}

async function runCapture(args: CaptureArgs): Promise<CaptureReport> {
  const captureTargets = resolveCaptureTargets(args.surfaceIds);
  const playwrightModule = await import('playwright').catch(() => null);
  if (!playwrightModule || !('chromium' in playwrightModule)) {
    throw new Error(
      'Playwright is required for release:phase6-combat-capture. Install it with `npm i -D playwright` and run `npx playwright install chromium`.',
    );
  }

  const devServer = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: args.rootDir,
    stdio: 'pipe',
    env: {
      ...process.env,
      CI: '1',
    },
  });

  let serverStarted = false;

  const forwardOutput = (chunk: Buffer) => {
    const text = chunk.toString();
    if (text.includes('Local:') || text.includes('127.0.0.1:4173')) {
      serverStarted = true;
    }
    process.stdout.write(text);
  };

  devServer.stdout?.on('data', forwardOutput);
  devServer.stderr?.on('data', forwardOutput);

  try {
    await waitForServerReady(args.baseUrl, args.startupTimeoutMs);
    if (!serverStarted) {
      process.stdout.write('[phase6-combat-capture] server responded but startup banner was not detected; continuing.\n');
    }

    const browser = await playwrightModule.chromium.launch();
    const context = await browser.newContext({ viewport: { width: args.viewportWidth, height: args.viewportHeight } });
    const page = await context.newPage();

    const records: CaptureRecord[] = [];

    for (const target of captureTargets) {
      const evidenceDir = path.resolve(args.rootDir, target.evidenceFolder);
      fs.mkdirSync(evidenceDir, { recursive: true });

      for (const slotFile of PHASE6_COMBAT_CAPTURE_SLOT_FILES) {
        const slot = PHASE6_COMBAT_CAPTURE_SLOT_BY_FILE[slotFile];
        const fx = toFxMode(slotFile);
        const route = `${args.baseUrl}${appendCaptureParams(
          target.captureRoutes[fx],
          slot,
          args.ruinsExactMode,
          args.gateTrialExactMode,
        )}`;

        await page.goto(route, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-ui="phase6-combat-ready"][data-ready="1"]', { timeout: 15_000 });
        await page.waitForTimeout(args.waitAfterLoadMs);

        const outputPath = path.resolve(evidenceDir, slotFile);
        const fullPage = target.id === 'ruins' ? false : target.id === 'gate-trial' ? false : true;
        await page.screenshot({ path: outputPath, fullPage });
        const domAuditPath = path.resolve(evidenceDir, slotFile.replace('.png', '.dom.json'));
        const domAudit = await page.evaluate(buildDomAuditInPage, target.id);
        fs.writeFileSync(domAuditPath, `${JSON.stringify(domAudit, null, 2)}\n`, 'utf8');
        records.push({
          surfaceId: target.id,
          slotFile,
          outputPath: path.relative(args.rootDir, outputPath),
          route,
          domAuditPath: path.relative(args.rootDir, domAuditPath),
        });
      }
    }

    await context.close();
    await browser.close();

    return {
      schemaVersion: 'phase-6-combat-capture.v1',
      generatedAt: new Date().toISOString(),
      baseUrl: args.baseUrl,
      capturedCount: records.length,
      records,
    };
  } finally {
    devServer.kill('SIGTERM');
  }
}

function isMainModule(): boolean {
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '');
}

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  runCapture(args)
    .then((report) => {
      if (args.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(renderHumanReport(report));
      }
    })
    .catch((error) => {
      console.error('[phase6-combat-capture] failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
