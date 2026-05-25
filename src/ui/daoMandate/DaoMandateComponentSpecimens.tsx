import type { DaoLocalLensSurface } from '../../systems/ui/daoMandate/index.js';
import { createDaoMandateFixture } from '../../systems/ui/daoMandate/index.js';
import { BackgroundSupportStrip } from './BackgroundSupportStrip.js';
import { JadeSlipHelp } from './JadeSlipHelp.js';
import { LocalMandateLensHeader } from './LocalMandateLensHeader.js';
import { MandateChamberHero } from './MandateChamberHero.js';
import { MandateSeal } from './MandateSeal.js';
import { ReadinessLedger } from './ReadinessLedger.js';
import { RecentOmensFeed } from './RecentOmensFeed.js';
import { ReincarnationCounsel } from './ReincarnationCounsel.js';
import { RequirementLedger } from './RequirementLedger.js';
import { SafetyNetPlaque } from './SafetyNetPlaque.js';
import { SourceRouteSlip } from './SourceRouteSlip.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import './DaoMandateComponentSpecimens.scss';

const PROFILES = ['sealed', 'elder', 'jade'] as const;

export function DaoMandateComponentSpecimens() {
  const routeAction: DaoMandateRouteActionHandler = () => undefined;
  const attemptableGate = createDaoMandateFixture('attemptable_gate', 'jade');
  const gateFailed = createDaoMandateFixture('gate_failed', 'jade');
  const cultivating = createDaoMandateFixture('cultivating_qi_short', 'jade');
  const contentCap = createDaoMandateFixture('content_cap_prestige_recommended', 'jade');
  const lensExamples: DaoLocalLensSurface[] = [
    {
      screenId: 'apothecary',
      relation: 'primary-evidence',
      label: 'Reserve evidence',
      detail: 'Medicine preparation is part of the current omen evidence.',
      route: cultivating.secondaryRoutes[0] ?? cultivating.primaryRoute,
      evidenceIds: ['fixture.local.primary'],
    },
    {
      screenId: 'forge',
      relation: 'supporting-source',
      label: 'Forge support',
      detail: 'The module improves readiness without replacing the proof owner.',
      route: null,
      evidenceIds: ['fixture.local.support'],
    },
    {
      screenId: 'records',
      relation: 'completed',
      label: 'Proof sealed',
      detail: 'The relevant record is settled for now.',
      route: null,
      evidenceIds: ['fixture.local.completed'],
    },
  ];

  return (
    <div className="daoMandateComponentSpecimens daoMandateScope">
      <header className="daoMandateComponentSpecimens__header">
        <span>Dao Mandate UI specimens</span>
        <h2>Shared Mandate component board</h2>
        <p>Fixture-only board for staged imports and visual smoke. It is excluded from production navigation.</p>
      </header>

      <section className="daoMandateComponentSpecimens__section" aria-label="Mandate Seal profiles">
        <h3>MandateSeal Profiles</h3>
        <div className="daoMandateComponentSpecimens__grid">
          {PROFILES.map((profile) => (
            <MandateSeal
              key={profile}
              surface={createDaoMandateFixture('attemptable_gate', profile)}
              profile={profile}
              variant={profile === 'sealed' ? 'compact' : 'default'}
              onRouteAction={routeAction}
            />
          ))}
        </div>
      </section>

      <section className="daoMandateComponentSpecimens__section" aria-label="Mandate Chamber Hero">
        <h3>MandateChamberHero</h3>
        <MandateChamberHero surface={gateFailed} onRouteAction={routeAction} />
      </section>

      <section className="daoMandateComponentSpecimens__section" aria-label="Ledgers and slips">
        <h3>Ledgers and Source Slips</h3>
        <div className="daoMandateComponentSpecimens__grid daoMandateComponentSpecimens__grid--two">
          <RequirementLedger
            ledger={gateFailed.requirementLedger}
            profile="jade"
            onRouteAction={routeAction}
          />
          <ReadinessLedger
            readiness={attemptableGate.readiness}
            profile="jade"
            variant="detailed"
            onRouteAction={routeAction}
          />
          <SourceRouteSlip
            entries={cultivating.sourceMap}
            profile="jade"
            variant="expanded"
            onRouteAction={routeAction}
          />
          <SafetyNetPlaque
            safetyNet={gateFailed.safetyNet}
            profile="jade"
            variant="emphasis"
            onRouteAction={routeAction}
          />
        </div>
      </section>

      <section className="daoMandateComponentSpecimens__section" aria-label="Support and local surfaces">
        <h3>Support Surfaces</h3>
        <div className="daoMandateComponentSpecimens__stack">
          <RecentOmensFeed omens={gateFailed.recentOmens} variant="full" />
          {gateFailed.lessonSlips[0] ? (
            <JadeSlipHelp slip={gateFailed.lessonSlips[0]} onRouteAction={routeAction} />
          ) : null}
          {lensExamples.map((lens) => (
            <LocalMandateLensHeader
              key={`${lens.screenId}-${lens.relation}`}
              lens={lens}
              profile="jade"
              variant="full"
              onRouteAction={routeAction}
            />
          ))}
          <BackgroundSupportStrip
            backgroundPlan={cultivating.backgroundPlan}
            profile="jade"
            variant="full"
            onRouteAction={routeAction}
          />
          <ReincarnationCounsel
            counsel={contentCap.prestige}
            profile="jade"
            variant="full"
            onRouteAction={routeAction}
          />
        </div>
      </section>

      <section className="daoMandateComponentSpecimens__section" aria-label="Reduced motion surface">
        <h3>Reduced Motion Variant</h3>
        <MandateSeal
          surface={gateFailed}
          profile="elder"
          motionMode="reduced"
          onRouteAction={routeAction}
        />
      </section>
    </div>
  );
}
