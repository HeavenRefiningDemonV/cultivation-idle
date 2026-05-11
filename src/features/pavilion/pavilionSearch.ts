import type { PavilionRecord, PavilionRecordState } from './pavilionTypes.js';

export interface PavilionSearchResult extends PavilionRecord {
  score: number;
}

export interface PavilionSearchArgs {
  records: readonly PavilionRecord[];
  query: string;
  filters: readonly string[];
  recommendedEntryIds?: readonly string[];
}

export interface PavilionSearchOutput {
  results: PavilionSearchResult[];
}

const STATE_FILTERS: Record<string, PavilionRecordState> = {
  Recorded: 'recorded',
  Studied: 'studied',
  Mastered: 'mastered',
  Sealed: 'sealed',
  Rumored: 'rumored',
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesFilter(record: PavilionRecord, filter: string): boolean {
  const state = STATE_FILTERS[filter];
  if (state) return record.state === state;
  const haystack = record.searchText;
  if (filter === 'Needed Now') return record.signals?.includes('recommendedNow') ?? false;
  if (filter === 'Needed Soon') return haystack.includes('needed soon') || haystack.includes('prepare');
  if (filter === 'Path: Heaven') return haystack.includes('path heaven') || haystack.includes('heaven');
  if (filter === 'Path: Earth') return haystack.includes('path earth') || haystack.includes('earth');
  if (filter === 'Path: Martial') return haystack.includes('path martial') || haystack.includes('martial');
  if (filter === 'City') return record.categoryId === 'cities' || haystack.includes('city');
  if (filter === 'Source') return haystack.includes('source') || haystack.includes('best source');
  if (filter === 'Used For') return haystack.includes('used for') || haystack.includes('used');
  if (filter === 'Rarity') return haystack.includes('rarity') || haystack.includes('rare') || haystack.includes('legendary');
  if (filter === 'Activity') return haystack.includes('activity') || record.categoryId === 'activities';
  if (filter === 'Missing') return record.debug.unresolvedRelations.length > 0 || haystack.includes('missing');
  if (filter === 'Safe to Sell') return haystack.includes('safe to sell');
  if (filter === 'Do Not Sell') return haystack.includes('do not sell');
  return true;
}

function scoreRecord(record: PavilionRecord, query: string, recommendedEntryIds: readonly string[]): number {
  let score = 0;
  const normalizedQuery = normalize(query);
  const normalizedTitle = normalize(record.title);
  const haystack = record.searchText;

  if (recommendedEntryIds.includes(record.id) || record.signals?.includes('recommendedNow')) score += 1000;
  if (!normalizedQuery) return score;
  if (normalizedTitle === normalizedQuery) score += 900;
  if (normalizedTitle.startsWith(normalizedQuery)) score += 700;
  if (record.categoryLabel.toLowerCase().includes(normalizedQuery)) score += 420;
  if (record.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))) score += 380;
  if (haystack.includes(normalizedQuery)) score += 120;
  if (record.state === 'sealed') score -= 30;
  return score;
}

export function searchPavilionRecords(args: PavilionSearchArgs): PavilionSearchOutput {
  const query = normalize(args.query);
  const filtered = args.records
    .filter((record) => (query ? record.searchText.includes(query) || record.title.toLowerCase().includes(query) : true))
    .filter((record) => args.filters.every((filter) => matchesFilter(record, filter)));

  const results = filtered
    .map((record) => ({ ...record, score: scoreRecord(record, args.query, args.recommendedEntryIds ?? []) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.state === 'sealed' && b.state !== 'sealed') return 1;
      if (b.state === 'sealed' && a.state !== 'sealed') return -1;
      return a.title.localeCompare(b.title);
    });

  return { results };
}

