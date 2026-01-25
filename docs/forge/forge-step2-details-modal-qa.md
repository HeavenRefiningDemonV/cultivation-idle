# Forge Step 2C — Details Modal QA Checklist

Use this checklist to validate the Forge blueprint Details modal polish and accessibility changes.

## Entry
- Open the Forge workshop.
- Select a blueprint from the library.
- Click **Details** to open the modal.

## Scroll & Layout
- Scroll the modal body; top/bottom shadow gradients appear only when content overflows.
- Scroll to the top and bottom; shadows disappear when at the respective edge.
- Header remains stable with no layout jump when the scrollbar appears.

## Accessibility & Focus
- Press **Esc** to close the modal.
- Click the overlay outside the panel to close the modal.
- Use **Tab** to cycle within the modal controls (close button, ToC buttons, etc.).
- Focus returns to the Details button that opened the modal.
- Background scrolling is locked while the modal is open.

## Data Integrity
- Missing blueprint data shows the empty state without crashing.
- Requirements render correctly for currencies and items.
- Owned quantities (if available) continue to render normally in the workbench.
