const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = process.cwd();
const artifactRoot = path.join(root, 'artifacts', 'training-heart-law', 'mp2', 'browser');
const screenshotDir = path.join(artifactRoot, 'screenshots');
const summaryDir = path.join(artifactRoot, 'dom-summaries');
const url = 'http://127.0.0.1:5173/';

const scenarios = [
  { id: '01-heaven-idle', path: 'heaven', mode: 'idle', expect: ['Training Hall', 'Heaven Star Observatory', 'Ready to practice'] },
  { id: '02-earth-idle', path: 'earth', mode: 'idle', expect: ['Training Hall', 'Earth Body Tempering Yard', 'Ready to practice'] },
  { id: '03-martial-idle', path: 'martial', mode: 'idle', expect: ['Training Hall', 'Martial Sparring Court', 'Ready to practice'] },
  { id: '04-active-practice', path: 'heaven', mode: 'active', expect: ['Practice active', 'Practicing'] },
  { id: '05-blocked-combat', path: 'heaven', mode: 'blocked', expect: ['Combat active', 'Stop combat before starting Training Hall practice'] },
  { id: '06-fatigue-high', path: 'heaven', mode: 'fatigue', expect: ['Fatigue high', 'Intensity may downgrade'] },
  { id: '07-cap-reached', path: 'heaven', mode: 'cap', expect: ['Cap reached', 'current realm cap'] },
  { id: '08-offline-return', path: 'heaven', mode: 'offline', expect: ['Return report', 'Offline practice applied'] },
  { id: '09-reduced-motion', path: 'heaven', mode: 'reduced', expect: ['Reduced motion', 'stable practice marks'] },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function ensureDirs() {
  await fs.mkdir(screenshotDir, { recursive: true });
  await fs.mkdir(summaryDir, { recursive: true });
}

async function setupScenario(page, scenario) {
  return page.evaluate(async (scenario) => {
    const [
      { useActivityStore },
      { useContentStore },
      { useGameStore },
      { useOnboardingStore },
      { useTrainingStore },
      { useUIStore },
      training,
    ] = await Promise.all([
      import('/src/stores/activityStore.ts'),
      import('/src/stores/contentStore.ts'),
      import('/src/stores/gameStore.ts'),
      import('/src/stores/onboardingStore.ts'),
      import('/src/stores/trainingStore.ts'),
      import('/src/stores/uiStore.ts'),
      import('/src/systems/training/index.ts'),
    ]);

    await new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const check = () => {
        const contentState = useContentStore.getState();
        if (contentState.isLoaded && contentState.raw) {
          resolve();
          return;
        }
        if (Date.now() - startedAt > 15000) {
          reject(new Error(`content store did not load; isLoaded=${contentState.isLoaded}; error=${contentState.error ?? 'none'}`));
          return;
        }
        setTimeout(check, 50);
      };
      check();
    });

    window.__ciFxDebug?.setReducedMotionOverride(scenario.mode === 'reduced' ? true : false);
    useUIStore.getState().hardResetUI();
    useActivityStore.getState().hardResetActivity();
    useTrainingStore.getState().hardResetTraining();
    useOnboardingStore.getState().setDevOverride({ unlockAll: true });
    useOnboardingStore.getState().applyUnlocks({ unlockedWorldModules: ['trainingHall'] });
    useGameStore.setState({
      selectedPath: scenario.path,
      realm: { index: 0, substage: 1, name: 'Qi Condensation' },
    });

    const content = training.createTrainingRuntimeContent(useContentStore.getState().raw);
    const firstRegimen = content.regimens.find((regimen) => regimen.path === scenario.path);
    if (!firstRegimen) throw new Error(`No first regimen for ${scenario.path}`);

    const saveState = training.createDefaultTrainingSaveState();
    if (scenario.mode === 'fatigue') {
      saveState.fatigue = 90;
    }
    if (scenario.mode === 'cap') {
      saveState.statRatingsById[firstRegimen.primaryStatId] = training.trainingStatCap({
        realmIndex: 0,
        substageIndex: 0,
      });
    }
    if (scenario.mode === 'offline') {
      saveState.lastOfflineSummary = {
        appliedMs: 180000,
        statXpGainedById: { [firstRegimen.primaryStatId]: 24 },
        masteryXpGainedByRegimenId: { [firstRegimen.id]: 8 },
        fatigueGained: 1.5,
        completedAt: 1700000000000,
      };
    }
    useTrainingStore.setState(saveState);

    if (scenario.mode === 'blocked') {
      useActivityStore.getState().startActivity(
        'trial',
        { sourceId: 'trial_foundation', cityId: 'city_pinewind_hamlet' },
        'training-hall-browser-evidence',
      );
    }

    useUIStore.getState().openWorldBuildingModal({
      cityId: 'city_pinewind_hamlet',
      buildingKey: 'trainingHall',
      intent: { trainingHallExactMode: 'live' },
    });

    return {
      firstRegimenId: firstRegimen.id,
      firstRegimenName: firstRegimen.displayName,
      primaryStatId: firstRegimen.primaryStatId,
      reducedMotion: window.__ciFxDebug?.getState().prefersReducedMotion ?? null,
    };
  }, scenario);
}

async function captureScenario(page, scenario) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__ciFxDebug), null, { timeout: 15000 });
  const setup = await setupScenario(page, scenario);
  const rootLocator = page.locator('[data-testid="training-hall-page"]');
  await rootLocator.waitFor({ state: 'visible', timeout: 15000 });

  if (scenario.mode === 'active') {
    await rootLocator.locator('.trainingHallActionButton.is-primary').click();
    await page.waitForFunction(() => {
      const root = document.querySelector('[data-testid="training-hall-page"]');
      return root?.textContent?.includes('Practice active') ?? false;
    }, null, { timeout: 5000 });
  }

  if (scenario.mode === 'reduced') {
    await page.waitForFunction(() => {
      const root = document.querySelector('[data-testid="training-hall-page"]');
      return root?.getAttribute('data-reduced-motion') === 'true';
    }, null, { timeout: 5000 });
  }

  const dom = await rootLocator.evaluate((root) => {
    const regimens = Array.from(root.querySelectorAll('.trainingHallRegimen')).map((button) => ({
      text: button.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      path: button.getAttribute('data-path'),
      regimenId: button.getAttribute('data-regimen-id'),
    }));
    const actionButtons = Array.from(root.querySelectorAll('.trainingHallActionButton')).map((button) => ({
      text: button.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      disabled: button.hasAttribute('disabled'),
      title: button.getAttribute('title'),
    }));
    const alerts = Array.from(root.querySelectorAll('.trainingHallAlert')).map((alert) => alert.textContent?.replace(/\s+/g, ' ').trim() ?? '');
    return {
      text: root.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      path: root.getAttribute('data-path'),
      reducedMotion: root.getAttribute('data-reduced-motion'),
      regimenCount: regimens.length,
      regimenPaths: Array.from(new Set(regimens.map((entry) => entry.path))),
      regimens,
      actionButtons,
      alerts,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentSize: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    };
  });

  assert(dom.path === scenario.path, `${scenario.id}: expected data-path=${scenario.path}, got ${dom.path}`);
  assert(dom.regimenCount === 6, `${scenario.id}: expected six regimens, got ${dom.regimenCount}`);
  assert(dom.regimenPaths.length === 1 && dom.regimenPaths[0] === scenario.path, `${scenario.id}: cross-path regimen leakage ${dom.regimenPaths.join(',')}`);
  assert(dom.horizontalOverflowPx <= 2, `${scenario.id}: horizontal overflow ${dom.horizontalOverflowPx}px`);
  for (const expected of scenario.expect) {
    assert(dom.text.includes(expected), `${scenario.id}: missing expected text "${expected}"`);
  }
  if (scenario.mode === 'reduced') {
    assert(dom.reducedMotion === 'true', `${scenario.id}: reduced-motion data flag was ${dom.reducedMotion}`);
  }
  if (scenario.mode !== 'reduced') {
    assert(dom.reducedMotion === 'false', `${scenario.id}: reduced-motion unexpectedly ${dom.reducedMotion}`);
  }

  const screenshotPath = path.join(screenshotDir, `${scenario.id}.png`);
  const summaryPath = path.join(summaryDir, `${scenario.id}.json`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await fs.writeFile(summaryPath, JSON.stringify({ scenario, setup, dom, screenshotPath }, null, 2));
  return { scenario, setup, dom, screenshotPath, summaryPath };
}

(async () => {
  await ensureDirs();
  const consoleMessages = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text(), location: message.location() });
  });
  page.on('pageerror', (error) => {
    consoleMessages.push({ type: 'pageerror', text: error.message, stack: error.stack });
  });

  const captures = [];
  try {
    for (const scenario of scenarios) {
      captures.push(await captureScenario(page, scenario));
    }
  } finally {
    await browser.close();
  }

  const blockingConsole = consoleMessages.filter((message) => message.type === 'error' || message.type === 'pageerror');
  await fs.writeFile(path.join(artifactRoot, 'console.log'), consoleMessages.map((message) => `${message.type}: ${message.text}`).join('\n'));
  await fs.writeFile(path.join(artifactRoot, 'browser-evidence.json'), JSON.stringify({
    url,
    capturedAt: new Date().toISOString(),
    scenarioCount: captures.length,
    captures: captures.map((capture) => ({
      id: capture.scenario.id,
      path: capture.scenario.path,
      mode: capture.scenario.mode,
      screenshotPath: capture.screenshotPath,
      summaryPath: capture.summaryPath,
      regimenCount: capture.dom.regimenCount,
      reducedMotion: capture.dom.reducedMotion,
      alerts: capture.dom.alerts,
      actionButtons: capture.dom.actionButtons,
      horizontalOverflowPx: capture.dom.horizontalOverflowPx,
    })),
    console: {
      total: consoleMessages.length,
      blocking: blockingConsole,
    },
  }, null, 2));

  if (blockingConsole.length > 0) {
    throw new Error(`Browser console/page errors found: ${blockingConsole.map((message) => `${message.type}:${message.text}`).join(' | ')}`);
  }

  console.log(`Captured ${captures.length} Training Hall screenshots under ${screenshotDir}`);
})();

