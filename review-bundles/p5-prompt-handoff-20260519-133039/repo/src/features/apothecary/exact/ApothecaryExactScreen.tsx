import type React from 'react';
import type {
  ApothecaryExactAssetKey,
  ApothecaryExactButtonSurface,
  ApothecaryExactSurfaceV1,
} from './apothecaryExactTypes.js';

export interface ApothecaryExactScreenProps {
  surface: ApothecaryExactSurfaceV1;
  scale?: number;
  onAction?: (action: ApothecaryExactButtonSurface) => void;
}

function assetSrc(surface: ApothecaryExactSurfaceV1, key: ApothecaryExactAssetKey): string {
  return surface.assets[key]?.src ?? '';
}

function Icon(props: { surface: ApothecaryExactSurfaceV1; iconKey: ApothecaryExactAssetKey; className?: string }) {
  return (
    <span className={`apothecaryExactIcon ${props.className ?? ''}`} aria-hidden="true">
      <img src={assetSrc(props.surface, props.iconKey)} alt="" />
    </span>
  );
}

function RoomAtmosphere(props: Pick<ApothecaryExactScreenProps, 'surface'>) {
  return (
    <div
      className="apothecaryExactRoomAtmosphere"
      data-testid="apothecary-exact-room-atmosphere"
      aria-hidden="true"
      style={{ '--apoth-room-plate': `url(${assetSrc(props.surface, 'room.scenicPlate')})` } as React.CSSProperties}
    />
  );
}

function ExactButton(props: {
  surface: ApothecaryExactSurfaceV1;
  action: ApothecaryExactButtonSurface;
  className?: string;
  children?: React.ReactNode;
  onAction?: (action: ApothecaryExactButtonSurface) => void;
}) {
  const { action } = props;
  return (
    <button
      type="button"
      className={[
        'apothecaryExactButton',
        `apothecaryExactButton--${action.tone}`,
        props.className ?? '',
      ].filter(Boolean).join(' ')}
      data-action-id={action.id}
      data-intent={action.intent}
      data-enabled={action.enabled ? 'true' : 'false'}
      disabled={!action.enabled}
      aria-label={action.ariaLabel}
      title={action.disabledReason}
      onClick={() => {
        if (action.enabled) props.onAction?.(action);
      }}
    >
      {props.children ?? action.label}
    </button>
  );
}

function PrepStrip(props: Pick<ApothecaryExactScreenProps, 'surface'>) {
  return (
    <section className="apothecaryExactPrepStrip" data-testid="apothecary-exact-prep-strip" aria-label="Apothecary preparation status">
      {props.surface.prepStrip.map((cell) => (
        <div key={cell.id} className={`apothecaryExactPrepCell apothecaryExactTone--${cell.tone}`} data-cell-id={cell.id}>
          <Icon surface={props.surface} iconKey={cell.iconKey} className="apothecaryExactPrepCell__icon" />
          <div className="apothecaryExactPrepCell__copy">
            <span className="apothecaryExactPrepCell__label">{cell.label}</span>
            <strong className="apothecaryExactPrepCell__value">{cell.value}</strong>
          </div>
        </div>
      ))}
    </section>
  );
}

function Prescription(props: ApothecaryExactScreenProps) {
  const { surface, onAction } = props;
  return (
    <section
      className="apothecaryExactPrescription"
      data-testid="apothecary-exact-prescription"
      aria-labelledby="apothecary-exact-prescription-title"
    >
      <span className="apothecaryExactPrescription__leftScript" aria-hidden="true"> </span>
      <span className="apothecaryExactPrescription__seal" aria-hidden="true"> </span>
      <header className="apothecaryExactPrescription__header">
        <h2 id="apothecary-exact-prescription-title">{surface.prescription.title}</h2>
        <p>{surface.prescription.subtitle}</p>
      </header>
      <div className="apothecaryExactPrescription__table" role="table" aria-label={surface.prescription.title}>
        <div className="apothecaryExactPrescription__head" role="row">
          <span>{surface.prescription.columns[0]}</span>
          <span>{surface.prescription.columns[1]}</span>
          <span>{surface.prescription.columns[2]}</span>
          <span>{surface.prescription.columns[3]}</span>
          <span>{surface.prescription.columns[4]}</span>
        </div>
        {surface.prescription.rows.map((row) => (
          <div key={row.id} className={`apothecaryExactPrescription__row apothecaryExactTone--${row.tone}`} role="row" data-row-id={row.id}>
            <span className="apothecaryExactPrescription__item">
              <Icon surface={surface} iconKey={row.iconKey} />
              <strong>{row.itemName}</strong>
            </span>
            <span>{row.ownedLabel}</span>
            <span>{row.recommendedLabel}</span>
            <span className="apothecaryExactPrescription__missing">{row.missingLabel}</span>
            <span className="apothecaryExactPrescription__actions">
              {row.actions.map((action) => (
                <ExactButton key={action.id} surface={surface} action={action} className="apothecaryExactButton--chip" onAction={onAction} />
              ))}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function WarningStrip(props: Pick<ApothecaryExactScreenProps, 'surface'>) {
  return (
    <section className="apothecaryExactWarnings" data-testid="apothecary-exact-warnings" aria-label="Apothecary preparation warnings">
      {props.surface.warningStrip.map((warning) => (
        <div
          key={warning.id}
          className={`apothecaryExactWarningChip apothecaryExactWarningChip--${warning.visible ? 'visible' : 'reserved'} apothecaryExactTone--${warning.tone}`}
          data-warning-id={warning.id}
        >
          {warning.visible ? <Icon surface={props.surface} iconKey={warning.iconKey} /> : null}
          <span>{warning.label}</span>
        </div>
      ))}
    </section>
  );
}

function BuyLane(props: ApothecaryExactScreenProps) {
  const { surface, onAction } = props;
  return (
    <section className="apothecaryExactBuyLane apothecaryExactPanel" data-testid="apothecary-exact-buy-lane" aria-labelledby="apothecary-exact-buy-title">
      <header className="apothecaryExactLaneHeader">
        <h3 id="apothecary-exact-buy-title">{surface.buyLane.title}</h3>
        <p>{surface.buyLane.subtitle}</p>
      </header>
      <div className="apothecaryExactLaneRows">
        {surface.buyLane.rows.map((row) => (
          <div key={row.id} className={`apothecaryExactLaneRow apothecaryExactTone--${row.tone}`}>
            <Icon surface={surface} iconKey={row.iconKey} />
            <div className="apothecaryExactLaneRow__copy">
              <strong>{row.itemName}</strong>
              <span><span className="apothecaryExactCoin" aria-hidden="true" />{row.priceLabel}</span>
            </div>
            <span className="apothecaryExactLaneRow__meta">{row.stockLabel}</span>
            <ExactButton surface={surface} action={row.action} className="apothecaryExactButton--lane" onAction={onAction} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BrewLane(props: ApothecaryExactScreenProps) {
  const { surface, onAction } = props;
  return (
    <section className="apothecaryExactBrewLane apothecaryExactPanel" data-testid="apothecary-exact-brew-lane" aria-labelledby="apothecary-exact-brew-title">
      <header className="apothecaryExactLaneHeader">
        <h3 id="apothecary-exact-brew-title">{surface.brewLane.title}</h3>
        <p>{surface.brewLane.subtitle}</p>
      </header>
      <div className="apothecaryExactLaneRows">
        {surface.brewLane.rows.map((row) => (
          <div key={row.id} className={`apothecaryExactLaneRow apothecaryExactLaneRow--brew apothecaryExactTone--${row.tone}`}>
            <Icon surface={surface} iconKey={row.iconKey} />
            <div className="apothecaryExactLaneRow__copy">
              <strong>{row.outputLabel}</strong>
              <span>{row.ingredientLabel}</span>
            </div>
            <span className="apothecaryExactLaneRow__meta">
              {row.ingredientCountLabel ? (
                <>
                  <Icon surface={surface} iconKey={row.ingredientIconKey} className="apothecaryExactIcon--tiny" />
                  {row.ingredientCountLabel}
                </>
              ) : null}
            </span>
            <ExactButton surface={surface} action={row.action} className="apothecaryExactButton--lane" onAction={onAction} />
          </div>
        ))}
      </div>
    </section>
  );
}

function PouchCard(props: ApothecaryExactScreenProps) {
  const { surface, onAction } = props;
  return (
    <section className="apothecaryExactPouchCard apothecaryExactPanel" data-testid="apothecary-exact-pouch-card" aria-labelledby="apothecary-exact-pouch-title">
      <header className="apothecaryExactLaneHeader">
        <h3 id="apothecary-exact-pouch-title">{surface.pouchCard.title}</h3>
        <p>{surface.pouchCard.subtitle}</p>
      </header>
      <div className="apothecaryExactPouchLines">
        {surface.pouchCard.lines.map((line) => (
          <div key={line.id} className={`apothecaryExactPouchLine apothecaryExactTone--${line.tone}`}>
            <Icon surface={surface} iconKey={line.iconKey} className="apothecaryExactIcon--small" />
            <span><strong>{line.label}:</strong> {line.value}</span>
          </div>
        ))}
      </div>
      <div className="apothecaryExactPouchButtons">
        {surface.pouchCard.buttons.map((action) => (
          <ExactButton key={action.id} surface={surface} action={action} className="apothecaryExactButton--wide" onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

function PouchObject(props: ApothecaryExactScreenProps) {
  const { surface } = props;
  return (
    <div
      className="apothecaryExactPouchObject"
      data-testid="apothecary-exact-pouch-object"
      aria-hidden="true"
    >
      <img src={assetSrc(surface, 'objects.medicinePouch')} alt={surface.pouchObject.alt} />
    </div>
  );
}

function BottomRail(props: ApothecaryExactScreenProps) {
  const { surface, onAction } = props;
  return (
    <>
      <section className="apothecaryExactBottomActions" data-testid="apothecary-exact-bottom-actions" aria-label="Secondary Apothecary actions">
        {surface.bottomActions.map((action) => (
          <ExactButton key={action.id} surface={surface} action={action} className="apothecaryExactButton--secondary" onAction={onAction} />
        ))}
      </section>
      <section className="apothecaryExactPrimaryCta" data-testid="apothecary-exact-primary-cta">
        <ExactButton surface={surface} action={surface.primaryAction} className="apothecaryExactButton--primary" onAction={onAction}>
          <span>{surface.primaryAction.label}</span>
        </ExactButton>
      </section>
      <section className="apothecaryExactReturnGate" data-testid="apothecary-exact-return-gate">
        <ExactButton surface={surface} action={surface.returnAction} className="apothecaryExactButton--return" onAction={onAction} />
      </section>
      <aside className="apothecaryExactAttemptFit" data-testid="apothecary-exact-attempt-fit" aria-labelledby="apothecary-exact-attempt-fit-title">
        <h3 id="apothecary-exact-attempt-fit-title">{surface.attemptFit.title}</h3>
        {surface.attemptFit.lines.map((line) => (
          <div key={line.id} className={`apothecaryExactAttemptFit__line apothecaryExactTone--${line.tone}`}>
            <span>{line.label}:</span>
            <strong>{line.value}</strong>
          </div>
        ))}
      </aside>
    </>
  );
}

export function ApothecaryExactScreen({ surface, scale = 1, onAction }: ApothecaryExactScreenProps) {
  return (
    <div
      className="apothecaryExactPage"
      data-testid={surface.meta.rootTestId}
      data-mode={surface.meta.mode}
      data-source={surface.meta.source}
      data-focus={surface.meta.focus}
      style={{ '--apoth-exact-scale': String(scale) } as React.CSSProperties}
    >
      <div className="apothecaryExactPlane" data-testid="apothecary-exact-plane">
        <RoomAtmosphere surface={surface} />
        <header className="apothecaryExactHeader" data-testid="apothecary-exact-header">
          <div className="apothecaryExactHeader__titleRow">
            <h1>{surface.pageHeader.title}</h1>
            <span className="apothecaryExactHeader__seal" aria-hidden="true" />
          </div>
          <p>{surface.pageHeader.purpose}</p>
        </header>
        <div className="apothecaryExactCityChip" data-testid="apothecary-exact-city-chip">{surface.pageHeader.cityStatus}</div>
        <PrepStrip surface={surface} />
        <Prescription surface={surface} onAction={onAction} />
        <WarningStrip surface={surface} />
        <BuyLane surface={surface} onAction={onAction} />
        <BrewLane surface={surface} onAction={onAction} />
        <PouchCard surface={surface} onAction={onAction} />
        <PouchObject surface={surface} onAction={onAction} />
        <BottomRail surface={surface} onAction={onAction} />
        <aside data-testid="apothecary-exact-shell-flags" hidden>{JSON.stringify(surface.shell)}</aside>
        <aside data-testid="apothecary-exact-debug" hidden>{JSON.stringify(surface.debug ?? {})}</aside>
      </div>
    </div>
  );
}
