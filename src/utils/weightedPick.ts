export interface WeightedEntry<T> {
  value: T;
  weight?: number;
}

export function weightedPick<T>(entries: WeightedEntry<T>[]): T | null {
  if (!entries || entries.length === 0) return null;
  const weights = entries.map((e) => (e.weight ?? 1) as number);
  const total = weights.reduce((sum, w) => sum + (Number.isFinite(w) ? w : 0), 0);

  if (total <= 0) {
    return entries[entries.length - 1]?.value ?? null;
  }

  let roll = Math.random() * total;
  for (let i = 0; i < entries.length; i += 1) {
    const w = Number.isFinite(weights[i]) ? (weights[i] as number) : 0;
    roll -= w;
    if (roll <= 0) {
      return entries[i].value;
    }
  }

  return entries[entries.length - 1]?.value ?? null;
}
