import type React from 'react';
import { GameIcon } from '../../../ui/icons/index.js';
import { getForgeExactAssetSrc } from './forgeExactAssetRegistry.js';
import type {
  ForgeExactButtonSurface,
  ForgeExactCenterStage,
  ForgeExactMaterialInspector,
  ForgeExactModeRow,
  ForgeExactSurfaceV1,
  ForgeExactTabRow,
} from './forgeExactTypes.js';

export interface ForgeExactScreenProps {
  surface: ForgeExactSurfaceV1;
  scale?: number;
  activeSessionNode?: React.ReactNode;
  onAction?: (action: ForgeExactButtonSurface) => void;
}

function buttonClass(action: ForgeExactButtonSurface, extra = ''): string {
  return [
    'forgeExactButton',
    `forgeExactButton--${action.variant}`,
    action.enabled ? '' : 'forgeExactButton--disabled',
    extra,
  ].filter(Boolean).join(' ');
}

function handleAction(action: ForgeExactButtonSurface, onAction?: (action: ForgeExactButtonSurface) => void) {
  if (!action.enabled) return;
  onAction?.(action);
}

function ExactButton(props: {
  action: ForgeExactButtonSurface;
  className?: string;
  onAction?: (action: ForgeExactButtonSurface) => void;
}) {
  return (
    <button
      type="button"
      className={buttonClass(props.action, props.className)}
      data-action-id={props.action.id}
      data-intent={props.action.intent}
      disabled={!props.action.enabled}
      title={props.action.reasonIfDisabled}
      onClick={() => handleAction(props.action, props.onAction)}
    >
      <span>{props.action.label}</span>
    </button>
  );
}

function TitleBlock({ surface }: Pick<ForgeExactScreenProps, 'surface'>) {
  return (
    <header className="forgeExactTitleBlock" data-testid="forge-exact-title">
      <div className="forgeExactTitleBlock__row">
        <h1>{surface.page.title}</h1>
        <span className="forgeExactCinnabarSeal" aria-hidden="true" />
      </div>
      <p>{surface.page.subtitle}</p>
    </header>
  );
}

function TopStrip({ surface }: Pick<ForgeExactScreenProps, 'surface'>) {
  return (
    <section className="forgeExactTopStrip" data-testid="forge-exact-top-strip" aria-label="Forge permanent floor summary">
      {surface.topTruthStrip.map((cell) => (
        <div key={cell.id} className={`forgeExactTruthCell forgeExactStatus--${cell.status}`} data-cell-id={cell.id}>
          <span className="forgeExactTruthCell__icon">
            <GameIcon icon={cell.icon} size={42} decorative />
          </span>
          <span className="forgeExactTruthCell__copy">
            <span>{cell.label}</span>
            <strong>{cell.value}</strong>
          </span>
        </div>
      ))}
    </section>
  );
}

function tabAction(row: ForgeExactTabRow): ForgeExactButtonSurface {
  return {
    id: `select-tab-${row.id}`,
    label: row.label,
    enabled: row.enabled,
    reasonIfDisabled: row.enabled ? undefined : 'No visible live blueprint in this discipline.',
    variant: 'ghost',
    intent: 'select-tab',
    tab: row.id,
  };
}

function modeAction(row: ForgeExactModeRow): ForgeExactButtonSurface {
  return {
    id: `select-mode-${row.id}`,
    label: row.label,
    enabled: row.enabled,
    reasonIfDisabled: row.note,
    variant: 'ghost',
    intent: 'select-mode',
    mode: row.id,
  };
}

function LeftRail({ surface, onAction }: ForgeExactScreenProps) {
  return (
    <aside className="forgeExactLeftRail forgeExactCard" data-testid="forge-exact-left-rail" aria-label="Forge discipline controls">
      <h2>{surface.leftRail.title}</h2>
      <div className="forgeExactTabList" role="list">
        {surface.leftRail.tabs.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`forgeExactTabButton forgeExactTabButton--${row.id} ${row.selected ? 'forgeExactTabButton--selected' : ''}`}
            disabled={!row.enabled}
            title={row.description}
            onClick={() => handleAction(tabAction(row), onAction)}
          >
            <span className="forgeExactTabButton__icon">
              <GameIcon icon={row.icon} size={38} decorative />
            </span>
            <span>{row.label}</span>
          </button>
        ))}
      </div>

      <section className="forgeExactModePanel" aria-label="Forge Mode">
        <h3>Forge Mode</h3>
        <div className="forgeExactModeRows">
          {surface.leftRail.modes.map((row) => (
            <button
              key={row.id}
              type="button"
              className={`forgeExactModeRow forgeExactStatus--${row.status} ${row.selected ? 'forgeExactModeRow--selected' : ''}`}
              disabled={!row.enabled}
              title={row.note}
              onClick={() => handleAction(modeAction(row), onAction)}
            >
              <span className="forgeExactModeRow__radio" aria-hidden="true" />
              <span className="forgeExactModeRow__label">{row.label}</span>
              {row.badge ? <span className="forgeExactModeRow__badge">{row.badge}</span> : null}
              {row.note && !row.badge ? <span className="forgeExactModeRow__note">{row.note}</span> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="forgeExactTools" aria-label="Forge tools">
        <h3>Tools</h3>
        <div className="forgeExactToolRows">
          {surface.leftRail.tools.map((tool) => (
            <div key={tool.id} className={`forgeExactToolRow forgeExactStatus--${tool.status}`}>
              <span className="forgeExactToolRow__icon">
                <GameIcon icon={tool.icon} size={32} decorative />
              </span>
              <span>{tool.label}</span>
              <strong>{tool.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function CenterHeader({ surface }: Pick<ForgeExactScreenProps, 'surface'>) {
  return (
    <section className="forgeExactCenterHeader" data-testid="forge-exact-center-header" aria-label="Forge center header">
      <div className="forgeExactCenterHeader__plaque">
        <h2>{surface.centerHeader.title}</h2>
      </div>
      <p>{surface.centerHeader.subtitle}</p>
      <div className="forgeExactChipRow">
        {surface.centerHeader.chips.map((chip) => (
          <span key={chip.id} className={`forgeExactChip forgeExactStatus--${chip.status}`}>
            {chip.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function StageSeal({ stage }: { stage: ForgeExactCenterStage }) {
  return (
    <div className={`forgeExactReadinessSeal forgeExactStatus--${stage.readinessSeal.status}`} data-testid="forge-exact-readiness-seal">
      <span className="forgeExactReadinessSeal__check">
        <GameIcon icon="inkCheck" size={34} decorative />
      </span>
      <strong>{stage.readinessSeal.kicker}</strong>
      <strong>{stage.readinessSeal.title}</strong>
      <span>{stage.readinessSeal.stat}</span>
      <p>{stage.readinessSeal.detail}</p>
    </div>
  );
}

function CenterStage({ surface, activeSessionNode }: ForgeExactScreenProps) {
  const stage = surface.centerStage;
  const image = getForgeExactAssetSrc(stage.assetKey, surface.assets);
  return (
    <section className={`forgeExactCenterStage forgeExactCenterStage--${stage.mood}`} data-testid="forge-exact-center-stage" aria-label="Forge center stage">
      <div className="forgeExactStagePlate">
        <img className="forgeExactStageImage" src={image} alt="" aria-hidden="true" />
        <span className="forgeExactStageSmoke forgeExactStageSmoke--one" aria-hidden="true" />
        <span className="forgeExactStageSmoke forgeExactStageSmoke--two" aria-hidden="true" />
        {stage.activeSessionEmbedded && activeSessionNode ? (
          <div className="forgeExactHandsOnHost" data-testid="forge-exact-hands-on-host">{activeSessionNode}</div>
        ) : (
          <>
            <StageSeal stage={stage} />
            <div className="forgeExactWorkpieceLabel">{stage.workpieceLabel}</div>
          </>
        )}
        {stage.resultOverlay ? (
          <div className="forgeExactResultOverlay" data-testid="forge-exact-result-overlay">
            <h3>{stage.resultOverlay.title}</h3>
            {stage.resultOverlay.lines.map((line) => <p key={line}>{line}</p>)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function OutputPreview({ inspector }: { inspector: ForgeExactMaterialInspector }) {
  return (
    <section className="forgeExactInspectorSection forgeExactOutputPreview">
      <h3>{inspector.outputPreview.title}</h3>
      <div className="forgeExactOutputPreview__item">
        <span className="forgeExactOutputPreview__icon">
          <GameIcon icon={inspector.outputPreview.itemIcon} size={58} decorative />
        </span>
        <div>
          <strong>{inspector.outputPreview.itemName}</strong>
          <span>{inspector.outputPreview.upgradeLabel}</span>
        </div>
      </div>
      <div className="forgeExactPreviewRows">
        {inspector.outputPreview.rows.map((row) => (
          <div key={row.id} className={`forgeExactPreviewRow forgeExactStatus--${row.status}`}>
            <span>{row.label}</span>
            <span>{row.before}</span>
            <span className="forgeExactPreviewRow__arrow">-&gt;</span>
            <strong>{row.after}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function RightInspector({ surface, onAction }: ForgeExactScreenProps) {
  const inspector = surface.rightInspector;
  return (
    <aside className="forgeExactRightInspector forgeExactCard" data-testid="forge-exact-right-inspector" aria-label="Forge material inspector">
      <h2>{inspector.title}</h2>
      <section className="forgeExactInspectorSection">
        <h3>{inspector.materialsTitle}</h3>
        <div className="forgeExactMaterialRows">
          {inspector.materialRows.map((row) => (
            <div key={row.id} className={`forgeExactMaterialRow forgeExactStatus--${row.status}`}>
              <span className="forgeExactMaterialRow__icon">
                <GameIcon icon={row.icon} size={34} decorative />
              </span>
              <span>{row.label}</span>
              <strong>{row.valueLabel}</strong>
            </div>
          ))}
        </div>
      </section>
      <OutputPreview inspector={inspector} />
      <section className="forgeExactInspectorSection">
        <h3>{inspector.bestSources.title}</h3>
        <div className="forgeExactSourceButtons">
          {inspector.bestSources.buttons.map((action) => (
            <button
              key={action.id}
              type="button"
              className="forgeExactSourceButton"
              disabled={!action.enabled}
              title={action.reasonIfDisabled}
              onClick={() => handleAction(action, onAction)}
            >
              <GameIcon icon={action.icon} size={28} decorative />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="forgeExactRecommendation">
        <h3>{inspector.recommendation.title}</h3>
        <p>{inspector.recommendation.headline}</p>
        <p>{inspector.recommendation.reason}</p>
        <span className="forgeExactCinnabarSeal forgeExactCinnabarSeal--small" aria-hidden="true" />
      </section>
    </aside>
  );
}

function FloorRail({ surface }: Pick<ForgeExactScreenProps, 'surface'>) {
  return (
    <section className="forgeExactFloorRail" data-testid="forge-exact-floor-rail" aria-label="Permanent floor rail">
      <h2>{surface.floorRail.title}</h2>
      <div className="forgeExactFloorRail__track">
        {surface.floorRail.nodes.map((node) => (
          <div key={node.id} className={`forgeExactFloorNode forgeExactStatus--${node.status}`}>
            <span className="forgeExactFloorNode__medallion">
              <GameIcon icon={node.icon} size={37} decorative />
            </span>
            <strong>{node.label}</strong>
            <span>{node.value}</span>
          </div>
        ))}
      </div>
      <p>{surface.floorRail.comparisonLine}</p>
    </section>
  );
}

function Actions({ surface, onAction }: ForgeExactScreenProps) {
  return (
    <section className="forgeExactActions" data-testid="forge-exact-actions" aria-label="Forge actions">
      <ExactButton action={surface.primaryAction} className="forgeExactCta forgeExactCta--primary" onAction={onAction} />
      {surface.secondaryActions.map((action) => (
        <ExactButton key={action.id} action={action} className="forgeExactCta forgeExactCta--secondary" onAction={onAction} />
      ))}
    </section>
  );
}

export function ForgeExactScreen({ surface, scale = 1, activeSessionNode, onAction }: ForgeExactScreenProps) {
  const paper = getForgeExactAssetSrc('paperBackground', surface.assets);
  return (
    <article
      className="forgeExactPage"
      data-testid={surface.meta.rootTestId}
      data-mode={surface.meta.mode}
      data-tab={surface.meta.activeTab}
      data-activity-mode={surface.meta.activityMode}
      style={{
        '--forge-exact-scale': String(scale),
        '--forge-exact-paper-background': `url("${paper}")`,
      } as React.CSSProperties}
    >
      <div className="forgeExactPlane" data-testid="forge-exact-plane">
        <TitleBlock surface={surface} />
        <TopStrip surface={surface} />
        <LeftRail surface={surface} scale={scale} onAction={onAction} />
        <CenterHeader surface={surface} />
        <CenterStage surface={surface} scale={scale} activeSessionNode={activeSessionNode} onAction={onAction} />
        <RightInspector surface={surface} scale={scale} onAction={onAction} />
        <FloorRail surface={surface} />
        <Actions surface={surface} scale={scale} onAction={onAction} />
        <aside data-testid="forge-exact-shell-flags" hidden>{JSON.stringify(surface.shell)}</aside>
        <aside data-testid="forge-exact-debug" hidden>{JSON.stringify(surface.debug ?? {})}</aside>
      </div>
    </article>
  );
}
