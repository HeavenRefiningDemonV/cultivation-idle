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

/**
 * Seed the live game store to a real peak-ready major crossing (realm 0 → Foundation): final
 * substage, qi at the cost, the gate item in inventory, and a forced tribulation roll. roll 0.99
 * succeeds (0.99 ≥ risk/100), roll 0 fails — so both ceremony paths can be exercised for real.
 */
export async function seedPeakReadyCrossing(page: Page, roll: number) {
  await page.evaluate(async (rollValue) => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    const { useInventoryStore } = await importModule('/src/stores/inventoryStore.ts');
    const { REALMS } = await importModule('/src/constants/index.ts');

    // NOTE: do NOT resetForNewLife here — it wipes the committed life identity and re-triggers the
    // Life-Start screen, which occludes the Seat. The seed only sets the realm/qi/gate/roll.
    const finalSub = REALMS[0].substages;
    useGameStore.setState({ realm: { index: 0, substage: finalSub, name: REALMS[0].name } });
    const required = useGameStore.getState().getBreakthroughRequirement();
    useGameStore.setState({ qi: String(required) });
    useInventoryStore.getState().addItem('gate_foundation_pill', 2);
    useGameStore.getState().__setBreakthroughRiskRollForTest?.(() => rollValue);
  }, roll);
}

/** Navigate to a Seat fixture, seed, and wait for the root. */
export async function openSeatFixture(page: Page, fixtureId: string, reducedMotion: boolean) {
  await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  await page.goto(`/?cultivationSeat=fixture&cultivationSeatFixture=${fixtureId}`);
  await waitForApp(page);
  await seedCultivationTab(page);
  await page.getByTestId('cultivation-seat-root').waitFor({ state: 'visible', timeout: 30_000 });
}
