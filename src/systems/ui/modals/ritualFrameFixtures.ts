import {
  RITUAL_FRAME_SCHEMA_VERSION,
  type RitualModalSurfaceV1,
} from './ritualFrameTypes.js';

/**
 * F2-MODALS / S0 — deterministic ritual-shell fixtures (§7.2 matrix). No live RNG; values are
 * illustrative ([tune→D15]). Consumed by modal-stage.html?modal=ritual&state=<seed id>. Every
 * seed carries the never-regress readout (a gameplay truth surfaced in every rite).
 */

export const RITUAL_FRAME_FIXTURE_SEEDS = [
  'breakthrough-success',
  'breakthrough-not-yet',
  'tribulation-success',
  'tribulation-not-yet',
  'echo-decree',
  'life-summary',
  'root-upgrade',
  'ritual-skipped',
] as const;
export type RitualFrameFixtureSeedId = (typeof RITUAL_FRAME_FIXTURE_SEEDS)[number];

/** The same never-regress promise, in concrete language, for every rite. */
const NEVER_REGRESS = {
  headline: 'No earned state is lost.',
  pityNote: 'Pity accumulates toward a guaranteed success.',
} as const;

const SEED_BUILDERS: Record<RitualFrameFixtureSeedId, () => RitualModalSurfaceV1> = {
  'breakthrough-success': () => ({
    schemaVersion: RITUAL_FRAME_SCHEMA_VERSION,
    visualState: 'breakthrough-success',
    rite: 'breakthrough',
    riteState: 'default',
    riteTag: '闖關',
    riteName: 'Breakthrough · Foundation Establishment, Stage 4',
    stakes: {
      risked: ['Nothing — a failed breakthrough costs no earned progress'],
      gained: ['+1 cultivation stage', 'Higher Qi capacity'],
      guaranteed: ['Pity carries to the next attempt'],
    },
    neverRegress: NEVER_REGRESS,
    scene: { breakthroughStage: 4 },
    outcome: {
      kind: 'success', eyebrow: 'Threshold crossed', title: 'Foundation Establishment', titleCjk: '築基 · 第四重',
      body: 'The dantian settles into its new shape. Foundation-tier arts, areas, equipment, and pills are now within your reach.',
    },
    skipIntent: 'ritual.skip',
    exitIntent: 'ritual.continue',
    confirmIntent: 'breakthrough.begin',
    honestOdds: { label: 'Readiness', value: '78% — favourable' },
  }),
  'breakthrough-not-yet': () => ({
    schemaVersion: RITUAL_FRAME_SCHEMA_VERSION,
    visualState: 'breakthrough-not-yet',
    rite: 'breakthrough',
    // Cinnabar-law: a breakthrough not-yet is non-regressive and NON-danger — it must stay sober
    // (default void + bronze pity bar), never the cinnabar postFailure edge. Cinnabar is reserved
    // for the tribulation register (its not-yet keeps riteState 'postFailure'). Matches the artifact.
    riteState: 'default',
    riteTag: '闖關',
    riteName: 'Breakthrough · Foundation Establishment, Stage 4',
    stakes: {
      risked: ['Nothing is lost on a "not yet"'],
      gained: ['+1 cultivation stage on success'],
      guaranteed: ['Pity rises; a guaranteed success is approached'],
    },
    neverRegress: NEVER_REGRESS,
    scene: { breakthroughStage: 3 },
    outcome: {
      kind: 'not-yet', eyebrow: 'Not yet', title: 'The gate holds — for now', titleCjk: '尚未',
      body: 'Readiness was not quite enough. Nothing was lost: you remain whole, at Qi Condensation · Stage 9, and the way forward is unchanged.',
      pityGained: 'Pity +1 (4/10 toward a guaranteed crossing)', pityPercent: 40,
    },
    skipIntent: 'ritual.skip',
    exitIntent: 'ritual.acknowledge',
    confirmIntent: 'breakthrough.retry',
    honestOdds: { label: 'Readiness', value: '61% — build a little more' },
  }),
  'tribulation-success': () => ({
    schemaVersion: RITUAL_FRAME_SCHEMA_VERSION,
    visualState: 'tribulation-success',
    rite: 'tribulation',
    riteState: 'default',
    riteTag: '渡劫',
    riteName: 'Heavenly Tribulation · Core Formation',
    stakes: {
      risked: ['The tribulation strikes — endure it, do not lose to it'],
      gained: ['Ascend to Core Formation', 'A realm-tier of new strength'],
      guaranteed: ['No realm already attained can be lost'],
    },
    neverRegress: NEVER_REGRESS,
    outcome: {
      kind: 'success', eyebrow: 'The sky clears', title: 'Core Formation', titleCjk: '金丹 · 大成',
      body: 'A golden core condenses where qi once merely gathered. You have crossed the realm the heavens guard — the first rule-changing tier is yours.',
    },
    skipIntent: 'ritual.skip',
    exitIntent: 'ritual.continue',
    confirmIntent: 'tribulation.begin',
    honestOdds: { label: 'Trial odds', value: '64% — the stakes are real' },
  }),
  'tribulation-not-yet': () => ({
    schemaVersion: RITUAL_FRAME_SCHEMA_VERSION,
    visualState: 'tribulation-not-yet',
    rite: 'tribulation',
    riteState: 'postFailure',
    riteTag: '渡劫',
    riteName: 'Heavenly Tribulation · Core Formation',
    stakes: {
      risked: ['The trial is not passed — but nothing earned is undone'],
      gained: ['Core Formation on success'],
      guaranteed: ['Pity rises; the trial bends toward a guaranteed pass'],
    },
    neverRegress: NEVER_REGRESS,
    outcome: {
      kind: 'not-yet', eyebrow: 'Not yet', title: 'The trial stands unbroken', titleCjk: '尚未',
      body: 'The tribulation was not passed. Your realm and every earned stage remain wholly untouched — the heavens will test you again when you return readier.',
      pityGained: 'Pity +1 (2/6 toward a guaranteed pass)', pityPercent: 33,
    },
    skipIntent: 'ritual.skip',
    exitIntent: 'ritual.acknowledge',
    confirmIntent: 'tribulation.retry',
    honestOdds: { label: 'Trial odds', value: '52% — not yet' },
  }),
  'echo-decree': () => ({
    schemaVersion: RITUAL_FRAME_SCHEMA_VERSION,
    visualState: 'echo-decree',
    rite: 'echo',
    riteState: 'default',
    riteTag: '印',
    riteName: 'Karmic Echo · A Mark Is Left',
    stakes: {
      risked: ['Nothing — a decree is acknowledged, not gambled'],
      gained: ['A lasting karmic mark and its effect'],
      guaranteed: ['The mark persists across this life'],
    },
    neverRegress: NEVER_REGRESS,
    outcome: {
      kind: 'success', eyebrow: 'A karmic decree', title: 'The Unflinching', titleCjk: '天命',
      body: 'Because a road was refused in a life now past, the heavens grant a mark: +5% Tribulation Resist while below half HP. Acknowledged, it endures across the wheel.',
    },
    skipIntent: 'ritual.skip',
    exitIntent: 'ritual.acknowledge',
    confirmIntent: 'echo.acknowledge',
  }),
  'life-summary': () => ({
    schemaVersion: RITUAL_FRAME_SCHEMA_VERSION,
    visualState: 'life-summary',
    rite: 'lifeSummary',
    riteState: 'prestige',
    riteTag: '輪迴',
    riteName: 'Reincarnation · The Life Recounted',
    stakes: {
      risked: ['Per-life growth resets — as it always has, by design'],
      gained: ['Ascension Points from this life’s deeds', 'A new life begun'],
      guaranteed: ['Spirit roots, Form-Memory, and prestige carry across — earned as a soul persists'],
    },
    neverRegress: NEVER_REGRESS,
    summary: {
      deeds: [
        'Reached Spirit Severing · Stage 6',
        'Bonded the Cinderfang Sabre to Level 4',
        'Completed the Unmoving Mountain set',
        'Crossed 3 tribulations · refused none',
      ],
      ap: '+148 AP',
      pathPrompt: 'Re-choose your road — Heaven · Earth · Martial (free each life)',
    },
    outcome: { kind: 'success', eyebrow: 'The wheel turns', title: 'A life remembered', titleCjk: '輪迴' },
    skipIntent: 'ritual.skip',
    exitIntent: 'ritual.continue',
    confirmIntent: 'reincarnation.begin',
  }),
  'root-upgrade': () => ({
    schemaVersion: RITUAL_FRAME_SCHEMA_VERSION,
    visualState: 'root-upgrade',
    rite: 'rootUpgrade',
    riteState: 'default',
    riteTag: '洗髓',
    riteName: 'Marrow-Cleansing · Spirit Root Refinement',
    stakes: {
      risked: ['Nothing — the refinement is deterministic, no failure branch'],
      gained: ['Spirit root purity raised, before → after'],
      guaranteed: ['The new purity is fixed and final'],
    },
    neverRegress: NEVER_REGRESS,
    scene: { rootFromGrade: 2, rootToGrade: 4 },
    outcome: {
      kind: 'success', eyebrow: 'Marrow cleansed', title: 'The root refined', titleCjk: '洗髓 · 升品',
      body: 'The Heavenward Spirit Stone is spent. Your spirit root rises from Earth-grade (地) to Heaven-grade (天) — its aptitude and affinity deepen, for every life that follows.',
    },
    skipIntent: 'ritual.skip',
    exitIntent: 'ritual.continue',
    confirmIntent: 'rootUpgrade.begin',
  }),
  'ritual-skipped': () => ({
    schemaVersion: RITUAL_FRAME_SCHEMA_VERSION,
    visualState: 'ritual-skipped',
    // Matches the artifact's skipped panel: any rite fast-forwards to its outcome — shown via breakthrough.
    rite: 'breakthrough',
    riteState: 'default',
    riteTag: '闖關',
    riteName: 'Breakthrough · skipped to result',
    stakes: {
      risked: ['A failed gate costs nothing earned — only the attempt itself'],
      gained: ['Advance to Foundation Establishment · Stage 4 — the next tier of everything opens'],
      guaranteed: ['No cultivation base is lost; pity toward a guaranteed crossing accumulates with every attempt'],
    },
    neverRegress: NEVER_REGRESS,
    scene: { breakthroughStage: 4 },
    outcome: {
      kind: 'success', eyebrow: 'Skipped · result shown', title: 'Foundation Establishment', titleCjk: '築基 · 第四重',
      body: 'The ceremony was fast-forwarded straight to its outcome. The result is identical — the rite is theatre you may always skip; the crossing is the truth beneath it.',
    },
    skipIntent: 'ritual.skip',
    exitIntent: 'ritual.continue',
    confirmIntent: 'breakthrough.begin',
    honestOdds: { label: 'Readiness', value: '78% — favourable' },
    skipped: true,
  }),
};

export function buildRitualFrameSurface(seedId: string): RitualModalSurfaceV1 {
  const builder = SEED_BUILDERS[seedId as RitualFrameFixtureSeedId];
  if (!builder) {
    throw new Error(`[ritualFrameFixtures] unknown seed id: ${seedId}`);
  }
  return builder();
}
