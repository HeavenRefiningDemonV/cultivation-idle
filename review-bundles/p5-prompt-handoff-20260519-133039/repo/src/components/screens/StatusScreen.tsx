import type { ReactNode } from 'react';
import {
  BadgeCheck,
  ChevronRight,
  Compass,
  Flame,
  Gauge,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore.js';
import { openWorldModule } from '../../systems/world/openWorldModule.js';
import type {
  StatusActionSurface,
  StatusDashboardSurfaceV1,
  StatusFactRow,
  StatusMilestoneNode,
  StatusRouteTarget,
  StatusTone,
} from '../../systems/ui/status/statusDashboardSurface.js';
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

function performStatusDashboardAction(action: StatusActionSurface): void {
  if (action.disabled || action.target.kind === 'none') return;

  if (action.target.kind === 'tab') {
    useUIStore.getState().setActiveTab(action.target.tab);
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
}: {
  action: StatusActionSurface | null | undefined;
  label?: string;
  disabledLabel?: string;
  className?: string;
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
          performStatusDashboardAction(action);
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

function EmptyState({ row }: { row: StatusFactRow }) {
  return (
    <article className={`statusDashboardEmptyState statusDashboardEmptyState--${row.tone}`}>
      <span aria-hidden><SurfaceIcon icon={row.icon} size={22} /></span>
      <div>
        <h3>{row.label}</h3>
        <p>{row.detail}</p>
      </div>
    </article>
  );
}

function pillTone(tone: StatusTone): 'ready' | 'blocked' | 'preparing' {
  if (tone === 'success') return 'ready';
  if (tone === 'danger' || tone === 'warning') return 'blocked';
  return 'preparing';
}

function nodeClass(node: StatusMilestoneNode): string {
  return [
    'statusDashboardProgressNode',
    `statusDashboardProgressNode--${node.state}`,
    node.state === 'current' || node.state === 'warning' ? 'is-current' : '',
  ].filter(Boolean).join(' ');
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

export function StatusScreen() {
  const surface = useStatusDashboardSurface();
  const primaryAction = surface.hero.primaryAction ?? surface.bestNextActions.find((action) => !action.disabled) ?? null;
  const milestoneTone = pillTone(surface.milestone.tone);
  const currentWorkRows = buildCurrentWorkRows(surface);
  const elementKey = surface.identity.spiritRootTone;
  const readinessRows = surface.readiness.rows.slice(0, 3);

  return (
    <div className="statusDashboardRoot" data-testid={surface.meta.rootTestId}>
      <div className="statusDashboardCanvas">
        <header className="statusDashboardHero" aria-label="Status summary">
          <div className="statusDashboardRealm">
            <div className="statusDashboardRealm__crest" aria-hidden>
              <Compass />
            </div>
            <div>
              <div className="statusDashboardMeta">Realm</div>
              <h1>{surface.hero.realmName}</h1>
              <p>{surface.hero.stageText}</p>
            </div>
          </div>

          <div className="statusDashboardPath">
            <div className="statusDashboardPath__seal" aria-hidden>
              <Target />
            </div>
            <div>
              <div className="statusDashboardMeta">Path</div>
              <h2>{surface.hero.pathLabel}</h2>
              <p>Heart Law: {surface.hero.heartLawLabel}</p>
              <p>Spirit Root: {surface.hero.spiritRootLabel}</p>
              <p>Build archetype: {surface.hero.archetypeLabel}</p>
            </div>
          </div>

          <div className="statusDashboardGoal">
            <div className="statusDashboardMeta">Next Major Goal</div>
            <h2>{surface.hero.nextMajorGoalLabel}</h2>
            <p>{surface.hero.biggestShortfallLabel}</p>
            <p>{surface.hero.nextMajorGoalDetail}</p>
            <div className="statusDashboardGoal__action">
              <RouteButton action={primaryAction} label="Open best fix" disabledLabel="Blocked" />
            </div>
          </div>
          <div className="statusDashboardHero__art" aria-hidden />
        </header>

        <section className="statusDashboardMetricStrip" aria-label="Combat statistics">
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

        <main className="statusDashboardGrid">
          <div className="statusDashboardColumn">
            <DashboardPanel title="Milestone" icon={<BadgeCheck />} className="statusDashboardPanel--milestone">
              <div className="statusDashboardMilestone">
                <div>
                  <h3>{surface.milestone.title}</h3>
                  <p>{surface.milestone.detail}</p>
                </div>
                <span className={`statusDashboardReadinessPill statusDashboardReadinessPill--${milestoneTone}`}>
                  {surface.milestone.readinessLabel}
                </span>
              </div>
              <div className="statusDashboardProgressRail" aria-label="Milestone progress">
                {surface.milestone.nodes.map((node) => (
                  <div key={node.id} className={nodeClass(node)} title={node.detail}>
                    <span><SurfaceIcon icon={node.icon} size={15} /></span>
                    <strong>{node.label}</strong>
                  </div>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Best Next Actions" icon={<Sparkles />} className="statusDashboardPanel--actions">
              {surface.bestNextActions.length > 0 ? (
                <div className="statusDashboardActionList">
                  {surface.bestNextActions.map((action) => (
                    <article key={action.id} className={`statusDashboardActionRow statusDashboardActionRow--${action.tone}`}>
                      <div>
                        <h3>{action.label}</h3>
                        <p>{action.detail}</p>
                      </div>
                      <span>{action.destinationLabel}</span>
                      <RouteButton action={action} />
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  row={{
                    id: 'actions-empty',
                    label: 'No routeable action surfaced',
                    detail: 'The live status systems did not return a stronger next action.',
                    tone: 'muted',
                    icon: 'hourglassEmpty',
                    source: 'statusDashboardSurface.actions',
                  }}
                />
              )}
            </DashboardPanel>

            <DashboardPanel title="Recent Changes" icon={<PackageCheck />} className="statusDashboardPanel--recent">
              {surface.runCompass.recentDeltas.length > 0 ? (
                <div className="statusDashboardIssueList">
                  {surface.runCompass.recentDeltas.map((row) => (
                    <article key={row.id} className={`statusDashboardIssue statusDashboardIssue--${row.tone}`}>
                      <span className="statusDashboardIssue__icon" aria-hidden>
                        <SurfaceIcon icon={row.icon} size={20} />
                      </span>
                      <div>
                        <span>{row.label}</span>
                        <p>{row.value ? `${row.value}: ${row.detail}` : row.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  row={{
                    id: 'recent-empty',
                    label: surface.runCompass.primaryBlockerLabel,
                    detail: surface.runCompass.primaryRouteLabel,
                    tone: 'muted',
                    icon: 'recordSlip',
                    source: 'runCompass.recentDeltas',
                  }}
                />
              )}
            </DashboardPanel>

            <DashboardPanel title="Identity & Attributes" icon={<Compass />} className="statusDashboardPanel--identity">
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
          </div>

          <div className="statusDashboardColumn">
            <DashboardPanel title={surface.readiness.title} icon={<Gauge />} className="statusDashboardPanel--readiness">
              <p className="statusDashboardPanelLead">{surface.readiness.postureLabel}</p>
              <div className="statusDashboardReadinessRows">
                {readinessRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={`statusDashboardChevronRow statusDashboardChevronRow--${row.tone}`}
                    onClick={() => primaryAction && performStatusDashboardAction(primaryAction)}
                    disabled={!primaryAction}
                  >
                    <span>
                      <strong>{row.label}</strong>
                      <small>{row.value ? `${row.value}: ${row.detail}` : row.detail}</small>
                    </span>
                    <ChevronRight aria-hidden />
                  </button>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title={surface.safetyNet.title} icon={<ShieldCheck />} className="statusDashboardPanel--safety">
              <h3>{surface.safetyNet.stateLabel}</h3>
              <p>{surface.safetyNet.progressLabel}</p>
              <div className="statusDashboardSafetyTiles">
                {surface.safetyNet.rows.map((row) => (
                  <StatusChip key={row.id} row={row} />
                ))}
                <StatusChip
                  row={{
                    id: 'safety-route',
                    label: 'Route',
                    value: surface.safetyNet.action?.destinationLabel ?? 'Unavailable',
                    detail: surface.safetyNet.action?.detail ?? 'No safety-net route is available.',
                    tone: surface.safetyNet.action && !surface.safetyNet.action.disabled ? 'info' : 'muted',
                    icon: 'artifactBundle',
                    source: 'statusDashboardSurface.safetyNet',
                  }}
                />
              </div>
              <div className="statusDashboardReserveNote">
                <span>{surface.safetyNet.rows[0]?.detail ?? surface.safetyNet.progressLabel}</span>
                <RouteButton action={surface.safetyNet.action} label="View" disabledLabel="View" />
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
                    <RouteButton action={row.action} label="View" disabledLabel="View" />
                  </article>
                ))}
              </div>
            </DashboardPanel>
          </div>

          <div className="statusDashboardColumn">
            <DashboardPanel title={surface.requirements.title} icon={<ShieldCheck />} className="statusDashboardPanel--requirements">
              <div className="statusDashboardRequirementList">
                {surface.requirements.rows.length > 0 ? surface.requirements.rows.map((row) => (
                  <article key={row.id} className={`statusDashboardRequirement statusDashboardRequirement--${row.tone}`}>
                    <span className="statusDashboardRequirement__icon" aria-hidden>
                      <SurfaceIcon icon={row.icon} size={22} />
                    </span>
                    <div>
                      <h3>{row.label}</h3>
                      <p>{[row.gapLabel, row.priorityLabel].filter(Boolean).join(' - ') || row.detail}</p>
                    </div>
                    <RouteButton action={row.action} label="View" disabledLabel={row.disabledReason ? 'Blocked' : 'View'} />
                  </article>
                )) : surface.requirements.emptyState ? (
                  <EmptyState row={surface.requirements.emptyState} />
                ) : null}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Preparation Summary" icon={<ShieldCheck />} className="statusDashboardPanel--preparation">
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
