# Cultivation Life Path art pass (Part 0) — recon notes

## Wizard + Life Path step locations
- Wizard modal component: `src/components/modals/LifeStartWizardModal.tsx`.【F:src/components/modals/LifeStartWizardModal.tsx†L1-L312】
- Life Path step section: same file, `wizardStep === 1` block containing the Life Path cards and Continue gating.【F:src/components/modals/LifeStartWizardModal.tsx†L121-L187】

## Life Path selection state + handlers
- Selected path value: `lifePath` from `useGameStore((state) => state.lifePath)`.【F:src/components/modals/LifeStartWizardModal.tsx†L31-L35】
- Setter handler: `setLifePath` from `useGameStore((state) => state.setLifePath)`; invoked via `onClick={() => setLifePath(path.id)}` on each card.【F:src/components/modals/LifeStartWizardModal.tsx†L31-L35】【F:src/components/modals/LifeStartWizardModal.tsx†L153-L170】
- Continue gating: `hasPath = Boolean(lifePath)` and the Continue button is `disabled={!hasPath}` in step 1.【F:src/components/modals/LifeStartWizardModal.tsx†L101-L102】【F:src/components/modals/LifeStartWizardModal.tsx†L173-L186】
- Side effects on selection: step progression is driven by `useEffect` that advances `wizardStep` when `lifePath` or `selectedHeartLawId` change; no other side effects in Life Path selection itself.【F:src/components/modals/LifeStartWizardModal.tsx†L47-L63】

## Life Path key values (do not change)
Defined in `LIFE_PATHS`:
- `heaven`
- `earth`
- `martial`
【F:src/components/modals/LifeStartWizardModal.tsx†L12-L16】

## Stylesheets controlling the wizard + Life Path UI
- Wizard/modal shell + all step styling (including Life Path cards and grid): `src/components/modals/LifeStartWizardModal.scss` (`.lifeStartWizardModal`, `.wizardSection`, `.wizardCardGrid`, `.wizardCard`, etc.).【F:src/components/modals/LifeStartWizardModal.scss†L1-L167】

## Asset existence check (menus)
Checked `src/assets/menus` — only `bar_long.png`, `bar_short.png`, `block_fancy.png`, `buttoncorners.png`, `scroll.png` are present. The stated Life Path art files are **not** in the repo yet:
- `path_heaven 1.png` (missing)
- `path_earth 1.png` (missing)
- `path_martial 1.png` (missing)
- `Select Path.png` (missing)

## Do-not-break invariants
- Life Path keys must remain `heaven`, `earth`, `martial`.【F:src/components/modals/LifeStartWizardModal.tsx†L12-L16】
- Continue button gating depends on `hasPath` (must not bypass selection).【F:src/components/modals/LifeStartWizardModal.tsx†L101-L102】【F:src/components/modals/LifeStartWizardModal.tsx†L173-L186】
- Wizard step progression depends on `lifePath` / `selectedHeartLawId` in the `useEffect`; do not alter step logic. 【F:src/components/modals/LifeStartWizardModal.tsx†L47-L63】
