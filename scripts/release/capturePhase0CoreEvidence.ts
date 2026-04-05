import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { PHASE0_CORE_EVIDENCE_TARGETS } from '../../src/dev/phase0CoreAudit/phase0CoreEvidenceManifest.js';
import {
  PHASE0_CORE_CAPTURE_SLOT_BY_FILE,
  PHASE0_CORE_CAPTURE_SLOT_FILES,
  type Phase0CoreCaptureSlotFile,
} from '../../src/dev/phase0CoreAudit/phase0CoreSurfaceIds.js';

interface CaptureArgs {
  json: boolean;
  baseUrl: string;
  rootDir: string;
  viewportWidth: number;
  viewportHeight: number;
  startupTimeoutMs: number;
  waitAfterLoadMs: number;
}

interface CaptureRecord {
  surfaceId: string;
  slotFile: string;
  outputPath: string;
  route: string;
}

interface CaptureReport {
  schemaVersion: 'phase-0-core-capture.v1';
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

  return {
    json,
    baseUrl: baseUrlArg ? baseUrlArg.slice('--base-url='.length) : 'http://127.0.0.1:4173',
    rootDir: rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd(),
    viewportWidth: widthArg ? Number(widthArg.slice('--width='.length)) : 1920,
    viewportHeight: heightArg ? Number(heightArg.slice('--height='.length)) : 1080,
    startupTimeoutMs: startupTimeoutArg ? Number(startupTimeoutArg.slice('--startup-timeout-ms='.length)) : 60_000,
    waitAfterLoadMs: waitArg ? Number(waitArg.slice('--wait-after-load-ms='.length)) : 700,
  };
}

function toFxMode(file: Phase0CoreCaptureSlotFile): 'high' | 'low' | 'reduced' {
  if (file === '05-low-fx.png') return 'low';
  if (file === '06-reduced-motion.png') return 'reduced';
  return 'high';
}

function renderHumanReport(report: CaptureReport): string {
  const lines = [
    '=== Phase 0 Core Evidence Capture ===',
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
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Timed out waiting for dev server at ${baseUrl}`);
}

async function runCapture(args: CaptureArgs): Promise<CaptureReport> {
  const playwrightModule = await import('playwright').catch(() => null);
  if (!playwrightModule || !('chromium' in playwrightModule)) {
    throw new Error(
      'Playwright is required for release:phase0-core-capture. Install it with `npm i -D playwright` and run `npx playwright install chromium`.',
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
      process.stdout.write('[phase0-capture] server responded but startup banner was not detected; continuing.\n');
    }

    const browser = await playwrightModule.chromium.launch();
    const context = await browser.newContext({
      viewport: {
        width: args.viewportWidth,
        height: args.viewportHeight,
      },
    });
    const page = await context.newPage();

    const records: CaptureRecord[] = [];

    for (const target of PHASE0_CORE_EVIDENCE_TARGETS) {
      const evidenceDir = path.resolve(args.rootDir, target.evidenceFolder);
      fs.mkdirSync(evidenceDir, { recursive: true });

      for (const slotFile of PHASE0_CORE_CAPTURE_SLOT_FILES) {
        const slot = PHASE0_CORE_CAPTURE_SLOT_BY_FILE[slotFile];
        const fx = toFxMode(slotFile);
        const route = `${args.baseUrl}/?uiAudit=phase-0&surface=${target.id}&slot=${slot}&fx=${fx}&controls=0`;

        await page.goto(route, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-ui="phase0-core-ready"][data-ready="1"]', { timeout: 15_000 });
        await page.waitForTimeout(args.waitAfterLoadMs);

        const outputPath = path.resolve(evidenceDir, slotFile);
        await page.screenshot({ path: outputPath, fullPage: true });

        records.push({
          surfaceId: target.id,
          slotFile,
          outputPath: path.relative(args.rootDir, outputPath),
          route,
        });
      }
    }

    await context.close();
    await browser.close();

    return {
      schemaVersion: 'phase-0-core-capture.v1',
      generatedAt: new Date().toISOString(),
      baseUrl: args.baseUrl,
      capturedCount: records.length,
      records,
    };
  } finally {
    devServer.kill('SIGTERM');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
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
      console.error('[phase0-capture] failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
