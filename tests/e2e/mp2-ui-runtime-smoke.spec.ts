import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type ViewportSpec = {
  name: string;
  width: number;
  height: number;
};

type MatrixRow = {
  screen: string;
  viewport: string;
  reachable: boolean;
  rootVisible: boolean;
  titleVisible: boolean;
  primaryCta: string;
  noHorizontalOverflow: boolean;
  suspectedClippedCount: number;
  consoleErrorCount: number;
  screenshot: string;
  domSummary: string;
  status: 'pass' | 'partial' | 'fail';
  notes: string;
};

const artifactRoot = path.resolve('artifacts/mp2/browser');
const screenshotRoot = path.join(artifactRoot, 'screenshots');
const domSummaryRoot = path.join(artifactRoot, 'dom-summaries');
const consoleLogRoot = path.join(artifactRoot, 'console-logs');

const desktopViewports: ViewportSpec[] = [
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

const exactViewport: ViewportSpec = { name: '2048x1152', width: 2048, height: 1152 };

const mainTabs = [
  { id: 'SS-010-cultivation', label: 'Cultivation' },
  { id: 'SS-011-status', label: 'Status' },
  { id: 'SS-012-world', label: 'World' },
  { id: 'SS-013-inventory', label: 'Inventory' },
  { id: 'SS-014-techniques', label: 'Techniques' },
  { id: 'SS-015-records', label: 'Records' },
  { id: 'SS-016-prestige', label: 'Prestige' },
  { id: 'SS-017-settings', label: 'Settings' },
] as const;

const worldModules = [
  { id: 'SS-100-outskirts', label: 'Outskirts', root: 'outskirts-view-screen' },
  { id: 'SS-101-ruins', label: 'Ruins', root: 'ruins-view-screen' },
  { id: 'SS-102-gate-trial', label: 'Gate Trial', root: 'gate-trial-screen-owner' },
  { id: 'SS-103-manual-pavilion', label: 'Manual Pavilion', root: ['manual-pavilion-exact-page', 'manual-pavilion-exact-screen-owner'] },
  { id: 'SS-104-apothecary', label: 'Apothecary', root: 'apothecary-exact-screen-owner' },
  { id: 'SS-105-forge', label: 'Forge', root: 'forge-exact-screen-owner' },
  { id: 'SS-106-bounties', label: 'Bounties', root: 'bounties-exact-screen-owner' },
  { id: 'SS-107-expeditions', label: 'Expeditions', root: 'expeditions-exact-screen-owner' },
] as const;

const exactModules = [
  { id: 'SS-200-gate-trial-planning', label: 'Gate Trial', root: 'gate-trial-screen-owner' },
  { id: 'SS-210-outskirts-planning', label: 'Outskirts', root: 'outskirts-view-screen' },
  { id: 'SS-220-ruins-planning', label: 'Ruins', root: 'ruins-view-screen' },
] as const;

const matrixRows: MatrixRow[] = [];

function ensureDirs() {
  mkdirSync(screenshotRoot, { recursive: true });
  mkdirSync(domSummaryRoot, { recursive: true });
  mkdirSync(consoleLogRoot, { recursive: true });
}

function safeSlug(value: string): string {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function bottomTab(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name, exact: true });
}

async function maybeClick(locator: ReturnType<Page['locator']>, timeout = 700): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function dismissTransientPrompts(page: Page) {
  for (let index = 0; index < 6; index += 1) {
    const clicked =
      await maybeClick(page.getByRole('button', { name: /^Continue$/ }), 500) ||
      await maybeClick(page.getByTestId('onboarding-callout-card').getByRole('button').last(), 500) ||
      await maybeClick(page.getByRole('dialog', { name: /Opening story/i }).getByRole('button', { name: /^Skip$/ }), 300);

    if (!clicked) return;
    await page.waitForTimeout(120);
  }
}

async function summarizeScreen(page: Page, screen: string, viewport: ViewportSpec, consoleLines: string[]) {
  return page.evaluate(
    ({ screen, viewportName, consoleLines }) => {
      const isVisible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const getRect = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
        };
      };

      const headings = Array.from(document.querySelectorAll('h1,h2,h3,[role="heading"]'))
        .filter(isVisible)
        .map((element) => element.textContent?.trim() ?? '')
        .filter(Boolean)
        .slice(0, 50);
      const buttons = Array.from(document.querySelectorAll('button'))
        .filter(isVisible)
        .map((button) => ({
          text: button.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          disabled: button.hasAttribute('disabled'),
          ariaLabel: button.getAttribute('aria-label'),
          rect: getRect(button),
        }))
        .slice(0, 100);
      const rootTestIds = Array.from(document.querySelectorAll('[data-testid]'))
        .filter(isVisible)
        .map((element) => element.getAttribute('data-testid'))
        .filter(Boolean)
        .slice(0, 120);
      const textSample = document.body.innerText.replace(/\n{3,}/g, '\n\n').slice(0, 6500);
      const primaryCta =
        buttons.find((button) =>
          /^(start hunt|attempt gate|enter ruins|open|buy|brew|dispatch|finish|next|continue|break through|claim|reset|return)/i.test(
            button.text || button.ariaLabel || '',
          ),
        ) ?? buttons[0] ?? null;
      const suspectedClippedText = Array.from(document.querySelectorAll('body *'))
        .filter(isVisible)
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const style = window.getComputedStyle(htmlElement);
          const text = htmlElement.textContent?.replace(/\s+/g, ' ').trim() ?? '';
          const overflowed =
            (htmlElement.scrollWidth > htmlElement.clientWidth + 2 ||
              htmlElement.scrollHeight > htmlElement.clientHeight + 2) &&
            text.length > 8;
          const clippedByStyle =
            overflowed &&
            (style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden');

          return clippedByStyle
            ? {
                text: text.slice(0, 160),
                rect: getRect(htmlElement),
                overflow: `${style.overflow}/${style.overflowX}/${style.overflowY}`,
              }
            : null;
        })
        .filter(Boolean)
        .slice(0, 40);
      const viewportIssues: string[] = [];

      if (document.documentElement.scrollWidth > window.innerWidth + 2) {
        viewportIssues.push(`horizontal-overflow:${document.documentElement.scrollWidth}>${window.innerWidth}`);
      }
      if (/\b(undefined|NaN|\[object Object\])\b/i.test(textSample)) {
        viewportIssues.push('placeholder-token-visible');
      }

      return {
        viewport: viewportName,
        screen,
        url: location.href,
        documentTitle: document.title,
        rootTestIds,
        headings,
        primaryCta,
        buttons,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
        suspectedClippedText,
        viewportIssues,
        consoleSinceStart: consoleLines,
        textSample,
      };
    },
    { screen, viewportName: viewport.name, consoleLines },
  );
}

async function captureScreen(page: Page, viewport: ViewportSpec, id: string, screen: string, consoleLines: string[]) {
  const screenshotDir = path.join(screenshotRoot, viewport.name);
  const summaryDir = path.join(domSummaryRoot, viewport.name);
  mkdirSync(screenshotDir, { recursive: true });
  mkdirSync(summaryDir, { recursive: true });

  const fileBase = `${id}-${safeSlug(screen)}`;
  const screenshotPath = path.join(screenshotDir, `${fileBase}.png`);
  const domSummaryPath = path.join(summaryDir, `${fileBase}.json`);

  await page.screenshot({ path: screenshotPath, fullPage: false });
  const summary = await summarizeScreen(page, screen, viewport, [...consoleLines]);
  writeFileSync(domSummaryPath, JSON.stringify(summary, null, 2));

  const consoleErrorCount = consoleLines.filter((line) => /\berror:|pageerror:/i.test(line)).length;
  const noHorizontalOverflow = summary.scrollWidth <= summary.innerWidth + 2;

  matrixRows.push({
    screen,
    viewport: viewport.name,
    reachable: true,
    rootVisible: summary.rootTestIds.length > 0 || summary.headings.length > 0,
    titleVisible: summary.headings.length > 0,
    primaryCta: summary.primaryCta?.text || summary.primaryCta?.ariaLabel || '',
    noHorizontalOverflow,
    suspectedClippedCount: summary.suspectedClippedText.length,
    consoleErrorCount,
    screenshot: path.relative(process.cwd(), screenshotPath).replace(/\\/g, '/'),
    domSummary: path.relative(process.cwd(), domSummaryPath).replace(/\\/g, '/'),
    status: noHorizontalOverflow && consoleErrorCount === 0 && summary.rootTestIds.length > 0 ? 'pass' : 'partial',
    notes: summary.viewportIssues.join('; '),
  });

  expect(summary.textSample).not.toMatch(/\b(undefined|NaN|\[object Object\])\b/i);
  expect(summary.scrollWidth, `${screen} has horizontal overflow at ${viewport.name}`).toBeLessThanOrEqual(
    summary.innerWidth + 2,
  );
}

async function completeFreshLife(page: Page, viewport: ViewportSpec, consoleLines: string[]) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(() => {});

  const openingStory = page.getByRole('dialog', { name: /Opening story/i });
  if (await openingStory.isVisible().catch(() => false)) {
    await captureScreen(page, viewport, 'SS-000', 'Opening Story', consoleLines);
    await openingStory.getByRole('button', { name: /^Skip$/ }).click();
    await expect(openingStory).toBeHidden();
  }

  await expect(page.getByRole('button', { name: /Select heaven path/i })).toBeVisible();
  await captureScreen(page, viewport, 'SS-001', 'Life Start Path', consoleLines);

  await page.getByRole('button', { name: /Select heaven path/i }).click();
  await expect(page.getByRole('group', { name: 'Heart Law choices' })).toBeVisible();
  await captureScreen(page, viewport, 'SS-002', 'Life Start Heart Law Before Selection', consoleLines);

  await page.getByRole('group', { name: 'Heart Law choices' }).getByRole('button').first().click();
  await captureScreen(page, viewport, 'SS-003', 'Life Start Heart Law Selected', consoleLines);

  await page.getByRole('button', { name: /^Next$/ }).click();
  await expect(page.getByRole('heading', { name: /Choose Breath Focus/i })).toBeVisible();
  await captureScreen(page, viewport, 'SS-004', 'Life Start Breath Before Selection', consoleLines);

  await page.locator('[data-ui="life-start-breath-focus-selection-region"]').getByRole('button', { name: /Balanced/i }).click();
  await captureScreen(page, viewport, 'SS-005', 'Life Start Breath Selected', consoleLines);

  await page.getByRole('button', { name: /^Finish$/ }).click();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await dismissTransientPrompts(page);
}

async function openWorldModule(page: Page, module: (typeof worldModules)[number] | (typeof exactModules)[number]) {
  await bottomTab(page, 'World').click().catch(() => {});
  await dismissTransientPrompts(page);

  await maybeClick(page.getByRole('button', { name: new RegExp(`^Open ${escapeRegExp(module.label)}:`) }), 1500);
  await maybeClick(page.getByRole('button', { name: new RegExp(`^${escapeRegExp(module.label)}$`) }), 500);

  const opened = await maybeClick(page.getByRole('button', { name: new RegExp(`^Open ${escapeRegExp(module.label)}$`) }), 1500);
  if (!opened) {
    await maybeClick(page.getByRole('button', { name: new RegExp(`^Open ${escapeRegExp(module.label)}`) }), 1500);
  }

  const rootIds = Array.isArray(module.root) ? module.root : [module.root];
  let rootVisible = false;
  for (const rootId of rootIds) {
    if (await page.getByTestId(rootId).isVisible().catch(() => false)) {
      rootVisible = true;
      break;
    }
  }
  if (!rootVisible) {
    await expect(page.getByTestId(rootIds[0])).toBeVisible();
  }
}

async function detachWorldModule(page: Page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(250);
  await bottomTab(page, 'World').click().catch(() => {});
  await dismissTransientPrompts(page);
}

async function runMainViewport(page: Page, viewport: ViewportSpec, consoleLines: string[]) {
  await completeFreshLife(page, viewport, consoleLines);

  for (const tab of mainTabs) {
    await bottomTab(page, tab.label).click();
    await dismissTransientPrompts(page);
    await captureScreen(page, viewport, tab.id, tab.label, consoleLines);
  }

  for (const module of worldModules) {
    await openWorldModule(page, module);
    await captureScreen(page, viewport, module.id, module.label, consoleLines);
    await detachWorldModule(page);
  }
}

async function runExactViewport(page: Page, viewport: ViewportSpec, consoleLines: string[]) {
  await completeFreshLife(page, viewport, consoleLines);

  for (const module of exactModules) {
    await openWorldModule(page, module);
    await captureScreen(page, viewport, module.id, `${module.label} Planning Exact`, consoleLines);
    await detachWorldModule(page);
  }
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

test.afterAll(() => {
  ensureDirs();
  writeFileSync(
    path.join(artifactRoot, 'screen-matrix.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), rows: matrixRows }, null, 2),
  );
});

for (const viewport of desktopViewports) {
  test.describe(`MP2 UI runtime smoke ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`fresh life traverses main tabs and modules at ${viewport.name}`, async ({ page }) => {
      ensureDirs();
      const consoleLines: string[] = [];
      page.on('console', (message) => {
        consoleLines.push(`${message.type()}: ${message.text()}`);
      });
      page.on('pageerror', (error) => {
        consoleLines.push(`pageerror: ${error.message}`);
      });

      await runMainViewport(page, viewport, consoleLines);
      writeFileSync(path.join(consoleLogRoot, `${viewport.name}.log`), consoleLines.join('\n'));
      expect(consoleLines.filter((line) => /^error:|^pageerror:/i.test(line))).toEqual([]);
    });
  });
}

test.describe(`MP2 exact screen runtime smoke ${exactViewport.name}`, () => {
  test.use({ viewport: { width: exactViewport.width, height: exactViewport.height } });

  test('fresh life captures exact screen planning states', async ({ page }) => {
    ensureDirs();
    const consoleLines: string[] = [];
    page.on('console', (message) => {
      consoleLines.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      consoleLines.push(`pageerror: ${error.message}`);
    });

    await runExactViewport(page, exactViewport, consoleLines);
    writeFileSync(path.join(consoleLogRoot, `${exactViewport.name}-exact.log`), consoleLines.join('\n'));
    expect(consoleLines.filter((line) => /^error:|^pageerror:/i.test(line))).toEqual([]);
  });
});
