import type React from 'react';
import { GameIcon, ICONS, type IconId } from '../../../ui/icons/index.js';
import type {
  ManualPavilionButtonSurface,
  ManualPavilionChipSurface,
  ManualPavilionExactSurfaceV1,
  ManualPavilionFactRowSurface,
  ManualSpineTitleLength,
  ManualPavilionSpineSurface,
} from './manualPavilionExactTypes.js';

export interface ManualPavilionExactScreenProps {
  surface: ManualPavilionExactSurfaceV1;
  scale?: number;
  onReturnToWorld?: () => void;
  onSelectSpine?: (slot: ManualPavilionSpineSurface) => void;
  onRefreshStock?: () => void;
  onBuyManual?: () => void;
  onStudyLater?: () => void;
  onViewTechniques?: () => void;
  onOpenSatchel?: () => void;
}

function isKnownIcon(iconKey: string | undefined): iconKey is IconId {
  return Boolean(iconKey && iconKey in ICONS);
}

function titleLengthClass(length: ManualSpineTitleLength): string {
  if (length === 'veryLong') return 'manualPavilionSpine--titleVeryLong';
  return `manualPavilionSpine--title${length.slice(0, 1).toUpperCase()}${length.slice(1)}`;
}

function DecorativeIcon({ iconKey, size = 26 }: { iconKey?: string; size?: number }) {
  if (isKnownIcon(iconKey)) {
    return <GameIcon icon={iconKey} size={size} decorative />;
  }
  return <span className="manualPavilionExactGlyph" aria-hidden="true" data-icon-key={iconKey ?? 'none'} />;
}

function ChipList({ chips }: { chips: ManualPavilionChipSurface[] }) {
  return (
    <div className="manualPavilionExactChips" aria-label="Manual offer tags">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="manualPavilionExactChip"
          data-tone={chip.tone}
          data-source={chip.source}
        >
          <DecorativeIcon iconKey={chip.iconKey} size={22} />
          <span>{chip.label}</span>
        </span>
      ))}
    </div>
  );
}

function FactRow({ row }: { row: ManualPavilionFactRowSurface }) {
  return (
    <div className="manualPavilionFactRow" data-tone={row.tone} data-testid={`manual-pavilion-fact-${row.id}`}>
      <span className="manualPavilionFactRow__icon" aria-hidden="true">
        <DecorativeIcon iconKey={row.iconKey} size={28} />
      </span>
      <span className="manualPavilionFactRow__label">{row.label}</span>
      <span className="manualPavilionFactRow__value">{row.value}</span>
    </div>
  );
}

function ActionButton({
  button,
  className,
  onClick,
}: {
  button: ManualPavilionButtonSurface;
  className?: string;
  onClick?: () => void;
}) {
  if (!button.visible) return null;
  return (
    <button
      type="button"
      className={className}
      data-intent={button.intent}
      data-action-kind={button.actionKind}
      data-tone={button.tone}
      data-testid={button.testId}
      disabled={!button.enabled}
      aria-disabled={!button.enabled}
      aria-label={button.ariaLabel}
      title={button.enabled ? button.ariaLabel : button.disabledReason ?? button.ariaLabel}
      onClick={button.enabled ? onClick : undefined}
    >
      <span>{button.label}</span>
    </button>
  );
}

function SpineButton({
  slot,
  onSelectSpine,
}: {
  slot: ManualPavilionSpineSurface;
  onSelectSpine?: (slot: ManualPavilionSpineSurface) => void;
}) {
  const disabled = slot.state === 'placeholder';
  return (
    <button
      type="button"
      className={[
        'manualPavilionSpine',
        slot.selected ? 'manualPavilionSpine--selected' : '',
        slot.recommended ? 'manualPavilionSpine--recommended' : '',
        slot.duplicate ? 'manualPavilionSpine--duplicate' : '',
        slot.sold ? 'manualPavilionSpine--sold' : '',
        slot.sealed ? 'manualPavilionSpine--sealed' : '',
        slot.notSold ? 'manualPavilionSpine--notSold' : '',
        titleLengthClass(slot.titleLength),
      ].filter(Boolean).join(' ')}
      data-state={slot.state}
      data-lifecycle={slot.lifecycleState}
      data-stock-state={slot.stockState}
      data-recommendation={slot.recommendationState}
      data-path={slot.pathLabel}
      data-rarity={slot.rarityLabel}
      data-selected={slot.selected ? 'true' : 'false'}
      data-slot-index={slot.slotIndex ?? ''}
      data-testid={slot.testId}
      aria-pressed={slot.selected}
      aria-label={slot.ariaLabel}
      disabled={disabled}
      onClick={() => onSelectSpine?.(slot)}
    >
      <span
        className="manualPavilionSpine__backplate"
        aria-hidden="true"
        style={{ backgroundImage: `url("${slot.spineVisual.assetKey}")` }}
      />
      <span className="manualPavilionSpine__iconMedallion" aria-hidden="true">
        <DecorativeIcon iconKey={slot.spineVisual.iconKey} size={36} />
      </span>
      <span
        className="manualPavilionSpine__title"
        data-testid={`manual-spine-title-${slot.slotIndex ?? 'placeholder'}`}
        title={slot.title}
      >
        <span className="manualPavilionSpine__titleText">{slot.displayTitle}</span>
      </span>
      <span className="manualPavilionSpine__meta">
        <span>{slot.gradeLabel}</span>
        <span>{slot.roleLabel}</span>
      </span>
      <span className="manualPavilionSpine__seal" data-seal={slot.spineVisual.sealKey} data-testid={`manual-spine-state-${slot.slotIndex ?? 'placeholder'}`}>
        {slot.stateLabel}
      </span>
      <span className="manualPavilionSpine__tagSlot" data-testid={`manual-spine-reason-${slot.slotIndex ?? 'placeholder'}`}>
        {slot.primaryReasonLabel}
      </span>
    </button>
  );
}

function Inspector({
  surface,
  onBuyManual,
  onStudyLater,
  onViewTechniques,
}: Pick<ManualPavilionExactScreenProps, 'surface' | 'onBuyManual' | 'onStudyLater' | 'onViewTechniques'>) {
  const disabledReason =
    !surface.inspector.buyButton.enabled
      ? surface.inspector.buyButton.disabledReason
      : !surface.inspector.studyLaterButton.enabled
        ? surface.inspector.studyLaterButton.disabledReason
        : null;
  return (
    <aside className="manualPavilionInspector" aria-label="Selected manual inspector" data-region="inspector" data-testid="manual-pavilion-inspector">
      <div className="manualPavilionInspector__roll manualPavilionInspector__roll--top" aria-hidden="true" />
      <div className="manualPavilionInspector__content">
        <div className="manualPavilionInspector__stamp" data-tone={surface.inspector.stateTone}>
          {surface.inspector.stateStamp}
        </div>
        <div className="manualPavilionInspector__body">
          <h2>{surface.inspector.title}</h2>
          <dl className="manualPavilionInspectorRows">
            {surface.inspector.rows.map((row) => (
              <div key={row.id} className="manualPavilionInspectorRow" data-tone={row.tone}>
                <dt>
                  <DecorativeIcon iconKey={row.iconKey} size={28} />
                  <span>{row.label}</span>
                </dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <section className="manualPavilionWhy" aria-labelledby="manual-pavilion-why-title">
            <h3 id="manual-pavilion-why-title">{surface.inspector.whyTitle}</h3>
            <ul>
              {surface.inspector.whyRows.map((row) => (
                <li key={row.id}>
                  <DecorativeIcon iconKey={row.iconKey} size={24} />
                  <span>{row.value}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="manualPavilionInspector__footer">
          <div className="manualPavilionCostLine" aria-label={`${surface.inspector.costTitle}: ${surface.inspector.costLine}`}>
            <span>{surface.inspector.costTitle}</span>
            <strong>{surface.inspector.costLine}</strong>
          </div>
          {disabledReason ? <p className="manualPavilionDisabledReason">{disabledReason}</p> : null}
          <div className="manualPavilionInspectorActions">
            <ActionButton
              button={{ ...surface.inspector.buyButton, testId: 'manual-pavilion-inspector-primary-action' }}
              className="manualPavilionAction manualPavilionAction--primary"
              onClick={onBuyManual}
            />
            <ActionButton
              button={{ ...surface.inspector.studyLaterButton, testId: 'manual-pavilion-inspector-secondary-action' }}
              className="manualPavilionAction manualPavilionAction--secondary"
              onClick={onStudyLater}
            />
            <ActionButton
              button={{ ...surface.inspector.viewTechniquesButton, testId: 'manual-pavilion-inspector-tertiary-action' }}
              className="manualPavilionAction manualPavilionAction--tertiary"
              onClick={onViewTechniques}
            />
          </div>
        </div>
      </div>
      <div className="manualPavilionInspector__roll manualPavilionInspector__roll--bottom" aria-hidden="true" />
    </aside>
  );
}

export function ManualPavilionExactScreen({
  surface,
  scale = 1,
  onReturnToWorld,
  onSelectSpine,
  onRefreshStock,
  onBuyManual,
  onStudyLater,
  onViewTechniques,
  onOpenSatchel,
}: ManualPavilionExactScreenProps) {
  const style = {
    '--manual-pavilion-exact-scale': String(scale),
    '--manual-pavilion-room-bg': `url("${surface.assets.background.room}")`,
    '--manual-pavilion-texture-bg': `url("${surface.assets.background.textureOverlay}")`,
  } as React.CSSProperties;

  return (
    <div
      className="manualPavilionExactPage"
      data-testid={surface.meta.rootTestId}
      data-mode={surface.meta.mode}
      data-source={surface.meta.source}
      data-selected-slot-index={surface.meta.selectedSlotIndex ?? ''}
      style={style}
    >
      <div className="manualPavilionExactPlane">
        <header className="manualPavilionTopRibbon" data-region="top-ribbon">
          <div className="manualPavilionTitleBlock">
            <h1 data-testid="manual-pavilion-title">{surface.page.title}</h1>
            <p>{surface.page.subtitle}</p>
          </div>
          <div className="manualPavilionBreadcrumb" aria-label="Location breadcrumb">
            <DecorativeIcon iconKey="recordSlip" size={36} />
            <span>{surface.page.breadcrumb}</span>
          </div>
          <div className="manualPavilionRefreshPlaque" data-tone={surface.page.stockRefreshTone}>
            <DecorativeIcon iconKey="inkRefresh" size={34} />
            <span>{surface.page.stockRefreshLabel}</span>
          </div>
          <ActionButton
            button={surface.page.returnButton}
            className="manualPavilionReturnButton"
            onClick={onReturnToWorld}
          />
        </header>

        <section className="manualPavilionBuildGap" data-region="build-gap" data-testid="manual-pavilion-build-gap" aria-label="Current build gap">
          <div className="manualPavilionBuildGap__seal" aria-hidden="true" />
          <div className="manualPavilionBuildGap__copy">
            <h2>{surface.buildGapBanner.title}:</h2>
            <p>{surface.buildGapBanner.line}</p>
          </div>
          <ChipList chips={surface.buildGapBanner.chips} />
        </section>

        <aside className="manualPavilionLedger" data-region="left-ledger" data-testid="manual-pavilion-left-ledger" aria-label="Manual Pavilion support ledger">
          <h2>{surface.leftLedger.title}</h2>
          <div className="manualPavilionLedgerRows">
            {surface.leftLedger.rows.map((row) => (
              <FactRow key={row.id} row={row} />
            ))}
          </div>
        </aside>

        <main className="manualPavilionShelf" data-region="shelf" data-testid="manual-pavilion-shelf" aria-label="Manual spine shelf">
          <div className="manualPavilionShelf__backdrop" aria-hidden="true" />
          <div className="manualPavilionShelf__header" data-testid="manual-pavilion-shelf-label">
            <span>{surface.shelf.title}</span>
            <span>{surface.shelf.totalStockLabel}</span>
          </div>
          <div className="manualPavilionShelf__spineRail" aria-label="Six primary manual spines">
            {surface.shelf.primarySlots.map((slot) => (
              <SpineButton key={slot.id} slot={slot} onSelectSpine={onSelectSpine} />
            ))}
          </div>
          <div className="manualPavilionShelf__bottomRail" aria-hidden="true" />
        </main>

        <Inspector
          surface={surface}
          onBuyManual={onBuyManual}
          onStudyLater={onStudyLater}
          onViewTechniques={onViewTechniques}
        />

        <section className="manualPavilionBottomStrip" data-region="bottom-strip" data-testid="manual-pavilion-bottom-strip" aria-label="Manual Pavilion actions and economy">
          <div className="manualPavilionBottomStrip__refresh">
            <ActionButton button={surface.bottomStrip.refreshButton} className="manualPavilionBottomButton" onClick={onRefreshStock} />
            <p data-testid="manual-pavilion-refresh-state">{surface.bottomStrip.refreshCostLine}</p>
          </div>
          <div className="manualPavilionPity" aria-label={`${surface.bottomStrip.pityLabel}. ${surface.bottomStrip.pityProgressLabel}`}>
            <strong>{surface.bottomStrip.pityLabel}</strong>
            <div className="manualPavilionPity__bar" aria-hidden="true">
              <span style={{ width: `${surface.bottomStrip.pityProgressPct}%` }} />
            </div>
            <span>{surface.bottomStrip.pityProgressLabel}</span>
            <div className="manualPavilionPityRows">
              {surface.bottomStrip.pityRows.map((row) => (
                <span key={row.id} data-testid={row.id === 'pity-epic' || row.id === 'fixture-pity-epic' ? 'manual-pavilion-pity-epic' : row.id === 'pity-legendary' || row.id === 'fixture-pity-legendary' ? 'manual-pavilion-pity-legendary' : undefined}>
                  {row.label}: {row.value}
                </span>
              ))}
            </div>
          </div>
          <div className="manualPavilionSatchel">
            <DecorativeIcon iconKey="recordSlip" size={48} />
            <strong>{surface.bottomStrip.satchelLabel}</strong>
            <ActionButton button={surface.bottomStrip.satchelButton} className="manualPavilionSatchel__button" onClick={onOpenSatchel} />
          </div>
          <div className="manualPavilionCurrencies" aria-label="Currency reserves">
            {surface.bottomStrip.currencyRows.map((row) => (
              <FactRow key={row.id} row={row} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
