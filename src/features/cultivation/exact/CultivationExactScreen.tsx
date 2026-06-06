import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { DantianOrb } from '../../../ui/cultivation/DantianOrb.js';
import { QiLotusIcon } from '../../../ui/cultivation/QiLotusIcon.js';
import { VerseMiniBar } from '../../../ui/cultivation/VerseMiniBar.js';
import type {
  CultivationBreakthroughReadinessSurfaceV1,
  CultivationButtonSurface,
  CultivationDrawerSurface,
  CultivationExactDrawerId,
  CultivationExactSurfaceV1,
  CultivationSealCardSurface,
  CultivationDoctrineSealSurface,
  CultivationRibbonCellSurface,
} from './cultivationExactTypes.js';
import { CULTIVATION_EXACT_ASSETS } from './cultivationExactAssetRegistry.js';
import { CultivationExactIcon } from './CultivationExactIcon.js';

export interface CultivationExactScreenProps {
  surface: CultivationExactSurfaceV1;
  onCommandAction?: (button: CultivationButtonSurface) => void;
  onOpenDrawer?: (drawerId: CultivationExactDrawerId) => void;
  onCloseDrawer?: () => void;
  onOpenDaoHeart?: () => void;
  onDantianAnchorChange?: (anchor: { x: number; y: number } | null) => void;
}

function toneClass(base: string, tone: string): string {
  return `${base} ${base}--${tone}`;
}

function RibbonCell({ cell }: { cell: CultivationRibbonCellSurface }) {
  return (
    <div className={toneClass('cultivationExactRibbonCell', cell.tone)} data-cell-id={cell.id} title={cell.tooltip}>
      <span className="cultivationExactRibbonCell__icon">
        <CultivationExactIcon iconKey={cell.iconKey} />
      </span>
      <span className="cultivationExactRibbonCell__copy">
        <span className="cultivationExactRibbonCell__label">{cell.label}</span>
        <strong className="cultivationExactRibbonCell__primary">{cell.primary}</strong>
        {cell.secondary ? <span className="cultivationExactRibbonCell__secondary">{cell.secondary}</span> : null}
      </span>
    </div>
  );
}

function MilestoneSealCard({
  seal,
  onOpenDrawer,
}: {
  seal: CultivationSealCardSurface;
  onOpenDrawer?: (drawerId: CultivationExactDrawerId) => void;
}) {
  const canOpen = Boolean(seal.opensDrawer && onOpenDrawer);
  const Element = canOpen ? 'button' : 'div';

  return (
    <Element
      type={canOpen ? 'button' : undefined}
      className={toneClass('cultivationExactSealCard', seal.tone)}
      data-seal-id={seal.id}
      onClick={canOpen ? () => onOpenDrawer?.(seal.opensDrawer ?? 'milestone') : undefined}
    >
      <span className="cultivationExactSealCard__icon">
        <CultivationExactIcon iconKey={seal.iconKey} />
      </span>
      <span className="cultivationExactSealCard__copy">
        <span className="cultivationExactSealCard__eyebrow">{seal.eyebrow}</span>
        <strong className="cultivationExactSealCard__title">{seal.title}</strong>
        {seal.value ? <span className="cultivationExactSealCard__value">{seal.value}</span> : null}
      </span>
      <span className="cultivationExactSealCard__stamp" aria-hidden="true" />
    </Element>
  );
}

function DoctrineSealCard({
  seal,
  onOpenDrawer,
}: {
  seal: CultivationDoctrineSealSurface;
  onOpenDrawer?: (drawerId: CultivationExactDrawerId) => void;
}) {
  return (
    <button
      type="button"
      className={toneClass('cultivationExactDoctrineSeal', seal.tone)}
      data-doctrine-id={seal.id}
      onClick={() => onOpenDrawer?.(seal.opensDrawer)}
    >
      <span className="cultivationExactDoctrineSeal__icon">
        <CultivationExactIcon iconKey={seal.iconKey} />
      </span>
      <span className="cultivationExactDoctrineSeal__copy">
        <span className="cultivationExactDoctrineSeal__label">{seal.label}</span>
        <strong className="cultivationExactDoctrineSeal__value">{seal.value}</strong>
        {seal.subvalue ? <span className="cultivationExactDoctrineSeal__subvalue">{seal.subvalue}</span> : null}
      </span>
      <span className="cultivationExactDoctrineSeal__stamp" aria-hidden="true" />
    </button>
  );
}

function CommandButton({
  button,
  kind,
  onCommandAction,
}: {
  button: CultivationButtonSurface;
  kind: 'primary' | 'secondary' | 'drawer';
  onCommandAction?: (button: CultivationButtonSurface) => void;
}) {
  return (
    <button
      type="button"
      className={`cultivationExactCommandButton cultivationExactCommandButton--${kind} cultivationExactCommandButton--${button.tone}`}
      data-action-key={button.actionKey}
      disabled={button.disabled}
      title={button.reason}
      onClick={() => onCommandAction?.(button)}
    >
      <span className="cultivationExactCommandButton__label">{button.label}</span>
    </button>
  );
}

function BreakthroughReadinessPanel({
  readiness,
  onCommandAction,
}: {
  readiness: CultivationBreakthroughReadinessSurfaceV1;
  onCommandAction?: (button: CultivationButtonSurface) => void;
}) {
  return (
    <section
      className={`cultivationExactBreakthroughReadiness cultivationExactBreakthroughReadiness--${readiness.state}`}
      data-region="breakthrough-readiness"
      data-testid="cultivation-breakthrough-readiness"
      data-risk-band={readiness.risk?.band ?? 'none'}
      data-confirmation-required={readiness.risk?.confirmationRequired ? 'true' : 'false'}
      aria-label={readiness.title}
    >
      <span className="cultivationExactBreakthroughReadiness__title">{readiness.title}</span>
      <strong className="cultivationExactBreakthroughReadiness__headline">{readiness.headline}</strong>
      <div className="cultivationExactBreakthroughReadiness__rows" role="list">
        {readiness.rows.map((row) => (
          <span
            key={row.id}
            className={`cultivationExactBreakthroughReadiness__row cultivationExactBreakthroughReadiness__row--${row.tone ?? 'neutral'}`}
            data-row-id={row.id}
            data-tone={row.tone ?? 'neutral'}
            role="listitem"
            aria-label={`${row.label}: ${row.value}`}
          >
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </span>
        ))}
      </div>
        {readiness.primaryAction ? (
          <CommandButton button={readiness.primaryAction} kind="drawer" onCommandAction={onCommandAction} />
        ) : null}
        {readiness.topFixActions && readiness.topFixActions.length > 0 ? (
          <div className="cultivationExactBreakthroughReadiness__fixes" aria-label="Best Improvements">
            {readiness.topFixActions.map((action) => (
              <CommandButton key={`${action.actionKey}-${action.label}`} button={action} kind="drawer" onCommandAction={onCommandAction} />
            ))}
          </div>
        ) : null}
      </section>
    );
  }

export function CultivationExactScreen({
  surface,
  onCommandAction,
  onOpenDrawer,
  onCloseDrawer,
  onOpenDaoHeart,
  onDantianAnchorChange,
}: CultivationExactScreenProps) {
  const fillPercent = surface.qiRail.displayPercent ?? surface.qiRail.percent;
  const [measuredAnchors, setMeasuredAnchors] = useState<{
    dantianX: number;
    dantianY: number;
    ritualTop: number;
  } | null>(null);
  const rootStyle = {
    '--cult-exact-qi-pct': `${fillPercent}%`,
    ...(measuredAnchors
      ? {
          '--cult-exact-dantian-cx': `${measuredAnchors.dantianX}px`,
          '--cult-exact-dantian-cy': `${measuredAnchors.dantianY}px`,
          '--cult-exact-ritual-top': `${measuredAnchors.ritualTop}px`,
        }
      : {}),
  } as CSSProperties;
  const isCultivating = surface.meta.activityState === 'cultivating' || surface.meta.activityState === 'near_edge';
  const isNearReady = surface.centerAltar.dantian.state === 'near_ready';
  const isReady = surface.centerAltar.dantian.state === 'ready';
  const cultivationRootRef = useRef<HTMLDivElement | null>(null);
  const heroPlateRef = useRef<HTMLDivElement | null>(null);
  const dantianAnchorRef = useRef<HTMLDivElement | null>(null);
  const ritualStackRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const measureAnchor = () => {
      const root = cultivationRootRef.current;
      const hero = heroPlateRef.current;
      const anchor = dantianAnchorRef.current;
      const ritualStack = ritualStackRef.current;
      if (!root || !anchor) {
        setMeasuredAnchors(null);
        onDantianAnchorChange?.(null);
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const heroRect = hero?.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const stackRect = ritualStack?.getBoundingClientRect();
      const navRect = Array.from(document.querySelectorAll<HTMLElement>('.bottomNavDock__rail'))
        .map((element) => element.getBoundingClientRect())
        .find((rect) => rect.width > 0 && rect.height > 0 && rect.top > rootRect.top);
      const dantianX = Math.round(anchorRect.left - rootRect.left + anchorRect.width / 2);
      const dantianY = Math.round(anchorRect.top - rootRect.top + anchorRect.height / 2);
      const heroHeight = heroRect?.height ?? rootRect.height * 0.72;
      const stackHeight = stackRect?.height ?? Math.min(250, rootRect.height * 0.24);
      const navTop = navRect ? navRect.top - rootRect.top : rootRect.height - Math.max(78, rootRect.height * 0.09);
      const desiredTop = dantianY + heroHeight * 0.14;
      const bottomBreathingRoom = Math.max(10, rootRect.height * 0.012);
      const maxTop = navTop - stackHeight - bottomBreathingRoom;
      const ritualTop = Math.round(Math.min(desiredTop, maxTop));
      const nextAnchors = { dantianX, dantianY, ritualTop };

      setMeasuredAnchors((current) => (
        current
          && current.dantianX === nextAnchors.dantianX
          && current.dantianY === nextAnchors.dantianY
          && current.ritualTop === nextAnchors.ritualTop
          ? current
          : nextAnchors
      ));
      onDantianAnchorChange?.({ x: dantianX, y: dantianY });
    };

    measureAnchor();
    window.addEventListener('resize', measureAnchor);

    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', measureAnchor);
    }

    const observer = new ResizeObserver(measureAnchor);
    if (cultivationRootRef.current) observer.observe(cultivationRootRef.current);
    if (heroPlateRef.current) observer.observe(heroPlateRef.current);
    if (dantianAnchorRef.current) observer.observe(dantianAnchorRef.current);
    if (ritualStackRef.current) observer.observe(ritualStackRef.current);

    return () => {
      window.removeEventListener('resize', measureAnchor);
      observer.disconnect();
    };
  }, [onDantianAnchorChange]);

  return (
    <div
      ref={cultivationRootRef}
      className="cultivationExactPage"
      data-testid={surface.meta.rootTestId}
      data-state={surface.meta.activityState}
      data-mode={surface.meta.mode}
      data-root-test-id={surface.meta.rootTestId}
      data-fx-quality={surface.meta.fxQuality}
      data-reduced-motion={surface.meta.reducedMotion ? 'true' : 'false'}
      style={rootStyle}
    >
      <section className="cultivationExactTopRibbon" data-region="top-ribbon" aria-label="Cultivation identity">
        {surface.topRibbon.map((cell) => <RibbonCell key={cell.id} cell={cell} />)}
      </section>

      <aside className="cultivationExactMilestoneRail" data-region="left-milestone-seals" aria-label="Cultivation milestone seals">
        <div className="cultivationExactRailHandle cultivationExactRailHandle--left" aria-hidden="true" />
        {surface.leftMilestoneSeals.map((seal) => (
          <MilestoneSealCard key={seal.id} seal={seal} onOpenDrawer={onOpenDrawer} />
        ))}
      </aside>

      <main className="cultivationExactAltarField" data-region="center-altar" aria-label="Dantian altar">
        <div className="cultivationExactHeroPlate" ref={heroPlateRef}>
          <img className="cultivationExactHeroArt" src={CULTIVATION_EXACT_ASSETS.cbg_full} alt="" aria-hidden="true" />
          <div className="cultivationExactAuraAnchor" aria-hidden="true">
            <div className="cultivationExactHalo cultivationExactHalo--outer" />
            {surface.centerAltar.ringLayers.map((layer) => (
              <div
                key={layer.id}
                className={`cultivationExactRingLayer cultivationExactRingLayer--${layer.id} cultivationExactRingLayer--${layer.intensity} cultivationExactRingLayer--tone-${layer.tone}`}
              />
            ))}
            <div className="cultivationExactQiMotes">
              {Array.from({ length: 8 }, (_, index) => <span key={index} className={`cultivationExactQiMote cultivationExactQiMote--${index + 1}`} />)}
            </div>
          </div>
          <div className="cultivationExactDantianAnchor" data-testid="cultivation-dantian-anchor" ref={dantianAnchorRef}>
            <DantianOrb
              heartLawTags={surface.centerAltar.dantian.heartLawTags}
              isCultivating={isCultivating}
              isNearReady={isNearReady}
              isReady={isReady}
            />
          </div>
          <div className="cultivationExactLotusState" aria-label={`Lotus state: ${surface.centerAltar.lotus.label}`}>
            <QiLotusIcon state={surface.centerAltar.lotus.state} className="cultivationExactLotusState__icon" fixed />
            <span className="cultivationExactLotusState__label">{surface.centerAltar.lotus.label}</span>
          </div>
          <div className="cultivationExactAltarTrim" aria-hidden="true" />
          <div className="cultivationExactMistMask" aria-hidden="true" />
        </div>
      </main>

      <aside className="cultivationExactDoctrineRail" data-region="right-doctrine-rail" aria-label="Doctrine seals">
        <button
          type="button"
          className="cultivationExactDaoSeal"
          aria-label="Open Dao Heart"
          aria-haspopup="dialog"
          onClick={onOpenDaoHeart}
        >
          <span className="cultivationExactDaoSeal__cord" aria-hidden="true" />
          <span className="cultivationExactDaoSeal__text">{surface.daoSeal.value}</span>
        </button>
        <div className="cultivationExactRailHandle cultivationExactRailHandle--right" aria-hidden="true" />
        {surface.rightDoctrineSeals.map((seal) => (
          <DoctrineSealCard key={seal.id} seal={seal} onOpenDrawer={onOpenDrawer} />
        ))}
      </aside>

      <div className="cultivationExactLowerAtmosphere" aria-hidden="true">
        <span className="cultivationExactLowerAtmosphere__terraceShadow" />
        <span className="cultivationExactLowerAtmosphere__mist" />
        <span className="cultivationExactLowerAtmosphere__breathLine" />
      </div>

      <section className="cultivationExactRitualStack" data-region="ritual-stack" ref={ritualStackRef}>
        <section className={`cultivationExactBreakthroughSeal cultivationExactBreakthroughSeal--${surface.breakthroughSeal.state}`} data-region="breakthrough-seal">
          <span className="cultivationExactBreakthroughSeal__label">{surface.breakthroughSeal.label}</span>
          <strong className="cultivationExactBreakthroughSeal__value">{surface.breakthroughSeal.value}</strong>
        </section>

        <BreakthroughReadinessPanel
          readiness={surface.breakthroughReadiness}
          onCommandAction={onCommandAction}
        />

        <section
          className={`cultivationExactQiRail cultivationExactQiRail--${surface.qiRail.state}`}
          data-region="qi-rail"
          data-testid="cultivation-qi-lane"
          aria-label={surface.qiRail.combinedLabel}
        >
          <span className="cultivationExactQiRail__lotus">
            <QiLotusIcon state={surface.centerAltar.lotus.state} fixed />
          </span>
          <img className="cultivationExactQiRail__frame" src={CULTIVATION_EXACT_ASSETS.bar_long} alt="" aria-hidden="true" />
          <span className="cultivationExactQiRail__track" aria-hidden="true">
            <span className="cultivationExactQiRail__fill" />
            <span className="cultivationExactQiRail__edge" />
          </span>
          <span className="cultivationExactQiRail__label">{surface.qiRail.combinedLabel}</span>
          <span className="cultivationExactQiRail__rate">{surface.qiRail.rateLabel}</span>
        </section>

        <section className="cultivationExactCommandDeck" data-region="command-deck" aria-label="Cultivation commands">
          <CommandButton button={surface.commandDeck.primary} kind="primary" onCommandAction={onCommandAction} />
          <p className="cultivationExactCommandDeck__support">{surface.commandDeck.supportLine}</p>
          {surface.commandDeck.secondary ? (
            <CommandButton button={surface.commandDeck.secondary} kind="secondary" onCommandAction={onCommandAction} />
          ) : null}
        </section>
      </section>

      <CultivationExactDrawerLayer
        surface={surface}
        selected={surface.meta.selectedDrawer}
        onCloseDrawer={onCloseDrawer}
        onCommandAction={onCommandAction}
      />
    </div>
  );
}

function DrawerRows({ drawer }: { drawer: CultivationDrawerSurface }) {
  return (
    <div className="cultivationExactDrawer__rows">
      {drawer.rows.map((row) => (
        <div key={row.id} className={`cultivationExactDrawer__row cultivationExactDrawer__row--${row.tone ?? 'neutral'}`}>
          <span className="cultivationExactDrawer__rowLabel">{row.label}</span>
          <strong className="cultivationExactDrawer__rowValue">{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

function CultivationExactDrawerLayer({
  surface,
  selected,
  onCloseDrawer,
  onCommandAction,
}: {
  surface: CultivationExactSurfaceV1;
  selected: CultivationExactDrawerId;
  onCloseDrawer?: () => void;
  onCommandAction?: (button: CultivationButtonSurface) => void;
}) {
  if (selected === 'none') return null;
  const drawer = surface.drawers[selected];
  if (!drawer) return null;

  return (
    <div className="cultivationExactDrawerLayer" data-selected-drawer={selected}>
      <button type="button" className="cultivationExactDrawerLayer__scrim" aria-label="Close detail drawer" onClick={onCloseDrawer} />
      <aside className={`cultivationExactDrawer cultivationExactDrawer--${drawer.side}`} role="dialog" aria-modal="false" aria-label={drawer.title}>
        <header className="cultivationExactDrawer__header">
          <div>
            <h2 className="cultivationExactDrawer__title">{drawer.title}</h2>
            {drawer.subtitle ? <p className="cultivationExactDrawer__subtitle">{drawer.subtitle}</p> : null}
          </div>
          <button type="button" className="cultivationExactDrawer__close" aria-label="Close detail drawer" onClick={onCloseDrawer}>Close</button>
        </header>
        <DrawerRows drawer={drawer} />
        {drawer.verse ? (
          <VerseMiniBar
            chapter={drawer.verse.chapter}
            comprehension={drawer.verse.comprehension}
            requirement={drawer.verse.requirement}
            title={drawer.verse.title}
            isComplete={drawer.verse.isComplete}
            placeholderLabel={drawer.verse.placeholderLabel}
            placeholderValue={drawer.verse.placeholderValue}
            lotusState={surface.centerAltar.lotus.state}
            lotusLabel={surface.centerAltar.lotus.label}
            className="cultivationExactDrawer__verse"
          />
        ) : null}
        {drawer.action ? <CommandButton button={drawer.action} kind="drawer" onCommandAction={onCommandAction} /> : null}
      </aside>
    </div>
  );
}
