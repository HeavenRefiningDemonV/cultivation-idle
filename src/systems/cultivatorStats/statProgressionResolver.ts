export interface StatProgressionPreview {
  ratingGain: number;
  cap: number | null;
  debug: { mode: 'stub_no_gameplay_effect' };
}

export function resolveStatProgressionPreview(): StatProgressionPreview {
  return {
    ratingGain: 0,
    cap: null,
    debug: { mode: 'stub_no_gameplay_effect' },
  };
}
