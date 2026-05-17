import type {
  PrestigeLedgerExactScreenActions,
  PrestigeLedgerExactSurfaceV1,
  PrestigeRecommendedDecreeCard,
} from './prestigeLedgerExactTypes.js';
import './PrestigeLedgerExactScreen.scss';

type PrestigeLedgerExactScreenProps = {
  surface: PrestigeLedgerExactSurfaceV1;
} & PrestigeLedgerExactScreenActions;

const shouldRenderRecommendationButton = (card: PrestigeRecommendedDecreeCard): boolean =>
  card.affordance !== 'info' && Boolean(card.button);

export function PrestigeLedgerExactScreen({
  surface,
  onReviewAndReincarnate,
  onOpenLibrary,
  onViewLifeSummary,
  onOpenApBreakdown,
  onSelectRecommendedDecree,
}: PrestigeLedgerExactScreenProps) {
  return (
    <main
      className={`prestigeLedgerExactPage prestigeLedgerExactPage--${surface.reincarnationDecree.sealState}`}
      data-testid={surface.meta.rootTestId}
      aria-label="Prestige Reincarnation Ledger"
    >
      <header className="prestigeLedgerHeader parchmentPanel" aria-label="Prestige ledger header">
        <div className="prestigeLedgerHeader__identity">
          <div className="prestigeLedgerStamp prestigeLedgerStamp--square" aria-hidden="true">AP</div>
          <div>
            <h1>{surface.header.title}</h1>
            <div className="prestigeLedgerHeader__subtitle">{surface.header.subtitle}</div>
          </div>
        </div>

        <div className="prestigeLedgerThread" aria-label="Major realms and gates reached this life">
          <div className="prestigeLedgerThread__line" aria-hidden="true" />
          <div className="prestigeLedgerThread__nodes">
            {surface.header.lifeThread.map((node) => (
              <div key={node.label} className={`prestigeLedgerThread__node prestigeLedgerThread__node--${node.state}`}>
                <span aria-hidden="true" />
                <strong>{node.label}</strong>
              </div>
            ))}
          </div>
          <div className="prestigeLedgerThread__caption">Major realms and gates reached this life</div>
        </div>

        <div className="prestigeLedgerHeader__chips" aria-label="Ascension Point ledger summary">
          {surface.header.chips.map((chip) => (
            <div key={chip.label} className="prestigeLedgerChip">
              <span className="prestigeLedgerChip__mark" aria-hidden="true" />
              <span>{chip.label}</span>
              <strong>{chip.value}</strong>
            </div>
          ))}
        </div>
      </header>

      {surface.runCompassHint ? (
        <section
          className={`prestigeLedgerRunCompass parchmentPanel ${surface.runCompassHint.active ? 'prestigeLedgerRunCompass--active' : ''}`}
          aria-label="Run Compass"
        >
          <div>
            <span>{surface.runCompassHint.active ? 'Primary Route' : 'Run Compass'}</span>
            <strong>{surface.runCompassHint.milestoneLabel}</strong>
            <p>{surface.runCompassHint.blockerLabel}</p>
            {surface.runCompassHint.recentDeltaLine ? <small>{surface.runCompassHint.recentDeltaLine}</small> : null}
          </div>
          <div>
            <span>{surface.runCompassHint.routeLabel}</span>
            <p>{surface.runCompassHint.detail}</p>
          </div>
        </section>
      ) : null}

      <section className="prestigeLedgerCard prestigeLedgerCard--ledger parchmentPanel" aria-labelledby="prestige-ledger-current-title">
        <div className="prestigeLedgerCard__stamp" aria-hidden="true" />
        <h2 id="prestige-ledger-current-title">{surface.currentLifeLedger.title}</h2>

        <section className="prestigeLedgerSection">
          <h3>Life Identity</h3>
          <div className="prestigeLedgerRows">
            {surface.currentLifeLedger.identityRows.map((row) => (
              <div key={row.label} className="prestigeLedgerRow">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="prestigeLedgerSection">
          <h3>Progress Record</h3>
          <div className="prestigeLedgerRows">
            {surface.currentLifeLedger.progressRows.map((row) => (
              <div key={row.label} className={`prestigeLedgerRow${row.emphasis === 'warning' ? ' is-warning' : ''}`}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="prestigeLedgerReceipt" aria-label="Ascension Point receipt">
          <button type="button" className="prestigeLedgerReceipt__title" onClick={onOpenApBreakdown}>
            <span>AP Receipt</span>
            <span className="prestigeLedgerReceipt__miniStamp" aria-hidden="true" />
          </button>
          <div className="prestigeLedgerReceipt__rows">
            {surface.currentLifeLedger.apReceiptRows.map((row) => (
              <div key={row.label} className="prestigeLedgerReceipt__row" title={row.hint}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
          <button type="button" className="prestigeLedgerReceipt__total" onClick={onOpenApBreakdown}>
            <span>{surface.currentLifeLedger.projectedGainLabel}</span>
            <strong>{surface.currentLifeLedger.projectedGainValue}</strong>
          </button>
        </section>

        <button
          type="button"
          className="prestigeLedgerButton prestigeLedgerButton--secondary prestigeLedgerCard__footerButton"
          onClick={onViewLifeSummary}
          disabled={!surface.currentLifeLedger.viewLifeSummaryButton.enabled}
        >
          {surface.currentLifeLedger.viewLifeSummaryButton.label}
        </button>
      </section>

      <section className="prestigeLedgerDecree parchmentPanel" aria-labelledby="prestige-ledger-decree-title">
        <div className="prestigeLedgerDecree__roller prestigeLedgerDecree__roller--top" aria-hidden="true" />
        <div className="prestigeLedgerDecree__roller prestigeLedgerDecree__roller--bottom" aria-hidden="true" />
        <div className="prestigeLedgerDecree__wash" aria-hidden="true" />

        <header className="prestigeLedgerDecree__header">
          <h2 id="prestige-ledger-decree-title">{surface.reincarnationDecree.title}</h2>
          <span className="prestigeLedgerStamp prestigeLedgerStamp--tiny" aria-hidden="true">AP</span>
        </header>

        <div className={`prestigeLedgerSeal prestigeLedgerSeal--${surface.reincarnationDecree.sealState}`}>
          <div className="prestigeLedgerSeal__outer" aria-hidden="true" />
          <div className="prestigeLedgerSeal__inner">
            <div className="prestigeLedgerSeal__verdict">{surface.reincarnationDecree.verdictLabel}</div>
            <div className="prestigeLedgerSeal__ap">{surface.reincarnationDecree.apValueLabel}</div>
            <p>{surface.reincarnationDecree.statusLine}</p>
            <div className="prestigeLedgerSeal__lotus" aria-hidden="true" />
          </div>
        </div>

        <p className="prestigeLedgerDecree__advisory">{surface.reincarnationDecree.advisorySentence}</p>
        <span className="prestigeLedgerStamp prestigeLedgerStamp--round" aria-hidden="true">AP</span>

        <div className="prestigeLedgerDecree__actions">
          <button
            type="button"
            className="prestigeLedgerPrimaryPlaque"
            onClick={onReviewAndReincarnate}
            disabled={!surface.reincarnationDecree.primaryAction.enabled}
            title={surface.reincarnationDecree.primaryAction.reason}
          >
            <span className="prestigeLedgerPrimaryPlaque__stamp" aria-hidden="true" />
            <span>{surface.reincarnationDecree.primaryAction.label}</span>
          </button>
          <button type="button" className="prestigeLedgerButton prestigeLedgerButton--secondary" onClick={onOpenLibrary}>
            {surface.reincarnationDecree.secondaryAction.label}
          </button>
        </div>
      </section>

      <aside className="prestigeLedgerCard prestigeLedgerCard--preview parchmentPanel" aria-label="Next life preview and recommended decrees">
        <div className="prestigeLedgerCard__mountain" aria-hidden="true" />
        <section className="prestigeLedgerPreview">
          <h2>Next Life Preview</h2>
          <ul>
            {surface.nextLifeRail.previewBullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="prestigeLedgerRecommendations">
          <h2>Recommended Decrees</h2>
          <div className="prestigeLedgerRecommendations__list">
            {surface.nextLifeRail.recommendedDecrees.map((card) => (
              <article key={card.id} className={`prestigeLedgerRecommendation prestigeLedgerRecommendation--${card.sealTone}`}>
                <button
                  type="button"
                  className="prestigeLedgerRecommendation__body"
                  onClick={() => {
                    if (card.affordance !== 'info') onSelectRecommendedDecree(card.id);
                  }}
                  disabled={card.affordance === 'info'}
                  aria-label={card.actualUpgradeName ? `Inspect ${card.actualUpgradeName}` : card.displayTitle}
                >
                  <span className="prestigeLedgerRecommendation__seal" aria-hidden="true" />
                  <span className="prestigeLedgerRecommendation__copy">
                    <span className="prestigeLedgerRecommendation__title">{card.displayTitle}</span>
                    <span>Effect: {card.effectLine}</span>
                    <span>Why: {card.whyLine}</span>
                  </span>
                  <span className="prestigeLedgerRecommendation__cost">
                    <small>Cost</small>
                    <strong>{card.costLabel}</strong>
                  </span>
                </button>
                {shouldRenderRecommendationButton(card) ? (
                  <button
                    type="button"
                    className="prestigeLedgerRecommendation__inspect"
                    onClick={() => onSelectRecommendedDecree(card.id)}
                  >
                    {card.button?.label ?? 'Inspect'}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <button type="button" className="prestigeLedgerButton prestigeLedgerButton--library" onClick={onOpenLibrary}>
          {surface.nextLifeRail.openLibraryButton.label}
        </button>
      </aside>

      <section className="prestigeLedgerContract parchmentPanel" aria-labelledby="prestige-ledger-contract-title">
        <div className="prestigeLedgerContract__wash prestigeLedgerContract__wash--left" aria-hidden="true" />
        <div className="prestigeLedgerContract__wash prestigeLedgerContract__wash--right" aria-hidden="true" />
        <header>
          <h2 id="prestige-ledger-contract-title">{surface.resetContract.title}</h2>
          <span className="prestigeLedgerStamp prestigeLedgerStamp--tiny" aria-hidden="true">AP</span>
        </header>
        <div className="prestigeLedgerContract__tablets">
          {surface.resetContract.tablets.map((tablet) => (
            <article key={tablet.title} className={`prestigeLedgerTablet prestigeLedgerTablet--${tablet.tone}`}>
              <h3>{tablet.title}</h3>
              <ul>
                {tablet.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <span aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
