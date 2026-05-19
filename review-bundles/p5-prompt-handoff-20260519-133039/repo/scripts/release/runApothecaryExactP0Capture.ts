import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createApothecaryExactMockupFixture } from '../../src/features/apothecary/exact/buildApothecaryExactSurface.js';
import { APOTHECARY_EXACT_REGIONS } from '../../src/features/apothecary/exact/apothecaryExactPresentation.js';
import type {
  ApothecaryExactAssetKey,
  ApothecaryExactButtonSurface,
  ApothecaryExactSurfaceV1,
} from '../../src/features/apothecary/exact/apothecaryExactTypes.js';

const OUT_ROOT = 'docs/release/qa/ui-cutover/apothecary-exact/p0-freeze';

interface ApothecaryExactCaptureRecord {
  schemaVersion: 'apothecary-exact-p0-capture.v1';
  generatedAt: string;
  ok: boolean;
  browserPath: string | null;
  htmlPath: string;
  screenshotPath: string;
  domAuditPath: string;
  stderr: string;
  stdout: string;
}

interface CdpTarget {
  id: string;
  type: string;
  url: string;
  webSocketDebuggerUrl?: string;
}

interface CdpMessage {
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { message?: string };
}

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

const REGION_TOLERANCE_PX: Record<keyof typeof REGION_TEST_IDS, number> = {
  header: 6,
  cityChip: 6,
  prepStrip: 4,
  prescription: 4,
  warnings: 6,
  buyLane: 6,
  brewLane: 6,
  pouchCard: 6,
  pouchObject: 6,
  bottomActions: 6,
  primaryCta: 4,
  returnGate: 6,
  attemptFit: 4,
};

function isMainModule(): boolean {
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function assetSrc(surface: ApothecaryExactSurfaceV1, key: ApothecaryExactAssetKey): string {
  return surface.assets[key]?.src ?? '';
}

function icon(surface: ApothecaryExactSurfaceV1, key: ApothecaryExactAssetKey, extraClass = ''): string {
  return `<span class="apothecaryExactIcon ${extraClass}" aria-hidden="true"><img src="${escapeHtml(assetSrc(surface, key))}" alt="" /></span>`;
}

function button(action: ApothecaryExactButtonSurface, className: string, inner?: string): string {
  const classes = ['apothecaryExactButton', `apothecaryExactButton--${action.tone}`, className].filter(Boolean).join(' ');
  return [
    `<button type="button" class="${classes}" data-action-id="${escapeHtml(action.id)}" data-intent="${action.intent}" data-enabled="${action.enabled ? 'true' : 'false'}" aria-label="${escapeHtml(action.ariaLabel)}"${action.enabled ? '' : ' disabled'}>`,
    inner ?? escapeHtml(action.label),
    '</button>',
  ].join('');
}

function buildDomAuditExpression(): string {
  const targets = Object.fromEntries(
    Object.entries(REGION_TEST_IDS).map(([key, testId]) => [
      key,
      {
        testId,
        target: APOTHECARY_EXACT_REGIONS[key as keyof typeof APOTHECARY_EXACT_REGIONS],
        tolerance: REGION_TOLERANCE_PX[key as keyof typeof REGION_TEST_IDS],
      },
    ]),
  );

  return `(() => {
    const targets = ${JSON.stringify(targets)};
    const round = (value) => Math.round(value * 100) / 100;
    const rectFor = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: round(rect.x), y: round(rect.y), w: round(rect.width), h: round(rect.height) };
    };
    const within = (rect, target, tolerance) => Boolean(rect)
      && Math.abs(rect.x - target.x) <= tolerance
      && Math.abs(rect.y - target.y) <= tolerance
      && Math.abs(rect.w - target.w) <= tolerance
      && Math.abs(rect.h - target.h) <= tolerance;
    const overlaps = (a, b) => Boolean(a && b)
      && a.x < b.x + b.w
      && a.x + a.w > b.x
      && a.y < b.y + b.h
      && a.y + a.h > b.y;
    const regions = {};
    for (const [key, entry] of Object.entries(targets)) {
      const el = document.querySelector('[data-testid="' + entry.testId + '"]');
      const rect = rectFor(el);
      regions[key] = {
        testId: entry.testId,
        exists: Boolean(el),
        rect,
        target: entry.target,
        tolerance: entry.tolerance,
        withinTolerance: within(rect, entry.target, entry.tolerance),
        overflow: el ? {
          x: el.scrollWidth > el.clientWidth + 1,
          y: el.scrollHeight > el.clientHeight + 1,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        } : null,
      };
    }
    const bodyText = document.body.innerText || '';
    const ctaText = document.querySelector('.apothecaryExactButton--primary span');
    const attemptFit = document.querySelector('[data-testid="apothecary-exact-attempt-fit"]');
    const prescriptionRows = document.querySelectorAll('.apothecaryExactPrescription__row');
    const warningLabels = Array.from(document.querySelectorAll('.apothecaryExactWarningChip--visible span:last-child')).map((el) => el.textContent || '');
    const root = document.querySelector('[data-testid="apothecary-exact-page"]');
    const ctaTextRect = rectFor(ctaText);
    const ctaRegionRect = regions.primaryCta && regions.primaryCta.rect;
    return JSON.stringify({
      schemaVersion: 'apothecary-exact-dom-audit.v2',
      generatedAt: new Date().toISOString(),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      rootTestId: 'apothecary-exact-page',
      rootExists: Boolean(root),
      rootMode: root ? root.getAttribute('data-mode') : null,
      found: Object.fromEntries(Object.entries(regions).map(([key, value]) => [key, value.exists])),
      regions,
      rows: {
        prepCells: document.querySelectorAll('.apothecaryExactPrepCell').length,
        prescriptionRows: prescriptionRows.length,
        warningChips: document.querySelectorAll('.apothecaryExactWarningChip').length,
        buyRows: document.querySelectorAll('.apothecaryExactBuyLane .apothecaryExactLaneRow').length,
        brewRows: document.querySelectorAll('.apothecaryExactBrewLane .apothecaryExactLaneRow').length,
      },
      textMarkers: {
        title: bodyText.includes('Apothecary'),
        cityChip: bodyText.includes('Pinewind Hamlet · 2 Expeditions Idle · 1 Tracked Bounty'),
        prescription: bodyText.includes('Prescription for Foundation Gate'),
        cta: bodyText.includes('Prepare Foundation Package'),
        noLegacyTabs: !bodyText.includes('Buy Remedies') && !bodyText.includes('Pouch tab'),
        noContextStrip: !bodyText.includes('Run Compass') && !bodyText.includes('City Services'),
        noLiveIronblood: !bodyText.includes('Ironblood Pellet'),
        noLiveQiElixir: !bodyText.includes('Qi Elixir'),
      },
      warningLabels,
      overlaps: {
        prepPrescription: overlaps(regions.prepStrip && regions.prepStrip.rect, regions.prescription && regions.prescription.rect),
        prescriptionWarnings: overlaps(regions.prescription && regions.prescription.rect, regions.warnings && regions.warnings.rect),
      },
      clipping: {
        brewLaneY: regions.brewLane && regions.brewLane.overflow ? regions.brewLane.overflow.y : true,
        attemptFitY: regions.attemptFit && regions.attemptFit.overflow ? regions.attemptFit.overflow.y : true,
        primaryCtaTextOutside: Boolean(ctaTextRect && ctaRegionRect && (
          ctaTextRect.x < ctaRegionRect.x ||
          ctaTextRect.y < ctaRegionRect.y ||
          ctaTextRect.x + ctaTextRect.w > ctaRegionRect.x + ctaRegionRect.w ||
          ctaTextRect.y + ctaTextRect.h > ctaRegionRect.y + ctaRegionRect.h
        )),
      },
      wrapping: {
        ctaLineCount: ctaText ? ctaText.getClientRects().length : 0,
        ctaText: ctaText ? ctaText.textContent : null,
        sourceIngredientsLineCount: (() => {
          const source = Array.from(document.querySelectorAll('.apothecaryExactBottomActions button')).find((el) => (el.textContent || '').trim() === 'Source Ingredients');
          return source ? source.getClientRects().length : 0;
        })(),
      },
      heavyRasterBackplates: {
        roomPlateImg: Boolean(document.querySelector('.apothecaryExactRoomPlate')),
        prescriptionFrameImg: Boolean(document.querySelector('.apothecaryExactPrescription__frame')),
        primaryCtaImg: Boolean(document.querySelector('.apothecaryExactButton--primary img')),
        laneRowsWithInlineBackground: Array.from(document.querySelectorAll('.apothecaryExactLaneRow')).filter((el) => (el.getAttribute('style') || '').includes('background-image')).length,
      },
      forbiddenOverlayText: ['FPS', 'GPU', 'CPU', 'LAT', 'To exit full screen'].filter((token) => bodyText.includes(token)),
      forbiddenRuntimeMockup: Array.from(document.querySelectorAll('img')).some((img) => (img.getAttribute('src') || '').includes('apothecary mockup')),
      assetWarnings: [],
    });
  })()`;
}

function renderHtml(surface: ApothecaryExactSurfaceV1, css: string): string {
  const prep = surface.prepStrip.map((cell) => `
    <div class="apothecaryExactPrepCell apothecaryExactTone--${cell.tone}" data-cell-id="${escapeHtml(cell.id)}">
      ${icon(surface, cell.iconKey, 'apothecaryExactPrepCell__icon')}
      <div class="apothecaryExactPrepCell__copy"><span class="apothecaryExactPrepCell__label">${escapeHtml(cell.label)}</span><strong class="apothecaryExactPrepCell__value">${escapeHtml(cell.value)}</strong></div>
    </div>`).join('');

  const prescriptionRows = surface.prescription.rows.map((row) => `
    <div class="apothecaryExactPrescription__row apothecaryExactTone--${row.tone}" role="row" data-row-id="${escapeHtml(row.id)}">
      <span class="apothecaryExactPrescription__item">${icon(surface, row.iconKey)}<strong>${escapeHtml(row.itemName)}</strong></span>
      <span>${escapeHtml(row.ownedLabel)}</span>
      <span>${escapeHtml(row.recommendedLabel)}</span>
      <span class="apothecaryExactPrescription__missing">${escapeHtml(row.missingLabel)}</span>
      <span class="apothecaryExactPrescription__actions">${row.actions.map((action) => button(action, 'apothecaryExactButton--chip')).join('')}</span>
    </div>`).join('');

  const warnings = surface.warningStrip.map((warning) => `
    <div class="apothecaryExactWarningChip apothecaryExactWarningChip--${warning.visible ? 'visible' : 'reserved'} apothecaryExactTone--${warning.tone}" data-warning-id="${escapeHtml(warning.id)}">
      ${warning.visible ? icon(surface, warning.iconKey) : ''}<span>${escapeHtml(warning.label)}</span>
    </div>`).join('');

  const buyRows = surface.buyLane.rows.map((row) => `
    <div class="apothecaryExactLaneRow apothecaryExactTone--${row.tone}">
      ${icon(surface, row.iconKey)}
      <div class="apothecaryExactLaneRow__copy"><strong>${escapeHtml(row.itemName)}</strong><span><span class="apothecaryExactCoin" aria-hidden="true"></span>${escapeHtml(row.priceLabel)}</span></div>
      <span class="apothecaryExactLaneRow__meta">${escapeHtml(row.stockLabel)}</span>
      ${button(row.action, 'apothecaryExactButton--lane')}
    </div>`).join('');

  const brewRows = surface.brewLane.rows.map((row) => `
    <div class="apothecaryExactLaneRow apothecaryExactLaneRow--brew apothecaryExactTone--${row.tone}">
      ${icon(surface, row.iconKey)}
      <div class="apothecaryExactLaneRow__copy"><strong>${escapeHtml(row.outputLabel)}</strong><span>${escapeHtml(row.ingredientLabel)}</span></div>
      <span class="apothecaryExactLaneRow__meta">${row.ingredientCountLabel ? `${icon(surface, row.ingredientIconKey, 'apothecaryExactIcon--tiny')}${escapeHtml(row.ingredientCountLabel)}` : ''}</span>
      ${button(row.action, 'apothecaryExactButton--lane')}
    </div>`).join('');

  const pouchLines = surface.pouchCard.lines.map((line) => `
    <div class="apothecaryExactPouchLine apothecaryExactTone--${line.tone}">
      ${icon(surface, line.iconKey, 'apothecaryExactIcon--small')}
      <span><strong>${escapeHtml(line.label)}:</strong> ${escapeHtml(line.value)}</span>
    </div>`).join('');

  const bottomActions = surface.bottomActions.map((action) => button(action, 'apothecaryExactButton--secondary')).join('');
  const ctaInner = `<span>${escapeHtml(surface.primaryAction.label)}</span>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=2048,height=1152,initial-scale=1" />
  <title>Apothecary Exact P0 Fixture Capture</title>
  <style>
    html, body { margin: 0; width: 2048px; height: 1152px; overflow: hidden; background: #e8dfd0; }
    * { box-sizing: border-box; }
    ${css}
    .apothecaryExactPage { width: 2048px !important; height: 1152px !important; min-height: 1152px !important; }
    .apothecaryExactPlane { left: 0 !important; top: 0 !important; transform: none !important; transform-origin: 0 0 !important; }
  </style>
</head>
<body>
  <div class="apothecaryExactPage" data-testid="${surface.meta.rootTestId}" data-mode="${surface.meta.mode}" data-source="${surface.meta.source}" data-focus="${surface.meta.focus}" style="--apoth-exact-scale:1">
    <div class="apothecaryExactPlane" data-testid="apothecary-exact-plane">
      <header class="apothecaryExactHeader" data-testid="apothecary-exact-header">
        <div class="apothecaryExactHeader__titleRow"><h1>${escapeHtml(surface.pageHeader.title)}</h1><span class="apothecaryExactHeader__seal" aria-hidden="true"></span></div>
        <p>${escapeHtml(surface.pageHeader.purpose)}</p>
      </header>
      <div class="apothecaryExactCityChip" data-testid="apothecary-exact-city-chip">${escapeHtml(surface.pageHeader.cityStatus)}</div>
      <section class="apothecaryExactPrepStrip" data-testid="apothecary-exact-prep-strip">${prep}</section>
      <section class="apothecaryExactPrescription" data-testid="apothecary-exact-prescription">
        <span class="apothecaryExactPrescription__leftScript" aria-hidden="true"></span>
        <span class="apothecaryExactPrescription__seal" aria-hidden="true"></span>
        <header class="apothecaryExactPrescription__header"><h2>${escapeHtml(surface.prescription.title)}</h2><p>${escapeHtml(surface.prescription.subtitle)}</p></header>
        <div class="apothecaryExactPrescription__table" role="table">
          <div class="apothecaryExactPrescription__head" role="row">${surface.prescription.columns.map((column) => `<span>${escapeHtml(column)}</span>`).join('')}</div>
          ${prescriptionRows}
        </div>
      </section>
      <section class="apothecaryExactWarnings" data-testid="apothecary-exact-warnings">${warnings}</section>
      <section class="apothecaryExactBuyLane apothecaryExactPanel" data-testid="apothecary-exact-buy-lane"><header class="apothecaryExactLaneHeader"><h3>${escapeHtml(surface.buyLane.title)}</h3><p>${escapeHtml(surface.buyLane.subtitle)}</p></header><div class="apothecaryExactLaneRows">${buyRows}</div></section>
      <section class="apothecaryExactBrewLane apothecaryExactPanel" data-testid="apothecary-exact-brew-lane"><header class="apothecaryExactLaneHeader"><h3>${escapeHtml(surface.brewLane.title)}</h3><p>${escapeHtml(surface.brewLane.subtitle)}</p></header><div class="apothecaryExactLaneRows">${brewRows}</div></section>
      <section class="apothecaryExactPouchCard apothecaryExactPanel" data-testid="apothecary-exact-pouch-card"><header class="apothecaryExactLaneHeader"><h3>${escapeHtml(surface.pouchCard.title)}</h3><p>${escapeHtml(surface.pouchCard.subtitle)}</p></header><div class="apothecaryExactPouchLines">${pouchLines}</div><div class="apothecaryExactPouchButtons">${surface.pouchCard.buttons.map((action) => button(action, 'apothecaryExactButton--wide')).join('')}</div></section>
      <button type="button" class="apothecaryExactPouchObject" data-testid="apothecary-exact-pouch-object"><img src="${escapeHtml(assetSrc(surface, 'objects.medicinePouch'))}" alt="${escapeHtml(surface.pouchObject.alt)}" /></button>
      <section class="apothecaryExactBottomActions" data-testid="apothecary-exact-bottom-actions">${bottomActions}</section>
      <section class="apothecaryExactPrimaryCta" data-testid="apothecary-exact-primary-cta">${button(surface.primaryAction, 'apothecaryExactButton--primary', ctaInner)}</section>
      <section class="apothecaryExactReturnGate" data-testid="apothecary-exact-return-gate">${button(surface.returnAction, 'apothecaryExactButton--return')}</section>
      <aside class="apothecaryExactAttemptFit" data-testid="apothecary-exact-attempt-fit"><h3>${escapeHtml(surface.attemptFit.title)}</h3>${surface.attemptFit.lines.map((line) => `<div class="apothecaryExactAttemptFit__line apothecaryExactTone--${line.tone}"><span>${escapeHtml(line.label)}:</span><strong>${escapeHtml(line.value)}</strong></div>`).join('')}</aside>
    </div>
  </div>
</body>
</html>
`;
}

function findBrowser(): string | null {
  const candidates = [
    process.env.APOTHECARY_EXACT_BROWSER,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter((entry): entry is string => Boolean(entry));
  return candidates.find((entry) => fs.existsSync(entry)) ?? null;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJson<T>(url: string, timeoutMs: number): Promise<T> {
  const startedAt = Date.now();
  let lastError: unknown = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json() as T;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw lastError instanceof Error ? lastError : new Error(`Timed out waiting for ${url}`);
}

async function waitForPageTarget(port: number, timeoutMs: number): Promise<CdpTarget> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const targets = await waitForJson<CdpTarget[]>(`http://127.0.0.1:${port}/json`, 1_000);
    const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
    if (page) return page;
    await sleep(100);
  }
  throw new Error('Timed out waiting for Edge DevTools page target.');
}

async function withCdpPage<T>(wsUrl: string, work: (send: (method: string, params?: unknown) => Promise<unknown>) => Promise<T>): Promise<T> {
  const socket = new WebSocket(wsUrl);
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  let nextId = 1;

  await new Promise<void>((resolve, reject) => {
    socket.addEventListener('open', () => resolve(), { once: true });
    socket.addEventListener('error', () => reject(new Error('Unable to connect to Edge DevTools WebSocket.')), { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data)) as CdpMessage;
    if (message.id == null) return;
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) {
      entry.reject(new Error(message.error.message ?? 'CDP command failed.'));
    } else {
      entry.resolve(message.result);
    }
  });

  const send = (method: string, params?: unknown): Promise<unknown> => {
    const id = nextId;
    nextId += 1;
    const promise = new Promise<unknown>((resolve, reject) => pending.set(id, { resolve, reject }));
    socket.send(JSON.stringify({ id, method, params }));
    return promise;
  };

  try {
    return await work(send);
  } finally {
    socket.close();
  }
}

async function captureWithEdge(args: {
  browserPath: string;
  htmlPath: string;
  screenshotPath: string;
  domAuditPath: string;
  outRoot: string;
}): Promise<{ stdout: string; stderr: string }> {
  const port = 43000 + Math.floor(Math.random() * 1000);
  const profileDir = path.join(args.outRoot, 'edge-capture-profile');
  fs.rmSync(profileDir, { recursive: true, force: true });
  const child = spawn(args.browserPath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { encoding: 'utf8' });
  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (chunk) => {
    stdout += String(chunk);
  });
  child.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });

  try {
    const target = await waitForPageTarget(port, 10_000);
    if (!target.webSocketDebuggerUrl) throw new Error('Edge DevTools target did not expose a WebSocket URL.');
    await withCdpPage(target.webSocketDebuggerUrl, async (send) => {
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', {
        width: 2048,
        height: 1152,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await send('Page.navigate', { url: pathToFileURL(args.htmlPath).href });
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const ready = await send('Runtime.evaluate', {
          expression: 'document.readyState === "complete"',
          returnByValue: true,
        }) as { result?: { value?: boolean } };
        if (ready.result?.value === true) break;
        await sleep(100);
      }
      await send('Runtime.evaluate', {
        expression: 'document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true',
        awaitPromise: true,
        returnByValue: true,
      });
      await sleep(250);
      const screenshot = await send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: 2048, height: 1152, scale: 1 },
      }) as { data?: string };
      if (!screenshot.data) throw new Error('Edge DevTools did not return screenshot data.');
      fs.writeFileSync(args.screenshotPath, Buffer.from(screenshot.data, 'base64'));
      const domAudit = await send('Runtime.evaluate', {
        expression: buildDomAuditExpression(),
        returnByValue: true,
      }) as { result?: { value?: string } };
      fs.writeFileSync(args.domAuditPath, `${domAudit.result?.value ?? '{}'}\n`, 'utf8');
    });
  } finally {
    child.kill('SIGTERM');
    await sleep(150);
    fs.rmSync(profileDir, { recursive: true, force: true });
  }

  return { stdout, stderr };
}

export async function runApothecaryExactP0Capture(rootDir = process.cwd()): Promise<ApothecaryExactCaptureRecord> {
  const surface = createApothecaryExactMockupFixture();
  const outRoot = path.resolve(rootDir, OUT_ROOT);
  fs.mkdirSync(outRoot, { recursive: true });

  const css = fs.readFileSync(path.resolve(rootDir, 'src/features/apothecary/exact/ApothecaryExactScreen.scss'), 'utf8');
  const htmlPath = path.join(outRoot, '01-fixture.html');
  const screenshotPath = path.join(outRoot, '01-fixture.png');
  const domAuditPath = path.join(outRoot, '01-fixture.dom.json');
  fs.writeFileSync(htmlPath, renderHtml(surface, css), 'utf8');
  fs.writeFileSync(domAuditPath, `${JSON.stringify({
    schemaVersion: 'apothecary-exact-dom-audit.v1',
    generatedAt: new Date().toISOString(),
    viewport: { width: 2048, height: 1152 },
    rootTestId: surface.meta.rootTestId,
    found: {
      header: true,
      cityChip: true,
      prepStrip: true,
      prescription: true,
      warnings: true,
      buyLane: true,
      brewLane: true,
      pouchCard: true,
      pouchObject: true,
      bottomActions: true,
      primaryCta: true,
      returnGate: true,
      attemptFit: true,
    },
    textMarkers: {
      title: surface.pageHeader.title === 'Apothecary',
      prescription: surface.prescription.title === 'Prescription for Foundation Gate',
      cta: surface.primaryAction.label === 'Prepare Foundation Package',
      noLegacyTabs: surface.shell.showLegacyTabs === false,
      noContextStrip: surface.shell.showLegacyContextStrip === false,
    },
    rows: {
      prepCells: surface.prepStrip.length,
      prescriptionRows: surface.prescription.rows.length,
      warningChips: surface.warningStrip.length,
      buyRows: surface.buyLane.rows.length,
      brewRows: surface.brewLane.rows.length,
    },
    forbiddenRuntimeMockup: false,
    assetWarnings: surface.debug?.assetWarnings ?? [],
  }, null, 2)}\n`, 'utf8');

  const browserPath = findBrowser();
  if (!browserPath) {
    return {
      schemaVersion: 'apothecary-exact-p0-capture.v1',
      generatedAt: new Date().toISOString(),
      ok: false,
      browserPath: null,
      htmlPath: path.relative(rootDir, htmlPath),
      screenshotPath: path.relative(rootDir, screenshotPath),
      domAuditPath: path.relative(rootDir, domAuditPath),
      stderr: 'No Chromium-family browser was found for headless screenshot capture.',
      stdout: '',
    };
  }

  let stdout = '';
  let stderr = '';
  try {
    const output = await captureWithEdge({ browserPath, htmlPath, screenshotPath, domAuditPath, outRoot });
    stdout = output.stdout;
    stderr = output.stderr;
  } catch (error) {
    stderr = error instanceof Error ? error.message : String(error);
  }

  return {
    schemaVersion: 'apothecary-exact-p0-capture.v1',
    generatedAt: new Date().toISOString(),
    ok: fs.existsSync(screenshotPath),
    browserPath,
    htmlPath: path.relative(rootDir, htmlPath),
    screenshotPath: path.relative(rootDir, screenshotPath),
    domAuditPath: path.relative(rootDir, domAuditPath),
    stderr,
    stdout,
  };
}

if (isMainModule()) {
  runApothecaryExactP0Capture()
    .then((report) => {
      const outPath = path.resolve(process.cwd(), OUT_ROOT, 'apothecaryExactP0CaptureAttempt.json');
      fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      if (report.stdout) process.stdout.write(report.stdout);
      if (report.stderr) process.stderr.write(report.stderr);
      console.log(JSON.stringify(report, null, 2));
      if (!report.ok) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error('[apothecary-exact-p0-capture] failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
