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
  onViewLastCompletedLifeSummary,
  onOpenApBreakdown,
  onSelectRecommendedDecree,
  onRoutePostResetObjective,
  onDismissPostResetObjective,
}: PrestigeLedgerExactScreenProps) {
  const reclaimObjective = surface.postResetReclaimObjective ?? null;
  const primaryReclaimAction = reclaimObjective?.firstActions[0] ?? null;

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

      {reclaimObjective ? (
        <section className="prestigeLedgerReclaimBanner parchmentPanel" aria-label="Post-reset reclaim objective">
          <div className="prestigeLedgerReclaimBanner__copy">
            <span>Previous life sealed</span>
            <strong>{reclaimObjective.headline}</strong>
            <p>{reclaimObjective.detail}</p>
          </div>
          <div className="prestigeLedgerReclaimBanner__advantages" aria-label="Retained advantages">
            {reclaimObjective.retainedAdvantages.slice(0, 3).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <ol className="prestigeLedgerReclaimBanner__steps" aria-label="First actions">
            {reclaimObjective.firstActions.slice(0, 3).map((action) => (
              <li key={action.id}>
                <strong>{action.label}</strong>
                <span>{action.detail}</span>
              </li>
            ))}
          </ol>
          <div className="prestigeLedgerReclaimBanner__actions">
            {primaryReclaimAction ? (
              <button type="button" className="prestigeLedgerButton prestigeLedgerButton--secondary" onClick={onRoutePostResetObjective}>
                {primaryReclaimAction.label}
              </button>
            ) : null}
            <button type="button" className="prestigeLedgerButton prestigeLedgerButton--secondary" onClick={onDismissPostResetObjective}>
              Dismiss
            </button>
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
        {surface.meta.hasLastLifeSummary ? (
          <button
            type="button"
            className="prestigeLedgerButton prestigeLedgerButton--secondary prestigeLedgerCard__lastLifeButton"
            onClick={onViewLastCompletedLifeSummary}
            disabled={!surface.currentLifeLedger.viewLastLifeSummaryButton.enabled}
            title={surface.currentLifeLedger.viewLastLifeSummaryButton.reason}
          >
            {surface.currentLifeLedger.viewLastLifeSummaryButton.label}
          </button>
        ) : null}
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
                      {card.levelLine ? <span>{card.levelLine}</span> : null}
                      {card.runtimeHonesty ? <span>Runtime: {card.runtimeHonesty === 'live' ? 'Live' : card.runtimeHonesty}</span> : null}
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

      <section className="prestigeLedgerForecast parchmentPanel" aria-labelledby="prestige-ledger-forecast-title">
        <header>
          <h2 id="prestige-ledger-forecast-title">{surface.forecast.title}</h2>
          <span className="prestigeLedgerStamp prestigeLedgerStamp--tiny" aria-hidden="true">AP</span>
        </header>
        <div className="prestigeLedgerForecast__objective">
          <strong>{surface.forecast.objective.label}</strong>
          <p>{surface.forecast.objective.detail}</p>
        </div>
        <div className="prestigeLedgerForecast__lines">
          {surface.forecast.lines.map((line) => (
            <article key={line.id} className={`prestigeLedgerForecastLine prestigeLedgerForecastLine--${line.confidence}`}>
              <h3>{line.label}</h3>
              <div>
                <span>{line.previous}</span>
                <strong>{line.expectedNext}</strong>
              </div>
              <p>{line.reason}</p>
              <small>Confidence: {line.confidence}</small>
            </article>
          ))}
        </div>
        {surface.forecast.warnings.length > 0 ? (
          <ul className="prestigeLedgerForecast__warnings">
            {surface.forecast.warnings.slice(0, 3).map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        ) : null}
      </section>

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
