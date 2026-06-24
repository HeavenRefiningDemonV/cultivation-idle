import { test, type Page } from '@playwright/test';

/**
 * M.III.3 EQ-PORT — DEV CAPTURE (not a gate): seed the game past onboarding (the proven unlock-all seed from
 * capture-all-menus.spec.ts), switch to the Equipment/Inventory tab, and screenshot the LIVE Panoply surface
 * inside the real GameLayout. Verifies the in-game scale-fit + the legacy→new data bridge. Realistic laptop
 * viewport so the scale-to-fit is exercised.
 */

test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

/* eslint-disable @typescript-eslint/no-explicit-any */
async function seed(page: Page) {
  await page.evaluate(async () => {
    const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
    const { useCityStore } = await imp('/src/stores/cityStore.ts');
    const { useContentStore } = await imp('/src/stores/contentStore.ts');
    const { useGameStore } = await imp('/src/stores/gameStore.ts');
    const { useHeartLawStore } = await imp('/src/stores/heartLawStore.ts');
    const { useOnboardingStore } = await imp('/src/stores/onboardingStore.ts');
    const { useUIStore } = await imp('/src/stores/uiStore.ts');
    const { useStoryStore } = await imp('/src/features/story/storyStore.ts');

    const content = useContentStore.getState();
    const cityId = content.maps?.citiesById?.city_pinewind_hamlet ? 'city_pinewind_hamlet' : content.citiesSorted?.[0]?.id;
    if (cityId) useCityStore.setState({ currentCityId: cityId, unlockedCityIds: [cityId] });

    const game = useGameStore.getState();
    if (!game.selectedPath) game.selectPath('heaven');

    const lawId = content.maps?.heartLawsById?.heart_ember_thread_sutra
      ? 'heart_ember_thread_sutra'
      : Object.keys(content.maps?.heartLawsById ?? {})[0];
    const heart = useHeartLawStore.getState();
    if (lawId) {
      heart.setUnlocked(Array.from(new Set([...(heart.unlockedHeartLawIds ?? []), lawId])));
      heart.selectHeartLaw(lawId);
      heart.setBreathMode('balanced');
      heart.setHeartLawLevel(lawId, 1, 0);
    }

    const tabs = ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques', 'prestige'];
    const modules = ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'];
    const onboarding = useOnboardingStore.getState();
    onboarding.hydrate({
      ...onboarding.toSaveState(),
      activeMilestoneId: 'complete',
      firstLifeOnlyComplete: true,
      unlockedTabs: tabs,
      unlockedWorldModules: modules,
      teaserWorldModules: [],
      queuedTutorialCardIds: [],
    });
    onboarding.setDevOverride({ unlockAll: true });
    onboarding.applyUnlocks({ unlockedTabs: tabs, unlockedWorldModules: modules, teaserWorldModules: [] });

    const story = useStoryStore.getState();
    story.hydrateFromSave({ seenFlags: { story_intro_seen: true }, storyLog: [] });
    story.clearActive();

    const ui = useUIStore.getState();
    ui.hideOfflineProgress?.();
    ui.closeWorldBuildingModal?.();
    ui.closeMigrationIssuesModal?.();
    ui.closeLifeSummaryModal?.();
    ui.closeTutorialLedgerDrawer?.();
    ui.closeDaoHeartModal?.();
    ui.closeSpiritRootObservation?.();
    useUIStore.setState({
      activeOnboardingPrompt: null,
      queuedOnboardingPrompts: [],
      dismissedOnboardingLifeKeys: [],
      dismissedOnboardingRuntimeKeys: [],
    });
  });
  await page.waitForTimeout(300);
}

async function dismissTransients(page: Page) {
  for (let i = 0; i < 8; i += 1) {
    const clicked =
      (await page.getByRole('button', { name: /^Continue$/ }).last().click({ timeout: 250 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Skip$/ }).last().click({ timeout: 250 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Close$/ }).last().click({ timeout: 250 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Dismiss$/ }).last().click({ timeout: 250 }).then(() => true).catch(() => false));
    if (!clicked) return;
    await page.waitForTimeout(120);
  }
}

async function setTab(page: Page, tabId: string) {
  await page.evaluate(async (id) => {
    const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
    const { useUIStore } = await imp('/src/stores/uiStore.ts');
    useUIStore.getState().setActiveTab(id);
  }, tabId);
  await page.waitForTimeout(500);
}

test('capture: live Panoply in-game', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
  // ?giveTestGear=1 grants 1 of each demo gear item (real instances) on the inventory tab.
  await page.goto('/?panoply=live&giveTestGear=1');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);
  await seed(page);
  await dismissTransients(page);
  await setTab(page, 'inventory');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'artifacts/mp-eq-port/live-ingame.png', fullPage: false });

  // Toggle to the Vault to confirm the spare gear renders as slips.
  await page.evaluate(async () => {
    const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
    const { usePanoplyUiStore } = await imp('/src/stores/panoplyUiStore.ts');
    usePanoplyUiStore.getState().setActiveSurface('vault');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'artifacts/mp-eq-port/live-ingame-vault.png', fullPage: false });

  // Click the first vault slip → the rail should fill (select mechanic).
  await page.locator('[data-slip-id]').first().click({ timeout: 1000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'artifacts/mp-eq-port/live-ingame-vault-selected.png', fullPage: false });
  // eslint-disable-next-line no-console
  console.log('PAGE_ERRORS:', JSON.stringify(errors));
});
