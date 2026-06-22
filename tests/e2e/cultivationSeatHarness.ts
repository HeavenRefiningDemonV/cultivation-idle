import { type Page } from '@playwright/test';

/** M.II.3 Wave 4 — shared Seat-of-Becoming oracle harness (the dev server + fixture route + seed). */

export async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('#root > *').first().waitFor({ state: 'attached', timeout: 60_000 });
}

export async function dismissTransientPrompts(page: Page) {
  for (let index = 0; index < 8; index += 1) {
    const clicked =
      (await page.getByRole('button', { name: /^Continue$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Skip$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Close$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false));
    if (!clicked) return;
    await page.waitForTimeout(80);
  }
}

/** Seed the app onto the Cultivation tab past onboarding (the Seat surface itself is a fixture). */
export async function seedCultivationTab(page: Page) {
  await page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    const { useOnboardingStore } = await importModule('/src/stores/onboardingStore.ts');
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');
    const { useStoryStore } = await importModule('/src/features/story/storyStore.ts');
    const { useContentStore } = await importModule('/src/stores/contentStore.ts');
    const { useHeartLawStore } = await importModule('/src/stores/heartLawStore.ts');

    const game = useGameStore.getState();
    if (!game.selectedPath) game.selectPath('heaven');

    // Commit life identity (path + heart law + breath) so the Life-Start gate does not block the
    // Cultivation tab. The Seat surface itself is a fixture, but the app must be past Life Start.
    const content = useContentStore.getState();
    const lawId = content.maps.heartLawsById?.heart_ember_thread_sutra
      ? 'heart_ember_thread_sutra'
      : Object.keys(content.maps.heartLawsById ?? {})[0];
    const heart = useHeartLawStore.getState();
    if (lawId) {
      heart.setUnlocked?.(Array.from(new Set([...(heart.unlockedHeartLawIds ?? []), lawId])));
      heart.selectHeartLaw?.(lawId);
      heart.setBreathMode?.('balanced');
      heart.setHeartLawLevel?.(lawId, 1, 0);
    }

    const onboarding = useOnboardingStore.getState();
    const unlockedTabs = ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques', 'prestige'];
    const unlockedWorldModules = ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'];
    onboarding.hydrate({
      ...onboarding.toSaveState(),
      activeMilestoneId: 'complete',
      firstLifeOnlyComplete: true,
      unlockedTabs,
      unlockedWorldModules,
      teaserWorldModules: [],
      queuedTutorialCardIds: [],
    });
    onboarding.setDevOverride({ unlockAll: true });
    onboarding.applyUnlocks({ unlockedTabs, unlockedWorldModules, teaserWorldModules: [] });

    const story = useStoryStore.getState();
    story.hydrateFromSave({ seenFlags: { story_intro_seen: true }, storyLog: [] });
    story.clearActive();

    const ui = useUIStore.getState();
    ui.hideOfflineProgress();
    ui.closeWorldBuildingModal();
    ui.closeLifeSummaryModal();
    ui.closeDaoHeartModal?.();
    useUIStore.setState({ activeOnboardingPrompt: null, queuedOnboardingPrompts: [], dismissedOnboardingLifeKeys: [], dismissedOnboardingRuntimeKeys: [] });
    ui.setActiveTab('cultivation');
  });
  await page.waitForTimeout(200);
  await dismissTransientPrompts(page);
}

/** Navigate to a Seat fixture, seed, and wait for the root. */
export async function openSeatFixture(page: Page, fixtureId: string, reducedMotion: boolean) {
  await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  await page.goto(`/?cultivationSeat=fixture&cultivationSeatFixture=${fixtureId}`);
  await waitForApp(page);
  await seedCultivationTab(page);
  await page.getByTestId('cultivation-seat-root').waitFor({ state: 'visible', timeout: 30_000 });
}
