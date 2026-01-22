# Prestige Ritual Modal QA

## Scope
Validate the reincarnation ritual modal behavior, hold-to-confirm interaction, and accessibility.

## Scenarios
1. **Open ritual modal**
   - Click “Begin Reincarnation Ritual” on the altar.
   - Expected: Modal opens, background scroll locks, focus moves into modal, and ESC closes.
2. **Hold-to-confirm**
   - Hold the confirm button for the full duration.
   - Expected: Progress fill completes, ritual triggers, and modal closes with a brief “Ritual begins…” status.
   - Releasing early resets progress and does not trigger reincarnation.
3. **Locked state**
   - When reincarnation is sealed, the hold button is disabled and a reason is shown.
4. **AP breakdown section**
   - Breakdown rows and potential gain match the in-game calculation.
5. **Focus return**
   - Closing the modal returns focus to the altar button used to open it.

## Notes
- Confirm the modal remains stable if AP values or eligibility change while it is open.
- Verify the modal is scrollable on smaller viewports and no content is cut off.
