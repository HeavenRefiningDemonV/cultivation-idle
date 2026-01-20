# Modal Hardening QA

## Summary
- Added a hardened modal primitive that locks body scrolling, restores focus on close, handles ESC through React, and prevents overlay click-through.
- Migrated the world building modal to the hardened modal behavior.

## Manual Test Steps
1. Open any world building modal (e.g., click into the forge or alchemy building).
2. Verify the page behind the modal no longer scrolls while the modal is open.
3. Click inside form controls or buttons in the modal and ensure the modal does not close.
4. Click directly on the overlay/backdrop (outside the modal panel) and verify the modal closes.
5. Open the modal again, focus an input inside it, and press `Escape`; confirm the modal closes.
6. After closing the modal, confirm focus returns to the previously focused element (e.g., the button used to open the modal).
