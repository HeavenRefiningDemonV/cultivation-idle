# Medicine Pouch Modal QA Checklist

## Entry + Close
- [ ] Open Apothecary screen and click the pouch icon.
- [ ] Modal opens and blocks background interaction.
- [ ] Overlay click closes the modal.
- [ ] ESC closes the pouch modal (and does not close the world building modal).
- [ ] Focus returns to the pouch icon after closing.

## Focus + Accessibility
- [ ] Tab cycles within the modal controls only (focus trap).
- [ ] Shift+Tab reverses within the modal.
- [ ] Close button is focusable and visible.

## Scroll + Layout
- [ ] Header remains visible while scrolling pouch content.
- [ ] Scroll shadows appear when content overflows.
- [ ] Only the modal body scrolls; background is locked.

## Visual Checks
- [ ] Modal looks like an apothecary pouch/scroll (subtle parchment/cloth feel).
- [ ] Stitched seam border is visible but subtle.
- [ ] Pouch icon button shows a badge and ready dot when applicable.
- [ ] Badge shows “9+” above 9 and hides when 0.

## Edge Cases
- [ ] Empty pouch shows the empty-state message.
- [ ] Missing item metadata does not crash the modal.
- [ ] Long lists remain usable and do not lag excessively.

## Reduced Motion
- [ ] Ready dot pulse stops under prefers-reduced-motion.
- [ ] Scroll shadow transitions are disabled under prefers-reduced-motion.
