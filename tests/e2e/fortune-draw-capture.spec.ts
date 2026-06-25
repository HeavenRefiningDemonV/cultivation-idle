import { test, type Page } from '@playwright/test';

/**
 * M.IV.3 ARTS-PORT — DEV CAPTURE (not a gate): seed past onboarding (the proven unlock-all seed), open the
 * Manual Pavilion world modal in the new `fortune` mode, and screenshot the Fortune Draw. Fixture states verify
 * 1:1 fidelity vs the artifact; the live capture proves full function (real stock + purse + pity). 2048×1152.
 */

test.use({ viewport: { width: 2048, height: 1152 }, deviceScaleFactor: 1 });

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

    const lawId = content.maps?.heartLawsById?.heart_ember_thread_sutra ? 'heart_ember_thread_sutra' : Object.keys(content.maps?.heartLawsById ?? {})[0];
    const heart = useHeartLawStore.getState();
    if (lawId) { heart.setUnlocked(Array.from(new Set([...(heart.unlockedHeartLawIds ?? []), lawId]))); heart.selectHeartLaw(lawId); heart.setBreathMode('balanced'); heart.setHeartLawLevel(lawId, 1, 0); }

    const tabs = ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques', 'prestige'];
    const modules = ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'];
    const onboarding = useOnboardingStore.getState();
    onboarding.hydrate({ ...onboarding.toSaveState(), activeMilestoneId: 'complete', firstLifeOnlyComplete: true, unlockedTabs: tabs, unlockedWorldModules: modules, teaserWorldModules: [], queuedTutorialCardIds: [] });
    onboarding.setDevOverride({ unlockAll: true });
    onboarding.applyUnlocks({ unlockedTabs: tabs, unlockedWorldModules: modules, teaserWorldModules: [] });

    const story = useStoryStore.getState();
    story.hydrateFromSave({ seenFlags: { story_intro_seen: true }, storyLog: [] });
    story.clearActive();

    const ui = useUIStore.getState();
    ui.hideOfflineProgress?.(); ui.closeMigrationIssuesModal?.(); ui.closeLifeSummaryModal?.(); ui.closeTutorialLedgerDrawer?.(); ui.closeDaoHeartModal?.(); ui.closeSpiritRootObservation?.();
    useUIStore.setState({ activeOnboardingPrompt: null, queuedOnboardingPrompts: [], dismissedOnboardingLifeKeys: [], dismissedOnboardingRuntimeKeys: [] });
  });
  await page.waitForTimeout(300);
}

async function openFortune(page: Page) {
  await page.evaluate(async () => {
    const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
    const { useUIStore } = await imp('/src/stores/uiStore.ts');
    const { useCityStore } = await imp('/src/stores/cityStore.ts');
    const { useManualPavilionStore } = await imp('/src/stores/manualPavilionStore.ts');
    const cityId = useCityStore.getState().currentCityId;
    // make sure a stock exists for the live capture
    const { useContentStore } = await imp('/src/stores/contentStore.ts');
    const pav = Object.values(useContentStore.getState().maps.pavilionsById).find((p: any) => p.cityId === cityId) as any;
    if (pav) useManualPavilionStore.getState().ensureStock(pav.id);
    useUIStore.getState().openWorldBuildingModal({ cityId, buildingKey: 'manualPavilion', intent: { manualPavilionExactMode: 'fortune' } });
  });
  await page.waitForTimeout(700);
}

const FIXTURE_STATES = ['preDraw', 'postDraw-rare', 'pityGuaranteed', 'rerollAvailable', 'empty'];

test('capture: Fortune Draw fixture matrix + live', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  for (const state of FIXTURE_STATES) {
    await page.addInitScript(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
    await page.goto(`/?fortune=fixture&fortuneState=${state}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await seed(page);
    await openFortune(page);
    const root = page.locator('.fortuneRoot');
    await root.first().waitFor({ timeout: 4000 }).catch(() => {});
    await page.screenshot({ path: `artifacts/fortune-port/fixture-${state}.png`, fullPage: false });
  }

  // live: real pavilion stock + purse + pity
  await page.goto('/?pavilionView=fortune');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  await seed(page);
  await openFortune(page);
  await page.locator('.fortuneRoot').first().waitFor({ timeout: 4000 }).catch(() => {});
  await page.screenshot({ path: 'artifacts/fortune-port/live.png', fullPage: false });
  // click an offer → the inspector fills
  await page.locator('[data-stock]').first().click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'artifacts/fortune-port/live-selected.png', fullPage: false });

  // eslint-disable-next-line no-console
  console.log('PAGE_ERRORS:', JSON.stringify(errors));
});
