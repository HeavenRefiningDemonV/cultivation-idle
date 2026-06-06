import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type CaptureRecord = {
  id: string;
  screenshot: string;
  domSummary: string;
  reducedMotion: boolean;
  rootAttributes: Record<string, string>;
  visibleTextSample: string;
  notes: string[];
};

type PathId = 'heaven' | 'earth' | 'martial';

const artifactRoot = path.resolve('artifacts/mp2/training-hall-vfx');
const screenshotRoot = path.join(artifactRoot, 'screenshots');
const domSummaryRoot = path.join(artifactRoot, 'dom-summaries');
const consoleLogPath = path.join(artifactRoot, 'console.log');
const manifestPath = path.join(artifactRoot, 'screenshot-manifest.json');
const captures: CaptureRecord[] = [];

function ensureDirs() {
  mkdirSync(screenshotRoot, { recursive: true });
  mkdirSync(domSummaryRoot, { recursive: true });
}

function safeSlug(value: string): string {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('body').waitFor({ state: 'visible' });
}

async function maybeClick(locator: ReturnType<Page['locator']>, timeout = 400): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click({ timeout: 2_000 });
    return true;
  } catch {
    return false;
  }
}

async function dismissTransientPrompts(page: Page) {
  for (let index = 0; index < 8; index += 1) {
    const clicked =
      await maybeClick(page.getByRole('button', { name: /^Continue$/ }), 300) ||
      await maybeClick(page.getByRole('button', { name: /^Skip$/ }), 300) ||
      await maybeClick(page.getByRole('button', { name: /^Close$/ }), 300);
    if (!clicked) return;
    await page.waitForTimeout(100);
  }
}

async function seedTrainingLife(page: Page, pathId: PathId, realmIndex = 0) {
  await page.evaluate(async ({ pathId, realmIndex }) => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useActivityStore } = await importModule('/src/stores/activityStore.ts');
    const { useContentStore } = await importModule('/src/stores/contentStore.ts');
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    const { useOnboardingStore } = await importModule('/src/stores/onboardingStore.ts');
    const { useTrainingStore } = await importModule('/src/stores/trainingStore.ts');
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');

    const content = useContentStore.getState();
    if (!content.isLoaded) {
      await content.load();
    }

    useActivityStore.getState().stopActivity('mp2-training-hall-seed');
    useTrainingStore.getState().hydrateFromSave();

    const game = useGameStore.getState();
    useGameStore.setState({
      selectedPath: pathId,
      realm: {
        ...game.realm,
        index: realmIndex,
        substage: 1,
      },
    });
    useGameStore.getState().calculateQiPerSecond?.();
    useGameStore.getState().calculatePlayerStats?.();

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
    ui.closeWorldBuildingModal();
  }, { pathId, realmIndex });
  await dismissTransientPrompts(page);
}

async function openTrainingHall(page: Page) {
  await page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useContentStore } = await importModule('/src/stores/contentStore.ts');
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');
    const content = useContentStore.getState();
    const cityId = content.maps.citiesById.city_pinewind_hamlet ? 'city_pinewind_hamlet' : content.citiesSorted[0]?.id;
    const ui = useUIStore.getState();
    ui.setActiveTab('adventure');
    ui.closeWorldBuildingModal();
    ui.openWorldBuildingModal({ cityId, buildingKey: 'trainingHall', intent: null });
  });
  await page.waitForSelector('[data-testid="training-hall-page"]');
}

async function seedActiveHighFatigueTraining(page: Page) {
  await page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useActivityStore } = await importModule('/src/stores/activityStore.ts');
    const { useTrainingStore } = await importModule('/src/stores/trainingStore.ts');
    const training = useTrainingStore.getState();
    const current = training.toSaveState();

    useActivityStore.getState().stopActivity('mp2-training-active-seed');
    training.hydrateFromSave({
      ...current,
      fatigue: 94,
      statRatingsById: {
        ...current.statRatingsById,
        qi_control: 16,
      },
      statXpById: {
        ...current.statXpById,
        qi_control: 1_000,
      },
    });

    const result = useTrainingStore.getState().startTraining('still_star_breathing', 'limit', { now: Date.now() });
    if (!result.ok) {
      throw new Error(`Could not seed active Training Hall state: ${result.reason}`);
    }
  });
  await page.waitForTimeout(250);
}

async function captureTrainingHall(page: Page, id: string, notes: string[] = []) {
  const root = page.locator('[data-testid="training-hall-page"]').first();
  await expect(root).toBeVisible();
  const reducedMotion = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const viewport = page.viewportSize();
  const viewportName = viewport ? `${viewport.width}x${viewport.height}` : 'unknown';
  const modeDir = reducedMotion ? 'reduced-motion' : 'animated';
  const fileBase = `${safeSlug(id)}-${viewportName}`;
  const screenshotPath = path.join(screenshotRoot, modeDir, `${fileBase}.png`);
  const domSummaryPath = path.join(domSummaryRoot, modeDir, `${fileBase}.json`);

  mkdirSync(path.dirname(screenshotPath), { recursive: true });
  mkdirSync(path.dirname(domSummaryPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const summary = await page.evaluate(() => {
    const rootElement = document.querySelector('[data-testid="training-hall-page"]');
    const rootAttributes = rootElement
      ? Array.from(rootElement.attributes).reduce<Record<string, string>>((acc, attr) => {
          if (attr.name.startsWith('data-')) acc[attr.name] = attr.value;
          return acc;
        }, {})
      : {};
    const text = document.body.innerText.replace(/\n{3,}/g, '\n\n');
    const lockedRegimenIds = Array.from(document.querySelectorAll('[data-locked="true"][data-regimen-id]'))
      .map((node) => node.getAttribute('data-regimen-id'))
      .filter(Boolean);
    const futureStatIds = Array.from(document.querySelectorAll('.trainingHallFutureStat[data-stat-id]'))
      .map((node) => node.getAttribute('data-stat-id'))
      .filter(Boolean);
    const supportIds = Array.from(document.querySelectorAll('[data-support-id]'))
      .map((node) => node.getAttribute('data-support-id'))
      .filter(Boolean);
    return {
      rootAttributes,
      lockedRegimenIds,
      futureStatIds,
      supportIds,
      moteCount: document.querySelectorAll('[data-testid="training-hall-vfx-mote"]').length,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 2,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      visibleText: text.slice(0, 8_000),
    };
  });
  writeFileSync(domSummaryPath, JSON.stringify(summary, null, 2));

  expect(summary.noHorizontalOverflow, `${id} should not horizontally overflow`).toBe(true);
  expect(summary.visibleText).not.toMatch(/\b(undefined|NaN|\[object Object\])\b/i);

  const record = {
    id,
    screenshot: path.relative(process.cwd(), screenshotPath).replace(/\\/g, '/'),
    domSummary: path.relative(process.cwd(), domSummaryPath).replace(/\\/g, '/'),
    reducedMotion,
    rootAttributes: summary.rootAttributes,
    visibleTextSample: summary.visibleText.slice(0, 1_000),
    notes,
  };
  captures.push(record);
  return { ...summary, record };
}

test.describe('MP2 Training Hall unlock and state evidence', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });
  test.setTimeout(180_000);

  test.afterAll(() => {
    ensureDirs();
    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          packet: 'Mega Prompt 2',
          captures,
        },
        null,
        2,
      ),
    );
  });

  test('captures fresh, active, and reduced-motion Training Hall states', async ({ page }) => {
    ensureDirs();
    const consoleLines: string[] = [];
    page.on('console', (message) => consoleLines.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => consoleLines.push(`pageerror: ${error.message}`));

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/?cultivationExactMode=live');
    await waitForApp(page);
    await seedTrainingLife(page, 'heaven', 0);
    await openTrainingHall(page);

    const fresh = await captureTrainingHall(page, 'fresh-heaven-realm-0', [
      'realm 0 Heaven path',
      'one unlocked regimen plus future silhouettes',
    ]);
    expect(fresh.rootAttributes['data-path']).toBe('heaven');
    expect(fresh.rootAttributes['data-motion-mode']).toBe('animated');
    await expect(page.getByRole('heading', { name: 'Available Regimens' })).toBeVisible();
    await expect(page.locator('[data-regimen-id="still_star_breathing"]')).toBeVisible();
    await expect(page.locator('[data-regimen-id="cloud_seal_weaving"][data-locked="true"]')).toBeVisible();
    await expect(page.locator('.trainingHallFutureStat[data-stat-id="dao_resonance"]')).toBeVisible();
    await expect(page.locator('[data-support-id="pathAffinity"]')).toBeVisible();
    expect(fresh.futureStatIds).toEqual([
      'dao_resonance',
      'divine_sense',
      'law_weaving',
      'tribulation_insight',
      'star_rhythm',
    ]);
    expect(fresh.lockedRegimenIds).toContain('cloud_seal_weaving');
    expect(fresh.supportIds).toEqual([
      'pathAffinity',
      'heartLawSupport',
      'rootSupport',
      'offlineEfficiency',
      'prestigeFloor',
    ]);

    await seedActiveHighFatigueTraining(page);
    const active = await captureTrainingHall(page, 'active-high-fatigue-capped', [
      'active foreground Training activity',
      'high fatigue and current realm cap alerts',
    ]);
    expect(active.rootAttributes['data-visual-state']).toBe('active');
    await expect(page.getByText('Fatigue high')).toBeVisible();
    await expect(page.getByText('Cap reached')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Practicing' })).toBeDisabled();
    expect(active.moteCount).toBeGreaterThan(0);
    expect(active.moteCount).toBeLessThanOrEqual(36);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await waitForApp(page);
    await seedTrainingLife(page, 'heaven', 0);
    await openTrainingHall(page);
    const reduced = await captureTrainingHall(page, 'fresh-heaven-reduced-motion', [
      'reduced motion static Training Hall state',
    ]);
    expect(reduced.rootAttributes['data-motion-mode']).toBe('static');
    expect(reduced.moteCount).toBe(0);
    await expect(page.getByText('Reduced motion')).toBeVisible();

    writeFileSync(consoleLogPath, consoleLines.join('\n'));
    expect(consoleLines.filter((line) => line.startsWith('pageerror:'))).toEqual([]);
  });
});
