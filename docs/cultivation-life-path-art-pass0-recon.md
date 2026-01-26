# Cultivation Life Path Art Pass 0 (Recon)

## Wizard + Life Path step locations
- Wizard modal component: `src/components/modals/LifeStartWizardModal.tsx` (exports `LifeStartWizardModal`).
- Life Path step is `wizardStep === 1` branch inside the same component, rendering the `wizardSection` with `Choose Your Life Path` heading and `wizardCardGrid` of `LIFE_PATHS`.

## Life Path selection state wiring
- Selected path value: `lifePath` from `useGameStore((state) => state.lifePath)`.
- Selection handler: `setLifePath` from `useGameStore((state) => state.setLifePath)`; invoked via `onClick={() => setLifePath(path.id)}` in the Life Path card button.
- Continue gating: `hasPath = Boolean(lifePath)`; Life Path step `Continue` button is `disabled={!hasPath}` and advances `setWizardStep(2)`.
- Other gating/validation: `canChangeLifePath()` determines if unselected cards are disabled; `shouldShow` controls modal visibility when `lifePath === null || selectedHeartLawId === null`.
- Side effects on selection: life path selection flows into wizard step selection through the `useEffect` that resets `wizardStep` based on `lifePath`/`selectedHeartLawId`.

### Life Path key values (do not rename)
- `heaven`
- `earth`
- `martial`

Defined in the `LIFE_PATHS` array within `LifeStartWizardModal.tsx` as `id` values.

## Stylesheets controlling this UI
- `src/components/modals/LifeStartWizardModal.scss`
  - Wizard shell: `.lifeStartWizardOverlay`, `.lifeStartWizardModal`, `.lifeStartWizardHeader`, `.lifeStartWizardSteps`, `.wizardStep`.
  - Life Path option cards/rows: `.wizardCardGrid`, `.wizardCard`, `.wizardCardTitle`, `.wizardCardDesc`, `.wizardCardMeta`, `.wizardCard.selected`, `.wizardCard.locked`.
  - Buttons inside Life Path step: `.button-primary` (global), `.wizardFooter` layout.
  - Grid container for Life Path options: `.wizardCardGrid` (Life Path uses the default grid, not `--heartLaws`).

## Asset filename verification (no renames yet)
Confirmed existing files in `src/assets/menus/`:
- `path_heaven 1.png`
- `path_earth 1.png`
- `path_martial 1.png`

Optional reference `Select Path.png` not found in this directory. If the codebase prefers no spaces, rename candidates for Part 1 are:
- `path_heaven.png`
- `path_earth.png`
- `path_martial.png`

## Do not break list
- Keep Life Path IDs exactly: `heaven`, `earth`, `martial`.
- Continue gating for Life Path must remain: disabled when `lifePath` is falsy.
- Modal visibility depends on `lifePath === null || selectedHeartLawId === null`; do not change the step progression logic in this pass.
