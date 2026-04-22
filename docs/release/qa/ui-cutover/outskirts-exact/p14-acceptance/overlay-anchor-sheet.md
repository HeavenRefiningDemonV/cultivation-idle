# Outskirts P14 Overlay Anchor Sheet

Use this anchor sheet when manually overlaying final captures against `ChatGPT Image Apr 17, 2026, 04_24_04 PM.png`.

## Fixed anchors

1. **Top-left page title bounding box / baseline**
   - Anchor: `outskirts-exact-title`
   - Verify `Outskirts` headline baseline, cap height, and left inset.

2. **Top macro ribbon start/end and highlighted node position**
   - Anchor: `outskirts-macro-ribbon`
   - Verify full ribbon span, track endpoints, and highlighted node alignment.

3. **Tactical strip outer bounds and seven-cell rhythm**
   - Anchor: `outskirts-tactical-strip`
   - Verify exactly seven tactical cells with stable equal rhythm.

4. **Centered plaque horizontal center and vertical placement**
   - Anchor: `outskirts-area-plaque`
   - Verify plaque is centered over scenic field and vertically above subtitle.

5. **Subtitle baseline and spacing beneath plaque**
   - Anchor: `outskirts-area-subtitle`
   - Verify subtitle baseline and fixed vertical gap below plaque.

6. **Scenic field outer bounds**
   - Anchor: `outskirts-scenic-stage`
   - Verify scenic panel remains dominant center mass and not clipped.

7. **Encounter identity row bounds and Safe chip position**
   - Anchor: `outskirts-encounter-identity`
   - Verify encounter label baseline, level label, and safety chip dock.

8. **Left-card outer bounds and section ladder**
   - Anchor: `outskirts-setup-card`
   - Verify card frame height and section flow (setup rows → offense/defense → pouch/equipment).

9. **Right-card outer bounds and section ladder**
   - Anchor: `outskirts-rewards-card`
   - Verify section flow (gold → materials → tracked bounty → efficiency → auto-repeat) and CTA-free content.

10. **Encounter progression strip lane bounds and current medallion center**
    - Anchor: `outskirts-encounter-strip`
    - Verify completed/current/future readability and selected medallion centering.

11. **Start Hunt CTA outer bounds and page-center alignment**
    - Anchor: `outskirts-start-hunt-cta`
    - Verify single dominant CTA remains centered below strip.

12. **Grind Summary dock outer bounds and `This Area` chip alignment**
    - Anchor: `outskirts-grind-summary`
    - Verify lower-right dock position and scope-chip alignment.

## Purity check overlay pass/fail gates
- No HP bars in planning state.
- No combat log, combat options, utility tray, RunCompass, or top-lane combat shell ownership.
- Same-source active reopen still routes to active-contained branch (not planning owner).
