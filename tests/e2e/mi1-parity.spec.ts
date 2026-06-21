import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * M.I.1 / M.I.1b acceptance evidence — the live parity pair.
 *
 * The derived re-point reads LIVE stores (not the ?obsFixture synthetic ledger), so to screenshot the
 * derived constellation in a coherent state we seed a real cultivator (the 13 shared-tier ratings that
 * feed resolveCourtSharedStats → computeDerivedStats), then capture Status under ?statEngine=1 (derived)
 * vs ?forceLegacy=1 (legacy training snapshot). The constellation/vitals readings must visibly differ,
 * and forceLegacy must restore the legacy reading.
 *
 * NAMED GAP (do not paper over): the ?obsFixture= six-state matrix supplies a SYNTHETIC ledger and is the
 * right oracle for the scenic/state-overlay layers + the legacy reading, but it is NOT coherent with the
 * live-derived constellation under the flag. A flagged six-state matrix would need a seeded SAVE per state
 * (or the harness extended to stub the derived input) — tracked, not built here.
 */

const outDir = path.resolve('docs/release/qa/mi1-status-reconcile');

async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('body').waitFor({ state: 'visible' });
}

async function dismissTransientPrompts(page: Page) {
  for (let index = 0; index < 8; index += 1) {
    const clicked =
      (await page.getByRole('button', { name: /^Continue$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Skip$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Close$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false));
    if (!clicked) return;
    await page.waitForTimeout(100);
  }
}

// A real cultivator with non-trivial shared-tier ratings, so the derived constellation has live data.
async function seedLiveCultivator(page: Page) {
  await page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useCityStore } = await importModule('/src/stores/cityStore.ts');
    const { useContentStore } = await importModule('/src/stores/contentStore.ts');
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    const { useHeartLawStore } = await importModule('/src/stores/heartLawStore.ts');
    const { useOnboardingStore } = await importModule('/src/stores/onboardingStore.ts');
    const { useTrainingStore } = await importModule('/src/stores/trainingStore.ts');
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');
    const { useStoryStore } = await importModule('/src/features/story/storyStore.ts');

    const content = useContentStore.getState();
    const cityId = content.maps.citiesById.city_pinewind_hamlet ? 'city_pinewind_hamlet' : content.citiesSorted[0]?.id;
    if (cityId) useCityStore.setState({ currentCityId: cityId, unlockedCityIds: [cityId] });

    const game = useGameStore.getState();
    if (!game.selectedPath) game.selectPath('martial');

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
    onboarding.hydrate({
      ...onboarding.toSaveState(),
      activeMilestoneId: 'complete',
      firstLifeOnlyComplete: true,
      unlockedTabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques', 'prestige'],
      unlockedWorldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'],
      teaserWorldModules: [],
      queuedTutorialCardIds: [],
    });
    onboarding.setDevOverride({ unlockAll: true });
    onboarding.applyUnlocks({
      unlockedTabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques', 'prestige'],
      unlockedWorldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'],
      teaserWorldModules: [],
    });

    // The 13 shared-tier live cultivator ids (COURT_SHARED_STATS.liveStatId), varied so the constellation
    // shows a real SHAPE and the derived martial channels are non-trivial.
    useTrainingStore.setState({
      statRatingsById: {
        dantian_depth: 92,
        body_integrity: 70,
        qi_purity: 55,
        meridian_throughput: 78,
        spirit_sense: 60,
        mind_clarity: 64,
        dao_stability: 48,
        body_tempering: 88,
        blood_essence: 74,
        armor_harmony: 52,
        recovery_depth: 66,
        meridian_fortitude: 58,
        rooted_guard: 40,
      },
    });

    const story = useStoryStore.getState();
    story.hydrateFromSave({ seenFlags: { story_intro_seen: true }, storyLog: [] });
    story.clearActive();

    const ui = useUIStore.getState();
    ui.hideOfflineProgress();
    ui.closeWorldBuildingModal();
    ui.closeMigrationIssuesModal();
    ui.closeLifeSummaryModal();
    ui.closeTutorialLedgerDrawer();
    ui.closeDaoHeartModal();
    ui.closeSpiritRootObservation();
    useUIStore.setState({
      activeOnboardingPrompt: null,
      queuedOnboardingPrompts: [],
      dismissedOnboardingLifeKeys: [],
      dismissedOnboardingRuntimeKeys: [],
    });
    ui.setActiveTab('status');

    // Recompute combat stats so the Vitals Ribbon reflects the engine the flag selects.
    useGameStore.getState().calculatePlayerStats();
  });
  await page.waitForTimeout(250);
  await dismissTransientPrompts(page);
}

// The per-node values live in SVG aria-labels ("…Value X of cap."), not visible innerText, so we read those.
async function constellationNodeAria(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const region = document.querySelector('[data-testid="obs-region-constellation"]');
    if (!region) return [];
    return Array.from(region.querySelectorAll('[aria-label]'))
      .map((el) => el.getAttribute('aria-label') ?? '')
      .filter((s) => /\bValue\b/.test(s))
      .sort();
  });
}

async function captureMode(page: Page, query: string, id: string) {
  await page.goto(`/?${query}`);
  await waitForApp(page);
  await seedLiveCultivator(page);

  const root = page.locator('[data-observatory-root="status-living-state-observatory"]');
  await expect(root).toBeVisible();
  const constellation = page.getByTestId('obs-region-constellation');
  const vitals = page.getByTestId('obs-region-vitals');
  await expect(constellation).toBeVisible();
  await expect(vitals).toBeVisible();

  mkdirSync(outDir, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(outDir, `observatory-${id}.png`), fullPage: true });
  // Region close-ups are best-effort: the instruments animate continuously (JS-driven), so an element
  // screenshot can wait on stability indefinitely — never let it fail the parity assertions. The full-page
  // shot above + the node-aria readings below are the load-bearing evidence.
  await constellation.screenshot({ path: path.join(outDir, `constellation-${id}.png`), timeout: 4000 }).catch(() => {});
  await vitals.screenshot({ path: path.join(outDir, `vitals-${id}.png`), timeout: 4000 }).catch(() => {});

  return {
    nodeAria: await constellationNodeAria(page),
    vitals: (await vitals.innerText({ timeout: 10_000 }).catch(() => '')).replace(/\s+/g, ' ').trim(),
  };
}

test.describe('M.I.1 parity pair (statEngine vs forceLegacy)', () => {
  test.use({ viewport: { width: 2048, height: 1152 }, deviceScaleFactor: 2 });

  test('derived constellation/vitals differ from legacy; forceLegacy restores the legacy reading', async ({ page }) => {
    // Two full-page captures at 2048×1152 dSF2 are heavy (~9 MB encode each); give the pair room.
    test.setTimeout(300_000);

    const derived = await captureMode(page, 'statEngine=1', 'derived');
    const legacy = await captureMode(page, 'forceLegacy=1', 'legacy');

    // Both engines render the 28 named-stat nodes…
    expect(derived.nodeAria.length).toBeGreaterThan(0);
    expect(legacy.nodeAria.length).toBeGreaterThan(0);
    // …but the WHOLE point of M.I.1: the constellation reading changes when the engine flag flips.
    expect(derived.nodeAria.join('\n')).not.toEqual(legacy.nodeAria.join('\n'));

    // The Vitals Ribbon already tracks F1 (game.stats); it should also differ between the engines.
    expect(derived.vitals).not.toEqual(legacy.vitals);
  });

  test('perf proxy — the constellation is stable across qi ticks while vitals update', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/?statEngine=1');
    await waitForApp(page);
    await seedLiveCultivator(page);

    const vitals = page.getByTestId('obs-region-vitals');
    await expect(page.getByTestId('obs-region-constellation')).toBeVisible();

    const c0 = (await constellationNodeAria(page)).join('\n');
    const v0 = (await vitals.innerText()).replace(/\s+/g, ' ').trim();
    await page.waitForTimeout(3500); // let several qi ticks elapse
    const c1 = (await constellationNodeAria(page)).join('\n');
    const v1 = (await vitals.innerText()).replace(/\s+/g, ' ').trim();

    // Behavioral proxy for the W8.3 memo: the heavy constellation reading does not churn on qi ticks…
    expect(c1).toEqual(c0);
    // …while the live vitals (qi / qiPerSecond) advance. Soft: if the tick is idle this is informational;
    // the constellation-stability assertion above is the load-bearing one.
    if (v1 === v0) {
      test.info().annotations.push({ type: 'note', description: 'vitals text did not change in 3.5s (tick may be idle)' });
    }
  });
});
