import type React from 'react';
import { ModuleSourceSinkPanel, type DaoMandateRouteActionHandler } from '../../../ui/daoMandate/index.js';
import { getBountiesExactAssetSrc } from './bountiesExactAssetRegistry.js';
import { BountiesExactIcon } from './BountiesExactIcon.js';
import type {
  BountiesExactNoteSurface,
  BountiesExactSurfaceV1,
  ExactButtonSurface,
} from './bountiesExactTypes.js';

export type BountiesExactScreenProps = {
  surface: BountiesExactSurfaceV1;
  scale?: number;
  onSelectOrder?: (orderId: string) => void;
  onTrackSelected?: () => void;
  onClaimReady?: () => void;
  onClaimAllReady?: () => void;
  onRouteNow?: () => void;
  onRouteNotice?: () => void;
  onRefreshBoard?: () => void;
  onNotePrimaryAction?: (orderId: string) => void;
  onMandateRouteAction?: DaoMandateRouteActionHandler;
};

function Button({
  action,
  className = '',
  style,
  onClick,
}: {
  action: ExactButtonSurface;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  if (action.visible === false) return null;
  return (
    <button
      type="button"
      className={`bountiesExactButton bountiesExactButton--${action.tone ?? 'secondary'} ${className}`}
      disabled={!action.enabled}
      title={action.reason ?? undefined}
      aria-label={action.ariaLabel ?? action.label}
      data-action-id={action.id}
      data-intent={action.intent}
      style={style}
      onClick={() => {
        if (action.enabled) onClick?.();
      }}
    >
      <span>{action.label}</span>
    </button>
  );
}

function Header({ surface }: Pick<BountiesExactScreenProps, 'surface'>) {
  return (
    <header className="bountiesExactHeader" data-testid="bounties-exact-header">
      <div className="bountiesExactHeader__titleRow">
        <h1>{surface.page.title}</h1>
        <span className="bountiesExactSeal" aria-hidden="true" />
      </div>
      <p>{surface.page.subtitle}</p>
    </header>
  );
}

function StatStrip({ surface }: Pick<BountiesExactScreenProps, 'surface'>) {
  return (
    <section className="bountiesExactStatStrip" data-testid="bounties-exact-stat-strip" aria-label="Bounty board summary">
      {surface.statCards.map((card) => (
        <div key={card.id} className={`bountiesExactStatCard bountiesExactStatCard--${card.tone ?? 'neutral'}`}>
          <span className="bountiesExactStatCard__icon">
            <BountiesExactIcon iconKey={card.iconKey} assets={surface.assets} />
          </span>
          <span className="bountiesExactStatCard__copy">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </span>
        </div>
      ))}
    </section>
  );
}

function TrackedRail({
  surface,
  onRouteNotice,
  onTrackSelected,
}: Pick<BountiesExactScreenProps, 'surface' | 'onRouteNotice' | 'onTrackSelected'>) {
  const notice = surface.trackedNotice;
  return (
    <aside className="bountiesExactTrackedRail bountiesExactRail" data-testid="bounties-exact-tracked-rail" aria-label="Tracked Notice">
      <h2>{notice.title}</h2>
      <div className="bountiesExactPinnedNotice">
        <h3>{notice.noticeTitle}</h3>
        <p>{notice.body}</p>
        <div className="bountiesExactProgress">
          <span style={{ width: `${notice.progressPct}%` }} />
        </div>
        <div className="bountiesExactProgressText">{notice.progressText}</div>
        <div className="bountiesExactDivider" />
        <strong>Reward</strong>
        <p>{notice.rewardLine}</p>
        <span className="bountiesExactMiniSeal" aria-hidden="true" />
      </div>
      <div className="bountiesExactRailActions">
        <Button action={notice.routeButton} onClick={onRouteNotice} />
        <Button action={notice.untrackButton} onClick={onTrackSelected} />
      </div>
      <section className="bountiesExactBoardTruth">
        <div>
          <BountiesExactIcon iconKey="boardTruth" assets={surface.assets} />
          <h3>{notice.boardTruth.title}</h3>
        </div>
        <p>{notice.boardTruth.body}</p>
        <span className="bountiesExactMiniSeal" aria-hidden="true" />
      </section>
    </aside>
  );
}

function RewardChips({ note, surface }: { note: BountiesExactNoteSurface; surface: BountiesExactSurfaceV1 }) {
  return (
    <div className="bountiesExactNote__rewards">
      {note.rewardChips.length > 0 ? note.rewardChips.map((chip) => (
        <span key={chip.id} className={`bountiesExactRewardChip bountiesExactRewardChip--${chip.tone}`}>
          <BountiesExactIcon iconKey={chip.iconKey} assets={surface.assets} />
          <span>{chip.label}</span>
        </span>
      )) : <span className="bountiesExactRewardChip bountiesExactRewardChip--muted">No reward posted</span>}
    </div>
  );
}

function BoardNote({
  note,
  surface,
  onSelectOrder,
  onNotePrimaryAction,
}: {
  note: BountiesExactNoteSurface;
  surface: BountiesExactSurfaceV1;
  onSelectOrder?: (orderId: string) => void;
  onNotePrimaryAction?: (orderId: string) => void;
}) {
  return (
    <article
      className={[
        'bountiesExactNote',
        `bountiesExactNote--${note.role}`,
        note.selected ? 'bountiesExactNote--selected' : '',
        note.tracked ? 'bountiesExactNote--tracked' : '',
        note.claimReady ? 'bountiesExactNote--ready' : '',
        note.claimed ? 'bountiesExactNote--claimed' : '',
      ].filter(Boolean).join(' ')}
      data-testid={`bounties-exact-board-note-${note.role}`}
      data-order-id={note.id}
      aria-label={`${note.title}: ${note.roleLabel}`}
      onClick={() => onSelectOrder?.(note.id)}
    >
      <button
        type="button"
        className="bountiesExactNote__hit"
        aria-label={`Select ${note.title}`}
        onClick={(event) => {
          event.stopPropagation();
          onSelectOrder?.(note.id);
        }}
      />
      <span className="bountiesExactPin" aria-hidden="true" />
      {note.stateRibbon ? <span className="bountiesExactRibbon">{note.stateRibbon}</span> : <span className="bountiesExactRibbon bountiesExactRibbon--empty" />}
      <span className="bountiesExactNote__medallion">
        <BountiesExactIcon iconKey={note.iconKey} assets={surface.assets} />
      </span>
      <h3>{note.title}</h3>
      <span className="bountiesExactNote__subtitle">{note.subtitle}</span>
      <p>{note.objective}</p>
      <div className="bountiesExactNote__progressRow">
        <div className="bountiesExactProgress">
          <span style={{ width: `${note.progressPct}%` }} />
        </div>
        <strong>{note.progressText}</strong>
      </div>
      <button
        type="button"
        className="bountiesExactNote__plainAction"
        disabled={!note.primaryButton.enabled}
        title={note.primaryButton.reason ?? undefined}
        aria-label={note.primaryButton.ariaLabel ?? note.primaryButton.label}
        data-action-id={note.primaryButton.id}
        data-intent={note.primaryButton.intent}
        style={{
          position: 'relative',
          zIndex: 6,
          width: '100%',
          height: 46,
          marginTop: 14,
          display: 'grid',
          placeItems: 'center',
          color: '#2b2116',
          background: 'linear-gradient(180deg, #ead6a4, #c79743)',
          border: '1px solid rgba(89, 58, 25, 0.54)',
          borderRadius: 5,
          boxShadow: 'inset 0 2px 0 rgba(255, 248, 224, 0.45), 0 5px 9px rgba(83, 56, 26, 0.2)',
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 18,
          fontWeight: 700,
          cursor: note.primaryButton.enabled ? 'pointer' : 'not-allowed',
          opacity: note.primaryButton.enabled ? 1 : 0.55,
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (note.primaryButton.enabled) onNotePrimaryAction?.(note.id);
        }}
      >
        <span>{note.primaryButton.label}</span>
      </button>
      <div className="bountiesExactDivider" />
      <strong className="bountiesExactNote__rewardLabel">Reward</strong>
      <RewardChips note={note} surface={surface} />
      <span className="bountiesExactMiniSeal" aria-hidden="true" />
    </article>
  );
}

function PostedOrders({
  surface,
  onSelectOrder,
  onNotePrimaryAction,
}: Pick<BountiesExactScreenProps, 'surface' | 'onSelectOrder' | 'onNotePrimaryAction'>) {
  return (
    <section className="bountiesExactBoard" data-testid="bounties-exact-board" aria-label="Posted Orders">
      <div className="bountiesExactBoard__plaque">
        <span aria-hidden="true" />
        <h2>{surface.postedOrders.title}</h2>
        <span aria-hidden="true" />
      </div>
      <p className="bountiesExactBoard__subtitle">{surface.postedOrders.subtitle}</p>
      <svg className="bountiesExactBoard__strings" viewBox="0 0 1186 752" aria-hidden="true" focusable="false">
        <path d="M154 102 C 330 190, 846 190, 1032 102" />
        <path d="M154 102 L 87 276" />
        <path d="M1032 102 L 1090 278" />
      </svg>
      <div className="bountiesExactBoard__notes">
        {surface.postedOrders.notes.map((note) => (
          <BoardNote
            key={note.id}
            note={note}
            surface={surface}
            onSelectOrder={onSelectOrder}
            onNotePrimaryAction={onNotePrimaryAction}
          />
        ))}
      </div>
      <div className="bountiesExactBoard__sideTalisman" aria-hidden="true">
        <span>夜</span><span>雅</span><span>武</span><span>度</span><span>法</span>
      </div>
    </section>
  );
}

function Office({
  surface,
  onClaimAllReady,
  onRefreshBoard,
}: Pick<BountiesExactScreenProps, 'surface' | 'onClaimAllReady' | 'onRefreshBoard'>) {
  const office = surface.office;
  return (
    <aside className="bountiesExactOffice bountiesExactRail" data-testid="bounties-exact-office" aria-label="Bounty Office">
      <h2>{office.title}</h2>
      <section className="bountiesExactOfficeSection">
        <h3>{office.meritReserve.title}</h3>
        <strong className="bountiesExactOfficeReserve">{office.meritReserve.value}</strong>
        <div className="bountiesExactProgress">
          <span style={{ width: `${office.meritReserve.progressPct}%` }} />
        </div>
        <p>{office.meritReserve.body}</p>
      </section>
      <section className="bountiesExactOfficeSection">
        <h3>{office.claimQueue.title}</h3>
        <p className="bountiesExactOfficeReady">{office.claimQueue.countText}</p>
        <Button action={office.claimQueue.primaryButton} onClick={onClaimAllReady} />
        <Button action={office.claimQueue.secondaryButton} onClick={onRefreshBoard} />
      </section>
      <section className="bountiesExactOfficeSection">
        <h3>{office.nextBestUse.title}</h3>
        <p>{office.nextBestUse.body}</p>
        <span className="bountiesExactMiniSeal" aria-hidden="true" />
      </section>
    </aside>
  );
}

function BottomActions({
  surface,
  onTrackSelected,
  onClaimReady,
  onRouteNow,
}: Pick<BountiesExactScreenProps, 'surface' | 'onTrackSelected' | 'onClaimReady' | 'onRouteNow'>) {
  return (
    <section className="bountiesExactBottomActions" data-testid="bounties-exact-bottom-actions" aria-label="Bounty actions">
      <Button action={surface.bottomActions.trackSelected} onClick={onTrackSelected} />
      <Button action={surface.bottomActions.claimReady} onClick={onClaimReady} />
      <Button action={surface.bottomActions.routeNow} onClick={onRouteNow} />
    </section>
  );
}

export function BountiesExactScreen({
  surface,
  scale = 1,
  onSelectOrder,
  onTrackSelected,
  onClaimReady,
  onClaimAllReady,
  onRouteNow,
  onRouteNotice,
  onRefreshBoard,
  onNotePrimaryAction,
  onMandateRouteAction,
}: BountiesExactScreenProps) {
  const paper = getBountiesExactAssetSrc('paperUnderlay', surface.assets);
  const board = getBountiesExactAssetSrc('boardTexture', surface.assets);
  return (
    <article
      className="bountiesExactPage"
      data-testid={surface.meta.rootTestId}
      data-mode={surface.meta.mode}
      style={{
        '--bounties-exact-scale': String(scale),
        '--bounties-exact-paper-underlay': `url("${paper}")`,
        '--bounties-exact-board-texture': `url("${board}")`,
      } as React.CSSProperties}
    >
      <div className="bountiesExactPlane" data-testid="bounties-exact-plane">
        <div className="bountiesExactBackdrop" aria-hidden="true" />
        <Header surface={surface} />
        <div className="bountiesExactStatusPlaque" data-testid="bounties-exact-status-plaque">
          <strong>{surface.page.statusPlaque}</strong>
          <span className="bountiesExactSeal bountiesExactSeal--small" aria-hidden="true" />
        </div>
        <StatStrip surface={surface} />
        <ModuleSourceSinkPanel
          projection={surface.mandateSourceSink}
          className="bountiesExactMandateSourceSink"
          title="Merit route"
          onRouteAction={onMandateRouteAction}
        />
        <TrackedRail surface={surface} onRouteNotice={onRouteNotice} onTrackSelected={onTrackSelected} />
        <PostedOrders surface={surface} onSelectOrder={onSelectOrder} onNotePrimaryAction={onNotePrimaryAction} />
        <Office surface={surface} onClaimAllReady={onClaimAllReady} onRefreshBoard={onRefreshBoard} />
        <BottomActions surface={surface} onTrackSelected={onTrackSelected} onClaimReady={onClaimReady} onRouteNow={onRouteNow} />
        <aside data-testid="bounties-exact-shell-flags" hidden>{JSON.stringify(surface.shell)}</aside>
        <aside data-testid="bounties-exact-debug" hidden>{JSON.stringify(surface.debug ?? {})}</aside>
      </div>
    </article>
  );
}
