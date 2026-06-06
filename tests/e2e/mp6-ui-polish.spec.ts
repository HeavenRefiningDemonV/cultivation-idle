import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type CaptureRecord = {
  id: string;
  viewport: string;
  reducedMotion: boolean;
  screenshot: string;
  domSummary: string;
  rootSelector: string;
  notes: string[];
};

const appUrl = process.env.MP6_APP_URL ?? 'http://127.0.0.1:5174';
const artifactRoot = path.resolve('artifacts/mp6/final/ui-polish');
const screenshotRoot = path.join(artifactRoot, 'screenshots');
const domSummaryRoot = path.join(artifactRoot, 'dom-summaries');
const consoleLogRoot = path.join(artifactRoot, 'console-logs');
const manifestPath = path.join(artifactRoot, 'screenshot-manifest.json');

const forbiddenPublicStatusCopy = /\b(Current Omen|Gate Proof|Recent Omens|Source Thread|Proof Detail|Mandate Lens|Dao Mandate Interface)\b/i;
const captures: CaptureRecord[] = [];

function ensureDirs() {
  mkdirSync(screenshotRoot, { recursive: true });
  mkdirSync(domSummaryRoot, { recursive: true });
  mkdirSync(consoleLogRoot, { recursive: true });
}

function safeSlug(value: string): string {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('body').waitFor({ state: 'visible' });
}

async function dismissTransientPrompts(page: Page) {
  for (let index = 0; index < 8; index += 1) {
    const clicked = await page.getByRole('button', { name: /^Continue$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)
      || await page.getByRole('button', { name: /^Skip$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)
      || await page.getByRole('button', { name: /^Close$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false);
    if (!clicked) return;
    await page.waitForTimeout(100);
  }
}

async function seedReadyLife(page: Page) {
  await page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    const { useHeartLawStore } = await importModule('/src/stores/heartLawStore.ts');
    const { useContentStore } = await importModule('/src/stores/contentStore.ts');
    const { useOnboardingStore } = await importModule('/src/stores/onboardingStore.ts');
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');

    const game = useGameStore.getState();
    if (!game.selectedPath) {
      game.selectPath('heaven');
    }

    const content = useContentStore.getState();
    const lawId = content.maps.heartLawsById.heart_ember_thread_sutra
      ? 'heart_ember_thread_sutra'
      : Object.keys(content.maps.heartLawsById)[0];
    const heart = useHeartLawStore.getState();
    if (lawId) {
      heart.setUnlocked(Array.from(new Set([...(heart.unlockedHeartLawIds ?? []), lawId])));
      heart.selectHeartLaw(lawId);
      heart.setBreathMode('balanced');
      heart.setHeartLawLevel(lawId, 1, 0);
    }

    const onboarding = useOnboardingStore.getState();
    onboarding.setDevOverride({ unlockAll: true });
    onboarding.applyUnlocks({
      unlockedTabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques', 'prestige'],
      unlockedWorldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'],
      teaserWorldModules: [],
    });

    const ui = useUIStore.getState();
    ui.closeOfflineProgressModal?.();
    ui.closeMigrationIssuesModal?.();
    ui.closeLifeSummaryModal?.();
    ui.closeTutorialLedgerDrawer?.();
  });
  await page.waitForTimeout(150);
  await dismissTransientPrompts(page);
}

async function openWorldModal(page: Page, buildingKey: string, intent: Record<string, unknown> | null = null) {
  await page.evaluate(async ({ buildingKey, intent }) => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');
    const { useContentStore } = await importModule('/src/stores/contentStore.ts');
    const content = useContentStore.getState();
    const cityId = content.maps.citiesById.city_pinewind_hamlet ? 'city_pinewind_hamlet' : content.citiesSorted[0]?.id;
    const ui = useUIStore.getState();
    ui.setActiveTab('adventure');
    ui.closeWorldBuildingModal();
    ui.openWorldBuildingModal({ cityId, buildingKey, intent });
  }, { buildingKey, intent });
  await page.waitForTimeout(250);
}

async function capture(page: Page, id: string, rootSelector: string, notes: string[] = []) {
  const viewport = page.viewportSize();
  const viewportName = viewport ? `${viewport.width}x${viewport.height}` : 'unknown';
  const reducedMotion = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const dir = path.join(screenshotRoot, reducedMotion ? 'reduced-motion' : 'desktop');
  const domDir = path.join(domSummaryRoot, reducedMotion ? 'reduced-motion' : 'desktop');
  mkdirSync(dir, { recursive: true });
  mkdirSync(domDir, { recursive: true });

  const fileBase = `${safeSlug(id)}-${viewportName}`;
  const screenshotPath = path.join(dir, `${fileBase}.png`);
  const domSummaryPath = path.join(domDir, `${fileBase}.json`);
  const root = page.locator(rootSelector).first();
  await expect(root, `${id} root should be visible`).toBeVisible();
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const summary = await page.evaluate((selector) => {
    const rootElement = document.querySelector(selector);
    const attrMap = rootElement
      ? Array.from(rootElement.attributes).reduce<Record<string, string>>((acc, attr) => {
          if (attr.name.startsWith('data-') || attr.name === 'aria-label') {
            acc[attr.name] = attr.value;
          }
          return acc;
        }, {})
      : {};
    const visibleText = document.body.innerText.replace(/\n{3,}/g, '\n\n');
    return {
      url: window.location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 2,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      rootSelector: selector,
      rootAttributes: attrMap,
      testIds: Array.from(document.querySelectorAll('[data-testid]'))
        .map((node) => node.getAttribute('data-testid'))
        .filter(Boolean)
        .slice(0, 160),
      mp6Rows: {
        cultivationRiskRows: document.querySelectorAll('[data-row-id]').length,
        cultivationReadinessSections: document.querySelectorAll('[data-risk-band][data-confirmation-required]').length,
        gateRows: document.querySelectorAll('[data-node-id][data-status]').length,
        trainingMotes: document.querySelectorAll('[data-testid="training-hall-vfx-mote"]').length,
        daoMotes: document.querySelectorAll('[data-testid="dao-heart-sanctuary-vfx-mote"]').length,
        techniqueScalingRows: document.querySelectorAll('.techniqueDetailModalTrainingRow').length,
      },
      activeElement: document.activeElement instanceof HTMLElement
        ? {
            tagName: document.activeElement.tagName,
            text: document.activeElement.innerText?.replace(/\s+/g, ' ').trim() ?? '',
            ariaLabel: document.activeElement.getAttribute('aria-label'),
          }
        : null,
      visibleText: visibleText.slice(0, 8000),
    };
  }, rootSelector);
  writeFileSync(domSummaryPath, JSON.stringify(summary, null, 2));

  captures.push({
    id,
    viewport: viewportName,
    reducedMotion,
    screenshot: path.relative(process.cwd(), screenshotPath).replace(/\\/g, '/'),
    domSummary: path.relative(process.cwd(), domSummaryPath).replace(/\\/g, '/'),
    rootSelector,
    notes,
  });

  expect(summary.noHorizontalOverflow, `${id} should not horizontally overflow`).toBe(true);
  expect(summary.visibleText).not.toMatch(/\b(undefined|NaN|\[object Object\])\b/i);
  return summary;
}

test.describe('MP6 UI polish screenshot evidence', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });
  test.setTimeout(180_000);

  test('captures Training Hall, Dao Heart, Status Ledger, Cultivation, Gate Trial, and technique tooltip states', async ({ page }) => {
    ensureDirs();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const consoleLines: string[] = [];
    page.on('console', (message) => consoleLines.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => consoleLines.push(`pageerror: ${error.message}`));

    await page.goto(`${appUrl}/?cultivationExactMode=fixture`);
    await waitForApp(page);
    const cultivationSummary = await capture(page, 'cultivation-breakthrough-risk-rows', '[data-testid="cultivation-exact-page"]', [
      'fixture exact surface',
      'breakthrough rows include MP6 display metadata',
    ]);
    expect(cultivationSummary.mp6Rows.cultivationRiskRows).toBeGreaterThan(0);
    expect(cultivationSummary.mp6Rows.cultivationReadinessSections).toBeGreaterThan(0);

    await page.goto(`${appUrl}/?cultivationExactMode=live`);
    await waitForApp(page);
    await seedReadyLife(page);
    await page.getByLabel('Open Dao Heart').click();
    await page.waitForSelector('[data-ui="dao-heart-sanctuary"]');
    await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useHeartLawStore } = await importModule('/src/stores/heartLawStore.ts');
      const heart = useHeartLawStore.getState();
      heart.setDaoHeartClarity(18);
      heart.setTurbulence(92);
      heart.startDaoHeartPractice('inner_demon_debate');
    });
    await page.waitForTimeout(250);
    const daoSummary = await capture(page, 'dao-heart-active-high-turbulence', '[data-ui="dao-heart-sanctuary"]', [
      'live modal',
      'high turbulence and active practice seeded through store action',
    ]);
    expect(daoSummary.rootAttributes['data-fx-particle-budget']).toBe('48');
    expect(daoSummary.rootAttributes['data-motion-mode']).toBe('animated');
    expect(daoSummary.mp6Rows.daoMotes).toBeLessThanOrEqual(48);

    await page.goto(`${appUrl}/?gateTrialExactMode=fixture`);
    await waitForApp(page);
    await seedReadyLife(page);
    await openWorldModal(page, 'trainingHall');
    const trainingIdle = await capture(page, 'training-hall-idle', '[data-testid="training-hall-page"]', [
      'live Training Hall modal',
      'idle visual state',
    ]);
    expect(trainingIdle.rootAttributes['data-fx-particle-budget']).toBe('36');
    expect(trainingIdle.rootAttributes['data-motion-mode']).toBe('animated');

    await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useTrainingStore } = await importModule('/src/stores/trainingStore.ts');
      const { useActivityStore } = await importModule('/src/stores/activityStore.ts');
      const training = useTrainingStore.getState();
      training.hydrateFromSave({
        ...training.toSaveState(),
        fatigue: 94,
        statRatingsById: {
          qi_control: 99,
          mind_clarity: 99,
          qi_purity: 99,
          dao_resonance: 99,
        },
        statXpById: {
          qi_control: 1000,
          mind_clarity: 1000,
          qi_purity: 1000,
          dao_resonance: 1000,
        },
      });
      useActivityStore.getState().stopActivity('mp6-training-reset');
      training.startTraining('still_star_breathing', 'limit');
    });
    await page.waitForTimeout(250);
    const trainingActive = await capture(page, 'training-hall-active-high-fatigue-capped', '[data-testid="training-hall-page"]', [
      'live Training Hall modal',
      'active, high fatigue, capped stat presentation',
    ]);
    expect(trainingActive.rootAttributes['data-fx-particle-budget']).toBe('36');
    expect(trainingActive.mp6Rows.trainingMotes).toBeLessThanOrEqual(36);

    await page.goto(`${appUrl}/?cultivationExactMode=fixture`);
    await waitForApp(page);
    await seedReadyLife(page);
    await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useUIStore } = await importModule('/src/stores/uiStore.ts');
      useUIStore.getState().setActiveTab('status');
    });
    await page.waitForSelector('[data-testid="status-ledger-root"]');
    const statusSummary = await capture(page, 'status-ledger-base', '[data-testid="status-ledger-root"]', [
      'Status V3 ledger',
      'public copy guard checked',
    ]);
    expect(statusSummary.visibleText).not.toMatch(forbiddenPublicStatusCopy);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(150);
    const statusReducedSummary = await capture(page, 'status-ledger-reduced-motion', '[data-testid="status-ledger-root"]', [
      'Status V3 ledger',
      'reduced motion browser media',
    ]);
    expect(statusReducedSummary.reducedMotion).toBe(true);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await page.goto(`${appUrl}/?gateTrialExactMode=fixture`);
    await waitForApp(page);
    await seedReadyLife(page);
    await openWorldModal(page, 'gateTrial', { gateTrialExactMode: 'fixture' });
    const gateSummary = await capture(page, 'gate-trial-readiness-fixture', '[data-testid="gate-trial-exact-page"]', [
      'fixture exact modal',
      'readiness rows and lifecycle attributes',
    ]);
    expect(gateSummary.mp6Rows.gateRows).toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(150);
    const gateReducedSummary = await capture(page, 'gate-trial-reduced-motion', '[data-testid="gate-trial-exact-page"]', [
      'fixture exact modal',
      'reduced motion browser media',
    ]);
    expect(gateReducedSummary.reducedMotion).toBe(true);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await page.goto(`${appUrl}/?techniquesExactMode=fixture`);
    await waitForApp(page);
    await seedReadyLife(page);
    const techniquesCollapsed = await capture(page, 'techniques-tooltip-collapsed', '[data-testid="techniques-exact-page"]', [
      'fixture exact Techniques surface',
      'inspector collapsed',
    ]);
    expect(techniquesCollapsed.visibleText).toContain('Open Details');
    await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useUIStore } = await importModule('/src/stores/uiStore.ts');
      useUIStore.getState().requestTechniqueFocus('tech_heaven_starfire_bolt', 'open');
    });
    await expect(page.locator('.techniqueDetailModalPanel')).toBeVisible();
    const techniqueExpanded = await capture(page, 'techniques-tooltip-expanded-modal', '.techniqueDetailModalPanel', [
      'Technique detail modal',
      'Training Hall scaling preview rows',
    ]);
    expect(techniqueExpanded.mp6Rows.techniqueScalingRows).toBeGreaterThan(0);

    writeFileSync(path.join(consoleLogRoot, 'mp6-ui-polish-playwright.log'), consoleLines.join('\n'));
    writeFileSync(manifestPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      appUrl,
      browserPath: 'Browser plugin attempted first; Playwright fallback captured screenshots.',
      captures,
      consoleErrorCount: consoleLines.filter((line) => /^error:|^pageerror:/i.test(line)).length,
      consoleLines,
    }, null, 2));

    expect(consoleLines.filter((line) => /^pageerror:/i.test(line))).toEqual([]);
  });
});
