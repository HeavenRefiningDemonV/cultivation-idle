export function nextSeed(seed) {
    return (seed * 1664525 + 1013904223) >>> 0;
}
export function randFloat(seed) {
    const next = nextSeed(seed);
    return { value: next / 0x100000000, seed: next };
}
