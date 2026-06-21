/**
 * F3-ELEM — the single element resolver (D3 · Elements & Affinity). The one place element math is
 * computed and the one element-id vocabulary (RK-15). Pure, store-free, save-free, render-free: ships
 * logic + a frozen catalog + a `[tune]`-injected tuning shape; it has NO consumers until Movements
 * IV (techniques) and V (combat). Everything here is pure systems data/types — no UI types to drag
 * into the systems/progression tsc project, so a flat `export *` barrel is safe (cf. meridians/index.ts).
 */
export * from './elementTypes.js';
export * from './elementCatalog.js';
export * from './reactionCatalog.js';
export * from './elementTuning.js';
export * from './elementResolver.js';
