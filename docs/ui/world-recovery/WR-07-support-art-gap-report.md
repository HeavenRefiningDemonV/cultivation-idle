# WR-07 — World support-art gap report (screenshot-gated)

## Scope
This report records WR-07 outcomes after auditing live World support roles against:
- `src/assets/ui/chrome/world_labels/README.md`
- `src/assets/ui/chrome/world_labels/index.ts`
- generated asset candidates under `src/assets/Generated assets/`
- live World implementation surfaces (`WorldScreen`, `CityMapHub`, `CityArrivalBanner`, `WorldRouteChip`)

## Roles resolved in WR-07 (no request needed)
1. **current-city identity plate**  
   - Integrated `ui_plate_city_current_world_default_l.png` into the top-ribbon current-city strip.  
   - Why sufficient: improves current-city anchoring without adding a new page owner.
2. **city-arrival banner treatment**  
   - Integrated `ui_banner_city_arrival_world_default_l.png` into the city-arrival card background.
   - Why sufficient: improves arrival emphasis while preserving existing text hierarchy and quick-open truth.
3. **route-hint/recommendation accent**  
   - Integrated `ui_hint_route_world_default_s.png` for non-neutral world route chips.
   - Why sufficient: keeps chip language consistent with existing world support cues and remains subordinate to map + card content.

## Screenshot-backed missing roles (still unresolved)
> No production art request is opened in WR-07 because CI cannot capture runtime screenshots in this environment.
> These rows remain **gated** until screenshot evidence is attached in QA.

### 1) District / area label role
- **Why unresolved:** current world readability is better without district labels; adding them now risks cluttering building ownership.
- **Why current assets are insufficient today:** the existing district plaque candidate has no proven placement that preserves diegetic clarity in default + selected + recommendation states.
- **Screenshot proof required:** default world and selected-building world with/without district overlay treatment.
- **Future request type (if proven):** world-specific support art refinement or placement variant, not map repaint.

### 2) Selected-building underplate/glint blend
- **Why unresolved:** selected state is already clear via active scenic label + glint; plate layering might become redundant.
- **Why current assets are insufficient today:** no screenshot evidence yet that selected clarity fails in High/Low/Reduced motion across narrow layout.
- **Screenshot proof required:** selected-building state across quality modes and narrow layout.
- **Future request type (if proven):** world-specific selected underplate variant or minor shared support chrome tuning.

### 3) Inspector title/context plaque
- **Why unresolved:** inspector currently reads cleanly and subordinate; additional plaque could over-frame the panel.
- **Why current assets are insufficient today:** shared inspector/titleplate assets are available, but no screenshot-backed readability deficit exists.
- **Screenshot proof required:** side-by-side with and without title plaque in wide + narrow inspector.
- **Future request type (if proven):** shared support chrome (not world repaint).

## Explicit defers to WR-08+
- Fog/atmosphere tuning beyond current `WorldFxScene` baseline is deferred to WR-08.
- Selected-building glint tuning beyond current code-owned behavior is deferred to WR-08 unless screenshot evidence forces an earlier fix.
