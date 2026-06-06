import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const artifactRoot = path.resolve('artifacts/mp6/final/dao-heart-sanctuary');
const screenshotRoot = path.join(artifactRoot, 'screenshots');
const summaryRoot = path.join(artifactRoot, 'dom-summaries');

function ensureDirs() {
  mkdirSync(screenshotRoot, { recursive: true });
  mkdirSync(summaryRoot, { recursive: true });
}

async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('body').waitFor({ state: 'visible' });
}

async function seedDaoHeartSanctuary(page: Page) {
  await page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useActivityStore } = await importModule('/src/stores/activityStore.ts');
    const { useCultivationStore } = await importModule('/src/stores/cultivationStore.ts');
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    const { usePrestigeStore } = await importModule('/src/stores/prestigeStore.ts');
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');
    const { getSpiritRootPairKey } = await importModule('/src/systems/spiritRoots/index.ts');

    const lawId = 'heart_quiet_breath_method';
    const rootElement = 'fire';
    useGameStore.setState({
      selectedPath: 'heaven',
      realm: { index: 0, substage: 5, name: 'Qi Condensation' },
      qi: '1200',
      qiPerSecond: '4',
    });
    usePrestigeStore.setState({
      spiritRoot: { element: rootElement, grade: 4, purity: 92 },
    });
    useCultivationStore.setState({
      selectedHeartLawId: lawId,
      unlockedHeartLawIds: [lawId],
      heartLawLevelById: { [lawId]: 2 },
      heartLawXpById: { [lawId]: 42 },
      verseMasteryByLawId: { [lawId]: 48 },
      daoHeartClarity: 44,
      turbulence: 30,
      rootResonanceByPair: {
        [getSpiritRootPairKey(rootElement, lawId)]: 36,
      },
      activeDaoHeartPracticeId: null,
      lastDaoHeartPracticeTickAt: null,
    });
    useActivityStore.getState().startActivity(
      'path_training',
      { sourceId: 'still_star_breathing', regimenId: 'still_star_breathing' },
      'dao-heart-e2e-seed',
    );
    const ui = useUIStore.getState();
    ui.setActiveTab('cultivation');
    ui.closeOfflineProgressModal?.();
    ui.closeMigrationIssuesModal?.();
    ui.closeLifeSummaryModal?.();
    ui.openDaoHeartModal('sanctuary');
  });
}

test.describe('MP6 Dao Heart Sanctuary destination', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });
  test.setTimeout(90_000);

  test('renders full sanctuary regions, removes debug pulse, and starts Verse Recitation as foreground', async ({ page }) => {
    ensureDirs();
    await page.goto('/?cultivationExactMode=live');
    await waitForApp(page);
    await seedDaoHeartSanctuary(page);
    await page.getByLabel('Open Dao Heart').click();
    const root = page.locator('[data-ui="dao-heart-sanctuary"]');
    await expect(root).toBeVisible();

    await expect(root.getByText('Qi Speed', { exact: true })).toBeVisible();
    await expect(root.getByText('Breakthrough Risk', { exact: true })).toBeVisible();
    await expect(root.getByText('Verse Ring', { exact: true })).toBeVisible();
    await expect(root.getByText('Root Route', { exact: true })).toBeVisible();
    await expect(root.getByText('Variant Hint', { exact: true })).toBeVisible();
    await expect(root.getByText('10 min', { exact: true })).toBeVisible();
    await expect(root.getByText('30 min', { exact: true })).toBeVisible();
    await expect(root.getByText('60 min', { exact: true })).toBeVisible();
    await expect(root.getByText(/Path Training is the current foreground activity/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Advance 1 minute/i })).toHaveCount(0);

    const summary = await page.evaluate(() => ({
      text: document.body.innerText,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 2,
      rootAttributes: Object.fromEntries(
        Array.from(document.querySelector('[data-ui="dao-heart-sanctuary"]')?.attributes ?? [])
          .filter((attr) => attr.name.startsWith('data-'))
          .map((attr) => [attr.name, attr.value]),
      ),
    }));
    expect(summary.text).toMatch(/Scripture Copying/i);
    expect(summary.text).toMatch(/Banked Ember/i);
    expect(summary.text).toMatch(/0\.74x|\-26%/i);
    expect(summary.text).not.toMatch(/\b(undefined|NaN|\[object Object\])\b/i);
    expect(summary.noHorizontalOverflow).toBe(true);

    await page.screenshot({
      path: path.join(screenshotRoot, 'dao-heart-sanctuary-desktop.png'),
      fullPage: false,
    });
    writeFileSync(
      path.join(summaryRoot, 'dao-heart-sanctuary-desktop.json'),
      JSON.stringify(summary, null, 2),
    );

    await page.getByRole('button', { name: /^Start Verse Recitation$/ }).click();
    const activity = await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useActivityStore } = await importModule('/src/stores/activityStore.ts');
      return useActivityStore.getState().active;
    });
    expect(activity?.type).toBe('dao_heart_practice');
    expect(activity?.payload?.practiceId).toBe('verse_recitation');
  });
});
