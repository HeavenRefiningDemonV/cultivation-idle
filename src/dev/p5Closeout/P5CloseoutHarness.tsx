import type { CombatAftermathSurfaceV1 } from '../../features/combatAftermath/types.js';
import { CombatAftermathCard } from '../../features/combatAftermath/CombatAftermathCard.js';
import '../../features/combatAftermath/CombatAftermathCard.scss';
import type { DaoImpressionSurfaceV1 } from '../../systems/daoImpressions/types.js';
import type { FailureReflectionSurfaceV1 } from '../../systems/failureReflection/types.js';
import { DaoImpressionSeal } from '../../ui/daoImpressions/DaoImpressionSeal.js';
import './P5CloseoutHarness.scss';

export type P5CloseoutFixtureId =
  | 'dao-gate-clear'
  | 'dao-close-defeat'
  | 'inner-demon-repeated-underprepared'
  | 'heart-law-recent-dao-seals'
  | 'life-summary-p5-memory'
  | 'city-recognition-notice'
  | 'tribulation-disabled';

const FIXTURE_IDS = new Set<P5CloseoutFixtureId>([
  'dao-gate-clear',
  'dao-close-defeat',
  'inner-demon-repeated-underprepared',
  'heart-law-recent-dao-seals',
  'life-summary-p5-memory',
  'city-recognition-notice',
  'tribulation-disabled',
]);

export function getP5CloseoutFixtureId(): P5CloseoutFixtureId | null {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return null;
  const raw = new URLSearchParams(window.location.search).get('p5Fixture');
  return raw && FIXTURE_IDS.has(raw as P5CloseoutFixtureId) ? (raw as P5CloseoutFixtureId) : null;
}

function daoSeal(args: {
  awardId: string;
  title: string;
  sourceLabel: string;
  comprehensionLine: string;
  targetLine: string;
  rarityBand: DaoImpressionSurfaceV1['rarityBand'];
  sealTone: DaoImpressionSurfaceV1['sealTone'];
}): DaoImpressionSurfaceV1 {
  return {
    version: 1,
    awardId: args.awardId,
    title: args.title,
    sourceLabel: args.sourceLabel,
    doctrineLine: 'trial doctrine pattern',
    comprehensionLine: args.comprehensionLine,
    targetLine: args.targetLine,
    rarityBand: args.rarityBand,
    sealTone: args.sealTone,
    memoryEligible: true,
    routeLabel: 'Review Dao Heart',
    debugNotes: ['P5 closeout deterministic fixture surface.'],
  };
}

const thresholdSeal = daoSeal({
  awardId: 'fixture-threshold-revelation',
  title: 'Threshold Revelation',
  sourceLabel: 'Gate Trial clear',
  comprehensionLine: '+15 Comprehension',
  targetLine: 'Applied to quiet breath.',
  rarityBand: 'threshold',
  sealTone: 'gold',
});

const closeDefeatSeal = daoSeal({
  awardId: 'fixture-gate-guardian-pattern',
  title: 'Gate Guardian Pattern',
  sourceLabel: 'Close Gate Trial defeat',
  comprehensionLine: '+6 Comprehension',
  targetLine: 'Applied to quiet breath.',
  rarityBand: 'faint',
  sealTone: 'shadow',
});

const innerDemonSurface: FailureReflectionSurfaceV1 = {
  version: 1,
  reflectionId: 'fixture-inner-demon-underprepared',
  title: 'Inner Demon Reflection',
  innerDemonLine: 'The same medicine posture has collapsed at this gate twice.',
  diagnosisLine: 'Repeated underprepared attempts at Foundation Gate.',
  correctiveRouteLabel: 'Apothecary Healing Prep',
  correctiveRouteReason: 'Stock Healing Floor before returning to the gate.',
  repeatedCountLine: 'Pattern repeated twice.',
  tone: 'warning',
  resolved: false,
  memoryEligible: true,
  routeTarget: 'apothecary',
  debugNotes: ['P5 fixture reflection is static and does not mutate trial state.'],
};

function aftermathSurface(args: {
  id: string;
  title: string;
  subtitle: string;
  memoryLine: string;
  rareSignLabel: string;
  rareSignValue: string;
  rareSignDetail: string;
  doctrineDelta?: string;
  failureReflection?: FailureReflectionSurfaceV1 | null;
}): CombatAftermathSurfaceV1 {
  return {
    version: 1,
    id: args.id,
    createdAt: 1_805_600_000_000,
    context: {
      kind: 'gate_trial',
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      gateLabel: 'Foundation Gate',
    },
    outcome: {
      kind: args.failureReflection ? 'defeat' : 'cleared',
      title: args.title,
      subtitle: args.subtitle,
      tone: args.failureReflection ? 'warning' : 'ceremonial',
      victoryGrade: args.failureReflection ? 'strained' : 'breakthrough_worthy',
      gradeLabel: args.failureReflection ? 'Close Defeat' : 'Gate Clear',
      gradeReason: args.rareSignDetail,
    },
    spoilsGroups: [
      {
        id: 'rare_signs',
        title: 'Rare Signs',
        summary: 'A spiritual trace was recorded.',
        tone: 'ceremonial',
        empty: false,
        lines: [
          {
            id: 'p5-dao-impression',
            label: args.rareSignLabel,
            value: args.rareSignValue,
            detail: args.rareSignDetail,
            source: 'derived',
          },
        ],
      },
    ],
    readinessDelta: null,
    economyDelta: null,
    doctrineDelta: args.doctrineDelta
      ? {
          title: 'Doctrine',
          deltaLabel: args.doctrineDelta,
          explanation: 'Comprehension moved through the RewardService bridge.',
          confidence: 'exact',
        }
      : null,
    diagnosis: args.failureReflection
      ? {
          code: 'underprepared',
          label: 'Underprepared',
          explanation: 'Medicine prep is the top corrective route.',
          topFixLabel: 'Apothecary Healing Prep',
          topFixRoute: null,
          confidence: 'exact',
        }
      : null,
    failureReflection: args.failureReflection ?? null,
    memoryLine: args.memoryLine,
    primaryRoute: null,
    secondaryRoutes: [],
    sourceEventIds: ['fixture-p5-closeout'],
    recentDeltaIds: ['fixture-p5-delta'],
    debugNotes: ['Dev-only P5 closeout fixture.'],
  };
}

function FixtureHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="p5CloseoutHarness__header">
      <p className="p5CloseoutHarness__eyebrow">P5 Closeout Browser Fixture</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}

function DaoGateClearFixture() {
  return (
    <>
      <FixtureHeader
        title="Gate Clear Dao Impression"
        subtitle="Threshold Revelation appears in aftermath and recent Dao seals."
      />
      <div className="p5CloseoutHarness__grid">
        <CombatAftermathCard
          surface={aftermathSurface({
            id: 'fixture-dao-gate-clear',
            title: 'Foundation Gate Opened',
            subtitle: 'The opened gate leaves a clean line in the Dao Heart.',
            memoryLine: 'Threshold Revelation deepened the Dao Heart after a Gate Trial clear.',
            rareSignLabel: 'Threshold Revelation',
            rareSignValue: '+15 Comprehension',
            rareSignDetail: 'The gate pattern is now etched into your breath.',
            doctrineDelta: '+15 Comprehension',
          })}
        />
        <section className="p5CloseoutHarness__panel" aria-label="Recent Dao Impression seal">
          <h2>Dao Heart Trace</h2>
          <DaoImpressionSeal surface={thresholdSeal} />
        </section>
      </div>
    </>
  );
}

function CloseDefeatFixture() {
  return (
    <>
      <FixtureHeader
        title="Close Defeat Dao Impression"
        subtitle="Gate Guardian Pattern appears without repeating on every defeat."
      />
      <CombatAftermathCard
        surface={aftermathSurface({
          id: 'fixture-close-defeat',
          title: 'Foundation Gate Close Defeat',
          subtitle: "The guardian's rhythm lingers in your breath.",
          memoryLine: 'A close defeat named one pressure pattern.',
          rareSignLabel: 'Gate Guardian Pattern',
          rareSignValue: '+6 Comprehension',
          rareSignDetail: 'Close-defeat impressions are cooldowned and capped by current life.',
          doctrineDelta: '+6 Comprehension',
        })}
      />
    </>
  );
}

function InnerDemonFixture() {
  return (
    <>
      <FixtureHeader
        title="Repeated Failure Inner Demon"
        subtitle="The gate names one corrective route without changing combat outcome."
      />
      <div className="p5CloseoutHarness__grid">
        <section className="p5CloseoutHarness__panel p5CloseoutHarness__panel--warning">
          <h2>Foundation Gate</h2>
          <p>{innerDemonSurface.innerDemonLine}</p>
          <strong>{innerDemonSurface.correctiveRouteLabel}</strong>
          <small>{innerDemonSurface.correctiveRouteReason}</small>
        </section>
        <CombatAftermathCard
          surface={aftermathSurface({
            id: 'fixture-inner-demon',
            title: 'Gate Pattern Repeated',
            subtitle: 'The same diagnosis has become an inner knot.',
            memoryLine: 'Inner Demon Reflection routes the correction through Apothecary prep.',
            rareSignLabel: 'Inner Demon',
            rareSignValue: 'Underprepared loop',
            rareSignDetail: 'The demon is the repeated pattern this gate keeps revealing.',
            failureReflection: innerDemonSurface,
          })}
        />
      </div>
    </>
  );
}

function HeartLawSealsFixture() {
  return (
    <>
      <FixtureHeader
        title="Heart Law Recent Dao Seals"
        subtitle="Recent P5 traces stay compact near Dao Heart progress."
      />
      <section className="p5CloseoutHarness__panel">
        <h2>Recent Dao Impressions</h2>
        <div className="p5CloseoutHarness__seals">
          <DaoImpressionSeal surface={thresholdSeal} />
          <DaoImpressionSeal surface={closeDefeatSeal} />
        </div>
      </section>
    </>
  );
}

function LifeSummaryFixture() {
  return (
    <>
      <FixtureHeader
        title="Life Summary P5 Memory"
        subtitle="Meaningful P5 traces are summarized without minor-event spam."
      />
      <section className="p5CloseoutHarness__panel">
        <h2>Doctrine and Build Memory</h2>
        <ul className="p5CloseoutHarness__memoryList">
          <li>Threshold Revelation deepened the Dao Heart after a Gate Trial clear.</li>
          <li>Resolved Inner Demon: underprepared attempts corrected through Apothecary prep.</li>
        </ul>
      </section>
    </>
  );
}

function CityRecognitionFixture() {
  return (
    <>
      <FixtureHeader
        title="City Recognition Stub"
        subtitle="P5 closeout classifies City Recognition as notice-only and not a live benefit system."
      />
      <section className="p5CloseoutHarness__panel">
        <h2>Pinewind Hamlet Standing</h2>
        <p>Recognized challenger at the Foundation Gate.</p>
        <strong>Future notice only: no discount, stock unlock, NPC rank, or reputation currency is live.</strong>
      </section>
    </>
  );
}

function TribulationDisabledFixture() {
  return (
    <>
      <FixtureHeader
        title="Tribulation Pressure Disabled"
        subtitle="Default runtime shows no tribulation wall or random breakthrough failure."
      />
      <section className="p5CloseoutHarness__panel">
        <h2>Breakthrough Ritual</h2>
        <p>The ritual preview remains calm in the default build.</p>
        <strong>No Tribulation Pressure card is rendered while the feature flag is off.</strong>
      </section>
    </>
  );
}

export function P5CloseoutHarness({ fixture }: { fixture: P5CloseoutFixtureId }) {
  return (
    <main className="p5CloseoutHarness" data-testid="p5-closeout-harness" data-fixture={fixture}>
      {fixture === 'dao-gate-clear' ? <DaoGateClearFixture /> : null}
      {fixture === 'dao-close-defeat' ? <CloseDefeatFixture /> : null}
      {fixture === 'inner-demon-repeated-underprepared' ? <InnerDemonFixture /> : null}
      {fixture === 'heart-law-recent-dao-seals' ? <HeartLawSealsFixture /> : null}
      {fixture === 'life-summary-p5-memory' ? <LifeSummaryFixture /> : null}
      {fixture === 'city-recognition-notice' ? <CityRecognitionFixture /> : null}
      {fixture === 'tribulation-disabled' ? <TribulationDisabledFixture /> : null}
    </main>
  );
}
