# Manual Detail Scroll Modal QA Checklist

Use this checklist when manually validating Manual Pavilion detail modal updates.

## Core behavior
- [ ] Clicking a manual spine opens the Manual Detail modal.
- [ ] Overlay click closes the modal.
- [ ] ESC closes the modal.
- [ ] Focus is trapped inside the modal while open and returns to the spine button on close.
- [ ] Background scroll is locked while the modal is open.

## Visual + layout
- [ ] Spines-only shelf view (no full covers), with tier/path/type icon cluster visible on each spine.
- [ ] Sticky header remains visible while the modal body scrolls.
- [ ] Scroll shadows appear only when content overflows.
- [ ] Close button is clearly visible and keyboard focusable.
- [ ] Mobile layout uses safe-area padding and near-fullscreen height.

## Content + edge cases
- [ ] Missing technique fields do not crash the modal (fallback labels show).
- [ ] Very long content scrolls smoothly and does not shift layout.
- [ ] Unknown tier/path/type uses generic icon/label fallback.

## Purchase flow
- [ ] Buy Manual / Buy & Study buttons enable/disable correctly.
- [ ] Purchase errors render in the Acquisition section.
- [ ] Duplicate conversion result shows upgrade CTA when available.
