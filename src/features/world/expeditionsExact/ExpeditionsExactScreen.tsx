import type React from 'react';
import { ModuleSourceSinkPanel, type DaoMandateRouteActionHandler } from '../../../ui/daoMandate/index.js';
import { getExpeditionsExactAssetSrc } from './expeditionsExactAssetRegistry.js';
import { ExpeditionsExactIcon } from './ExpeditionsExactIcon.js';
import type {
  DispatchSlotSurface,
  ExactButtonSurface,
  ExpeditionRouteCardSurface,
  ExpeditionsExactSurfaceV1,
} from './expeditionsExactTypes.js';

export type ExpeditionsExactScreenProps = {
  surface: ExpeditionsExactSurfaceV1;
  scale?: number;
  onSelectRoute?: (routeId: string) => void;
  onDispatch?: () => void;
  onClaimFirstReady?: () => void;
  onClaimAllReady?: () => void;
  onAutoFillRecommended?: () => void;
  onSlotAction?: (visualIndex: number) => void;
  onMandateRouteAction?: DaoMandateRouteActionHandler;
};

function Button({
  action,
  className = '',
  onClick,
}: {
  action: ExactButtonSurface;
  className?: string;
  onClick?: () => void;
}) {
  if (action.visible === false) return null;
  return (
    <button
      type="button"
      className={`expeditionsExactButton expeditionsExactButton--${action.tone ?? 'secondary'} ${className}`}
      disabled={!action.enabled}
      title={action.reason ?? undefined}
      aria-label={action.ariaLabel ?? action.label}
      data-action-id={action.id}
      data-intent={action.intent}
      onClick={() => {
        if (action.enabled) onClick?.();
      }}
    >
      <span>{action.label}</span>
    </button>
  );
}

function Header({ surface }: Pick<ExpeditionsExactScreenProps, 'surface'>) {
  return (
    <header className="expeditionsExactHeader" data-testid="expeditions-exact-header">
      <div className="expeditionsExactHeader__titleRow">
        <h1>{surface.page.title}</h1>
        <span className="expeditionsExactSeal" aria-hidden="true" />
      </div>
      <p>{surface.page.subtitle}</p>
    </header>
  );
}

function SlotCard({
  slot,
  surface,
  onSlotAction,
}: {
  slot: DispatchSlotSurface;
  surface: ExpeditionsExactSurfaceV1;
  onSlotAction?: (visualIndex: number) => void;
}) {
  return (
    <article
      className={`expeditionsExactSlot expeditionsExactSlot--${slot.status}`}
      data-testid={`expeditions-exact-slot-${slot.visualIndex}`}
      data-slot-index={slot.realSlotIndex ?? ''}
    >
      <span className="expeditionsExactSlot__roman">{slot.roman}</span>
      <span className="expeditionsExactSlot__status">{slot.statusLabel}</span>
      {slot.status === 'claim-ready' ? <span className="expeditionsExactMiniSeal" aria-hidden="true" /> : null}
      <span className="expeditionsExactSlot__icon">
        <ExpeditionsExactIcon iconKey={slot.iconKey} assets={surface.assets} />
      </span>
      <div className="expeditionsExactSlot__copy">
        <h3>{slot.title}</h3>
        <p>{slot.subtitle}</p>
      </div>
      <button
        type="button"
        className="expeditionsExactSlot__hit"
        disabled={!slot.action.enabled && slot.status !== 'idle'}
        onClick={() => onSlotAction?.(slot.visualIndex)}
        aria-label={`${slot.roman} ${slot.statusLabel}: ${slot.title} ${slot.subtitle}`}
      />
      <div className="expeditionsExactProgress">
        <span style={{ width: `${slot.progressPct}%` }} />
      </div>
    </article>
  );
}

function Slots({ surface, onSlotAction }: Pick<ExpeditionsExactScreenProps, 'surface' | 'onSlotAction'>) {
  return (
    <section className="expeditionsExactSlots" data-testid="expeditions-exact-slots" aria-label="Dispatch Slots">
      <div className="expeditionsExactPanelTitle">
        <span aria-hidden="true" />
        <h2>Dispatch Slots</h2>
        <span aria-hidden="true" />
      </div>
      <div className="expeditionsExactSlots__grid">
        {surface.dispatchSlots.map((slot) => (
          <SlotCard key={slot.visualIndex} slot={slot} surface={surface} onSlotAction={onSlotAction} />
        ))}
      </div>
    </section>
  );
}

function RouteMap({ surface }: Pick<ExpeditionsExactScreenProps, 'surface'>) {
  return (
    <section className="expeditionsExactRouteMap expeditionsExactPanel" data-testid="expeditions-exact-route-map" aria-label="Route Map">
      <h2>{surface.routeMap.title}</h2>
      <div className="expeditionsExactMapPaper">
        <svg viewBox="0 0 540 448" className="expeditionsExactMapSvg" aria-hidden="true" focusable="false">
          <path className="expeditionsExactMapTerrain expeditionsExactMapTerrain--a" d="M40 150 92 60l58 106 38-62 78 126H40z" />
          <path className="expeditionsExactMapTerrain expeditionsExactMapTerrain--b" d="M318 178 382 62l70 132 42-76 54 126H318z" />
          <path className="expeditionsExactMapPath" d="M128 110 C 188 146, 235 160, 318 152 S 438 214, 430 270 C 410 338, 255 378, 168 424 C 250 430, 320 474, 390 470" />
          {surface.routeMap.nodes.map((node) => (
            <circle key={node.id} className="expeditionsExactMapNode" cx={node.x} cy={node.y} r="10" />
          ))}
        </svg>
        {surface.routeMap.nodes.map((node) => (
          <span
            key={node.id}
            className={`expeditionsExactMapLabel expeditionsExactMapLabel--${node.id}`}
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
          >
            {node.label}
          </span>
        ))}
        <span className="expeditionsExactMapCompass" aria-hidden="true" />
      </div>
      <p>{surface.routeMap.footer}</p>
    </section>
  );
}

function RouteSlip({
  route,
  surface,
  onSelectRoute,
}: {
  route: ExpeditionRouteCardSurface;
  surface: ExpeditionsExactSurfaceV1;
  onSelectRoute?: (routeId: string) => void;
}) {
  return (
    <article
      className={`expeditionsExactRouteSlip ${route.selected ? 'expeditionsExactRouteSlip--selected' : ''}`}
      data-testid={`expeditions-exact-route-${route.routeId}`}
    >
      {route.recommended ? <span className="expeditionsExactRouteRibbon">RECOMMENDED</span> : null}
      <span className="expeditionsExactPaperclip" aria-hidden="true" />
      <span className="expeditionsExactRouteSlip__icon">
        <ExpeditionsExactIcon iconKey={route.routeId} assets={surface.assets} />
      </span>
      <div className="expeditionsExactRouteSlip__copy">
        <h3>{route.title}</h3>
        <p>{route.purpose}</p>
        <p>Duration: {route.durationLabel}</p>
      </div>
      <div className="expeditionsExactRouteSlip__yields">
        {route.yieldIcons.map((icon) => (
          <span key={icon.id} title={icon.label}>
            <ExpeditionsExactIcon iconKey={icon.iconKey} assets={surface.assets} />
            {icon.qtyLabel ? <small>{icon.qtyLabel}</small> : null}
          </span>
        ))}
      </div>
      <Button action={route.button} onClick={() => onSelectRoute?.(route.routeId)} />
    </article>
  );
}

function Routes({ surface, onSelectRoute }: Pick<ExpeditionsExactScreenProps, 'surface' | 'onSelectRoute'>) {
  return (
    <section className="expeditionsExactRoutes expeditionsExactPanel" data-testid="expeditions-exact-available-routes" aria-label="Available Routes">
      <h2>{surface.availableRoutes.title}</h2>
      <div className="expeditionsExactRoutes__stack">
        {surface.availableRoutes.routes.map((route) => (
          <RouteSlip key={route.routeId} route={route} surface={surface} onSelectRoute={onSelectRoute} />
        ))}
      </div>
    </section>
  );
}

function Ledger({
  surface,
  onClaimFirstReady,
  onAutoFillRecommended,
}: Pick<ExpeditionsExactScreenProps, 'surface' | 'onClaimFirstReady' | 'onAutoFillRecommended'>) {
  const ledger = surface.dispatchLedger;
  return (
    <aside className="expeditionsExactLedger expeditionsExactPanel" data-testid="expeditions-exact-ledger" aria-label="Dispatch Ledger">
      <h2>{ledger.title}</h2>
      <section className="expeditionsExactLedgerBlock expeditionsExactLedgerBlock--claim">
        <span className="expeditionsExactLedgerStamp">{ledger.claimBlock.stamp}</span>
        <div>
          <h3>{ledger.claimBlock.headline}</h3>
          <p>{ledger.claimBlock.body}</p>
        </div>
        <span className="expeditionsExactLedgerIcon">
          <ExpeditionsExactIcon iconKey={ledger.claimBlock.iconKey} assets={surface.assets} />
        </span>
        <Button action={ledger.claimBlock.button} onClick={onClaimFirstReady} />
      </section>
      <section className="expeditionsExactLedgerBlock expeditionsExactLedgerBlock--recommended">
        <span className="expeditionsExactLedgerStamp expeditionsExactLedgerStamp--jade">{ledger.recommendedBlock.title}</span>
        <div>
          <h3>{ledger.recommendedBlock.headline}</h3>
          <p>{ledger.recommendedBlock.body}</p>
        </div>
        <span className="expeditionsExactLedgerIcon">
          <ExpeditionsExactIcon iconKey={ledger.recommendedBlock.iconKey} assets={surface.assets} />
        </span>
        <Button action={ledger.recommendedBlock.button} onClick={onAutoFillRecommended} />
      </section>
      <p className="expeditionsExactLedgerFooter">{ledger.footer}</p>
      <span className="expeditionsExactMiniSeal" aria-hidden="true" />
    </aside>
  );
}

function BottomActions({
  surface,
  onDispatch,
  onClaimAllReady,
}: Pick<ExpeditionsExactScreenProps, 'surface' | 'onDispatch' | 'onClaimAllReady'>) {
  return (
    <section className="expeditionsExactBottomActions" data-testid="expeditions-exact-bottom-actions" aria-label="Expedition actions">
      <Button action={surface.bottomActions.dispatch} onClick={onDispatch} />
      <Button action={surface.bottomActions.claimAllReady} onClick={onClaimAllReady} />
    </section>
  );
}

export function ExpeditionsExactScreen({
  surface,
  scale = 1,
  onSelectRoute,
  onDispatch,
  onClaimFirstReady,
  onClaimAllReady,
  onAutoFillRecommended,
  onSlotAction,
  onMandateRouteAction,
}: ExpeditionsExactScreenProps) {
  const paper = getExpeditionsExactAssetSrc('paperUnderlay', surface.assets);
  return (
    <article
      className="expeditionsExactPage"
      data-testid={surface.meta.rootTestId}
      data-mode={surface.meta.mode}
      style={{
        '--expeditions-exact-scale': String(scale),
        '--expeditions-exact-paper-underlay': `url("${paper}")`,
      } as React.CSSProperties}
    >
      <div className="expeditionsExactPlane" data-testid="expeditions-exact-plane">
        <div className="expeditionsExactBackdrop" aria-hidden="true" />
        <Header surface={surface} />
        <div className="expeditionsExactStatusPlaque" data-testid="expeditions-exact-status-plaque">
          <strong>{surface.page.statusPlaque}</strong>
          <span className="expeditionsExactSeal expeditionsExactSeal--small" aria-hidden="true" />
        </div>
        <ModuleSourceSinkPanel
          projection={surface.mandateSourceSink}
          className="expeditionsExactMandateSourceSink"
          title="Background support"
          onRouteAction={onMandateRouteAction}
        />
        <Slots surface={surface} onSlotAction={onSlotAction} />
        <RouteMap surface={surface} />
        <Routes surface={surface} onSelectRoute={onSelectRoute} />
        <Ledger surface={surface} onClaimFirstReady={onClaimFirstReady} onAutoFillRecommended={onAutoFillRecommended} />
        <BottomActions surface={surface} onDispatch={onDispatch} onClaimAllReady={onClaimAllReady} />
        <aside data-testid="expeditions-exact-shell-flags" hidden>{JSON.stringify(surface.shell)}</aside>
        <aside data-testid="expeditions-exact-debug" hidden>{JSON.stringify(surface.debug ?? {})}</aside>
      </div>
    </article>
  );
}
