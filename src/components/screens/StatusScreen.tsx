import { useCallback, type ReactNode } from 'react';
import {
  Compass,
  Flame,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import { useUIStore, type GameTab } from '../../stores/uiStore.js';
import { openWorldModule } from '../../systems/world/openWorldModule.js';
import {
  performDaoMandateRouteAction,
  type DaoBackgroundPlanSurface,
  type DaoMandateRoute,
} from '../../systems/ui/daoMandate/index.js';
import type {
  StatusActionSurface,
  StatusDashboardSurfaceV1,
  StatusFactRow,
  StatusRouteTarget,
  StatusTone,
} from '../../systems/ui/status/statusDashboardSurface.js';
import {
  BackgroundSupportStrip,
  JadeSlipHelp,
  MandateChamberHero,
  ReadinessLedger,
  RecentOmensFeed,
  ReincarnationCounsel,
  RequirementLedger,
  SafetyNetPlaque,
  SourceRouteSlip,
} from '../../ui/daoMandate/index.js';
import { GameIcon, ICONS, type IconId } from '../../ui/icons/index.js';
import { getStatusDashboardActionState } from '../../ui/status/statusDashboardModel.js';
import { useStatusDashboardSurface } from '../../ui/status/useStatusDashboardSurface.js';
import { getShellTabLabel, getWorldModuleLabel } from '../../ui/text/playerFacingLabels.js';
import './StatusScreen.scss';

type DashboardPanelProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

type WorkRow = StatusFactRow & {
  action: StatusActionSurface | null;
};

function DashboardPanel({ title, icon, children, className = '', ariaLabel }: DashboardPanelProps) {
  return (
    <section className={`statusDashboardPanel ${className}`.trim()} aria-label={ariaLabel ?? title}>
      <div className="statusDashboardPanel__heading">
        <span className="statusDashboardPanel__icon" aria-hidden>{icon}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function destinationLabelForTarget(target: StatusRouteTarget): string {
  if (target.kind === 'tab') return getShellTabLabel(target.tab);
  if (target.kind === 'world_module') return getWorldModuleLabel(target.moduleKey);
  return 'Unavailable';
}

function performStatusDashboardAction(action: StatusActionSurface, setActiveTab: (tab: GameTab) => void): void {
  if (action.disabled || action.target.kind === 'none') return;

  if (action.target.kind === 'tab') {
    setActiveTab(action.target.tab);
    return;
  }

  openWorldModule({
    cityId: action.target.cityId,
    moduleKey: action.target.moduleKey,
    source: 'status-dashboard',
  });
}

function actionFromTarget(args: {
  id: string;
  label: string;
  detail: string;
  target: StatusRouteTarget | null;
  tone?: StatusTone;
}): StatusActionSurface | null {
  if (!args.target) return null;
  const disabled = args.target.kind === 'none';
  return {
    id: args.id,
    label: args.label,
    detail: args.detail,
    destinationLabel: destinationLabelForTarget(args.target),
    target: args.target,
    disabled,
    disabledReason: disabled ? args.target.reason : null,
    tone: args.tone ?? 'info',
    source: 'activity',
  };
}

function RouteButton({
  action,
  label,
  disabledLabel,
  className = '',
  onAction,
}: {
  action: StatusActionSurface | null | undefined;
  label?: string;
  disabledLabel?: string;
  className?: string;
  onAction?: (action: StatusActionSurface) => void;
}) {
  if (!action) {
    return (
      <button type="button" className={`statusDashboardButton statusDashboardButton--settled ${className}`.trim()} disabled>
        {disabledLabel ?? label ?? 'View'}
      </button>
    );
  }

  const state = getStatusDashboardActionState(action);
  const buttonLabel = state.disabled ? disabledLabel ?? state.label : label ?? state.label;

  return (
    <button
      type="button"
      className={`statusDashboardButton statusDashboardButton--${state.tone} ${className}`.trim()}
      onClick={() => {
        if (!state.disabled) {
          onAction?.(action);
        }
      }}
      disabled={state.disabled}
      title={action.disabledReason ?? action.detail}
    >
      {buttonLabel}
    </button>
  );
}

function SurfaceIcon({ icon, size = 22 }: { icon: IconId; size?: number }) {
  const safeIcon: IconId = Object.hasOwn(ICONS, icon) ? icon : 'inkWarning';
  return <GameIcon icon={safeIcon} size={size} />;
}

function DetailLine({ row, urgent }: { row: Pick<StatusFactRow, 'label' | 'value' | 'detail' | 'tone'>; urgent?: boolean }) {
  const isUrgent = urgent ?? (row.tone === 'danger' || row.tone === 'warning');
  return (
    <div className={`statusDashboardDetailLine ${isUrgent ? 'statusDashboardDetailLine--urgent' : ''}`}>
      <span>{row.label}</span>
      <strong>{row.value ?? row.detail}</strong>
    </div>
  );
}

function StatusChip({ row }: { row: StatusFactRow }) {
  return (
    <div className={`statusDashboardChip statusDashboardChip--${row.tone}`}>
      <span className="statusDashboardChip__icon" aria-hidden>
        <SurfaceIcon icon={row.icon} size={20} />
      </span>
      <span className="statusDashboardChip__label">{row.label}</span>
      <strong>{row.value ?? row.detail}</strong>
    </div>
  );
}

function buildCurrentWorkRows(surface: StatusDashboardSurfaceV1): WorkRow[] {
  const foreground = surface.currentWork.foregroundActivity;
  const rows: WorkRow[] = [
    {
      id: 'foreground-activity',
      label: foreground.label,
      value: 'Foreground',
      detail: foreground.detail,
      tone: foreground.tone,
      icon: foreground.icon,
      source: 'activityStore',
      action: actionFromTarget({
        id: 'open-current-work',
        label: 'Open current work',
        detail: foreground.detail,
        target: foreground.target,
        tone: foreground.tone,
      }),
    },
  ];

  if (surface.currentWork.activeCombat) {
    rows.push({
      ...surface.currentWork.activeCombat,
      action: actionFromTarget({
        id: 'open-active-combat',
        label: 'Open combat',
        detail: surface.currentWork.activeCombat.detail,
        target: foreground.target,
        tone: surface.currentWork.activeCombat.tone,
      }),
    });
  }

  if (surface.currentWork.trackedBounty) {
    rows.push({
      ...surface.currentWork.trackedBounty,
      action: actionFromTarget({
        id: 'open-bounty',
        label: 'Open World',
        detail: surface.currentWork.trackedBounty.detail,
        target: { kind: 'tab', tab: 'adventure' },
        tone: surface.currentWork.trackedBounty.tone,
      }),
    });
  }

  if (surface.currentWork.expeditions) {
    rows.push({
      ...surface.currentWork.expeditions,
      action: actionFromTarget({
        id: 'open-expeditions',
        label: 'Open World',
        detail: surface.currentWork.expeditions.detail,
        target: { kind: 'tab', tab: 'adventure' },
        tone: surface.currentWork.expeditions.tone,
      }),
    });
  }

  surface.currentWork.queues.slice(0, 2).forEach((row) => {
    rows.push({
      ...row,
      action: actionFromTarget({
        id: `open-${row.id}`,
        label: 'Open World',
        detail: row.detail,
        target: { kind: 'tab', tab: 'adventure' },
        tone: row.tone,
      }),
    });
  });

  return rows.slice(0, 5);
}

function hasMeaningfulBackgroundSupport(backgroundPlan: DaoBackgroundPlanSurface): boolean {
  return backgroundPlan.routes.length > 0 ||
    (backgroundPlan.idleSlotCount ?? 0) > 0 ||
    Boolean(backgroundPlan.offlineProjectionLabel);
}

export function StatusScreen() {
  const surface = useStatusDashboardSurface();
  const addNotification = useUIStore((state) => state.addNotification);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const dismissDaoMandateLesson = useUIStore((state) => state.dismissDaoMandateLesson);
  const markDaoMandateLessonLearned = useUIStore((state) => state.markDaoMandateLessonLearned);
  const currentWorkRows = buildCurrentWorkRows(surface);
  const elementKey = surface.identity.spiritRootTone;
  const mandate = surface.mandate.visible;
  const profile = surface.mandate.profile;
  const motionMode = surface.mandate.motionMode;
  const showBackgroundSupport = hasMeaningfulBackgroundSupport(mandate.backgroundPlan);

  const handleMandateRoute = useCallback((route: DaoMandateRoute) => {
    const result = performDaoMandateRouteAction(route);
    if (!result.performed && result.reason) {
      addNotification('warning', result.reason, {
        source: 'dao-mandate-status',
        dedupeKey: `dao-mandate-status-route-${route.id}`,
      });
    }
  }, [addNotification]);

  const handleJadeSlipDismiss = useCallback((slipId: string) => {
    const slip = mandate.lessonSlips.find((entry) => entry.id === slipId);
    if (slip) dismissDaoMandateLesson(slip);
  }, [dismissDaoMandateLesson, mandate.lessonSlips]);

  const handleJadeSlipLearned = useCallback((slipId: string) => {
    const slip = mandate.lessonSlips.find((entry) => entry.id === slipId);
    if (slip) markDaoMandateLessonLearned(slip);
  }, [mandate.lessonSlips, markDaoMandateLessonLearned]);

  const handleSupportingStatusAction = useCallback((action: StatusActionSurface) => {
    performStatusDashboardAction(action, setActiveTab);
  }, [setActiveTab]);

  return (
    <div className="statusDashboardRoot" data-testid={surface.meta.rootTestId}>
      <div className="statusDashboardCanvas">
        <section className="statusMandateChamber" aria-label="Mandate Chamber Primary Route">
          <MandateChamberHero
            surface={mandate}
            motionMode={motionMode}
            onRouteAction={handleMandateRoute}
            className="statusMandateChamber__hero"
          />
        </section>

        <section className="statusDashboardMetricStrip" aria-label="Core status metrics">
          {surface.metrics.map((metric) => (
            <div key={metric.id} className={`statusDashboardMetric statusDashboardMetric--${metric.tone}`}>
              <span className="statusDashboardMetric__icon" aria-hidden>
                <SurfaceIcon icon={metric.icon} size={25} />
              </span>
              <span className="statusDashboardMetric__label">{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </section>

        <main className="statusMandateChamber__grid">
          <div className="statusMandateChamber__primaryColumn">
            <RequirementLedger
              ledger={mandate.requirementLedger}
              title="Mandate Ledger"
              subtitle={mandate.obstruction.detail}
              profile={profile}
              variant={profile === 'sealed' ? 'compact' : 'default'}
              motionMode={motionMode}
              onRouteAction={handleMandateRoute}
            />

            <ReadinessLedger
              readiness={mandate.readiness}
              title="Gate Proof Readiness"
              profile={profile}
              variant={profile === 'jade' ? 'detailed' : 'summary'}
              motionMode={motionMode}
              onRouteAction={handleMandateRoute}
            />

            {mandate.sourceMap.length > 0 ? (
              <SourceRouteSlip
                entries={mandate.sourceMap}
                title="Source Route"
                profile={profile}
                variant={profile === 'jade' ? 'expanded' : 'compact'}
                motionMode={motionMode}
                onRouteAction={handleMandateRoute}
              />
            ) : null}
          </div>

          <div className="statusMandateChamber__sideColumn">
            {showBackgroundSupport ? (
              <BackgroundSupportStrip
                backgroundPlan={mandate.backgroundPlan}
                profile={profile}
                variant={profile === 'jade' ? 'full' : 'compact'}
                motionMode={motionMode}
                onRouteAction={handleMandateRoute}
              />
            ) : null}

            <SafetyNetPlaque
              safetyNet={mandate.safetyNet}
              profile={profile}
              variant={profile === 'jade' ? 'default' : 'compact'}
              motionMode={motionMode}
              onRouteAction={handleMandateRoute}
            />

            <ReincarnationCounsel
              counsel={mandate.prestige}
              profile={profile}
              variant={profile === 'jade' ? 'full' : 'compact'}
              motionMode={motionMode}
              onRouteAction={handleMandateRoute}
            />

            <RecentOmensFeed
              omens={mandate.recentOmens}
              title="Recent Omens"
              variant={profile === 'jade' ? 'full' : 'compact'}
              motionMode={motionMode}
            />

            {mandate.lessonSlips.map((slip) => (
              <JadeSlipHelp
                key={slip.id}
                slip={slip}
                variant={profile === 'jade' ? 'card' : 'compact'}
                motionMode={motionMode}
                onRouteAction={handleMandateRoute}
                onDismiss={handleJadeSlipDismiss}
                onLearned={handleJadeSlipLearned}
              />
            ))}
          </div>

          <div className="statusMandateChamber__legacyEvidence">
            <DashboardPanel title="Cultivator Identity" icon={<Compass />} className="statusDashboardPanel--identity">
              <div className="statusDashboardIdentityTop">
                <div className="statusDashboardSpiritCrest" data-element={elementKey} aria-hidden>
                  <Flame />
                </div>
                <div className="statusDashboardSpiritText">
                  <div className="statusDashboardMeta">Spirit Root Crest</div>
                  <h3>{surface.identity.spiritRootElement}</h3>
                  <p>Element</p>
                </div>
                {surface.identity.rows.slice(2, 4).map((row) => (
                  <div key={row.id} className="statusDashboardIdentityStat">
                    <span>{row.label}</span>
                    <strong>{row.value ?? row.detail}</strong>
                    <small>{row.detail}</small>
                  </div>
                ))}
              </div>
              <div className="statusDashboardIdentityDetails">
                {surface.identity.rows.map((row) => (
                  <DetailLine key={row.id} row={row} urgent={false} />
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Current Work" icon={<PackageCheck />} className="statusDashboardPanel--overview">
              <div className="statusDashboardStatusChips">
                <StatusChip
                  row={{
                    id: 'work-state-chip',
                    label: 'State',
                    value: surface.currentWork.foregroundActivity.label,
                    detail: surface.currentWork.foregroundActivity.detail,
                    tone: surface.currentWork.foregroundActivity.tone,
                    icon: surface.currentWork.foregroundActivity.icon,
                    source: 'activityStore',
                  }}
                />
                <StatusChip
                  row={{
                    id: 'combat-chip',
                    label: 'Combat',
                    value: surface.currentWork.activeCombat?.value ?? 'Idle',
                    detail: surface.currentWork.activeCombat?.detail ?? 'No live combat is running.',
                    tone: surface.currentWork.activeCombat?.tone ?? 'muted',
                    icon: surface.currentWork.activeCombat?.icon ?? 'hourglassEmpty',
                    source: 'combatStore',
                  }}
                />
                <StatusChip
                  row={{
                    id: 'bounty-chip',
                    label: 'Bounty',
                    value: surface.currentWork.trackedBounty?.value ?? 'None tracked',
                    detail: surface.currentWork.trackedBounty?.detail ?? 'No tracked bounty for the current city.',
                    tone: surface.currentWork.trackedBounty?.tone ?? 'muted',
                    icon: surface.currentWork.trackedBounty?.icon ?? 'recordSlip',
                    source: 'bountyStore',
                  }}
                />
                <StatusChip
                  row={{
                    id: 'expedition-chip',
                    label: 'Expeditions',
                    value: surface.currentWork.expeditions?.value ?? 'Unavailable',
                    detail: surface.currentWork.expeditions?.detail ?? 'No expedition slots are unlocked yet.',
                    tone: surface.currentWork.expeditions?.tone ?? 'muted',
                    icon: surface.currentWork.expeditions?.icon ?? 'hourglassEmpty',
                    source: 'expeditionStore',
                  }}
                />
              </div>
              <div className="statusDashboardIssueList">
                {currentWorkRows.map((row) => (
                  <article key={row.id} className={`statusDashboardIssue statusDashboardIssue--${row.tone}`}>
                    <span className="statusDashboardIssue__icon" aria-hidden>
                      <SurfaceIcon icon={row.icon} size={20} />
                    </span>
                    <div>
                      <span>{row.label}</span>
                      <p>{row.value ? `${row.value}: ${row.detail}` : row.detail}</p>
                    </div>
                    <RouteButton
                      action={row.action}
                      label="View"
                      disabledLabel="View"
                      onAction={handleSupportingStatusAction}
                    />
                  </article>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Preparation Context" icon={<ShieldCheck />} className="statusDashboardPanel--preparation">
              <div className="statusDashboardPreparationBlock">
                {surface.preparation.rows.map((row) => (
                  <DetailLine key={row.id} row={row} />
                ))}
              </div>

              <div className="statusDashboardPreparationBlock">
                <h3>Build</h3>
                {surface.preparation.buildRows.map((row) => (
                  <DetailLine key={row.id} row={row} />
                ))}
              </div>
            </DashboardPanel>
          </div>
        </main>
      </div>
    </div>
  );
}
