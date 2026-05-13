# Pavilion Readability Overhaul Audit

Date: 2026-05-13

## Current Architecture

The Pavilion selected-record screen is rendered by `src/features/pavilion/PavilionExactScreen.tsx` from a `PavilionSurfaceV1` built in `src/features/pavilion/buildPavilionSurface.ts`.

The current central scroll structure is:

```tsx
<main className="pavilionExact__scroll">
  <header className="pavilionExact__recordHeader" />
  <div className="pavilionExact__sections">
    {selected.sections.map(renderSection)}
  </div>
  <div className="pavilionExact__routeButtons" />
</main>
```

`buildPavilionSurface.ts` adapts authored and generated `PavilionRecord` data into a flat `sections` array. `PavilionExactScreen.tsx` then renders all sections with the same card structure regardless of whether the content is a definition, action list, source ledger, warning, lore note, or related-record list.

## Clipping Risk

The clipping and overlap risk is concentrated in `src/features/pavilion/PavilionExactScreen.scss`:

- `.pavilionExact__sections` uses `height: calc(100% - 142px)` and `grid-template-columns: 1fr 1fr`, so every section competes inside an arbitrary two-column manuscript grid.
- `.pavilionExact__recordSection p` uses `max-width: 33ch`, `margin-left: 32px`, and `line-height: 1.32`, which makes long guidance copy tall while the neighboring grid cells keep competing for space.
- `.pavilionExact__routeButtons` is absolutely positioned at the bottom-right of the scroll page, so it can cover the last body rows instead of participating in the scroll layout.
- Section rows use `grid-template-columns: 32px minmax(0, 1fr) auto 18px` and `align-items: center`, which favors compact rows over wrapped source/use labels.
- The renderer has no `recordViewport` with clear scroll ownership; the central scroll has visual chrome, header, sections, and route buttons all competing inside one clipped container.

These are layout failures, not just color or copy failures. Any record with many authored fields, generated source rows, or long related labels can overflow the central reading body.

## Screenshot Failure: Earth Path

The reported screenshot shows the selected record `current_life_and_doctrine.earth_path` at a 2048x1151 capture. The authored content has useful guidance fields, but the flat two-column grid makes section headings, body paragraphs, rows, and route buttons visually collide. The player cannot quickly distinguish definition, current relevance, next action, source, fallback, requirements, mistakes, or relations.

Earth Path currently also contains generic guide filler in the manifest, for example “should answer a player question” and “turn 'Earth Path' from a name into a route.” That copy should become player-facing doctrine guidance once the renderer has semantic card roles.

## Regression Targets

The overhaul should keep the Pavilion shell identity while replacing the selected-record body with:

- a fixed record header,
- a `Record Brief` directly below the header,
- a scroll-owned `pavilionExact__recordViewport`,
- semantic guidance groups instead of arbitrary section columns,
- route actions in normal flow or a sticky non-overlapping rail,
- wrapping rows and body text with `line-height >= 1.45`.

Visual QA should select at least:

- `current_life_and_doctrine.earth_path`
- `gate_trials_and_thresholds.foundation_gate`
- `item.gate_foundation_pill`
- one generated technique record
- one sealed/future record

At 2048x1152, 1440x900, and 1280x720, the selected central record body must not overlap, clip, or place route actions on top of text.
