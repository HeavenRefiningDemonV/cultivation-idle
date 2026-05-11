import type { RefObject } from 'react';
import { GameIcon } from '../../ui/icons/index.js';
import type {
  PavilionCategorySurface,
  PavilionEntrySectionSurface,
  PavilionRecordListItemSurface,
  PavilionRelatedEntrySurface,
  PavilionRouteButtonSurface,
  PavilionSurfaceV1,
} from './pavilionTypes.js';

export interface PavilionExactScreenProps {
  surface: PavilionSurfaceV1;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onSelectCategory?: (categoryId: string) => void;
  onSelectEntry?: (entryId: string) => void;
  onSearchChange?: (query: string) => void;
  onToggleFilter?: (filterId: string) => void;
  onRoute?: (button: PavilionRouteButtonSurface) => void;
  onOpenJadeSlip?: (entryId: string) => void;
  onCloseJadeSlip?: () => void;
}

function stateGlyphClass(kind: string): string {
  return `pavilionStateGlyph--${kind}`;
}

function renderCategory(category: PavilionCategorySurface, props: PavilionExactScreenProps) {
  return (
    <button
      key={category.id}
      type="button"
      className={`pavilionExact__shelfSlip ${category.selected ? 'pavilionExact__shelfSlip--selected' : ''}`}
      data-category-id={category.id}
      aria-current={category.selected ? 'page' : undefined}
      onClick={() => props.onSelectCategory?.(category.id)}
    >
      <span className="pavilionExact__shelfIcon" aria-hidden="true">
        <GameIcon icon={category.id === 'gate-trials' ? 'recordSlip' : 'placeholderRingSmall'} size={24} decorative />
      </span>
      <span className="pavilionExact__shelfLabel">{category.label}</span>
      <span className={`pavilionExact__shelfState ${stateGlyphClass(category.stateKind)}`} aria-label={category.stateKind} />
    </button>
  );
}

function renderRecordListItem(record: PavilionRecordListItemSurface, props: PavilionExactScreenProps) {
  const signal = record.signals.includes('recommendedNow')
    ? 'recommended'
    : record.signals.includes('warning')
      ? 'warning'
      : record.signals.includes('future')
        ? 'future'
        : null;
  return (
    <li key={record.id}>
      <button
        type="button"
        className={`pavilionExact__recordListItem ${record.selected ? 'pavilionExact__recordListItem--selected' : ''}`}
        aria-current={record.selected ? 'true' : undefined}
        onClick={() => props.onSelectEntry?.(record.id)}
      >
        <span className={`pavilionExact__recordListGlyph ${stateGlyphClass(record.stateKind)}`} aria-hidden="true" />
        <span className="pavilionExact__recordListText">
          <span className="pavilionExact__recordListTitle">{record.title}</span>
          <span className="pavilionExact__recordListMeta">
            {record.summary}{record.generated ? ' / Generated' : ''}
          </span>
        </span>
        {signal ? (
          <span className={`pavilionExact__recordListSignal pavilionExact__recordListSignal--${signal}`}>
            {signal}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className="pavilionExact__recordSlipButton"
        onClick={() => props.onOpenJadeSlip?.(record.id)}
      >
        Slip
      </button>
    </li>
  );
}

function renderRows(section: PavilionEntrySectionSurface, props: PavilionExactScreenProps) {
  if (!section.rows?.length) return null;
  return (
    <div className={`pavilionExact__sectionRows pavilionExact__sectionRows--${section.id}`}>
      {section.rows.map((row) => {
        const routeButton = row.routeLabel
          ? props.surface.selectedEntry.routeButtons.find((button) => button.label === row.routeLabel)
          : null;
        const content = (
          <>
            <span className={`pavilionExact__rowSeal pavilionExact__rowSeal--${row.status ?? 'open'}`} aria-hidden="true" />
            <span className="pavilionExact__rowLabel">{row.label}</span>
            {row.value ? <span className="pavilionExact__rowValue">{row.value}</span> : null}
            {routeButton ? <span className="pavilionExact__rowArrow" aria-hidden="true">&gt;</span> : null}
          </>
        );
        if (routeButton) {
          return (
            <button
              key={row.id}
              type="button"
              className={`pavilionExact__sectionRow pavilionExact__sectionRow--${row.status ?? 'open'}`}
              disabled={!routeButton.enabled}
              title={routeButton.disabledReason}
              onClick={() => props.onRoute?.(routeButton)}
            >
              {content}
            </button>
          );
        }
        return (
          <div key={row.id} className={`pavilionExact__sectionRow pavilionExact__sectionRow--${row.status ?? 'open'}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

function renderSection(section: PavilionEntrySectionSurface, props: PavilionExactScreenProps) {
  return (
    <section key={section.id} className={`pavilionExact__recordSection pavilionExact__recordSection--${section.tone ?? 'plain'}`}>
      <div className="pavilionExact__sectionTitleRow">
        <span className="pavilionExact__sectionNumber">{section.number}</span>
        <h3>{section.title}</h3>
      </div>
      {section.body ? <p>{section.body}</p> : null}
      {renderRows(section, props)}
    </section>
  );
}

function renderRelatedChip(entry: PavilionRelatedEntrySurface, props: PavilionExactScreenProps) {
  const routeButton = entry.routeLabel
    ? props.surface.selectedEntry.routeButtons.find((button) => button.label === entry.routeLabel)
    : null;
  const enabled = Boolean(entry.targetEntryId || routeButton?.enabled);
  return (
    <button
      key={entry.id}
      type="button"
      className={`pavilionExact__threadChip ${entry.unresolved ? 'pavilionExact__threadChip--unresolved' : ''}`}
      disabled={!enabled}
      title={!enabled ? routeButton?.disabledReason : undefined}
      onClick={() => {
        if (entry.targetEntryId) {
          props.onSelectEntry?.(entry.targetEntryId);
          return;
        }
        if (routeButton) props.onRoute?.(routeButton);
      }}
    >
      <span className={`pavilionExact__threadMedallion ${stateGlyphClass(entry.stateKind)}`} aria-hidden="true" />
      {entry.label}
    </button>
  );
}

export function PavilionExactScreen(props: PavilionExactScreenProps) {
  const { surface } = props;
  const selected = surface.selectedEntry;
  return (
    <section className="pavilionExact" data-testid="pavilion-exact-page" data-mode={surface.meta.mode}>
      <div className="pavilionExact__ambient" aria-hidden="true" />
      <div className="pavilionExact__archiveBackdrop" aria-hidden="true" />
      <div className="pavilionExact__deskProps" aria-hidden="true" />

      <header className="pavilionExact__titleBlock" data-testid="pavilion-title-block">
        <div className="pavilionExact__titleSeal" aria-hidden="true">{surface.page.titleSealText}</div>
        <h1>{surface.page.title}</h1>
        <p>{surface.page.subtitle}</p>
      </header>

      <div className="pavilionExact__runRibbon" data-testid="pavilion-run-ribbon">
        {surface.currentLifeRibbon.display}
      </div>

      <div className="pavilionExact__searchCluster" data-testid="pavilion-search-cluster">
        <label className="pavilionExact__searchBox">
          <span aria-hidden="true" className="pavilionExact__searchIcon" />
          <input
            ref={props.searchInputRef}
            value={surface.search.query}
            placeholder={surface.search.placeholder}
            onChange={(event) => props.onSearchChange?.(event.target.value)}
            aria-label={surface.search.placeholder}
          />
        </label>
        <div className="pavilionExact__filterChips" aria-label="Pavilion filters">
          {surface.search.filterChips.slice(0, surface.meta.mode === 'fixture' ? 4 : surface.search.filterChips.length).map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`pavilionExact__filterChip ${chip.active ? 'pavilionExact__filterChip--active' : ''}`}
              aria-pressed={chip.active}
              onClick={() => props.onToggleFilter?.(chip.label)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="pavilionExact__shelf" data-testid="pavilion-jade-shelf" aria-label="Pavilion categories">
        <h2>Jade Shelf</h2>
        <div className="pavilionExact__shelfList">
          {surface.categories.map((category) => renderCategory(category, props))}
        </div>
        <section className="pavilionExact__recordList" aria-label={surface.recordList.title}>
          <div className="pavilionExact__recordListHeader">
            <h3>{surface.recordList.title}</h3>
            <span>{surface.recordList.totalMatches}</span>
          </div>
          {surface.recordList.records.length > 0 ? (
            <ul>
              {surface.recordList.records.map((record) => renderRecordListItem(record, props))}
            </ul>
          ) : (
            <p>{surface.recordList.emptyLabel}</p>
          )}
        </section>
        <section className="pavilionExact__stateLegend" aria-label="Record state legend">
          <h3>Record States</h3>
          <div className="pavilionExact__legendGrid">
            {surface.recordStatesLegend.map((state) => (
              <span key={state.id} className="pavilionExact__legendItem" title={state.tooltip}>
                <span className={`pavilionExact__legendGlyph ${stateGlyphClass(state.id)}`} aria-hidden="true" />
                {state.label}
              </span>
            ))}
          </div>
        </section>
      </nav>

      <main className="pavilionExact__scroll" data-testid="pavilion-record-scroll">
        <div className="pavilionExact__scrollCurls" aria-hidden="true" />
        <header className="pavilionExact__recordHeader">
          <div className="pavilionExact__recordCategory">{selected.categoryLabel}</div>
          <div>
            <h2>{selected.title}</h2>
            <div className="pavilionExact__tagRow">
              <span className="pavilionExact__stateStamp">{selected.stateLabel}</span>
              {selected.tags.map((tag) => (
                <span key={tag.id} className={`pavilionExact__tag pavilionExact__tag--${tag.tone}`}>{tag.label}</span>
              ))}
            </div>
          </div>
        </header>
        <div className="pavilionExact__sections">
          {selected.sections.map((section) => renderSection(section, props))}
        </div>
        <div className="pavilionExact__routeButtons">
          {selected.routeButtons.map((button) => (
            <button
              key={button.id}
              type="button"
              disabled={!button.enabled}
              title={button.disabledReason}
              onClick={() => props.onRoute?.(button)}
            >
              {button.label}
            </button>
          ))}
        </div>
      </main>

      <aside className="pavilionExact__threads" data-testid="pavilion-threads-rail">
        {surface.elderNote ? (
          <section className="pavilionExact__elderNote" data-testid="pavilion-elder-note">
            <h2>{surface.elderNote.title}</h2>
            <p>{surface.elderNote.body}</p>
            <ul>
              {surface.elderNote.checklist.map((item) => (
                <li key={item.id} className={`pavilionExact__elderCheck pavilionExact__elderCheck--${item.status}`}>
                  <span aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="pavilionExact__threadRail">
          <h2>{surface.rightRail.title}</h2>
          {surface.rightRail.blocks.map((block) => (
            <section key={block.id} className={`pavilionExact__threadBlock pavilionExact__threadBlock--${block.id}`}>
              <h3>{block.title}</h3>
              <div className="pavilionExact__threadItems">
                {block.items.map((entry) => renderRelatedChip(entry, props))}
              </div>
            </section>
          ))}
        </section>
      </aside>

      <footer className="pavilionExact__footer" data-testid="pavilion-footer">
        <span>{surface.footer.breadcrumbs.join(' > ')}</span>
        <span>{surface.footer.recordsDiscoveredLabel}</span>
        <span>{surface.footer.studiedLabel}</span>
        <span>{surface.footer.masteredLabel}</span>
      </footer>

      {surface.jadeSlipDrawer ? (
        <aside className="pavilionExact__jadeDrawer" role="dialog" aria-label={surface.jadeSlipDrawer.title}>
          <button type="button" onClick={props.onCloseJadeSlip} aria-label="Close Slip">Close Slip</button>
          <h2>{surface.jadeSlipDrawer.title}</h2>
          <p>{surface.jadeSlipDrawer.body}</p>
        </aside>
      ) : null}
    </section>
  );
}
