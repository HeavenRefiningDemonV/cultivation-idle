import { expect, test, type Page } from '@playwright/test';

const appUrl = process.env.MP7_APP_URL ?? process.env.MP6_APP_URL ?? 'http://127.0.0.1:5174';

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
    const { usePrestigeStore } = await importModule('/src/stores/prestigeStore.ts');

    const game = useGameStore.getState();
    if (!game.selectedPath) game.selectPath('heaven');

    const content = useContentStore.getState();
    const lawId = content.maps.heartLawsById.heart_ember_thread_sutra
      ? 'heart_ember_thread_sutra'
      : Object.keys(content.maps.heartLawsById)[0];
    const heart = useHeartLawStore.getState();
    if (lawId) {
      heart.setUnlocked(Array.from(new Set([...(heart.unlockedHeartLawIds ?? []), lawId])));
      heart.selectHeartLaw(lawId);
      heart.setBreathMode('balanced');
      heart.setHeartLawLevel(lawId, 2, 0);
    }

    usePrestigeStore.setState((state: any) => ({
      ...state,
      purchasesById: { ...state.purchasesById, form_memory: 1, scripture_echo: 1 },
    }));

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
  await dismissTransientPrompts(page);
}

async function openWorldModal(page: Page, buildingKey: string) {
  await page.evaluate(async (key) => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');
    const { useContentStore } = await importModule('/src/stores/contentStore.ts');
    const content = useContentStore.getState();
    const cityId = content.maps.citiesById.city_pinewind_hamlet ? 'city_pinewind_hamlet' : content.citiesSorted[0]?.id;
    const ui = useUIStore.getState();
    ui.setActiveTab('adventure');
    ui.closeWorldBuildingModal();
    ui.openWorldBuildingModal({ cityId, buildingKey: key, intent: null });
  }, buildingKey);
  await page.waitForTimeout(250);
}

async function expectNoOverflowAndNoForbiddenText(page: Page) {
  const summary = await page.evaluate(() => ({
    noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 2,
    visibleText: document.body.innerText,
  }));
  expect(summary.noHorizontalOverflow).toBe(true);
  expect(summary.visibleText).not.toMatch(/\b(undefined|NaN|\[object Object\])\b/i);
  expect(summary.visibleText).not.toMatch(/\b(Current Omen|Gate Proof|Source Thread|Mandate Lens|Dao Mandate Interface)\b/i);
}

test.describe('MP7 scoped Training, Dao Heart, Status, and Reclaim QA', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });
  test.setTimeout(120_000);

  test('renders scoped VFX/accessibility surfaces without overflow or forbidden public labels', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`${appUrl}/?cultivationExactMode=live&prestigeLedgerMode=fixture`);
    await waitForApp(page);
    await seedReadyLife(page);

    await openWorldModal(page, 'trainingHall');
    const training = page.locator('[data-testid="training-hall-page"]').first();
    await expect(training).toBeVisible();
    await expect(training).toHaveAttribute('data-fx-particle-budget', '36');
    await expectNoOverflowAndNoForbiddenText(page);

    await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useUIStore } = await importModule('/src/stores/uiStore.ts');
      const ui = useUIStore.getState();
      ui.closeWorldBuildingModal();
      ui.setActiveTab('cultivation');
    });
    await page.waitForTimeout(150);
    await page.getByLabel('Open Dao Heart').click();
    const dao = page.locator('[data-ui="dao-heart-sanctuary"]').first();
    await expect(dao).toBeVisible();
    await expect(dao).toHaveAttribute('data-fx-particle-budget', '48');
    await expectNoOverflowAndNoForbiddenText(page);

    await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useUIStore } = await importModule('/src/stores/uiStore.ts');
      useUIStore.getState().setActiveTab('status');
    });
    await expect(page.locator('[data-testid="status-ledger-root"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="status-current-state"]').first()).toBeVisible();
    await expectNoOverflowAndNoForbiddenText(page);

    await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useUIStore } = await importModule('/src/stores/uiStore.ts');
      useUIStore.getState().setActiveTab('prestige');
    });
    const reclaim = page.locator('[data-testid="prestige-reclaim-memory-panel"]').first();
    await expect(reclaim).toBeVisible();
    await expect(reclaim).toContainText('Open Reclaim Memory');
    await expect(reclaim).toContainText('Active:');
    await expect(reclaim).not.toContainText(/\bClaim (Memory|Reclaim)\b/i);
    await expectNoOverflowAndNoForbiddenText(page);
  });

  test('keeps scoped surfaces meaningful with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${appUrl}/?cultivationExactMode=live&prestigeLedgerMode=fixture`);
    await waitForApp(page);
    await seedReadyLife(page);

    await openWorldModal(page, 'trainingHall');
    await expect(page.locator('[data-testid="training-hall-page"]').first()).toHaveAttribute('data-motion-mode', 'static');

    await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useUIStore } = await importModule('/src/stores/uiStore.ts');
      const ui = useUIStore.getState();
      ui.closeWorldBuildingModal();
      ui.setActiveTab('cultivation');
    });
    await page.waitForTimeout(150);
    await page.getByLabel('Open Dao Heart').click();
    await expect(page.locator('[data-ui="dao-heart-sanctuary"]').first()).toHaveAttribute('data-motion-mode', 'static');

    await page.evaluate(async () => {
      const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
      const { useUIStore } = await importModule('/src/stores/uiStore.ts');
      useUIStore.getState().setActiveTab('prestige');
    });
    await expect(page.locator('[data-testid="prestige-reclaim-memory-panel"]').first()).toBeVisible();
    await expectNoOverflowAndNoForbiddenText(page);
  });
});
