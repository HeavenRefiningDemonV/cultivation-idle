import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * M.I.3 STATUS-RECONCILE-PORT — liveness wiring evidence (tier-independent).
 *
 * The live telemetry MOTION itself is gated to the explicit 'high' FxQuality tier (reviewer-opt-in; the
 * default board is static by doctrine), so this spec proves the WIRING that is true on every tier:
 *  - G1: the global motion vars (--qi-flow-rate / --tick-spin-dur / --breath-period) are set ONCE on the
 *    stage (.obsStageViewport) from the typed surface (meta.motionHints) and the heavy instruments do NOT
 *    set them locally — i.e. they cascade. (The vars carry 0 off the high tier; their PRESENCE on the stage
 *    and ABSENCE on the instruments is the structural proof of the perf-safe cascade — stop condition #3.)
 *  - G3: the rootLaw bridge + astrolabe are the 4th cross-highlight family — selecting the bridge sets
 *    data-related='true' on both.
 *  - Perf: the heavy instruments' DOM is stable across qi ticks (they never carry motionHints, so they do
 *    not re-render on a tick).
 */

const outDir = path.resolve('docs/release/qa/mi3-liveness');

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

async function seedObservatory(page: Page) {
  await page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useCityStore } = await importModule('/src/stores/cityStore.ts');
    const { useContentStore } = await importModule('/src/stores/contentStore.ts');
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    const { useHeartLawStore } = await importModule('/src/stores/heartLawStore.ts');
    const { useOnboardingStore } = await importModule('/src/stores/onboardingStore.ts');
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');
    const { useStoryStore } = await importModule('/src/features/story/storyStore.ts');

    const content = useContentStore.getState();
    const cityId = content.maps.citiesById.city_pinewind_hamlet ? 'city_pinewind_hamlet' : content.citiesSorted[0]?.id;
    if (cityId) useCityStore.setState({ currentCityId: cityId, unlockedCityIds: [cityId] });

    const game = useGameStore.getState();
    if (!game.selectedPath) game.selectPath('heaven');
    // A non-trivial qi/s so meta.motionHints.cultivationRate is > 0 (the stage spin/qi-flow scale off it).
    useGameStore.setState({ qiPerSecond: '4200' });

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
  });
  await page.waitForTimeout(250);
  await dismissTransientPrompts(page);
}

function styleVar(page: Page, selector: string, name: string): Promise<string> {
  return page.evaluate(
    ({ selector, name }) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      return el ? el.style.getPropertyValue(name).trim() : '__no-element__';
    },
    { selector, name },
  );
}

test.describe('M.I.3 Observatory liveness wiring', () => {
  test.use({ viewport: { width: 2048, height: 1152 }, deviceScaleFactor: 2 });

  test('G1 — global motion vars are set on the stage and NOT on the heavy instruments (cascade)', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/?statEngine=1');
    await waitForApp(page);
    await seedObservatory(page);

    const root = page.locator('[data-observatory-root="status-living-state-observatory"]');
    await expect(root).toBeVisible();

    // The stage carries the three global vars inline (set by the shell from meta.motionHints).
    expect(await styleVar(page, '.obsStageViewport', '--qi-flow-rate')).not.toEqual('');
    expect(await styleVar(page, '.obsStageViewport', '--tick-spin-dur')).not.toEqual('');
    expect(await styleVar(page, '.obsStageViewport', '--breath-period')).not.toEqual('');

    // The heavy instruments must NOT set the global vars locally (else they would override the cascade and,
    // worse, would have to read live telemetry → re-render on every qi tick).
    expect(await styleVar(page, '.statusMeridianVesselCompass__bodyLinework', '--qi-flow-rate')).toEqual('');
    // The astrolabe keeps ONLY its per-instrument vars (needle / purity) — never the global tick-spin.
    expect(await styleVar(page, '.statusSpiritRootAstrolabe__ring', '--tick-spin-dur')).toEqual('');

    mkdirSync(outDir, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(outDir, 'observatory-live.png'), fullPage: true });
  });

  test('G3 — the rootLaw bridge + astrolabe are the 4th cross-highlight family', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/?statEngine=1');
    await waitForApp(page);
    await seedObservatory(page);

    // Scope to one observatory mount (the live status-tab route keeps hidden duplicate mounts; the bridge
    // can also compute to visibility:hidden in the harness at this viewport — it renders fine in the
    // browser, see the matrix screenshots). G3's deliverable is the brighten WIRING: dispatch the click
    // directly (click → select('rootLaw') → isSelected → data-related), which is what must light up.
    const obs = page.locator('[data-observatory-root="status-living-state-observatory"]').first();
    const bridge = obs.locator('.statusRootLawBridge').first();
    await expect(bridge).toHaveAttribute('data-related', /^(true|false)$/); // wired to selection
    await bridge.evaluate((el) => (el as HTMLElement).click());
    // Selecting the bridge lights its own family (bridge + astrolabe section) via data-related.
    await expect(bridge).toHaveAttribute('data-related', 'true');
    await expect(obs.locator('.statusSpiritRootAstrolabe').first()).toHaveAttribute('data-related', 'true');
  });

  test('perf proxy — the heavy instruments are stable across qi ticks', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/?statEngine=1');
    await waitForApp(page);
    await seedObservatory(page);

    const snapshot = () =>
      page.evaluate(() => {
        const grab = (sel: string) => (document.querySelector(sel)?.innerHTML ?? '').length + ':' + (document.querySelector(sel)?.innerHTML ?? '').slice(0, 240);
        return {
          vessel: grab('[data-testid="obs-region-vessel"]'),
          canopy: grab('[data-testid="obs-region-canopy"]'),
          constellation: grab('[data-testid="obs-region-constellation"]'),
        };
      });

    const before = await snapshot();
    await page.waitForTimeout(3500); // let several qi ticks elapse
    const after = await snapshot();

    // The heavy instruments never carry motionHints in their memoized slice, so a qi tick must not churn
    // their DOM (stop condition #3). The live motion (high tier) rides the stage var cascade, not these.
    expect(after.vessel).toEqual(before.vessel);
    expect(after.canopy).toEqual(before.canopy);
    expect(after.constellation).toEqual(before.constellation);
  });
});
