export function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

export function randFloat(seed: number): { value: number; seed: number } {
  const next = nextSeed(seed);
  return { value: next / 0x100000000, seed: next };
}
