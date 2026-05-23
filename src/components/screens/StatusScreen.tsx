import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Fingerprint } from 'lucide-react';

import { useUIStore } from '../../stores/uiStore.js';
import {
  performDaoMandateRouteAction,
  type DaoMandateRoute,
  type DaoPressureBadgeV1,
  type DaoProofSealV1,
  type DaoReflectionV1,
} from '../../systems/ui/daoMandate/index.js';
import {
  actionFromProofSeal,
  actionFromReflection,
  actionFromSourceThread,
  type StatusV2ActionSurface,
  type StatusV2FactRow,
  type StatusV2RecentOmenRow,
  type StatusV2WorkRow,
} from '../../systems/ui/status/statusV2Surface.js';
import {
  OmenSeal,
  PressureBadgeRow,
  ProofSealRow,
  ReflectionPlaque,
  SourceThreadDrawer,
  type OmenSealAction,
  type ProofSealAction,
  type ReflectionPlaqueAction,
  type SourceThreadAction,
} from '../../ui/daoMandate/index.js';
import { GameIcon, ICONS, type IconId } from '../../ui/icons/index.js';
import { useStatusDashboardSurface } from '../../ui/status/useStatusDashboardSurface.js';
import './StatusScreen.scss';

type DrawerState =
  | { kind: 'omen'; title: string; detail: string }
  | { kind: 'proof'; seal: DaoProofSealV1 }
  | { kind: 'pressure'; badge: DaoPressureBadgeV1 }
  | { kind: 'reflection'; reflection: DaoReflectionV1 }
  | null;

type StatusV2CardProps = {
  title: string;
  testId: string;
  modifier: string;
  icon: IconId;
  children: ReactNode;
};

function SurfaceIcon({ icon, size = 22 }: { icon: IconId; size?: number }) {
  const safeIcon: IconId = Object.hasOwn(ICONS, icon) ? icon : 'inkWarning';
  return <GameIcon icon={safeIcon} size={size} />;
}

function StatusV2Card({ title, testId, modifier, icon, children }: StatusV2CardProps) {
  return (
    <section className={`statusV2Card statusV2Card--${modifier}`} data-testid={testId} aria-label={title}>
      <div className="statusV2Card__heading">
        <span className="statusV2Card__icon" aria-hidden="true">
          <SurfaceIcon icon={icon} size={20} />
        </span>
        <h2>{title}</h2>
      </div>
      <div className="statusV2Card__body">{children}</div>
    </section>
  );
}

function FactRows({ rows, compact = false }: { rows: StatusV2FactRow[]; compact?: boolean }) {
  return (
    <dl className={`statusV2FactRows ${compact ? 'statusV2FactRows--compact' : ''}`}>
      {rows.map((row) => (
        <div key={row.id} className={`statusV2FactRow statusV2FactRow--${row.tone}`}>
          <dt>
            <span aria-hidden="true">
              <SurfaceIcon icon={row.icon} size={17} />
            </span>
            {row.label}
          </dt>
          <dd>
            <strong>{row.value ?? row.detail}</strong>
            {!compact ? <span>{row.detail}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function WorkRows({ rows, emptyState }: { rows: StatusV2WorkRow[]; emptyState: string }) {
  if (rows.length === 0) {
    return <p className="statusV2EmptyState">{emptyState}</p>;
  }

  return (
    <div className="statusV2WorkRows" role="list">
      {rows.map((row) => (
        <article key={row.id} className={`statusV2WorkRow statusV2WorkRow--${row.kind}`} role="listitem">
          <span className="statusV2WorkRow__icon" aria-hidden="true">
            <SurfaceIcon icon={row.icon} size={18} />
          </span>
          <span className="statusV2WorkRow__copy">
            <span className="statusV2WorkRow__label">{row.label}</span>
            <strong>{row.value ?? row.detail}</strong>
            <span>{row.detail}</span>
          </span>
        </article>
      ))}
    </div>
  );
}

function RecentOmenRows({
  rows,
  reflections,
  emptyState,
  onReflectionInspect,
}: {
  rows: StatusV2RecentOmenRow[];
  reflections: DaoReflectionV1[];
  emptyState: string;
  onReflectionInspect: (reflection: DaoReflectionV1) => void;
}) {
  const visibleReflections = reflections.slice(0, Math.max(0, 3 - rows.length));

  if (rows.length === 0 && visibleReflections.length === 0) {
    return <p className="statusV2EmptyState">{emptyState}</p>;
  }

  return (
    <div className="statusV2RecentRows" role="list">
      {rows.map((row) => (
        <article key={row.id} className={`statusV2RecentRow statusV2RecentRow--${row.tone}`} role="listitem">
          <span>{row.label}</span>
          <p>{row.detail}</p>
        </article>
      ))}
      {visibleReflections.map((reflection) => (
        <button
          key={reflection.id}
          type="button"
          className="statusV2RecentRow statusV2RecentRow--reflection"
          onClick={() => onReflectionInspect(reflection)}
        >
          <span>{reflection.label}</span>
          <p>{reflection.detail}</p>
        </button>
      ))}
    </div>
  );
}

function toOmenAction(action: StatusV2ActionSurface | null, onAction: (action: StatusV2ActionSurface) => void): OmenSealAction | undefined {
  if (!action) return undefined;
  return {
    label: action.label,
    ariaLabel: action.label,
    disabled: action.disabled,
    disabledReason: action.disabledReason ?? undefined,
    onClick: () => onAction(action),
  };
}

function toProofAction(action: StatusV2ActionSurface | null, onAction: (action: StatusV2ActionSurface) => void): ProofSealAction | undefined {
  if (!action) return undefined;
  return {
    label: action.label,
    ariaLabel: action.label,
    onClick: () => onAction(action),
  };
}

function toSourceAction(action: StatusV2ActionSurface | null, onAction: (action: StatusV2ActionSurface) => void): SourceThreadAction | undefined {
  if (!action) return undefined;
  return {
    label: action.label,
    ariaLabel: action.label,
    disabled: action.disabled,
    disabledReason: action.disabledReason ?? undefined,
    onClick: () => onAction(action),
  };
}

function toReflectionAction(action: StatusV2ActionSurface | null, onAction: (action: StatusV2ActionSurface) => void): ReflectionPlaqueAction | undefined {
  if (!action) return undefined;
  return {
    label: action.label,
    ariaLabel: action.label,
    disabled: action.disabled,
    disabledReason: action.disabledReason ?? undefined,
    onClick: () => onAction(action),
  };
}

function routeActionFromV2(action: StatusV2ActionSurface): DaoMandateRoute {
  return action.route;
}

export function StatusScreen() {
  const surface = useStatusDashboardSurface();
  const statusV2 = surface.statusV2;
  const addNotification = useUIStore((state) => state.addNotification);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const handleRouteAction = useCallback((route: DaoMandateRoute) => {
    const result = performDaoMandateRouteAction(route);
    if (!result.performed && result.reason) {
      addNotification('warning', result.reason, {
        source: 'dao-mandate-status-v2',
        dedupeKey: `dao-mandate-status-v2-route-${route.id}`,
      });
    }
  }, [addNotification]);

  const handleV2Action = useCallback((action: StatusV2ActionSurface) => {
    handleRouteAction(routeActionFromV2(action));
  }, [handleRouteAction]);

  const currentOmenAction = useMemo(
    () => toOmenAction(statusV2.cards.currentOmen.action, handleV2Action),
    [handleV2Action, statusV2.cards.currentOmen.action],
  );

  const currentOmenDetailAction: OmenSealAction = useMemo(() => ({
    label: statusV2.cards.currentOmen.inspectLabel,
    ariaLabel: `${statusV2.cards.currentOmen.inspectLabel}: ${statusV2.cards.currentOmen.omen.title}`,
    onClick: () => setDrawer({
      kind: 'omen',
      title: statusV2.cards.currentOmen.omen.title,
      detail: statusV2.cards.currentOmen.omen.detail,
    }),
  }), [statusV2.cards.currentOmen]);

  return (
    <div className="statusV2Root" data-testid="status-v2-root" data-surface-testid={statusV2.meta.rootTestId} data-content-loaded={statusV2.meta.contentLoaded}>
      <div className="statusV2Canvas">
        <section className="statusV2Hero" data-testid="status-v2-hero" aria-label="Life Identity">
          <div className="statusV2Hero__identity">
            <div className="statusV2Hero__crest" aria-hidden="true">
              <Fingerprint size={32} />
            </div>
            <div className="statusV2Hero__copy">
              <span className="statusV2Eyebrow">Life Identity</span>
              <h1>{statusV2.hero.realmName}</h1>
              <p>{statusV2.hero.stageText}</p>
            </div>
            <dl className="statusV2Hero__facts">
              <div>
                <dt>Path</dt>
                <dd>{statusV2.hero.pathLabel}</dd>
              </div>
              <div>
                <dt>Heart Law</dt>
                <dd>{statusV2.hero.heartLawLabel}</dd>
              </div>
              <div>
                <dt>Spirit Root</dt>
                <dd>{statusV2.hero.spiritRootLabel}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{statusV2.hero.cityLabel}</dd>
              </div>
            </dl>
          </div>

          <div className="statusV2Hero__omenSeal">
            <OmenSeal
              omen={statusV2.hero.omen}
              compact
              showEvidenceCount
              action={currentOmenAction}
              detailAction={currentOmenDetailAction}
              testId="status-v2-hero-omen"
            />
          </div>
        </section>

        <section className="statusV2Metrics" data-testid="status-v2-metrics" aria-label="Core status metrics">
          {statusV2.metrics.map((metric) => (
            <div key={metric.id} className={`statusV2Metric statusV2Metric--${metric.tone}`}>
              <span className="statusV2Metric__icon" aria-hidden="true">
                <SurfaceIcon icon={metric.icon} size={22} />
              </span>
              <span className="statusV2Metric__label">{metric.label}</span>
              <strong>{metric.value ?? metric.detail}</strong>
            </div>
          ))}
        </section>

        <main className="statusV2Grid" data-testid="status-v2-grid" aria-label="Status diagnostics">
          <StatusV2Card
            title={statusV2.cards.currentOmen.title}
            testId="status-v2-card-current-omen"
            modifier="currentOmen"
            icon="inkWarning"
          >
            <OmenSeal
              omen={statusV2.cards.currentOmen.omen}
              compact
              action={currentOmenAction}
              detailAction={currentOmenDetailAction}
              testId="status-v2-current-omen-seal"
            />
          </StatusV2Card>

          <StatusV2Card
            title={statusV2.cards.gateProof.title}
            testId="status-v2-card-gate-proof"
            modifier="gateProof"
            icon="foundationPill"
          >
            <ProofSealRow
              seals={statusV2.cards.gateProof.seals}
              maxVisible={4}
              compact
              emptyLabel={statusV2.cards.gateProof.emptyState}
              onSealInspect={(seal) => setDrawer({ kind: 'proof', seal })}
              getSealAction={(seal) => seal.routePolicy === 'direct' ? toProofAction(actionFromProofSeal(seal), handleV2Action) : undefined}
              testId="status-v2-proof-seals"
            />
          </StatusV2Card>

          <StatusV2Card
            title={statusV2.cards.lifeIdentity.title}
            testId="status-v2-card-life-identity"
            modifier="lifeIdentity"
            icon="bookHeaven"
          >
            <FactRows rows={statusV2.cards.lifeIdentity.rows} compact />
          </StatusV2Card>

          <StatusV2Card
            title={statusV2.cards.preparationHealth.title}
            testId="status-v2-card-preparation-health"
            modifier="preparationHealth"
            icon="inkShield"
          >
            <PressureBadgeRow
              badges={statusV2.cards.preparationHealth.badges}
              maxVisible={3}
              compact
              emptyLabel={statusV2.cards.preparationHealth.emptyState}
              onBadgeInspect={(badge) => setDrawer({ kind: 'pressure', badge })}
              testId="status-v2-pressure-badges"
            />
          </StatusV2Card>

          <StatusV2Card
            title={statusV2.cards.currentWork.title}
            testId="status-v2-card-current-work"
            modifier="currentWork"
            icon="hourglassProgress"
          >
            <WorkRows rows={statusV2.cards.currentWork.rows} emptyState={statusV2.cards.currentWork.emptyState} />
          </StatusV2Card>

          <StatusV2Card
            title={statusV2.cards.recentOmens.title}
            testId="status-v2-card-recent-omens"
            modifier="recentOmens"
            icon="recordSlip"
          >
            <RecentOmenRows
              rows={statusV2.cards.recentOmens.rows}
              reflections={statusV2.cards.recentOmens.reflections}
              emptyState={statusV2.cards.recentOmens.emptyState}
              onReflectionInspect={(reflection) => setDrawer({ kind: 'reflection', reflection })}
            />
          </StatusV2Card>
        </main>

        <section className="statusV2DrawerLayer" aria-label="Details">
          <div className="statusV2DrawerLayer__active">
            {drawer ? (
              <StatusV2ActiveDrawer
                drawer={drawer}
                onClose={() => setDrawer(null)}
                onAction={handleV2Action}
              />
            ) : (
              <p className="statusV2DrawerLayer__empty">Proof, source, and reflection details stay folded until inspected.</p>
            )}
          </div>

          <SourceThreadDrawer
            threads={statusV2.drawers.sourceThreads}
            title="Source Thread"
            summary={`${statusV2.drawers.sourceThreads.length} folded`}
            className="statusV2SourceThreadDrawer"
            testId="status-v2-source-thread-drawer"
            getThreadAction={(thread) => toSourceAction(actionFromSourceThread(thread), handleV2Action)}
          />
        </section>
      </div>
    </div>
  );
}

function StatusV2ActiveDrawer({
  drawer,
  onClose,
  onAction,
}: {
  drawer: Exclude<DrawerState, null>;
  onClose: () => void;
  onAction: (action: StatusV2ActionSurface) => void;
}) {
  return (
    <aside className={`statusV2Drawer statusV2Drawer--${drawer.kind}`} role="region" aria-label="Proof Detail">
      <button type="button" className="statusV2Drawer__close" onClick={onClose}>
        Close Details
      </button>
      {drawer.kind === 'omen' ? (
        <div className="statusV2Drawer__copy">
          <span className="statusV2Eyebrow">Current Omen</span>
          <h2>{drawer.title}</h2>
          <p>{drawer.detail}</p>
        </div>
      ) : null}
      {drawer.kind === 'proof' ? (
        <div className="statusV2Drawer__copy">
          <span className="statusV2Eyebrow">Proof Detail</span>
          <h2>{drawer.seal.label}</h2>
          <p>{drawer.seal.detail}</p>
          {toProofAction(actionFromProofSeal(drawer.seal), onAction) ? (
            <button
              type="button"
              className="statusV2Drawer__action"
              onClick={() => {
                const action = actionFromProofSeal(drawer.seal);
                if (action) onAction(action);
              }}
            >
              {actionFromProofSeal(drawer.seal)?.label}
            </button>
          ) : null}
        </div>
      ) : null}
      {drawer.kind === 'pressure' ? (
        <div className="statusV2Drawer__copy">
          <span className="statusV2Eyebrow">Preparation Health</span>
          <h2>{drawer.badge.label}</h2>
          <p>{drawer.badge.detail}</p>
        </div>
      ) : null}
      {drawer.kind === 'reflection' ? (
        <div className="statusV2ReflectionDrawer">
          <ReflectionPlaque
            reflection={drawer.reflection}
            action={toReflectionAction(actionFromReflection(drawer.reflection), onAction)}
            testId="status-v2-reflection-plaque"
          />
        </div>
      ) : null}
    </aside>
  );
}
