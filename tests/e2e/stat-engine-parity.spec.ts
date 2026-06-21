import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  DETERMINISTIC_SEED,
  FIXTURE_STATES,
  LIVE_PARITY_REALMS,
  PARITY_BAND_PCT,
  PARITY_CHANNELS,
  PARITY_REFERENCE_RATINGS,
  isWithinBand,
  mirrorDamage,
} from '../fixtures/statEngineParitySeeds';

/**
 * F1 / SA-A0 — the per-realm stat-engine parity harness (CAPTURE MODE).
 *
 * Captures the LEGACY baseline that the whole cutover is judged against: for a
 * deterministic per-realm cultivator, it reads gameStore `state.stats` at each of
 * the six live realms (flag-off / legacy path — the derived flag does not exist
 * yet) plus a representative mirror-damage number, and writes the committed
 * baseline table (JSON + Markdown) under docs/release/qa/f1-stat-engine/baseline/.
 *
 * It is the oracle SA-A2 (compare mode) matches per realm and SA-A4 / B-MERID
 * (hold mode) re-assert against. SA-A0 changes NO product code — this spec +
 * tests/fixtures/statEngineParitySeeds.ts + the evidence docs are the whole diff.
 */

const baselineRoot = path.resolve('docs/release/qa/f1-stat-engine/baseline');
const screenshotRoot = path.join(baselineRoot, 'screenshots');

type RealmRow = {
  index: number;
  rung: number;
  id: string;
  name: string;
  legacy: Record<string, number>;
  mirrorDamage: number;
};

async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('body').waitFor({ state: 'visible' });
}

async function dismissTransientPrompts(page: Page) {
  for (let i = 0; i < 8; i += 1) {
    const clicked =
      (await page.getByRole('button', { name: /^Continue$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Skip$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Close$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false));
    if (!clicked) return;
    await page.waitForTimeout(100);
  }
}

/**
 * Pin every field that feeds calculatePlayerStats to the DETERMINISTIC_SEED so the
 * legacy baseline is identical run-to-run. Mirrors the status-tab seed for onboarding,
 * then normalizes the combat seed (path/focus/substage/upgrades/equipment/perks/buffs).
 */
async function seedDeterministicCultivator(page: Page) {
  await page.evaluate(async (seed) => {
    const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
    const { useGameStore } = await imp('/src/stores/gameStore.ts');
    const { useEquipmentStore } = await imp('/src/stores/equipmentStore.ts');
    const { usePrestigeStore } = await imp('/src/stores/prestigeStore.ts');
    const { useOnboardingStore } = await imp('/src/stores/onboardingStore.ts');
    const { useStoryStore } = await imp('/src/features/story/storyStore.ts');
    const { useUIStore } = await imp('/src/stores/uiStore.ts');

    const game = useGameStore.getState();
    if (!game.selectedPath) game.selectPath(seed.path);

    // Neutralize prestige: a fresh save calls generateSpiritRoot() (Math.random grade/
    // element) — a RANDOM, non-reproducible multiplier. Null root => total multiplier
    // 1.0 and the element-bonus branch is skipped, so the baseline is the pure,
    // reproducible REALMS×heaven curve. Combat multiplier is already 1.0 on a fresh
    // store (no purchased upgrades). The derived path runs the SAME stack, so this
    // neutralization cancels on both sides and parity is unaffected (§3.2 shim).
    usePrestigeStore.setState({ spiritRoot: null });

    // Onboarding complete so the shell renders (no wizard overlay).
    const onboarding = useOnboardingStore.getState();
    const tabs = ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques', 'prestige'];
    onboarding.hydrate({
      ...onboarding.toSaveState(),
      activeMilestoneId: 'complete',
      firstLifeOnlyComplete: true,
      unlockedTabs: tabs,
      unlockedWorldModules: [],
      teaserWorldModules: [],
      queuedTutorialCardIds: [],
    });
    onboarding.setDevOverride({ unlockAll: true });
    onboarding.applyUnlocks({ unlockedTabs: tabs, unlockedWorldModules: [], teaserWorldModules: [] });
    useStoryStore.getState().clearActive?.();

    // Pin the combat seed (everything calculatePlayerStats reads, except realm.index).
    const cur = useGameStore.getState();
    useGameStore.setState({
      focusMode: seed.focusMode,
      selectedPath: seed.path,
      realm: { ...cur.realm, substage: seed.substage },
      upgradeTiers: { ...cur.upgradeTiers, hp: 0, damage: 0 },
      pathPerks: [],
      activeBuffs: [],
    });

    const eq = useEquipmentStore.getState();
    useEquipmentStore.setState({
      equippedWeaponId: null,
      equippedAccessoryId: null,
      refineLevelBySlot: { ...eq.refineLevelBySlot, weapon: 0, accessory: 0 },
      temperBonusesBySlot: { weapon: [], accessory: [] },
    });

    const ui = useUIStore.getState();
    ui.hideOfflineProgress?.();
    ui.closeSpiritRootObservation?.();
    useUIStore.setState({ activeOnboardingPrompt: null, queuedOnboardingPrompts: [] });
  }, DETERMINISTIC_SEED as unknown as Record<string, unknown>);
  await page.waitForTimeout(150);
  await dismissTransientPrompts(page);
}

/**
 * Sweep the six live realms inside a SINGLE evaluate (no game-loop interference
 * between realms): set realm.index, recompute via calculatePlayerStats, read the
 * eight channels off state.stats. Returns the per-realm legacy vector.
 */
async function captureLegacyVectors(page: Page): Promise<Record<number, Record<string, number>>> {
  return page.evaluate(
    async ({ realms, channels }) => {
      const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
      const { useGameStore } = await imp('/src/stores/gameStore.ts');
      const out: Record<number, Record<string, number>> = {};
      for (const realm of realms) {
        const cur = useGameStore.getState();
        useGameStore.setState({ realm: { ...cur.realm, index: realm.index, substage: 1 } });
        useGameStore.getState().calculatePlayerStats();
        const s = useGameStore.getState().stats;
        const num = (v: unknown): number => (typeof v === 'string' ? parseFloat(v) : (v as number));
        const vec: Record<string, number> = {};
        for (const ch of channels) vec[ch] = num((s as Record<string, unknown>)[ch]);
        out[realm.index] = vec;
      }
      return out;
    },
    { realms: LIVE_PARITY_REALMS as unknown as Array<{ index: number }>, channels: PARITY_CHANNELS as unknown as string[] },
  );
}

function renderMarkdown(rows: RealmRow[]): string {
  const head = `| Realm | rung | maxHp | atk | def | regen | crit | critDmg | dodge | speed | mirror dmg |`;
  const sep = `|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|`;
  const body = rows
    .map((r) => {
      const c = r.legacy;
      const f = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
      return `| ${r.name} | ${r.rung} | ${f(c.maxHp)} | ${f(c.atk)} | ${f(c.def)} | ${f(c.regen)} | ${f(c.crit)} | ${f(c.critDmg)} | ${f(c.dodge)} | ${f(c.speed)} | ${f(r.mirrorDamage)} |`;
    })
    .join('\n');
  return [
    '# F1 / SA-A0 — Legacy stat-engine parity baseline',
    '',
    '> CAPTURE MODE. The legacy `calculatePlayerStats` output for the DETERMINISTIC_SEED',
    '> (heaven path · balanced focus · substage 1 · no upgrades/equipment/perks/buffs ·',
    '> fresh prestige), swept across the six live realms. This table is the oracle SA-A2',
    "> matches per realm (the derived path must land within D15's tolerance band of these).",
    '',
    `Seed: \`${JSON.stringify(DETERMINISTIC_SEED)}\``,
    '',
    head,
    sep,
    body,
    '',
  ].join('\n');
}

test.describe('F1 SA-A0 stat-engine parity baseline (capture mode)', () => {
  test('captures the deterministic legacy per-realm baseline (reproducible)', async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForApp(page);
    await seedDeterministicCultivator(page);

    // Capture twice — the baseline must be reproducible (determinism gate, SA-A0 stop condition).
    const first = await captureLegacyVectors(page);
    const second = await captureLegacyVectors(page);
    expect(second, 'legacy baseline must be deterministic (two captures identical)').toEqual(first);

    // Cleanliness anchor: with prestige neutralized, R0 must equal the pure REALMS×heaven
    // curve (Qi Condensation 100/10/5/1 × heaven hp0.8/atk1.3/def0.9/crit+10/dodge+5).
    // If a random spirit-root multiplier leaked in, these exact values would not hold —
    // so this assertion proves the baseline is clean AND reproducible by construction.
    const r0 = first[0];
    const approx = (got: number, want: number) => expect(Math.abs(got - want)).toBeLessThan(1e-6);
    approx(r0.maxHp, 80);
    approx(r0.atk, 13);
    approx(r0.def, 4.5);
    approx(r0.regen, 1);
    approx(r0.crit, 15);
    approx(r0.critDmg, 150);
    approx(r0.dodge, 10);
    approx(r0.speed, 1.0);

    const rows: RealmRow[] = LIVE_PARITY_REALMS.map((realm) => {
      const legacy = first[realm.index];
      return {
        index: realm.index,
        rung: realm.rung,
        id: realm.id,
        name: realm.name,
        legacy,
        mirrorDamage: mirrorDamage(legacy.atk, legacy.def),
      };
    });

    // Sanity: every channel resolved to a finite, positive-or-zero number at every realm.
    for (const row of rows) {
      for (const ch of PARITY_CHANNELS) {
        expect(Number.isFinite(row.legacy[ch]), `${row.name}.${ch} must be finite`).toBe(true);
      }
      expect(row.legacy.maxHp, `${row.name} maxHp must be positive`).toBeGreaterThan(0);
    }

    // The geometric ladder must be monotonic (the scale spine SA-A2 reproduces).
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i].legacy.maxHp, 'maxHp must rise per realm').toBeGreaterThan(rows[i - 1].legacy.maxHp);
    }

    mkdirSync(baselineRoot, { recursive: true });
    writeFileSync(
      path.join(baselineRoot, 'legacy-baseline.json'),
      JSON.stringify({ seed: DETERMINISTIC_SEED, capturedRows: rows }, null, 2),
    );
    writeFileSync(path.join(baselineRoot, 'legacy-baseline.md'), renderMarkdown(rows));
  });

  // SA-A1 seam proof: with the flag forced ON (runtime override), combat sources its GEO base
  // from the derived engine; with the flag OFF it is the legacy baseline (unchanged); GENTLE is
  // carved out so it is identical under both. The derived numbers are wrong-scaled here (the
  // fresh seed's foundation/axes are ~0) — expected and harmless because the flag is OFF by
  // default; SA-A2 closes the scale via the curve rebuild.
  test('SA-A1 seam: flag-on sources GEO from the derived engine; flag-off unchanged; GENTLE carved out', async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForApp(page);
    await seedDeterministicCultivator(page);

    const off = (await captureLegacyVectors(page))[0];
    await page.evaluate(() => window.localStorage.setItem('statEngine', '1'));
    const on = (await captureLegacyVectors(page))[0];
    await page.evaluate(() => window.localStorage.removeItem('statEngine'));

    // The seam is wired: flag-on GEO comes from the derived engine, so it differs from legacy.
    expect(on.maxHp, 'flag-on maxHp must be sourced from the derived engine (≠ legacy)').not.toEqual(off.maxHp);
    expect(Number.isFinite(on.maxHp) && on.maxHp > 0, 'flag-on stats finite & positive (seam intact)').toBe(true);
    expect(Number.isFinite(on.atk) && on.atk > 0).toBe(true);

    // GENTLE carve-out — crit/critDmg/dodge/speed carried from the realm row, identical both ways.
    expect(on.crit).toEqual(off.crit);
    expect(on.critDmg).toEqual(off.critDmg);
    expect(on.dodge).toEqual(off.dodge);
    expect(on.speed).toEqual(off.speed);

    // Flag-off is byte-unchanged — the legacy R0 cleanliness anchor still holds.
    expect(off.maxHp).toBe(80);
  });

  // SA-A2 COMPARE MODE — the parity gate (INV-1). For the reference cultivator, the derived
  // path (flag on) must land within the ±band of the SA-A0 legacy baseline at every live realm,
  // every channel. A single out-of-band cell fails the packet. Writes the committed parity table.
  test('SA-A2 parity gate: derived is within band of legacy at every realm × channel', async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForApp(page);
    await seedDeterministicCultivator(page);

    // Legacy baseline (flag off — REALMS×heaven, rating-independent).
    const legacy = await captureLegacyVectors(page);

    // Derived (flag on + the reference parity cultivator seeded into the training ratings).
    await page.evaluate(async (refRatings) => {
      const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
      const { useTrainingStore } = await imp('/src/stores/trainingStore.ts');
      useTrainingStore.setState({ statRatingsById: { ...useTrainingStore.getState().statRatingsById, ...refRatings } });
      window.localStorage.setItem('statEngine', '1');
    }, PARITY_REFERENCE_RATINGS as Record<string, number>);
    const derived = await captureLegacyVectors(page);
    await page.evaluate(() => window.localStorage.removeItem('statEngine'));

    // Build the per-realm × per-channel parity table and assert every cell is in band.
    const rows = LIVE_PARITY_REALMS.map((realm) => {
      const l = legacy[realm.index];
      const d = derived[realm.index];
      const channels = PARITY_CHANNELS.map((ch) => ({
        ch,
        legacy: l[ch],
        derived: d[ch],
        deltaPct: l[ch] === 0 ? (d[ch] === 0 ? 0 : 100) : ((d[ch] - l[ch]) / Math.abs(l[ch])) * 100,
        inBand: isWithinBand(l[ch], d[ch], PARITY_BAND_PCT),
      }));
      const dmgLegacy = mirrorDamage(l.atk, l.def);
      const dmgDerived = mirrorDamage(d.atk, d.def);
      return {
        realm,
        channels,
        dmgLegacy,
        dmgDerived,
        dmgInBand: isWithinBand(dmgLegacy, dmgDerived, PARITY_BAND_PCT),
      };
    });

    mkdirSync(path.join(baselineRoot, '..', 'compare'), { recursive: true });
    const compareRoot = path.resolve('docs/release/qa/f1-stat-engine/compare');
    mkdirSync(compareRoot, { recursive: true });
    writeFileSync(path.join(compareRoot, 'parity-table.json'), JSON.stringify({ bandPct: PARITY_BAND_PCT, rows }, null, 2));

    const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
    const md = [
      '# F1 / SA-A2 — Per-realm parity gate (compare mode)',
      '',
      `> Reference cultivator (all 13 shared ratings = 100), flag ON. Band: ±${PARITY_BAND_PCT * 100}% per channel.`,
      '> Every cell must be in band for SA-A2 to be done (INV-1). legacy / derived / Δ%.',
      '',
      `| Realm | ${PARITY_CHANNELS.join(' | ')} | mirror dmg |`,
      `|---|${PARITY_CHANNELS.map(() => '---').join('|')}|---|`,
      ...rows.map((r) => {
        const cells = r.channels
          .map((c) => `${fmt(c.legacy)}/${fmt(c.derived)} (${c.deltaPct >= 0 ? '+' : ''}${c.deltaPct.toFixed(1)}%)${c.inBand ? '' : ' ✗'}`)
          .join(' | ');
        return `| ${r.realm.name} | ${cells} | ${fmt(r.dmgLegacy)}/${fmt(r.dmgDerived)}${r.dmgInBand ? '' : ' ✗'} |`;
      }),
      '',
    ].join('\n');
    writeFileSync(path.join(compareRoot, 'parity-table.md'), md);

    // The gate: assert every realm × channel + the representative damage is in band.
    for (const r of rows) {
      for (const c of r.channels) {
        expect(c.inBand, `${r.realm.name} · ${c.ch}: legacy ${c.legacy} vs derived ${c.derived} (${c.deltaPct.toFixed(1)}%)`).toBe(true);
      }
      expect(r.dmgInBand, `${r.realm.name} · mirror dmg: ${r.dmgLegacy} vs ${r.dmgDerived}`).toBe(true);
    }
  });

  // SA-A4 gate point 5 — forceLegacy always wins (preserve-first, INV-2). With the basic seed
  // (no reference ratings) the derived path differs from legacy; forceLegacy must restore the
  // exact legacy value even with the engine flag on, proving the legacy engine is one param away.
  test('SA-A4 forceLegacy: flag-on + forceLegacy restores the legacy engine exactly', async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForApp(page);
    await seedDeterministicCultivator(page);

    const legacyOff = (await captureLegacyVectors(page))[0]; // flag off → legacy baseline
    await page.evaluate(() => window.localStorage.setItem('statEngine', '1'));
    const derivedOn = (await captureLegacyVectors(page))[0]; // flag on (basic seed) → derived ≠ legacy
    await page.evaluate(() => window.localStorage.setItem('forceLegacy', '1'));
    const forced = (await captureLegacyVectors(page))[0]; // flag on + forceLegacy → legacy
    await page.evaluate(() => {
      window.localStorage.removeItem('statEngine');
      window.localStorage.removeItem('forceLegacy');
    });

    expect(derivedOn.maxHp, 'derived differs from legacy for the basic seed (the seam is live)').not.toEqual(legacyOff.maxHp);
    expect(forced.maxHp, 'forceLegacy restores the exact legacy value (it always wins)').toEqual(legacyOff.maxHp);
    expect(forced.atk).toEqual(legacyOff.atk);
    expect(forced.def).toEqual(legacyOff.def);
  });

  // The visual oracle: the status surface in every fixture state at 2048×1152 dSF2.
  // Mirrors status-observatory-states.spec.ts (?obsFixture), captured under the F1
  // evidence dir so the cutover's flag-off render has a per-state reference.
  for (const state of FIXTURE_STATES) {
    test(`captures legacy status surface — fixture:${state}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 2048, height: 1152 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/?obsFixture=${state}`);
      await waitForApp(page);
      await seedDeterministicCultivator(page);
      await page.evaluate(async () => {
        const imp = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
        const { useUIStore } = await imp('/src/stores/uiStore.ts');
        useUIStore.getState().setActiveTab('status');
      });
      const root = page.locator('[data-observatory-root="status-living-state-observatory"]');
      await expect(root).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(500);
      mkdirSync(screenshotRoot, { recursive: true });
      await page.screenshot({ path: path.join(screenshotRoot, `legacy-status-${state}.png`), fullPage: true });
    });
  }
});
