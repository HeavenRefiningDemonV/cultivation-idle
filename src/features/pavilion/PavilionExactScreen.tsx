import type { RefObject } from 'react';
import { ModuleSourceSinkPanel } from '../../ui/daoMandate/index.js';
import { GameIcon } from '../../ui/icons/index.js';
import type {
  PavilionActionChipSurface,
  PavilionCategorySurface,
  PavilionGuidanceGroupSurface,
  PavilionInfoChipSurface,
  PavilionRecordListItemSurface,
  PavilionRelatedEntrySurface,
  PavilionRouteButtonSurface,
  PavilionSectionRowSurface,
  PavilionSurfaceV1,
} from './pavilionTypes.js';
import { PavilionRichText } from './PavilionRichTextRenderer.js';
import type { IconId } from '../../ui/icons/index.js';

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

function statusLabel(status: PavilionSectionRowSurface['status'] | undefined): string {
  if (status === 'complete') return 'Ready';
  if (status === 'warning') return 'Watch';
  if (status === 'sealed') return 'Sealed';
  return 'Open';
}

const PAVILION_SECTION_ICON_BY_TYPE: Record<PavilionGuidanceGroupSurface['type'], IconId> = {
  answer: 'recordSlip',
  why: 'inkSparkles',
  'do-next': 'inkBolt',
  requirements: 'taskComplete',
  sources: 'placeholderRingSmall',
  'used-for': 'inkRefresh',
  numbers: 'hourglassProgress',
  mistakes: 'inkWarning',
  lore: 'prayerBeads',
  relations: 'inkSwirl',
  debug: 'inkWip',
};

const PAVILION_BRIEF_ICON_BY_TONE: Record<PavilionActionChipSurface['tone'] | PavilionInfoChipSurface['tone'], IconId> = {
  action: 'inkBolt',
  route: 'inkChevronUp',
  warning: 'inkWarning',
  success: 'inkCheck',
  muted: 'placeholderRingSmall',
  term: 'recordSlip',
  item: 'foundationPill',
  stat: 'hourglassProgress',
  path: 'bookEarth',
  realm: 'inkSparkles',
};

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
  const signalLabel = signal === 'recommended'
    ? 'Needed Now'
    : signal === 'warning'
      ? 'Warning'
      : signal === 'future'
        ? 'Future'
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
            {record.summary}
          </span>
        </span>
        {record.generated ? (
          <span className="pavilionExact__recordListGenerated">Archive</span>
        ) : null}
        {signal ? (
          <span className={`pavilionExact__recordListSignal pavilionExact__recordListSignal--${signal}`}>
            {signalLabel}
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

function renderStatusSeal(status: PavilionSectionRowSurface['status'] | undefined) {
  const resolved = status ?? 'open';
  return (
    <span className={`pavilionStatusSeal pavilionStatusSeal--${resolved}`}>
      <span className="pavilionStatusSeal__mark" aria-hidden="true" />
      <span className="pavilionStatusSeal__label">{statusLabel(resolved)}</span>
    </span>
  );
}

function renderRows(
  rows: readonly PavilionSectionRowSurface[] | undefined,
  groupId: string,
  props: PavilionExactScreenProps,
) {
  if (!rows?.length) return null;
  return (
    <div className={`pavilionExact__sectionRows pavilionExact__sectionRows--${groupId}`}>
      {rows.map((row) => {
        const routeButton = row.routeLabel
          ? props.surface.selectedEntry.routeButtons.find((button) => button.label === row.routeLabel)
          : null;
        const content = (
          <>
            {renderStatusSeal(row.status)}
            <span className="pavilionExact__rowCopy">
              <span className="pavilionExact__rowLabel"><PavilionRichText text={row.label} /></span>
              {row.value ? <span className="pavilionExact__rowValue"><PavilionRichText text={row.value} /></span> : null}
            </span>
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

function renderGuidanceCard(group: PavilionGuidanceGroupSurface, props: PavilionExactScreenProps) {
  const icon = PAVILION_SECTION_ICON_BY_TYPE[group.type];
  return (
    <section
      key={group.id}
      className={`pavilionExact__recordSection pavilionExact__recordSection--${group.tone} pavilionExact__recordSection--type-${group.type}`}
    >
      <div className="pavilionExact__sectionTitleRow">
        <span className="pavilionExact__sectionIcon" aria-hidden="true">
          <GameIcon icon={icon} size={20} decorative />
        </span>
        <h3>{group.title}</h3>
      </div>
      {group.body ? (
        <p>
          <PavilionRichText text={group.body} />
        </p>
      ) : null}
      {renderRows(group.rows, group.id, props)}
    </section>
  );
}

function renderBriefAction(chip: PavilionActionChipSurface, props: PavilionExactScreenProps) {
  const icon = PAVILION_BRIEF_ICON_BY_TONE[chip.tone];
  const routeButton = chip.routeLabel
    ? props.surface.selectedEntry.routeButtons.find((button) => button.label === chip.routeLabel)
    : null;
  const className = `pavilionRecordBrief__chip pavilionRecordBrief__chip--${chip.tone}`;
  const content = (
    <>
      <GameIcon icon={icon} size={16} decorative />
      <PavilionRichText text={chip.label} />
    </>
  );

  if (routeButton) {
    return (
      <button
        key={chip.id}
        type="button"
        className={className}
        disabled={!routeButton.enabled}
        title={routeButton.disabledReason}
        onClick={() => props.onRoute?.(routeButton)}
      >
        {content}
      </button>
    );
  }

  return (
    <span key={chip.id} className={className}>
      {content}
    </span>
  );
}

function renderBriefInfo(chip: PavilionInfoChipSurface) {
  const icon = PAVILION_BRIEF_ICON_BY_TONE[chip.tone];
  return (
    <span key={chip.id} className={`pavilionRecordBrief__chip pavilionRecordBrief__chip--${chip.tone}`}>
      <GameIcon icon={icon} size={16} decorative />
      <span>
        <PavilionRichText text={chip.label} />
        {chip.value ? <small><PavilionRichText text={chip.value} /></small> : null}
      </span>
    </span>
  );
}

function renderRecordBrief(props: PavilionExactScreenProps) {
  const brief = props.surface.selectedEntry.recordBrief;
  const primaryRoutes = brief.routeLabels
    .map((label) => props.surface.selectedEntry.routeButtons.find((button) => button.label === label))
    .filter((button): button is PavilionRouteButtonSurface => Boolean(button))
    .slice(0, 2);

  return (
    <section className="pavilionRecordBrief" aria-label="Record brief">
      <div className="pavilionRecordBrief__answer">
        <GameIcon icon="recordSlip" size={28} decorative />
        <div>
          <span className="pavilionRecordBrief__eyebrow">Quick Answer</span>
          <p><PavilionRichText text={brief.quickAnswer} /></p>
          {brief.currentUse ? <small><PavilionRichText text={brief.currentUse} /></small> : null}
        </div>
      </div>
      {brief.doNext.length > 0 ? (
        <div className="pavilionRecordBrief__lane pavilionRecordBrief__lane--actions">
          <span className="pavilionRecordBrief__laneLabel">Do Next</span>
          <div className="pavilionRecordBrief__chips">{brief.doNext.map((chip) => renderBriefAction(chip, props))}</div>
        </div>
      ) : null}
      {brief.watch.length > 0 ? (
        <div className="pavilionRecordBrief__lane">
          <span className="pavilionRecordBrief__laneLabel">Watch</span>
          <div className="pavilionRecordBrief__chips">{brief.watch.map(renderBriefInfo)}</div>
        </div>
      ) : null}
      {brief.warnings.length > 0 ? (
        <div className="pavilionRecordBrief__lane pavilionRecordBrief__lane--warnings">
          <span className="pavilionRecordBrief__laneLabel">Warnings</span>
          <div className="pavilionRecordBrief__chips">{brief.warnings.map(renderBriefInfo)}</div>
        </div>
      ) : null}
      {primaryRoutes.length > 0 ? (
        <div className="pavilionRecordBrief__routeLane" aria-label="Primary record routes">
          {primaryRoutes.map((button) => (
            <button
              key={button.id}
              type="button"
              disabled={!button.enabled}
              title={button.disabledReason}
              onClick={() => props.onRoute?.(button)}
            >
              <GameIcon icon="inkChevronUp" size={16} decorative />
              {button.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function renderRouteActionRail(selected: PavilionSurfaceV1['selectedEntry'], props: PavilionExactScreenProps) {
  if (selected.routeButtons.length === 0) return null;
  return (
    <div className="pavilionExact__routeButtons" aria-label="Record routes">
      <span className="pavilionExact__routeButtonsLabel">Routes</span>
      {selected.routeButtons.map((button) => (
        <button
          key={button.id}
          type="button"
          disabled={!button.enabled}
          title={button.disabledReason}
          onClick={() => props.onRoute?.(button)}
        >
          <GameIcon icon={button.enabled ? 'inkChevronUp' : 'inkLock'} size={15} decorative />
          {button.label}
        </button>
      ))}
    </div>
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

      <ModuleSourceSinkPanel
        projection={surface.mandateSourceSink}
        className="pavilionExact__mandateSourceSink"
        title="Source memory"
      />

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
              <span className={`pavilionExact__stateStamp pavilionExact__stateStamp--${selected.stateKind}`}>
                <span className={`pavilionExact__stateStampGlyph ${stateGlyphClass(selected.stateKind)}`} aria-hidden="true" />
                {selected.stateLabel}
              </span>
              {selected.tags.map((tag) => (
                <span key={tag.id} className={`pavilionExact__tag pavilionExact__tag--${tag.tone}`}>{tag.label}</span>
              ))}
            </div>
          </div>
        </header>
        <div className="pavilionExact__recordViewport" data-testid="pavilion-record-viewport">
          {renderRecordBrief(props)}
          <div className="pavilionGuidanceGrid">
            <div className="pavilionGuidanceGrid__main">
              {selected.guidanceGroups
                .filter((group) => group.column === 'main')
                .map((group) => renderGuidanceCard(group, props))}
            </div>
            <div className="pavilionGuidanceGrid__side">
              {selected.guidanceGroups
                .filter((group) => group.column === 'side')
                .map((group) => renderGuidanceCard(group, props))}
            </div>
          </div>
        </div>
        {renderRouteActionRail(selected, props)}
      </main>

      <aside className="pavilionExact__threads" data-testid="pavilion-threads-rail">
        {surface.elderNote ? (
          <section className="pavilionExact__elderNote" data-testid="pavilion-elder-note">
            <h2>
              <GameIcon icon="prayerBeads" size={22} decorative />
              {surface.elderNote.title}
            </h2>
            <p><PavilionRichText text={surface.elderNote.body} /></p>
            <ul>
              {surface.elderNote.checklist.map((item) => (
                <li key={item.id} className={`pavilionExact__elderCheck pavilionExact__elderCheck--${item.status}`}>
                  {renderStatusSeal(item.status)}
                  <span><PavilionRichText text={item.label} /></span>
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
