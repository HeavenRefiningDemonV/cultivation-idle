# Prestige Upgrade Modal QA

## Scope
Validate the Prestige Upgrade modal remains open when a selected upgrade becomes unavailable and that it surfaces a clear error state.

## Scenarios
1. **Upgrade removed while modal is open**
   - Expected: Modal stays open, shows an error message indicating the decree is unavailable, and purchase is disabled.
2. **Upgrade still present**
   - Expected: Modal shows normal data (overview, effects, requirements, purchase) and behaves unchanged.
3. **Attempting purchase on missing upgrade**
   - Expected: Purchase does not proceed and error message remains visible.

## Validation steps
1. Open the Prestige screen and select any decree to open the modal.
2. Simulate the upgrade being removed (e.g., temporarily remove the upgrade from content packs or hot-reload with it removed).
3. Confirm the modal remains open and shows "This decree is no longer available." in the Requirements/Purchase sections.
4. Verify the purchase button is disabled and clicking it (if enabled by mistake) does not proceed.
5. Close the modal normally and ensure no crash or unexpected state persists.

## Notes
- The modal should **not** auto-close when the upgrade is missing.
- This test is purely UI behavior; no rewards or state changes should occur.
