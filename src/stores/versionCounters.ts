export const bumpVersion = (value: number | undefined): number => {
  const current = Number.isFinite(value) ? value ?? 0 : 0;
  const next = current + 1;
  return next >= Number.MAX_SAFE_INTEGER ? 1 : next;
};
